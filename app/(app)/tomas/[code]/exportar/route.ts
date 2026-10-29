import { toCsv } from "@/lib/export/csv";
import { sessionLabel, teamLabel } from "@/lib/lines";
import { getSessionByCode } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BATCH = 1000;

/** Downloads every product of a session with its reconciliation as CSV. */
export async function GET(_request: Request, { params }: { params: { code: string } }) {
  const { session } = await getSessionByCode(params.code);
  const supabase = createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, code, name")
    .eq("session_id", session.id);
  const teamName = new Map((teams ?? []).map((t) => [t.id, `${teamLabel(t.code)} ${t.name}`]));

  const rows: (string | number | null)[][] = [];
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await supabase
      .from("session_product_status")
      .select(
        "sku, description, supplier_name, team_id, system_qty, counted_qty, difference, unit_cost, difference_value, status, count_events, recount_requested",
      )
      .eq("session_id", session.id)
      .order("supplier_name")
      .order("sku")
      .range(from, from + BATCH - 1);
    if (error) return new Response("No pudimos generar la exportación.", { status: 500 });

    for (const row of data ?? []) {
      const counted = row.status !== "pendiente";
      rows.push([
        row.sku,
        row.description,
        row.supplier_name,
        row.team_id ? (teamName.get(row.team_id) ?? null) : null,
        Number(row.system_qty),
        counted ? Number(row.counted_qty) : null,
        counted ? Number(row.difference) : null,
        Number(row.unit_cost),
        counted ? Number(row.difference_value) : null,
        String(row.status).toUpperCase(),
        Number(row.count_events),
        row.recount_requested ? "SI" : "NO",
      ]);
    }
    if (!data || data.length < BATCH) break;
  }

  const csv = toCsv(
    [
      "CODIGO_PRODUCTO",
      "DESCRIPCION_PRODUCTO",
      "PROVEEDOR",
      "EQUIPO",
      "SALDO_SISTEMA",
      "SALDO_CONTADO",
      "DIFERENCIA",
      "COSTO_PRODUCTO",
      "DIFERENCIA_USD",
      "ESTADO",
      "CONTEOS",
      "RECUENTO_PEDIDO",
    ],
    rows,
  );

  const filename = `${sessionLabel(session.code)}-${session.status === "closed" ? "cierre" : "avance"}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
