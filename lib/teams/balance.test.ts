import { describe, expect, it } from "vitest";
import { balanceSuppliers } from "./balance";

describe("balanceSuppliers", () => {
  it("gives the largest suppliers to the lightest teams", () => {
    const result = balanceSuppliers(
      [
        { id: "a", products: 50 },
        { id: "b", products: 40 },
        { id: "c", products: 30 },
        { id: "d", products: 20 },
      ],
      [
        { id: "t1", load: 0 },
        { id: "t2", load: 0 },
      ],
    );
    expect(result.get("t1")).toEqual(["a", "d"]);
    expect(result.get("t2")).toEqual(["b", "c"]);
  });

  it("tops up teams that already carry products", () => {
    const result = balanceSuppliers([{ id: "a", products: 10 }], [
      { id: "busy", load: 100 },
      { id: "idle", load: 5 },
    ]);
    expect(result.get("idle")).toEqual(["a"]);
    expect(result.get("busy")).toEqual([]);
  });

  it("returns empty assignments when there are no teams", () => {
    expect(balanceSuppliers([{ id: "a", products: 1 }], []).size).toBe(0);
  });
});
