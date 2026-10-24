"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Lock, Play } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sessionLabel } from "@/lib/lines";
import { closeSession, startCounting } from "@/lib/sessions/actions";

type Props = {
  code: number;
  status: "draft" | "counting" | "closed";
  pendingProducts: number;
  unassignedSuppliers: number;
};

export function SessionActions({ code, status, pendingProducts, unassignedSuppliers }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = (action: () => Promise<{ error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else {
        toast.success(success);
        setOpen(false);
      }
    });

  if (status === "draft") {
    return (
      <Button
        onClick={() => run(() => startCounting(code), "Conteo iniciado. La app móvil ya puede registrar.")}
        disabled={pending}
        title={unassignedSuppliers ? `${unassignedSuppliers} proveedores siguen sin equipo` : undefined}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
        Iniciar conteo
      </Button>
    );
  }

  if (status !== "counting") return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary">
          <Lock aria-hidden="true" />
          Cerrar toma
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-night/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-rule bg-panel p-6 shadow-[0_24px_48px_-12px_rgba(11,18,48,0.4)]">
          <Dialog.Title className="text-lg font-bold">¿Cerrar {sessionLabel(code)}?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-muted">
            Una toma cerrada queda en solo lectura: la app móvil deja de aceptar conteos y no se puede
            reabrir.
            {pendingProducts > 0 ? (
              <strong className="mt-2 block text-short">
                Quedan {pendingProducts} productos sin contar; se cerrarán como pendientes.
              </strong>
            ) : null}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">Seguir contando</Button>
            </Dialog.Close>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() => run(() => closeSession(code), `${sessionLabel(code)} cerrada.`)}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock aria-hidden="true" />}
              Cerrar toma
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
