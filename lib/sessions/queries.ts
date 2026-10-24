import { notFound } from "next/navigation";
import { cache } from "react";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

/** Loads a session of the active organization by its sequential code, or 404s. */
export const getSessionByCode = cache(async (rawCode: string) => {
  const code = Number(rawCode);
  if (!Number.isInteger(code) || code < 1) notFound();

  const context = await getActiveContext();
  const supabase = createClient();
  const { data } = await supabase
    .from("count_sessions")
    .select("id, code, name, status, source_filename, started_at, closed_at, created_at, warehouses(name)")
    .eq("org_id", context.org.id)
    .eq("code", code)
    .maybeSingle();

  if (!data) notFound();
  return { session: data, context };
});
