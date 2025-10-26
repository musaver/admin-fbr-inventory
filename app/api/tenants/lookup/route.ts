import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    // Verify this is an internal request (for security) OR a client-side status check
    const isInternalRequest = request.headers.get('X-Internal-Request') === 'true';
    const userAgent = request.headers.get('User-Agent');
    const referer = request.headers.get('Referer');
    const isClientSideCheck = referer && (referer.includes(slug || '') || request.headers.get('Cookie'));
    
    if (!isInternalRequest && !userAgent?.includes('middleware-tenant-lookup') && !isClientSideCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }
    
    console.log('Database tenant lookup for slug:', slug);
    
    // Query the database for the tenant
    const result = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        email: tenants.email,
        phone: tenants.phone,
        plan: tenants.plan,
        status: tenants.status,
        logo: tenants.logo,
        primaryColor: tenants.primaryColor,
        settings: tenants.settings,
        maxUsers: tenants.maxUsers,
        maxProducts: tenants.maxProducts,
        maxOrders: tenants.maxOrders,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    
    const tenant = result[0] || null;
    
    console.log('Database lookup result:', {
      slug,
      found: !!tenant,
      name: tenant?.name,
      status: tenant?.status,
    });
    
    const response = NextResponse.json({
      tenant,
      timestamp: new Date().toISOString(),
    });
    
    // Add cache headers to reduce repeated requests
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600'); // 30 minutes cache, 1 hour stale
    response.headers.set('CDN-Cache-Control', 'public, max-age=1800');
    
    return response;
    
  } catch (error) {
    console.error('Error in tenant lookup API:', error);
    return NextResponse.json({
      error: 'Database lookup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      tenant: null,
    }, { status: 500 });
  }
}
