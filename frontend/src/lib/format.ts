/** Formatting helpers shared by server and client. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Prices are stored as REAL rupees. IEEE-754 doubles cannot represent every
 * decimal exactly, so all money is rounded through here before display or
 * arithmetic. NEVER sum raw float prices into an order total.
 */
export function money(value: number | null | undefined): string {
  return inr.format(Math.round(Number(value ?? 0)));
}

export function moneyExact(value: number | null | undefined): string {
  return inrPaise.format(Number(value ?? 0));
}

/** Round to 2dp, the precision we treat as authoritative for INR. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Order total from line items, computed in paise then converted back. */
export function totalFromLines(lines: { unitPrice: number; quantity: number }[]): number {
  const paise = lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity, 0);
  return round2(paise / 100);
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
