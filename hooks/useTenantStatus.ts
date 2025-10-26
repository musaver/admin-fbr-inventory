import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useTenantStatus() {
  const { data: session } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const user = session?.user as any;

  useEffect(() => {
    // Only check for tenant users, not super admins
    if (!user || user.type === 'super-admin' || !user.tenantId) {
      return;
    }

    const checkTenantStatus = async () => {
      try {
        // Check tenant status via API (with cache headers)
        const response = await fetch(`/api/tenants/lookup?slug=${user.tenantSlug}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'max-age=1800' // Request cached version if available (30 minutes)
          }
        });

        if (!response.ok) {
          console.error('Failed to check tenant status');
          return;
        }

        const data = await response.json();
        
        // If tenant is suspended or inactive, logout immediately
        if (data.tenant && data.tenant.status !== 'active') {
          console.log(`Tenant ${data.tenant.slug} is ${data.tenant.status}, logging out user`);
          
          // Sign out the user
          await signOut({ 
            redirect: false,
            callbackUrl: '/login?message=tenant_suspended'
          });
          
          // Clear any client-side storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirect to login with suspended message
          router.push('/login?message=tenant_suspended');
          return;
        }

        // Also check if user's role is still active (if they have a role)
        if (user.roleId) {
          const roleResponse = await fetch('/api/permissions/me', {
            method: 'GET',
            credentials: 'include'
          });

          if (roleResponse.status === 401 || roleResponse.status === 403) {
            console.log('User role deactivated or permissions revoked, logging out user');
            
            // Sign out the user
            await signOut({ 
              redirect: false,
              callbackUrl: '/login?message=role_deactivated'
            });
            
            // Clear any client-side storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login with role deactivated message
            router.push('/login?message=role_deactivated');
          }
        }
      } catch (error) {
        console.error('Error checking tenant status:', error);
      }
    };

    // Initial check
    checkTenantStatus();

    // Set up periodic checking every 30 minutes (reduced from 30 seconds)
    intervalRef.current = setInterval(checkTenantStatus, 30 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}