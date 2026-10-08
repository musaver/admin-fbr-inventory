import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { variationAttributes, variationAttributeValues } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { withTenant, TenantContext } from '@/lib/api-helpers';

export const GET = withTenant(async (
  req: NextRequest,
  context: TenantContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeValues = searchParams.get('includeValues') === 'true';

    if (includeValues) {
      // Fetch attribute with its values
      const attributeWithValues = await db
        .select({
          attribute: variationAttributes,
          value: variationAttributeValues
        })
        .from(variationAttributes)
        .leftJoin(variationAttributeValues, eq(variationAttributes.id, variationAttributeValues.attributeId))
        .where(and(
          eq(variationAttributes.id, id),
          eq(variationAttributes.tenantId, context.tenantId)
        ));

      if (attributeWithValues.length === 0) {
        return NextResponse.json({ error: 'Variation attribute not found' }, { status: 404 });
      }

      const attribute = attributeWithValues[0].attribute;
      const values = attributeWithValues
        .filter(row => row.value !== null)
        .map(row => row.value);

      return NextResponse.json({ ...attribute, values });
    } else {
      // Fetch only attribute
      const attribute = await db.query.variationAttributes.findFirst({
        where: and(
          eq(variationAttributes.id, id),
          eq(variationAttributes.tenantId, context.tenantId)
        ),
      });

      if (!attribute) {
        return NextResponse.json({ error: 'Variation attribute not found' }, { status: 404 });
      }

      return NextResponse.json(attribute);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get variation attribute' }, { status: 500 });
  }
});

export const PUT = withTenant(async (
  req: NextRequest,
  context: TenantContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const data = await req.json();

    // Remove values from data if present, as they should be handled separately
    const { values, ...attributeData } = data;

    await db
      .update(variationAttributes)
      .set(attributeData)
      .where(and(
        eq(variationAttributes.id, id),
        eq(variationAttributes.tenantId, context.tenantId)
      ));

    const updatedAttribute = await db.query.variationAttributes.findFirst({
      where: and(
        eq(variationAttributes.id, id),
        eq(variationAttributes.tenantId, context.tenantId)
      ),
    });

    if (!updatedAttribute) {
      return NextResponse.json({ error: 'Variation attribute not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAttribute);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Attribute name or slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update variation attribute' }, { status: 500 });
  }
});

export const DELETE = withTenant(async (
  req: NextRequest,
  context: TenantContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    
    // Check if attribute exists and belongs to the same tenant
    const attribute = await db.query.variationAttributes.findFirst({
      where: and(
        eq(variationAttributes.id, id),
        eq(variationAttributes.tenantId, context.tenantId)
      ),
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Variation attribute not found' }, { status: 404 });
    }

    // Delete attribute (this will cascade delete values due to foreign key constraint)
    await db
      .delete(variationAttributes)
      .where(and(
        eq(variationAttributes.id, id),
        eq(variationAttributes.tenantId, context.tenantId)
      ));

    return NextResponse.json({ message: 'Variation attribute deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete variation attribute' }, { status: 500 });
  }
}); 