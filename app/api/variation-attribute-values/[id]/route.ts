import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { variationAttributeValues } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { withTenant, TenantContext } from '@/lib/api-helpers';

export const GET = withTenant(async (
  req: NextRequest,
  context: TenantContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const value = await db.query.variationAttributeValues.findFirst({
      where: and(
        eq(variationAttributeValues.id, id),
        eq(variationAttributeValues.tenantId, context.tenantId)
      ),
    });

    if (!value) {
      return NextResponse.json({ error: 'Variation attribute value not found' }, { status: 404 });
    }

    return NextResponse.json(value);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get variation attribute value' }, { status: 500 });
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

    await db
      .update(variationAttributeValues)
      .set(data)
      .where(and(
        eq(variationAttributeValues.id, id),
        eq(variationAttributeValues.tenantId, context.tenantId)
      ));

    const updatedValue = await db.query.variationAttributeValues.findFirst({
      where: and(
        eq(variationAttributeValues.id, id),
        eq(variationAttributeValues.tenantId, context.tenantId)
      ),
    });

    if (!updatedValue) {
      return NextResponse.json({ error: 'Variation attribute value not found' }, { status: 404 });
    }

    return NextResponse.json(updatedValue);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Value slug already exists for this attribute' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update variation attribute value' }, { status: 500 });
  }
});

export const DELETE = withTenant(async (
  req: NextRequest,
  context: TenantContext,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    
    // Check if value exists and belongs to the same tenant
    const value = await db.query.variationAttributeValues.findFirst({
      where: and(
        eq(variationAttributeValues.id, id),
        eq(variationAttributeValues.tenantId, context.tenantId)
      ),
    });

    if (!value) {
      return NextResponse.json({ error: 'Variation attribute value not found' }, { status: 404 });
    }

    await db
      .delete(variationAttributeValues)
      .where(and(
        eq(variationAttributeValues.id, id),
        eq(variationAttributeValues.tenantId, context.tenantId)
      ));

    return NextResponse.json({ message: 'Variation attribute value deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete variation attribute value' }, { status: 500 });
  }
}); 