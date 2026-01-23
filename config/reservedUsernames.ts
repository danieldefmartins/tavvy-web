/**
 * Reserved usernames that cannot be used for eCard URLs
 * These are protected to prevent conflicts with app routes and future features
 */

export const RESERVED_USERNAMES = [
  // Core app routes
  'home',
  'login',
  'signup',
  'register',
  'logout',
  'auth',
  'api',
  'admin',
  'dashboard',
  
  // Existing features
  'pros',
  'atlas',
  'universe',
  'universes',
  'explore',
  'discover',
  'search',
  'places',
  'cities',
  'rides',
  'realtors',
  'wallet',
  'apps',
  'menu',
  'settings',
  'profile',
  'account',
  
  // eCard related
  'card',
  'cards',
  'ecard',
  'ecards',
  'c',
  'create',
  'edit',
  'preview',
  'templates',
  'themes',
  
  // Future features
  'shop',
  'store',
  'marketplace',
  'events',
  'tickets',
  'booking',
  'bookings',
  'jobs',
  'careers',
  'blog',
  'news',
  'help',
  'support',
  'contact',
  'about',
  'terms',
  'privacy',
  'legal',
  'faq',
  'pricing',
  'plans',
  'premium',
  'pro',
  'business',
  'enterprise',
  
  // Brand protection
  'tavvy',
  'tavvyapp',
  'tavvy-app',
  'official',
  'verified',
  'team',
  'staff',
  'moderator',
  'mod',
  
  // Common reserved
  'www',
  'mail',
  'email',
  'ftp',
  'cdn',
  'static',
  'assets',
  'images',
  'img',
  'files',
  'uploads',
  'download',
  'downloads',
  
  // Social/common usernames
  'me',
  'you',
  'user',
  'users',
  'guest',
  'anonymous',
  'null',
  'undefined',
  'test',
  'demo',
  'example',
  'sample',
  
  // Potentially offensive or misleading
  'admin',
  'administrator',
  'root',
  'system',
  'sysadmin',
  'webmaster',
  'postmaster',
  'hostmaster',
  'abuse',
  'security',
  'info',
  'sales',
  'marketing',
  'billing',
  'invoice',
  'payment',
  'payments',
];

/**
 * Check if a username is reserved
 */
export function isReservedUsername(username: string): boolean {
  const normalized = username.toLowerCase().trim();
  return RESERVED_USERNAMES.includes(normalized);
}

/**
 * Validate username format
 * - 3-30 characters
 * - Only letters, numbers, underscores, periods
 * - Cannot start or end with period/underscore
 * - Cannot have consecutive periods/underscores
 */
export function isValidUsername(username: string): { valid: boolean; error?: string } {
  const normalized = username.toLowerCase().trim();
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (normalized.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }
  
  if (!/^[a-z0-9._]+$/.test(normalized)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and periods' };
  }
  
  if (/^[._]|[._]$/.test(normalized)) {
    return { valid: false, error: 'Username cannot start or end with a period or underscore' };
  }
  
  if (/[._]{2,}/.test(normalized)) {
    return { valid: false, error: 'Username cannot have consecutive periods or underscores' };
  }
  
  if (isReservedUsername(normalized)) {
    return { valid: false, error: 'This username is not available' };
  }
  
  return { valid: true };
}
