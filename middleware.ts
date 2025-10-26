import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain } from "@/lib/tenant-production";
import { getCachedTenant } from "@/lib/tenant-cache";

export async function middleware(request: NextRequest) {
  // Get the pathname and hostname
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // Skip middleware for API routes, static files, and NextAuth routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/api/loyalty') ||
    pathname.startsWith('/api/inngest') || // Skip Inngest webhook endpoint
    pathname.startsWith('/api/tenants/lookup') || // Skip tenant lookup API to avoid circular calls
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname);
  
  console.log('Middleware Debug:', {
    hostname,
    subdomain,
    pathname,
    isSubdomainRequest: !!subdomain
  });

  // Handle tenant subdomain requests
  if (subdomain) {
    console.log('Processing tenant request for subdomain:', subdomain);
    
    let tenant = null;
    try {
      // Get tenant information (with caching)
      tenant = await getCachedTenant(subdomain);
      console.log('Tenant lookup result:', tenant ? `Found: ${tenant.name} (${tenant.status})` : 'Not found');
      
      if (!tenant) {
        console.log('Tenant not found for subdomain:', subdomain);
        // For localhost, redirect to localhost, for production use main domain
        const redirectHost = hostname.includes('localhost') ? 'localhost:3000' : hostname.replace(subdomain + '.', '');
        const protocol = hostname.includes('localhost') ? 'http' : 'https';
        return NextResponse.redirect(new URL(`${protocol}://${redirectHost}/tenant-not-found`));
      }
      
      if (tenant.status !== 'active') {
        console.log('Tenant not active:', tenant.status);
        // For localhost, redirect to localhost, for production use main domain  
        const redirectHost = hostname.includes('localhost') ? 'localhost:3000' : hostname.replace(subdomain + '.', '');
        const protocol = hostname.includes('localhost') ? 'http' : 'https';
        return NextResponse.redirect(new URL(`${protocol}://${redirectHost}/tenant-suspended`));
      }
      
      console.log('Tenant found and active:', tenant.name);
    } catch (error) {
      console.error('Error in tenant lookup:', error);
      // Fallback redirect on error
      const redirectHost = hostname.includes('localhost') ? 'localhost:3000' : hostname.replace(subdomain + '.', '');
      const protocol = hostname.includes('localhost') ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${redirectHost}/tenant-not-found`));
    }
    
    // Add tenant information to request headers (tenant should be defined here)
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-slug', tenant.slug);
    response.headers.set('x-tenant-name', tenant.name);
    
    // Continue with authentication check for tenant
    return await handleTenantAuthentication(request, response, tenant);
  }
  
  // Handle main domain requests (marketing site, tenant registration, etc.)
  console.log('Processing main domain request');
  return await handleMainDomainRequest(request);
}

async function handleTenantAuthentication(request: NextRequest, response: NextResponse, tenant: any) {
  const pathname = request.nextUrl.pathname;

  // Skip authentication for API routes that don't require tenant context
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/inngest') || // Skip Inngest webhook endpoint
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/_next') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico')
  ) {
    return response;
  }

  try {
    // Get token with proper error handling for Vercel
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      secureCookie: process.env.NODE_ENV === 'production',
    });

    const isAuthPage = pathname === "/login";
    const isHomePage = pathname === "/";
    const isProtectedPage = !isAuthPage && !isHomePage;

    // Debug logging
    console.log("Tenant Auth Debug:", {
      tenant: tenant.slug,
      path: pathname,
      hasToken: !!token,
      tokenTenantId: token?.tenantId,
      isAuthPage,
      isProtectedPage,
      nodeEnv: process.env.NODE_ENV,
    });

    // Check if token belongs to this tenant
    if (token && token.tenantId !== tenant.id) {
      console.log("Token tenant mismatch, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is authenticated and trying to access login page
    if (token && isAuthPage) {
      console.log("Redirecting authenticated tenant user to dashboard");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If user is not authenticated and trying to access protected page
    if (!token && isProtectedPage) {
      console.log("Redirecting unauthenticated tenant user to login");
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Add tenant info to response headers for authenticated requests
    if (token) {
      response.headers.set('x-user-tenant-id', (token.tenantId as string) || '');
    }

    return response;

  } catch (error) {
    console.error("Tenant auth middleware error:", error);
    
    if (pathname !== "/login" && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    return response;
  }
}

async function handleMainDomainRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow marketing pages, tenant registration, etc.
  const publicPaths = [
    '/',
    '/signup',
    '/pricing', 
    '/contact',
    '/about',
    '/features',
    '/demo',
    '/blog',
    '/help',
    '/privacy',
    '/terms',
    '/tenant-not-found',
    '/tenant-suspended',
    '/api/tenants/register',
    '/api/tenants/check-subdomain'
  ];
  
  try {
    // Get token for super admin authentication
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      secureCookie: process.env.NODE_ENV === 'production',
    });

    const isAuthPage = pathname === "/login";
    const isRootPage = pathname === "/";
    const isSuperAdminProtectedPage = !isAuthPage && !isRootPage && 
      !pathname.startsWith('/api/') && 
      !pathname.startsWith('/_next/') &&
      !pathname.includes('.') &&
      !publicPaths.includes(pathname);

    // Check if this is a super admin token
    const isSuperAdmin = token && token.type === 'super-admin';

    console.log("Main Domain Auth Debug:", {
      path: pathname,
      hasToken: !!token,
      tokenTenantId: token?.tenantId,
      isSuperAdmin,
      isAuthPage,
      isSuperAdminProtectedPage,
    });

    // If super admin is authenticated and trying to access login page
    if (isSuperAdmin && isAuthPage) {
      console.log("Redirecting authenticated super admin to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If not authenticated and trying to access super admin protected page
    if (!isSuperAdmin && isSuperAdminProtectedPage) {
      console.log("Redirecting unauthenticated user to login");
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated super admin accessing root, redirect to dashboard
    if (isSuperAdmin && pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow unauthenticated root access to show landing page
    if (!isSuperAdmin && pathname === '/') {
      return NextResponse.next();
    }

    // If we reach here and user is super admin, allow access to all routes
    if (isSuperAdmin) {
      return NextResponse.next();
    }

  } catch (error) {
    console.error("Main domain auth middleware error:", error);
  }
  
  // Allow all API routes and static files
  if (publicPaths.includes(pathname) || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Allow login page
  if (pathname === '/login') {
    return NextResponse.next();
  }
  
  // Allow access to root for landing page
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // Redirect other non-super-admin access to root page (landing page)
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, and other static assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
