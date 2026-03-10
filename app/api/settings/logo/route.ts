import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTenantContext } from '@/lib/api-helpers';

const LOGO_SETTING_KEY = 'tenant_logo_url';

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    // Get logo setting for the tenant
    const [logoSetting] = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.key, LOGO_SETTING_KEY),
          eq(settings.isActive, true)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      logoUrl: logoSetting?.value || ''
    });
  } catch (error) {
    console.error('Error getting logo setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo setting' },
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
    const { logoUrl } = body;

    if (typeof logoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Logo URL must be a string' },
        { status: 400 }
      );
    }

    // Check if setting exists for this tenant
    const [existingSetting] = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.key, LOGO_SETTING_KEY)
        )
      )
      .limit(1);

    if (existingSetting) {
      // Update existing setting
      await db
        .update(settings)
        .set({
          value: logoUrl,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(settings.tenantId, tenantContext.tenantId),
            eq(settings.key, LOGO_SETTING_KEY)
          )
        );
    } else {
      // Create new setting
      await db.insert(settings).values({
        id: uuidv4(),
        tenantId: tenantContext.tenantId,
        key: LOGO_SETTING_KEY,
        value: logoUrl,
        type: 'string',
        description: 'Tenant logo URL',
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Logo setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating logo setting:', error);
    return NextResponse.json(
      { error: 'Failed to update logo setting' },
      { status: 500 }
    );
  }
}

