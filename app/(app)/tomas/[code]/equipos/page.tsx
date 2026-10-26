import type { Metadata } from "next";
import { SessionActions } from "@/components/sessions/session-actions";
import { PageHeader } from "@/components/shell/page-header";
import { TeamBoard, type BoardSupplier, type BoardTeam } from "@/components/teams/team-board";
import { Alert } from "@/components/ui/alert";
import { formatInteger } from "@/lib/format";
import { sessionLabel } from "@/lib/lines";
import { canManage } from "@/lib/org/active";
import { getSessionByCode } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { params: { code: string }; searchParams: { importada?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Equipos ${sessionLabel(Number(params.code))}` };
}

export default async function TeamsPage({ params, searchParams }: Props) {
  const { session, context } = await getSessionByCode(params.code);
  const supabase = createClient();

  const [{ data: teams }, { data: progress }, { data: memberships }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, code, name, team_members(user_id)")
      .eq("session_id", session.id)
      .order("code"),
    supabase
      .from("supplier_progress")
      .select("supplier_id, supplier_name, team_id, products, counted_products")
      .eq("session_id", session.id)
      .order("supplier_name"),
    supabase.from("memberships").select("user_id, role").eq("org_id", context.org.id),
  ]);

  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Sin nombre"]));

  const toSupplier = (row: NonNullable<typeof progress>[number]): BoardSupplier => ({
    id: row.supplier_id!,
    name: row.supplier_name!,
    products: Number(row.products),
    counted: Number(row.counted_products),
  });

  const board: BoardTeam[] = (teams ?? []).map((team) => ({
    id: team.id,
    code: team.code,
    name: team.name,
    members: team.team_members
      .map((m) => ({ id: m.user_id, name: nameOf.get(m.user_id) ?? "Sin nombre" }))
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
    suppliers: (progress ?? []).filter((row) => row.team_id === team.id).map(toSupplier),
  }));
  const unassigned = (progress ?? []).filter((row) => !row.team_id).map(toSupplier);
  const readOnly = session.status === "closed" || !canManage(context.role);
  const products = (progress ?? []).reduce((sum, row) => sum + Number(row.products), 0);

  return (
    <>
      <PageHeader
        title={`Equipos · ${sessionLabel(session.code)}`}
        description="Cada equipo es una línea del mapa y cuenta los proveedores que le asignes."
        actions={
          context.role === "admin" && session.status === "draft" ? (
            <SessionActions
              code={session.code}
              status={session.status}
              pendingProducts={0}
              unassignedSuppliers={unassigned.length}
            />
          ) : null
        }
      />
      <div className="grid gap-4 p-4 sm:p-6">
        {searchParams.importada ? (
          <Alert tone="success">
            {sessionLabel(session.code)} quedó creada con {formatInteger(products)} productos de{" "}
            {formatInteger((progress ?? []).length)} proveedores. Arma los equipos y luego inicia el
            conteo.
          </Alert>
        ) : null}
        {session.status === "closed" ? (
          <Alert tone="info">
            La toma está cerrada: los equipos quedan como referencia y no se pueden cambiar.
          </Alert>
        ) : null}
        <TeamBoard
          sessionId={session.id}
          teams={board}
          unassigned={unassigned}
          people={(memberships ?? [])
            .map((m) => ({
              id: m.user_id,
              name: nameOf.get(m.user_id) ?? "Sin nombre",
              role: m.role,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "es"))}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}
