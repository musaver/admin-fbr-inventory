import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, orders } from '@/lib/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get the current session to ensure only super admins can access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can view all tenants
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    console.log('Super admin fetching all tenants');

    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        email: tenants.email,
        status: tenants.status,
        plan: tenants.plan,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        productionOrdersCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${orders}
          WHERE ${orders.tenantId} = ${tenants.id}
          AND ${orders.fbrEnvironment} = 'production'
        )`.as('production_orders_count'),
      })
      .from(tenants)
      .orderBy(tenants.createdAt);

    return NextResponse.json(allTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the current session to ensure only super admins can create tenants
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can create tenants
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const { name, slug, email, plan } = await req.json();
    
    // Validate required fields
    if (!name || !slug || !email) {
      return NextResponse.json({ error: 'Name, slug, and email are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json({ error: 'Subdomain already exists' }, { status: 400 });
    }
    
    const newTenant = {
      id: uuidv4(),
      name,
      slug,
      email,
      plan: plan || 'basic',
      status: 'active',
    };

    await db.insert(tenants).values(newTenant);

    console.log('Super admin created new tenant:', newTenant.name);
    return NextResponse.json(newTenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}