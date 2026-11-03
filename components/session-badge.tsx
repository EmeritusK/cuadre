import { cn } from "@/lib/utils";

const META = {
  draft: { label: "Preparando", className: "border-rule-strong/40 text-ink-muted" },
  counting: { label: "Contando", className: "border-amber bg-amber text-night" },
  closed: { label: "Cerrada", className: "border-rule-strong bg-panel-sunken text-ink" },
} as const;

export function SessionBadge({ status }: { status: keyof typeof META }) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em]",
        meta.className,
      )}
    >
      {status === "counting" ? (
        <span className="size-1.5 rounded-full bg-night" aria-hidden="true" />
      ) : null}
      {meta.label}
    </span>
  );
}
