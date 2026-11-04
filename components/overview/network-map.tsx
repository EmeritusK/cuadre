"use client";

import Link from "next/link";
import { formatInteger, formatSignedMoney } from "@/lib/format";
import { lineInk, teamLabel } from "@/lib/lines";
import type { LineData, StationData } from "@/lib/sessions/overview";
import { cn } from "@/lib/utils";

const ROW = 108;
const TOP = 36;
const HUB_X = 30;
const STATION_GAP = 160;
const CHAR_WIDTH = 7.6;
const UNASSIGNED_INK = { ink: "#8A90A6", onInk: "#0B1230" };

type NetworkMapProps = {
  sessionCode: number;
  lines: LineData[];
  /** Supplier ids that just received a count; their stations pulse once. */
  pulses: Record<string, number>;
};

const inkFor = (line: LineData) => (line.code ? lineInk(line.code) : UNASSIGNED_INK);
const lineName = (line: LineData) =>
  line.code ? `${teamLabel(line.code)} ${line.name}` : "Sin equipo";

function describe(station: StationData) {
  return [
    station.name,
    `${formatInteger(station.counted)} de ${formatInteger(station.products)} productos contados`,
    station.short ? `${station.short} faltantes` : null,
    station.over ? `${station.over} sobrantes` : null,
    station.counted ? `diferencia ${formatSignedMoney(station.differenceValue)}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * The count drawn as a transit diagram: every team is a line leaving one
 * interchange, every supplier a station. Hollow stations are pending, the ring
 * fills as products are counted, and markers flag shortages and overages.
 * Below the sm breakpoint the same data renders as vertical strip maps.
 */
export function NetworkMap(props: NetworkMapProps) {
  return (
    <>
      <div className="hidden sm:block">
        <DiagramMap {...props} />
      </div>
      <div className="sm:hidden">
        <StripMaps {...props} />
      </div>
    </>
  );
}

function DiagramMap({ sessionCode, lines, pulses }: NetworkMapProps) {
  const maxStations = Math.max(1, ...lines.map((line) => line.stations.length));
  const labelWidths = lines.map((line) => lineName(line).length * CHAR_WIDTH + 22);
  const runStart = HUB_X + 34 + Math.max(...labelWidths, 80) + 64;
  // Natural size keeps 13px labels at 13px; wide networks scroll instead of shrinking.
  const width = runStart + (maxStations - 1) * STATION_GAP + 90;
  const height = TOP + Math.max(1, lines.length) * ROW;
  const lastY = TOP + (lines.length - 1) * ROW;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="h-auto max-w-none"
      role="group"
      aria-label="Mapa de equipos y proveedores"
    >
      {lines.map((line, index) => {
        const y = TOP + index * ROW;
        const runEnd = runStart + Math.max(0, line.stations.length - 1) * STATION_GAP + 28;
        return (
          <path
            key={line.teamId ?? "none"}
            d={`M${HUB_X} ${y} H${runEnd}`}
            fill="none"
            strokeLinecap="round"
            stroke={inkFor(line).ink}
            strokeWidth={line.code ? 9 : 5}
            strokeDasharray={line.code ? undefined : "1 11"}
          />
        );
      })}

      {/* The interchange every line leaves from: the session itself. */}
      <rect
        x={HUB_X - 14}
        y={TOP - 18}
        width="28"
        height={lastY - TOP + 36}
        rx="14"
        className="fill-panel stroke-ink"
        strokeWidth="5"
      />

      {lines.map((line, index) => {
        const y = TOP + index * ROW;
        const ink = inkFor(line);
        const label = lineName(line);
        return (
          <g key={line.teamId ?? "none"}>
            <g transform={`translate(${HUB_X + 34}, ${y - 13})`}>
              <rect
                width={labelWidths[index]}
                height="26"
                rx="3"
                className={line.code ? undefined : "fill-panel"}
                fill={line.code ? ink.ink : undefined}
                stroke={line.code ? "none" : ink.ink}
                strokeWidth="1.5"
                strokeDasharray={line.code ? undefined : "4 3"}
              />
              <text
                x="11"
                y="17.5"
                fill={line.code ? ink.onInk : undefined}
                className={cn(
                  "font-display text-[15px] font-semibold tracking-[0.06em]",
                  !line.code && "fill-ink-muted",
                )}
              >
                {label}
              </text>
            </g>
            {line.stations.length === 0 ? (
              <text x={runStart} y={y + 34} className="fill-ink-muted text-[13px]">
                Sin proveedores asignados
              </text>
            ) : null}
            {line.stations.map((station, stationIndex) => (
              <DiagramStation
                key={station.supplierId}
                station={station}
                x={runStart + stationIndex * STATION_GAP}
                y={y}
                maxChars={Math.floor((STATION_GAP - 16) / 7.2)}
                pulseKey={pulses[station.supplierId]}
                href={`/tomas/${sessionCode}/productos?proveedor=${station.supplierId}`}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Station states: hollow ring while pending, a thin outer arc as products are
 * counted, solid when the supplier is done. A notch cut into the ring carries
 * the shortage (down) or overage (up) marker.
 */
function StationGlyph({
  station,
  x,
  y,
  r,
}: {
  station: StationData;
  x: number;
  y: number;
  r: number;
}) {
  const progress = station.products > 0 ? station.counted / station.products : 0;
  const done = progress >= 1;
  const arc = r + 5;
  const circumference = 2 * Math.PI * arc;
  const notchX = x + r * 0.78;
  const notchY = y - r * 0.78;
  const flagged = station.short > 0 || station.over > 0;
  return (
    <>
      {!done && progress > 0 ? (
        <>
          <circle cx={x} cy={y} r={arc} fill="none" className="stroke-rule" strokeWidth="3" />
          <circle
            cx={x}
            cy={y}
            r={arc}
            fill="none"
            className="stroke-ink"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circumference * progress} ${circumference}`}
            transform={`rotate(-90 ${x} ${y})`}
          />
        </>
      ) : null}
      <circle
        cx={x}
        cy={y}
        r={r}
        className={done ? "fill-ink stroke-ink" : "fill-panel stroke-ink"}
        strokeWidth="4"
      />
      {flagged ? (
        <>
          <circle cx={notchX} cy={notchY} r="7.5" className="fill-panel" />
          {station.short >= station.over ? (
            <path d={`M${notchX - 5} ${notchY - 3.5} h10 l-5 8 z`} className="fill-short" />
          ) : (
            <path d={`M${notchX - 5} ${notchY + 3.5} h10 l-5 -8 z`} className="fill-over" />
          )}
        </>
      ) : null}
    </>
  );
}

