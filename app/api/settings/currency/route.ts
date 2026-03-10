import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTenantContext } from '@/lib/api-helpers';

// Define available currencies (PKR first as default)
const AVAILABLE_CURRENCIES = {
  'PKR': { 
    name: 'Rs (Rupees)', 
    symbol: '₨', // Unicode rupee symbol
    code: 'PKR',
    position: 'before'
  },
  'USD': { 
    name: 'US Dollar', 
    symbol: '$', // Standard dollar symbol
    code: 'USD',
    position: 'before' // before or after the amount
  },
  'AED': { 
    name: 'Dirham', 
    symbol: '&#xe001;', // Custom font character
    code: 'AED',
    position: 'before'
  }
} as const;

type CurrencyCode = keyof typeof AVAILABLE_CURRENCIES;

// Default currency
const DEFAULT_CURRENCY: CurrencyCode = 'PKR';
const CURRENCY_SETTING_KEY = 'selected_currency';

// Get currency setting from database for a specific tenant
async function getCurrencyFromDatabase(tenantId: string): Promise<CurrencyCode> {
  try {
    const result = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantId),
          eq(settings.key, CURRENCY_SETTING_KEY)
        )
      )
      .limit(1);

    if (result.length > 0 && result[0].value) {
      const currency = result[0].value as CurrencyCode;
      // Validate that it's a valid currency
      if (AVAILABLE_CURRENCIES[currency]) {
        return currency;
      }
    }
  } catch (error) {
    console.error('Error fetching currency from database:', error);
  }
  
  return DEFAULT_CURRENCY;
}

// Save currency setting to database for a specific tenant
async function saveCurrencyToDatabase(tenantId: string, currency: CurrencyCode): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantId),
          eq(settings.key, CURRENCY_SETTING_KEY)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing setting
      await db
        .update(settings)
        .set({
          value: currency,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(settings.tenantId, tenantId),
            eq(settings.key, CURRENCY_SETTING_KEY)
          )
        );
    } else {
      // Create new setting
      await db
        .insert(settings)
        .values({
          id: uuidv4(),
          tenantId: tenantId,
          key: CURRENCY_SETTING_KEY,
          value: currency,
          type: 'string',
          description: 'Selected currency for the application',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  } catch (error) {
    console.error('Error saving currency to database:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      // Return default PKR currency when no tenant context (e.g., unauthenticated users)
      return NextResponse.json({
        currentCurrency: DEFAULT_CURRENCY,
        availableCurrencies: AVAILABLE_CURRENCIES,
        currencySettings: AVAILABLE_CURRENCIES[DEFAULT_CURRENCY]
      });
    }

    const currentCurrency = await getCurrencyFromDatabase(tenantContext.tenantId);
    
    return NextResponse.json({
      currentCurrency,
      availableCurrencies: AVAILABLE_CURRENCIES,
      currencySettings: AVAILABLE_CURRENCIES[currentCurrency]
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    // Return default PKR currency on error
    return NextResponse.json({
      currentCurrency: DEFAULT_CURRENCY,
      availableCurrencies: AVAILABLE_CURRENCIES,
      currencySettings: AVAILABLE_CURRENCIES[DEFAULT_CURRENCY]
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantContext = await getTenantContext(req);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    const { currency } = await req.json();
    
    // Validate currency
    if (!currency || !AVAILABLE_CURRENCIES[currency as CurrencyCode]) {
      return NextResponse.json({ 
        error: 'Invalid currency. Must be one of: ' + Object.keys(AVAILABLE_CURRENCIES).join(', ')
      }, { status: 400 });
    }
    
    const currencyCode = currency as CurrencyCode;
    
    // Save currency to database for the specific tenant
    await saveCurrencyToDatabase(tenantContext.tenantId, currencyCode);
    
    return NextResponse.json({
      success: true,
      currentCurrency: currencyCode,
      currencySettings: AVAILABLE_CURRENCIES[currencyCode],
      message: `Currency updated to ${AVAILABLE_CURRENCIES[currencyCode].name} successfully`
    });
  } catch (error) {
    console.error('Error updating currency settings:', error);
    return NextResponse.json({ error: 'Failed to update currency settings' }, { status: 500 });
  }
} 