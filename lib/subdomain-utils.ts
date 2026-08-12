/**
 * Utility function to check if the current hostname is a subdomain
 * This ensures consistent subdomain detection across the application
 */

// Root domain of the app, e.g. "hisaab360invoicing.com".
// NEXT_PUBLIC_ROOT_DOMAIN is inlined at build time for client components.
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'hisaab360invoicing.com';

// Subdomains that are never tenants — keep in sync with extractSubdomain()
// in lib/tenant.ts and lib/tenant-production.ts
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app'];

export function isSubdomainRequest(hostname: string): boolean {
  const parts = hostname.split('.');

  // For localhost development, check for subdomain.localhost format
  if (hostname.includes('localhost')) {
    return parts.length >= 2 && parts[0] !== 'localhost';
  }

  // Vercel deployment/preview URLs are never tenant subdomains
  if (hostname.endsWith('.vercel.app')) {
    return false;
  }

  // For production, check for subdomain.domain.tld format,
  // excluding reserved (non-tenant) subdomains
  return parts.length > 2 && !RESERVED_SUBDOMAINS.includes(parts[0]);
}

/**
 * Build the public URL for a tenant panel.
 * Uses subdomain.localhost during local development so the dev
 * workflow keeps working, and the configured root domain otherwise.
 */
export function getTenantUrl(slug: string): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    return `http://${slug}.localhost:${window.location.port || '3000'}`;
  }
  return `https://${slug}.${ROOT_DOMAIN}`;
}

/**
 * The suffix to display next to subdomain inputs, e.g. ".hisaab360invoicing.com"
 */
export function getSubdomainSuffix(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
    return `.localhost:${window.location.port || '3000'}`;
  }
  return `.${ROOT_DOMAIN}`;
}

/**
 * Hook to get the current subdomain status
 * Returns null while determining, then boolean
 */
export function useSubdomainDetection(): boolean | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  return isSubdomainRequest(window.location.hostname);
}
