import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded bg-rule/60 motion-reduce:animate-none", className)}
    />
  );
}

/** Page-shaped placeholder: header, a band and a block, matching the app's layout. */
export function PageSkeleton({ label, rows = 8 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="border-b border-rule bg-panel px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6">
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-px overflow-hidden rounded border border-rule">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
