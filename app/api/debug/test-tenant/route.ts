import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain, getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    
    console.log('Debug: Testing tenant resolution');
    console.log('Hostname:', hostname);
    
    // Test subdomain extraction
    const subdomain = extractSubdomain(hostname);
    console.log('Extracted subdomain:', subdomain);
    
    let tenant = null;
    if (subdomain) {
      // Test database lookup
      tenant = await getTenantBySlug(subdomain);
      console.log('Tenant lookup result:', tenant ? tenant.name : 'not found');
    }
    
    return NextResponse.json({
      hostname,
      subdomain,
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status
      } : null,
      environment: {
        DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
        DB_USER: process.env.DB_USER ? 'set' : 'not set',
        DB_PASS: process.env.DB_PASS ? 'set' : 'not set',
        DB_NAME: process.env.DB_NAME ? 'set' : 'not set',
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
