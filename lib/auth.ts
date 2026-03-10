import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { adminUsers, tenants, adminRoles } from "@/lib/schema";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { extractSubdomain } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenant-production";

export const authOptions: NextAuthOptions = {
  // Don't use adapter with JWT strategy - causes conflicts
  // adapter: DrizzleAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // For multi-tenant subdomains, don't set domain to allow per-subdomain cookies
        domain: undefined
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Host-next-auth.csrf-token' 
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          // Get tenant info from request
          const hostname = req?.headers?.host || '';
          const subdomain = extractSubdomain(hostname);
          
          console.log("Auth Debug - Login attempt:", {
            hostname,
            subdomain,
            email: credentials.email,
          });
          
          let tenantId = null;
          let tenantSlug = null;
          
          if (subdomain) {
            // This is a tenant login - get tenant info using the same method as middleware
            const tenant = await getTenantBySlug(subdomain);
            
            console.log("Auth Debug - Tenant lookup result:", {
              subdomain,
              tenantFound: !!tenant,
              tenantName: tenant?.name,
              tenantStatus: tenant?.status,
            });
            
            if (!tenant) {
              console.log("Tenant not found for subdomain:", subdomain);
              return null;
            }
            
            if (tenant.status !== 'active') {
              console.log("Tenant not active:", tenant.status);
              return null;
            }
            
            tenantId = tenant.id;
            tenantSlug = tenant.slug;
            
            // Find admin user for this specific tenant with role validation
            const [user_cred] = await db
              .select({
                id: adminUsers.id,
                email: adminUsers.email,
                password: adminUsers.password,
                name: adminUsers.name,
                tenantId: adminUsers.tenantId,
                type: adminUsers.type,
                role: adminUsers.role,
                roleId: adminUsers.roleId,
              })
              .from(adminUsers)
              .where(and(
                eq(adminUsers.email, credentials.email),
                eq(adminUsers.tenantId, tenantId)
              ))
              .limit(1);
/*
            if (user_cred) {
              // Check if the user's role is still active (if they have a role)
              if (user_cred.roleId) {
                const [roleCheck] = await db
                  .select({
                    isActive: adminRoles.isActive,
                    name: adminRoles.name
                  })
                  .from(adminRoles)
                  .where(and(
                    eq(adminRoles.id, user_cred.roleId),
                    eq(adminRoles.tenantId, tenantId)
                  ))
                  .limit(1);

                if (!roleCheck || roleCheck.isActive === false) {
                  console.log("User role is inactive or not found:", user_cred.roleId, "for tenant:", subdomain);
                  return null;
                }
              }
            }
*/
            console.log("Auth Debug - User lookup result:", {
              email: credentials.email,
              tenantId,
              userFound: !!user_cred,
            });

            if (!user_cred) {
              console.log("Tenant admin not found:", credentials.email, "for tenant:", subdomain);
              return null;
            }

            const isValid = await bcrypt.compare(credentials.password, user_cred.password ?? "");
            if (!isValid) {
              console.log("Invalid password for tenant admin:", credentials.email);
              return null;
            }

            console.log("Tenant admin authenticated successfully:", credentials.email, "for tenant:", subdomain);
            return {
              id: user_cred.id,
              name: user_cred.name,
              email: user_cred.email,
              tenantId: tenantId,
              tenantSlug: tenantSlug,
              type: user_cred.type,
              role: user_cred.role,
              roleId: user_cred.roleId,
            };
          } else {
            // This is main domain login - check for super admin
            console.log("Main domain login - checking for super admin");
            
            // Find super admin user (type should be 'super-admin')
            const [superAdmin] = await db
              .select({
                id: adminUsers.id,
                email: adminUsers.email,
                password: adminUsers.password,
                name: adminUsers.name,
                tenantId: adminUsers.tenantId,
                type: adminUsers.type,
                role: adminUsers.role,
                roleId: adminUsers.roleId,
              })
              .from(adminUsers)
              .where(and(
                eq(adminUsers.email, credentials.email),
                eq(adminUsers.type, 'super-admin') // Check for super-admin type
              ))
              .limit(1);

            console.log("Super admin lookup result:", {
              email: credentials.email,
              userFound: !!superAdmin,
            });

            if (!superAdmin) {
              console.log("Super admin not found:", credentials.email);
              return null;
            }

            const isValid = await bcrypt.compare(credentials.password, superAdmin.password ?? "");
            if (!isValid) {
              console.log("Invalid password for super admin:", credentials.email);
              return null;
            }

            console.log("Super admin authenticated successfully:", credentials.email);
            return {
              id: superAdmin.id,
              name: superAdmin.name,
              email: superAdmin.email,
              tenantId: superAdmin.tenantId,
              tenantSlug: null,
              type: superAdmin.type,
              role: superAdmin.role,
              roleId: superAdmin.roleId,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.tenantId = (user as any).tenantId;
          token.tenantSlug = (user as any).tenantSlug;
          token.type = (user as any).type;
          token.role = (user as any).role;
          token.roleId = (user as any).roleId;
          
          // Initialize tenant caching for session
          if ((user as any).tenantSlug) {
            const tenant = await getTenantBySlug((user as any).tenantSlug);
            token.tenantStatus = tenant?.status || 'inactive';
            token.lastTenantCheck = Date.now();
          }
          
          console.log("JWT callback - setting token data:", {
            id: user.id,
            tenantId: (user as any).tenantId,
            tenantSlug: (user as any).tenantSlug,
            type: (user as any).type
          });
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token.id) {
          // For tenant admin users, verify tenant is still active
          if (token.tenantId && token.tenantId !== 'super-admin' && token.tenantSlug) {
            // Only check tenant status every 30 minutes to reduce database load
            const lastTenantCheck = token.lastTenantCheck as number || 0;
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
            
            if (now - lastTenantCheck > thirtyMinutes) {
              console.log('🔄 Checking tenant status (30min interval):', token.tenantSlug);
              const tenant = await getTenantBySlug(token.tenantSlug as string);
              
              if (!tenant || tenant.status !== 'active') {
                console.log("Tenant suspended or not found during session:", token.tenantSlug);
                // Return null session to force logout
                return { ...session, user: null } as any;
              }
              
              // Update the last check timestamp in the token for next time
              token.lastTenantCheck = now;
              token.tenantStatus = tenant.status;
            } else {
              // Use cached tenant status from token
              if (token.tenantStatus !== 'active') {
                console.log("Cached tenant status is inactive:", token.tenantSlug);
                return { ...session, user: null } as any;
              }
            }
            
            // Also check if user's role is still active
            if (token.roleId) {
              const [roleCheck] = await db
                .select({ isActive: adminRoles.isActive })
                .from(adminRoles)
                .where(and(
                  eq(adminRoles.id, token.roleId as string),
                  eq(adminRoles.tenantId, token.tenantId as string)
                ))
                .limit(1);

              if (!roleCheck || roleCheck.isActive === false) {
                console.log("User role deactivated during session:", token.roleId);
                // Return null session to force logout
                return { ...session, user: null } as any;
              }
            }
          }

          (session.user as any).id = token.id;
          (session.user as any).tenantId = token.tenantId;
          (session.user as any).tenantSlug = token.tenantSlug;
          (session.user as any).type = token.type;
          (session.user as any).role = token.role;
          (session.user as any).roleId = token.roleId;
          console.log("Session callback - setting session data:", {
            id: token.id,
            tenantId: token.tenantId,
            tenantSlug: token.tenantSlug,
            type: token.type
          });
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl });
      
      // Handle callback URLs from login redirects
      if (url.includes('callbackUrl=')) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return `${baseUrl}${callbackUrl}`;
        }
      }
      
      // Always redirect to main page (/) after login - which handles redirect logic
      if (url === "/login" || url === `${baseUrl}/login`) {
        return `${baseUrl}/`;
      }
      
      // If coming from base URL, go to main page
      if (url === baseUrl) {
        return `${baseUrl}/`;
      }
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Handle absolute URLs that match the base domain
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (e) {
        // Invalid URL, fallback to homepage
        console.warn("Invalid URL in redirect callback:", url);
      }
      
      // Default: redirect to main page (homepage handles further routing)
      return `${baseUrl}/`;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("NextAuth Debug:", code, metadata);
      }
    },
  },
}; 