import { ArrowDown, ArrowUp, Check, Circle } from "lucide-react";
import type { CountStatus } from "@/lib/counts/compute";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  CountStatus,
  { label: string; icon: typeof Check; className: string; dot: string }
> = {
  cuadrado: { label: "Cuadrado", icon: Check, className: "text-matched", dot: "bg-matched" },
  faltante: { label: "Faltante", icon: ArrowDown, className: "text-short", dot: "bg-short" },
  sobrante: { label: "Sobrante", icon: ArrowUp, className: "text-over", dot: "bg-over" },
  pendiente: { label: "Pendiente", icon: Circle, className: "text-pending", dot: "bg-pending" },
};

/** Status as glyph + word, so it never depends on colour alone. */
export function StatusMark({
  status,
  className,
  compact = false,
}: {
  status: CountStatus;
  className?: string;
  compact?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon
        className={cn("size-3.5 shrink-0", status === "pendiente" && "size-3")}
        strokeWidth={2.75}
        aria-hidden="true"
      />
      <span className={cn(compact && "sr-only")}>{meta.label}</span>
    </span>
  );
}
