-- Core multi-tenant schema for physical stock counts.
-- Every row carries org_id so Row Level Security can scope it to members.

create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('admin', 'supervisor', 'counter');
create type public.session_status as enum ('draft', 'counting', 'closed');
create type public.product_condition as enum ('bueno', 'averiado', 'vencido');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'counter',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  unique (org_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  unique (org_id, name)
);

-- A count session ("toma") is a snapshot of the accounting stock at import time.
create table public.count_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  code integer not null,
  name text not null check (char_length(trim(name)) between 2 and 80),
  warehouse_id uuid references public.warehouses (id) on delete set null,
  status public.session_status not null default 'draft',
  source_filename text,
  started_at timestamptz,
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (org_id, code)
);

create table public.session_products (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.count_sessions (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id),
  sku text not null check (char_length(sku) between 1 and 64),
  description text not null,
  system_qty numeric(14, 3) not null,
  unit_cost numeric(14, 5) not null check (unit_cost >= 0),
  units_per_box integer not null default 1 check (units_per_box > 0),
  recount_requested boolean not null default false,
  unique (session_id, sku)
);

create index session_products_supplier_idx on public.session_products (session_id, supplier_id);

-- Teams ("grupos") are formed per session; each supplier belongs to at most one team.
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.count_sessions (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  code integer not null,
  name text not null check (char_length(trim(name)) between 1 and 40),
  unique (session_id, code)
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  primary key (team_id, user_id)
);

create table public.team_suppliers (
  team_id uuid not null references public.teams (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  session_id uuid not null references public.count_sessions (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  primary key (team_id, supplier_id),
  unique (session_id, supplier_id)
);

-- One row per count event coming from the floor. Several events for a product add up.
create table public.counts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  session_id uuid not null references public.count_sessions (id) on delete cascade,
  product_id uuid not null references public.session_products (id) on delete cascade,
  pallets integer not null default 1 check (pallets >= 0),
  layers integer not null default 1 check (layers >= 0),
  boxes integer not null default 0 check (boxes >= 0),
  units integer not null default 0 check (units >= 0),
  units_per_box integer not null check (units_per_box > 0),
  total numeric(14, 3) generated always as (
    pallets::numeric * layers * boxes * units_per_box + units
  ) stored,
  expires_on date,
  condition public.product_condition not null default 'bueno',
  counted_by uuid references auth.users (id) on delete set null default auth.uid(),
  device text,
  created_at timestamptz not null default now()
);

create index counts_product_idx on public.counts (product_id);
create index counts_session_created_idx on public.counts (session_id, created_at desc);

-- Sequential, human-readable codes per organization (TOMA-0007) and per session (EQ-03).
create function public.assign_session_code() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('count_sessions:' || new.org_id::text));
  select coalesce(max(code), 0) + 1 into new.code
  from public.count_sessions where org_id = new.org_id;
  return new;
end;
$$;

create trigger count_sessions_code
before insert on public.count_sessions
for each row execute function public.assign_session_code();

create function public.assign_team_code() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('teams:' || new.session_id::text));
  select coalesce(max(code), 0) + 1 into new.code
  from public.teams where session_id = new.session_id;
  return new;
end;
$$;

create trigger teams_code
before insert on public.teams
for each row execute function public.assign_team_code();

-- Counts copy units per box from the product so the stored total never drifts.
create function public.fill_count_defaults() returns trigger
language plpgsql as $$
declare
  product record;
begin
  select p.session_id, p.org_id, p.units_per_box into product
  from public.session_products p where p.id = new.product_id;

  if not found then
    raise exception 'Producto % no existe', new.product_id;
  end if;

  new.session_id := product.session_id;
  new.org_id := product.org_id;
  new.units_per_box := product.units_per_box;
  return new;
end;
$$;

create trigger counts_defaults
before insert on public.counts
for each row execute function public.fill_count_defaults();

-- Session lifecycle timestamps.
create function public.track_session_status() returns trigger
language plpgsql as $$
begin
  if new.status = 'counting' and old.status = 'draft' then
    new.started_at := coalesce(new.started_at, now());
  elsif new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := now();
  elsif old.status = 'closed' and new.status <> 'closed' then
    raise exception 'Una toma cerrada no se puede reabrir';
  end if;
  return new;
end;
$$;

create trigger count_sessions_status
before update of status on public.count_sessions
for each row execute function public.track_session_status();

-- Profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- The creator of an organization becomes its first admin.
create function public.handle_new_organization() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.memberships (org_id, user_id, role)
    values (new.id, new.created_by, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_organization_created
after insert on public.organizations
for each row execute function public.handle_new_organization();
