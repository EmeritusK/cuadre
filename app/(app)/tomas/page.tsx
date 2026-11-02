import { FileUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SessionBadge } from "@/components/session-badge";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { formatDate, formatInteger, formatPercent, formatSignedMoney, ratio } from "@/lib/format";
import { sessionLabel } from "@/lib/lines";
import { getActiveContext } from "@/lib/org/active";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tomas" };

export default async function SessionsPage() {
  const { org, role } = await getActiveContext();
  const supabase = createClient();

  const [{ data: sessions }, { data: summaries }] = await Promise.all([
    supabase
      .from("count_sessions")
      .select("id, code, name, status, created_at, closed_at, warehouses(name)")
      .eq("org_id", org.id)
      .order("code", { ascending: false }),
    supabase.from("session_summary").select("*").eq("org_id", org.id),
  ]);

  const summaryById = new Map((summaries ?? []).map((s) => [s.session_id, s]));
  const importAction =
    role === "admin" ? (
      <Button asChild>
        <Link href="/tomas/nueva">
          <FileUp aria-hidden="true" />
          Importar inventario
        </Link>
      </Button>
    ) : null;

  return (
    <>
      <PageHeader
        title="Tomas"
        description="Cada importación del sistema contable abre una toma física nueva."
        actions={importAction}
      />
      <div className="p-4 sm:p-6">
        {!sessions?.length ? (
          <EmptySessions canImport={role === "admin"} />
        ) : (
          <div className="relative overflow-x-auto rounded border border-rule bg-panel">
            <table className="w-full min-w-[56rem] text-sm">
              <caption className="sr-only">
                Tomas de la empresa, de la más reciente a la más antigua
              </caption>
              <thead>
                <tr className="border-b border-rule-strong/30 text-left text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
                  <th scope="col" className="px-4 py-3">
                    Toma
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Bodega
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Productos
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Avance
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Diferencia
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const summary = summaryById.get(session.id);
                  const progress = ratio(summary?.counted_products ?? 0, summary?.products ?? 0);
                  const difference = Number(summary?.difference_value ?? 0);
                  return (
                    <tr
                      key={session.id}
                      className="group relative border-b border-rule last:border-0 hover:bg-panel-sunken/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tomas/${session.code}`}
                          className="font-bold after:absolute after:inset-0 group-hover:underline"
                        >
                          {sessionLabel(session.code)}
                        </Link>
                        <span className="block text-ink-muted">{session.name}</span>
                      </td>
                      <td className="px-4 py-3">{session.warehouses?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <SessionBadge status={session.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatInteger(summary?.products ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-1.5 w-28 overflow-hidden rounded-full bg-rule"
                            aria-hidden="true"
                          >
                            <div
                              className="h-full bg-ink"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <span className="w-12 text-right">{formatPercent(progress)}</span>
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold",
                          difference < 0 && "text-short",
                          difference > 0 && "text-over",
                        )}
                      >
                        {formatSignedMoney(difference)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-muted">
                        {formatDate(session.closed_at ?? session.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function EmptySessions({ canImport }: { canImport: boolean }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <svg viewBox="0 0 160 48" aria-hidden="true" className="mx-auto mb-6 h-12 w-40">
        <path
          d="M8 24h144"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-rule"
        />
        {[24, 80, 136].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="24"
            r="8"
            className="fill-ground stroke-rule-strong/50"
            strokeWidth="3.5"
          />
        ))}
      </svg>
      <h2 className="text-lg font-bold">Todavía no hay tomas</h2>
      <p className="mt-2 text-ink-muted">
        {canImport
          ? "Importa el CSV de saldos de tu sistema contable. Cuadre arma la toma con sus proveedores y productos."
          : "Cuando un administrador importe el inventario, la toma aparecerá aquí."}
      </p>
      {canImport ? (
        <Button asChild className="mt-6">
          <Link href="/tomas/nueva">
            <FileUp aria-hidden="true" />
            Importar inventario
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
