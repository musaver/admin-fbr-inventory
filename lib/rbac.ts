import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminRoles, adminUsers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { TenantContext } from '@/lib/api-helpers';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  type: string;
  roleId: string;
  role: string;
}

export interface RolePermissions {
  roleId: string;
  roleName: string;
  permissions: string[];
}

/**
 * Get admin user with role permissions from session
 */
export async function getAdminUserWithPermissions(): Promise<{
  user: AdminUser | null;
  permissions: RolePermissions | null;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { user: null, permissions: null };
    }

    const sessionUser = session.user as any;
    
    // For super admin, return with all permissions
    if (sessionUser.type === 'super-admin') {
      return {
        user: sessionUser,
        permissions: {
          roleId: 'super-admin',
          roleName: 'Super Administrator',
          permissions: ['*'] // Super admin has all permissions
        }
      };
    }

    // For regular admin, get their role and permissions
    if (sessionUser.roleId) {
      const roleData = await db
        .select()
        .from(adminRoles)
        .where(and(
          eq(adminRoles.id, sessionUser.roleId),
          eq(adminRoles.tenantId, sessionUser.tenantId),
          eq(adminRoles.isActive, true)
        ))
        .limit(1);

      if (roleData.length > 0) {
        const role = roleData[0];
        return {
          user: sessionUser,
          permissions: {
            roleId: role.id,
            roleName: role.name,
            permissions: JSON.parse(role.permissions || '[]')
          }
        };
      }
    }

    return { user: sessionUser, permissions: null };
  } catch (error) {
    console.error('Error getting admin user with permissions:', error);
    return { user: null, permissions: null };
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check for wildcard permissions (e.g., 'users_*' matches 'users_view', 'users_create', etc.)
  const wildcardPermissions = userPermissions.filter(p => p.endsWith('_*'));
  for (const wildcardPerm of wildcardPermissions) {
    const prefix = wildcardPerm.replace('_*', '_');
    if (requiredPermission.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Higher-order function to wrap API routes with permission checking
 */
export function withPermission(
  requiredPermission: string,
  handler: (request: NextRequest, context: TenantContext & { userId: string }, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: TenantContext & { userId: string }, ...args: any[]): Promise<NextResponse> => {
    try {
      const { user, permissions } = await getAdminUserWithPermissions();
      
      if (!user || !permissions) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }

      // Check if user has the required permission
      if (!hasPermission(permissions.permissions, requiredPermission)) {
        return NextResponse.json(
          { error: `Permission denied. Required: ${requiredPermission}` }, 
          { status: 403 }
        );
      }

      // Add permission info to context
      const contextWithPermissions = {
        ...context,
        userId: user.id,
        userPermissions: permissions.permissions,
        userRole: permissions.roleName
      };

      return await handler(request, contextWithPermissions, ...args);
    } catch (error) {
      console.error('Error in withPermission wrapper:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Permission constants for the 4 modules
 */
export const PERMISSIONS = {
  // Users Management
  USERS_VIEW: 'users_view',
  USERS_CREATE: 'users_create',
  USERS_EDIT: 'users_edit',
  USERS_DELETE: 'users_delete',
  
  // Products Management
  PRODUCTS_VIEW: 'products_view',
  PRODUCTS_CREATE: 'products_create',
  PRODUCTS_EDIT: 'products_edit',
  PRODUCTS_DELETE: 'products_delete',
  
  // Inventory / Stock Management
  INVENTORY_VIEW: 'inventory_view',
  INVENTORY_CREATE: 'inventory_create',
  INVENTORY_EDIT: 'inventory_edit',
  INVENTORY_DELETE: 'inventory_delete',
  STOCK_MOVEMENTS_VIEW: 'stock_movements_view',
  
  // Orders Management
  ORDERS_VIEW: 'orders_view',
  ORDERS_CREATE: 'orders_create',
  ORDERS_EDIT: 'orders_edit',
  ORDERS_DELETE: 'orders_delete',
  ORDERS_FULFILL: 'orders_fulfill',
} as const;

/**
 * Check multiple permissions (requires ALL permissions)
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * Check multiple permissions (requires ANY permission)
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Get readable permission name
 */
export function getPermissionName(permission: string): string {
  const permissionNames: Record<string, string> = {
    'users_view': 'View Users',
    'users_create': 'Create Users',
    'users_edit': 'Edit Users',
    'users_delete': 'Delete Users',
    'products_view': 'View Products',
    'products_create': 'Create Products',
    'products_edit': 'Edit Products',
    'products_delete': 'Delete Products',
    'inventory_view': 'View Inventory',
    'inventory_create': 'Add Stock',
    'inventory_edit': 'Edit Stock',
    'inventory_delete': 'Remove Stock',
    'stock_movements_view': 'View Stock Movements',
    'orders_view': 'View Orders',
    'orders_create': 'Create Orders',
    'orders_edit': 'Edit Orders',
    'orders_delete': 'Delete Orders',
    'orders_fulfill': 'Fulfill Orders',
  };
  
  return permissionNames[permission] || permission;
}