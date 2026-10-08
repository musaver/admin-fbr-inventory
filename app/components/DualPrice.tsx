'use client';

import React from 'react';
import CurrencySymbol from './CurrencySymbol';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatUsd, toMoneyNumber } from '@/utils/currencyUtils';

export { formatUsd } from '@/utils/currencyUtils';

interface DualPriceProps {
  /** Amount in the tenant currency (PKR). Numbers, numeric strings, null. */
  amount: unknown;
  /** Inline (default) puts the USD text beside the amount; false stacks it underneath. */
  inline?: boolean;
  /** Extra classes for the primary amount span. */
  className?: string;
  /** Extra classes for the USD span. */
  usdClassName?: string;
  /** Rendered before the currency symbol, e.g. "-" for discounts. */
  prefix?: string;
  /** Decimal places for the primary amount (default 2). */
  decimals?: number;
}

/**
 * Renders the amount exactly as the app does today
 * (`<CurrencySymbol />` + toFixed) and, when a PKR -> USD rate is available,
 * a muted "≈ $x.xx" next to or under it.
 */
const DualPrice: React.FC<DualPriceProps> = ({
  amount,
  inline = true,
  className = '',
  usdClassName = '',
  prefix = '',
  decimals = 2,
}) => {
  const { rate } = useExchangeRate();
  const n = toMoneyNumber(amount);
  const display = n === null ? 0 : n;

  // inline-flex so the component can sit inside running text as well as in
  // table cells and flex rows (a block-level flex would force a line break).
  const primary = (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      {prefix}
      <CurrencySymbol />
      {display.toFixed(decimals)}
    </span>
  );

  const usd = n === null ? '' : formatUsd(n, rate);
  if (!usd) return primary;

  const usdNode = (
    <span className={`text-xs text-muted-foreground whitespace-nowrap ${usdClassName}`.trim()}>
      ≈ {prefix}
      {usd}
    </span>
  );

  if (inline) {
    return (
      <span className="inline-flex items-baseline gap-1.5 flex-wrap">
        {primary}
        {usdNode}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      {primary}
      {usdNode}
    </span>
  );
};

export default DualPrice;

interface UsdHintProps {
  amount: unknown;
  className?: string;
  /** Optional suffix such as " per kg". */
  suffix?: string;
}

/**
 * Just the "≈ $x.xx" text, for placing under an input field.
 * Renders nothing when the amount is empty or no rate is available.
 */
export const UsdHint: React.FC<UsdHintProps> = ({ amount, className = '', suffix = '' }) => {
  const { rate } = useExchangeRate();
  const usd = formatUsd(amount, rate);
  if (!usd) return null;
  return (
    <p className={`text-xs text-muted-foreground mt-1 ${className}`.trim()}>
      ≈ {usd}
      {suffix}
    </p>
  );
};
