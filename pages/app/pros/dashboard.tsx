/**
 * Pro Dashboard Screen
 * Dashboard for Pro users to manage their profile and subscription
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import { useProSubscription } from '../../../hooks/useProSubscription';
import AppLayout from '../../../components/AppLayout';
import { spacing, borderRadius } from '../../../constants/Colors';
import { 
  FiArrowLeft, 
  FiUser, 
  FiSettings, 
  FiCreditCard, 
  FiStar, 
  FiMessageSquare,
  FiBarChart2,
  FiCalendar,
  FiExternalLink
} from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Stripe publishable key - should be in env
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function ProDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const { user, session } = useAuth();
  const { isPro, loading: rolesLoading } = useRoles();
  const { 
    subscription, 
    provider, 
    loading: subLoading, 
    isActivePro, 
    isTrialing,
    isPastDue,
    hasProviderProfile,
    initiateCheckout 
  } = useProSubscription();

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Redirect if not a Pro user
  useEffect(() => {
    if (!rolesLoading && !subLoading && !isPro && !isActivePro) {
      router.push('/app/pros', undefined, { locale });
    }
  }, [rolesLoading, subLoading, isPro, isActivePro, router]);

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const sessionId = await initiateCheckout();
      if (sessionId) {
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (rolesLoading || subLoading) {
    return (
      <AppLayout accessLevel="pro">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: theme.background 
        }}>
          <p style={{ color: theme.textSecondary }}>Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Pro Dashboard | TavvY</title>
        <meta name="description" content="Manage your TavvY Pro account" />
      </Head>

      <AppLayout accessLevel="pro">
        <div className="dashboard-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="dashboard-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Pro Dashboard</h1>
          </header>

          {/* Subscription Status Card */}
          <div className="status-card" style={{ backgroundColor: theme.surface }}>
            <div className="status-header">
              <div className="status-badge" style={{ 
                backgroundColor: isActivePro ? '#10B981' : isTrialing ? '#3B82F6' : isPastDue ? '#EF4444' : '#6B7280'
              }}>
                {isActivePro ? 'Active' : isTrialing ? 'Trial' : isPastDue ? 'Past Due' : 'Inactive'}
              </div>
              {subscription?.early_adopter_number && (
                <div className="early-adopter" style={{ color: theme.primary }}>
                  <FiStar size={16} />
                  <span>Early Adopter #{subscription.early_adopter_number}</span>
                </div>
              )}
            </div>

            <h2 style={{ color: theme.text }}>
              {provider?.business_name || 'Your Pro Account'}
            </h2>

            {subscription ? (
              <div className="subscription-details">
                <div className="detail-row">
                  <span style={{ color: theme.textSecondary }}>Plan</span>
                  <span style={{ color: theme.text }}>{subscription.tier === 'early_adopter' ? 'Early Adopter' : subscription.tier}</span>
                </div>
                <div className="detail-row">
                  <span style={{ color: theme.textSecondary }}>Price</span>
                  <span style={{ color: theme.text }}>${subscription.price_per_year}/year</span>
                </div>
                <div className="detail-row">
                  <span style={{ color: theme.textSecondary }}>Next billing</span>
                  <span style={{ color: theme.text }}>{formatDate(subscription.end_date)}</span>
                </div>
              </div>
            ) : (
              <div className="no-subscription">
                <p style={{ color: theme.textSecondary }}>
                  You don't have an active subscription yet.
                </p>
                <button
                  className="subscribe-button"
                  onClick={handleSubscribe}
                  disabled={checkoutLoading || !hasProviderProfile}
                  style={{ backgroundColor: theme.primary }}
                >
                  {checkoutLoading ? 'Loading...' : 'Subscribe Now - $99/year'}
                </button>
                {!hasProviderProfile && (
                  <p className="hint" style={{ color: theme.textTertiary }}>
                    Complete your <Link href="/app/pros/register" locale={locale} style={{ color: theme.primary }}>provider profile</Link> first
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {isActivePro && (
            <div className="stats-grid">
              <div className="stat-card" style={{ backgroundColor: theme.surface }}>
                <FiBarChart2 size={24} color={theme.primary} />
                <div className="stat-value" style={{ color: theme.text }}>0</div>
                <div className="stat-label" style={{ color: theme.textSecondary }}>Profile Views</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: theme.surface }}>
                <FiMessageSquare size={24} color={theme.primary} />
                <div className="stat-value" style={{ color: theme.text }}>0</div>
                <div className="stat-label" style={{ color: theme.textSecondary }}>Messages</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: theme.surface }}>
                <FiStar size={24} color={theme.primary} />
                <div className="stat-value" style={{ color: theme.text }}>0</div>
                <div className="stat-label" style={{ color: theme.textSecondary }}>Reviews</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: theme.surface }}>
                <FiCalendar size={24} color={theme.primary} />
                <div className="stat-value" style={{ color: theme.text }}>0</div>
                <div className="stat-label" style={{ color: theme.textSecondary }}>Bookings</div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="menu-section">
            <Link href="/app/pros/profile" locale={locale} className="menu-item" style={{ backgroundColor: theme.surface }}>
              <FiUser size={20} color={theme.primary} />
              <span style={{ color: theme.text }}>Edit Profile</span>
              <FiExternalLink size={16} color={theme.textTertiary} />
            </Link>

            <Link href="/app/pros/messages" locale={locale} className="menu-item" style={{ backgroundColor: theme.surface }}>
              <FiMessageSquare size={20} color={theme.primary} />
              <span style={{ color: theme.text }}>Messages</span>
              <FiExternalLink size={16} color={theme.textTertiary} />
            </Link>

            <Link href="/app/pros/settings" locale={locale} className="menu-item" style={{ backgroundColor: theme.surface }}>
              <FiSettings size={20} color={theme.primary} />
              <span style={{ color: theme.text }}>Settings</span>
              <FiExternalLink size={16} color={theme.textTertiary} />
            </Link>

            {subscription && (
              <a 
                href="https://billing.stripe.com/p/login/test_xxx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="menu-item" 
                style={{ backgroundColor: theme.surface }}
              >
                <FiCreditCard size={20} color={theme.primary} />
                <span style={{ color: theme.text }}>Manage Billing</span>
                <FiExternalLink size={16} color={theme.textTertiary} />
              </a>
            )}
          </div>
        </div>

        <style jsx>{`
          .dashboard-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .dashboard-header {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .dashboard-header h1 {
            flex: 1;
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .status-card {
            margin: 0 ${spacing.lg}px ${spacing.lg}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .status-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: ${spacing.md}px;
          }
          
          .status-badge {
            padding: 4px 12px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
          }
          
          .early-adopter {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .status-card h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .subscription-details {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }
          
          .no-subscription {
            text-align: center;
            padding: ${spacing.md}px 0;
          }
          
          .no-subscription p {
            margin: 0 0 ${spacing.md}px;
            font-size: 14px;
          }
          
          .subscribe-button {
            width: 100%;
            padding: 14px;
            border-radius: ${borderRadius.md}px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          
          .subscribe-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .hint {
            font-size: 12px;
            margin-top: ${spacing.sm}px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.md}px;
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .stat-card {
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.md}px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin: ${spacing.sm}px 0 4px;
          }
          
          .stat-label {
            font-size: 12px;
          }
          
          .menu-section {
            padding: 0 ${spacing.lg}px;
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .menu-item {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px ${spacing.lg}px;
            border-radius: ${borderRadius.md}px;
            text-decoration: none;
            transition: opacity 0.2s;
          }
          
          .menu-item:hover {
            opacity: 0.8;
          }
          
          .menu-item span {
            flex: 1;
            font-size: 16px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export async function getServerSideProps({ locale, res }: { locale: string; res: any }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
