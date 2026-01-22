# Stripe Webhook Integration for Pro Subscriptions

## Overview

This document describes the Stripe webhook integration required to automatically activate Pro status when a user pays for a subscription.

## Architecture

```
User pays on Stripe → Stripe sends webhook → Supabase Edge Function → Updates pro_subscriptions table → User has Pro access
```

## Source of Truth

| Role | Source | Mechanism |
|------|--------|-----------|
| Regular User | Just authenticated | Automatic on signup |
| Pro User | `pro_subscriptions.status = 'active'` | Stripe webhook |
| Super Admin | `user_roles.role = 'super_admin'` | Manual SQL only |

## Database Tables

### pro_subscriptions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| provider_id | uuid | FK to pro_providers.id |
| tier | text | Subscription tier (e.g., 'basic', 'premium') |
| status | text | **'active'**, 'cancelled', 'past_due', 'trialing' |
| price_per_year | numeric | Annual price |
| start_date | timestamp | Subscription start |
| end_date | timestamp | Subscription end |
| cancelled_at | timestamp | When cancelled |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Stripe subscription ID |
| created_at | timestamp | Record created |
| updated_at | timestamp | Record updated |

### pro_providers

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users.id |
| business_name | text | Business name |
| ... | ... | Other provider details |

## Stripe Webhook Events to Handle

### 1. `checkout.session.completed`
When a user completes checkout for a new subscription.

```javascript
// Supabase Edge Function pseudo-code
async function handleCheckoutCompleted(event) {
  const session = event.data.object;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  
  // Get or create pro_provider for this user
  // Create pro_subscription with status = 'active'
}
```

### 2. `customer.subscription.updated`
When subscription status changes (renewal, upgrade, downgrade).

```javascript
async function handleSubscriptionUpdated(event) {
  const subscription = event.data.object;
  const status = subscription.status; // 'active', 'past_due', 'cancelled', etc.
  
  // Update pro_subscriptions.status
}
```

### 3. `customer.subscription.deleted`
When subscription is cancelled.

```javascript
async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  
  // Update pro_subscriptions.status = 'cancelled'
  // Set cancelled_at = now()
}
```

### 4. `invoice.payment_succeeded`
When a recurring payment succeeds.

```javascript
async function handlePaymentSucceeded(event) {
  const invoice = event.data.object;
  
  // Ensure subscription is active
  // Update end_date if needed
}
```

### 5. `invoice.payment_failed`
When a payment fails.

```javascript
async function handlePaymentFailed(event) {
  const invoice = event.data.object;
  
  // Update pro_subscriptions.status = 'past_due'
  // Optionally send notification
}
```

## Supabase Edge Function Template

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object)
      break
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // 1. Get user email from session
  const email = session.customer_email
  
  // 2. Find user by email
  const { data: user } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()
  
  if (!user) return
  
  // 3. Get or create pro_provider
  let { data: provider } = await supabase
    .from('pro_providers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (!provider) {
    const { data: newProvider } = await supabase
      .from('pro_providers')
      .insert({ user_id: user.id, business_name: 'New Pro' })
      .select('id')
      .single()
    provider = newProvider
  }
  
  // 4. Create or update pro_subscription
  await supabase
    .from('pro_subscriptions')
    .upsert({
      provider_id: provider.id,
      tier: 'basic',
      status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      start_date: new Date().toISOString(),
    }, {
      onConflict: 'provider_id'
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabase
    .from('pro_subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('pro_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await supabase
      .from('pro_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await supabase
      .from('pro_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}
```

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe dashboard |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for bypassing RLS) |

## Stripe Dashboard Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## RLS Helper Functions

The following PostgreSQL functions are available for RLS policies:

```sql
-- Check if current user has active Pro subscription
SELECT public.is_active_pro();

-- Check if current user is a super admin
SELECT public.is_super_admin();
```

## Security Notes

1. **Never grant Pro or Admin privileges from the client app**
2. **Roles/entitlements come from:**
   - Stripe webhook (Pro)
   - Manual/admin controlled role assignment (super_admin)
3. **RLS is the real lock. UI is just convenience.**
4. **The webhook uses service role key to bypass RLS**

## Testing

1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

## Deployment Checklist

- [ ] Deploy Supabase Edge Function
- [ ] Set environment variables in Supabase
- [ ] Configure Stripe webhook endpoint
- [ ] Test with Stripe test mode
- [ ] Switch to live mode when ready
