-- Admins invite people by email; the invitation becomes a membership the
-- first time someone signs in with that address.

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(trim(email)) and email like '%_@_%'),
  role public.member_role not null default 'counter',
  invited_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

alter table public.invitations enable row level security;

create policy "admins read invitations" on public.invitations
  for select to authenticated using (public.has_role(org_id, array['admin']::public.member_role[]));
create policy "admins create invitations" on public.invitations
  for insert to authenticated with check (public.has_role(org_id, array['admin']::public.member_role[]));
create policy "admins revoke invitations" on public.invitations
  for delete to authenticated using (public.has_role(org_id, array['admin']::public.member_role[]));

-- Called after sign-in. Runs as definer because the invitee cannot read invitations yet.
create function public.accept_invitations() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  user_email text;
  accepted integer;
begin
  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return 0;
  end if;

  with claimed as (
    delete from public.invitations where email = user_email returning org_id, role
  )
  insert into public.memberships (org_id, user_id, role)
  select org_id, auth.uid(), role from claimed
  on conflict (org_id, user_id) do nothing;

  get diagnostics accepted = row_count;
  return accepted;
end;
$$;

grant execute on function public.accept_invitations() to authenticated;

-- An organization must always keep at least one admin.
create function public.keep_one_admin() returns trigger
language plpgsql as $$
begin
  -- Skipped while the organization itself is being deleted (cascade).
  if (tg_op = 'DELETE' or new.role <> 'admin') and old.role = 'admin'
    and exists (select 1 from public.organizations where id = old.org_id)
    and not exists (
      select 1 from public.memberships
      where org_id = old.org_id and role = 'admin' and user_id <> old.user_id
    ) then
    raise exception 'La empresa necesita al menos un administrador';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger memberships_keep_one_admin
before update of role or delete on public.memberships
for each row execute function public.keep_one_admin();
