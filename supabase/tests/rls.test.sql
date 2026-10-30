-- Row Level Security and business rules, run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures: two organizations, an admin in each and a counter in the first.
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'admin-a@test.ec'),
  ('a0000000-0000-4000-8000-000000000002', 'counter-a@test.ec'),
  ('b0000000-0000-4000-8000-000000000001', 'admin-b@test.ec');

insert into public.organizations (id, name, created_by) values
  ('a1000000-0000-4000-8000-000000000001', 'Empresa A', 'a0000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000001', 'Empresa B', 'b0000000-0000-4000-8000-000000000001');
insert into public.memberships (org_id, user_id, role) values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'counter');

insert into public.suppliers (id, org_id, name) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Proveedor 1'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Proveedor 2');
insert into public.count_sessions (id, org_id, name, code) values
  ('a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Toma A', 0);
insert into public.session_products (id, session_id, org_id, supplier_id, sku, description, system_qty, unit_cost, units_per_box) values
  ('a4000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '111', 'Producto en equipo', 100, 2, 12),
  ('a4000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000002', '222', 'Producto ajeno', 50, 1, 6);
insert into public.teams (id, session_id, org_id, name, code) values
  ('a5000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Pasillo A', 0);
insert into public.team_members (team_id, user_id, org_id) values
  ('a5000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001');
insert into public.team_suppliers (team_id, supplier_id, session_id, org_id) values
  ('a5000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001');

select is(
  (select code from public.count_sessions where id = 'a3000000-0000-4000-8000-000000000001'),
  1,
  'sessions get sequential codes per organization'
);

-- Act as the admin of another organization.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is_empty('select id from public.session_products', 'other tenants see no products');
select is_empty('select id from public.count_sessions', 'other tenants see no sessions');
select throws_ok(
  $$ select public.import_session('a1000000-0000-4000-8000-000000000001', 'Intrusa', 'x.csv', '[{"sku":"1"}]') $$,
  '42501',
  null,
  'only admins of the organization can import'
);

-- Act as the counter of organization A.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.counts (product_id, boxes, counted_by) values ('a4000000-0000-4000-8000-000000000001', 1, 'a0000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'counters cannot count while the session is a draft'
);

reset role;
update public.count_sessions set status = 'counting' where id = 'a3000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.counts (product_id, pallets, layers, boxes, units, counted_by) values ('a4000000-0000-4000-8000-000000000001', 2, 2, 2, 4, 'a0000000-0000-4000-8000-000000000002') $$,
  'counters count products of their team suppliers'
);
select is(
  (select total from public.counts where product_id = 'a4000000-0000-4000-8000-000000000001'),
  100.000,
  'total = pallets x layers x boxes x units per box + units'
);
select is(
  (select status from public.session_product_status where id = 'a4000000-0000-4000-8000-000000000001'),
  'cuadrado',
  'a product whose count matches the system is cuadrado'
);
select throws_ok(
  $$ insert into public.counts (product_id, boxes, counted_by) values ('a4000000-0000-4000-8000-000000000002', 1, 'a0000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'counters cannot count suppliers of other teams'
);

reset role;
update public.count_sessions set status = 'closed' where id = 'a3000000-0000-4000-8000-000000000001';
select throws_ok(
  $$ update public.count_sessions set status = 'counting' where id = 'a3000000-0000-4000-8000-000000000001' $$,
  'P0001',
  'Una toma cerrada no se puede reabrir',
  'closed sessions cannot be reopened'
);
select throws_ok(
  $$ delete from public.memberships where user_id = 'a0000000-0000-4000-8000-000000000001' $$,
  'P0001',
  'La empresa necesita al menos un administrador',
  'the last admin cannot be removed'
);

select * from finish();
rollback;
