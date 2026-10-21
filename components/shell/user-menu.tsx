"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronsUpDown, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/auth/actions";
import { switchOrganization } from "@/lib/org/actions";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user: { name: string; email: string };
  organizations: { id: string; name: string }[];
  activeOrgId: string;
};

const itemClass =
  "flex cursor-default select-none items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-panel-sunken";

export function UserMenu({ user, organizations, activeOrgId }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-night-raised data-[state=open]:bg-night-raised">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-night-fg text-sm font-bold text-night"
        >
          {initials || <User className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-night-muted">{user.email}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-night-muted" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-64 rounded border border-rule bg-panel p-1.5 text-ink shadow-[0_12px_32px_-8px_rgba(11,18,48,0.35)]"
        >
          {organizations.length > 1 ? (
            <>
              <DropdownMenu.Label className="px-2.5 pb-1 pt-1.5 text-2xs font-bold uppercase text-ink-muted">
                Empresa
              </DropdownMenu.Label>
              {organizations.map((org) => (
                <DropdownMenu.Item
                  key={org.id}
                  className={itemClass}
                  onSelect={() => switchOrganization(org.id)}
                >
                  <Check
                    className={cn("size-4", org.id === activeOrgId ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="truncate">{org.name}</span>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1.5 h-px bg-rule" />
            </>
          ) : null}
          <DropdownMenu.Label className="px-2.5 pb-1 pt-1.5 text-2xs font-bold uppercase text-ink-muted">
            Tema
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme}>
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Oscuro", icon: Moon },
              { value: "system", label: "Según el sistema", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <DropdownMenu.RadioItem key={value} value={value} className={itemClass}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
                <DropdownMenu.ItemIndicator className="ml-auto">
                  <Check className="size-4" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="my-1.5 h-px bg-rule" />
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/configuracion/cuenta">
              <User className="size-4" aria-hidden="true" />
              Mi cuenta
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => signOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Salir
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
