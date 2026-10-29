import type { CountStatus } from "@/lib/counts/compute";
import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 50;

export const STATUS_FILTERS = [
  "todos",
  "diferencias",
  "faltante",
  "sobrante",
  "cuadrado",
  "pendiente",
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORTS = {
  impacto: { label: "Mayor diferencia en $", column: "exposure_value", ascending: false },
  descripcion: { label: "Descripción A–Z", column: "description", ascending: true },
  codigo: { label: "Código", column: "sku", ascending: true },
  reciente: { label: "Contado recientemente", column: "last_counted_at", ascending: false },
} as const;
export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  q: string;
  status: StatusFilter;
  supplier: string | null;
  team: string | null;
  sort: SortKey;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const UUID = /^[0-9a-f-]{36}$/i;

export function parseFilters(params: Params): ProductFilters {
  const status = first(params.estado) as StatusFilter | undefined;
  const sort = first(params.orden) as SortKey | undefined;
  const supplier = first(params.proveedor);
  const team = first(params.equipo);
  const page = Number(first(params.pagina) ?? 1);
  return {
    q: (first(params.q) ?? "").slice(0, 80),
    status: status && STATUS_FILTERS.includes(status) ? status : "todos",
    supplier: supplier && UUID.test(supplier) ? supplier : null,
    team: team && (UUID.test(team) || team === "ninguno") ? team : null,
    sort: sort && sort in SORTS ? sort : "impacto",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export type ProductRow = {
  id: string;
  sku: string;
  description: string;
  supplierName: string;
  teamId: string | null;
  systemQty: number;
  countedQty: number;
  difference: number;
  differenceValue: number;
  status: CountStatus;
  events: number;
  recountRequested: boolean;
  lastCountedAt: string | null;
};

/** Strips characters that would break a PostgREST or() filter or act as ilike wildcards. */
function searchTerm(q: string) {
  return q.replace(/[%_\\,()."']/g, " ").trim();
}

export async function getProductsPage(sessionId: string, filters: ProductFilters) {
  const supabase = createClient();
  const sort = SORTS[filters.sort];

  let query = supabase
    .from("session_product_status")
    .select(
      "id, sku, description, supplier_name, team_id, system_qty, counted_qty, difference, difference_value, status, count_events, recount_requested, last_counted_at",
      { count: "exact" },
    )
    .eq("session_id", sessionId);

  const term = searchTerm(filters.q);
  if (term) query = query.or(`sku.ilike.%${term}%,description.ilike.%${term}%`);
  if (filters.status === "diferencias") query = query.in("status", ["faltante", "sobrante"]);
  else if (filters.status !== "todos") query = query.eq("status", filters.status);
  if (filters.supplier) query = query.eq("supplier_id", filters.supplier);
  if (filters.team === "ninguno") query = query.is("team_id", null);
  else if (filters.team) query = query.eq("team_id", filters.team);

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .order("sku", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const rows: ProductRow[] = (data ?? []).map((row) => ({
    id: row.id!,
    sku: row.sku!,
    description: row.description!,
    supplierName: row.supplier_name!,
    teamId: row.team_id,
    systemQty: Number(row.system_qty),
    countedQty: Number(row.counted_qty),
    difference: Number(row.difference),
    differenceValue: Number(row.difference_value),
    status: row.status as CountStatus,
    events: Number(row.count_events),
    recountRequested: Boolean(row.recount_requested),
    lastCountedAt: row.last_counted_at,
  }));

  return { rows, total: count ?? 0, failed: Boolean(error) };
}

export async function getProductDetail(sessionId: string, productId: string) {
  if (!UUID.test(productId)) return null;
  const supabase = createClient();
  const [{ data: product }, { data: counts }] = await Promise.all([
    supabase
      .from("session_product_status")
      .select("*")
      .eq("session_id", sessionId)
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("counts")
      .select(
        "id, pallets, layers, boxes, units, units_per_box, total, expires_on, condition, device, created_at, counted_by",
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
  ]);
  if (!product) return null;

  const counterIds = [
    ...new Set((counts ?? []).map((c) => c.counted_by).filter(Boolean)),
  ] as string[];
  const { data: profiles } = counterIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", counterIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return {
    product,
    counts: (counts ?? []).map((c) => ({
      ...c,
      counterName: c.counted_by ? (names.get(c.counted_by) ?? null) : null,
    })),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;
