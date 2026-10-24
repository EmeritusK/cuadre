"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseInventoryCsv } from "@/lib/csv/parse-inventory";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";

export type ImportState = { error?: string };

const MAX_BYTES = 5 * 1024 * 1024;

const input = z.object({
  name: z.string().trim().min(2, "Ponle un nombre a la toma").max(80, "Máximo 80 caracteres"),
  file: z
    .instanceof(File, { message: "Elige el archivo CSV" })
    .refine((file) => file.size > 0, "El archivo está vacío")
    .refine((file) => file.size <= MAX_BYTES, "El archivo pesa más de 5 MB"),
});

/**
 * Re-parses the uploaded file on the server (the browser preview is never trusted)
 * and creates the session through the atomic import_session RPC.
 */
export async function importSession(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { org, role } = await getActiveContext();
  if (role !== "admin") return { error: "Solo un administrador puede importar inventario." };

  const parsed = input.safeParse({ name: formData.get("name"), file: formData.get("file") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const result = parseInventoryCsv(await parsed.data.file.text());
  if (result.missingColumns.length > 0) {
    return { error: `Faltan columnas: ${result.missingColumns.join(", ")}.` };
  }
  if (result.rows.length === 0) return { error: "Ninguna fila del archivo es válida." };

  const supabase = createClient();
  const { data: sessionId, error } = await supabase.rpc("import_session", {
    target_org: org.id,
    session_name: parsed.data.name,
    filename: parsed.data.file.name,
    rows: result.rows.map(({ line: _line, ...row }) => row),
  });
  if (error || !sessionId) {
    return { error: "No pudimos guardar la toma. Ningún dato quedó a medias; intenta de nuevo." };
  }

  const { data: session } = await supabase
    .from("count_sessions")
    .select("code")
    .eq("id", sessionId)
    .single();

  revalidatePath("/", "layout");
  redirect(session ? `/tomas/${session.code}/equipos?importada=1` : "/tomas");
}
