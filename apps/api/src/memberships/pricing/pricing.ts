export const SUPPORTED_MONTHS = [1, 3, 6, 12] as const;
export type RenewalMonths = (typeof SUPPORTED_MONTHS)[number];

const DISCOUNTS: Record<RenewalMonths, number> = { 1: 0, 3: 0.05, 6: 0.1, 12: 0.15 };

export function calculateRenewalPrice(monthlyPriceCents: number, months: RenewalMonths) {
  const discountRate = DISCOUNTS[months];
  const undiscountedCents = monthlyPriceCents * months;
  const discountCents = Math.round(undiscountedCents * discountRate);
  return { months, discountRate, undiscountedCents, discountCents, amountCents: undiscountedCents - discountCents };
}

export function addMonths(start: Date, months: RenewalMonths): Date {
  const result = new Date(start);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
