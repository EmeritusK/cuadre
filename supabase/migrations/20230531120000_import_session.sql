-- Atomic import of a stock file into a new draft session.
-- Rows are validated in the app; this function guarantees all-or-nothing writes.

create function public.import_session(
  target_org uuid,
  session_name text,
  filename text,
  rows jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  new_session_id uuid;
  warehouse_name text;
  warehouse_id uuid;
begin
  if not public.has_role(target_org, array['admin']::public.member_role[]) then
    raise exception 'Solo un administrador puede importar inventario' using errcode = '42501';
  end if;

  if jsonb_typeof(rows) <> 'array' or jsonb_array_length(rows) = 0 then
    raise exception 'El archivo no tiene productos';
  end if;

  -- Most frequent warehouse in the file names the session's warehouse.
  select r ->> 'warehouse' into warehouse_name
  from jsonb_array_elements(rows) r
  group by r ->> 'warehouse'
  order by count(*) desc
  limit 1;

  if warehouse_name is not null then
    insert into public.warehouses (org_id, name) values (target_org, warehouse_name)
    on conflict (org_id, name) do update set name = excluded.name
    returning id into warehouse_id;
  end if;

  insert into public.suppliers (org_id, name)
  select distinct target_org, r ->> 'supplier'
  from jsonb_array_elements(rows) r
  on conflict (org_id, name) do nothing;

  insert into public.count_sessions (org_id, name, warehouse_id, source_filename)
  values (target_org, session_name, warehouse_id, filename)
  returning id into new_session_id;

  insert into public.session_products
    (session_id, org_id, supplier_id, sku, description, system_qty, unit_cost, units_per_box)
  select
    new_session_id,
    target_org,
    s.id,
    r ->> 'sku',
    r ->> 'description',
    (r ->> 'systemQty')::numeric,
    (r ->> 'unitCost')::numeric,
    (r ->> 'unitsPerBox')::integer
  from jsonb_array_elements(rows) r
  join public.suppliers s on s.org_id = target_org and s.name = r ->> 'supplier';

  return new_session_id;
end;
$$;

grant execute on function public.import_session(uuid, text, text, jsonb) to authenticated;
