-- Row Level Security: members only see their organization; writes depend on role.

create function public.is_member(target_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

create function public.has_role(target_org uuid, allowed public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org and m.user_id = auth.uid() and m.role = any (allowed)
  );
$$;

create function public.is_member_of(target_org uuid, target_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org and m.user_id = target_user
  );
$$;

create function public.session_is_open(target_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.count_sessions s
    where s.id = target_session and s.status <> 'closed'
  );
$$;

-- A counter may count a product when its supplier is assigned to one of their teams.
create function public.can_count(target_product uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.session_products p
    join public.count_sessions s on s.id = p.session_id and s.status = 'counting'
    where p.id = target_product
      and (
        public.has_role(p.org_id, array['admin', 'supervisor']::public.member_role[])
        or exists (
          select 1
          from public.team_suppliers ts
          join public.team_members tm on tm.team_id = ts.team_id
          where ts.session_id = p.session_id
            and ts.supplier_id = p.supplier_id
            and tm.user_id = auth.uid()
        )
      )
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.warehouses enable row level security;
alter table public.suppliers enable row level security;
alter table public.count_sessions enable row level security;
alter table public.session_products enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_suppliers enable row level security;
alter table public.counts enable row level security;

-- organizations
create policy "members read their organization" on public.organizations
  for select to authenticated using (public.is_member(id) or created_by = auth.uid());
create policy "users create organizations they own" on public.organizations
  for insert to authenticated with check (created_by = auth.uid());
create policy "admins rename the organization" on public.organizations
  for update to authenticated using (public.has_role(id, array['admin']::public.member_role[]));

-- profiles
create policy "read own and teammates profiles" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships mine
      join public.memberships theirs on theirs.org_id = mine.org_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- memberships
create policy "members read memberships" on public.memberships
  for select to authenticated using (public.is_member(org_id));
create policy "admins manage memberships" on public.memberships
  for all to authenticated
  using (public.has_role(org_id, array['admin']::public.member_role[]))
  with check (public.has_role(org_id, array['admin']::public.member_role[]));

-- reference data
create policy "members read warehouses" on public.warehouses
  for select to authenticated using (public.is_member(org_id));
create policy "admins manage warehouses" on public.warehouses
  for all to authenticated
  using (public.has_role(org_id, array['admin']::public.member_role[]))
  with check (public.has_role(org_id, array['admin']::public.member_role[]));

create policy "members read suppliers" on public.suppliers
  for select to authenticated using (public.is_member(org_id));
create policy "admins manage suppliers" on public.suppliers
  for all to authenticated
  using (public.has_role(org_id, array['admin']::public.member_role[]))
  with check (public.has_role(org_id, array['admin']::public.member_role[]));

-- sessions
create policy "members read sessions" on public.count_sessions
  for select to authenticated using (public.is_member(org_id));
create policy "admins create sessions" on public.count_sessions
  for insert to authenticated with check (public.has_role(org_id, array['admin']::public.member_role[]));
create policy "admins update sessions" on public.count_sessions
  for update to authenticated using (public.has_role(org_id, array['admin']::public.member_role[]));
create policy "admins delete draft sessions" on public.count_sessions
  for delete to authenticated using (
    status = 'draft' and public.has_role(org_id, array['admin']::public.member_role[])
  );

-- session products
create policy "members read products" on public.session_products
  for select to authenticated using (public.is_member(org_id));
create policy "admins import products" on public.session_products
  for insert to authenticated with check (
    public.has_role(org_id, array['admin']::public.member_role[]) and public.session_is_open(session_id)
  );
create policy "supervisors flag recounts" on public.session_products
  for update to authenticated using (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  );

-- teams
create policy "members read teams" on public.teams
  for select to authenticated using (public.is_member(org_id));
create policy "supervisors manage teams" on public.teams
  for all to authenticated
  using (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  )
  with check (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  );

create policy "members read team members" on public.team_members
  for select to authenticated using (public.is_member(org_id));
create policy "supervisors manage team members" on public.team_members
  for all to authenticated
  using (public.has_role(org_id, array['admin', 'supervisor']::public.member_role[]))
  with check (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.is_member_of(org_id, user_id)
  );

create policy "members read team suppliers" on public.team_suppliers
  for select to authenticated using (public.is_member(org_id));
create policy "supervisors assign suppliers" on public.team_suppliers
  for all to authenticated
  using (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  )
  with check (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  );

-- counts: the mobile app inserts, supervisors correct.
create policy "members read counts" on public.counts
  for select to authenticated using (public.is_member(org_id));
create policy "assigned counters insert counts" on public.counts
  for insert to authenticated with check (
    counted_by = auth.uid() and public.can_count(product_id)
  );
create policy "supervisors delete counts" on public.counts
  for delete to authenticated using (
    public.has_role(org_id, array['admin', 'supervisor']::public.member_role[])
    and public.session_is_open(session_id)
  );
