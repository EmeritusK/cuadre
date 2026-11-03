import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded border border-rule-strong/40 bg-panel px-3 text-base sm:text-sm text-ink placeholder:text-ink-muted",
        "transition-colors hover:border-rule-strong/70 focus-visible:border-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30",
        "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-short",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-semibold",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
