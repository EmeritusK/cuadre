import { describe, expect, it } from "vitest";
import { parseDecimal, parseInventoryCsv } from "./parse-inventory";

const HEADER =
  "SALDO;CODIGO_PRODUCTO;DESCRIPCION_PRODUCTO;COSTO_PRODUCTO;NOMBRE_BODEGA;PROV;UNIDAD_X_CAJA";

describe("parseDecimal", () => {
  it.each([
    ["3,28034", 3.28034],
    ["1.234,5", 1234.5],
    ["1.234", 1234],
    ["12.5", 12.5],
    ["40", 40],
    ["-2,5", -2.5],
  ])("reads %s as %d", (raw, expected) => {
    expect(parseDecimal(raw)).toBe(expected);
  });

  it.each(["", "abc", "#DIV/0!", "1,2,3"])("rejects %j", (raw) => {
    expect(parseDecimal(raw)).toBeNull();
  });
});

describe("parseInventoryCsv", () => {
  it("parses the accounting export with BOM, semicolons and decimal commas", () => {
    const csv = `﻿${HEADER}\n40;7860000000017;Sal marina 650g C:10U;3,28034;Bodega Norte;Alimentos Andinos S.A.;10\n24;7860000000024;Sal rosada 227g C:24U;1,04;Bodega Norte;Alimentos Andinos S.A.;24\n`;
    const result = parseInventoryCsv(csv);

    expect(result.missingColumns).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      line: 2,
      sku: "7860000000017",
      systemQty: 40,
      unitCost: 3.28034,
      unitsPerBox: 10,
      supplier: "Alimentos Andinos S.A.",
    });
    expect(result.totals).toMatchObject({
      accepted: 2,
      suppliers: 1,
      warehouses: 1,
      systemQty: 64,
    });
    expect(result.totals.systemValue).toBeCloseTo(40 * 3.28034 + 24 * 1.04, 2);
  });

  it("treats #DIV/0! units per box as 1 and reports the fix", () => {
    const result = parseInventoryCsv(`${HEADER}\n5;111;Agua 120ml;0,56;B1;Prov;#DIV/0!`);
    expect(result.rows[0]?.unitsPerBox).toBe(1);
    expect(result.issues).toEqual([
      expect.objectContaining({ line: 2, severity: "fixed", column: "UNIDAD_X_CAJA" }),
    ]);
  });

  it("skips rows with invalid numbers and keeps the rest", () => {
    const result = parseInventoryCsv(
      `${HEADER}\nabc;111;Agua;0,56;B1;Prov;1\n3;222;Jugo;1,10;B1;Prov;6`,
    );
    expect(result.rows.map((row) => row.sku)).toEqual(["222"]);
    expect(result.totals.skipped).toBe(1);
    expect(result.issues[0]).toMatchObject({ line: 2, severity: "error", column: "SALDO" });
  });

  it("rejects repeated product codes after the first occurrence", () => {
    const result = parseInventoryCsv(`${HEADER}\n1;111;A;1;B;P;1\n2;111;A;1;B;P;1`);
    expect(result.rows).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("línea 2");
  });

  it("reports missing columns instead of guessing", () => {
    const result = parseInventoryCsv("SALDO;CODIGO_PRODUCTO\n1;111");
    expect(result.missingColumns).toEqual([
      "DESCRIPCION_PRODUCTO",
      "COSTO_PRODUCTO",
      "NOMBRE_BODEGA",
      "PROV",
      "UNIDAD_X_CAJA",
    ]);
    expect(result.rows).toEqual([]);
  });

  it("accepts comma-separated files and loose header spelling", () => {
    const csv =
      "saldo,codigo producto,descripción producto,costo producto,nombre bodega,prov,unidad x caja\n2,9,Té,1.5,B,P,12";
    const result = parseInventoryCsv(csv);
    expect(result.missingColumns).toEqual([]);
    expect(result.rows[0]).toMatchObject({ sku: "9", unitCost: 1.5, unitsPerBox: 12 });
  });
});
