import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminRoles } from '@/lib/schema';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';

export const GET = withTenant(async (req: NextRequest, context, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    
    const role = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .limit(1);

    if (role.length === 0) {
      return ErrorResponses.invalidInput('Role not found');
    }

    return NextResponse.json(role[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    return ErrorResponses.serverError('Failed to fetch role');
  }
});

export const PUT = withTenant(async (req: NextRequest, context, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { name, description, permissions, isActive } = await req.json();

    if (!name || !permissions) {
      return ErrorResponses.invalidInput('Role name and permissions are required');
    }

    // Check if role exists and belongs to tenant
    const existingRole = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .limit(1);

    if (existingRole.length === 0) {
      return ErrorResponses.invalidInput('Role not found');
    }

    // Check if name is already taken by another role in this tenant
    const duplicateRole = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.name, name),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .limit(1);

    if (duplicateRole.length > 0 && duplicateRole[0].id !== id) {
      return ErrorResponses.invalidInput('Role name already exists');
    }

    // Update the role
    await db
      .update(adminRoles)
      .set({
        name,
        description: description || null,
        permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ));

    // Fetch updated role
    const updatedRole = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .limit(1);

    return NextResponse.json(updatedRole[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    return ErrorResponses.serverError('Failed to update role');
  }
});

export const DELETE = withTenant(async (req: NextRequest, context, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    // Check if role exists and belongs to tenant
    const existingRole = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .limit(1);

    if (existingRole.length === 0) {
      return ErrorResponses.invalidInput('Role not found');
    }

    // TODO: Check if role is assigned to any admin users before deleting
    // This would prevent deleting roles that are in use

    // Delete the role
    await db
      .delete(adminRoles)
      .where(and(
        eq(adminRoles.id, id),
        eq(adminRoles.tenantId, context.tenantId)
      ));

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return ErrorResponses.serverError('Failed to delete role');
  }
}); 