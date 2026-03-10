import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { variationAttributeValues, variationAttributes } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { withTenant, TenantContext } from '@/lib/api-helpers';

export const GET = withTenant(async (req: NextRequest, context: TenantContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const attributeId = searchParams.get('attributeId');
    
    // Build base query
    const baseQuery = db
      .select({
        value: variationAttributeValues,
        attribute: {
          id: variationAttributes.id,
          name: variationAttributes.name,
          type: variationAttributes.type
        }
      })
      .from(variationAttributeValues)
      .leftJoin(variationAttributes, eq(variationAttributeValues.attributeId, variationAttributes.id))
      .orderBy(variationAttributeValues.sortOrder);

    // Apply filters with tenant filtering
    const allValues = attributeId 
      ? await baseQuery.where(and(
          eq(variationAttributeValues.attributeId, attributeId),
          eq(variationAttributeValues.tenantId, context.tenantId)
        ))
      : await baseQuery.where(and(
          eq(variationAttributeValues.isActive, true),
          eq(variationAttributeValues.tenantId, context.tenantId)
        ));
    
    return NextResponse.json(allValues);
  } catch (error) {
    console.error('Error fetching variation attribute values:', error);
    return NextResponse.json({ error: 'Failed to fetch variation attribute values' }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest, context: TenantContext) => {
  try {
    const { 
      attributeId, 
      value, 
      slug, 
      colorCode, 
      image, 
      description, 
      sortOrder, 
      isActive 
    } = await req.json();
    
    // Validate required fields
    if (!attributeId || !value) {
      return NextResponse.json({ error: 'AttributeId and value are required' }, { status: 400 });
    }

    // Check if attribute exists and belongs to the same tenant
    const attribute = await db.query.variationAttributes.findFirst({
      where: and(
        eq(variationAttributes.id, attributeId),
        eq(variationAttributes.tenantId, context.tenantId)
      ),
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Variation attribute not found' }, { status: 404 });
    }
    
    const newValue = {
      id: uuidv4(),
      tenantId: context.tenantId,
      attributeId,
      value,
      slug: slug || value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      colorCode: colorCode || null,
      image: image || null,
      description: description || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    await db.insert(variationAttributeValues).values(newValue);
    
    return NextResponse.json(newValue, { status: 201 });
  } catch (error: any) {
    console.error('Error creating variation attribute value:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Value slug already exists for this attribute' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create variation attribute value' }, { status: 500 });
  }
}); 