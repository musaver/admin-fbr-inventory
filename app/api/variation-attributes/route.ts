import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { variationAttributes, variationAttributeValues } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { withTenant, TenantContext } from '@/lib/api-helpers';

export const GET = withTenant(async (req: NextRequest, context: TenantContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeValues = searchParams.get('includeValues') === 'true';
    
    if (includeValues) {
      // Fetch attributes with their values
      const allAttributes = await db
        .select({
          attribute: variationAttributes,
          value: variationAttributeValues
        })
        .from(variationAttributes)
        .leftJoin(variationAttributeValues, eq(variationAttributes.id, variationAttributeValues.attributeId))
        .where(and(
          eq(variationAttributes.isActive, true),
          eq(variationAttributes.tenantId, context.tenantId)
        ))
        .orderBy(variationAttributes.sortOrder, variationAttributeValues.sortOrder);

      // Group the results by attribute
      const groupedAttributes = allAttributes.reduce((acc: any, row) => {
        const attrId = row.attribute.id;
        if (!acc[attrId]) {
          acc[attrId] = {
            ...row.attribute,
            values: []
          };
        }
        if (row.value && row.value.isActive) {
          acc[attrId].values.push(row.value);
        }
        return acc;
      }, {});

      return NextResponse.json(Object.values(groupedAttributes));
    } else {
      // Fetch only attributes
      const allAttributes = await db
        .select()
        .from(variationAttributes)
        .where(and(
          eq(variationAttributes.isActive, true),
          eq(variationAttributes.tenantId, context.tenantId)
        ))
        .orderBy(variationAttributes.sortOrder);
        
      return NextResponse.json(allAttributes);
    }
  } catch (error) {
    console.error('Error fetching variation attributes:', error);
    return NextResponse.json({ error: 'Failed to fetch variation attributes' }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest, context: TenantContext) => {
  try {
    const { name, slug, description, type, sortOrder, isActive } = await req.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const newAttribute = {
      id: uuidv4(),
      tenantId: context.tenantId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: description || null,
      type: type || 'select',
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    
    await db.insert(variationAttributes).values(newAttribute);
    
    return NextResponse.json(newAttribute, { status: 201 });
  } catch (error: any) {
    console.error('Error creating variation attribute:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Attribute name or slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create variation attribute' }, { status: 500 });
  }
}); 