"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManage, getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";
import { balanceSuppliers } from "./balance";

export type TeamResult = { error?: string };

const uuid = z.string().uuid();
const teamName = z
  .string()
  .trim()
  .min(1, "Ponle un nombre al equipo")
  .max(40, "Máximo 40 caracteres");

async function authorize() {
  const context = await getActiveContext();
  if (!canManage(context.role)) {
    return { error: "Solo supervisores y administradores organizan equipos." } as const;
  }
  return { context, supabase: createClient() } as const;
}

function done(
  error?: { message: string } | null,
  fallback = "No pudimos guardar el cambio.",
): TeamResult {
  revalidatePath("/tomas/[code]", "layout");
  return error ? { error: fallback } : {};
}

export async function createTeam(sessionId: string, name: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const parsed = teamName.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await auth.supabase.from("teams").insert({
    session_id: uuid.parse(sessionId),
    org_id: auth.context.org.id,
    name: parsed.data,
    code: 0,
  });
  return done(error, "No pudimos crear el equipo. ¿La toma está cerrada?");
}

export async function renameTeam(teamId: string, name: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const parsed = teamName.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await auth.supabase
    .from("teams")
    .update({ name: parsed.data })
    .eq("id", uuid.parse(teamId));
  return done(error);
}

export async function deleteTeam(teamId: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("teams").delete().eq("id", uuid.parse(teamId));
  return done(error, "No pudimos eliminar el equipo.");
}

export async function addMember(teamId: string, userId: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("team_members").insert({
    team_id: uuid.parse(teamId),
    user_id: uuid.parse(userId),
    org_id: auth.context.org.id,
  });
  return done(error, "Esa persona ya está en el equipo o no pertenece a la empresa.");
}

export async function removeMember(teamId: string, userId: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("team_members")
    .delete()
    .eq("team_id", uuid.parse(teamId))
    .eq("user_id", uuid.parse(userId));
  return done(error);
}

export async function assignSuppliers(
  sessionId: string,
  teamId: string,
  supplierIds: string[],
): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const ids = z.array(uuid).min(1, "Elige al menos un proveedor").safeParse(supplierIds);
  if (!ids.success) return { error: ids.error.issues[0]?.message };

  // A supplier belongs to one team per session: move it if it was elsewhere.
  await auth.supabase
    .from("team_suppliers")
    .delete()
    .eq("session_id", uuid.parse(sessionId))
    .in("supplier_id", ids.data);
  const { error } = await auth.supabase.from("team_suppliers").insert(
    ids.data.map((supplierId) => ({
      team_id: uuid.parse(teamId),
      supplier_id: supplierId,
      session_id: sessionId,
      org_id: auth.context.org.id,
    })),
  );
  return done(error, "No pudimos asignar los proveedores. ¿La toma está cerrada?");
}

export async function unassignSupplier(teamId: string, supplierId: string): Promise<TeamResult> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("team_suppliers")
    .delete()
    .eq("team_id", uuid.parse(teamId))
    .eq("supplier_id", uuid.parse(supplierId));
  return done(error);
}

/** Assigns every supplier without a team, keeping product counts per team even. */
export async function balanceUnassigned(
  sessionId: string,
): Promise<TeamResult & { assigned?: number }> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  const session = uuid.parse(sessionId);

  const [{ data: teams }, { data: progress }] = await Promise.all([
    auth.supabase.from("teams").select("id").eq("session_id", session),
    auth.supabase
      .from("supplier_progress")
      .select("supplier_id, team_id, products")
      .eq("session_id", session),
  ]);
  if (!teams?.length) return { error: "Crea al menos un equipo primero." };

  const rows = progress ?? [];
  const unassigned = rows
    .filter((row) => !row.team_id)
    .map((row) => ({ id: row.supplier_id!, products: Number(row.products) }));
  if (unassigned.length === 0) return { assigned: 0 };

  const loads = teams.map((team) => ({
    id: team.id,
    load: rows
      .filter((row) => row.team_id === team.id)
      .reduce((sum, row) => sum + Number(row.products), 0),
  }));
  const plan = balanceSuppliers(unassigned, loads);

  const { error } = await auth.supabase.from("team_suppliers").insert(
    [...plan.entries()].flatMap(([teamId, supplierIds]) =>
      supplierIds.map((supplierId) => ({
        team_id: teamId,
        supplier_id: supplierId,
        session_id: session,
        org_id: auth.context.org.id,
      })),
    ),
  );
  if (error) return done(error, "No pudimos repartir los proveedores.");
  done();
  return { assigned: unassigned.length };
}
