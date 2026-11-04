"use client";

import { Loader2, Pencil, Plus, Shuffle, Trash2, UserPlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInteger } from "@/lib/format";
import { lineInk, teamLabel } from "@/lib/lines";
import {
  addMember,
  assignSuppliers,
  balanceUnassigned,
  createTeam,
  deleteTeam,
  removeMember,
  renameTeam,
  unassignSupplier,
  type TeamResult,
} from "@/lib/teams/actions";
import { cn } from "@/lib/utils";
import { Sep } from "@/components/ui/sep";

export type BoardSupplier = { id: string; name: string; products: number; counted: number };
export type BoardTeam = {
  id: string;
  code: number;
  name: string;
  members: { id: string; name: string }[];
  suppliers: BoardSupplier[];
};

type Props = {
  sessionId: string;
  teams: BoardTeam[];
  unassigned: BoardSupplier[];
  people: { id: string; name: string; role: string }[];
  readOnly: boolean;
};

const selectClass =
  "h-9 rounded border border-rule-strong/40 bg-panel pl-2.5 pr-8 text-base sm:text-sm hover:border-rule-strong/70 focus-visible:border-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30";

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<TeamResult>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else if (success) toast.success(success);
    });
  return { pending, run };
}

export function TeamBoard({ sessionId, teams, unassigned, people, readOnly }: Props) {
  const [newName, setNewName] = useState("");
  const { pending, run } = useAction();
  const assignedPeople = new Set(teams.flatMap((team) => team.members.map((m) => m.id)));
  const totalProducts =
    teams.reduce((sum, t) => sum + t.suppliers.reduce((s, x) => s + x.products, 0), 0) +
    unassigned.reduce((sum, s) => sum + s.products, 0);
  const scale = Math.max(1, ...teams.map((t) => t.suppliers.reduce((s, x) => s + x.products, 0)));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] [&>*]:min-w-0">
      <div className="grid grid-cols-1 content-start gap-4 [&>*]:min-w-0">
        {!readOnly ? (
          <form
            className="flex flex-wrap items-end gap-2 rounded border border-rule bg-panel p-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                const result = await createTeam(sessionId, newName);
                if (!result.error) setNewName("");
                return result;
              });
            }}
          >
            <div className="grid min-w-0 flex-1 basis-56 gap-1.5">
              <label htmlFor="new-team" className="text-sm font-semibold">
                Nuevo equipo
              </label>
              <Input
                id="new-team"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Pasillo D, Cámara fría…"
                maxLength={40}
              />
            </div>
            <Button type="submit" disabled={pending || !newName.trim()}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Crear equipo
            </Button>
          </form>
        ) : null}

        {teams.length === 0 ? (
          <div className="rounded border border-dashed border-rule-strong/40 px-6 py-12 text-center">
            <p className="font-semibold">Todavía no hay equipos en esta toma.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Crea uno por pasillo o zona de la bodega; cada equipo será una línea en el mapa.
            </p>
          </div>
        ) : (
          teams.map((team) => (
            <TeamLine
              key={team.id}
              sessionId={sessionId}
              team={team}
              scale={scale}
              people={people.filter((p) => !assignedPeople.has(p.id))}
              unassigned={unassigned}
              readOnly={readOnly}
            />
          ))
        )}
      </div>

      <aside aria-labelledby="sin-equipo" className="content-start">
        <UnassignedPool
          sessionId={sessionId}
          teams={teams}
          unassigned={unassigned}
          totalProducts={totalProducts}
          readOnly={readOnly}
        />
      </aside>
    </div>
  );
}

