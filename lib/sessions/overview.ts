import { createClient } from "@/lib/supabase/server";
import type { CountStatus } from "@/lib/counts/compute";

export type StationData = {
  supplierId: string;
  name: string;
  products: number;
  counted: number;
  short: number;
  over: number;
  differenceValue: number;
  lastCountedAt: string | null;
};

export type LineData = {
  teamId: string | null;
  code: number | null;
  name: string;
  members: number;
  stations: StationData[];
};

export type ArrivalData = {
  id: string;
  createdAt: string;
  total: number;
  description: string;
  supplierId: string;
};

export type DifferenceData = {
  id: string;
  sku: string;
  description: string;
  supplierName: string;
  systemQty: number;
  countedQty: number;
  differenceValue: number;
  status: CountStatus;
  recountRequested: boolean;
};

export type SessionOverview = {
  summary: {
    products: number;
    counted: number;
    matched: number;
    short: number;
    over: number;
    differenceValue: number;
    systemValue: number;
  };
  lines: LineData[];
  arrivals: ArrivalData[];
  differences: DifferenceData[];
};

const num = (value: number | string | null | undefined) => Number(value ?? 0);

export async function getSessionOverview(sessionId: string): Promise<SessionOverview> {
  const supabase = createClient();

  const [summaryRes, suppliersRes, teamsRes, arrivalsRes, shortRes, overRes] = await Promise.all([
    supabase.from("session_summary").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("supplier_progress").select("*").eq("session_id", sessionId),
    supabase
      .from("teams")
      .select("id, code, name, team_members(count)")
      .eq("session_id", sessionId)
      .order("code"),
    supabase
      .from("counts")
      .select("id, created_at, total, session_products(description, supplier_id)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("session_product_status")
      .select("id, sku, description, supplier_name, system_qty, counted_qty, difference_value, status, recount_requested")
      .eq("session_id", sessionId)
      .eq("status", "faltante")
      .order("difference_value", { ascending: true })
      .limit(8),
    supabase
      .from("session_product_status")
      .select("id, sku, description, supplier_name, system_qty, counted_qty, difference_value, status, recount_requested")
      .eq("session_id", sessionId)
      .eq("status", "sobrante")
      .order("difference_value", { ascending: false })
      .limit(8),
  ]);

  const s = summaryRes.data;
  const stationsByTeam = new Map<string | null, StationData[]>();
  for (const row of suppliersRes.data ?? []) {
    const station: StationData = {
      supplierId: row.supplier_id!,
      name: row.supplier_name!,
      products: num(row.products),
      counted: num(row.counted_products),
      short: num(row.short_products),
      over: num(row.over_products),
      differenceValue: num(row.difference_value),
      lastCountedAt: row.last_counted_at,
    };
    const key = row.team_id ?? null;
    stationsByTeam.set(key, [...(stationsByTeam.get(key) ?? []), station]);
  }
  for (const stations of stationsByTeam.values()) {
    stations.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  const lines: LineData[] = (teamsRes.data ?? []).map((team) => ({
    teamId: team.id,
    code: team.code,
    name: team.name,
    members: team.team_members[0]?.count ?? 0,
    stations: stationsByTeam.get(team.id) ?? [],
  }));
  const unassigned = stationsByTeam.get(null);
  if (unassigned?.length) {
    lines.push({ teamId: null, code: null, name: "Sin equipo", members: 0, stations: unassigned });
  }

  const differences = [...(shortRes.data ?? []), ...(overRes.data ?? [])]
    .map(
      (row): DifferenceData => ({
        id: row.id!,
        sku: row.sku!,
        description: row.description!,
        supplierName: row.supplier_name!,
        systemQty: num(row.system_qty),
        countedQty: num(row.counted_qty),
        differenceValue: num(row.difference_value),
        status: row.status as CountStatus,
        recountRequested: Boolean(row.recount_requested),
      }),
    )
    .sort((a, b) => Math.abs(b.differenceValue) - Math.abs(a.differenceValue))
    .slice(0, 8);

  return {
    summary: {
      products: num(s?.products),
      counted: num(s?.counted_products),
      matched: num(s?.matched_products),
      short: num(s?.short_products),
      over: num(s?.over_products),
      differenceValue: num(s?.difference_value),
      systemValue: num(s?.system_value),
    },
    lines,
    arrivals: (arrivalsRes.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      total: num(row.total),
      description: row.session_products?.description ?? "Producto",
      supplierId: row.session_products?.supplier_id ?? "",
    })),
    differences,
  };
}
