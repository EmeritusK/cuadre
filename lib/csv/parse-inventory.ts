import Papa from "papaparse";

/** Columns exported by the accounting system, in the names it uses. */
export const COLUMNS = {
  systemQty: "SALDO",
  sku: "CODIGO_PRODUCTO",
  description: "DESCRIPCION_PRODUCTO",
  unitCost: "COSTO_PRODUCTO",
  warehouse: "NOMBRE_BODEGA",
  supplier: "PROV",
  unitsPerBox: "UNIDAD_X_CAJA",
} as const;

type ColumnKey = keyof typeof COLUMNS;

export type ImportRow = {
  line: number;
  sku: string;
  description: string;
  systemQty: number;
  unitCost: number;
  warehouse: string;
  supplier: string;
  unitsPerBox: number;
};

export type ImportIssue = {
  line: number;
  column?: string;
  /** error: the row is skipped. fixed: the row is kept with a corrected value. */
  severity: "error" | "fixed";
  message: string;
};

export type ImportResult = {
  rows: ImportRow[];
  issues: ImportIssue[];
  missingColumns: string[];
  totals: {
    lines: number;
    accepted: number;
    skipped: number;
    suppliers: number;
    warehouses: number;
    systemQty: number;
    systemValue: number;
  };
};

/**
 * Parses a decimal written either as 1.234,56 (es-EC) or 1234.56.
 * Returns null when the text is not a number.
 */
export function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(/\s/g, "");
  if (!text) return null;

  let normalized = text;
  if (text.includes(",")) {
    // Decimal comma: dots are thousands separators.
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
    // 1.234 with no comma is a thousands separator, not a decimal point.
    normalized = text.replace(/\./g, "");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizeHeader(header: string) {
  return header
    .replace(/^﻿/, "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_");
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes(";") ? ";" : ",";
}

export function parseInventoryCsv(input: string): ImportResult {
  const text = input.replace(/^﻿/, "");
  const parsed = Papa.parse<string[]>(text, {
    delimiter: detectDelimiter(text),
    skipEmptyLines: "greedy",
  });

  const [headerRow = [], ...dataRows] = parsed.data;
  const headers = headerRow.map(normalizeHeader);
  const index = Object.fromEntries(
    (Object.keys(COLUMNS) as ColumnKey[]).map((key) => [key, headers.indexOf(COLUMNS[key])]),
  ) as Record<ColumnKey, number>;

  const missingColumns = (Object.keys(COLUMNS) as ColumnKey[])
    .filter((key) => index[key] === -1)
    .map((key) => COLUMNS[key]);

  const empty: ImportResult = {
    rows: [],
    issues: [],
    missingColumns,
    totals: {
      lines: dataRows.length,
      accepted: 0,
      skipped: dataRows.length,
      suppliers: 0,
      warehouses: 0,
      systemQty: 0,
      systemValue: 0,
    },
  };
  if (missingColumns.length > 0) return empty;

  const rows: ImportRow[] = [];
  const issues: ImportIssue[] = [];
  const seenSku = new Map<string, number>();

  dataRows.forEach((cells, offset) => {
    const line = offset + 2; // 1-based, after the header
    const cell = (key: ColumnKey) => (cells[index[key]] ?? "").trim();
    const rowIssues: ImportIssue[] = [];
    const error = (column: string, message: string) =>
      rowIssues.push({ line, column, severity: "error", message });

    const sku = cell("sku");
    const description = cell("description").replace(/\s+/g, " ");
    const supplier = cell("supplier").replace(/\s+/g, " ");
    const warehouse = cell("warehouse").replace(/\s+/g, " ");
    const systemQty = parseDecimal(cell("systemQty"));
    const unitCost = parseDecimal(cell("unitCost"));

    if (!sku) error(COLUMNS.sku, "Falta el código del producto");
    if (!description) error(COLUMNS.description, "Falta la descripción");
    if (!supplier) error(COLUMNS.supplier, "Falta el proveedor");
    if (systemQty === null)
      error(COLUMNS.systemQty, `Saldo "${cell("systemQty")}" no es un número`);
    if (unitCost === null) error(COLUMNS.unitCost, `Costo "${cell("unitCost")}" no es un número`);
    else if (unitCost < 0) error(COLUMNS.unitCost, "El costo no puede ser negativo");

    const previousLine = sku ? seenSku.get(sku) : undefined;
    if (previousLine !== undefined) {
      error(COLUMNS.sku, `Código repetido; ya aparece en la línea ${previousLine}`);
    }

    let unitsPerBox = parseDecimal(cell("unitsPerBox"));
    if (unitsPerBox === null || unitsPerBox < 1 || !Number.isInteger(unitsPerBox)) {
      rowIssues.push({
        line,
        column: COLUMNS.unitsPerBox,
        severity: "fixed",
        message: `Unidades por caja "${cell("unitsPerBox") || "vacío"}" se tomó como 1`,
      });
      unitsPerBox = 1;
    }

    issues.push(...rowIssues);
    if (rowIssues.some((issue) => issue.severity === "error")) return;

    if (sku) seenSku.set(sku, line);
    rows.push({
      line,
      sku,
      description,
      systemQty: systemQty!,
      unitCost: unitCost!,
      warehouse: warehouse || "Sin bodega",
      supplier,
      unitsPerBox,
    });
  });

  return {
    rows,
    issues,
    missingColumns,
    totals: {
      lines: dataRows.length,
      accepted: rows.length,
      skipped: dataRows.length - rows.length,
      suppliers: new Set(rows.map((row) => row.supplier)).size,
      warehouses: new Set(rows.map((row) => row.warehouse)).size,
      systemQty: rows.reduce((sum, row) => sum + row.systemQty, 0),
      systemValue:
        Math.round(rows.reduce((sum, row) => sum + row.systemQty * row.unitCost, 0) * 100) / 100,
    },
  };
}
