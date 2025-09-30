'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Package,
  Folder,
  BarChart3,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  ChevronDown,
  PanelLeft,
  Shield,
  UserCog,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/app/contexts/LayoutContext';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const currentUser = session?.user as any;

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm', className)}>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-3">
            
            <span className="text-xl font-bold hidden sm:block">Hisaab360 Admin</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'group flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md h-9',
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.name} asChild>
                        <Link
                          href={child.href}
                          className={cn(
                            'flex items-center w-full cursor-pointer',
                            isActive(child.href) && 'bg-accent text-accent-foreground'
                          )}
                        >
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  asChild
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md h-9',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </nav>

        {/* Right side - Layout toggle, Theme toggle and user menu */}
        <div className="flex items-center space-x-4">
          {/* Layout Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLayout}
            className="h-8 w-8 hidden"
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Switch to sidebar layout</span>
          </Button>
          
          {/* Theme Toggle - Hidden (forced light mode) */}
          <div className="hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.image || ''} alt={currentUser?.name || 'User'} />
                  <AvatarFallback>
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
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

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle mobile menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.children && (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Link>
                {item.children && (
                  <div className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 text-sm rounded-md',
                          isActive(child.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}