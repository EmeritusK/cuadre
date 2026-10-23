import { describe, expect, it } from "vitest";
import { countStatus, countTotal, differenceValue } from "./compute";

describe("countTotal", () => {
  it("multiplies pallets, layers, boxes and units per box, then adds loose units", () => {
    expect(countTotal({ pallets: 2, layers: 4, boxes: 6, unitsPerBox: 12, units: 5 })).toBe(581);
  });

  it("counts only loose units when there are no full boxes", () => {
    expect(countTotal({ pallets: 1, layers: 1, boxes: 0, unitsPerBox: 24, units: 7 })).toBe(7);
  });
});

describe("countStatus", () => {
  it.each([
    [100, 0, 0, "pendiente"],
    [100, 100, 2, "cuadrado"],
    [100, 96, 1, "faltante"],
    [100, 110, 3, "sobrante"],
    [0, 0, 1, "cuadrado"],
  ] as const)("system %d, counted %d, %d events → %s", (system, counted, events, status) => {
    expect(countStatus(system, counted, events)).toBe(status);
  });
});

describe("differenceValue", () => {
  it("values shortages as negative dollars", () => {
    expect(differenceValue(480, 396, 2.6)).toBe(-218.4);
  });

  it("rounds to cents", () => {
    expect(differenceValue(10, 11, 3.28034)).toBe(3.28);
  });
});
