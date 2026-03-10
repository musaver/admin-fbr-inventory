import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminRoles } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';

export const GET = withTenant(async (req: NextRequest, context) => {
  try {
    const roles = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.tenantId, context.tenantId));
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return ErrorResponses.serverError('Failed to fetch roles');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { name, permissions, description, isActive = true } = await req.json();
    
    if (!name || !permissions) {
      return ErrorResponses.invalidInput('Role name and permissions are required');
    }

    // Check if role name already exists for this tenant
    const existingRole = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.tenantId, context.tenantId),
        eq(adminRoles.name, name)
      ))
      .limit(1);

    if (existingRole.length > 0) {
      return ErrorResponses.invalidInput('Role name already exists');
    }
    
    const newRole = {
      id: uuidv4(),
      tenantId: context.tenantId,
      name,
      description: description || null,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(adminRoles).values(newRole);
    
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return ErrorResponses.serverError('Failed to create role');
  }
}); 