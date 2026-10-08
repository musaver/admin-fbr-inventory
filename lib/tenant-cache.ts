/**
 * In-memory tenant cache to reduce database lookups
 * This cache is shared across all requests and reduces database load significantly
 */

import { getTenantBySlug } from './tenant-production';
import type { Tenant } from './tenant-production';

interface CachedTenant {
  tenant: Tenant | null;
  timestamp: number;
}

// Cache TTL: 30 minutes for found tenants
const CACHE_TTL = 30 * 60 * 1000;

// Short TTL for negative results (lookup failed or tenant not found)
// so transient lookup errors don't pin a tenant as "missing" for 30 minutes
const NEGATIVE_CACHE_TTL = 30 * 1000;

// In-memory cache using Map
const tenantCache = new Map<string, CachedTenant>();

/**
 * Get tenant from cache or database
 * @param slug Tenant slug to lookup
 * @returns Tenant object or null
 */
export async function getCachedTenant(slug: string, requestOrigin?: string): Promise<Tenant | null> {
  const now = Date.now();
  const cached = tenantCache.get(slug);

  // Return cached result if still valid (negative results expire much sooner)
  if (cached) {
    const ttl = cached.tenant ? CACHE_TTL : NEGATIVE_CACHE_TTL;
    if ((now - cached.timestamp) < ttl) {
      return cached.tenant;
    }
  }
  
  // Cache miss or expired - fetch from database
  console.log('🔄 Cache miss for tenant:', slug, cached ? '(expired)' : '(not found)');
  const tenant = await getTenantBySlug(slug, requestOrigin);
  
  // Store in cache
  tenantCache.set(slug, {
    tenant,
    timestamp: now
  });
  
  return tenant;
}

/**
 * Invalidate cached tenant (useful when tenant status changes)
 * @param slug Tenant slug to invalidate
 */
export function invalidateTenantCache(slug: string): void {
  tenantCache.delete(slug);
  console.log('🗑️ Invalidated cache for tenant:', slug);
}

/**
 * Clear all cached tenants
 */
export function clearTenantCache(): void {
  tenantCache.clear();
  console.log('🗑️ Cleared all tenant cache');
}

/**
 * Get cache statistics for monitoring
 */
export function getTenantCacheStats() {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;
  
  for (const [slug, cached] of tenantCache.entries()) {
    if ((now - cached.timestamp) < CACHE_TTL) {
      activeEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: tenantCache.size,
    activeEntries,
    expiredEntries,
    cacheHitRatio: activeEntries / (activeEntries + expiredEntries) || 0
  };
}