import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserRoles, UserRole, UserRoleData, checkAccess, AccessLevel } from '../lib/roleService';

/**
 * Hook to get and manage user roles
 * 
 * Architecture (aligned with security audit):
 * - Regular Users: Just authenticated (no role row needed)
 * - Pro Users: Status from pro_subscriptions table (Stripe webhook sets this)
 * - Super Admins: Stored in user_roles table (manual assignment only)
 */
export function useRoles(): UserRoleData {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      if (authLoading) {
        return;
      }

      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userRoles = await fetchUserRoles();
        setRoles(userRoles);
      } catch (error) {
        console.error('Error loading roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    loadRoles();
  }, [user, authLoading]);

  return {
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isPro: roles.includes('pro') || roles.includes('super_admin'),
    isAuthenticated: !!user,
    loading: authLoading || loading,
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
      redirectTo = '/app/pros'; // Redirect to pros info page
    } else if (requiredLevel === 'super_admin' && !roles.includes('super_admin')) {
      redirectTo = '/app'; // Redirect to home
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
