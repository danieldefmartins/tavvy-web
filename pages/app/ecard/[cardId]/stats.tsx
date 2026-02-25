/**
 * eCard Stats Page — /app/ecard/[cardId]/stats
 * Analytics + Inbox, separated from the editor.
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRoles } from '../../../../hooks/useRoles';
import AppLayout from '../../../../components/AppLayout';
import { getCardById, getCardLinks, CardData, LinkItem } from '../../../../lib/ecard';
import StatsOverview from '../../../../components/ecard/analytics/StatsOverview';
import LinkPerformance from '../../../../components/ecard/analytics/LinkPerformance';
import ProBanner from '../../../../components/ecard/analytics/ProBanner';
import GeoAnalyticsDashboard from '../../../../components/GeoAnalyticsDashboard';
import ECardInbox from '../../../../components/ECardInbox';
import { IoArrowBack, IoCreate, IoBarChart, IoMail } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ACCENT = '#00C853';

type StatsTab = 'analytics' | 'inbox';

export default function ECardStatsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { cardId: routeCardId } = router.query;
  const { isDark } = useThemeContext();
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useRoles();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTab, setActiveTab] = useState<StatsTab>('analytics');

  const cardId = typeof routeCardId === 'string' ? routeCardId : null;

  useEffect(() => {
    if (!router.isReady || authLoading || !cardId) return;
    if (!user) { router.replace('/auth/login'); return; }

    Promise.all([getCardById(cardId), getCardLinks(cardId)])
      .then(([card, cardLinks]) => {
        setCardData(card);
        setLinks(cardLinks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router.isReady, cardId, user, authLoading]);

  const bg = isDark ? '#000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const isCivic = cardData?.template_id?.startsWith('civic-') || cardData?.template_id === 'politician-generic';

  if (loading) {
    return (
      <>
        <Head><title>Card Stats | TavvY</title></Head>
        <AppLayout>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${border}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Card Stats | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div style={{ minHeight: '100vh', backgroundColor: bg }}>
          {/* Header */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))',
            backgroundColor: headerBg,
            borderBottom: `1px solid ${border}`,
            backdropFilter: 'blur(12px)',
          }}>
            <button
              onClick={() => router.push('/app/ecard', undefined, { locale })}
              style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex' }}
            >
              <IoArrowBack size={22} color={textPrimary} />
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, margin: 0 }}>
              Card Stats
            </h1>
            {cardId && (
              <button
                onClick={() => router.push(`/app/ecard/${cardId}/edit`, undefined, { locale })}
                style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex' }}
              >
                <IoCreate size={20} color={textSecondary} />
              </button>
            )}
          </header>

          {/* Tab Toggle */}
          <div style={{
            display: 'flex', gap: 0, margin: '16px 20px', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${border}`, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          }}>
            {(['analytics', 'inbox'] as StatsTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 16px', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  backgroundColor: activeTab === tab ? ACCENT : 'transparent',
                  color: activeTab === tab ? '#fff' : textSecondary,
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'analytics' ? <IoBarChart size={16} /> : <IoMail size={16} />}
                {tab === 'analytics' ? 'Analytics' : 'Inbox'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '0 20px', paddingBottom: 100 }}>
            {activeTab === 'analytics' && (
              <>
                <StatsOverview
                  viewCount={cardData?.view_count || 0}
                  tapCount={cardData?.tap_count || 0}
                  isDark={isDark}
                />

                {!isPro && <ProBanner isDark={isDark} />}

                {/* Link Performance */}
                <div style={{ marginTop: 4 }}>
                  <h3 style={{ color: textPrimary, fontSize: 17, fontWeight: 600, marginBottom: 12 }}>
                    Link Performance
                  </h3>
                  <LinkPerformance links={links} isDark={isDark} />
                </div>

                {/* Geo Analytics for civic cards */}
                {isCivic && cardId && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ color: textPrimary, fontSize: 17, fontWeight: 600, marginBottom: 12 }}>
                      Geo Intelligence
                    </h3>
                    <GeoAnalyticsDashboard cardId={cardId} isDark={isDark} />
                  </div>
                )}
              </>
            )}

            {activeTab === 'inbox' && cardId && (
              <ECardInbox cardId={cardId} isDark={isDark} />
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
