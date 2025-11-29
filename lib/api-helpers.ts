import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantFromRequest } from '@/lib/tenant';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId?: string;
  userRole?: string;
}

/**
 * Get tenant context from request headers (set by middleware)
 */
export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  // First try to get tenant from request headers (set by middleware)
  const tenantInfo = getTenantFromRequest(request);
  
  if (!tenantInfo) {
    return null;
  }

  // Get user session for additional context
  const session = await getServerSession(authOptions);
  
  return {
    tenantId: tenantInfo.tenantId,
    tenantSlug: tenantInfo.tenantSlug,
    userId: (session?.user as any)?.id,
    userRole: (session?.user as any)?.role,
  };
}

/**
 * Higher-order function to wrap API routes with tenant context
 */
export function withTenant<T extends any[]>(
  handler: (request: NextRequest, context: TenantContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const tenantContext = await getTenantContext(request);
      
      if (!tenantContext) {
        return NextResponse.json(
          { error: 'Tenant context not found' }, 
          { status: 400 }
        );
      }

      return await handler(request, tenantContext, ...args);
    } catch (error) {
      console.error('Error in withTenant wrapper:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API routes with authentication + tenant context
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: TenantContext & { userId: string }, ...args: T) => Promise<NextResponse>
) {
  return withTenant(async (request: NextRequest, context: TenantContext, ...args: T) => {
    if (!context.userId) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    return await handler(request, { ...context, userId: context.userId }, ...args);
  });
}

/**
 * Add tenant filter to Drizzle query conditions
 */
export function addTenantFilter(tenantId: string, existingConditions: any[] = []) {
  return [...existingConditions, { tenantId }];
}

/**
 * Validate tenant limits before creating resources
 */
export async function checkTenantLimit(
  tenantId: string, 
  resourceType: 'users' | 'products' | 'orders',
  currentCount?: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // This would integrate with your tenant limits checking
  // For now, return a basic implementation
  const limits = {
    users: 1000,
    products: 10000,
    orders: 100000
  };

  return {
    allowed: true, // TODO: Implement actual checking
    limit: limits[resourceType],
    current: currentCount || 0
  };
}

/**
 * Standard error responses
 */
export const ErrorResponses = {
  tenantNotFound: () => NextResponse.json(
    { error: 'Tenant not found' }, 
    { status: 404 }
  ),
  
  unauthorized: () => NextResponse.json(
    { error: 'Unauthorized' }, 
    { status: 401 }
  ),
  
  forbidden: () => NextResponse.json(
    { error: 'Forbidden' }, 
    { status: 403 }
  ),
  
  limitExceeded: (resource: string) => NextResponse.json(
    { error: `${resource} limit exceeded for your plan` }, 
    { status: 429 }
  ),
  
  invalidInput: (message: string = 'Invalid input') => NextResponse.json(
    { error: message }, 
    { status: 400 }
  ),
  
  serverError: (message: string = 'Internal server error') => NextResponse.json(
    { error: message }, 
    { status: 500 }
  )
};
