import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext } from '@/lib/api-helpers';

// FBR Setting keys
const FBR_SETTING_KEYS = {
  FBR_BASE_URL: 'fbr_base_url',
  FBR_SANDBOX_TOKEN: 'fbr_sandbox_token',
  FBR_SELLER_NTNCNIC: 'fbr_seller_ntncnic',
  FBR_SELLER_BUSINESS_NAME: 'fbr_seller_business_name',
  FBR_SELLER_PROVINCE: 'fbr_seller_province',
  FBR_SELLER_ADDRESS: 'fbr_seller_address',
} as const;

/**
 * GET /api/seller-info
 * Returns seller information from tenant-specific settings
 * This is used to auto-fill seller fields in the order form
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    // Get FBR settings for the tenant
    const fbrSettingsData = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.isActive, true)
        )
      );

    // Initialize with default/fallback values from environment variables
    let sellerInfo = {
      sellerNTNCNIC: process.env.FBR_SELLER_NTNCNIC || '',
      sellerBusinessName: process.env.FBR_SELLER_BUSINESS_NAME || '',
      sellerProvince: process.env.FBR_SELLER_PROVINCE || '',
      sellerAddress: process.env.FBR_SELLER_ADDRESS || '',
      fbrSandboxToken: process.env.FBR_SANDBOX_TOKEN || '',
      fbrBaseUrl: process.env.FBR_BASE_URL || ''
    };

    // Override with tenant-specific settings if available
    for (const setting of fbrSettingsData) {
      switch (setting.key) {
        case FBR_SETTING_KEYS.FBR_BASE_URL:
          sellerInfo.fbrBaseUrl = setting.value || sellerInfo.fbrBaseUrl;
          break;
        case FBR_SETTING_KEYS.FBR_SANDBOX_TOKEN:
          sellerInfo.fbrSandboxToken = setting.value || sellerInfo.fbrSandboxToken;
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_NTNCNIC:
          sellerInfo.sellerNTNCNIC = setting.value || sellerInfo.sellerNTNCNIC;
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_BUSINESS_NAME:
          sellerInfo.sellerBusinessName = setting.value || sellerInfo.sellerBusinessName;
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_PROVINCE:
          sellerInfo.sellerProvince = setting.value || sellerInfo.sellerProvince;
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_ADDRESS:
          sellerInfo.sellerAddress = setting.value || sellerInfo.sellerAddress;
          break;
      }
    }

    return NextResponse.json(sellerInfo);
  } catch (error) {
    console.error('Error fetching seller info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller information' },
      { status: 500 }
    );
  }
}
