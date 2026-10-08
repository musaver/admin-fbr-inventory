/**
 * PKR -> USD exchange rate (server-only).
 *
 * Source of truth, in order of precedence:
 *   1. Per-tenant manual override stored in `settings` (key below), entered as
 *      "PKR per 1 USD" (e.g. 280) because that is the figure people know.
 *   2. Live rate from open.er-api.com (free, no key, updates daily),
 *      cached in memory for 12 hours.
 *   3. Last successfully fetched live rate (stale) if the upstream is down.
 *
 * All conversions are display-only. Nothing here is persisted on orders or
 * sent to FBR.
 */

import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const USD_OVERRIDE_SETTING_KEY = 'usd_pkr_per_usd_override';

const LIVE_RATE_URL = 'https://open.er-api.com/v6/latest/PKR';
const LIVE_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const LIVE_FETCH_TIMEOUT_MS = 5000;

export type RateSource = 'manual' | 'live' | 'cached' | 'none';

export interface LiveRate {
  usdPerPkr: number;
  updatedAt: string; // as reported by the provider
  fetchedAtMs: number;
}

export interface ExchangeRateInfo {
  /** Effective multiplier: usd = pkr * usdPerPkr. Null when no rate is available. */
  usdPerPkr: number | null;
  /** Effective "PKR per 1 USD", the human-friendly form of the same rate. */
  pkrPerUsd: number | null;
  source: RateSource;
  updatedAt: string | null;
  /** Live provider figures, regardless of override, for display in Settings. */
  liveUsdPerPkr: number | null;
  livePkrPerUsd: number | null;
  liveUpdatedAt: string | null;
  /** Tenant manual override (PKR per 1 USD) or null when not set. */
  overridePkrPerUsd: number | null;
}

// Module-level cache. Serverless instances each keep their own copy, which is
// fine: the goal is to avoid hitting the provider on every request.
let lastGood: LiveRate | null = null;
let inFlight: Promise<LiveRate | null> | null = null;

function isFresh(rate: LiveRate | null): rate is LiveRate {
  return !!rate && Date.now() - rate.fetchedAtMs < LIVE_CACHE_TTL_MS;
}

async function fetchFromProvider(): Promise<LiveRate | null> {
  try {
    const res = await fetch(LIVE_RATE_URL, {
      // Next.js data cache; the in-memory cache above is the primary guard.
      next: { revalidate: LIVE_CACHE_TTL_MS / 1000 },
      signal: AbortSignal.timeout(LIVE_FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn('Exchange rate provider responded with', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const usd = Number(data?.rates?.USD);

    if (data?.result !== 'success' || !Number.isFinite(usd) || usd <= 0) {
      console.warn('Exchange rate provider returned an unusable payload');
      return null;
    }

    lastGood = {
      usdPerPkr: usd,
      updatedAt: typeof data.time_last_update_utc === 'string'
        ? data.time_last_update_utc
        : new Date().toISOString(),
      fetchedAtMs: Date.now(),
    };
    return lastGood;
  } catch (error) {
    console.warn('Exchange rate fetch failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Live USD-per-PKR rate, served from the 12h in-memory cache when fresh.
 * Resolves to null only when nothing has ever been fetched successfully.
 * The second tuple element tells whether the value is fresh or stale.
 */
export async function getLiveUsdPerPkr(): Promise<{ rate: LiveRate | null; stale: boolean }> {
  if (isFresh(lastGood)) {
    return { rate: lastGood, stale: false };
  }

  if (!inFlight) {
    inFlight = fetchFromProvider().finally(() => {
      inFlight = null;
    });
  }

  const fetched = await inFlight;
  if (fetched) return { rate: fetched, stale: false };

  // Upstream failed: fall back to whatever we last had, flagged as stale.
  return { rate: lastGood, stale: true };
}

/**
 * Read the tenant's manual override (PKR per 1 USD). Null when not set.
 */
export async function getOverridePkrPerUsd(tenantId: string): Promise<number | null> {
  try {
    const rows = await db
      .select({ value: settings.value })
      .from(settings)
      .where(and(eq(settings.tenantId, tenantId), eq(settings.key, USD_OVERRIDE_SETTING_KEY)))
      .limit(1);

    if (rows.length === 0) return null;
    const n = parseFloat(rows[0].value);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (error) {
    console.error('Error reading USD override setting:', error);
    return null;
  }
}

/**
 * Effective PKR->USD rate for a tenant (or the live rate alone when no tenant).
 */
export async function getUsdRateForTenant(tenantId?: string | null): Promise<ExchangeRateInfo> {
  const [{ rate: live, stale }, overridePkrPerUsd] = await Promise.all([
    getLiveUsdPerPkr(),
    tenantId ? getOverridePkrPerUsd(tenantId) : Promise.resolve(null),
  ]);

  const liveUsdPerPkr = live?.usdPerPkr ?? null;
  const livePkrPerUsd = liveUsdPerPkr ? 1 / liveUsdPerPkr : null;
  const liveUpdatedAt = live?.updatedAt ?? null;

  if (overridePkrPerUsd) {
    return {
      usdPerPkr: 1 / overridePkrPerUsd,
      pkrPerUsd: overridePkrPerUsd,
      source: 'manual',
      updatedAt: null,
      liveUsdPerPkr,
      livePkrPerUsd,
      liveUpdatedAt,
      overridePkrPerUsd,
    };
  }

  if (liveUsdPerPkr) {
    return {
      usdPerPkr: liveUsdPerPkr,
      pkrPerUsd: livePkrPerUsd,
      source: stale ? 'cached' : 'live',
      updatedAt: liveUpdatedAt,
      liveUsdPerPkr,
      livePkrPerUsd,
      liveUpdatedAt,
      overridePkrPerUsd: null,
    };
  }

  return {
    usdPerPkr: null,
    pkrPerUsd: null,
    source: 'none',
    updatedAt: null,
    liveUsdPerPkr: null,
    livePkrPerUsd: null,
    liveUpdatedAt: null,
    overridePkrPerUsd: null,
  };
}
