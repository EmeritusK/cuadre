import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_ORG_COOKIE = "cuadre-org";

export type Role = Database["public"]["Enums"]["member_role"];

export type ActiveContext = {
  user: { id: string; email: string; fullName: string | null };
  org: { id: string; name: string };
  role: Role;
  organizations: { id: string; name: string; role: Role }[];
};

/**
 * Resolves the signed-in user and the organization they are working in.
 * Cached per request so layouts and pages share one round trip.
 */
export const getActiveContext = cache(async (): Promise<ActiveContext> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase
      .from("memberships")
      .select("role, organizations(id, name)")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const organizations = (memberships ?? []).flatMap((m) =>
    m.organizations ? [{ id: m.organizations.id, name: m.organizations.name, role: m.role }] : [],
  );
  if (organizations.length === 0) redirect("/bienvenida");

  const preferred = cookies().get(ACTIVE_ORG_COOKIE)?.value;
  const active = organizations.find((o) => o.id === preferred) ?? organizations[0]!;

  return {
    user: { id: user.id, email: user.email ?? "", fullName: profile?.full_name ?? null },
    org: { id: active.id, name: active.name },
    role: active.role,
    organizations,
  };
});

export function canManage(role: Role) {
  return role === "admin" || role === "supervisor";
}
