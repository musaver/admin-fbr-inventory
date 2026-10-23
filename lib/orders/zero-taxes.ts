/**
 * Helpers for the "Make taxes zero" checkbox on the add/edit order pages.
 *
 * Form values can be numbers or in-progress strings (e.g. "12."), so everything is
 * read through Number(). `priceExcludingTax`, `priceIncludingTax` and `taxAmount`
 * always share the same scale on a given page (per-unit on the edit page; scaled
 * together by quantity on the add page), so `incl - tax` is the excl-tax price.
 */
export interface TaxFields {
  taxAmount?: number | string | null;
  taxPercentage?: number | string | null;
  priceIncludingTax?: number | string | null;
  priceExcludingTax?: number | string | null;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Returns a copy with Tax Percentage and Tax Amount at 0 and Price Including Tax reset to the excl-tax price. */
export function zeroTaxFields<T extends TaxFields>(item: T): T {
  const tax = Number(item.taxAmount) || 0;
  const incl = Number(item.priceIncludingTax) || 0;
  const excl = Number(item.priceExcludingTax) || 0;
  const priceIncludingTax = excl > 0 ? excl : Math.max(0, round2(incl - tax));
  return { ...item, taxAmount: 0, taxPercentage: 0, priceIncludingTax };
}

/** True when the item carries no tax at all (0% and 0 amount). */
export function isTaxFree(item: TaxFields): boolean {
  return (Number(item.taxPercentage) || 0) === 0 && (Number(item.taxAmount) || 0) === 0;
}

/** "Add additional tax" checkbox: Further Tax 1 = this percentage of the per-unit price excluding tax. */
export const ADDITIONAL_TAX_RATE = 4; // percent, default
export const ADDITIONAL_TAX_RATE_OPTIONS = [1, 2, 3, 4, 5]; // percent presets in the dropdown

export interface AdditionalTaxFields {
  priceExcludingTax?: number | string | null;
  furtherTax?: number | string | null;
}

/** Returns a copy with Further Tax 1 set to `ratePercent`% of Price Excluding Tax when `on`, or 0 when off. */
export function applyAdditionalTax<T extends AdditionalTaxFields>(item: T, on: boolean, ratePercent: number = ADDITIONAL_TAX_RATE): T {
  const excl = Number(item.priceExcludingTax) || 0;
  const rate = Number(ratePercent) || 0;
  return { ...item, furtherTax: on ? round2(excl * rate / 100) : 0 };
}

/** True when the item's Further Tax 1 equals `ratePercent`% of its excl-tax price (within a cent) and is non-zero. */
export function hasAdditionalTax(item: AdditionalTaxFields, ratePercent: number = ADDITIONAL_TAX_RATE): boolean {
  const excl = Number(item.priceExcludingTax) || 0;
  const further = Number(item.furtherTax) || 0;
  return further > 0 && Math.abs(further - round2(excl * ratePercent / 100)) <= 0.01;
}

/**
 * Finds the common additional-tax percentage (2 dp) across items, or null when the items
 * have no further tax or disagree. Used to restore the checkbox + rate when an order is reopened.
 */
export function detectAdditionalTaxRate(items: AdditionalTaxFields[]): number | null {
  const priced = items.filter(i => (Number(i.priceExcludingTax) || 0) > 0);
  if (priced.length === 0) return null;
  let rate: number | null = null;
  for (const item of priced) {
    const excl = Number(item.priceExcludingTax) || 0;
    const further = Number(item.furtherTax) || 0;
    if (further <= 0) return null;
    const r = round2((further / excl) * 100);
    if (rate === null) rate = r;
    else if (Math.abs(r - rate) > 0.05) return null;
    if (Math.abs(further - round2(excl * rate / 100)) > 0.01) return null;
  }
  return rate;
}
