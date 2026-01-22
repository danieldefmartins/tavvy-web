import { supabase } from './supabaseClient';

export type UserRole = 'super_admin' | 'pro' | 'user';

export interface UserRoleData {
  roles: UserRole[];
  isSuperAdmin: boolean;
  isPro: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Fetch the current user's roles from the database
 */
export async function fetchUserRoles(): Promise<UserRole[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_roles');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return (data as UserRole[]) || [];
  } catch (error) {
    console.error('Error in fetchUserRoles:', error);
    return [];
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', { check_role: role });
    
    if (error) {
      console.error('Error checking role:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in hasRole:', error);
    return false;
  }
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('super_admin');
}

/**
 * Check if user is a pro
 */
export async function isPro(): Promise<boolean> {
  return hasRole('pro');
}

/**
 * Route access levels
 */
export type AccessLevel = 'public' | 'authenticated' | 'pro' | 'super_admin';

/**
 * Check if user has access to a specific access level
 */
export function checkAccess(
  userRoles: UserRole[],
  isAuthenticated: boolean,
  requiredLevel: AccessLevel
): boolean {
  switch (requiredLevel) {
    case 'public':
      return true;
    case 'authenticated':
      return isAuthenticated;
    case 'pro':
      return userRoles.includes('pro') || userRoles.includes('super_admin');
    case 'super_admin':
      return userRoles.includes('super_admin');
    default:
      return false;
  }
}

/**
 * Route configuration for access control
 */
export const routeAccessConfig: Record<string, AccessLevel> = {
  // Public routes (no login required)
  '/app': 'public',
  '/app/explore': 'public',
  '/app/atlas': 'public',
  '/app/pros': 'public',
  '/app/cities': 'public',
  '/app/universes': 'public',
  '/place/[id]': 'public',
  '/app/universe/[slug]': 'public',
  '/app/city/[slug]': 'public',
  '/app/article/[id]': 'public',
  '/app/pros/category/[slug]': 'public',
  '/app/pros/provider/[id]': 'public',
  '/app/realtors': 'public',
  '/app/rv-camping': 'public',
  '/app/experiences': 'public',
  '/app/happening-now': 'public',
  '/app/rides': 'public',
  '/app/quick-finds': 'public',
  '/app/login': 'public',
  '/app/signup': 'public',
  '/app/help': 'public',
  
  // Authenticated user routes (login required)
  '/app/profile': 'authenticated',
  '/app/saved': 'authenticated',
  '/app/account': 'authenticated',
  '/app/settings': 'authenticated',
  '/app/apps': 'authenticated',
  
  // Pro-only routes
  '/app/pros/dashboard': 'pro',
  '/app/pros/messages': 'pro',
  '/app/pros/leads': 'pro',
  '/app/pros/settings': 'pro',
  '/app/pros/billing': 'pro',
  '/app/pros/register': 'authenticated', // Anyone can request to become a pro
  
  // Super Admin routes
  '/app/admin': 'super_admin',
  '/app/admin/users': 'super_admin',
  '/app/admin/places': 'super_admin',
  '/app/admin/reviews': 'super_admin',
  '/app/admin/providers': 'super_admin',
  '/app/admin/moderation': 'super_admin',
};

/**
 * Get the access level for a route
 */
export function getRouteAccessLevel(pathname: string): AccessLevel {
  // Check exact match first
  if (routeAccessConfig[pathname]) {
    return routeAccessConfig[pathname];
  }
  
  // Check for dynamic routes
  for (const [route, level] of Object.entries(routeAccessConfig)) {
    // Convert route pattern to regex
    const pattern = route
      .replace(/\[.*?\]/g, '[^/]+')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${pattern}$`);
    
    if (regex.test(pathname)) {
      return level;
    }
  }
  
  // Check for admin routes (any /app/admin/* route)
  if (pathname.startsWith('/app/admin')) {
    return 'super_admin';
  }
  
  // Check for pro dashboard routes
  if (pathname.startsWith('/app/pros/dashboard') || 
      pathname.startsWith('/app/pros/messages') ||
      pathname.startsWith('/app/pros/leads') ||
      pathname.startsWith('/app/pros/billing')) {
    return 'pro';
  }
  
  // Default to public for unknown routes
  return 'public';
}
