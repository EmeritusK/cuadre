import { cn } from "@/lib/utils";

/** Interchange mark: four line inks meeting at one station. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path d="M2 16h28" stroke="#E21D2D" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16 2v28" stroke="#1E5BFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M6 6l20 20" stroke="#FFC20E" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 6L6 26" stroke="#1E9E45" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="6.5" fill="currentColor" className="text-night" />
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="#F4F1EA" strokeWidth="2.5" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="text-xl font-extrabold tracking-[0.04em]">CUADRE</span>
    </span>
  );
}
