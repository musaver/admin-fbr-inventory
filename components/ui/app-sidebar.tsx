'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Package,
  Folder,
  BarChart3,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Menu,
  PanelLeft,
  Shield,
  UserCog,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLayout } from '@/app/contexts/LayoutContext';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const { toggleLayout } = useLayout();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      children: [
        { name: 'All Users', href: '/users' },
        { name: 'Add User', href: '/users/add' },
        { name: 'Bulk Upload', href: '/users/bulk-upload' },
      ],
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      children: [
        { name: 'All Products', href: '/products' },
        { name: 'Add Product', href: '/products/add' },
        { name: 'Bulk Upload', href: '/users/bulk-upload?tab=products' },
      ],
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      children: [
        { name: 'All Orders', href: '/orders' },
        { name: 'Add Order', href: '/orders/add' },
        { name: 'Bulk Upload', href: '/users/bulk-upload?tab=orders' },
      ],
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: Folder,
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: BarChart3,
      children: [
        { name: 'Overview', href: '/inventory' },
        { name: 'Listing', href: '/inventory/listing' },
        { name: 'Reports', href: '/inventory/reports' },
      ],
    },
    {
      name: 'Admin Users',
      href: '/admins',
      icon: UserCog,
      children: [
        { name: 'All Admin Users', href: '/admins' },
        { name: 'Add Admin User', href: '/admins/add' },
      ],
    },
    {
      name: 'Admin Roles',
      href: '/roles',
      icon: Shield,
      children: [
        { name: 'All Roles', href: '/roles' },
        { name: 'Add Role', href: '/roles/add' },
      ],
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      children: [
        { name: 'Sales Reports', href: '/reports/sales' },
        { name: 'Revenue Reports', href: '/reports/revenue' },
        { name: 'Product Reports', href: '/reports/products' },
        { name: 'Customer Reports', href: '/reports/customers' },
        { name: 'Order Reports', href: '/reports/orders' },
        { name: 'Profit Reports', href: '/reports/profits' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const currentUser = session?.user as any;

  return (
    <Sidebar variant="inset" collapsible="none" className="w-64 min-w-64 sidebar-fixed-width bg-card">
      <SidebarHeader className="sticky top-0 z-50 bg-sidebar border-b shadow-sm">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            
            <h2 className='text-xl font-bold tracking-tight'>
              Hisaab360 Admin
            </h2>
          </div>
          {/* Theme Toggle - Hidden (forced light mode) */}
          <div className="hidden">
           
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  {item.children ? (
                    <Collapsible defaultOpen={isActive(item.href)} className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.name}
                          isActive={isActive(item.href)}
                          className="w-full"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.name}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(child.href)}
                              >
                                <Link href={child.href}>
                                  <span>{child.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      tooltip={item.name}
                      isActive={isActive(item.href)}
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="sticky bottom-0 z-50 bg-sidebar border-t shadow-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={currentUser?.image || ''} alt={currentUser?.name || 'User'} />
                    <AvatarFallback className="rounded-lg">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser?.name || 'User'}</span>
                    <span className="truncate text-xs">{currentUser?.email}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {currentUser?.name && (
                      <p className="font-medium">{currentUser.name}</p>
                    )}
                    {currentUser?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {currentUser.email}
                      </p>
                    )}
                    {currentUser?.type && (
                      <Badge variant="secondary" className="w-fit">
                        {currentUser.type}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admins" className="flex items-center">
                    <UserCog className="h-4 w-4 mr-2" />
                    Admin Users
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/roles" className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Roles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reports" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/logout" className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}