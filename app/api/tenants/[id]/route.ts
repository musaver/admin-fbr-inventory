import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session to ensure only super admins can fetch tenant details
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can view tenant details
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const tenantId = params.id;

    // Fetch the tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session to ensure only super admins can update tenants
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can update tenants
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const { status, name, email, plan } = await req.json();
    const tenantId = params.id;

    // Get current tenant data to check for status changes
    const [currentTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (plan !== undefined) updateData.plan = plan;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    // Update the tenant
    await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId));

    console.log(`Super admin updated tenant ${tenantId}:`, updateData);
    
    // If tenant status changed to suspended, trigger tenant user logout
    if (status !== undefined && status === 'suspended' && currentTenant.status !== 'suspended') {
      console.log(`Tenant ${tenantId} suspended - triggering user logout`);
      
      // Trigger logout for all tenant users via broadcast API
      try {
        await fetch(`${req.nextUrl.origin}/api/tenants/${tenantId}/logout-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
            'Cookie': req.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ reason: 'tenant_suspended' })
        });
      } catch (logoutError) {
        console.error('Error triggering tenant user logout:', logoutError);
        // Don't fail the main operation if logout trigger fails
      }
    }
    
    // Return the updated tenant
    const [updatedTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!updatedTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session to ensure only super admins can delete tenants
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can delete tenants
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const tenantId = params.id;

    // TODO: Add checks to ensure tenant can be safely deleted
    // (no active users, orders, etc.)

    await db
      .delete(tenants)
      .where(eq(tenants.id, tenantId));

    console.log(`Super admin deleted tenant ${tenantId}`);
    
    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}