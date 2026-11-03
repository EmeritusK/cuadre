import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Brand className="mb-10" />
      <svg viewBox="0 0 160 48" aria-hidden="true" className="mb-6 h-12 w-40">
        <path d="M8 24h112" stroke="#1E5BFF" strokeWidth="6" strokeLinecap="round" />
        <circle
          cx="140"
          cy="24"
          r="10"
          className="fill-ground stroke-ink"
          strokeWidth="4"
          strokeDasharray="4 4"
        />
      </svg>
      <h1 className="text-2xl font-extrabold">Esta estación no existe</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        La toma o página que buscas no está en tu empresa, o el enlace cambió.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Ir a la toma en curso</Link>
      </Button>
    </main>
  );
}