/** Splits a station name into at most two lines that fit under the station. */
function wrapName(name: string, maxChars: number): string[] {
  const words = name.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const current = lines[lines.length - 1]!;
    if (!current || `${current} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = current ? `${current} ${word}` : word;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines.map((line) => (line.length > maxChars ? `${line.slice(0, maxChars - 1)}…` : line));
}

function DiagramStation({
  station,
  x,
  y,
  maxChars,
  pulseKey,
  href,
}: {
  station: StationData;
  x: number;
  y: number;
  maxChars: number;
  pulseKey?: number;
  href: string;
}) {
  const r = 11;
  const nameLines = wrapName(station.name, maxChars);
  const description = describe(station);

  return (
    <Link href={href} aria-label={description} className="group outline-none">
      <title>{description}</title>
      {pulseKey ? (
        <circle
          key={pulseKey}
          cx={x}
          cy={y}
          r={r}
          className="animate-station-pulse fill-none stroke-ink motion-reduce:hidden"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          strokeWidth="3"
        />
      ) : null}
      <circle
        cx={x}
        cy={y}
        r={r + 6}
        className="fill-none stroke-cobalt opacity-0 group-focus-visible:opacity-100"
        strokeWidth="2.5"
      />
      <StationGlyph station={station} x={x} y={y} r={r} />
      <text
        x={x}
        y={y + 38}
        textAnchor="middle"
        className="fill-ink font-display text-[14px] font-semibold uppercase tracking-[0.04em] group-hover:underline"
      >
        {nameLines.map((line, index) => (
          <tspan key={index} x={x} dy={index === 0 ? 0 : 16}>
            {line}
          </tspan>
        ))}
      </text>
      <text
        x={x}
        y={y + 38 + nameLines.length * 16}
        textAnchor="middle"
        className="fill-ink-muted text-[12px]"
      >
        {formatInteger(station.counted)}/{formatInteger(station.products)}
      </text>
    </Link>
  );
}

/** Phone layout: each line as a vertical strip map, the way it is printed above train doors. */
function StripMaps({ sessionCode, lines, pulses }: NetworkMapProps) {
  return (
    <div className="grid gap-6">
      {lines.map((line) => {
        const ink = inkFor(line);
        return (
          <section key={line.teamId ?? "none"} aria-label={lineName(line)}>
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-sm px-2.5 font-display text-[0.9375rem] font-semibold tracking-[0.06em]",
                !line.code && "border border-dashed border-rule-strong/50 text-ink-muted",
              )}
              style={line.code ? { backgroundColor: ink.ink, color: ink.onInk } : undefined}
            >
              {lineName(line)}
            </span>
            {line.stations.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Sin proveedores asignados</p>
            ) : (
              <ol className="relative mt-2">
                <span
                  aria-hidden="true"
                  className="absolute bottom-5 left-[13px] top-5 w-[7px] rounded-full"
                  style={{ backgroundColor: ink.ink, opacity: line.code ? 1 : 0.5 }}
                />
                {line.stations.map((station) => (
                  <li key={station.supplierId}>
                    <Link
                      href={`/tomas/${sessionCode}/productos?proveedor=${station.supplierId}`}
                      aria-label={describe(station)}
                      className="relative flex min-h-12 items-center gap-3 rounded py-1 pr-2 hover:bg-panel-sunken/60"
                    >
                      <svg
                        viewBox="0 0 34 34"
                        className="relative size-[34px] shrink-0 overflow-visible"
                        aria-hidden="true"
                      >
                        {pulses[station.supplierId] ? (
                          <circle
                            key={pulses[station.supplierId]}
                            cx="17"
                            cy="17"
                            r="10"
                            className="animate-station-pulse fill-none stroke-ink motion-reduce:hidden"
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                            strokeWidth="3"
                          />
                        ) : null}
                        <StationGlyph station={station} x={17} y={17} r={10} />
                      </svg>
                      <span className="min-w-0 flex-1 truncate font-display text-[0.9375rem] font-semibold uppercase tracking-[0.04em]">
                        {station.name}
                      </span>
                      <span className="shrink-0 text-sm text-ink-muted">
                        {formatInteger(station.counted)}/{formatInteger(station.products)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
