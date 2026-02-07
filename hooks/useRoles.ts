import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserRoles, UserRole, UserRoleData, checkAccess, AccessLevel } from '../lib/roleService';

/**
 * Hook to get and manage user roles
 * 
 * Simplified: auth loading resolves in max 3s, roles loading resolves in max 3s.
 * Total worst case: 6s from page load to content.
 */
export function useRoles(): UserRoleData {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // If auth is still loading, wait
    if (authLoading) {
      setRolesLoading(true);
      return;
    }

    // No user = no roles, done immediately
    if (!user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }

    // Fetch roles with a hard 3-second timeout
    setRolesLoading(true);
    
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[useRoles] Timed out — defaulting to empty roles');
        setRoles([]);
        setRolesLoading(false);
      }
    }, 3000);

    fetchUserRoles().then((userRoles) => {
      if (!cancelled) {
        setRoles(userRoles);
        setRolesLoading(false);
      }
    }).catch((err) => {
      console.error('[useRoles] Error:', err);
      if (!cancelled) {
        setRoles([]);
        setRolesLoading(false);
      }
    }).finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [user, authLoading]);

  return {
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isPro: roles.includes('pro') || roles.includes('super_admin'),
    isAuthenticated: !!user,
    loading: authLoading || rolesLoading,
  };
}

/**
 * Hook to check if user has access to a specific level
 */
export function useAccess(requiredLevel: AccessLevel): {
  hasAccess: boolean;
  loading: boolean;
  redirectTo: string | null;
} {
  const { roles, isAuthenticated, loading } = useRoles();

  const hasAccess = !loading && checkAccess(roles, isAuthenticated, requiredLevel);
  
  let redirectTo: string | null = null;
  if (!loading && !hasAccess) {
    if (!isAuthenticated && requiredLevel !== 'public') {
      redirectTo = '/app/login';
    } else if (requiredLevel === 'pro' && !roles.includes('pro') && !roles.includes('super_admin')) {
      redirectTo = '/app/pros';
    } else if (requiredLevel === 'super_admin' && !roles.includes('super_admin')) {
      redirectTo = '/app';
    }
  }

  return { hasAccess, loading, redirectTo };
}

/**
 * Hook to check multiple access levels at once
 */
export function useMultiAccess(): {
  canAccessPublic: boolean;
  canAccessAuthenticated: boolean;
  canAccessPro: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
} {
  const { roles, isAuthenticated, loading } = useRoles();

  return {
    canAccessPublic: true,
    canAccessAuthenticated: isAuthenticated,
    canAccessPro: roles.includes('pro') || roles.includes('super_admin'),
    canAccessAdmin: roles.includes('super_admin'),
    loading,
  };
}
