"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { STATUS_META } from "@/components/status-mark";
import { teamLabel } from "@/lib/lines";
import type { ProductFilters as Filters, SortKey, StatusFilter } from "@/lib/products/query";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "diferencias", label: "Con diferencia" },
  { value: "faltante", label: STATUS_META.faltante.label },
  { value: "sobrante", label: STATUS_META.sobrante.label },
  { value: "cuadrado", label: STATUS_META.cuadrado.label },
  { value: "pendiente", label: STATUS_META.pendiente.label },
];

const selectClass =
  "h-10 rounded border border-rule-strong/40 bg-panel pl-3 pr-8 text-base sm:text-sm text-ink hover:border-rule-strong/70 focus-visible:border-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30";

type Props = {
  filters: Filters;
  suppliers: { id: string; name: string }[];
  teams: { id: string; code: number; name: string }[];
  sorts: { value: SortKey; label: string }[];
};

export function ProductFilters({ filters, suppliers, teams, sorts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const lastPushed = useRef(filters.q);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("pagina");
    next.delete("producto");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Debounced search: one request per pause in typing, not per keystroke.
  useEffect(() => {
    if (q === lastPushed.current) return;
    const id = setTimeout(() => {
      lastPushed.current = q;
      update({ q: q.trim() || null });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por código o descripción"
            aria-label="Buscar productos"
            className="h-10 w-full rounded border border-rule-strong/40 bg-panel pl-9 pr-9 text-base sm:text-sm placeholder:text-ink-muted hover:border-rule-strong/70 focus-visible:border-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30"
          />
          {pending ? (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-muted"
              aria-label="Cargando"
            />
          ) : null}
        </div>
        <label className="sr-only" htmlFor="filtro-proveedor">
          Proveedor
        </label>
        <select
          id="filtro-proveedor"
          className={cn(selectClass, "max-w-[16rem]")}
          value={filters.supplier ?? ""}
          onChange={(event) => update({ proveedor: event.target.value || null })}
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filtro-equipo">
          Equipo
        </label>
        <select
          id="filtro-equipo"
          className={selectClass}
          value={filters.team ?? ""}
          onChange={(event) => update({ equipo: event.target.value || null })}
        >
          <option value="">Todos los equipos</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {teamLabel(team.code)} · {team.name}
            </option>
          ))}
          <option value="ninguno">Sin equipo</option>
        </select>
        <label className="sr-only" htmlFor="orden">
          Ordenar por
        </label>
        <select
          id="orden"
          className={selectClass}
          value={filters.sort}
          onChange={(event) =>
            update({ orden: event.target.value === "impacto" ? null : event.target.value })
          }
        >
          {sorts.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrar por estado"
      >
        {STATUS_OPTIONS.map((option) => {
          const active = filters.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => update({ estado: option.value === "todos" ? null : option.value })}
              className={cn(
                "h-8 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                active
                  ? "border-ink bg-ink text-ground"
                  : "border-rule-strong/30 bg-panel text-ink hover:border-rule-strong/70",
              )}
            >
              {option.label}
            </button>
          );
        })}
        {filters.q || filters.supplier || filters.team || filters.status !== "todos" ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              lastPushed.current = "";
              update({ q: null, proveedor: null, equipo: null, estado: null });
            }}
            className="inline-flex h-8 items-center gap-1 px-2 text-sm font-semibold text-link hover:underline"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
