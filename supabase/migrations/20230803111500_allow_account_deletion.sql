-- Deleting a user account cascades to its memberships. The last-admin guard
-- must not block that, only demotions and removals done through the app.

create or replace function public.keep_one_admin() returns trigger
language plpgsql as $$
begin
  if (tg_op = 'DELETE' or new.role <> 'admin') and old.role = 'admin'
    and exists (select 1 from public.organizations where id = old.org_id)
    and exists (select 1 from auth.users where id = old.user_id)
    and not exists (
      select 1 from public.memberships
      where org_id = old.org_id and role = 'admin' and user_id <> old.user_id
    ) then
    raise exception 'La empresa necesita al menos un administrador';
  end if;
  return coalesce(new, old);
end;
$$;
