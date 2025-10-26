'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/ui/header';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useLayout } from '@/app/contexts/LayoutContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { layout, toggleLayout } = useLayout();
  const isMobile = useIsMobile();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session) return <div>{children}</div>;

  // Auto-switch to header layout on mobile, or use user preference on desktop
  if (layout === 'header' || isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Sidebar Layout (Desktop only)
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" style={{'--sidebar-width': '16rem'} as React.CSSProperties}>
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-background sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLayout}
                className="h-8 w-8 hidden"
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Switch to header layout</span>
              </Button>
              <h1 className="text-lg font-semibold">Hisaab360 Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Additional header actions can go here */}
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 