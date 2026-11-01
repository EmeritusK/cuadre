"use client";

import { ArrowRight, Flag, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusMark } from "@/components/status-mark";
import {
  formatInteger,
  formatPercent,
  formatQuantity,
  formatRelative,
  formatSignedMoney,
  formatTime,
  ratio,
} from "@/lib/format";
import { lineInk, teamLabel } from "@/lib/lines";
import type { SessionOverview as Overview } from "@/lib/sessions/overview";
import { cn } from "@/lib/utils";
import { NetworkMap } from "./network-map";
import { useLiveCounts, type LiveStatus } from "./use-live-counts";

type Props = {
  sessionId: string;
  sessionCode: number;
  counting: boolean;
  overview: Overview;
};

export function SessionOverview({ sessionId, sessionCode, counting, overview }: Props) {
  const { status, pulses, lastEventAt } = useLiveCounts(sessionId, counting);
  const { summary, lines, arrivals, differences } = overview;
  const pending = summary.products - summary.counted;
  const progress = ratio(summary.counted, summary.products);
  const supplierTeam = new Map(
    lines.flatMap((line) => line.stations.map((s) => [s.supplierId, line.code] as const)),
  );

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 [&>*]:min-w-0">
      <section aria-labelledby="estado" className="rounded border border-rule bg-panel">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <h2 id="estado" className="sr-only">
              Estado de la toma
            </h2>
            <p className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.75rem]">
              {summary.products === 0
                ? "La toma no tiene productos."
                : pending === 0
                  ? "Todos los productos están contados."
                  : `Faltan ${formatInteger(pending)} de ${formatInteger(summary.products)} productos.`}
            </p>
            <p className="mt-1.5 text-ink-muted">
              <span className="font-semibold text-ink">{formatPercent(progress)} contado</span>
              {summary.counted > 0 ? (
                <>
                  {" · "}Diferencia neta{" "}
                  <span
                    className={cn(
                      "whitespace-nowrap font-bold",
                      summary.differenceValue < 0 && "text-short",
                      summary.differenceValue > 0 && "text-over",
                    )}
                  >
                    {formatSignedMoney(summary.differenceValue)}
                  </span>{" "}
                  en {formatInteger(summary.short + summary.over)} productos
                </>
              ) : null}
            </p>
          </div>
          <LiveIndicator status={counting ? status : null} lastEventAt={lastEventAt} />
        </div>

        <TrunkLine lines={lines} total={summary.products} />

        <dl className="grid grid-cols-2 border-t border-rule sm:grid-cols-4">
          {[
            { label: "Cuadrados", value: summary.matched, status: "cuadrado" as const },
            { label: "Faltantes", value: summary.short, status: "faltante" as const },
            { label: "Sobrantes", value: summary.over, status: "sobrante" as const },
            { label: "Pendientes", value: pending, status: "pendiente" as const },
          ].map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between gap-3 px-5 py-3",
                index > 0 && "sm:border-l sm:border-rule",
                index % 2 === 1 && "border-l border-rule",
                index > 1 && "border-t border-rule sm:border-t-0",
              )}
            >
              <dt>
                <StatusMark status={item.status} className="text-sm" />
                <span className="sr-only">{item.label}</span>
              </dt>
              <dd className="text-lg font-bold">{formatInteger(item.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div className="grid grid-cols-1 content-start gap-6 [&>*]:min-w-0">
          <section aria-labelledby="mapa" className="rounded border border-rule bg-panel">
            <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-5 py-3">
              <h2 id="mapa" className="font-bold">
                Mapa de equipos
              </h2>
              <MapLegend />
            </header>
            {lines.length === 0 ? (
              <p className="px-5 py-10 text-center text-ink-muted">
                Arma los equipos para ver el mapa.{" "}
                <Link
                  href={`/tomas/${sessionCode}/equipos`}
                  className="font-semibold text-link hover:underline"
                >
                  Ir a Equipos
                </Link>
              </p>
            ) : (
              <div className="overflow-x-auto px-4 py-5">
                <NetworkMap sessionCode={sessionCode} lines={lines} pulses={pulses} />
              </div>
            )}
          </section>

          <LinesTable sessionCode={sessionCode} lines={lines} />
        </div>

        <div className="grid grid-cols-1 content-start gap-6 [&>*]:min-w-0">
          <section aria-labelledby="pesa" className="rounded border border-rule bg-panel">
            <header className="flex items-baseline justify-between border-b border-rule px-5 py-3">
              <h2 id="pesa" className="font-bold">
                Lo que más pesa
              </h2>
              <span className="text-xs text-ink-muted">por diferencia en $</span>
            </header>
            {differences.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                {summary.counted === 0
                  ? "Aparecerán aquí las diferencias más caras en cuanto lleguen conteos."
                  : "Sin diferencias por ahora: todo lo contado cuadra."}
              </p>
            ) : (
              <ol className="divide-y divide-rule">
                {differences.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/tomas/${sessionCode}/productos?producto=${item.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-5 py-2.5 hover:bg-panel-sunken/70"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusMark status={item.status} compact />
                        <span className="truncate text-sm font-semibold">{item.description}</span>
                      </span>
                      <span
                        className={cn(
                          "text-right text-sm font-bold",
                          item.differenceValue < 0 ? "text-short" : "text-over",
                        )}
                      >
                        {formatSignedMoney(item.differenceValue)}
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5 pl-5 text-xs text-ink-muted">
                        {item.recountRequested ? (
                          <Flag
                            className="size-3 shrink-0 text-amber"
                            aria-label="Recuento pedido"
                          />
                        ) : null}
                        <span className="truncate">{item.supplierName}</span>
                      </span>
                      <span className="text-right text-xs text-ink-muted">
                        {formatQuantity(item.countedQty)} de {formatQuantity(item.systemQty)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
            <div className="border-t border-rule px-5 py-2.5">
              <Link
                href={`/tomas/${sessionCode}/productos?estado=diferencias`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
              >
                Ver todas las diferencias
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="llegando" className="rounded border border-rule bg-panel">
            <header className="border-b border-rule px-5 py-3">
              <h2 id="llegando" className="font-bold">
                Últimos conteos
              </h2>
            </header>
            {arrivals.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                {counting
                  ? "Esperando el primer conteo de la app móvil."
                  : "Inicia el conteo para recibir conteos de los equipos."}
              </p>
            ) : (
              <ul className="divide-y divide-rule" aria-live="polite">
                {arrivals.map((arrival) => {
                  const code = supplierTeam.get(arrival.supplierId) ?? null;
                  return (
                    <li key={arrival.id} className="flex items-center gap-3 px-5 py-2.5">
                      <LineChip code={code} />
                      <span className="min-w-0 flex-1 truncate text-sm">{arrival.description}</span>
                      <span className="shrink-0 text-right text-xs text-ink-muted">
                        <span className="block font-semibold text-ink">
                          {formatQuantity(arrival.total)} u
                        </span>
                        {formatTime(arrival.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function LiveIndicator({
  status,
  lastEventAt,
}: {
  status: LiveStatus | null;
  lastEventAt: number | null;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (status === null) return null;
  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-2 rounded-sm bg-short/10 px-2.5 py-1 text-sm font-semibold text-short">
        <WifiOff className="size-4" aria-hidden="true" />
        Sin conexión en vivo · recarga para ver lo último
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold" role="status">
      <span className="relative flex size-2.5">
        {status === "live" ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-matched/60 motion-reduce:hidden" />
        ) : null}
        <span
          className={cn(
            "relative size-2.5 rounded-full",
            status === "live" ? "bg-matched" : "bg-amber",
          )}
        />
      </span>
      {status === "live" ? (
        <>
          En vivo
          {lastEventAt ? (
            <span className="font-normal text-ink-muted">
              · último conteo {formatRelative(new Date(lastEventAt))}
            </span>
          ) : null}
        </>
      ) : (
        "Conectando…"
      )}
    </span>
  );
}

/** One track for the whole session, split by line: filled where counted, hollow where pending. */
function TrunkLine({ lines, total }: { lines: Overview["lines"]; total: number }) {
  if (total === 0) return null;
  return (
    <div className="px-5 pb-5">
      <div className="flex h-3 gap-[3px]" role="img" aria-label="Avance por equipo">
        {lines.map((line) => {
          const products = line.stations.reduce((sum, s) => sum + s.products, 0);
          const counted = line.stations.reduce((sum, s) => sum + s.counted, 0);
          if (products === 0) return null;
          const ink = line.code ? lineInk(line.code).ink : "#8A90A6";
          return (
            <div
              key={line.teamId ?? "none"}
              className="relative overflow-hidden rounded-full"
              style={{ flexGrow: products, backgroundColor: `${ink}33` }}
              title={`${line.code ? teamLabel(line.code) : "Sin equipo"}: ${formatInteger(counted)} de ${formatInteger(products)}`}
            >
              <div
                className="h-full"
                style={{ width: `${ratio(counted, products) * 100}%`, backgroundColor: ink }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" className="fill-panel stroke-ink" strokeWidth="2.5" />
        </svg>
        Pendiente
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" className="fill-ink stroke-ink" strokeWidth="2.5" />
        </svg>
        Proveedor contado
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 12 10" className="h-2.5 w-3" aria-hidden="true">
          <path d="M1 1h10l-5 8z" className="fill-short" />
        </svg>
        Faltantes
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 12 10" className="h-2.5 w-3" aria-hidden="true">
          <path d="M1 9h10l-5-8z" className="fill-over" />
        </svg>
        Sobrantes
      </li>
    </ul>
  );
}

export function LineChip({ code }: { code: number | null }) {
  if (code === null) {
    return (
      <span className="inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-rule-strong/50 text-xs font-bold text-ink-muted">
        —
      </span>
    );
  }
  const ink = lineInk(code);
  return (
    <span
      className="inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-sm text-xs font-bold"
      style={{ backgroundColor: ink.ink, color: ink.onInk }}
    >
      {teamLabel(code)}
    </span>
  );
}

function LinesTable({ sessionCode, lines }: { sessionCode: number; lines: Overview["lines"] }) {
  if (lines.length === 0) return null;
  const rows = lines.map((line) => {
    const products = line.stations.reduce((sum, s) => sum + s.products, 0);
    const counted = line.stations.reduce((sum, s) => sum + s.counted, 0);
    return {
      line,
      products,
      counted,
      short: line.stations.reduce((sum, s) => sum + s.short, 0),
      over: line.stations.reduce((sum, s) => sum + s.over, 0),
      value: line.stations.reduce((sum, s) => sum + s.differenceValue, 0),
    };
  });
  const scale = Math.max(1, ...rows.map((row) => row.products));

  return (
    <section
      aria-labelledby="lineas"
      className="overflow-hidden rounded border border-rule bg-panel"
    >
      <header className="flex items-baseline justify-between border-b border-rule px-5 py-3">
        <h2 id="lineas" className="font-bold">
          Equipos
        </h2>
        <Link
          href={`/tomas/${sessionCode}/equipos`}
          className="text-sm font-semibold text-link hover:underline"
        >
          Organizar equipos
        </Link>
      </header>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="lineas">
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
              <th scope="col" className="px-5 py-2.5">
                Equipo
              </th>
              <th scope="col" className="w-[36%] px-3 py-2.5">
                Avance
              </th>
              <th scope="col" className="px-3 py-2.5 text-right">
                Faltantes
              </th>
              <th scope="col" className="px-3 py-2.5 text-right">
                Sobrantes
              </th>
              <th scope="col" className="px-5 py-2.5 text-right">
                Diferencia
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ line, products, counted, short, over, value }) => {
              const ink = line.code ? lineInk(line.code).ink : "#8A90A6";
              return (
                <tr key={line.teamId ?? "none"} className="border-b border-rule last:border-0">
                  <th scope="row" className="px-5 py-2.5 text-left font-semibold">
                    <span className="flex items-center gap-3">
                      <LineChip code={line.code} />
                      <span className="truncate">{line.name}</span>
                      {line.code ? (
                        <span className="whitespace-nowrap text-xs font-normal text-ink-muted">
                          {line.members} {line.members === 1 ? "persona" : "personas"}
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative h-2 min-w-[8rem] flex-1 rounded-full bg-rule/70"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${(products / scale) * 100}%`,
                            backgroundColor: `${ink}38`,
                          }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${(counted / scale) * 100}%`, backgroundColor: ink }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-ink-muted">
                        <span className="font-semibold text-ink">{formatInteger(counted)}</span>/
                        {formatInteger(products)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">{short ? formatInteger(short) : "—"}</td>
                  <td className="px-3 py-2.5 text-right">{over ? formatInteger(over) : "—"}</td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-5 py-2.5 text-right font-semibold",
                      value < 0 && "text-short",
                      value > 0 && "text-over",
                    )}
                  >
                    {formatSignedMoney(value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
