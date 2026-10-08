import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers, adminRoles } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (req: NextRequest, context) => {
  try {
    // Fetch admins for this tenant only, with their roles
    const admins = await db
      .select({
        admin: adminUsers,
        role: {
          id: adminRoles.id,
          name: adminRoles.name,
          permissions: adminRoles.permissions,
          description: adminRoles.description,
          isActive: adminRoles.isActive
        }
      })
      .from(adminUsers)
      .leftJoin(adminRoles, and(
        eq(adminUsers.roleId, adminRoles.id),
        eq(adminRoles.tenantId, context.tenantId)
      ))
      .where(eq(adminUsers.tenantId, context.tenantId));

    // Remove passwords from response and format data
    const adminsWithoutPasswords = admins.map(({ admin, role }) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      tenantId: admin.tenantId,
      type: admin.type,
      roleId: admin.roleId,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      roleDetails: role
    }));

    return NextResponse.json(adminsWithoutPasswords);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return ErrorResponses.serverError('Failed to fetch admins');
  }
});

export const POST = withTenant(async (req: NextRequest, context) => {
  try {
    const { email, password, name, roleId } = await req.json();
    
    if (!email || !password || !name || !roleId) {
      return ErrorResponses.invalidInput('All fields are required');
    }
    
    // Verify the role exists and belongs to this tenant
    const roleData = await db
      .select()
      .from(adminRoles)
      .where(and(
        eq(adminRoles.id, roleId),
        eq(adminRoles.tenantId, context.tenantId),
        eq(adminRoles.isActive, true)
      ))
      .limit(1);

    if (roleData.length === 0) {
      return ErrorResponses.invalidInput('Invalid or inactive role selected');
    }

    // Check if email already exists for this tenant
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.email, email),
        eq(adminUsers.tenantId, context.tenantId)
      ))
      .limit(1);

    if (existingAdmin.length > 0) {
      return ErrorResponses.invalidInput('Admin with this email already exists');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = {
      id: uuidv4(),
      tenantId: context.tenantId,
      email,
      password: hashedPassword,
      name,
      type: 'admin',
      roleId,
      role: roleData[0].name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(adminUsers).values(newAdmin);

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return ErrorResponses.serverError('Failed to create admin');
  }
}); 