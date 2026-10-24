"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

async function updateStatus(code: number, from: "draft" | "counting", to: "counting" | "closed") {
  const { org, role } = await getActiveContext();
  if (role !== "admin") return { error: "Solo un administrador puede cambiar el estado de la toma." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("count_sessions")
    .update({ status: to })
    .eq("org_id", org.id)
    .eq("code", code)
    .eq("status", from)
    .select("code");

  if (error || !data?.length) {
    return { error: "La toma cambió mientras la mirabas. Recarga la página e intenta de nuevo." };
  }
  revalidatePath("/", "layout");
  return {};
}

export async function startCounting(code: number): Promise<ActionResult> {
  return updateStatus(code, "draft", "counting");
}

export async function closeSession(code: number): Promise<ActionResult> {
  return updateStatus(code, "counting", "closed");
}

export async function deleteDraft(code: number): Promise<ActionResult> {
  const { org, role } = await getActiveContext();
  if (role !== "admin") return { error: "Solo un administrador puede eliminar tomas." };

  const supabase = createClient();
  const { error } = await supabase
    .from("count_sessions")
    .delete()
    .eq("org_id", org.id)
    .eq("code", code)
    .eq("status", "draft");
  if (error) return { error: "No pudimos eliminar la toma." };

  revalidatePath("/", "layout");
  redirect("/tomas");
}
