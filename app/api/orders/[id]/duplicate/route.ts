import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { withTenant } from '@/lib/api-helpers';

export const POST = withTenant(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const orderId = url.pathname.split('/')[3]; // Extract ID from /api/orders/[id]/duplicate
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the original order
    const originalOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (originalOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = originalOrder[0];

    // Verify tenant access
    if (order.tenantId !== context.tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the original order items
    const originalOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Generate new IDs
    const newOrderId = crypto.randomUUID();
    const newOrderNumber = `ORD-${Date.now()}`;

    // Create the duplicate order (copy all fields except id, orderNumber, invoiceNumber, invoiceDate, validationResponse)
    const duplicateOrderData = {
      ...order,
      id: newOrderId,
      orderNumber: newOrderNumber,
      invoiceNumber: null,
      invoiceDate: null,
      validationResponse: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the duplicate order
    await db.insert(orders).values(duplicateOrderData);

    // Create duplicate order items
    const duplicateOrderItemsData = originalOrderItems.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      orderId: newOrderId,
      // Clear product identification fields to avoid duplicates
      serialNumber: null,
      itemSerialNumber: null,
      listNumber: null,
      bcNumber: null,
      lotNumber: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (duplicateOrderItemsData.length > 0) {
      await db.insert(orderItems).values(duplicateOrderItemsData);
    }

    return NextResponse.json({
      success: true,
      message: 'Order duplicated successfully',
      newOrderId: newOrderId,
      newOrderNumber: newOrderNumber,
      originalOrderId: orderId,
      itemsCount: duplicateOrderItemsData.length
    });

  } catch (error) {
    console.error('Error duplicating order:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate order' },
      { status: 500 }
    );
  }
});
