import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user, userLoyaltyPoints, loyaltyPointsHistory, orders, returns } from '@/lib/schema';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

// DELETE /api/users/delete-batch
// Body: { ids: string[] }
export const DELETE = withTenant(async (request: NextRequest, context) => {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ErrorResponses.invalidInput('Array of user IDs is required');
    }

    // Only delete users for this tenant
    const tenantUserIds = await db
      .select({ id: user.id })
      .from(user)
      .where(and(inArray(user.id, ids), eq(user.tenantId, context.tenantId)));

    if (tenantUserIds.length === 0) {
      return NextResponse.json({ message: 'No matching users for this tenant' });
    }

    const userIds = tenantUserIds.map((u) => u.id);

    // 1) Loyalty: delete history and points
    await db.delete(loyaltyPointsHistory).where(inArray(loyaltyPointsHistory.userId, userIds));
    await db.delete(userLoyaltyPoints).where(inArray(userLoyaltyPoints.userId, userIds));

    // 2) Orders/Returns: set userId to null to preserve historical records
    await db.update(orders).set({ userId: null }).where(inArray(orders.userId, userIds));
    await db.update(returns).set({ userId: null }).where(inArray(returns.userId, userIds));

    // 3) Finally delete the users
    await db.delete(user).where(and(inArray(user.id, userIds), eq(user.tenantId, context.tenantId)));

    return NextResponse.json({
      message: `Successfully deleted ${userIds.length} user(s) for this tenant`,
      deletedCount: userIds.length,
    });
  } catch (error) {
    console.error('Error deleting selected users:', error);
    return ErrorResponses.serverError('Failed to delete selected users');
  }
});


