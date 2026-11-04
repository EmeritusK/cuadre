import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LineChip } from "@/components/overview/session-overview";
import { ProductFilters } from "@/components/products/product-filters";
import { ExportButton } from "@/components/sessions/export-button";
import { ProductSheet } from "@/components/products/product-sheet";
import { PageHeader } from "@/components/shell/page-header";
import { StatusMark } from "@/components/status-mark";
import { Alert } from "@/components/ui/alert";
import {
  formatInteger,
  formatQuantity,
  formatSignedMoney,
  formatSignedQuantity,
} from "@/lib/format";
import { sessionLabel } from "@/lib/lines";
import { canManage } from "@/lib/org/active";
import {
  PAGE_SIZE,
  SORTS,
  getProductDetail,
  getProductsPage,
  parseFilters,
  type SortKey,
} from "@/lib/products/query";
import { getSessionByCode } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Sep } from "@/components/ui/sep";

type Props = {
  params: { code: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Productos ${sessionLabel(Number(params.code))}` };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { session, context } = await getSessionByCode(params.code);
  const filters = parseFilters(searchParams);
  const supabase = createClient();
  const productParam = typeof searchParams.producto === "string" ? searchParams.producto : null;

  const [{ rows, total, failed }, { data: suppliers }, { data: teams }, detail] = await Promise.all(
    [
      getProductsPage(session.id, filters),
      supabase
        .from("supplier_progress")
        .select("supplier_id, supplier_name")
        .eq("session_id", session.id)
        .order("supplier_name"),
      supabase.from("teams").select("id, code, name").eq("session_id", session.id).order("code"),
      productParam ? getProductDetail(session.id, productParam) : Promise.resolve(null),
    ],
  );

  const teamCode = new Map((teams ?? []).map((team) => [team.id, team.code]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const index = detail ? rows.findIndex((row) => row.id === detail.product.id) : -1;

  const href = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") next.set(key, value);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    return `?${next.toString()}`;
  };

  return (
    <>
      <PageHeader
        title={
          <>
            Productos
            <Sep />
            {sessionLabel(session.code)}
          </>
        }
        description={`${formatInteger(total)} ${total === 1 ? "producto" : "productos"} con estos filtros`}
        actions={<ExportButton code={session.code} />}
      />
      <div className="grid gap-4 p-4 sm:p-6">
        <ProductFilters
          filters={filters}
          suppliers={(suppliers ?? []).map((s) => ({ id: s.supplier_id!, name: s.supplier_name! }))}
          teams={teams ?? []}
          sorts={(Object.keys(SORTS) as SortKey[]).map((key) => ({
            value: key,
            label: SORTS[key].label,
          }))}
        />

        {failed ? (
          <Alert tone="error">No pudimos cargar los productos. Recarga la página.</Alert>
        ) : null}

        <div className="relative overflow-x-auto rounded border border-rule bg-panel">
          <table className="w-full text-sm lg:min-w-[60rem]">
            <caption className="sr-only">Productos de la toma</caption>
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-rule-strong/30 text-left font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  Producto
                </th>
                <th scope="col" className="hidden px-4 py-3 lg:table-cell">
                  Proveedor
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right md:table-cell">
                  Sistema
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right md:table-cell">
                  Contado
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">
                  Dif. u
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Dif. $
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-ink-muted">
                    Ningún producto coincide con estos filtros.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const counted = row.status !== "pendiente";
                  const selected = detail?.product.id === row.id;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "group relative border-b border-rule last:border-0 hover:bg-panel-sunken/60",
                        selected && "bg-cobalt/5",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <StatusMark status={row.status} />
                      </td>
                      <td className="max-w-[11rem] px-4 py-2.5 sm:max-w-[20rem] lg:max-w-[26rem]">
                        <Link
                          href={href({ producto: row.id })}
                          scroll={false}
                          className="block truncate font-semibold after:absolute after:inset-0 group-hover:underline"
                        >
                          {row.description}
                        </Link>
                        <span className="flex items-center gap-2 text-xs text-ink-muted">
                          {row.sku}
                          {row.recountRequested ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-ink">
                              <Flag className="size-3 text-amber" aria-hidden="true" />
                              Recuento pedido
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        <span className="flex items-center gap-2">
                          <LineChip code={row.teamId ? (teamCode.get(row.teamId) ?? null) : null} />
                          <span className="max-w-[12rem] truncate">{row.supplierName}</span>
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-right md:table-cell">
                        {formatQuantity(row.systemQty)}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right md:table-cell">
                        {counted ? formatQuantity(row.countedQty) : "—"}
                      </td>
                      <td
                        className={cn(
                          "hidden px-4 py-2.5 text-right sm:table-cell",
                          counted && row.difference < 0 && "text-short",
                          counted && row.difference > 0 && "text-over",
                        )}
                      >
                        {counted ? formatSignedQuantity(row.difference) : "—"}
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                          counted && row.differenceValue < 0 && "text-short",
                          counted && row.differenceValue > 0 && "text-over",
                        )}
                      >
                        {counted ? formatSignedMoney(row.differenceValue) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 ? (
          <nav aria-label="Paginación" className="flex items-center justify-between gap-4 text-sm">
            <span className="text-ink-muted">
              Página {filters.page} de {pages}
            </span>
            <span className="flex gap-2">
              <PageLink
                href={href({ pagina: String(filters.page - 1), producto: null })}
                disabled={filters.page <= 1}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </PageLink>
              <PageLink
                href={href({ pagina: String(filters.page + 1), producto: null })}
                disabled={filters.page >= pages}
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </PageLink>
            </span>
          </nav>
        ) : null}
      </div>

      {detail ? (
        <ProductSheet
          detail={detail}
          previousId={index > 0 ? rows[index - 1]!.id : null}
          nextId={index >= 0 && index < rows.length - 1 ? rows[index + 1]!.id : null}
          canManage={canManage(context.role)}
          readOnly={session.status === "closed"}
        />
      ) : null}
    </>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 items-center gap-1 rounded border border-rule-strong/40 bg-panel px-3 font-semibold";
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(className, "opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(className, "hover:bg-panel-sunken")}>
      {children}
    </Link>
  );
}
