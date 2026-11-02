"use client";

import { AlertTriangle, FileSpreadsheet, RefreshCw, Upload, Wrench } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { COLUMNS, parseInventoryCsv, type ImportResult } from "@/lib/csv/parse-inventory";
import { formatInteger, formatMoney, formatQuantity } from "@/lib/format";
import { importSession, type ImportState } from "@/lib/import/actions";
import { cn } from "@/lib/utils";

const STEPS = ["Archivo", "Revisión", "Confirmar"] as const;
const PREVIEW_ROWS = 12;
const ISSUE_PAGE = 40;

export function ImportWizard({ defaultName }: { defaultName: string }) {
  const [state, action] = useFormState<ImportState, FormData>(importSession, {});
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropId = useId();

  const step = !result ? 0 : result.rows.length > 0 && result.missingColumns.length === 0 ? 2 : 1;

  async function load(next: File | undefined) {
    setReadError(null);
    setShowAllIssues(false);
    if (!next) return;
    if (!/\.(csv|txt)$/i.test(next.name)) {
      setReadError("El archivo debe ser .csv, exportado desde el sistema contable.");
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setReadError("El archivo pesa más de 5 MB.");
      return;
    }
    setFile(next);
    setResult(parseInventoryCsv(await next.text()));

    // Keep the chosen file in the form input, also when it arrived by drag and drop.
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(next);
      inputRef.current.files = transfer.files;
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const errors = useMemo(
    () => result?.issues.filter((i) => i.severity === "error") ?? [],
    [result],
  );
  const fixes = useMemo(() => result?.issues.filter((i) => i.severity === "fixed") ?? [], [result]);
  const visibleIssues = showAllIssues
    ? (result?.issues ?? [])
    : (result?.issues ?? []).slice(0, ISSUE_PAGE);

  return (
    <form action={action} className="grid gap-8">
      <StepLine current={step} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <section aria-labelledby={`${dropId}-title`} className="grid gap-4">
        <h2 id={`${dropId}-title`} className="text-lg font-bold">
          1. Archivo de saldos
        </h2>
        <input
          ref={inputRef}
          id={dropId}
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => load(event.target.files?.[0])}
        />
        {!file ? (
          <label
            htmlFor={dropId}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              load(event.dataTransfer.files[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging
                ? "border-cobalt bg-cobalt/5"
                : "border-rule-strong/30 bg-panel hover:border-rule-strong/60",
            )}
          >
            <Upload className="size-7 text-ink-muted" aria-hidden="true" />
            <span className="text-base font-semibold">Arrastra el CSV aquí o elige un archivo</span>
            <span className="max-w-md text-sm text-ink-muted">
              Columnas esperadas: {Object.values(COLUMNS).join(" · ")}. Separado por punto y coma o
              coma.
            </span>
          </label>
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded border border-rule bg-panel px-4 py-3">
            <FileSpreadsheet className="size-6 text-ink-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="text-sm text-ink-muted">
                {formatInteger(Math.ceil(file.size / 1024))} KB
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              <RefreshCw aria-hidden="true" />
              Cambiar archivo
            </Button>
          </div>
        )}
        {readError ? <Alert tone="error">{readError}</Alert> : null}
      </section>

      {result ? (
        <section aria-labelledby={`${dropId}-review`} className="grid gap-5">
          <h2 id={`${dropId}-review`} className="text-lg font-bold">
            2. Revisión
          </h2>

          {result.missingColumns.length > 0 ? (
            <Alert tone="error">
              Al archivo le faltan columnas: <strong>{result.missingColumns.join(", ")}</strong>.
              Exporta el reporte de saldos completo e inténtalo de nuevo.
            </Alert>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Líneas leídas", formatInteger(result.totals.lines)],
                  ["Productos aceptados", formatInteger(result.totals.accepted)],
                  ["Omitidos", formatInteger(result.totals.skipped)],
                  ["Proveedores", formatInteger(result.totals.suppliers)],
                  ["Unidades en sistema", formatQuantity(result.totals.systemQty)],
                  ["Valor en sistema", formatMoney(result.totals.systemValue)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-panel px-4 py-3">
                    <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
                    <dd className="mt-1 text-lg font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              {result.issues.length > 0 ? (
                <div className="rounded border border-rule bg-panel">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-rule px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-short">
                      <AlertTriangle className="size-4" aria-hidden="true" />
                      {formatInteger(errors.length)} filas omitidas
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                      <Wrench className="size-4" aria-hidden="true" />
                      {formatInteger(fixes.length)} valores corregidos
                    </span>
                  </div>
                  <ul className="max-h-72 divide-y divide-rule overflow-y-auto text-sm">
                    {visibleIssues.map((issue, index) => (
                      <li
                        key={`${issue.line}-${index}`}
                        className="grid grid-cols-[4.5rem_1fr] gap-3 px-4 py-2"
                      >
                        <span className="text-ink-muted">Línea {issue.line}</span>
                        <span className={issue.severity === "error" ? "text-short" : "text-ink"}>
                          {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {result.issues.length > ISSUE_PAGE && !showAllIssues ? (
                    <div className="border-t border-rule px-4 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllIssues(true)}
                      >
                        Ver las {formatInteger(result.issues.length)} observaciones
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Alert tone="success">Todas las filas son válidas.</Alert>
              )}

              {result.rows.length > 0 ? (
                <div className="relative overflow-x-auto rounded border border-rule bg-panel">
                  <table className="w-full min-w-[48rem] text-sm">
                    <caption className="px-4 py-3 text-left text-sm font-semibold">
                      Primeras {Math.min(PREVIEW_ROWS, result.rows.length)} de{" "}
                      {formatInteger(result.rows.length)} filas
                    </caption>
                    <thead>
                      <tr className="border-y border-rule text-left text-xs font-bold uppercase tracking-[0.06em] text-ink-muted">
                        <th scope="col" className="px-4 py-2">
                          Código
                        </th>
                        <th scope="col" className="px-4 py-2">
                          Descripción
                        </th>
                        <th scope="col" className="px-4 py-2">
                          Proveedor
                        </th>
                        <th scope="col" className="px-4 py-2 text-right">
                          Saldo
                        </th>
                        <th scope="col" className="px-4 py-2 text-right">
                          U/caja
                        </th>
                        <th scope="col" className="px-4 py-2 text-right">
                          Costo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.slice(0, PREVIEW_ROWS).map((row) => (
                        <tr key={row.line} className="border-b border-rule last:border-0">
                          <td className="px-4 py-2 text-ink-muted">{row.sku}</td>
                          <td className="px-4 py-2">{row.description}</td>
                          <td className="px-4 py-2">{row.supplier}</td>
                          <td className="px-4 py-2 text-right">{formatQuantity(row.systemQty)}</td>
                          <td className="px-4 py-2 text-right">{row.unitsPerBox}</td>
                          <td className="px-4 py-2 text-right">{formatMoney(row.unitCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section
          aria-labelledby={`${dropId}-confirm`}
          className="grid gap-4 border-t border-rule pt-8"
        >
          <h2 id={`${dropId}-confirm`} className="text-lg font-bold">
            3. Confirmar
          </h2>
          <div className="max-w-md">
            <Field
              id="name"
              label="Nombre de la toma"
              hint="Aparece en la lista de tomas y en las exportaciones."
            >
              <Input
                id="name"
                name="name"
                defaultValue={defaultName}
                required
                aria-describedby="name-hint"
              />
            </Field>
          </div>
          <p className="text-sm text-ink-muted">
            Se creará una toma en preparación con {formatInteger(result!.totals.accepted)} productos
            de {formatInteger(result!.totals.suppliers)} proveedores. Después armarás los equipos e
            iniciarás el conteo.
          </p>
          <SubmitButton size="lg" pendingLabel="Creando toma…" className="justify-self-start">
            Crear toma
          </SubmitButton>
        </section>
      ) : null}
    </form>
  );
}

function StepLine({ current }: { current: number }) {
  return (
    <ol className="flex items-center" aria-label="Pasos de la importación">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2.5" aria-current={active ? "step" : undefined}>
              <span
                aria-hidden="true"
                className={cn(
                  "size-5 shrink-0 rounded-full border-[3.5px]",
                  done && "border-ink bg-ink",
                  active && "border-scarlet bg-panel",
                  !done && !active && "border-rule-strong/30 bg-ground",
                )}
              />
              <span className={cn("text-sm font-semibold", !done && !active && "text-ink-muted")}>
                {label}
                <span className="sr-only">
                  {done ? " (completado)" : active ? " (actual)" : ""}
                </span>
              </span>
            </span>
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn("mx-3 h-1 flex-1 rounded-full", done ? "bg-ink" : "bg-rule")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
