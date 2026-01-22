import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ProSubscription {
  id: string;
  provider_id: string;
  tier: string;
  status: string;
  price_per_year: number;
  start_date: string | null;
  end_date: string | null;
  cancelled_at: string | null;
  early_adopter_number: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface ProProvider {
  id: string;
  user_id: string;
  business_name: string;
  // Add other fields as needed
}

/**
 * Hook to manage Pro subscription state and actions
 * 
 * Provides:
 * - Current subscription status
 * - Provider profile
 * - Methods to initiate checkout
 * - Loading and error states
 */
export function useProSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<ProSubscription | null>(null);
  const [provider, setProvider] = useState<ProProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch provider and subscription data
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get provider profile
        const { data: providerData, error: providerError } = await supabase
          .from('pro_providers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (providerError && providerError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw providerError;
        }

        setProvider(providerData);

        // If provider exists, get subscription
        if (providerData) {
          const { data: subData, error: subError } = await supabase
            .from('pro_subscriptions')
            .select('*')
            .eq('provider_id', providerData.id)
            .single();

          if (subError && subError.code !== 'PGRST116') {
            throw subError;
          }

          setSubscription(subData);
        }
      } catch (err: any) {
        console.error('Error fetching pro subscription:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  /**
   * Initiate Stripe checkout for Pro subscription
   * Returns the Stripe checkout URL to redirect to
   */
  async function initiateCheckout(): Promise<string | null> {
    if (!session?.access_token) {
      setError('You must be logged in to subscribe');
      return null;
    }

    try {
      const response = await fetch('/api/pros/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Return the Stripe checkout URL
      // The frontend should redirect to: https://checkout.stripe.com/pay/{sessionId}
      return data.sessionId;
    } catch (err: any) {
      console.error('Error initiating checkout:', err);
      setError(err.message);
      return null;
    }
  }

  /**
   * Check if the user has an active Pro subscription
   */
  const isActivePro = subscription?.status === 'active';

  /**
   * Check if the user is in a trial period
   */
  const isTrialing = subscription?.status === 'trialing';

  /**
   * Check if the subscription is past due
   */
  const isPastDue = subscription?.status === 'past_due';

  /**
   * Check if the user has a provider profile (required before subscribing)
   */
  const hasProviderProfile = !!provider;

  return {
    subscription,
    provider,
    loading,
    error,
    isActivePro,
    isTrialing,
    isPastDue,
    hasProviderProfile,
    initiateCheckout,
  };
}
