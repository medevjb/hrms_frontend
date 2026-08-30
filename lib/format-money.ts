/**
 * docs/PRD.md §141 — money crosses the wire as a string and is never
 * parsed to a number for arithmetic. This is display-only: group digits
 * and trim to the currency's display precision.
 */
export function formatMoney(value: string, decimals = 2): string {
  const negative = value.trim().startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const shownFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const body = decimals > 0 ? `${grouped}.${shownFraction}` : grouped;

  return negative ? `-${body}` : body;
}
