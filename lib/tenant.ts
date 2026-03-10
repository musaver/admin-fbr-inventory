import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
 * Examples:
 * - acme.yourdomain.com → acme
 * - localhost:3000 → null (for development)
 * - yourdomain.com → null (main domain)
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // Handle localhost development - check for subdomain.localhost format
  if (host.includes('localhost')) {
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      return parts[0]; // Return subdomain part (e.g., "acme-electronics" from "acme-electronics.localhost")
    }
    return null; // Plain localhost
  }
  
  // Handle other development IPs
  if (host.includes('127.0.0.1') || host.includes('192.168.')) {
    return null;
  }
  
  // Need at least 3 parts for production subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  // Return first part as subdomain
  const subdomain = parts[0];
  
  // Ignore common non-tenant subdomains
  if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

/**
 * Get tenant by slug from database
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
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

/**
 * Get tenant from server session (for server components)
 * Note: This function should be used in server components only, not in middleware
 */
export async function getTenantFromSession(): Promise<{ tenantId: string; tenantSlug: string } | null> {
  // This function will be implemented in api-helpers.ts to avoid Edge Runtime issues
  return null;
}

/**
 * Validate if subdomain is available for registration
 */
export async function isSubdomainAvailable(slug: string): Promise<boolean> {
  // Check for reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'support', 'help'];
  if (reserved.includes(slug.toLowerCase())) {
    return false;
  }
  
  // Check if slug already exists
  const existing = await getTenantBySlug(slug);
  return !existing;
}

/**
 * Generate subdomain suggestions if the requested one is taken
 */
export function generateSubdomainSuggestions(baseSlug: string): string[] {
  const suggestions = [];
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  // Add numbers
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${baseSlug}${i}`);
  }
  
  // Add year
  suggestions.push(`${baseSlug}${currentYear}`);
  
  // Add common suffixes
  const suffixes = ['inc', 'co', 'app', 'hq'];
  suffixes.forEach(suffix => {
    suggestions.push(`${baseSlug}${suffix}`);
  });
  
  return suggestions;
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(slug: string): boolean {
  // Check length (3-63 characters)
  if (slug.length < 3 || slug.length > 63) {
    return false;
  }
  
  // Check format: lowercase letters, numbers, and hyphens only
  const regex = /^[a-z0-9-]+$/;
  if (!regex.test(slug)) {
    return false;
  }
  
  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }
  
  // Cannot contain consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }
  
  return true;
}

/**
 * Check if tenant has reached their plan limits
 */
export async function checkTenantLimits(tenantId: string, resource: 'users' | 'products' | 'orders'): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    // Get tenant info
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    
    if (!tenant[0]) {
      return { allowed: false, current: 0, limit: 0 };
    }
    
    const limits = {
      users: tenant[0].maxUsers,
      products: tenant[0].maxProducts,
      orders: tenant[0].maxOrders,
    };
    
    // TODO: Implement actual counting logic based on resource type
    // For now, return placeholder values
    const currentCounts = {
      users: 0, // await countTenantUsers(tenantId)
      products: 0, // await countTenantProducts(tenantId)
      orders: 0, // await countTenantOrders(tenantId)
    };
    
    const limit = limits[resource];
    const current = currentCounts[resource];
    
    return {
      allowed: current < limit,
      current,
      limit
    };
  } catch (error) {
    console.error('Error checking tenant limits:', error);
    return { allowed: false, current: 0, limit: 0 };
  }
}

/**
 * Get tenant settings with defaults
 */
export function getTenantSettings(tenant: Tenant): any {
  const defaultSettings = {
    currency: 'PKR',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    stockManagementEnabled: true,
    loyaltyPointsEnabled: false,
    emailNotifications: true,
    allowCustomerRegistration: true,
  };
  
  return {
    ...defaultSettings,
    ...(tenant.settings || {}),
  };
}
