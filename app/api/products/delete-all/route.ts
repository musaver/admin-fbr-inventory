import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, productAddons, productTags, productInventory, stockMovements, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const DELETE = withTenant(async (request: NextRequest, context) => {
  try {
    // Get all products for this tenant
    const allProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.tenantId, context.tenantId));

    if (allProducts.length === 0) {
      return NextResponse.json({ message: 'No products to delete' });
    }

    const productIds = allProducts.map(p => p.id);

    // Delete related data in correct order to avoid foreign key constraints
    
    // 1. Delete stock movements first
    for (const productId of productIds) {
      await db.delete(stockMovements).where(eq(stockMovements.productId, productId));
    }

    // 2. Delete product inventory
    for (const productId of productIds) {
      await db.delete(productInventory).where(eq(productInventory.productId, productId));
    }

    // 3. Delete product addons
    for (const productId of productIds) {
      await db.delete(productAddons).where(eq(productAddons.productId, productId));
    }

    // 4. Delete product tags
    for (const productId of productIds) {
      await db.delete(productTags).where(eq(productTags.productId, productId));
    }

    // 5. Delete product variants
    for (const productId of productIds) {
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
    }

    // 6. Update order items to set productId to null instead of deleting orders
    for (const productId of productIds) {
      await db.update(orderItems)
        .set({ productId: null })
        .where(eq(orderItems.productId, productId));
    }

    // 7. Finally delete the products
    await db.delete(products).where(eq(products.tenantId, context.tenantId));

    return NextResponse.json({ 
      message: `Successfully deleted ${productIds.length} products and all related data`,
      deletedCount: productIds.length
    });

  } catch (error) {
    console.error('Error deleting all products:', error);
    return ErrorResponses.serverError('Failed to delete all products');
  }
});
