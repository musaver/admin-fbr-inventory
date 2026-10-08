'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { formatUsd, toUsdAmount } from '@/utils/currencyUtils';

export type RateSource = 'manual' | 'live' | 'cached' | 'none';

export interface ExchangeRateInfo {
  usdPerPkr: number | null;
  pkrPerUsd: number | null;
  source: RateSource;
  updatedAt: string | null;
  liveUsdPerPkr: number | null;
  livePkrPerUsd: number | null;
  liveUpdatedAt: string | null;
  overridePkrPerUsd: number | null;
}

const ENDPOINT = '/api/settings/exchange-rate';
const CLIENT_TTL_MS = 5 * 60 * 1000;

// One shared request per page for every mounted hook instance.
let cached: { info: ExchangeRateInfo | null; at: number } | null = null;
let inFlight: Promise<ExchangeRateInfo | null> | null = null;
const listeners = new Set<(info: ExchangeRateInfo | null) => void>();

async function loadRate(force = false): Promise<ExchangeRateInfo | null> {
  if (!force && cached && Date.now() - cached.at < CLIENT_TTL_MS) {
    return cached.info;
  }
  if (!inFlight) {
    inFlight = fetch(ENDPOINT, { credentials: 'include' })
      .then(async (res) => (res.ok ? ((await res.json()) as ExchangeRateInfo) : null))
      .catch((error) => {
        console.warn('Failed to load exchange rate:', error);
        return null;
      })
      .then((info) => {
        cached = { info, at: Date.now() };
        listeners.forEach((fn) => fn(info));
        return info;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * PKR -> USD rate for display. Only active while the tenant currency is PKR;
 * otherwise `rate` is null and the helpers return empty values, so callers can
 * render unconditionally.
 */
export function useExchangeRate() {
  const { currentCurrency } = useCurrency();
  const enabled = currentCurrency === 'PKR';

  const [info, setInfo] = useState<ExchangeRateInfo | null>(() => cached?.info ?? null);
  const [loading, setLoading] = useState<boolean>(enabled && !cached);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const onUpdate = (next: ExchangeRateInfo | null) => {
      if (!cancelled) setInfo(next);
    };
    listeners.add(onUpdate);

    loadRate().then((next) => {
      if (!cancelled) {
        setInfo(next);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      listeners.delete(onUpdate);
    };
  }, [enabled]);

  const rate = enabled ? info?.usdPerPkr ?? null : null;

  const toUsd = useCallback((pkrAmount: unknown) => toUsdAmount(pkrAmount, rate), [rate]);

  /** "≈ $1,234.56" or "" when no conversion is possible. */
  const usdText = useCallback(
    (pkrAmount: unknown) => {
      const s = formatUsd(pkrAmount, rate);
      return s ? `≈ ${s}` : '';
    },
    [rate]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await loadRate(true);
    setInfo(next);
    setLoading(false);
    return next;
  }, []);

  return {
    /** USD per 1 PKR multiplier, or null. */
    rate,
    source: enabled ? info?.source ?? 'none' : ('none' as RateSource),
    updatedAt: enabled ? info?.updatedAt ?? null : null,
    info: enabled ? info : null,
    loading,
    enabled,
    toUsd,
    usdText,
    refresh,
  };
}
