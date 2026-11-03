"use client";

import {
  ArrowLeftRight,
  Boxes,
  FileUp,
  LayoutGrid,
  ListChecks,
  Menu,
  Settings,
  Waypoints,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { sessionLabel } from "@/lib/lines";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

export type RailSession = {
  code: number;
  name: string;
  warehouse: string | null;
  status: "draft" | "counting" | "closed";
};

type RailProps = {
  orgName: string;
  current: RailSession | null;
  user: { name: string; email: string };
  organizations: { id: string; name: string }[];
  activeOrgId: string;
  canImport: boolean;
};

const STATUS_LABEL = { draft: "Preparando", counting: "Contando", closed: "Cerrada" } as const;

function useSessionCode(fallback: number | null) {
  const pathname = usePathname();
  const match = pathname.match(/^\/tomas\/(\d+)/);
  return match ? Number(match[1]) : fallback;
}

function RailContent({ orgName, current, user, organizations, activeOrgId, canImport }: RailProps) {
  const pathname = usePathname();
  const code = useSessionCode(current?.code ?? null);
  const viewingOther = code !== null && current !== null && code !== current.code;

  const sessionLinks =
    code === null
      ? []
      : [
          { href: `/tomas/${code}`, label: "Resumen", icon: LayoutGrid, exact: true },
          { href: `/tomas/${code}/productos`, label: "Productos", icon: Boxes },
          { href: `/tomas/${code}/equipos`, label: "Equipos", icon: Waypoints },
        ];

  const orgLinks = [
    { href: "/tomas", label: "Todas las tomas", icon: ListChecks, exact: true },
    ...(canImport ? [{ href: "/tomas/nueva", label: "Importar inventario", icon: FileUp }] : []),
    { href: "/configuracion", label: "Configuración", icon: Settings },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="px-1">
        <Brand />
        <p className="mt-2 text-sm leading-snug text-night-muted">{orgName}</p>
      </div>

      {current ? (
        <Link
          href={`/tomas/${current.code}`}
          className="group block rounded border border-night-fg/25 px-3 py-3 transition-colors hover:border-night-fg/60"
        >
          <span className="block whitespace-nowrap font-display text-[1.75rem] font-bold leading-none tracking-[0.03em]">
            {sessionLabel(current.code)}
          </span>
          <span className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-sm text-night-muted">
              {current.warehouse ?? current.name}
            </span>
            <SessionStatus status={current.status} />
          </span>
        </Link>
      ) : null}

      <nav aria-label="Principal" className="grid gap-5">
        {sessionLinks.length > 0 ? (
          <div className="grid gap-0.5">
            <p className="flex items-center gap-1.5 px-3 pb-1 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-night-muted">
              {viewingOther ? (
                <>
                  <ArrowLeftRight className="size-3" aria-hidden="true" />
                  Viendo {sessionLabel(code!)}
                </>
              ) : (
                sessionLabel(code!)
              )}
            </p>
            {sessionLinks.map((link) => (
              <RailLink key={link.href} {...link} active={isActive(link.href, link.exact)} />
            ))}
          </div>
        ) : null}
        <div className="grid gap-0.5">
          {orgLinks.map((link) => (
            <RailLink key={link.href} {...link} active={isActive(link.href, link.exact)} />
          ))}
        </div>
      </nav>

      <div className="mt-auto">
        <UserMenu user={user} organizations={organizations} activeOrgId={activeOrgId} />
      </div>
    </div>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded px-3 py-2 text-[0.9375rem] font-medium transition-colors",
        active
          ? "bg-night-fg text-night"
          : "text-night-fg/80 hover:bg-night-raised hover:text-night-fg",
      )}
    >
      <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

function SessionStatus({ status }: { status: RailSession["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.08em]",
        status === "counting" && "bg-amber text-night",
        status === "draft" && "bg-night-raised text-night-fg",
        status === "closed" && "bg-night-fg/15 text-night-fg",
      )}
    >
      {status === "counting" ? (
        <span className="size-1.5 rounded-full bg-night" aria-hidden="true" />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Rail(props: RailProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto bg-night text-night-fg lg:block">
        <RailContent {...props} />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-night px-4 text-night-fg lg:hidden">
        <Brand />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className="inline-flex size-10 items-center justify-center rounded hover:bg-night-raised"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-night/60" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] overflow-y-auto bg-night text-night-fg shadow-[8px_0_32px_rgba(0,0,0,0.35)]">
              <Dialog.Title className="sr-only">Menú</Dialog.Title>
              <Dialog.Close
                className="absolute right-3 top-4 inline-flex size-9 items-center justify-center rounded hover:bg-night-raised"
                aria-label="Cerrar menú"
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
              <RailContent {...props} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
