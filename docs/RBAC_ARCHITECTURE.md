# Role-Based Access Control (RBAC) Architecture

## Overview

This document describes the RBAC implementation for the TavvY Web App, aligned with the security audit requirements.

## Role Hierarchy

| Role | Description | Source of Truth | Assignment Method |
|------|-------------|-----------------|-------------------|
| **Regular User** | Basic authenticated user | Just authenticated | Automatic on signup |
| **Pro User** | Service provider with active subscription | `pro_subscriptions.status = 'active'` | Stripe webhook |
| **Super Admin** | Full system access | `user_roles.role = 'super_admin'` | Manual SQL only |

## Key Principles

1. **No hardcoded admin emails** - Admin access is determined by database roles only
2. **Pro status from Stripe** - Pro access is tied to actual payment, not manual assignment
3. **RLS is the real lock** - UI access control is convenience; database enforces security
4. **Client never grants privileges** - All role assignments happen server-side

## Database Schema

### user_roles (for super_admin only)

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = 'super_admin'),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);
```

### pro_subscriptions (for Pro status)

```sql
-- Already exists, key columns:
-- provider_id: FK to pro_providers.id
-- status: 'active', 'cancelled', 'past_due', 'trialing'
-- stripe_subscription_id: Links to Stripe
```

### pro_providers (links user to provider)

```sql
-- Already exists, key columns:
-- id: Primary key
-- user_id: FK to auth.users.id
```

## RLS Helper Functions

```sql
-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- Check if current user has active Pro subscription
CREATE OR REPLACE FUNCTION public.is_active_pro()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_id uuid;
BEGIN
  SELECT id INTO provider_id 
  FROM public.pro_providers 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF provider_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.pro_subscriptions 
    WHERE provider_id = provider_id AND status = 'active'
  );
END;
$$;
```

## Access Levels

| Level | Description | Check |
|-------|-------------|-------|
| `public` | No login required | Always true |
| `authenticated` | Login required | `auth.uid() IS NOT NULL` |
| `pro` | Pro subscription required | `is_active_pro() OR is_super_admin()` |
| `super_admin` | Super admin only | `is_super_admin()` |

## Route Configuration

### Public Routes (no login required)
- `/app` - Home
- `/app/explore` - Universes discovery
- `/app/atlas` - Travel guides
- `/app/pros` - Pros marketplace (browse)
- `/app/cities` - Cities
- `/place/[id]` - Place details
- `/app/login`, `/app/signup` - Auth pages

### Authenticated Routes (login required)
- `/app/profile` - User profile
- `/app/saved` - Saved places
- `/app/account` - Account settings
- `/app/settings` - App settings
- `/app/apps` - Apps dashboard

### Pro Routes (active subscription required)
- `/app/pros/dashboard` - Pro dashboard
- `/app/pros/messages` - Pro messages
- `/app/pros/leads` - Pro leads
- `/app/pros/settings` - Pro settings
- `/app/pros/billing` - Pro billing

### Super Admin Routes (manual assignment only)
- `/app/admin/*` - All admin routes

## Web App Implementation

### roleService.ts

```typescript
// Fetches Pro status from pro_subscriptions (not user_roles)
export async function fetchProStatus(): Promise<boolean> {
  // 1. Get provider_id for current user
  // 2. Check if provider has active subscription
  return subscription !== null;
}

// Fetches super_admin status from user_roles
export async function fetchSuperAdminStatus(): Promise<boolean> {
  // Check user_roles for super_admin role
  return data !== null;
}
```

### useRoles Hook

```typescript
const { roles, isSuperAdmin, isPro, isAuthenticated, loading } = useRoles();
```

### AppLayout Component

```tsx
<AppLayout requiredAccess="authenticated">
  {/* Protected content */}
</AppLayout>
```

## Creating Super Admins

Super admins can only be created via direct SQL:

```sql
-- Add super admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'admin@example.com';

-- Remove super admin
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
AND role = 'super_admin';
```

## Pro Activation Flow

1. User signs up and creates a Pro profile
2. User goes to checkout and pays via Stripe
3. Stripe sends `checkout.session.completed` webhook
4. Supabase Edge Function creates/updates `pro_subscriptions` with `status = 'active'`
5. User now has Pro access (checked via `is_active_pro()`)

## Security Audit Compliance

| Audit Item | Status | Implementation |
|------------|--------|----------------|
| No hardcoded admin emails | ✅ | Roles from database only |
| Pro tied to payment | ✅ | Stripe webhook updates pro_subscriptions |
| RLS enforced | ✅ | Helper functions for RLS policies |
| No client-side privilege escalation | ✅ | All role changes server-side |
