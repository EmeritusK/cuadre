-- Sort products by the size of their dollar difference and search them quickly.

create or replace view public.session_product_status
with (security_invoker = true) as
select
  p.id,
  p.session_id,
  p.org_id,
  p.supplier_id,
  s.name as supplier_name,
  ts.team_id,
  p.sku,
  p.description,
  p.system_qty,
  p.unit_cost,
  p.units_per_box,
  p.recount_requested,
  coalesce(c.counted_qty, 0) as counted_qty,
  coalesce(c.count_events, 0) as count_events,
  c.last_counted_at,
  coalesce(c.counted_qty, 0) - p.system_qty as difference,
  round((coalesce(c.counted_qty, 0) - p.system_qty) * p.unit_cost, 2) as difference_value,
  case
    when coalesce(c.count_events, 0) = 0 then 'pendiente'
    when c.counted_qty = p.system_qty then 'cuadrado'
    when c.counted_qty < p.system_qty then 'faltante'
    else 'sobrante'
  end as status,
  case
    when coalesce(c.count_events, 0) = 0 then 0
    else abs(round((c.counted_qty - p.system_qty) * p.unit_cost, 2))
  end as exposure_value
from public.session_products p
join public.suppliers s on s.id = p.supplier_id
left join public.team_suppliers ts on ts.session_id = p.session_id and ts.supplier_id = p.supplier_id
left join lateral (
  select sum(k.total) as counted_qty, count(*) as count_events, max(k.created_at) as last_counted_at
  from public.counts k
  where k.product_id = p.id
) c on true;

create extension if not exists pg_trgm with schema extensions;

-- Speeds up ilike '%term%' on descriptions; codes are covered by unique (session_id, sku).
create index session_products_description_trgm_idx on public.session_products
  using gin (description extensions.gin_trgm_ops);
