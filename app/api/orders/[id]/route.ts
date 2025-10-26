import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, productInventory, stockMovements, user, products, userLoyaltyPoints, loyaltyPointsHistory, settings, suppliers } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull } from 'drizzle-orm';
import { getStockManagementSettingDirect } from '@/lib/stockManagement';
import { isWeightBasedProduct } from '@/utils/weightUtils';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // Fetch order with customer and supplier information
    const orderData = await db
      .select({
        order: orders,
        user: user,
        supplier: suppliers,
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .leftJoin(suppliers, eq(orders.supplierId, suppliers.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Parse addons JSON for each item
    const itemsWithParsedAddons = items.map(item => ({
      ...item,
      addons: item.addons ? JSON.parse(item.addons as string) : null
    }));

    const order = {
      ...orderData[0].order,
      user: orderData[0].user,
      supplier: orderData[0].supplier,
      items: itemsWithParsedAddons
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export const PUT = withTenant(async (req: NextRequest, context: any) => {
  try {
    // Extract orderId from URL path
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const orderId = pathSegments[pathSegments.length - 1];
    const body = await req.json();
    
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      shippingAmount,
      discountAmount,
      notes,
      shippingMethod,
      trackingNumber,
      cancelReason,
      assignedDriverId,
      deliveryStatus,
      previousStatus,
      previousPaymentStatus,
      // Loyalty points fields
      pointsToRedeem,
      pointsDiscountAmount,
      // Invoice and validation fields
      invoiceType,
      invoiceRefNo,
      scenarioId,
      invoiceNumber,
      invoiceDate,
      validationResponse,
      isProductionSubmission,
      productionToken,
      
      // FBR submission fields for edit order
      email,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      
      // Buyer fields
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      
      // Seller fields
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      fbrSandboxToken,
      fbrBaseUrl,
      
      // Billing/Shipping addresses
      billingFirstName,
      billingLastName,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      shippingFirstName,
      shippingLastName,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      
      // Email and FBR submission control flags
      skipCustomerEmail,
      skipSellerEmail,
      skipFbrSubmission
    } = body;

    // Get current order and items for stock management
    const currentOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (currentOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const order = currentOrder[0];

    // FBR Digital Invoicing Validation (BEFORE order update)
    let fbrResponse = null;
    let fbrInvoiceNumber = null;
    
    if (scenarioId && items && !skipFbrSubmission) {
      console.log(`\n=== FBR DIGITAL INVOICING VALIDATION (EDIT ORDER) ===`);
      console.log(`Scenario: ${scenarioId}, Invoice Type: ${invoiceType || 'Sale Invoice'}`);
      
      // Helper function to format date for FBR without timezone conversion
      function formatDateForFbr(dateInput: string | Date): string {
        let date: Date;
        
        if (typeof dateInput === 'string') {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
          }
          // If it contains time info, parse it carefully
          if (dateInput.includes('T')) {
            date = new Date(dateInput);
          } else {
            // Parse as local date without timezone conversion
            const [year, month, day] = dateInput.split('-').map(Number);
            date = new Date(year, month - 1, day);
          }
        } else {
          date = dateInput;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Validate that invoice date is provided for FBR submission
      if (!invoiceDate) {
        return NextResponse.json({ 
          error: 'Invoice date is required for FBR integration. Please set the invoice date in the Invoice & Validation section.',
          step: 'validation'
        }, { status: 400 });
      }
      
      try {
        // Prepare order data for FBR submission
        const orderForFbr = {
          email: email || order.email,
          scenarioId,
          invoiceType: invoiceType || 'Sale Invoice',
          invoiceDate: invoiceDate ? formatDateForFbr(invoiceDate) : undefined,
          invoiceRefNo,
          subtotal: parseFloat((subtotal || order.subtotal).toString()),
          totalAmount: parseFloat((totalAmount || order.totalAmount).toString()),
          taxAmount: parseFloat((taxAmount || order.taxAmount || 0).toString()),
          currency: currency || order.currency,
          
          // Buyer information
          buyerNTNCNIC: buyerNTNCNIC || order.buyerNTNCNIC,
          buyerBusinessName: buyerBusinessName || order.buyerBusinessName,
          buyerProvince: buyerProvince || order.buyerProvince,
          buyerAddress: buyerAddress || order.buyerAddress,
          buyerRegistrationType: buyerRegistrationType || order.buyerRegistrationType || 'Unregistered',
          
          // Seller information (for FBR Digital Invoicing)
          sellerNTNCNIC,
          sellerBusinessName,
          sellerProvince,
          sellerAddress,
          fbrSandboxToken,
          fbrBaseUrl,
          
          // Billing/Shipping addresses for fallback buyer info
          billingFirstName: billingFirstName || order.billingFirstName,
          billingLastName: billingLastName || order.billingLastName,
          billingAddress1: billingAddress1 || order.billingAddress1,
          billingAddress2: billingAddress2 || order.billingAddress2,
          billingCity: billingCity || order.billingCity,
          billingState: billingState || order.billingState,
          billingPostalCode: billingPostalCode || order.billingPostalCode,
          billingCountry: billingCountry || order.billingCountry,
          shippingFirstName: shippingFirstName || order.shippingFirstName,
          shippingLastName: shippingLastName || order.shippingLastName,
          shippingAddress1: shippingAddress1 || order.shippingAddress1,
          shippingAddress2: shippingAddress2 || order.shippingAddress2,
          shippingCity: shippingCity || order.shippingCity,
          shippingState: shippingState || order.shippingState,
          shippingPostalCode: shippingPostalCode || order.shippingPostalCode,
          shippingCountry: shippingCountry || order.shippingCountry,
          
          // Order items with all FBR-required fields
          items: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productDescription: item.productDescription || item.productName,
            variantTitle: item.variantTitle,
            sku: item.sku,
            hsCode: item.hsCode,
            uom: item.uom || 'PCS',
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            totalPrice: parseFloat(item.totalPrice.toString()),
            
            // Weight-based fields
            isWeightBased: item.isWeightBased || false,
            weightQuantity: item.weightQuantity,
            weightUnit: item.weightUnit,
            
            // Tax and additional fields
            taxAmount: item.taxAmount,
            taxPercentage: item.taxPercentage,
            priceIncludingTax: item.priceIncludingTax,
            priceExcludingTax: item.priceExcludingTax,
            extraTax: item.extraTax,
            furtherTax: item.furtherTax,
            fedPayableTax: item.fedPayableTax,
            discount: item.discount,
            
            // FBR-specific fields
            itemSerialNumber: item.itemSerialNumber,
            sroScheduleNumber: item.sroScheduleNumber,
            fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice,
          }))
        };

        // Submit to FBR via our internal API (unless skipped)
        // 🔍 DEBUG: Log the exact JSON being sent to FBR
        console.log('\n🔍 === FBR SUBMISSION DEBUG (EDIT) ===');
        console.log('📤 Order data being sent to FBR mapper:');
        console.log(JSON.stringify(orderForFbr, null, 2));
        if (isProductionSubmission) {
          console.log('🚨 PRODUCTION MODE ENABLED - Will use production FBR endpoints');
        }
        console.log('=================================\n');

        // Add production mode parameters to the FBR submission
        const fbrPayload = {
          ...orderForFbr,
          // Override token and production flag if production mode is enabled
          ...(isProductionSubmission && productionToken && {
            fbrSandboxToken: productionToken,
            isProductionSubmission: true
          })
        };

        const fbrSubmissionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/fbr/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fbrPayload),
        });

        const fbrResult = await fbrSubmissionResponse.json();
        fbrResponse = fbrResult;

        if (fbrResponse.ok && fbrResponse.response?.invoiceNumber) {
          console.log('✅ FBR submission successful:', {
            step: fbrResponse.step,
            invoiceNumber: fbrResponse.response?.invoiceNumber,
            message: fbrResponse.response?.message,
          });
          
          fbrInvoiceNumber = fbrResponse.response.invoiceNumber;
        } else {
          console.error('❌ FBR submission failed:', {
            step: fbrResponse.step,
            error: fbrResponse.error,
            validationError: fbrResponse.response?.validationResponse?.error,
          });
        
          // Return error immediately - don't update the order
          let errorMessage = 'FBR Digital Invoice submission failed';
          
          if (fbrResponse.response?.validationResponse?.error) {
            errorMessage += `: ${fbrResponse.response.validationResponse.error}`;
          } else if (fbrResponse.error) {
            errorMessage += `: ${fbrResponse.error}`;
          }
          
          // Include detailed validation errors if available
          if (fbrResponse.response?.validationResponse?.invoiceStatuses) {
            const itemErrors = fbrResponse.response.validationResponse.invoiceStatuses
              .filter((status: any) => status.error)
              .map((status: any) => `Item ${status.itemSNo}: ${status.error}`)
              .join('; ');
            
            if (itemErrors) {
              errorMessage += `. Details: ${itemErrors}`;
            }
          }
          
          return NextResponse.json({ 
            error: errorMessage,
            fbrError: {
              ...fbrResponse,
              fbrInvoice: fbrResponse.fbrInvoice // Pass through the generated FBR payload
            },
            step: 'fbr_validation'
          }, { status: 400 });
        }
      } catch (fbrError) {
        console.error('❌ Error during FBR submission:', fbrError);
        
        return NextResponse.json({ 
          error: `FBR submission failed: ${fbrError instanceof Error ? fbrError.message : String(fbrError)}`,
          step: 'fbr_connection'
        }, { status: 500 });
      }
      console.log(`=== END FBR DIGITAL INVOICING VALIDATION ===\n`);
    } else if (scenarioId && !items) {
      console.log('⚠️ FBR submission skipped - no items provided for edit order');
    } else if (scenarioId && skipFbrSubmission) {
      console.log('⏭️ Skipping FBR submission as requested');
      fbrResponse = { skipped: true, message: 'FBR submission skipped by user request' };
    }

    // Check if stock management is enabled
    const stockManagementEnabled = await getStockManagementSettingDirect();

    // Handle stock management based on status changes (only if stock management is enabled)
    if (stockManagementEnabled && status && status !== previousStatus) {
      await handleStockManagement(
        orderItemsData,
        previousStatus,
        status,
        order.orderNumber,
        context
      );
    }

    // Note: Payment status changes no longer affect inventory since stock is deducted at order creation

    // Calculate new total if shipping, discount, or points discount changed
    let newTotalAmount: number = Number(order.totalAmount);
    if (shippingAmount !== undefined || discountAmount !== undefined || pointsDiscountAmount !== undefined) {
      const newShipping = shippingAmount !== undefined ? shippingAmount : Number(order.shippingAmount);
      const newDiscount = discountAmount !== undefined ? discountAmount : Number(order.discountAmount);
      const newPointsDiscount = pointsDiscountAmount !== undefined ? pointsDiscountAmount : Number(order.pointsDiscountAmount);
      
      // Recalculate: subtotal - discount - points discount + tax + shipping
      const subtotalAfterDiscounts = Number(order.subtotal) - newDiscount - newPointsDiscount;
      newTotalAmount = Math.max(0, subtotalAfterDiscounts + Number(order.taxAmount || 0) + newShipping);
    }

    // Update order items if provided (for cases like "Fetch Products Data by SKU")
    if (items && Array.isArray(items)) {
      console.log(`\n=== UPDATING ORDER ITEMS ===`);
      console.log(`Updating ${items.length} order items with fresh data`);
      
      // Update each order item with the new data
      for (const item of items) {
        if (!item.id) {
          console.warn('Skipping item without ID:', item);
          continue;
        }
        
        const itemUpdateData: any = {
          updatedAt: new Date(),
        };
        
        // Update all the fields that might have been calculated
        if (item.productName !== undefined) itemUpdateData.productName = item.productName;
        if (item.productDescription !== undefined) itemUpdateData.productDescription = item.productDescription;
        if (item.price !== undefined) itemUpdateData.price = item.price.toString();
        if (item.totalPrice !== undefined) itemUpdateData.totalPrice = item.totalPrice.toString();
        if (item.hsCode !== undefined) itemUpdateData.hsCode = item.hsCode;
        if (item.uom !== undefined) itemUpdateData.uom = item.uom;
        if (item.serialNumber !== undefined) itemUpdateData.serialNumber = item.serialNumber;
        if (item.listNumber !== undefined) itemUpdateData.listNumber = item.listNumber;
        if (item.bcNumber !== undefined) itemUpdateData.bcNumber = item.bcNumber;
        if (item.lotNumber !== undefined) itemUpdateData.lotNumber = item.lotNumber;
        if (item.expiryDate !== undefined) itemUpdateData.expiryDate = item.expiryDate;
        if (item.saleType !== undefined) itemUpdateData.saleType = item.saleType;
        
        // Tax and pricing fields - these are the key ones for the fix
        if (item.taxAmount !== undefined) itemUpdateData.taxAmount = item.taxAmount.toString();
        if (item.taxPercentage !== undefined) itemUpdateData.taxPercentage = item.taxPercentage.toString();
        if (item.priceIncludingTax !== undefined) itemUpdateData.priceIncludingTax = item.priceIncludingTax.toString();
        if (item.priceExcludingTax !== undefined) itemUpdateData.priceExcludingTax = item.priceExcludingTax.toString();
        if (item.extraTax !== undefined) itemUpdateData.extraTax = item.extraTax.toString();
        if (item.furtherTax !== undefined) itemUpdateData.furtherTax = item.furtherTax.toString();
        if (item.fedPayableTax !== undefined) itemUpdateData.fedPayableTax = item.fedPayableTax.toString();
        if (item.discount !== undefined) itemUpdateData.discount = item.discount.toString();
        if (item.fixedNotifiedValueOrRetailPrice !== undefined) itemUpdateData.fixedNotifiedValueOrRetailPrice = item.fixedNotifiedValueOrRetailPrice.toString();
        
        console.log(`Updating order item ${item.id} with calculated pricing:`, {
          taxAmount: item.taxAmount,
          taxPercentage: item.taxPercentage,
          priceIncludingTax: item.priceIncludingTax,
          priceExcludingTax: item.priceExcludingTax,
          totalPrice: item.totalPrice
        });
        
        await db
          .update(orderItems)
          .set(itemUpdateData)
          .where(eq(orderItems.id, item.id));
      }
      console.log(`Successfully updated ${items.length} order items in database`);
      console.log(`=== END UPDATING ORDER ITEMS ===\n`);
    }

    // Update the main order record
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (fulfillmentStatus !== undefined) updateData.fulfillmentStatus = fulfillmentStatus;
    if (shippingAmount !== undefined) updateData.shippingAmount = shippingAmount;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
    if (notes !== undefined) updateData.notes = notes;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
    if (assignedDriverId !== undefined) updateData.assignedDriverId = assignedDriverId || null;
    if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;
    if (pointsToRedeem !== undefined) updateData.pointsToRedeem = pointsToRedeem;
    if (pointsDiscountAmount !== undefined) updateData.pointsDiscountAmount = pointsDiscountAmount;
    if (invoiceType !== undefined) updateData.invoiceType = invoiceType;
    if (invoiceRefNo !== undefined) updateData.invoiceRefNo = invoiceRefNo;
    if (scenarioId !== undefined) updateData.scenarioId = scenarioId;
    if (invoiceNumber !== undefined || fbrInvoiceNumber) updateData.invoiceNumber = fbrInvoiceNumber || invoiceNumber;
    if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate ? (typeof invoiceDate === 'string' && invoiceDate.includes('T') ? new Date(invoiceDate) : new Date(invoiceDate + 'T00:00:00.000Z')) : null;
    if (validationResponse !== undefined || fbrResponse) updateData.validationResponse = fbrResponse ? JSON.stringify(fbrResponse) : validationResponse;
    if (isProductionSubmission !== undefined) updateData.fbrEnvironment = isProductionSubmission ? 'production' : 'sandbox';
    if (newTotalAmount !== Number(order.totalAmount)) updateData.totalAmount = newTotalAmount;
    
    // Update calculated totals if provided
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    // Handle points redemption changes if points were modified
    if (pointsToRedeem !== undefined && order.userId && pointsToRedeem > 0) {
      const currentPointsRedeemed = Number(order.pointsToRedeem) || 0;
      const pointsDifference = pointsToRedeem - currentPointsRedeemed;
      
      if (pointsDifference !== 0) {
        console.log(`\n=== POINTS REDEMPTION UPDATE ===`);
        console.log(`Order: ${order.orderNumber}, UserId: ${order.userId}, Points difference: ${pointsDifference}, New discount: ${pointsDiscountAmount}`);
        
        try {
          if (pointsDifference > 0) {
            // Additional points being redeemed
            await redeemLoyaltyPointsForEdit(
              order.userId, 
              orderId, 
              pointsDifference, 
              (Number(pointsDiscountAmount) || 0) - (Number(order.pointsDiscountAmount) || 0),
              `Additional redemption for order #${order.orderNumber}`
            );
            console.log(`✅ Successfully redeemed additional ${pointsDifference} points for user ${order.userId}`);
          } else {
            // Points being refunded (negative difference)
            await refundLoyaltyPoints(
              order.userId,
              Math.abs(pointsDifference),
              `Points refund for order #${order.orderNumber} adjustment`
            );
            console.log(`✅ Successfully refunded ${Math.abs(pointsDifference)} points for user ${order.userId}`);
          }
        } catch (pointsError) {
          console.error('❌ Error processing points redemption update:', pointsError);
          // Don't fail the order update if points processing fails
        }
        console.log(`=== END POINTS REDEMPTION UPDATE ===\n`);
      }
    }

    // Handle loyalty points when order status changes (integrated logic)
    console.log(`Points check: status=${status}, previousStatus=${previousStatus}, userId=${order.userId}`);
    if (status && status !== previousStatus && order.userId) {
      console.log(`Order status changed from ${previousStatus} to ${status} for order ${order.orderNumber} for user ${order.userId}`);
      try {
        await updateLoyaltyPointsStatus(order.userId, orderId, previousStatus, status);
        console.log(`Successfully processed points status update for user ${order.userId} for order ${order.orderNumber}`);
      } catch (pointsError) {
        console.error('Error updating loyalty points status:', pointsError);
        // Don't fail the order update if points update fails
      }
    } else {
      console.log(`Points status not updated - conditions not met: statusChanged=${status !== previousStatus}, hasUser=${!!order.userId}`);
    }

    // Fetch updated order with items
    const updatedOrderData = await db
      .select({
        order: orders,
        user: user,
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    const updatedItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const updatedOrder = {
      ...updatedOrderData[0].order,
      user: updatedOrderData[0].user,
      items: updatedItems,
      fbrResponse: fbrResponse, // Include FBR submission result
      fbrInvoiceNumber: fbrInvoiceNumber, // Include FBR invoice number
      success: true,
      message: fbrInvoiceNumber ? `Order updated successfully with FBR Invoice ${fbrInvoiceNumber}` : 'Order updated successfully'
    };

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // Get order items for stock restoration
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if stock management is enabled for deletion
    const stockManagementEnabledForDeletion = await getStockManagementSettingDirect();

    // Restore inventory if order was not cancelled (only if stock management is enabled)
    // Since inventory is now reserved when orders are created, we need to restore it unless it was already cancelled
    if (stockManagementEnabledForDeletion && order[0].status !== 'cancelled') {
      await restoreInventoryFromOrder(orderItemsData, order[0].orderNumber, { tenantId: 'default' }); // TODO: Get actual tenantId
    }

    // Delete order items first (foreign key constraint)
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

// Helper function to handle stock management based on status changes
async function handleStockManagement(
  orderItems: any[],
  previousStatus: string,
  newStatus: string,
  orderNumber: string,
  context: any
) {
  for (const item of orderItems) {
    // Get product to determine stock management type
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
      columns: { stockManagementType: true }
    });

    if (!product) {
      console.warn(`Product not found for status change: ${item.productName}`);
      continue;
    }

    const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

    const inventoryConditions = [eq(productInventory.productId, item.productId)];
    
    if (item.variantId) {
      inventoryConditions.push(eq(productInventory.variantId, item.variantId));
    } else {
      inventoryConditions.push(isNull(productInventory.variantId));
    }

    const currentInventory = await db
      .select()
      .from(productInventory)
      .where(and(...inventoryConditions))
      .limit(1);

    if (currentInventory.length === 0) continue;

    const inventory = currentInventory[0];
    let updateNeeded = false;
    let movementType = '';
    let reason = '';

    if (isWeightBased) {
      // Handle weight-based inventory
      let newWeightQuantity = parseFloat(inventory.weightQuantity || '0');
      let newReservedWeight = parseFloat(inventory.reservedWeight || '0');
      let newAvailableWeight = parseFloat(inventory.availableWeight || '0');
      const itemWeight = parseFloat(item.weightQuantity || '0');

      // Handle status transitions for weight-based products
      if (newStatus === 'cancelled') {
        // Restore weight when order is cancelled (inventory was deducted when order was created)
        newWeightQuantity += itemWeight;
        newAvailableWeight = newWeightQuantity - newReservedWeight;
        movementType = 'in';
        reason = 'Order Cancelled - Weight Restored';
        updateNeeded = true;
      }
      // Note: No action needed for 'completed' status since stock was already deducted at order creation

      if (updateNeeded) {
        // Update weight-based inventory
        await db
          .update(productInventory)
          .set({
            weightQuantity: newWeightQuantity.toString(),
            reservedWeight: newReservedWeight.toString(),
            availableWeight: newAvailableWeight.toString(),
            updatedAt: new Date(),
          })
          .where(eq(productInventory.id, inventory.id));

        // Create stock movement record
        await db.insert(stockMovements).values({
          id: uuidv4(),
          tenantId: context.tenantId,
          inventoryId: inventory.id,
          productId: item.productId,
          variantId: item.variantId || null,
          movementType,
          quantity: 0, // No quantity change for weight-based
          previousQuantity: inventory.quantity,
          newQuantity: inventory.quantity,
          weightQuantity: itemWeight.toString(),
          previousWeightQuantity: parseFloat(inventory.weightQuantity || '0').toString(),
          newWeightQuantity: newWeightQuantity.toString(),
          reason,
          reference: orderNumber,
          notes: `Status changed from ${previousStatus} to ${newStatus}`,
          processedBy: null,
          createdAt: new Date(),
        });
      }
    } else {
      // Handle quantity-based inventory
      let newQuantity = inventory.quantity;
      let newReservedQuantity = inventory.reservedQuantity || 0;
      let newAvailableQuantity = inventory.availableQuantity || 0;

      // Handle status transitions for quantity-based products
      if (newStatus === 'cancelled') {
        // Restore quantity when order is cancelled (inventory was deducted when order was created)
        newQuantity += item.quantity;
        newAvailableQuantity = newQuantity - newReservedQuantity;
        movementType = 'in';
        reason = 'Order Cancelled - Quantity Restored';
        updateNeeded = true;
      }
      // Note: No action needed for 'completed' status since stock was already deducted at order creation

      if (updateNeeded) {
        // Update quantity-based inventory
        await db
          .update(productInventory)
          .set({
            quantity: newQuantity,
            reservedQuantity: newReservedQuantity,
            availableQuantity: newAvailableQuantity,
            updatedAt: new Date(),
          })
          .where(eq(productInventory.id, inventory.id));

        // Create stock movement record
        await db.insert(stockMovements).values({
          id: uuidv4(),
          tenantId: context.tenantId,
          inventoryId: inventory.id,
          productId: item.productId,
          variantId: item.variantId || null,
          movementType,
          quantity: item.quantity,
          previousQuantity: inventory.quantity,
          newQuantity: newQuantity,
          weightQuantity: '0.00',
          previousWeightQuantity: '0.00',
          newWeightQuantity: '0.00',
          reason,
          reference: orderNumber,
          notes: `Status changed from ${previousStatus} to ${newStatus}`,
          processedBy: null,
          createdAt: new Date(),
        });
      }
    }
  }
}



// Helper function to restore inventory when order is deleted
async function restoreInventoryFromOrder(orderItems: any[], orderNumber: string, context: any) {
  for (const item of orderItems) {
    // Get product to determine stock management type
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
      columns: { stockManagementType: true }
    });

    if (!product) {
      console.warn(`Product not found for inventory restoration: ${item.productName}`);
      continue;
    }

    const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

    const inventoryConditions = [eq(productInventory.productId, item.productId)];
    
    if (item.variantId) {
      inventoryConditions.push(eq(productInventory.variantId, item.variantId));
    } else {
      inventoryConditions.push(isNull(productInventory.variantId));
    }

    const currentInventory = await db
      .select()
      .from(productInventory)
      .where(and(...inventoryConditions))
      .limit(1);

    if (currentInventory.length === 0) continue;

    const inventory = currentInventory[0];

    if (isWeightBased) {
      // Handle weight-based inventory restoration
      const currentReservedWeight = parseFloat(inventory.reservedWeight || '0');
      const currentWeightQuantity = parseFloat(inventory.weightQuantity || '0');
      const itemWeight = parseFloat(item.weightQuantity || '0');
      
      const newWeightQuantity = currentWeightQuantity + itemWeight;
      const newAvailableWeight = newWeightQuantity - currentReservedWeight;

      // Update inventory
      await db
        .update(productInventory)
        .set({
          weightQuantity: newWeightQuantity.toString(),
          availableWeight: newAvailableWeight.toString(),
          updatedAt: new Date(),
        })
        .where(eq(productInventory.id, inventory.id));

      // Create stock movement record
      await db.insert(stockMovements).values({
        id: uuidv4(),
        tenantId: context.tenantId,
        inventoryId: inventory.id,
        productId: item.productId,
        variantId: item.variantId || null,
        movementType: 'in',
        quantity: 0, // No quantity change for weight-based
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity,
        weightQuantity: itemWeight.toString(),
        previousWeightQuantity: currentWeightQuantity.toString(),
        newWeightQuantity: newWeightQuantity.toString(),
        reason: 'Order Deleted - Weight Restored',
        reference: orderNumber,
        notes: `Order ${orderNumber} was deleted, ${itemWeight}g restored to inventory`,
        processedBy: null,
        createdAt: new Date(),
      });
    } else {
      // Handle quantity-based inventory restoration
      const currentReservedQuantity = inventory.reservedQuantity || 0;
      const newQuantity = inventory.quantity + item.quantity;
      const newAvailableQuantity = newQuantity - currentReservedQuantity;

      // Update inventory
      await db
        .update(productInventory)
        .set({
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
          updatedAt: new Date(),
        })
        .where(eq(productInventory.id, inventory.id));

      // Create stock movement record
      await db.insert(stockMovements).values({
        id: uuidv4(),
        tenantId: context.tenantId,
        inventoryId: inventory.id,
        productId: item.productId,
        variantId: item.variantId || null,
        movementType: 'in',
        quantity: item.quantity,
        previousQuantity: inventory.quantity,
        newQuantity: newQuantity,
        weightQuantity: '0.00',
        previousWeightQuantity: '0.00',
        newWeightQuantity: '0.00',
        reason: 'Order Deleted - Quantity Restored',
        reference: orderNumber,
        notes: `Order ${orderNumber} was deleted, ${item.quantity} units restored to inventory`,
        processedBy: null,
        createdAt: new Date(),
      });
    }
  }
}

// Helper function to update loyalty points status
async function updateLoyaltyPointsStatus(userId: string, orderId: string, previousStatus: string, newStatus: string) {
  console.log('=== UPDATE POINTS STATUS FUNCTION ===');
  console.log('Parameters:', { userId, orderId, previousStatus, newStatus });

  // Check if loyalty is enabled
  const loyaltyEnabled = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'loyalty_enabled'))
    .limit(1);

  if (loyaltyEnabled.length === 0 || loyaltyEnabled[0]?.value !== 'true') {
    console.log('Loyalty system is disabled');
    return;
  }

  // Handle status change to completed - activate pending points
  if (newStatus === 'completed' && previousStatus !== 'completed') {
    console.log('Activating pending points for completed order');
    
    try {
      // Get pending points for this order
      const pendingHistory = await db
        .select()
        .from(loyaltyPointsHistory)
        .where(
          and(
            eq(loyaltyPointsHistory.userId, userId),
            eq(loyaltyPointsHistory.orderId, orderId),
            eq(loyaltyPointsHistory.status, 'pending'),
            eq(loyaltyPointsHistory.transactionType, 'earned')
          )
        );

      if (pendingHistory.length === 0) {
        console.log('No pending points found for this order');
        return;
      }

      const pointsToActivate = pendingHistory.reduce((sum, record) => sum + (record.points || 0), 0);
      console.log(`Points to activate: ${pointsToActivate}`);

      // Update user points - move from pending to available
      const userPoints = await db
        .select()
        .from(userLoyaltyPoints)
        .where(eq(userLoyaltyPoints.userId, userId))
        .limit(1);

      if (userPoints.length > 0) {
        const current = userPoints[0];
        await db.update(userLoyaltyPoints)
          .set({
            availablePoints: (current?.availablePoints || 0) + pointsToActivate,
            pendingPoints: Math.max(0, (current?.pendingPoints || 0) - pointsToActivate),
            updatedAt: new Date()
          })
          .where(eq(userLoyaltyPoints.userId, userId));
        console.log('Updated user points - moved from pending to available');
      }

      // Update history records to available status
      for (const record of pendingHistory) {
        await db.update(loyaltyPointsHistory)
          .set({
            status: 'available',
            pointsBalance: (userPoints[0]?.availablePoints || 0) + pointsToActivate
          })
          .where(eq(loyaltyPointsHistory.id, record.id));
      }
      console.log('Updated history records to available status');

      console.log(`Successfully activated ${pointsToActivate} points for user ${userId}`);

    } catch (dbError) {
      console.error('Database error in update points status:', dbError);
      throw dbError;
    }
  }

  // Handle other status changes (if needed in the future)
  console.log(`No action needed for status change from ${previousStatus} to ${newStatus}`);
}

