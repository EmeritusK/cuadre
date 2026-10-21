import { Rail } from "@/components/shell/rail";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org, role, organizations } = await getActiveContext();
  const supabase = createClient();

  // The session in progress: counting first, then the newest draft.
  const { data: sessions } = await supabase
    .from("count_sessions")
    .select("code, name, status, warehouses(name)")
    .eq("org_id", org.id)
    .neq("status", "closed")
    .order("status", { ascending: false })
    .order("code", { ascending: false })
    .limit(1);
  const session = sessions?.[0];

  return (
    <div className="lg:flex">
      <Rail
        orgName={org.name}
        current={
          session
            ? {
                code: session.code,
                name: session.name,
                status: session.status,
                warehouse: session.warehouses?.name ?? null,
              }
            : null
        }
        user={{ name: user.fullName ?? user.email, email: user.email }}
        organizations={organizations}
        activeOrgId={org.id}
        canImport={role === "admin"}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
