'use client';
import React from 'react';
import { useHasPermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/usePermissions';

interface BasePermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

interface SinglePermissionProps extends BasePermissionGuardProps {
  permission: string;
  permissions?: never;
  requireAll?: never;
}

interface MultiplePermissionsProps extends BasePermissionGuardProps {
  permission?: never;
  permissions: string[];
  requireAll?: boolean; // true = requires ALL permissions, false = requires ANY permission
}

type PermissionGuardProps = SinglePermissionProps | MultiplePermissionsProps;

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  children,
  fallback = null,
  showLoading = false,
  permission,
  permissions,
  requireAll = false
}: PermissionGuardProps) {
  // Single permission check
  const singlePermissionResult = useHasPermission(permission || '');
  
  // Multiple permissions check
  const anyPermissionResult = useHasAnyPermission(permissions || []);
  const allPermissionsResult = useHasAllPermissions(permissions || []);
  
  // Determine which result to use
  let result;
  if (permission) {
    result = singlePermissionResult;
  } else if (permissions) {
    result = requireAll ? allPermissionsResult : anyPermissionResult;
  } else {
    // No permissions specified, always show
    result = { hasPermission: true, loading: false, error: null };
  }
  
  if (result.loading && showLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }
  
  if (result.error && showLoading) {
    return <div className="text-red-500">Error: {result.error}</div>;
  }
  
  if (!result.hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook-based alternative for conditional rendering
 */
export function usePermissionGuard(permission: string) {
  const { hasPermission, loading, error } = useHasPermission(permission);
  
  return {
    canAccess: hasPermission,
    loading,
    error,
    // Helper function for conditional rendering
    guard: (component: React.ReactNode, fallback?: React.ReactNode) => {
      if (loading) return null;
      if (error) return null;
      return hasPermission ? component : (fallback || null);
    }
  };
}

/**
 * Component for showing permission-based navigation items
 */
export function PermissionBasedNavItem({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback,
  className = ''
}: PermissionGuardProps & { className?: string }) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      <div className={className}>
        {children}
      </div>
    </PermissionGuard>
  );
}

/**
 * Component for showing permission-based buttons
 */
export function PermissionBasedButton({
  permission,
  permissions,
  requireAll = false,
  children,
  disabled = false,
  className = '',
  onClick,
  ...props
}: PermissionGuardProps & {
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  const result = permission 
    ? useHasPermission(permission)
    : permissions 
      ? (requireAll ? useHasAllPermissions(permissions) : useHasAnyPermission(permissions))
      : { hasPermission: true, loading: false, error: null };
  
  const isDisabled = disabled || !result.hasPermission || result.loading;
  
  return (
    <button
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isDisabled}
      onClick={result.hasPermission ? onClick : undefined}
      {...props}
    >
      {children}
    </button>
  );
}