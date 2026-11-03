"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <svg viewBox="0 0 160 48" aria-hidden="true" className="mx-auto mb-6 h-12 w-40">
        <path d="M8 24h56" stroke="#E21D2D" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M96 24h56"
          stroke="#E21D2D"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="2 10"
        />
        <circle cx="80" cy="24" r="10" className="fill-ground stroke-short" strokeWidth="4" />
      </svg>
      <h1 className="text-xl font-bold">Algo se interrumpió</h1>
      <p className="mt-2 text-ink-muted">
        No pudimos cargar esta pantalla. Tus datos están a salvo; vuelve a intentarlo en unos
        segundos.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-ink-muted">Código: {error.digest}</p> : null}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}
