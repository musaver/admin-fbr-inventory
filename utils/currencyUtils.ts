import { AVAILABLE_CURRENCIES, CurrencyCode } from '@/app/contexts/CurrencyContext';

/**
 * Format a number as currency with the given currency code
 */
export const formatCurrency = (
  amount: number, 
  currencyCode: CurrencyCode = 'PKR',
  options: {
    showSymbol?: boolean;
    decimalPlaces?: number;
  } = {}
): string => {
  const { showSymbol = true, decimalPlaces = 2 } = options;
  const currency = AVAILABLE_CURRENCIES[currencyCode];
  
  const formattedAmount = amount.toFixed(decimalPlaces);
  
  if (!showSymbol) {
    return formattedAmount;
  }
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount}${currency.symbol}`;
  }
};

/**
 * Parse a currency string to number
 */
export const parseCurrency = (value: string): number => {
  // Remove all non-digit and non-decimal characters
  const cleanValue = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleanValue) || 0;
};

/**
 * Get currency symbol HTML for a given currency code
 */
export const getCurrencySymbolHtml = (currencyCode: CurrencyCode): string => {
  return AVAILABLE_CURRENCIES[currencyCode].symbol;
};

/**
 * Get currency name for a given currency code
 */
export const getCurrencyName = (currencyCode: CurrencyCode): string => {
  return AVAILABLE_CURRENCIES[currencyCode].name;
};

/**
 * Coerce a monetary value (number, numeric string, null) to a finite number.
 * Returns null when the value is empty or not numeric.
 */
export const toMoneyNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
};

/**
 * Convert a PKR amount to USD using a USD-per-PKR multiplier.
 * Returns null when either input is not usable.
 */
export const toUsdAmount = (pkrAmount: unknown, usdPerPkr: number | null | undefined): number | null => {
  const n = toMoneyNumber(pkrAmount);
  if (n === null || !usdPerPkr || !Number.isFinite(usdPerPkr) || usdPerPkr <= 0) return null;
  return n * usdPerPkr;
};

/**
 * Format a PKR amount as a USD string, e.g. "$1,234.56".
 * Returns an empty string when the conversion is not possible, so it can be
 * appended safely in plain-string contexts (option labels, print HTML).
 */
export const formatUsd = (pkrAmount: unknown, usdPerPkr: number | null | undefined): string => {
  const usd = toUsdAmount(pkrAmount, usdPerPkr);
  if (usd === null) return '';
  const sign = usd < 0 ? '-' : '';
  return `${sign}$${Math.abs(usd).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};