// Helper function to redeem loyalty points for edit order
async function redeemLoyaltyPointsForEdit(userId: string, orderId: string, pointsToRedeem: number, discountAmount: number, description: string) {
  console.log('=== REDEEM POINTS FOR EDIT FUNCTION ===');
  console.log('Parameters:', { userId, orderId, pointsToRedeem, discountAmount, description });

  // Check if loyalty is enabled
  const loyaltyEnabled = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'loyalty_enabled'))
    .limit(1);

  if (loyaltyEnabled.length === 0 || loyaltyEnabled[0]?.value !== 'true') {
    console.log('Loyalty system is disabled');
    throw new Error('Loyalty points system is disabled');
  }

  // Get user's available points
  const userPoints = await db
    .select()
    .from(userLoyaltyPoints)
    .where(eq(userLoyaltyPoints.userId, userId))
    .limit(1);

  if (userPoints.length === 0 || (userPoints[0]?.availablePoints || 0) < pointsToRedeem) {
    console.log(`Insufficient points. Available: ${userPoints[0]?.availablePoints || 0}, Requested: ${pointsToRedeem}`);
    throw new Error('Insufficient points available');
  }

  const newBalance = (userPoints[0]?.availablePoints || 0) - pointsToRedeem;

  // Update user points
  await db.update(userLoyaltyPoints)
    .set({
      totalPointsRedeemed: (userPoints[0]?.totalPointsRedeemed || 0) + pointsToRedeem,
      availablePoints: newBalance,
      lastRedeemedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(userLoyaltyPoints.userId, userId));

  // Add history record
  await db.insert(loyaltyPointsHistory).values({
    id: uuidv4(),
    userId,
    orderId,
    transactionType: 'redeemed',
    status: 'available',
    points: -pointsToRedeem, // negative for redeemed
    pointsBalance: newBalance,
    description: description,
    orderAmount: null,
    discountAmount: discountAmount.toString(),
    expiresAt: null,
    isExpired: false,
    processedBy: null,
    metadata: {
      pointsToRedeem,
      discountAmount
    },
    createdAt: new Date()
  });

  console.log(`Successfully redeemed ${pointsToRedeem} points for user ${userId}. New balance: ${newBalance}`);
}

