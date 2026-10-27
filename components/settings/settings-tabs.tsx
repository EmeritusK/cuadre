"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/configuracion", label: "Empresa y miembros" },
  { href: "/configuracion/cuenta", label: "Mi cuenta" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de configuración" className="flex gap-1 border-b border-rule">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-[3px] px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-scarlet text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
