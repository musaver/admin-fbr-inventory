import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTenantContext } from '@/lib/api-helpers';
import { getUsdRateForTenant, USD_OVERRIDE_SETTING_KEY } from '@/lib/exchange-rate';

/**
 * GET /api/settings/exchange-rate
 * Effective PKR -> USD rate for the current tenant (manual override, else live).
 * Without tenant context, returns the live rate only.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    const info = await getUsdRateForTenant(tenantContext?.tenantId);
    return NextResponse.json(info);
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
  }
}

/**
 * POST /api/settings/exchange-rate
 * Body: { pkrPerUsd: number | null }
 * Sets (or clears, when null) the tenant's manual override, entered as PKR per 1 USD.
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Unauthorized - No tenant context' }, { status: 401 });
    }

    const body = await request.json();
    const raw = body?.pkrPerUsd;

    let pkrPerUsd: number | null;
    if (raw === null || raw === undefined || raw === '') {
      pkrPerUsd = null;
    } else {
      pkrPerUsd = typeof raw === 'number' ? raw : parseFloat(String(raw));
      if (!Number.isFinite(pkrPerUsd) || pkrPerUsd <= 0) {
        return NextResponse.json(
          { error: 'pkrPerUsd must be a positive number (PKR per 1 USD) or null to clear' },
          { status: 400 }
        );
      }
    }

    const whereTenantKey = and(
      eq(settings.tenantId, tenantContext.tenantId),
      eq(settings.key, USD_OVERRIDE_SETTING_KEY)
    );

    if (pkrPerUsd === null) {
      await db.delete(settings).where(whereTenantKey);
    } else {
      const existing = await db.select({ id: settings.id }).from(settings).where(whereTenantKey).limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: String(pkrPerUsd), updatedAt: new Date() })
          .where(whereTenantKey);
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          tenantId: tenantContext.tenantId,
          key: USD_OVERRIDE_SETTING_KEY,
          value: String(pkrPerUsd),
          type: 'number',
          description: 'Manual PKR per 1 USD exchange rate override for USD price display',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const info = await getUsdRateForTenant(tenantContext.tenantId);
    return NextResponse.json({
      success: true,
      message: pkrPerUsd === null
        ? 'Manual exchange rate cleared. Using live rate.'
        : `Manual exchange rate set to ${pkrPerUsd} PKR per USD.`,
      ...info,
    });
  } catch (error) {
    console.error('Error updating exchange rate override:', error);
    return NextResponse.json({ error: 'Failed to update exchange rate' }, { status: 500 });
  }
}
