export type CountInput = {
  pallets: number;
  layers: number;
  boxes: number;
  units: number;
  unitsPerBox: number;
};

export type CountStatus = "pendiente" | "cuadrado" | "faltante" | "sobrante";

/**
 * Units counted in one event: pallets × layers × boxes per layer × units per box,
 * plus loose units. Mirrors the generated `counts.total` column in the database.
 */
export function countTotal({ pallets, layers, boxes, units, unitsPerBox }: CountInput) {
  return pallets * layers * boxes * unitsPerBox + units;
}

export function countStatus(systemQty: number, countedQty: number, events: number): CountStatus {
  if (events === 0) return "pendiente";
  if (countedQty === systemQty) return "cuadrado";
  return countedQty < systemQty ? "faltante" : "sobrante";
}

/** Dollar impact of a difference, rounded to cents like the database view. */
export function differenceValue(systemQty: number, countedQty: number, unitCost: number) {
  return Math.round((countedQty - systemQty) * unitCost * 100) / 100;
}
