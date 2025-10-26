// Production tenant lookup that works with Edge Runtime
import { NextRequest } from 'next/server';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  logo?: string;
  primaryColor: string;
  settings?: any;
  maxUsers: number;
  maxProducts: number;
  maxOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  
  // Handle localhost development - check for subdomain.localhost format
  if (host.includes('localhost')) {
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }
  
  // Handle other development IPs
  if (host.includes('127.0.0.1') || host.includes('192.168.')) {
    return null;
  }
  
  // Need at least 3 parts for production subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  const subdomain = parts[0];
  
  // Ignore common non-tenant subdomains
  if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

/**
 * Get tenant by slug - Production version that uses database
 * This works in both Edge Runtime and regular Node.js runtime
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    // In production, we need to use the database API endpoint
    // because Edge Runtime can't directly connect to MySQL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://hisaab360.com';
    
    const response = await fetch(`${baseUrl}/api/tenants/lookup?slug=${slug}`, {
      headers: {
        'User-Agent': 'middleware-tenant-lookup',
        'X-Internal-Request': 'true',
      },
      // Add timeout for Edge Runtime
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      console.error('Failed to fetch tenant from database:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.tenant) {
      console.log('Production tenant lookup successful:', data.tenant.name);
      return data.tenant;
    }
    
    console.log('Tenant not found in database:', slug);
    return null;
    
  } catch (error) {
    console.error('Error fetching tenant from database:', error);
    
    // Fallback to hardcoded tenants for existing test tenants
    // This ensures backward compatibility during development
    const fallbackTenants = [
      {
        id: '1322dcd9-b23c-40b9-a918-b6b8b990e011',
        name: 'Acme Electronics',
        slug: 'acme-electronics',
        email: 'admin@acme-electronics.com',
        plan: 'premium',
        status: 'active',
        primaryColor: '#3b82f6',
        maxUsers: 5,
        maxProducts: 1000,
        maxOrders: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cb51f4b3-955c-4bfe-84db-a8edfac2a4ec',
        name: 'Beta Retail Co',
        slug: 'beta-retail',
        email: 'admin@beta-retail.com',
        plan: 'basic',
        status: 'active',
        primaryColor: '#3b82f6',
        maxUsers: 5,
        maxProducts: 1000,
        maxOrders: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const fallbackTenant = fallbackTenants.find(t => t.slug === slug);
    if (fallbackTenant) {
      console.log('Using fallback tenant data for:', slug);
      return fallbackTenant;
    }
    
    return null;
  }
}

/**
 * Get tenant from request (from headers set by middleware)
 */
export function getTenantFromRequest(request: NextRequest): { tenantId: string; tenantSlug: string } | null {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  
  if (!tenantId || !tenantSlug) {
    return null;
  }
  
  return { tenantId, tenantSlug };
}
