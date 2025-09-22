import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { count, and, gte, lte, sum, sql, eq } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date and tenant filters
    const buildFilters = () => {
      const filters = [];
      
      // Always filter by tenant ID
      filters.push(eq(orders.tenantId, context.tenantId));
      
      // Add date filters if provided
      if (startDate) {
        filters.push(gte(orders.createdAt, new Date(startDate)));
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        filters.push(lte(orders.createdAt, endDatePlusOne));
      }
      
      return filters.length > 0 ? and(...filters) : undefined;
    };

    const filters = buildFilters();

    // Get overall order statistics
    const [
      totalOrdersResult,
      totalRevenueResult,
      pendingOrdersResult,
      completedOrdersResult,
      cancelledOrdersResult,
      processingOrdersResult
    ] = await Promise.all([
      // Total orders count
      db.select({ count: count() })
        .from(orders)
        .where(filters),
      
      // Total revenue (sum of all order amounts)
      db.select({ 
        totalRevenue: sum(orders.totalAmount),
        averageOrderValue: sql<number>`AVG(${orders.totalAmount})`
      })
        .from(orders)
        .where(filters),
      
      // Pending orders count
      db.select({ count: count() })
        .from(orders)
        .where(filters ? and(filters, eq(orders.status, 'pending')) : eq(orders.status, 'pending')),
      
      // Completed orders count
      db.select({ count: count() })
        .from(orders)
        .where(filters ? and(filters, eq(orders.status, 'completed')) : eq(orders.status, 'completed')),
      
      // Cancelled orders count
      db.select({ count: count() })
        .from(orders)
        .where(filters ? and(filters, eq(orders.status, 'cancelled')) : eq(orders.status, 'cancelled')),
      
      // Processing orders count
      db.select({ count: count() })
        .from(orders)
        .where(filters ? and(filters, eq(orders.status, 'processing')) : eq(orders.status, 'processing'))
    ]);

    const stats = {
      totalOrders: totalOrdersResult[0]?.count || 0,
      totalRevenue: parseFloat(totalRevenueResult[0]?.totalRevenue?.toString() || '0'),
      averageOrderValue: parseFloat(totalRevenueResult[0]?.averageOrderValue?.toString() || '0'),
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      completedOrders: completedOrdersResult[0]?.count || 0,
      cancelledOrders: cancelledOrdersResult[0]?.count || 0,
      processingOrders: processingOrdersResult[0]?.count || 0,
      dateRange: {
        startDate,
        endDate
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return ErrorResponses.serverError('Failed to fetch order statistics');
  }
});
