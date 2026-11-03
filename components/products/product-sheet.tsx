"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronUp, Flag, Loader2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { StatusMark } from "@/components/status-mark";
import { Button } from "@/components/ui/button";
import type { CountStatus } from "@/lib/counts/compute";
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatMoney,
  formatQuantity,
  formatSignedMoney,
  formatSignedQuantity,
} from "@/lib/format";
import { setRecountRequested } from "@/lib/products/actions";
import type { ProductDetail } from "@/lib/products/query";
import { cn } from "@/lib/utils";
import { Sep } from "@/components/ui/sep";

const CONDITION = { bueno: "Bueno", averiado: "Averiado", vencido: "Vencido" } as const;

type Props = {
  detail: ProductDetail;
  previousId: string | null;
  nextId: string | null;
  canManage: boolean;
  readOnly: boolean;
};

/**
 * Side panel with one product's reconciliation and count history.
 * J / K move to the next and previous product of the current list.
 */
export function ProductSheet({ detail, previousId, nextId, canManage, readOnly }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { product, counts } = detail;
  const status = product.status as CountStatus;

  const go = (productId: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (productId) next.set("producto", productId);
    else next.delete("producto");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
      if (event.key === "j" && nextId) go(nextId);
      if (event.key === "k" && previousId) go(previousId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleRecount = () =>
    startTransition(async () => {
      const result = await setRecountRequested(product.id!, !product.recount_requested);
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          product.recount_requested ? "Recuento retirado." : "Recuento pedido al equipo.",
        );
        router.refresh();
      }
    });

  const differenceValue = Number(product.difference_value);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && go(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-night/30" />
        <Dialog.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="fixed inset-y-0 right-0 z-50 flex w-[min(30rem,100vw)] animate-sheet-in flex-col border-l border-rule bg-panel shadow-[-16px_0_40px_-12px_rgba(11,18,48,0.3)] motion-reduce:animate-none"
        >
          <header className="flex items-start gap-3 border-b border-rule px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-muted">{product.sku}</p>
              <Dialog.Title className="mt-0.5 text-lg font-bold leading-snug">
                {product.description}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink-muted">
                {product.supplier_name}
                <Sep />
                {formatInteger(Number(product.units_per_box))} u por caja
                <Sep />
                {formatMoney(Number(product.unit_cost))} c/u
              </Dialog.Description>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={!previousId}
                onClick={() => go(previousId)}
                aria-label="Producto anterior (K)"
              >
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!nextId}
                onClick={() => go(nextId)}
                aria-label="Producto siguiente (J)"
              >
                <ChevronDown aria-hidden="true" />
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar">
                  <X aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <dl className="grid grid-cols-3 border-b border-rule">
              {[
                ["Sistema", formatQuantity(Number(product.system_qty))],
                ["Contado", formatQuantity(Number(product.counted_qty))],
                ["Diferencia", formatSignedQuantity(Number(product.difference))],
              ].map(([label, value], index) => (
                <div key={label} className={cn("px-5 py-4", index > 0 && "border-l border-rule")}>
                  <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
                  <dd className="mt-1 text-xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
              <StatusMark status={status} />
              {status !== "pendiente" ? (
                <span
                  className={cn(
                    "text-lg font-bold",
                    differenceValue < 0 && "text-short",
                    differenceValue > 0 && "text-over",
                  )}
                >
                  {formatSignedMoney(differenceValue)}
                </span>
              ) : null}
            </div>

            {canManage && !readOnly ? (
              <div className="border-b border-rule px-5 py-4">
                <Button
                  variant={product.recount_requested ? "secondary" : "primary"}
                  onClick={toggleRecount}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Flag aria-hidden="true" />
                  )}
                  {product.recount_requested ? "Retirar pedido de recuento" : "Pedir recuento"}
                </Button>
                <p className="mt-2 text-sm text-ink-muted">
                  {product.recount_requested
                    ? "El equipo lo verá marcado en la app móvil."
                    : "Marca el producto para que el equipo vuelva a contarlo."}
                </p>
              </div>
            ) : null}

            <section aria-labelledby="historial" className="px-5 py-4">
              <h3 id="historial" className="font-bold">
                Conteos ({counts.length})
              </h3>
              {counts.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">
                  Nadie ha contado este producto todavía.
                </p>
              ) : (
                <ol className="mt-3 grid gap-3">
                  {counts.map((count) => (
                    <li key={count.id} className="rounded border border-rule px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-lg font-bold">
                          {formatQuantity(Number(count.total))} u
                        </span>
                        <time className="text-sm text-ink-muted" dateTime={count.created_at}>
                          {formatDateTime(count.created_at)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        {count.pallets} planchas × {count.layers} filas × {count.boxes} cajas ×{" "}
                        {count.units_per_box} u + {count.units} sueltas
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {count.counterName ?? "Contador"}
                        <Sep />
                        Estado {CONDITION[count.condition]}
                        {count.expires_on ? (
                          <>
                            <Sep />
                            Vence {formatDate(count.expires_on)}
                          </>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