// Helper function to refund loyalty points
async function refundLoyaltyPoints(userId: string, pointsToRefund: number, reason: string) {
  console.log('=== REFUND POINTS FUNCTION ===');
  console.log('Parameters:', { userId, pointsToRefund, reason });

  // Get user's current points
  const userPoints = await db
    .select()
    .from(userLoyaltyPoints)
    .where(eq(userLoyaltyPoints.userId, userId))
    .limit(1);

  if (userPoints.length === 0) {
    console.log('User loyalty points record not found, creating one');
    // Create new record if it doesn't exist
    await db.insert(userLoyaltyPoints).values({
      id: uuidv4(),
      userId,
      totalPointsEarned: 0,
      totalPointsRedeemed: Math.max(0, -pointsToRefund), // Adjust if refunding
      availablePoints: pointsToRefund,
      pendingPoints: 0,
      pointsExpiringSoon: 0,
      lastEarnedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    const currentRecord = userPoints[0];
    const newBalance = (currentRecord.availablePoints || 0) + pointsToRefund;
    const newTotalRedeemed = Math.max(0, (currentRecord.totalPointsRedeemed || 0) - pointsToRefund);

    // Update existing record
    await db.update(userLoyaltyPoints)
      .set({
        availablePoints: newBalance,
        totalPointsRedeemed: newTotalRedeemed,
        updatedAt: new Date()
      })
      .where(eq(userLoyaltyPoints.userId, userId));
  }

  // Add history record
  const currentBalance = (userPoints[0]?.availablePoints || 0) + pointsToRefund;
  await db.insert(loyaltyPointsHistory).values({
    id: uuidv4(),
    userId,
    orderId: null,
    transactionType: 'manual_adjustment',
    status: 'available',
    points: pointsToRefund, // positive for refund
    pointsBalance: currentBalance,
    description: reason,
    orderAmount: null,
    discountAmount: null,
    expiresAt: null,
    isExpired: false,
    processedBy: 'system',
    metadata: {
      adjustmentType: 'refund',
      previousBalance: userPoints[0]?.availablePoints || 0
    },
    createdAt: new Date()
  });

  console.log(`Successfully refunded ${pointsToRefund} points for user ${userId}. New balance: ${currentBalance}`);
} 