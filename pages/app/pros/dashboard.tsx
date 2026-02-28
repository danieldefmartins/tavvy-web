/**
 * Pro Dashboard Screen
 * Full-featured dashboard matching the Tavvy Pros Portal
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
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import {
  FiArrowLeft,
  FiUser,
  FiSettings,
  FiCreditCard,
  FiStar,
  FiMessageSquare,
  FiTrendingUp,
  FiCalendar,
  FiExternalLink,
  FiEdit,
  FiMapPin,
  FiPhone,
  FiMail,
  FiShare2,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

/** Calculate profile completion percentage based on filled fields */
function calcProfileCompletion(provider: any): number {
  if (!provider) return 0;
  const fields = [
    { key: 'business_name', weight: 20 },
    { key: 'phone', weight: 15 },
    { key: 'email', weight: 10 },
    { key: 'location', weight: 15 },
    { key: 'description', weight: 15 },
    { key: 'category_slug', weight: 10 },
    { key: 'specialties', weight: 10, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { key: 'years_in_business', weight: 5 },
  ];
  let score = 0;
  for (const f of fields) {
    const val = provider[f.key];
    if (f.check) {
      if (f.check(val)) score += f.weight;
    } else if (val && String(val).trim()) {
      score += f.weight;
    }
  }
  return Math.min(100, score);
}

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
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Fetch full profile and leads data
  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      // Fetch full provider profile (with more fields than the hook provides)
      const { data: profile } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profile) {
        setFullProfile(profile);
        setProfileCompletion(calcProfileCompletion(profile));
      } else {
        // Try pros table as fallback
        const { data: prosProfile } = await supabase
          .from('pros')
          .select('*, category:service_categories(name)')
          .eq('user_id', user!.id)
          .single();
        if (prosProfile) {
          setFullProfile(prosProfile);
          setProfileCompletion(calcProfileCompletion(prosProfile));
        }
      }

      // Fetch recent leads if provider exists
      if (provider?.id) {
        const { data: leadsData } = await supabase
          .from('pro_leads')
          .select('*')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (leadsData) setLeads(leadsData);
      }
    }

    fetchDashboardData();
  }, [user, provider]);

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

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Computed stats
  const newLeads = leads.filter(l => l.status === 'new' || l.status === 'pending').length;
  const activeLeads = leads.filter(l => l.status === 'contacted' || l.status === 'in_progress').length;

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
            <Link href="/app/pros/settings" locale={locale} className="settings-link">
              <FiSettings size={20} color={theme.textSecondary} />
            </Link>
          </header>

          {/* Welcome */}
          <div className="welcome-section">
            <h2 style={{ color: theme.text }}>
              Welcome back{provider?.business_name ? `, ${provider.business_name}` : ''}!
            </h2>
            <p style={{ color: theme.textSecondary }}>Here's what's happening with your Pro account.</p>
          </div>

          {/* Profile Completion Alert */}
          {profileCompletion < 100 && (
            <div className="completion-card">
              <div className="completion-left">
                <div className="completion-icon">
                  <FiUser size={20} color="#EA580C" />
                </div>
                <div>
                  <p className="completion-title" style={{ color: theme.text }}>Complete your profile</p>
                  <p className="completion-subtitle" style={{ color: theme.textSecondary }}>
                    Profiles that are 100% complete get 3x more leads
                  </p>
                </div>
              </div>
              <div className="completion-right">
                <div className="completion-percent">
                  <span className="percent-value">{profileCompletion}%</span>
                  <span className="percent-label" style={{ color: theme.textSecondary }}>complete</span>
                </div>
                <Link href="/app/pros/profile" locale={locale} className="completion-btn">
                  <FiEdit size={14} />
                  Edit Profile
                </Link>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {profileCompletion < 100 && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${profileCompletion}%` }} />
            </div>
          )}

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card" style={{ backgroundColor: theme.surface }}>
              <div className="stat-header">
                <div>
                  <p className="stat-label" style={{ color: theme.textSecondary }}>Total Leads</p>
                  <p className="stat-value" style={{ color: theme.text }}>{leads.length}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#DBEAFE' }}>
                  <FiMessageSquare size={20} color="#2563EB" />
                </div>
              </div>
              {leads.length > 0 && (
                <p className="stat-trend positive">+{newLeads} new</p>
              )}
            </div>

            <div className="stat-card" style={{ backgroundColor: theme.surface }}>
              <div className="stat-header">
                <div>
                  <p className="stat-label" style={{ color: theme.textSecondary }}>Active Leads</p>
                  <p className="stat-value" style={{ color: theme.text }}>{activeLeads}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#FED7AA' }}>
                  <FiTrendingUp size={20} color="#EA580C" />
                </div>
              </div>
              <p className="stat-trend neutral" style={{ color: theme.textSecondary }}>Awaiting response</p>
            </div>

            <div className="stat-card" style={{ backgroundColor: theme.surface }}>
              <div className="stat-header">
                <div>
                  <p className="stat-label" style={{ color: theme.textSecondary }}>Profile Views</p>
                  <p className="stat-value" style={{ color: theme.text }}>--</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#D1FAE5' }}>
                  <FiEye size={20} color="#059669" />
                </div>
              </div>
              <p className="stat-trend neutral" style={{ color: theme.textSecondary }}>Coming soon</p>
            </div>

            <div className="stat-card" style={{ backgroundColor: theme.surface }}>
              <div className="stat-header">
                <div>
                  <p className="stat-label" style={{ color: theme.textSecondary }}>Rating</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <p className="stat-value" style={{ color: theme.text }}>--</p>
                    <FiStar size={16} color="#F59E0B" />
                  </div>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#FEF3C7' }}>
                  <FiStar size={20} color="#D97706" />
                </div>
              </div>
              <p className="stat-trend neutral" style={{ color: theme.textSecondary }}>0 reviews</p>
            </div>
          </div>

          {/* Main Content: 2-column layout on desktop */}
          <div className="main-grid">
            {/* Recent Leads */}
            <div className="leads-section">
              <div className="section-header">
                <div>
                  <h3 style={{ color: theme.text }}>Recent Leads</h3>
                  <p className="section-desc" style={{ color: theme.textSecondary }}>Customers looking for your services</p>
                </div>
              </div>
              <div className="leads-list" style={{ backgroundColor: theme.surface }}>
                {leads.length === 0 ? (
                  <div className="leads-empty">
                    <FiMessageSquare size={32} color={theme.textSecondary} />
                    <p style={{ color: theme.textSecondary }}>No leads yet</p>
                    <p className="leads-empty-sub" style={{ color: theme.textSecondary }}>
                      Leads will appear here when customers request your services
                    </p>
                  </div>
                ) : (
                  leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="lead-row">
                      <div className="lead-avatar">
                        <FiUser size={16} color="#2563EB" />
                      </div>
                      <div className="lead-info">
                        <p className="lead-name" style={{ color: theme.text }}>
                          {lead.customer_name || lead.name || 'Customer'}
                        </p>
                        <p className="lead-service" style={{ color: theme.textSecondary }}>
                          {lead.service_type || lead.service || 'Service Request'}
                        </p>
                      </div>
                      <div className="lead-meta">
                        {lead.location && (
                          <div className="lead-location" style={{ color: theme.textSecondary }}>
                            <FiMapPin size={12} />
                            <span>{lead.location}</span>
                          </div>
                        )}
                        <div className="lead-date-badge">
                          <span className="lead-date" style={{ color: theme.textSecondary }}>
                            {lead.created_at ? formatRelativeDate(lead.created_at) : ''}
                          </span>
                          <span className={`lead-badge ${lead.status === 'new' || lead.status === 'pending' ? 'badge-new' : lead.status === 'contacted' ? 'badge-contacted' : 'badge-default'}`}>
                            {lead.status || 'new'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar: Quick Actions + Subscription */}
            <div className="sidebar">
              {/* Quick Actions */}
              <div className="sidebar-card" style={{ backgroundColor: theme.surface }}>
                <h3 className="sidebar-title" style={{ color: theme.text }}>Quick Actions</h3>
                <div className="quick-actions">
                  <Link href="/app/ecard" locale={locale} className="action-btn action-btn-primary">
                    <FiCreditCard size={16} />
                    Digital Business Card
                  </Link>
                  <Link href="/app/pros/profile" locale={locale} className="action-btn action-btn-outline" style={{ borderColor: theme.border || '#E5E7EB', color: theme.text }}>
                    <FiEdit size={16} />
                    Edit Business Profile
                  </Link>
                  <Link href="/app/pros/profile" locale={locale} className="action-btn action-btn-outline" style={{ borderColor: theme.border || '#E5E7EB', color: theme.text }}>
                    <FiMapPin size={16} />
                    Update Service Areas
                  </Link>
                  <Link href="/app/pros/settings" locale={locale} className="action-btn action-btn-outline" style={{ borderColor: theme.border || '#E5E7EB', color: theme.text }}>
                    <FiCalendar size={16} />
                    Set Availability
                  </Link>
                  <a href="mailto:support@tavvy.com" className="action-btn action-btn-outline" style={{ borderColor: theme.border || '#E5E7EB', color: theme.text }}>
                    <FiMail size={16} />
                    Contact Support
                  </a>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="sidebar-card" style={{ backgroundColor: theme.surface }}>
                <h3 className="sidebar-title" style={{ color: theme.text }}>Subscription</h3>
                {subscription ? (
                  <div className="sub-info">
                    <div className="sub-badge" style={{
                      backgroundColor: isActivePro ? '#10B981' : isTrialing ? '#3B82F6' : isPastDue ? '#EF4444' : '#6B7280'
                    }}>
                      {isActivePro ? 'Active' : isTrialing ? 'Trial' : isPastDue ? 'Past Due' : 'Inactive'}
                    </div>
                    <p className="sub-price" style={{ color: theme.text }}>
                      ${subscription.price_per_year || 99}
                    </p>
                    <p className="sub-plan" style={{ color: theme.textSecondary }}>
                      {subscription.tier === 'early_adopter' ? 'Founding Pro Rate' : 'Annual Plan'}
                    </p>
                    {subscription.early_adopter_number && (
                      <div className="sub-early" style={{ color: theme.primary }}>
                        <FiStar size={14} />
                        <span>Early Adopter #{subscription.early_adopter_number}</span>
                      </div>
                    )}
                    <div className="sub-details">
                      <div className="sub-row">
                        <span style={{ color: theme.textSecondary }}>Next billing</span>
                        <span style={{ color: theme.text }}>{formatDate(subscription.end_date)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sub-info">
                    <p style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                      No active subscription
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
                      <p className="hint" style={{ color: theme.textSecondary }}>
                        Complete your <Link href="/app/pros/register" locale={locale} style={{ color: theme.primary }}>provider profile</Link> first
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
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

          .settings-link {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Welcome */
          .welcome-section {
            padding: 0 ${spacing.lg}px ${spacing.md}px;
          }
          .welcome-section h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          .welcome-section p {
            font-size: 14px;
            margin: 0;
          }

          /* Profile Completion */
          .completion-card {
            margin: 0 ${spacing.lg}px ${spacing.sm}px;
            padding: 16px;
            border-radius: ${borderRadius.lg}px;
            background: linear-gradient(135deg, #FFF7ED, #FFEDD5);
            border: 1px solid #FDBA74;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .completion-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 200px;
          }
          .completion-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #FED7AA;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .completion-title {
            font-weight: 600;
            font-size: 14px;
            margin: 0;
          }
          .completion-subtitle {
            font-size: 12px;
            margin: 2px 0 0;
          }
          .completion-right {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .completion-percent {
            text-align: right;
          }
          .percent-value {
            font-size: 28px;
            font-weight: 700;
            color: #EA580C;
            display: block;
            line-height: 1;
          }
          .percent-label {
            font-size: 11px;
          }
          .completion-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 8px;
            background: #EA580C;
            color: white;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            white-space: nowrap;
            transition: opacity 0.2s;
          }
          .completion-btn:hover {
            opacity: 0.9;
          }

          .progress-track {
            margin: 0 ${spacing.lg}px ${spacing.lg}px;
            height: 6px;
            border-radius: 3px;
            background: #FED7AA;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 3px;
            background: linear-gradient(90deg, #EA580C, #F97316);
            transition: width 0.5s ease;
          }

          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.md}px;
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.lg}px;
          }
          @media (min-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .stat-card {
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
          }
          .stat-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          .stat-label {
            font-size: 13px;
            margin: 0 0 4px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            line-height: 1.2;
          }
          .stat-icon {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .stat-trend {
            font-size: 12px;
            margin: 8px 0 0;
          }
          .stat-trend.positive {
            color: #059669;
          }
          .stat-trend.neutral {
            font-size: 12px;
          }

          /* Main Grid */
          .main-grid {
            padding: 0 ${spacing.lg}px;
            display: grid;
            grid-template-columns: 1fr;
            gap: ${spacing.lg}px;
          }
          @media (min-width: 768px) {
            .main-grid {
              grid-template-columns: 2fr 1fr;
            }
          }

          /* Leads Section */
          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: ${spacing.md}px;
          }
          .section-header h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          .section-desc {
            font-size: 13px;
            margin: 2px 0 0;
          }
          .leads-list {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          .leads-empty {
            padding: 40px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .leads-empty p {
            margin: 0;
            font-size: 15px;
          }
          .leads-empty-sub {
            font-size: 13px !important;
            max-width: 280px;
          }
          .lead-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(0,0,0,0.06);
          }
          .lead-row:last-child {
            border-bottom: none;
          }
          .lead-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #DBEAFE;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .lead-info {
            flex: 1;
            min-width: 0;
          }
          .lead-name {
            font-size: 14px;
            font-weight: 600;
            margin: 0;
          }
          .lead-service {
            font-size: 12px;
            margin: 2px 0 0;
          }
          .lead-meta {
            text-align: right;
            flex-shrink: 0;
          }
          .lead-location {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            justify-content: flex-end;
          }
          .lead-date-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
            justify-content: flex-end;
          }
          .lead-date {
            font-size: 11px;
          }
          .lead-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 100px;
            text-transform: uppercase;
          }
          .badge-new {
            background: #10B981;
            color: white;
          }
          .badge-contacted {
            background: #6B7280;
            color: white;
          }
          .badge-default {
            background: #E5E7EB;
            color: #374151;
          }

          /* Sidebar */
          .sidebar {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          .sidebar-card {
            border-radius: ${borderRadius.lg}px;
            padding: ${spacing.lg}px;
          }
          .sidebar-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 14px;
          }
          .quick-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .action-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            transition: opacity 0.2s;
            border: 1px solid transparent;
          }
          .action-btn:hover {
            opacity: 0.85;
          }
          .action-btn-primary {
            background: linear-gradient(135deg, #7C3AED, #4F46E5);
            color: white;
            font-weight: 600;
          }
          .action-btn-outline {
            background: transparent;
            border: 1px solid;
          }

          /* Subscription */
          .sub-info {
            text-align: center;
            padding: 8px 0;
          }
          .sub-badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .sub-price {
            font-size: 32px;
            font-weight: 700;
            margin: 4px 0 0;
          }
          .sub-plan {
            font-size: 13px;
            margin: 2px 0 0;
          }
          .sub-early {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 500;
            margin-top: 8px;
          }
          .sub-details {
            margin-top: 12px;
            border-top: 1px solid rgba(0,0,0,0.06);
            padding-top: 12px;
          }
          .sub-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
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
            margin-top: 8px;
            text-align: center;
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
