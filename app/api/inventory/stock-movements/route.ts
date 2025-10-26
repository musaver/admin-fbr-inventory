import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productInventory, products, productVariants, stockMovements } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, desc, inArray } from 'drizzle-orm';
import { convertToGrams, isWeightBasedProduct } from '@/utils/weightUtils';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

// This would ideally be a separate table for stock movements
// For now, we'll create a mock implementation that updates inventory directly

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    // Fetch stock movements with product and variant information, filtered by tenant
    const movements = await db
      .select({
        movement: stockMovements,
        product: {
          id: products.id,
          name: products.name,
          stockManagementType: products.stockManagementType,
          baseWeightUnit: products.baseWeightUnit
        },
        variant: productVariants,
      })
      .from(stockMovements)
      .leftJoin(products, and(
        eq(stockMovements.productId, products.id),
        eq(products.tenantId, context.tenantId)
      ))
      .leftJoin(productVariants, and(
        eq(stockMovements.variantId, productVariants.id),
        eq(productVariants.tenantId, context.tenantId)
      ))
      .where(eq(stockMovements.tenantId, context.tenantId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(1000); // Limit to prevent too much data

    const formattedMovements = movements.map(({ movement, product, variant }) => ({
      id: movement.id,
      productName: product?.name || 'Unknown Product',
      variantTitle: variant?.title || null,
      movementType: movement.movementType,
      // Include both quantity and weight fields
      quantity: movement.quantity,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      weightQuantity: movement.weightQuantity,
      previousWeightQuantity: movement.previousWeightQuantity,
      newWeightQuantity: movement.newWeightQuantity,
      stockManagementType: product?.stockManagementType || 'quantity',
      baseWeightUnit: product?.baseWeightUnit || 'grams',
      reason: movement.reason,
      location: movement.location,
      reference: movement.reference,
      notes: movement.notes,
      costPrice: movement.costPrice,
      supplier: movement.supplier,
      supplierId: movement.supplierId,
      processedBy: movement.processedBy,
      createdAt: movement.createdAt?.toISOString() || new Date().toISOString(),
    }));
    
    return NextResponse.json(formattedMovements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return ErrorResponses.serverError('Failed to fetch stock movements');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { 
      productId, 
      variantId, 
      movementType, 
      quantity, 
      // Weight-based fields
      weightQuantity,
      weightUnit,
      reason, 
      location, 
      reference, 
      notes,
      costPrice,
      supplier,
      supplierId 
    } = await req.json();
    
    // Get product to determine stock management type (within tenant)
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.tenantId, context.tenantId)
      ),
      columns: { stockManagementType: true, baseWeightUnit: true }
    });

    if (!product) {
      return ErrorResponses.tenantNotFound();
    }

    const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

    // Validate required fields based on stock management type
    if (!productId || !movementType || !reason) {
      return ErrorResponses.invalidInput('ProductId, movementType, and reason are required');
    }

    if (isWeightBased) {
      if (!weightQuantity || !weightUnit) {
        return ErrorResponses.invalidInput('Weight quantity and unit are required for weight-based products');
      }
    } else {
      if (!quantity) {
        return ErrorResponses.invalidInput('Quantity is required for quantity-based products');
      }
    }

    // Find existing inventory record within tenant
    let whereConditions = [
      eq(productInventory.productId, productId),
      eq(productInventory.tenantId, context.tenantId)
    ];
    
    if (variantId) {
      whereConditions.push(eq(productInventory.variantId, variantId));
    } else {
      whereConditions.push(isNull(productInventory.variantId));
    }

    const existingInventory = await db
      .select()
      .from(productInventory)
      .where(and(...whereConditions))
      .limit(1);
    
    let newQuantity = 0;
    let newWeightQuantity = 0;
    let inventoryId = '';

    // Convert weight to grams if weight-based
    const weightInGrams = isWeightBased ? convertToGrams(weightQuantity, weightUnit) : 0;

    if (existingInventory.length > 0) {
      const current = existingInventory[0];
      inventoryId = current.id;
      
      if (isWeightBased) {
        // Handle weight-based movements
        const currentWeight = parseFloat(current.weightQuantity || '0');
        
        switch (movementType) {
          case 'in':
            newWeightQuantity = currentWeight + weightInGrams;
            break;
          case 'out':
            newWeightQuantity = currentWeight - weightInGrams;
            if (newWeightQuantity < 0) {
              return ErrorResponses.invalidInput('Insufficient stock for this movement');
            }
            break;
          case 'adjustment':
            newWeightQuantity = weightInGrams; // For adjustments, weight is the new total
            break;
          default:
            return ErrorResponses.invalidInput('Invalid movement type');
        }

        // Update existing weight-based inventory
        await db
          .update(productInventory)
          .set({
            weightQuantity: newWeightQuantity.toString(),
            availableWeight: (newWeightQuantity - parseFloat(current.reservedWeight || '0')).toString(),
            lastRestockDate: movementType === 'in' ? new Date() : current.lastRestockDate,
            supplier: (movementType === 'in' && supplier) ? supplier : current.supplier,
            supplierId: (movementType === 'in' && supplierId) ? supplierId : current.supplierId,
          })
          .where(eq(productInventory.id, current.id));
      } else {
        // Handle quantity-based movements
        switch (movementType) {
          case 'in':
            newQuantity = current.quantity + quantity;
            break;
          case 'out':
            newQuantity = current.quantity - quantity;
            if (newQuantity < 0) {
              return ErrorResponses.invalidInput('Insufficient stock for this movement');
            }
            break;
          case 'adjustment':
            newQuantity = quantity; // For adjustments, quantity is the new total
            break;
          default:
            return ErrorResponses.invalidInput('Invalid movement type');
        }

        // Update existing quantity-based inventory
        await db
          .update(productInventory)
          .set({
            quantity: newQuantity,
            availableQuantity: newQuantity - (current.reservedQuantity || 0),
            lastRestockDate: movementType === 'in' ? new Date() : current.lastRestockDate,
            supplier: (movementType === 'in' && supplier) ? supplier : current.supplier,
            supplierId: (movementType === 'in' && supplierId) ? supplierId : current.supplierId,
          })
          .where(eq(productInventory.id, current.id));
      }
    } else {
      // Create new inventory record if it doesn't exist
      if (movementType === 'out') {
        return ErrorResponses.invalidInput('Cannot remove stock from non-existent inventory');
      }

      inventoryId = uuidv4();

      if (isWeightBased) {
        newWeightQuantity = movementType === 'in' ? weightInGrams : (movementType === 'adjustment' ? weightInGrams : 0);
        
        await db.insert(productInventory).values({
          id: inventoryId,
          tenantId: context.tenantId, // Add tenant ID
          productId,
          variantId: variantId || null,
          // Set quantity fields to 0 for weight-based products
          quantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          reorderPoint: 0,
          reorderQuantity: 0,
          // Set weight fields
          weightQuantity: newWeightQuantity.toString(),
          reservedWeight: '0.00',
          availableWeight: newWeightQuantity.toString(),
          reorderWeightPoint: '0.00',
          reorderWeightQuantity: '0.00',
          location: location || null,
          supplier: supplier || null,
          supplierId: supplierId || null,
          lastRestockDate: movementType === 'in' ? new Date() : null,
        });
      } else {
        newQuantity = movementType === 'in' ? quantity : (movementType === 'adjustment' ? quantity : 0);
        
        await db.insert(productInventory).values({
          id: inventoryId,
          tenantId: context.tenantId, // Add tenant ID
          productId,
          variantId: variantId || null,
          quantity: newQuantity,
          reservedQuantity: 0,
          availableQuantity: newQuantity,
          reorderPoint: 0,
          reorderQuantity: 0,
          // Set weight fields to 0 for quantity-based products
          weightQuantity: '0.00',
          reservedWeight: '0.00',
          availableWeight: '0.00',
          reorderWeightPoint: '0.00',
          reorderWeightQuantity: '0.00',
          location: location || null,
          supplier: supplier || null,
          supplierId: supplierId || null,
          lastRestockDate: movementType === 'in' ? new Date() : null,
        });
      }
    }

    // Insert record into stock_movements table for audit trail
    const movementId = uuidv4();
    const previousQuantity = existingInventory.length > 0 ? existingInventory[0].quantity : 0;
    const previousWeightQuantity = existingInventory.length > 0 ? parseFloat(existingInventory[0].weightQuantity || '0') : 0;
    
    await db.insert(stockMovements).values({
      id: movementId,
      tenantId: context.tenantId, // Add tenant ID
      inventoryId,
      productId,
      variantId: variantId || null,
      movementType,
      // Quantity-based fields
      quantity: quantity || 0,
      previousQuantity,
      newQuantity,
      // Weight-based fields
      weightQuantity: weightInGrams.toString(),
      previousWeightQuantity: previousWeightQuantity.toString(),
      newWeightQuantity: newWeightQuantity.toString(),
      reason,
      location: location || null,
      reference: reference || null,
      notes: notes || null,
      costPrice: costPrice || null,
      supplier: supplier || null,
      supplierId: supplierId || null,
      processedBy: context.userId || null, // Add current user ID
      createdAt: new Date(),
    });
    
    const movementRecord = {
      id: movementId,
      inventoryId,
      productId,
      variantId: variantId || null,
      movementType,
      // Quantity-based fields
      quantity: quantity || 0,
      previousQuantity,
      newQuantity,
      // Weight-based fields
      weightQuantity: weightInGrams,
      previousWeightQuantity,
      newWeightQuantity,
      stockManagementType: product.stockManagementType,
      reason,
      location: location || null,
      reference: reference || null,
      notes: notes || null,
      costPrice: costPrice || null,
      supplier: supplier || null,
      supplierId: supplierId || null,
      createdAt: new Date(),
    };
    
    return NextResponse.json(movementRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return ErrorResponses.serverError('Failed to create stock movement');
  }
});

export const DELETE = withTenant(async (req: NextRequest, context) => {
  try {
    const { ids } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ErrorResponses.invalidInput('Array of stock movement IDs is required');
    }
    
    // Note: Deleting stock movements is generally not recommended in production
    // as it breaks the audit trail. Consider adding a "deleted" flag instead.
    // However, for admin purposes, we'll allow it with a warning.
    
    // Delete all stock movements with the provided IDs within tenant
    await db
      .delete(stockMovements)
      .where(and(
        inArray(stockMovements.id, ids),
        eq(stockMovements.tenantId, context.tenantId)
      ));
    
    return NextResponse.json({ 
      message: `Successfully deleted ${ids.length} stock movement(s)`,
      deletedCount: ids.length,
      warning: 'Deleting stock movements removes audit trail history. Use with caution.'
    });
  } catch (error) {
    console.error('Error deleting stock movements:', error);
    return ErrorResponses.serverError('Failed to delete stock movements');
  }
}); 