function TeamLine({
  sessionId,
  team,
  scale,
  people,
  unassigned,
  readOnly,
}: {
  sessionId: string;
  team: BoardTeam;
  scale: number;
  people: { id: string; name: string }[];
  unassigned: BoardSupplier[];
  readOnly: boolean;
}) {
  const ink = lineInk(team.code);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [person, setPerson] = useState("");
  const [supplier, setSupplier] = useState("");
  const { pending, run } = useAction();
  const products = team.suppliers.reduce((sum, s) => sum + s.products, 0);

  return (
    <section
      aria-label={`${teamLabel(team.code)} ${team.name}`}
      className="rounded border border-rule bg-panel"
    >
      <header className="flex flex-wrap items-center gap-3 px-4 pt-4">
        <span
          className="inline-flex h-7 items-center rounded-sm px-2.5 font-display text-[0.9375rem] font-semibold tracking-[0.06em]"
          style={{ backgroundColor: ink.ink, color: ink.onInk }}
        >
          {teamLabel(team.code)}
        </span>
        {editing ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                const result = await renameTeam(team.id, name);
                if (!result.error) setEditing(false);
                return result;
              });
            }}
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Nombre del equipo"
              className="h-9 max-w-xs"
              maxLength={40}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={pending}>
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <h2 className="flex-1 text-lg font-bold">{team.name}</h2>
        )}
        {!readOnly && !editing ? (
          <span className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(true)}
              aria-label={`Renombrar ${team.name}`}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${team.name}`}
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar ${teamLabel(team.code)} ${team.name}? Sus proveedores quedarán sin equipo.`,
                  )
                ) {
                  run(() => deleteTeam(team.id), "Equipo eliminado.");
                }
              }}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null}
      </header>

      <div className="flex items-center gap-3 px-4 pt-3 text-sm text-ink-muted">
        <div className="relative h-2 flex-1 rounded-full bg-rule/70" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${(products / scale) * 100}%`, backgroundColor: ink.ink }}
          />
        </div>
        <span className="shrink-0">
          <span className="font-semibold text-ink">{formatInteger(products)}</span> productos
          <Sep />
          {team.suppliers.length} proveedores
        </span>
      </div>

      <div className="grid gap-5 p-4 md:grid-cols-2">
        <div>
          <h3 className="font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Proveedores
          </h3>
          {team.suppliers.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              Sin proveedores. Asígnalos desde la lista de la derecha.
            </p>
          ) : (
            <ul className="relative mt-2 grid gap-1">
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-[9px] top-3 w-1 rounded-full"
                style={{ backgroundColor: ink.ink }}
              />
              {team.suppliers.map((s) => (
                <li key={s.id} className="relative flex items-center gap-2.5 py-1">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative size-[22px] shrink-0 rounded-full border-[3.5px] border-ink",
                      s.counted >= s.products && s.products > 0 ? "bg-ink" : "bg-panel",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name}</span>
                  <span className="shrink-0 text-sm text-ink-muted">
                    {formatInteger(s.products)}
                  </span>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => run(() => unassignSupplier(team.id, s.id))}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-panel-sunken hover:text-ink sm:size-7"
                      aria-label={`Quitar ${s.name} de ${team.name}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {!readOnly && unassigned.length > 0 ? (
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor={`sup-${team.id}`}>
                Agregar proveedor a {team.name}
              </label>
              <select
                id={`sup-${team.id}`}
                className={cn(selectClass, "min-w-0 flex-1")}
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
              >
                <option value="">Agregar proveedor…</option>
                {unassigned.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.products})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                className="h-9"
                disabled={!supplier || pending}
                onClick={() =>
                  run(async () => {
                    const result = await assignSuppliers(sessionId, team.id, [supplier]);
                    if (!result.error) setSupplier("");
                    return result;
                  })
                }
              >
                Agregar
              </Button>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Personas
          </h3>
          {team.members.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              Nadie asignado. Sin personas, nadie puede contar esta línea.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {team.members.map((member) => (
                <li
                  key={member.id}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-ground pl-1 pr-1 text-sm sm:h-8 sm:pr-1.5"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: ink.ink, color: ink.onInk }}
                  >
                    {member.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  {member.name}
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => run(() => removeMember(team.id, member.id))}
                      className="inline-flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-panel-sunken hover:text-ink sm:size-6"
                      aria-label={`Quitar a ${member.name} de ${team.name}`}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {!readOnly && people.length > 0 ? (
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor={`person-${team.id}`}>
                Agregar persona a {team.name}
              </label>
              <select
                id={`person-${team.id}`}
                className={cn(selectClass, "min-w-0 flex-1")}
                value={person}
                onChange={(event) => setPerson(event.target.value)}
              >
                <option value="">Agregar persona…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                className="h-9"
                disabled={!person || pending}
                onClick={() =>
                  run(async () => {
                    const result = await addMember(team.id, person);
                    if (!result.error) setPerson("");
                    return result;
                  })
                }
              >
                <UserPlus aria-hidden="true" />
                Agregar
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function UnassignedPool({
  sessionId,
  teams,
  unassigned,
  totalProducts,
  readOnly,
}: {
  sessionId: string;
  teams: BoardTeam[];
  unassigned: BoardSupplier[];
  totalProducts: number;
  readOnly: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const { pending, run } = useAction();
  const pendingProducts = unassigned.reduce((sum, s) => sum + s.products, 0);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded border border-rule bg-panel xl:sticky xl:top-6">
      <header className="border-b border-rule px-4 py-3">
        <h2 id="sin-equipo" className="font-bold">
          Proveedores sin equipo
        </h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          {unassigned.length === 0 ? (
            "Todos los proveedores tienen equipo."
          ) : (
            <>
              {unassigned.length} proveedores
              <Sep />
              {formatInteger(pendingProducts)} de {formatInteger(totalProducts)} productos
            </>
          )}
        </p>
      </header>

      {unassigned.length > 0 ? (
        <>
          <ul className="max-h-[22rem] divide-y divide-rule overflow-y-auto">
            {unassigned.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-panel-sunken/60">
                  <input
                    type="checkbox"
                    className="size-4 accent-[hsl(var(--cobalt))]"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    disabled={readOnly}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name}</span>
                  <span className="text-sm text-ink-muted">{formatInteger(s.products)}</span>
                </label>
              </li>
            ))}
          </ul>
          {!readOnly ? (
            <div className="grid gap-3 border-t border-rule p-4">
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="assign-target">
                  Equipo destino
                </label>
                <select
                  id="assign-target"
                  className={cn(selectClass, "min-w-0 flex-1")}
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  disabled={teams.length === 0}
                >
                  <option value="">Asignar a…</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {teamLabel(team.code)} · {team.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="h-9"
                  disabled={!target || selected.size === 0 || pending}
                  onClick={() =>
                    run(async () => {
                      const result = await assignSuppliers(sessionId, target, [...selected]);
                      if (!result.error) setSelected(new Set());
                      return result;
                    }, `${selected.size} proveedores asignados.`)
                  }
                >
                  Asignar {selected.size > 0 ? selected.size : ""}
                </Button>
              </div>
              <Button
                variant="secondary"
                disabled={teams.length === 0 || pending}
                onClick={() =>
                  run(async () => {
                    const result = await balanceUnassigned(sessionId);
                    if (!result.error)
                      toast.success(
                        `${result.assigned ?? 0} proveedores repartidos entre ${teams.length} equipos.`,
                      );
                    return { error: result.error };
                  })
                }
              >
                {pending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Shuffle aria-hidden="true" />
                )}
                Repartir automáticamente
              </Button>
              <p className="text-xs leading-relaxed text-ink-muted">
                Reparte los proveedores sin equipo para que cada equipo cuente una cantidad parecida
                de productos.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
