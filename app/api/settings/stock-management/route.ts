import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getTenantContext } from '@/lib/api-helpers';

const STOCK_MANAGEMENT_KEY = 'stock_management_enabled';

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant context' },
        { status: 401 }
      );
    }

    // Try to get the setting from database for the specific tenant
    const setting = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.key, STOCK_MANAGEMENT_KEY)
        )
      )
      .limit(1);

    let stockManagementEnabled = true; // Default value

    if (setting.length > 0) {
      // Parse the stored value
      stockManagementEnabled = setting[0].value === 'true';
    } else {
      // Create default setting if it doesn't exist for this tenant
      await db.insert(settings).values({
        id: uuidv4(),
        tenantId: tenantContext.tenantId,
        key: STOCK_MANAGEMENT_KEY,
        value: 'true',
        type: 'boolean',
        description: 'Enable or disable stock management system',
        isActive: true,
      });
    }

    return NextResponse.json({ stockManagementEnabled });
  } catch (error) {
    console.error('Error getting stock management setting:', error);
    return NextResponse.json({ error: 'Failed to get setting' }, { status: 500 });
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

    const { enabled } = await req.json();
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean value' }, { status: 400 });
    }

    // Check if setting exists for this tenant
    const existingSetting = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.key, STOCK_MANAGEMENT_KEY)
        )
      )
      .limit(1);

    if (existingSetting.length > 0) {
      // Update existing setting for this tenant
      await db
        .update(settings)
        .set({
          value: enabled.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(settings.tenantId, tenantContext.tenantId),
            eq(settings.key, STOCK_MANAGEMENT_KEY)
          )
        );
    } else {
      // Create new setting for this tenant
      await db.insert(settings).values({
        id: uuidv4(),
        tenantId: tenantContext.tenantId,
        key: STOCK_MANAGEMENT_KEY,
        value: enabled.toString(),
        type: 'boolean',
        description: 'Enable or disable stock management system',
        isActive: true,
      });
    }
    
    return NextResponse.json({ 
      stockManagementEnabled: enabled, 
      message: `Stock management ${enabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    console.error('Error updating stock management setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
} 