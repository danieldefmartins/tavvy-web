/**
 * eCard Premium Upsell Screen
 * Subscription flow for eCard Pro features
 * Ported from tavvy-mobile/screens/ecard/ECardPremiumUpsellScreen.tsx
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { 
  IoClose,
  IoColorPalette,
  IoLink,
  IoBarChart,
  IoVideocam,
  IoBrush,
  IoShieldCheckmark,
  IoCheckmark,
  IoStar,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';
const BG_DARK = '#000000';

const FEATURES = [
  {
    icon: IoColorPalette,
    title: 'Premium Themes',
    description: 'Access 20+ stunning premium themes',
  },
  {
    icon: IoLink,
    title: 'Unlimited Links',
    description: 'Add as many links as you want',
  },
  {
    icon: IoBarChart,
    title: 'Advanced Analytics',
    description: 'Track views, clicks, and engagement',
  },
  {
    icon: IoVideocam,
    title: 'Video Backgrounds',
    description: 'Make your card stand out with video',
  },
  {
    icon: IoBrush,
    title: 'Custom Fonts',
    description: 'Choose from 50+ premium fonts',
  },
  {
    icon: IoShieldCheckmark,
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
];

const PLANS = {
  monthly: {
    price: 4.99,
    period: 'month',
    savings: null,
  },
  yearly: {
    price: 39.99,
    period: 'year',
    savings: '33%',
    monthlyEquivalent: 3.33,
  },
};

export default function ECardPremiumScreen() {
  const router = useRouter();
  const { feature, themeName } = router.query;
  const { theme, isDark } = useThemeContext();
  const { user, refreshProfile } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/app/login');
      return;
    }

    setIsLoading(true);

    try {
      // Call the Edge Function to create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke('ecard-stripe-create-checkout', {
        body: { plan_type: selectedPlan === 'yearly' ? 'annual' : 'monthly' },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!user) {
      router.push('/app/login');
      return;
    }

    setIsRestoring(true);

    try {
      // Check if user has an active subscription in the database
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (subscription) {
        // User has an active subscription, update their profile
        await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('user_id', user.id);

        // Refresh the auth context
        if (refreshProfile) {
          await refreshProfile();
        }

        alert('Your Pro subscription has been restored successfully!');
        router.back();
      } else {
        alert('We couldn\'t find an active subscription for your account. If you believe this is an error, please contact support.');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      alert('Failed to restore purchases. Please try again or contact support.');
    } finally {
      setIsRestoring(false);
    }
  };

  const selectedPlanData = PLANS[selectedPlan];

  return (
    <>
      <Head>
        <title>Upgrade to Pro | TavvY eCard</title>
        <meta name="description" content="Unlock premium features for your digital business card" />
      </Head>

      <AppLayout hideTabBar>
        <div className="premium-screen">
          {/* Close Button */}
          <button className="close-btn" onClick={() => router.back()}>
            <IoClose size={28} color="#fff" />
          </button>

          {/* Header */}
          <div className="header">
            <div className="crown-container">
              <IoStar size={32} color="#FFD700" />
            </div>
            <h1>Upgrade to Pro</h1>
            <p>Unlock the full potential of your digital business card</p>
          </div>

          {/* Feature Context */}
          {feature && (
            <div className="feature-context">
              <span>You're trying to access: </span>
              <strong>{feature}</strong>
            </div>
          )}

          {/* Features Grid */}
          <div className="features-grid">
            {FEATURES.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="feature-item">
                  <div className="feature-icon">
                    <IconComponent size={24} color={ACCENT_GREEN} />
                  </div>
                  <div className="feature-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan Selection */}
          <div className="plans-section">
            <h2>Choose Your Plan</h2>
            
            <div className="plans-container">
              {/* Yearly Plan */}
              <button
                className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('yearly')}
              >
                {PLANS.yearly.savings && (
                  <div className="savings-badge">Save {PLANS.yearly.savings}</div>
                )}
                <div className="plan-header">
                  <span className="plan-name">Yearly</span>
                  {selectedPlan === 'yearly' && (
                    <div className="check-icon">
                      <IoCheckmark size={16} color="#fff" />
                    </div>
                  )}
                </div>
                <div className="plan-price">
                  <span className="price">${PLANS.yearly.price}</span>
                  <span className="period">/{PLANS.yearly.period}</span>
                </div>
                <p className="plan-detail">
                  Just ${PLANS.yearly.monthlyEquivalent?.toFixed(2)}/month
                </p>
              </button>

              {/* Monthly Plan */}
              <button
                className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="plan-header">
                  <span className="plan-name">Monthly</span>
                  {selectedPlan === 'monthly' && (
                    <div className="check-icon">
                      <IoCheckmark size={16} color="#fff" />
                    </div>
                  )}
                </div>
                <div className="plan-price">
                  <span className="price">${PLANS.monthly.price}</span>
                  <span className="period">/{PLANS.monthly.period}</span>
                </div>
                <p className="plan-detail">
                  Billed monthly
                </p>
              </button>
            </div>
          </div>

          {/* Subscribe Button */}
          <div className="actions">
            <button 
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>

            <button 
              className="restore-btn"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </button>

            <p className="terms">
              By subscribing, you agree to our{' '}
              <a href="/terms" target="_blank">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </p>
          </div>
        </div>

        <style jsx>{`
          .premium-screen {
            min-height: 100vh;
            background: linear-gradient(180deg, #1A1A1A 0%, #333333 100%);
            padding: 20px;
            padding-top: max(20px, env(safe-area-inset-top));
            padding-bottom: max(40px, env(safe-area-inset-bottom));
          }

          .close-btn {
            position: absolute;
            top: max(16px, env(safe-area-inset-top));
            right: 16px;
            background: rgba(255,255,255,0.1);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
          }

          /* Header */
          .header {
            text-align: center;
            padding: 40px 0 32px;
          }

          .crown-container {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
          }

          .header h1 {
            color: #fff;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .header p {
            color: rgba(255,255,255,0.7);
            font-size: 16px;
            margin: 0;
          }

          /* Feature Context */
          .feature-context {
            background: rgba(255,255,255,0.1);
            padding: 12px 16px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 24px;
            color: rgba(255,255,255,0.8);
            font-size: 14px;
          }

          .feature-context strong {
            color: ${ACCENT_GREEN};
          }

          /* Features Grid */
          .features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }

          @media (max-width: 480px) {
            .features-grid {
              grid-template-columns: 1fr;
            }
          }

          .feature-item {
            display: flex;
            gap: 12px;
            padding: 16px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
          }

          .feature-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(0, 200, 83, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .feature-content h3 {
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
          }

          .feature-content p {
            color: rgba(255,255,255,0.6);
            font-size: 12px;
            margin: 0;
            line-height: 1.4;
          }

          /* Plans Section */
          .plans-section {
            margin-bottom: 24px;
          }

          .plans-section h2 {
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px;
            text-align: center;
          }

          .plans-container {
            display: flex;
            gap: 12px;
          }

          .plan-card {
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 2px solid transparent;
            border-radius: 16px;
            padding: 20px 16px;
            cursor: pointer;
            position: relative;
            text-align: left;
            transition: all 0.2s;
          }

          .plan-card.selected {
            border-color: ${ACCENT_GREEN};
            background: rgba(0, 200, 83, 0.1);
          }

          .savings-badge {
            position: absolute;
            top: -10px;
            right: 12px;
            background: linear-gradient(90deg, #FFD700, #FFA500);
            color: #000;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 10px;
          }

          .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .plan-name {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            font-weight: 500;
          }

          .check-icon {
            width: 24px;
            height: 24px;
            border-radius: 12px;
            background: ${ACCENT_GREEN};
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .plan-price {
            margin-bottom: 4px;
          }

          .price {
            color: #fff;
            font-size: 28px;
            font-weight: 700;
          }

          .period {
            color: rgba(255,255,255,0.5);
            font-size: 14px;
          }

          .plan-detail {
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            margin: 0;
          }

          /* Actions */
          .actions {
            text-align: center;
          }

          .subscribe-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(90deg, ${ACCENT_GREEN}, #00A843);
            border: none;
            border-radius: 14px;
            color: #fff;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 12px;
            transition: transform 0.2s;
          }

          .subscribe-btn:hover:not(:disabled) {
            transform: scale(1.02);
          }

          .subscribe-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .restore-btn {
            background: none;
            border: none;
            color: rgba(255,255,255,0.6);
            font-size: 14px;
            cursor: pointer;
            padding: 8px 16px;
            margin-bottom: 16px;
          }

          .restore-btn:hover {
            color: #fff;
          }

          .terms {
            color: rgba(255,255,255,0.4);
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
          }

          .terms a {
            color: rgba(255,255,255,0.6);
            text-decoration: underline;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
