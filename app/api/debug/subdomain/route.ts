import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain } from '@/lib/tenant-production';
import { getTenantBySlug } from '@/lib/tenant';

/**
 * Diagnostic endpoint for subdomain routing issues.
 * Reachable on any host (middleware skips /api/debug). Reveals no secrets —
 * only how this deployment sees the request and whether the tenant resolves.
 *
 * Usage: https://<tenant>.hisaab360invoicing.com/api/debug/subdomain
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomain(host);

  let tenantLookup: { found: boolean; status?: string; slug?: string } | { error: string } = { found: false };
  if (subdomain) {
    try {
      const tenant = await getTenantBySlug(subdomain);
      tenantLookup = tenant
        ? { found: true, slug: tenant.slug, status: tenant.status }
        : { found: false };
    } catch (error) {
      tenantLookup = { error: error instanceof Error ? error.message : 'DB lookup failed' };
    }
  }

  let nextauthUrlHost: string | null = null;
  try {
    nextauthUrlHost = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : null;
  } catch {
    nextauthUrlHost = 'INVALID URL FORMAT';
  }

  return NextResponse.json({
    hostSeenByServer: host,
    extractedSubdomain: subdomain,
    envConfig: {
      NEXTAUTH_URL_host: nextauthUrlHost ?? 'MISSING',
      NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'MISSING',
    },
    tenantLookup,
    timestamp: new Date().toISOString(),
  });
}
