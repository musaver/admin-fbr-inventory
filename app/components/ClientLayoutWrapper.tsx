'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import ClientLayout from './ClientLayout';
import { CurrencyProvider } from '@/app/contexts/CurrencyContext';
import { LayoutProvider } from '@/app/contexts/LayoutContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState, useEffect } from 'react';
import { isSubdomainRequest } from '@/lib/subdomain-utils';
import { useTenantStatus } from '@/hooks/useTenantStatus';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if this is a subdomain request
    const hostname = window.location.hostname;
    setIsSubdomain(isSubdomainRequest(hostname));
  }, []);

  // If we haven't determined subdomain status yet, show loading
  if (isSubdomain === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      forcedTheme="light"
    >
      <SessionProvider>
        <CurrencyProvider>
          <LayoutProvider>
            <ClientLayoutDecider isSubdomain={isSubdomain}>
              {children}
            </ClientLayoutDecider>
            <Toaster />
            <Sonner />
          </LayoutProvider>
        </CurrencyProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function ClientLayoutDecider({ isSubdomain, children }: { isSubdomain: boolean, children: React.ReactNode }) {
  const { data: session } = useSession();
  
  // Use tenant status hook to monitor for suspended tenants
  useTenantStatus();
  
  if (isSubdomain) {
    // Subdomain - always show admin layout with sidebar
    return <ClientLayout>{children}</ClientLayout>;
  } else {
    // Main domain - show admin layout only for super admins
    const currentUser = session?.user as any;
    const isSuperAdmin = currentUser?.type === 'super-admin';
    
    if (isSuperAdmin) {
      return <ClientLayout>{children}</ClientLayout>;
    } else {
      // Non-super-admin on main domain - show content without admin layout
      return <>{children}</>;
    }
  }
}
