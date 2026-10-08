import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers, productInventory, stockMovements, orders } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (
  req: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    
    const supplier = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (supplier.length === 0) {
      return ErrorResponses.tenantNotFound();
    }
    
    return NextResponse.json(supplier[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return ErrorResponses.serverError('Failed to fetch supplier');
  }
});

export const PUT = withTenant(async (
  req: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const updateData = await req.json();
    
    // Check if supplier exists within tenant
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (existingSupplier.length === 0) {
      return ErrorResponses.tenantNotFound();
    }
    
    // If email is being updated, check for duplicates within tenant
    if (updateData.email && updateData.email !== existingSupplier[0].email) {
      const duplicateSupplier = await db
        .select()
        .from(suppliers)
        .where(and(
          eq(suppliers.email, updateData.email),
          eq(suppliers.tenantId, context.tenantId)
        ))
        .limit(1);
      
      if (duplicateSupplier.length > 0) {
        return ErrorResponses.invalidInput('Supplier with this email already exists');
      }
    }
    
    // Update supplier
    const updatedSupplier = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    await db
      .update(suppliers)
      .set(updatedSupplier)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ));
    
    // Fetch and return updated supplier
    const result = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .limit(1);
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return ErrorResponses.serverError('Failed to update supplier');
  }
});

export const DELETE = withTenant(async (
  req: NextRequest,
  context,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    
    // Check if supplier exists within tenant
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (existingSupplier.length === 0) {
      return ErrorResponses.tenantNotFound();
    }
    
    // Check if supplier is referenced in inventory within tenant
    const inventoryReferences = await db
      .select()
      .from(productInventory)
      .where(and(
        eq(productInventory.supplierId, id),
        eq(productInventory.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (inventoryReferences.length > 0) {
      return ErrorResponses.invalidInput('Cannot delete supplier as it is referenced in inventory records. Please remove all inventory references first.');
    }
    
    // Check if supplier is referenced in stock movements within tenant
    const stockMovementReferences = await db
      .select()
      .from(stockMovements)
      .where(and(
        eq(stockMovements.supplierId, id),
        eq(stockMovements.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (stockMovementReferences.length > 0) {
      return ErrorResponses.invalidInput('Cannot delete supplier as it is referenced in stock movement records. Please remove all references first.');
    }
    
    // Check if supplier is referenced in orders within tenant
    const orderReferences = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.supplierId, id),
        eq(orders.tenantId, context.tenantId)
      ))
      .limit(1);
    
    if (orderReferences.length > 0) {
      return ErrorResponses.invalidInput('Cannot delete supplier as it is referenced in order records. Please remove all references first.');
    }
    
    // Delete supplier
    await db
      .delete(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, context.tenantId)
      ));
    
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return ErrorResponses.serverError('Failed to delete supplier');
  }
});
