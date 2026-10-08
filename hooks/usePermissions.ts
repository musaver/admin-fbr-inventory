import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export interface UserPermissions {
  permissions: string[];
  roleName: string;
  loading: boolean;
  error: string | null;
}

/**
 * React hook to get current user's permissions
 */
export function usePermissions(): UserPermissions {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (!session?.user) {
      setPermissions([]);
      setRoleName('');
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    const user = session.user as any;

    // Super admin has all permissions
    if (user.type === 'super-admin') {
      setPermissions(['*']);
      setRoleName('Super Administrator');
      setLoading(false);
      setError(null);
      return;
    }

    // For regular admin, fetch their role permissions
    if (user.roleId) {
      fetch('/api/permissions/me')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
            setPermissions([]);
            setRoleName('');
          } else {
            setPermissions(data.permissions || []);
            setRoleName(data.roleName || '');
            setError(null);
          }
        })
        .catch(err => {
          setError('Failed to fetch permissions');
          setPermissions([]);
          setRoleName('');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPermissions([]);
      setRoleName('');
      setLoading(false);
      setError('No role assigned');
    }
  }, [session, status]);

  return { permissions, roleName, loading, error };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check for wildcard permissions (e.g., 'users_*' matches 'users_view', 'users_create', etc.)
  const wildcardPermissions = userPermissions.filter(p => p.endsWith('_*'));
  for (const wildcardPerm of wildcardPermissions) {
    const prefix = wildcardPerm.replace('_*', '_');
    if (requiredPermission.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(requiredPermission: string): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { permissions, loading, error } = usePermissions();
  
  return {
    hasPermission: hasPermission(permissions, requiredPermission),
    loading,
    error
  };
}

/**
 * Hook to check if user has any of the required permissions
 */
export function useHasAnyPermission(requiredPermissions: string[]): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { permissions, loading, error } = usePermissions();
  
  const hasAny = requiredPermissions.some(permission => 
    hasPermission(permissions, permission)
  );
  
  return {
    hasPermission: hasAny,
    loading,
    error
  };
}

/**
 * Hook to check if user has all of the required permissions
 */
export function useHasAllPermissions(requiredPermissions: string[]): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { permissions, loading, error } = usePermissions();
  
  const hasAll = requiredPermissions.every(permission => 
    hasPermission(permissions, permission)
  );
  
  return {
    hasPermission: hasAll,
    loading,
    error
  };
}