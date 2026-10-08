import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, stockMovements, loyaltyPointsHistory } from '@/lib/schema';
import { ne, inArray } from 'drizzle-orm';

export async function DELETE(req: NextRequest) {
  try {
    const sandboxOrderRows = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(ne(orders.fbrEnvironment, 'production'));

    if (sandboxOrderRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sandbox orders to delete',
      });
    }

    const sandboxOrderIds = sandboxOrderRows.map(r => r.id);
    const sandboxOrderNumbers = sandboxOrderRows.map(r => r.orderNumber);

    await db.delete(loyaltyPointsHistory).where(
      inArray(loyaltyPointsHistory.orderId, sandboxOrderIds)
    );

    await db.delete(stockMovements).where(
      inArray(stockMovements.reference, sandboxOrderNumbers)
    );

    await db.delete(orderItems).where(
      inArray(orderItems.orderId, sandboxOrderIds)
    );

    await db.delete(orders).where(
      ne(orders.fbrEnvironment, 'production')
    );

    return NextResponse.json({
      success: true,
      message: `${sandboxOrderIds.length} sandbox orders and related data deleted successfully. Production orders preserved.`,
    });
  } catch (error) {
    console.error('Error deleting sandbox orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sandbox orders' },
      { status: 500 }
    );
  }
}
