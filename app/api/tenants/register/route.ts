import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, adminUsers, adminRoles } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { isSubdomainAvailable, isValidSubdomain } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const {
      // Company info
      companyName,
      subdomain,
      email,
      phone,
      
      // Admin user info
      adminName,
      adminEmail,
      adminPassword,
      
      // Optional
      plan = 'basic',
      address,
      city,
      state,
      country,
      postalCode
    } = await request.json();

    // Validate required fields
    if (!companyName || !subdomain || !email || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ 
        error: 'Missing required fields: companyName, subdomain, email, adminName, adminEmail, adminPassword' 
      }, { status: 400 });
    }

    // Validate subdomain
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json({ 
        error: 'Invalid subdomain format. Must be 3-63 characters, lowercase letters, numbers, and hyphens only.' 
      }, { status: 400 });
    }

    // Check if subdomain is available
    if (!(await isSubdomainAvailable(subdomain))) {
      return NextResponse.json({ 
        error: 'Subdomain is already taken' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !emailRegex.test(adminEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Set plan limits based on plan type
    const planLimits = {
      basic: { maxUsers: 5, maxProducts: 1000, maxOrders: 10000 },
      premium: { maxUsers: 25, maxProducts: 10000, maxOrders: 100000 },
      enterprise: { maxUsers: 100, maxProducts: 50000, maxOrders: 500000 }
    };

    const limits = planLimits[plan as keyof typeof planLimits] || planLimits.basic;

    // Generate IDs
    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    const adminRoleId = uuidv4();

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    try {
      // Start transaction by creating all records
      // Create tenant
      await db.insert(tenants).values({
        id: tenantId,
        name: companyName,
        slug: subdomain.toLowerCase(),
        email: email,
        phone: phone || null,
        plan: plan,
        status: 'trial', // Start with trial
        trialEndsAt: trialEndsAt,
        maxUsers: limits.maxUsers,
        maxProducts: limits.maxProducts,
        maxOrders: limits.maxOrders,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postalCode || null,
        primaryColor: '#3b82f6', // Default blue
        settings: JSON.stringify({
          currency: 'PKR',
          timezone: 'UTC',
          stockManagementEnabled: true,
          loyaltyPointsEnabled: false,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create admin role for this tenant
      await db.insert(adminRoles).values({
        id: adminRoleId,
        name: 'Super Admin',
        permissions: JSON.stringify([
          'all' // Super admin has all permissions
        ]),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create admin user
      await db.insert(adminUsers).values({
        id: adminUserId,
        tenantId: tenantId,
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        roleId: adminRoleId,
        role: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Return success response
      return NextResponse.json({
        success: true,
        tenant: {
          id: tenantId,
          name: companyName,
          slug: subdomain,
          email: email,
          plan: plan,
          status: 'trial',
          trialEndsAt: trialEndsAt.toISOString(),
          url: `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}`
        },
        admin: {
          id: adminUserId,
          name: adminName,
          email: adminEmail,
          role: 'Super Admin'
        },
        message: 'Tenant created successfully! You can now login to your admin panel.'
      }, { status: 201 });

    } catch (dbError) {
      console.error('Database error during tenant creation:', dbError);
      
      // Try to cleanup if tenant was created but other records failed
      try {
        await db.delete(tenants).where({ id: tenantId });
        await db.delete(adminRoles).where({ id: adminRoleId });
        await db.delete(adminUsers).where({ id: adminUserId });
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }

      return NextResponse.json({ 
        error: 'Failed to create tenant. Please try again.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ 
      error: 'Failed to create tenant. Please try again.' 
    }, { status: 500 });
  }
}
