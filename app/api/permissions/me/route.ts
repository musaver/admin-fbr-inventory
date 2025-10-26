import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserWithPermissions } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const { user, permissions } = await getAdminUserWithPermissions();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!permissions) {
      return NextResponse.json({ error: 'No permissions found' }, { status: 403 });
    }

    return NextResponse.json({
      permissions: permissions.permissions,
      roleName: permissions.roleName,
      roleId: permissions.roleId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        type: user.type
      }
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}