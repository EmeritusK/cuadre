-- Reconciliation views. security_invoker keeps the caller's RLS in force.

create view public.session_product_status
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
  end as status
from public.session_products p
join public.suppliers s on s.id = p.supplier_id
left join public.team_suppliers ts on ts.session_id = p.session_id and ts.supplier_id = p.supplier_id
left join lateral (
  select sum(k.total) as counted_qty, count(*) as count_events, max(k.created_at) as last_counted_at
  from public.counts k
  where k.product_id = p.id
) c on true;

create view public.supplier_progress
with (security_invoker = true) as
select
  session_id,
  supplier_id,
  supplier_name,
  team_id,
  count(*) as products,
  count(*) filter (where status <> 'pendiente') as counted_products,
  count(*) filter (where status = 'faltante') as short_products,
  count(*) filter (where status = 'sobrante') as over_products,
  coalesce(sum(difference_value) filter (where status <> 'pendiente'), 0) as difference_value,
  coalesce(sum(abs(difference_value)) filter (where status <> 'pendiente'), 0) as exposure_value,
  max(last_counted_at) as last_counted_at
from public.session_product_status
group by session_id, supplier_id, supplier_name, team_id;

create view public.session_summary
with (security_invoker = true) as
select
  s.id as session_id,
  s.org_id,
  count(p.id) as products,
  count(p.id) filter (where p.status <> 'pendiente') as counted_products,
  count(p.id) filter (where p.status = 'cuadrado') as matched_products,
  count(p.id) filter (where p.status = 'faltante') as short_products,
  count(p.id) filter (where p.status = 'sobrante') as over_products,
  coalesce(sum(p.difference_value) filter (where p.status <> 'pendiente'), 0) as difference_value,
  coalesce(sum(p.system_qty * p.unit_cost), 0) as system_value
from public.count_sessions s
left join public.session_product_status p on p.session_id = s.id
group by s.id, s.org_id;

-- Counts per hour, for the activity sparkline.
create view public.session_hourly_counts
with (security_invoker = true) as
select session_id, date_trunc('hour', created_at) as hour, count(*) as events
from public.counts
group by session_id, date_trunc('hour', created_at);

-- Live updates for the dashboard; RLS still filters what each subscriber receives.
alter publication supabase_realtime add table public.counts;
alter publication supabase_realtime add table public.session_products;
alter publication supabase_realtime add table public.team_suppliers;
