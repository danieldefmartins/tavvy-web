import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.12.0?target=deno"

/**
 * Stripe Webhook Handler for Pro Subscriptions
 * 
 * This webhook handles Stripe events to manage Pro subscription status.
 * Pro status is determined by having an active subscription in pro_subscriptions table.
 * 
 * Flow:
 * 1. User creates a Pro provider profile (pro_providers table)
 * 2. User initiates checkout with client_reference_id = user_id
 * 3. Stripe sends webhook on successful payment
 * 4. This function creates/updates pro_subscriptions with status = 'active'
 * 5. User now has Pro access (checked via is_active_pro() RLS function)
 * 
 * Security:
 * - Webhook signature verification ensures requests come from Stripe
 * - Service role key bypasses RLS for database updates
 * - No hardcoded admin emails or manual role assignment
 */

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  // @ts-ignore
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(err.message, { status: 400 });
  }

  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

/**
 * Handle checkout.session.completed event
 * Creates or updates the pro_subscription for the user
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!userId) {
    console.error("Missing client_reference_id (user_id) in checkout session");
    throw new Error("Missing user ID in checkout session");
  }

  console.log(`Checkout completed for user: ${userId}, subscription: ${subscriptionId}`);

  // Get the provider_id for this user
  const { data: provider, error: providerError } = await supabaseAdmin
    .from("pro_providers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (providerError || !provider) {
    console.error("Provider not found for user:", userId, providerError);
    throw new Error(`Provider not found for user: ${userId}`);
  }

  console.log(`Found provider: ${provider.id} for user: ${userId}`);

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get the next early adopter number
  const { data: countData } = await supabaseAdmin
    .from("pro_subscriptions")
    .select("early_adopter_number")
    .order("early_adopter_number", { ascending: false })
    .limit(1);
  
  const nextEarlyAdopterNumber = (countData?.[0]?.early_adopter_number || 0) + 1;

  // Check if subscription already exists for this provider
  const { data: existingSub } = await supabaseAdmin
    .from("pro_subscriptions")
    .select("id")
    .eq("provider_id", provider.id)
    .single();

  if (existingSub) {
    // Update existing subscription
    const { error: updateError } = await supabaseAdmin
      .from("pro_subscriptions")
      .update({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: "active",
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }
    console.log(`Updated existing subscription for provider: ${provider.id}`);
  } else {
    // Create new subscription
    const { error: insertError } = await supabaseAdmin
      .from("pro_subscriptions")
      .insert({
        provider_id: provider.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: "active",
        tier: "early_adopter",
        price_per_year: 99.00, // Default price, can be updated based on Stripe data
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        early_adopter_number: nextEarlyAdopterNumber,
      });

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      throw insertError;
    }
    console.log(`Created new subscription for provider: ${provider.id}, early adopter #${nextEarlyAdopterNumber}`);
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Subscription created: ${subscription.id}, status: ${subscription.status}`);
  
  // The subscription is usually created during checkout, so this is mostly for logging
  // The actual record is created in handleCheckoutCompleted
}

/**
 * Handle customer.subscription.updated event
 * Updates the subscription status when it changes (e.g., renewal, upgrade, downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const status = mapStripeStatus(subscription.status);

  console.log(`Subscription updated: ${subscriptionId}, new status: ${status}`);

  const { error } = await supabaseAdmin
    .from("pro_subscriptions")
    .update({
      status: status,
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription status:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 * Marks the subscription as cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  console.log(`Subscription deleted: ${subscriptionId}`);

  const { error } = await supabaseAdmin
    .from("pro_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error marking subscription as cancelled:", error);
    throw error;
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Ensures subscription remains active after successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId = invoice.subscription as string;
  console.log(`Payment succeeded for subscription: ${subscriptionId}`);

  const { error } = await supabaseAdmin
    .from("pro_subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after payment:", error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed event
 * Marks subscription as past_due when payment fails
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId = invoice.subscription as string;
  console.log(`Payment failed for subscription: ${subscriptionId}`);

  const { error } = await supabaseAdmin
    .from("pro_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after failed payment:", error);
    throw error;
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    "active": "active",
    "past_due": "past_due",
    "unpaid": "past_due",
    "canceled": "cancelled",
    "incomplete": "pending",
    "incomplete_expired": "cancelled",
    "trialing": "trialing",
    "paused": "paused",
  };
  return statusMap[stripeStatus] || stripeStatus;
}
