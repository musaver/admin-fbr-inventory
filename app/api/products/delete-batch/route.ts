import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  products,
  productVariants,
  productAddons,
  productTags,
  productInventory,
  stockMovements,
  orderItems,
} from '@/lib/schema';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

// DELETE /api/products/delete-batch
// Body: { ids: string[] }
export const DELETE = withTenant(async (request: NextRequest, context) => {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ErrorResponses.invalidInput('Array of product IDs is required');
    }

    // Guard: only operate on products belonging to this tenant
    const tenantProductIds = await db
      .select({ id: products.id })
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.tenantId, context.tenantId)));

    if (tenantProductIds.length === 0) {
      return NextResponse.json({ message: 'No matching products for this tenant' });
    }

    const productIds = tenantProductIds.map((p) => p.id);

    // 1. Delete stock movements (scoped by tenant and productId)
    await db.delete(stockMovements).where(and(inArray(stockMovements.productId, productIds), eq(stockMovements.tenantId, context.tenantId)));

    // 2. Delete product inventory (scoped by tenant and productId)
    await db.delete(productInventory).where(and(inArray(productInventory.productId, productIds), eq(productInventory.tenantId, context.tenantId)));

    // 3. Delete product addons
    await db.delete(productAddons).where(inArray(productAddons.productId, productIds));

    // 4. Delete product tags
    await db.delete(productTags).where(inArray(productTags.productId, productIds));

    // 5. Delete product variants (scoped by tenant)
    await db.delete(productVariants).where(and(inArray(productVariants.productId, productIds), eq(productVariants.tenantId, context.tenantId)));

    // 6. Update order items to detach product reference instead of deleting orders
    await db
      .update(orderItems)
      .set({ productId: null })
      .where(inArray(orderItems.productId, productIds));

    // 7. Finally delete the products for this tenant
    await db.delete(products).where(and(inArray(products.id, productIds), eq(products.tenantId, context.tenantId)));

    return NextResponse.json({
      message: `Successfully deleted ${productIds.length} product(s) and related data for this tenant`,
      deletedCount: productIds.length,
    });
  } catch (error) {
    console.error('Error deleting selected products:', error);
    return ErrorResponses.serverError('Failed to delete selected products');
  }
});


