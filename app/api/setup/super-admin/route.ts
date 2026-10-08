import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers, adminRoles, tenants } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    
    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.type, 'super-admin'))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      return NextResponse.json({ error: 'Super admin already exists' }, { status: 400 });
    }

    // Create super admin role if it doesn't exist
    const superAdminRoleId = uuidv4();
    const superAdminPermissions = JSON.stringify([
      'all',
      'manage_tenants',
      'manage_admins', 
      'view_all_data',
      'system_settings'
    ]);

    try {
      await db.insert(adminRoles).values({
        id: superAdminRoleId,
        name: 'Super Administrator',
        permissions: superAdminPermissions
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Role already exists, get it
        const [existingRole] = await db
          .select()
          .from(adminRoles)
          .where(eq(adminRoles.name, 'Super Administrator'))
          .limit(1);
        if (existingRole) {
          superAdminRoleId = existingRole.id;
        }
      } else {
        throw error;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin user
    const superAdminId = uuidv4();
    await db.insert(adminUsers).values({
      id: superAdminId,
      tenantId: 'super-admin',
      email,
      password: hashedPassword,
      name,
      type: 'super-admin',
      roleId: superAdminRoleId,
      role: 'Super Administrator'
    });

    // Create sample tenants
    const sampleTenants = [
      {
        id: 'tenant-demo-1',
        name: 'Demo Store 1',
        slug: 'demo1',
        email: 'demo1@example.com',
        status: 'active',
        plan: 'basic'
      },
      {
        id: 'tenant-demo-2',
        name: 'Demo Store 2', 
        slug: 'demo2',
        email: 'demo2@example.com',
        status: 'active',
        plan: 'basic'
      }
    ];

    // Create tenant admin role
    const tenantAdminRoleId = uuidv4();
    try {
      await db.insert(adminRoles).values({
        id: tenantAdminRoleId,
        name: 'Tenant Administrator',
        permissions: JSON.stringify(['manage_products', 'manage_orders', 'manage_users', 'view_reports'])
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        const [existingRole] = await db
          .select()
          .from(adminRoles)
          .where(eq(adminRoles.name, 'Tenant Administrator'))
          .limit(1);
        if (existingRole) {
          tenantAdminRoleId = existingRole.id;
        }
      }
    }

    for (const tenant of sampleTenants) {
      try {
        // Create tenant
        await db.insert(tenants).values(tenant);

        // Create tenant admin
        const tenantAdminPassword = await bcrypt.hash('Demo123!', 10);
        await db.insert(adminUsers).values({
          id: uuidv4(),
          tenantId: tenant.id,
          email: `admin@${tenant.slug}.com`,
          password: tenantAdminPassword,
          name: `${tenant.name} Admin`,
          type: 'admin',
          roleId: tenantAdminRoleId,
          role: 'Tenant Administrator'
        });
      } catch (error: any) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`Error creating tenant ${tenant.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: 'Super admin and sample data created successfully',
      superAdmin: {
        email,
        loginUrl: 'http://localhost:3000/login'
      },
      tenants: sampleTenants.map(t => ({
        name: t.name,
        loginUrl: `http://${t.slug}.localhost:3000/login`,
        adminEmail: `admin@${t.slug}.com`,
        adminPassword: 'Demo123!'
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating super admin:', error);
    return NextResponse.json({ error: 'Failed to create super admin' }, { status: 500 });
  }
}