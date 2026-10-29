export type SupplierLoad = { id: string; products: number };

/**
 * Spreads suppliers over teams so every team gets a similar number of products:
 * largest suppliers first, each to the currently lightest team. Existing load
 * is taken into account so re-running only tops teams up.
 */
export function balanceSuppliers(
  suppliers: SupplierLoad[],
  teams: { id: string; load: number }[],
): Map<string, string[]> {
  const result = new Map<string, string[]>(teams.map((team) => [team.id, []]));
  if (teams.length === 0) return result;

  const loads = teams.map((team) => ({ ...team }));
  const ordered = [...suppliers].sort(
    (a, b) => b.products - a.products || a.id.localeCompare(b.id),
  );
  for (const supplier of ordered) {
    const lightest = loads.reduce((min, team) => (team.load < min.load ? team : min));
    lightest.load += supplier.products;
    result.get(lightest.id)!.push(supplier.id);
  }
  return result;
}
