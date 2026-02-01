import { supabase } from './supabaseClient';

/**
 * Role-Based Access Control Service
 * 
 * Architecture (aligned with security audit):
 * - Regular Users: Just authenticated (no role row needed)
 * - Pro Users: Status from pro_subscriptions table (Stripe webhook sets this)
 * - Super Admins: Stored in user_roles table (manual assignment only)
 * 
 * This ensures:
 * - No hardcoded admin emails
 * - Pro status tied to actual Stripe subscription
 * - Clear separation of concerns
 */

export type UserRole = 'super_admin' | 'pro' | 'user';

export interface UserRoleData {
  roles: UserRole[];
  isSuperAdmin: boolean;
  isPro: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Fetch the current user's super_admin status from user_roles table
 * Only super_admin roles are stored in user_roles
 */
export async function fetchSuperAdminStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching super admin status:', error);
      return false;
    }
    
    return data !== null;
  } catch (error) {
    console.error('Error in fetchSuperAdminStatus:', error);
    return false;
  }
}

/**
 * Fetch the current user's Pro status from pro_subscriptions table
 * Pro status is determined by having an active subscription
 * 
 * Flow: User -> pro_providers (user_id) -> pro_subscriptions (provider_id, status='active')
 */
export async function fetchProStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // First get the provider_id for this user
    const { data: provider, error: providerError } = await supabase
      .from('pro_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (providerError || !provider) {
      // User is not a provider
      return false;
    }

    // Check if the provider has an active subscription
    const { data: subscription, error: subError } = await supabase
      .from('pro_subscriptions')
      .select('status')
      .eq('provider_id', provider.id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (subError) {
      console.error('Error fetching pro subscription:', subError);
      return false;
    }
    
    return subscription !== null;
  } catch (error) {
    console.error('Error in fetchProStatus:', error);
    return false;
  }
}

/**
 * Fetch all user role data (combines super_admin and pro checks)
 */
export async function fetchUserRoles(): Promise<UserRole[]> {
  const roles: UserRole[] = [];
  
  const [isSuperAdmin, isPro] = await Promise.all([
    fetchSuperAdminStatus(),
    fetchProStatus()
  ]);
  
  if (isSuperAdmin) {
    roles.push('super_admin');
  }
  
  if (isPro) {
    roles.push('pro');
  }
  
  return roles;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  switch (role) {
    case 'super_admin':
      return fetchSuperAdminStatus();
    case 'pro':
      return fetchProStatus();
    case 'user':
      const { data: { user } } = await supabase.auth.getUser();
      return user !== null;
    default:
      return false;
  }
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return fetchSuperAdminStatus();
}

/**
 * Check if user is a pro (has active subscription)
 */
export async function isPro(): Promise<boolean> {
  return fetchProStatus();
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
      // Pro access: either has pro role (active subscription) or is super_admin
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
  '/app/settings': 'public', // Settings accessible without login (theme, language, etc.)
  '/app/apps': 'public',
  
  // Pro-only routes (requires active Stripe subscription)
  '/app/pros/dashboard': 'pro',
  '/app/pros/messages': 'pro',
  '/app/pros/leads': 'pro',
  '/app/pros/settings': 'pro',
  '/app/pros/billing': 'pro',
  '/app/pros/register': 'authenticated', // Anyone authenticated can start registration
  
  // Super Admin routes (manual assignment only)
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
