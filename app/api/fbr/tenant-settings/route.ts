import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Get tenant context
    const { getTenantContext } = await import('@/lib/api-helpers');
    const tenantContext = await getTenantContext(req);
    
    if (!tenantContext?.tenantId) {
      return NextResponse.json({ error: 'No tenant context found' }, { status: 400 });
    }

    // Get current FBR settings for this tenant
    const fbrSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantContext.tenantId),
          eq(settings.isActive, true)
        )
      );

    // Filter FBR-related settings
    const fbrOnly = fbrSettings.filter(setting => 
      setting.key?.toLowerCase().includes('fbr') || 
      setting.key?.toLowerCase().includes('FBR')
    );

    return NextResponse.json({
      tenantId: tenantContext.tenantId,
      fbrSettings: fbrOnly,
      message: `Found ${fbrOnly.length} FBR settings for tenant`
    });

  } catch (error) {
    console.error('Error fetching tenant FBR settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tenant FBR settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get tenant context
    const { getTenantContext } = await import('@/lib/api-helpers');
    const tenantContext = await getTenantContext(req);
    
    if (!tenantContext?.tenantId) {
      return NextResponse.json({ error: 'No tenant context found' }, { status: 400 });
    }

    const body = await req.json();
    const { baseUrl, token, isProduction = false } = body;

    if (!baseUrl || !token) {
      return NextResponse.json({ 
        error: 'baseUrl and token are required' 
      }, { status: 400 });
    }

    // Define the settings to create/update
    const settingsToUpdate = [
      {
        key: 'fbr_base_url',
        value: baseUrl,
        description: `FBR ${isProduction ? 'Production' : 'Sandbox'} Base URL`
      },
      {
        key: 'fbr_sandbox_token',
        value: token,
        description: `FBR ${isProduction ? 'Production' : 'Sandbox'} Token`
      }
    ];

    // Insert or update each setting
    for (const setting of settingsToUpdate) {
      // Check if setting exists
      const existing = await db
        .select()
        .from(settings)
        .where(
          and(
            eq(settings.tenantId, tenantContext.tenantId),
            eq(settings.key, setting.key),
            eq(settings.isActive, true)
          )
        );

      if (existing.length > 0) {
        // Update existing
        await db
          .update(settings)
          .set({
            value: setting.value,
            description: setting.description,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(settings.tenantId, tenantContext.tenantId),
              eq(settings.key, setting.key)
            )
          );
      } else {
        // Create new
        await db.insert(settings).values({
          tenantId: tenantContext.tenantId,
          key: setting.key,
          value: setting.value,
          description: setting.description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `FBR ${isProduction ? 'production' : 'sandbox'} settings updated for tenant ${tenantContext.tenantId}`,
      settings: settingsToUpdate
    });

  } catch (error) {
    console.error('Error updating tenant FBR settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update tenant FBR settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}