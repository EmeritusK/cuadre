import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  error: { icon: AlertTriangle, className: "border-short/40 bg-short/5 text-short" },
  success: { icon: CheckCircle2, className: "border-matched/40 bg-matched/5 text-matched" },
  info: { icon: Info, className: "border-rule bg-panel-sunken text-ink" },
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded border px-3.5 py-3 text-sm leading-relaxed", toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="text-ink">{children}</div>
    </div>
  );
}
