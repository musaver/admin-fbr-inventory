import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTenantContext } from '@/lib/api-helpers';

// FBR Setting keys
const FBR_SETTING_KEYS = {
  FBR_BASE_URL: 'fbr_base_url',
  FBR_SANDBOX_TOKEN: 'fbr_sandbox_token',
  FBR_PRODUCTION_TOKEN: 'fbr_production_token',
  FBR_SELLER_NTNCNIC: 'fbr_seller_ntncnic',
  FBR_SELLER_BUSINESS_NAME: 'fbr_seller_business_name',
  FBR_SELLER_PROVINCE: 'fbr_seller_province',
  FBR_SELLER_ADDRESS: 'fbr_seller_address',
  FBR_STRN_NUMBER: 'fbr_strn_number',
} as const;

interface FbrSettings {
  fbrBaseUrl: string;
  fbrSandboxToken: string;
  fbrProductionToken: string;
  fbrSellerNTNCNIC: string;
  fbrSellerBusinessName: string;
  fbrSellerProvince: string;
  fbrSellerAddress: string;
  fbrStrnNumber: string;
}

const DEFAULT_FBR_SETTINGS: FbrSettings = {
  fbrBaseUrl: '',
  fbrSandboxToken: '',
  fbrProductionToken: '',
  fbrSellerNTNCNIC: '',
  fbrSellerBusinessName: '',
  fbrSellerProvince: '',
  fbrSellerAddress: '',
  fbrStrnNumber: '',
};

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    // Get all FBR settings for the tenant
    const fbrSettingsData = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.isActive, true)
        )
      );

    // Initialize with default settings
    let fbrSettings = { ...DEFAULT_FBR_SETTINGS };

    // Parse existing settings
    for (const setting of fbrSettingsData) {
      switch (setting.key) {
        case FBR_SETTING_KEYS.FBR_BASE_URL:
          fbrSettings.fbrBaseUrl = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_SANDBOX_TOKEN:
          fbrSettings.fbrSandboxToken = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_PRODUCTION_TOKEN:
          fbrSettings.fbrProductionToken = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_NTNCNIC:
          fbrSettings.fbrSellerNTNCNIC = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_BUSINESS_NAME:
          fbrSettings.fbrSellerBusinessName = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_PROVINCE:
          fbrSettings.fbrSellerProvince = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_SELLER_ADDRESS:
          fbrSettings.fbrSellerAddress = setting.value || '';
          break;
        case FBR_SETTING_KEYS.FBR_STRN_NUMBER:
          fbrSettings.fbrStrnNumber = setting.value || '';
          break;
      }
    }

    return NextResponse.json({
      success: true,
      settings: fbrSettings
    });
  } catch (error) {
    console.error('Error getting FBR settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FBR settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings: newSettings } = body as { settings: FbrSettings };

    if (!newSettings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'fbrBaseUrl',
      'fbrSandboxToken', 
      'fbrSellerNTNCNIC',
      'fbrSellerBusinessName',
      'fbrSellerProvince',
      'fbrSellerAddress'
    ];

    for (const field of requiredFields) {
      if (!newSettings[field as keyof FbrSettings]?.trim()) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Map of settings to update
    const settingsToUpdate = [
      { key: FBR_SETTING_KEYS.FBR_BASE_URL, value: newSettings.fbrBaseUrl, description: 'FBR API base URL' },
      { key: FBR_SETTING_KEYS.FBR_SANDBOX_TOKEN, value: newSettings.fbrSandboxToken, description: 'FBR sandbox API token' },
      { key: FBR_SETTING_KEYS.FBR_PRODUCTION_TOKEN, value: newSettings.fbrProductionToken, description: 'FBR production API token' },
      { key: FBR_SETTING_KEYS.FBR_SELLER_NTNCNIC, value: newSettings.fbrSellerNTNCNIC, description: 'Seller NTN/CNIC number' },
      { key: FBR_SETTING_KEYS.FBR_SELLER_BUSINESS_NAME, value: newSettings.fbrSellerBusinessName, description: 'Seller business name' },
      { key: FBR_SETTING_KEYS.FBR_SELLER_PROVINCE, value: newSettings.fbrSellerProvince, description: 'Seller province' },
      { key: FBR_SETTING_KEYS.FBR_SELLER_ADDRESS, value: newSettings.fbrSellerAddress, description: 'Seller business address' },
      { key: FBR_SETTING_KEYS.FBR_STRN_NUMBER, value: newSettings.fbrStrnNumber || '', description: 'FBR STRN number' },
    ];

    // Update or create each setting
    for (const settingData of settingsToUpdate) {
      // Check if setting exists for this tenant
      const [existingSetting] = await db
        .select()
        .from(settings)
        .where(
          and(
            eq(settings.tenantId, tenantContext.tenantId),
            eq(settings.key, settingData.key)
          )
        )
        .limit(1);

      if (existingSetting) {
        // Update existing setting
        await db
          .update(settings)
          .set({
            value: settingData.value,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(settings.tenantId, tenantContext.tenantId),
              eq(settings.key, settingData.key)
            )
          );
      } else {
        // Create new setting
        await db.insert(settings).values({
          id: uuidv4(),
          tenantId: tenantContext.tenantId,
          key: settingData.key,
          value: settingData.value,
          type: 'string',
          description: settingData.description,
          isActive: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'FBR settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating FBR settings:', error);
    return NextResponse.json(
      { error: 'Failed to update FBR settings' },
      { status: 500 }
    );
  }
}
