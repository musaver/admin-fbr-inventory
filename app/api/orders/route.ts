import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, productInventory, stockMovements, products, productVariants, user, drivers, userLoyaltyPoints, loyaltyPointsHistory, settings, suppliers } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, desc, or, sql } from 'drizzle-orm';
import { getStockManagementSettingDirect } from '@/lib/stockManagement';
import { isWeightBasedProduct, convertToGrams } from '@/utils/weightUtils';
import { sendInvoiceEmails } from '@/lib/email';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

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

export const GET = withTenant(async (req: NextRequest, context) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const assignedDriverId = searchParams.get('assignedDriverId');
    const orderType = searchParams.get('orderType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where conditions including tenant filter
    const whereConditions = [eq(orders.tenantId, context.tenantId)];
    if (assignedDriverId) {
      whereConditions.push(eq(orders.assignedDriverId, assignedDriverId));
    }
    if (orderType) {
      whereConditions.push(eq(orders.orderType, orderType));
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(orders)
      .where(and(...whereConditions));
    const totalCount = Number(totalCountResult[0]?.count || 0);
    
    // Fetch orders with customer information and item counts (optimized for performance)
    const ordersWithDetails = await db
      .select({
        order: orders,
        user: user,
        itemCount: sql`(SELECT COUNT(*) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`.as('itemCount')
      })
      .from(orders)
      .leftJoin(user, and(
        eq(orders.userId, user.id),
        eq(user.tenantId, context.tenantId)
      ))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Map simplified order data with essential invoice fields
    const simplifiedOrders = ordersWithDetails.map((orderData) => ({
      id: orderData.order.id,
      orderNumber: orderData.order.orderNumber,
      email: orderData.order.email,
      phone: orderData.order.phone,
      subtotal: orderData.order.subtotal,
      taxAmount: orderData.order.taxAmount,
      shippingAmount: orderData.order.shippingAmount,
      discountAmount: orderData.order.discountAmount,
      totalAmount: orderData.order.totalAmount,
      currency: orderData.order.currency,
      createdAt: orderData.order.createdAt,
      updatedAt: orderData.order.updatedAt,
      user: orderData.user,
      itemCount: Number(orderData.itemCount) || 0,
      // Invoice and FBR fields
      invoiceNumber: orderData.order.invoiceNumber,
      invoiceDate: orderData.order.invoiceDate,
      invoiceType: orderData.order.invoiceType,
      invoiceRefNo: orderData.order.invoiceRefNo,
      fbrEnvironment: orderData.order.fbrEnvironment,
      scenarioId: orderData.order.scenarioId,
      validationResponse: orderData.order.validationResponse
    }));

    return NextResponse.json({
      data: simplifiedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return ErrorResponses.serverError('Failed to fetch orders');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const body = await req.json();
    const {
      userId,
      email,
      phone,
      status = 'pending',
      paymentStatus = 'pending',
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      currency = 'USD',
      notes,
      
      // Purchase Order fields
      orderType = 'customer',
      supplierId,
      purchaseOrderNumber,
      expectedDeliveryDate,
      
      // Driver assignment fields
      assignedDriverId,
      deliveryStatus = 'pending',
      
      // Loyalty points fields
      pointsToRedeem = 0,
      pointsDiscountAmount = 0,
      
      // Invoice and validation fields
      invoiceType,
      invoiceRefNo,
      scenarioId,
      invoiceNumber,
      invoiceDate,
      validationResponse,
      
      // Billing address
      billingFirstName,
      billingLastName,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      
      // Shipping address
      shippingFirstName,
      shippingLastName,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      
      // Order items
      items,
      
      // Buyer fields (from selected customer)
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      
      // Seller fields (for FBR Digital Invoicing)
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      fbrSandboxToken,
      fbrBaseUrl,
      
      // Email and FBR submission control flags
      skipCustomerEmail,
      skipSellerEmail,
      skipFbrSubmission,
      
      // Production environment fields
      isProductionSubmission,
      productionToken
    } = body;

    // Validate required fields
    if (!email || !items || items.length === 0) {
      return NextResponse.json({ error: 'Email and items are required' }, { status: 400 });
    }

    if (!subtotal || !totalAmount) {
      return NextResponse.json({ error: 'Subtotal and total amount are required' }, { status: 400 });
    }

    // Generate order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const orderId = uuidv4();

    // Check if stock management is enabled
    const stockManagementEnabled = await getStockManagementSettingDirect();

    // Validate inventory for all items before creating order (only if stock management is enabled)
    if (stockManagementEnabled) {
      for (const item of items) {
        // Get product to determine stock management type (within tenant)
        const product = await db.query.products.findFirst({
          where: and(
            eq(products.id, item.productId),
            eq(products.tenantId, context.tenantId)
          ),
          columns: { stockManagementType: true }
        });

        if (!product) {
          return ErrorResponses.invalidInput(`Product not found for ${item.productName}`);
        }

        const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

        const inventoryConditions = [
          eq(productInventory.productId, item.productId),
          eq(productInventory.tenantId, context.tenantId)
        ];
        
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

        // When stock management is enabled, require inventory records for all products
        if (currentInventory.length === 0) {
          return ErrorResponses.invalidInput(`No inventory record found for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Please create an inventory record first or disable stock management.`);
        }

        const inventory = currentInventory[0];

        if (isWeightBased) {
          // Weight-based stock validation
          const availableWeight = parseFloat(inventory.availableWeight || '0');
          const requestedWeight = item.weightQuantity || 0;

          if (availableWeight < requestedWeight) {
            return ErrorResponses.invalidInput(`Insufficient stock for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Available: ${availableWeight}g, Requested: ${requestedWeight}g`);
          }

          // Check if product has any stock
          const totalWeight = parseFloat(inventory.weightQuantity || '0');
          if (totalWeight <= 0) {
            return ErrorResponses.invalidInput(`${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''} is out of stock. Total weight: ${totalWeight}g`);
          }
        } else {
          // Quantity-based stock validation
          const availableStock = inventory.availableQuantity || 
            (inventory.quantity - (inventory.reservedQuantity || 0));

          if (availableStock < item.quantity) {
            return ErrorResponses.invalidInput(`Insufficient stock for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Available: ${availableStock}, Requested: ${item.quantity}`);
          }

          // Additional validation: Check if the product is active and available
          if (inventory.quantity <= 0) {
            return ErrorResponses.invalidInput(`${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''} is out of stock. Total quantity: ${inventory.quantity}`);
          }
        }
      }
    }

    // FBR Digital Invoicing Validation (BEFORE order creation)
    let fbrResponse = null;
    let fbrInvoiceNumber = null;
    
    if (scenarioId) {
      console.log(`\n=== FBR DIGITAL INVOICING VALIDATION (PRE-ORDER) ===`);
      console.log(`Scenario: ${scenarioId}, Invoice Type: ${invoiceType || 'Sale Invoice'}`);
      
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
          email,
          scenarioId,
          invoiceType: invoiceType || 'Sale Invoice',
          invoiceDate: invoiceDate ? formatDateForFbr(invoiceDate) : undefined,
          invoiceRefNo,
          subtotal: parseFloat(subtotal.toString()),
          totalAmount: parseFloat(totalAmount.toString()),
          taxAmount: parseFloat((taxAmount || 0).toString()),
          currency,
          
          // Buyer information
          buyerNTNCNIC,
          buyerBusinessName,
          buyerProvince,
          buyerAddress,
          buyerRegistrationType: buyerRegistrationType || 'Unregistered',
          
          // Seller information (for FBR Digital Invoicing)
          sellerNTNCNIC,
          sellerBusinessName,
          sellerProvince,
          sellerAddress,
          fbrSandboxToken,
          fbrBaseUrl,
          
          // Billing/Shipping addresses for fallback buyer info
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
          
          // Order items with all FBR-required fields
          items: items.map(item => ({
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
        if (!skipFbrSubmission) {
          // 🔍 DEBUG: Log the exact JSON being sent to FBR
          console.log('\n🔍 === FBR SUBMISSION DEBUG ===');
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
              'x-tenant-id': context.tenantId,
              'x-tenant-slug': context.tenantSlug,
            },
            body: JSON.stringify(fbrPayload),
          });

          const fbrResult = await fbrSubmissionResponse.json();
          fbrResponse = fbrResult;
        } else {
          console.log('⏭️ Skipping FBR submission as requested');
          fbrResponse = { skipped: true, message: 'FBR submission skipped by user request' };
        }

        if (!skipFbrSubmission) {
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
          
            // Return error immediately - don't create the order
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
        }
      } catch (fbrError) {
        console.error('❌ Error during FBR submission:', fbrError);
        
        return NextResponse.json({ 
          error: `FBR submission failed: ${fbrError instanceof Error ? fbrError.message : String(fbrError)}`,
          step: 'fbr_connection'
        }, { status: 500 });
      }
      console.log(`=== END FBR DIGITAL INVOICING VALIDATION ===\n`);
    }

    // Create the order (only if FBR validation passed)
    await db.insert(orders).values({
      id: orderId,
      tenantId: context.tenantId, // Add tenant ID
      orderNumber,
      userId: userId || null,
      email,
      phone: phone || null,
      status,
      paymentStatus,
      fulfillmentStatus: 'pending',
      subtotal,
      taxAmount: taxAmount || 0,
      shippingAmount: shippingAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      currency,
      
      // Driver assignment fields
      assignedDriverId: assignedDriverId || null,
      deliveryStatus,
      
      // Loyalty points fields
      pointsToRedeem: pointsToRedeem || 0,
      pointsDiscountAmount: pointsDiscountAmount || 0,
      
      // Purchase Order fields
      orderType: orderType || 'customer',
      supplierId: supplierId || null,
      purchaseOrderNumber: purchaseOrderNumber || null,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      
      // Invoice and validation fields
      invoiceType: invoiceType || null,
      invoiceRefNo: invoiceRefNo || null,
      scenarioId: scenarioId || null,
      invoiceNumber: fbrInvoiceNumber || invoiceNumber || null,
      invoiceDate: invoiceDate ? (typeof invoiceDate === 'string' && invoiceDate.includes('T') ? new Date(invoiceDate) : new Date(invoiceDate + 'T00:00:00.000Z')) : null,
      validationResponse: fbrResponse ? JSON.stringify(fbrResponse) : validationResponse || null,
      fbrEnvironment: isProductionSubmission ? 'production' : 'sandbox',
      
      // Billing address
      billingFirstName: billingFirstName || null,
      billingLastName: billingLastName || null,
      billingAddress1: billingAddress1 || null,
      billingAddress2: billingAddress2 || null,
      billingCity: billingCity || null,
      billingState: billingState || null,
      billingPostalCode: billingPostalCode || null,
      billingCountry: billingCountry || null,
      
      // Shipping address
      shippingFirstName: shippingFirstName || null,
      shippingLastName: shippingLastName || null,
      shippingAddress1: shippingAddress1 || null,
      shippingAddress2: shippingAddress2 || null,
      shippingCity: shippingCity || null,
      shippingState: shippingState || null,
      shippingPostalCode: shippingPostalCode || null,
      shippingCountry: shippingCountry || null,
      
      // Buyer fields (from selected customer)
      buyerNTNCNIC: buyerNTNCNIC || null,
      buyerBusinessName: buyerBusinessName || null,
      buyerProvince: buyerProvince || null,
      buyerAddress: buyerAddress || null,
      buyerRegistrationType: buyerRegistrationType || null,
      
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create order items and manage inventory
    for (const item of items) {
      const orderItemId = uuidv4();

      // Ensure addons are properly structured before saving
      let addonsToSave = null;
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        // Validate and clean addon data
        addonsToSave = item.addons.map((addon: any) => ({
          addonId: addon.addonId,
          addonTitle: addon.addonTitle || addon.title || addon.name || 'Unknown Addon',
          price: Number(addon.price) || 0,
          quantity: Number(addon.quantity) || 1
        }));
      }

      // Get cost price from product or variant at time of sale
      let costPrice = null;
      let totalCost = null;
      
      try {
        if (item.variantId) {
          // Get cost price from variant (within tenant)
          const variant = await db.query.productVariants.findFirst({
            where: and(
              eq(productVariants.id, item.variantId),
              eq(productVariants.tenantId, context.tenantId)
            ),
            columns: { costPrice: true }
          });
          if (variant?.costPrice) {
            costPrice = parseFloat(variant.costPrice);
          }
        } else {
          // Get cost price from product (within tenant)
          const product = await db.query.products.findFirst({
            where: and(
              eq(products.id, item.productId),
              eq(products.tenantId, context.tenantId)
            ),
            columns: { costPrice: true, stockManagementType: true }
          });
          if (product?.costPrice) {
            costPrice = parseFloat(product.costPrice);
          }
        }

        // Calculate total cost
        if (costPrice) {
          if (item.weightQuantity && item.weightQuantity > 0) {
            // For weight-based products, cost is per gram/kg
            totalCost = costPrice * (item.weightQuantity / 1000); // Assuming costPrice is per kg
          } else {
            totalCost = costPrice * item.quantity;
          }
        }
      } catch (error) {
        console.warn(`Failed to get cost price for item ${item.productName}:`, error);
      }

      // Create order item
      await db.insert(orderItems).values({
        id: orderItemId,
        tenantId: context.tenantId, // Add tenant ID
        orderId,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        productDescription: item.productDescription || null,
        variantTitle: item.variantTitle || null,
        sku: item.sku || null,
        hsCode: item.hsCode || null,
        uom: item.uom || null,
        itemSerialNumber: item.itemSerialNumber || null,
        sroScheduleNumber: item.sroScheduleNumber || null,
        // Product identification fields
        serialNumber: item.serialNumber || null,
        listNumber: item.listNumber || null,
        bcNumber: item.bcNumber || null,
        lotNumber: item.lotNumber || null,
        expiryDate: item.expiryDate || null,
        quantity: item.quantity,
        price: item.price,
        costPrice: costPrice ? costPrice.toString() : null,
        totalPrice: item.totalPrice,
        totalCost: totalCost ? totalCost.toString() : null,
        productImage: null, // TODO: Get from product/variant
        addons: addonsToSave ? JSON.stringify(addonsToSave) : null,
        // Weight-based fields
        weightQuantity: item.weightQuantity ? item.weightQuantity.toString() : '0.00',
        weightUnit: item.weightUnit || null,
        // Tax and discount fields
        taxAmount: item.taxAmount ? item.taxAmount.toString() : '0.00',
        taxPercentage: item.taxPercentage ? item.taxPercentage.toString() : '0.00',
        priceIncludingTax: item.priceIncludingTax ? item.priceIncludingTax.toString() : '0.00',
        priceExcludingTax: item.priceExcludingTax ? item.priceExcludingTax.toString() : '0.00',
        extraTax: item.extraTax ? item.extraTax.toString() : '0.00',
        furtherTax: item.furtherTax ? item.furtherTax.toString() : '0.00',
        fedPayableTax: item.fedPayableTax ? item.fedPayableTax.toString() : '0.00',
        discount: item.discount ? item.discount.toString() : '0.00',
        // Additional tax fields
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice ? item.fixedNotifiedValueOrRetailPrice.toString() : '0.00',
        saleType: item.saleType || 'Goods at standard rate',
        createdAt: new Date(),
      });

      // Deduct inventory immediately when order is created (only if stock management is enabled)
      // This treats orders as immediate sales rather than reservations
      if (stockManagementEnabled) {
        // Get product to determine stock management type (within tenant)
        const product = await db.query.products.findFirst({
          where: and(
            eq(products.id, item.productId),
            eq(products.tenantId, context.tenantId)
          ),
          columns: { stockManagementType: true }
        });

        if (!product) {
          console.warn(`Product not found for stock deduction: ${item.productName}`);
          continue;
        }

        const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

        const inventoryConditions = [
          eq(productInventory.productId, item.productId),
          eq(productInventory.tenantId, context.tenantId)
        ];
        
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

        if (currentInventory.length > 0) {
          const inventory = currentInventory[0];

          if (isWeightBased) {
            // Handle weight-based stock deduction
            const currentWeightQuantity = parseFloat(inventory.weightQuantity || '0');
            const currentReservedWeight = parseFloat(inventory.reservedWeight || '0');
            const requestedWeight = item.weightQuantity || 0;
            
            const newWeightQuantity = currentWeightQuantity - requestedWeight;
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
              tenantId: context.tenantId, // Add tenant ID
              inventoryId: inventory.id,
              productId: item.productId,
              variantId: item.variantId || null,
              movementType: 'out',
              quantity: 0, // No quantity change for weight-based
              previousQuantity: inventory.quantity,
              newQuantity: inventory.quantity,
              weightQuantity: requestedWeight.toString(),
              previousWeightQuantity: currentWeightQuantity.toString(),
              newWeightQuantity: newWeightQuantity.toString(),
              reason: 'Order Created - Stock Sold',
              reference: orderNumber,
              notes: `Sold ${requestedWeight}g for new order ${orderNumber}`,
              processedBy: context.userId || null, // Add current admin user
              createdAt: new Date(),
            });
          } else {
            // Handle quantity-based stock deduction
            const currentReservedQuantity = inventory.reservedQuantity || 0;
            const newQuantity = inventory.quantity - item.quantity;
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
              tenantId: context.tenantId, // Add tenant ID
              inventoryId: inventory.id,
              productId: item.productId,
              variantId: item.variantId || null,
              movementType: 'out',
              quantity: item.quantity,
              previousQuantity: inventory.quantity,
              newQuantity: newQuantity,
              weightQuantity: '0.00',
              previousWeightQuantity: '0.00',
              newWeightQuantity: '0.00',
              reason: 'Order Created - Stock Sold',
              reference: orderNumber,
              notes: `Sold ${item.quantity} units for new order ${orderNumber}`,
              processedBy: context.userId || null, // Add current admin user
              createdAt: new Date(),
            });
          }
        } else {
          console.warn(`No inventory record found for product: ${item.productName}. Skipping inventory reservation.`);
        }
      }
    }

    // Fetch the created order with its items for response
    const createdOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const createdItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Handle points redemption if points were used
    if (pointsToRedeem > 0 && userId) {
      console.log(`\n=== POINTS REDEMPTION PROCESSING ===`);
      console.log(`Order: ${orderNumber}, UserId: ${userId}, Points to redeem: ${pointsToRedeem}, Discount: ${pointsDiscountAmount}`);
      try {
        await redeemLoyaltyPoints(userId, orderId, pointsToRedeem, pointsDiscountAmount, `Redeemed at checkout for order #${orderNumber}`);
        console.log(`✅ Successfully redeemed ${pointsToRedeem} points for user ${userId} for order ${orderNumber}`);
      } catch (pointsError) {
        console.error('❌ Error redeeming points:', pointsError);
        // Don't fail the order creation if points redemption fails
      }
      console.log(`=== END POINTS REDEMPTION PROCESSING ===\n`);
    }

    // Award loyalty points directly (integrated logic)
    console.log(`\n=== LOYALTY POINTS PROCESSING ===`);
    console.log(`Order: ${orderNumber}, UserId: ${userId}, Status: ${status}`);
    console.log(`Total: ${totalAmount}, Subtotal: ${subtotal}`);
    if (userId) {
      console.log(`Attempting to award points for order ${orderNumber} to user ${userId}`);
      try {
        await awardLoyaltyPoints(userId, orderId, totalAmount, subtotal, status);
        console.log(`✅ Successfully processed points for user ${userId} for order ${orderNumber}`);
      } catch (pointsError) {
        console.error('❌ Error awarding loyalty points:', pointsError);
        // Don't fail the order creation if points awarding fails
      }
    } else {
      console.log(`⚠️ Points not awarded - no userId provided`);
    }
    console.log(`=== END LOYALTY POINTS PROCESSING ===\n`);

    // Send invoice emails to customer and supplier
    console.log(`=== SENDING INVOICE EMAILS ===`);
    try {
      // Prepare order data for email
      const orderForEmail = {
        id: orderId,
        orderNumber,
        email,
        phone: phone || '',
        status,
        paymentStatus: paymentStatus || 'pending',
        subtotal: parseFloat(subtotal.toString()),
        taxAmount: parseFloat((taxAmount || 0).toString()),
        shippingAmount: parseFloat((shippingAmount || 0).toString()),
        discountAmount: parseFloat((discountAmount || 0).toString()),
        totalAmount: parseFloat(totalAmount.toString()),
        currency,
        // Billing address
        billingFirstName,
        billingLastName,
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        // Shipping address
        shippingFirstName,
        shippingLastName,
        shippingAddress1,
        shippingAddress2,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        // Invoice fields
        invoiceNumber,
        invoiceRefNo,
        invoiceType,
        scenarioId,
        validationResponse,
        // Buyer fields (from selected customer)
        buyerNTNCNIC: buyerNTNCNIC,
        buyerBusinessName: buyerBusinessName,
        buyerProvince: buyerProvince,
        buyerAddress: buyerAddress,
        buyerRegistrationType: buyerRegistrationType,
        createdAt: new Date().toISOString(),
        items: createdItems.map(item => ({
          productName: item.productName,
          variantTitle: item.variantTitle || undefined,
          sku: item.sku || undefined,
          hsCode: item.hsCode || undefined,
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
          totalPrice: parseFloat(item.totalPrice.toString()),
          isWeightBased: item.weightQuantity ? parseFloat(item.weightQuantity.toString()) > 0 : false,
          weightQuantity: item.weightQuantity ? parseFloat(item.weightQuantity.toString()) : undefined,
          weightUnit: item.weightUnit || undefined,
          // Tax and discount fields
          taxAmount: item.taxAmount ? parseFloat(item.taxAmount.toString()) : undefined,
          taxPercentage: item.taxPercentage ? parseFloat(item.taxPercentage.toString()) : undefined,
          priceIncludingTax: item.priceIncludingTax ? parseFloat(item.priceIncludingTax.toString()) : undefined,
          priceExcludingTax: item.priceExcludingTax ? parseFloat(item.priceExcludingTax.toString()) : undefined,
          extraTax: item.extraTax ? parseFloat(item.extraTax.toString()) : undefined,
          furtherTax: item.furtherTax ? parseFloat(item.furtherTax.toString()) : undefined,
          fedPayableTax: item.fedPayableTax ? parseFloat(item.fedPayableTax.toString()) : undefined,
          discount: item.discount ? parseFloat(item.discount.toString()) : undefined,
          addons: item.addons ? JSON.parse(item.addons as string) : undefined,
        }))
      };

      // Get supplier information if supplierId is provided
      let supplierForEmail = undefined;
      if (supplierId) {
        const supplierData = await db
          .select()
          .from(suppliers)
          .where(eq(suppliers.id, supplierId))
          .limit(1);
        
        if (supplierData.length > 0 && supplierData[0].email) {
          supplierForEmail = {
            id: supplierData[0].id,
            name: supplierData[0].name,
            email: supplierData[0].email,
            companyName: supplierData[0].companyName || undefined
          };
        }
      }

      // Send emails (conditionally based on checkboxes)
      const emailResults = await sendInvoiceEmails(orderForEmail, supplierForEmail, {
        skipCustomerEmail,
        skipSellerEmail
      });
      
      console.log('Email results:', emailResults);
      if (emailResults.errors.length > 0) {
        console.error('Email errors:', emailResults.errors);
        // Don't fail the order creation if email sending fails
      } else {
        console.log('✅ Invoice emails sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending invoice emails:', emailError);
      // Don't fail the order creation if email sending fails
    }
    console.log(`=== END EMAIL PROCESSING ===\n`);

    return NextResponse.json({
      ...createdOrder[0],
      items: createdItems,
      orderId: orderId,
      orderNumber: orderNumber,
      fbrResponse: fbrResponse, // Include FBR submission result
      fbrInvoiceNumber: fbrInvoiceNumber, // Include FBR invoice number
      success: true,
      message: fbrInvoiceNumber ? `Order created successfully with FBR Invoice ${fbrInvoiceNumber}` : 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return ErrorResponses.serverError('Failed to create order');
  }
});

// Helper function to award loyalty points
async function awardLoyaltyPoints(userId: string, orderId: string, orderAmount: number, subtotal: number, orderStatus: string) {
  console.log('=== AWARD POINTS FUNCTION ===');
  console.log('Parameters:', { userId, orderId, orderAmount, subtotal, orderStatus });

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

  // Get earning settings
  const [earningBasisSetting, earningRateSetting, minimumOrderSetting] = await Promise.all([
    db.select().from(settings).where(eq(settings.key, 'points_earning_basis')).limit(1),
    db.select().from(settings).where(eq(settings.key, 'points_earning_rate')).limit(1),
    db.select().from(settings).where(eq(settings.key, 'points_minimum_order')).limit(1)
  ]);

  const earningBasis = earningBasisSetting[0]?.value || 'subtotal';
  const earningRate = parseFloat(earningRateSetting[0]?.value || '1');
  const minimumOrder = parseFloat(minimumOrderSetting[0]?.value || '0');

  // Calculate points based on settings
  const baseAmount = earningBasis === 'total' ? orderAmount : (subtotal || orderAmount);
  
  console.log(`Points calculation: baseAmount=${baseAmount}, minimumOrder=${minimumOrder}, earningRate=${earningRate}`);
  
  if (baseAmount < minimumOrder) {
    console.log('Order amount below minimum - no points awarded');
    return;
  }
  
  const pointsToAward = Math.floor(baseAmount * earningRate);

  if (pointsToAward <= 0) {
    console.log('No points to award - calculated points is 0');
    return;
  }

  // Determine if points should be pending or available based on order status
  const isCompleted = orderStatus === 'completed';
  const pointsStatus = isCompleted ? 'available' : 'pending';

  console.log(`Awarding ${pointsToAward} ${pointsStatus} points`);

  // Check if user already has a loyalty points record
  const existingPoints = await db
    .select()
    .from(userLoyaltyPoints)
    .where(eq(userLoyaltyPoints.userId, userId))
    .limit(1);

  if (existingPoints.length === 0) {
    // Create new record
    console.log('Creating new loyalty points record');
    await db.insert(userLoyaltyPoints).values({
      id: uuidv4(),
      userId: userId,
      totalPointsEarned: pointsToAward,
      totalPointsRedeemed: 0,
      availablePoints: isCompleted ? pointsToAward : 0,
      pendingPoints: isCompleted ? 0 : pointsToAward,
      pointsExpiringSoon: 0,
      lastEarnedAt: new Date(),
      lastRedeemedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created new loyalty points record');
  } else {
    // Update existing record
    console.log('Updating existing loyalty points record');
    const current = existingPoints[0];
    await db.update(userLoyaltyPoints)
      .set({
        totalPointsEarned: (current?.totalPointsEarned || 0) + pointsToAward,
        availablePoints: (current?.availablePoints || 0) + (isCompleted ? pointsToAward : 0),
        pendingPoints: (current?.pendingPoints || 0) + (isCompleted ? 0 : pointsToAward),
        lastEarnedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userLoyaltyPoints.userId, userId));
    console.log('Updated existing loyalty points record');
  }

  // Add history record
  console.log('Creating history record');
  await db.insert(loyaltyPointsHistory).values({
    id: uuidv4(),
    userId: userId,
    orderId: orderId,
    transactionType: 'earned',
    status: pointsStatus,
    points: pointsToAward,
    pointsBalance: (existingPoints[0]?.availablePoints || 0) + (isCompleted ? pointsToAward : 0),
    description: `Points earned from order ${orderId}`,
    orderAmount: orderAmount.toString(),
    discountAmount: null,
    expiresAt: null,
    isExpired: false,
    processedBy: null,
    metadata: null,
    createdAt: new Date()
  });
  console.log('Created history record');

  console.log(`Successfully awarded ${pointsToAward} ${pointsStatus} points to user ${userId}`);
}

// Helper function to redeem loyalty points
async function redeemLoyaltyPoints(userId: string, orderId: string, pointsToRedeem: number, discountAmount: number, description?: string) {
  console.log('=== REDEEM POINTS FUNCTION ===');
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

  // Get redemption settings
  const redemptionMinimumSetting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'points_redemption_minimum'))
    .limit(1);

  const redemptionMinimum = Number(redemptionMinimumSetting[0]?.value || '100');

  if (pointsToRedeem < redemptionMinimum) {
    console.log(`Points below minimum. Required: ${redemptionMinimum}, Provided: ${pointsToRedeem}`);
    throw new Error(`Minimum ${redemptionMinimum} points required for redemption`);
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
    status: 'redeemed',
    points: -pointsToRedeem, // negative for redeemed
    pointsBalance: newBalance,
    description: description || `Redeemed at checkout`,
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