"use server";

import { revalidatePath } from "next/cache";
import { canManage, getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

export async function setRecountRequested(productId: string, requested: boolean) {
  const { role } = await getActiveContext();
  if (!canManage(role)) return { error: "Solo supervisores y administradores piden recuentos." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_products")
    .update({ recount_requested: requested })
    .eq("id", productId)
    .select("id");
  if (error || !data?.length)
    return { error: "No pudimos actualizar el producto. ¿La toma está cerrada?" };

  revalidatePath("/tomas/[code]", "layout");
  return {};
}
