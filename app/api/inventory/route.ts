import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productInventory, products, productVariants, suppliers } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, inArray, and } from 'drizzle-orm';
import { convertToGrams, isWeightBasedProduct } from '@/utils/weightUtils';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    const allInventory = await db
      .select({
        inventory: productInventory,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          stockManagementType: products.stockManagementType,
          pricePerUnit: products.pricePerUnit,
          baseWeightUnit: products.baseWeightUnit
        },
        variant: {
          id: productVariants.id,
          title: productVariants.title
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          companyName: suppliers.companyName
        }
      })
      .from(productInventory)
      .leftJoin(products, and(
        eq(productInventory.productId, products.id),
        eq(products.tenantId, context.tenantId)
      ))
      .leftJoin(productVariants, and(
        eq(productInventory.variantId, productVariants.id),
        eq(productVariants.tenantId, context.tenantId)
      ))
      .leftJoin(suppliers, and(
        eq(productInventory.supplierId, suppliers.id),
        eq(suppliers.tenantId, context.tenantId)
      ))
      .where(eq(productInventory.tenantId, context.tenantId));
      
    return NextResponse.json(allInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return ErrorResponses.serverError('Failed to fetch inventory');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { 
      productId, 
      variantId, 
      quantity, 
      reservedQuantity, 
      reorderPoint, 
      reorderQuantity,
      // Weight-based fields
      weightQuantity,
      weightUnit,
      reservedWeight,
      reservedWeightUnit,
      reorderWeightPoint,
      reorderWeightPointUnit,
      reorderWeightQuantity,
      reorderWeightQuantityUnit,
      location, 
      supplier, 
      lastRestockDate 
    } = await req.json();
    
    // Get product to determine stock management type (within tenant)
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.tenantId, context.tenantId)
      ),
      columns: { stockManagementType: true }
    });
    
    if (!product) {
      return ErrorResponses.tenantNotFound();
    }
    
    let newInventory: any = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      productId: productId || null,
      variantId: variantId || null,
      location: location || null,
      supplier: supplier || null,
      lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
    };
    
    if (isWeightBasedProduct(product.stockManagementType || 'quantity')) {
      // Weight-based inventory
      const weightInGrams = convertToGrams(weightQuantity || 0, weightUnit || 'grams');
      const reservedInGrams = convertToGrams(reservedWeight || 0, reservedWeightUnit || 'grams');
      const reorderPointInGrams = convertToGrams(reorderWeightPoint || 0, reorderWeightPointUnit || 'grams');
      const reorderQuantityInGrams = convertToGrams(reorderWeightQuantity || 0, reorderWeightQuantityUnit || 'grams');
      
      newInventory = {
        ...newInventory,
        // Set quantity fields to 0 for weight-based products
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        reorderPoint: 0,
        reorderQuantity: 0,
        // Set weight fields
        weightQuantity: weightInGrams.toString(),
        reservedWeight: reservedInGrams.toString(),
        availableWeight: (weightInGrams - reservedInGrams).toString(),
        reorderWeightPoint: reorderPointInGrams.toString(),
        reorderWeightQuantity: reorderQuantityInGrams.toString(),
      };
    } else {
      // Quantity-based inventory
      const availableQuantity = (quantity || 0) - (reservedQuantity || 0);
      
      newInventory = {
        ...newInventory,
        quantity: quantity || 0,
        reservedQuantity: reservedQuantity || 0,
        availableQuantity,
        reorderPoint: reorderPoint || 0,
        reorderQuantity: reorderQuantity || 0,
        // Set weight fields to 0 for quantity-based products
        weightQuantity: '0.00',
        reservedWeight: '0.00',
        availableWeight: '0.00',
        reorderWeightPoint: '0.00',
        reorderWeightQuantity: '0.00',
      };
    }
    
    await db.insert(productInventory).values(newInventory);
    
    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory record:', error);
    return ErrorResponses.serverError('Failed to create inventory record');
  }
});

export const DELETE = withTenant(async (req: NextRequest, context) => {
  try {
    const { ids } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ErrorResponses.invalidInput('Array of inventory IDs is required');
    }
    
    // Delete all inventory records with the provided IDs within tenant
    await db
      .delete(productInventory)
      .where(and(
        inArray(productInventory.id, ids),
        eq(productInventory.tenantId, context.tenantId)
      ));
    
    return NextResponse.json({ 
      message: `Successfully deleted ${ids.length} inventory record(s)`,
      deletedCount: ids.length 
    });
  } catch (error) {
    console.error('Error deleting inventory records:', error);
    return ErrorResponses.serverError('Failed to delete inventory records');
  }
}); 