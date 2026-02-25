/**
 * eCard Hub Screen — /app/ecard
 * Shows existing cards or prompts to create one.
 * FAB navigates to /app/ecard/new (creation wizard).
 * Card actions: Edit → /app/ecard/[cardId]/edit, Stats → /app/ecard/[cardId]/stats
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { getUserCards, deleteCard, duplicateCard, CardData } from '../../../lib/ecard';
import { useTranslation } from 'next-i18next';
import { useRoles } from '../../../hooks/useRoles';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  IoArrowBack,
  IoAdd,
  IoEye,
  IoHandLeft,
  IoChevronForward,
  IoTrash,
  IoClose,
  IoCopy,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoStarOutline,
  IoBarChartOutline,
} from 'react-icons/io5';

const ACCENT = '#00C853';

type ModalStep = 'closed' | 'card-limit';

/* ── Card limits per role ── */
const CARD_LIMITS = {
  free: 1,       // Free users: 1 card
  pro: 1,        // Pro users: 1 premium card per subscription
  super_admin: Infinity, // Super admins: unlimited
};

export default function ECardHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, isPro, loading: rolesLoading } = useRoles();

  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalCard, setDeleteModalCard] = useState<CardData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('closed');

  const fetchCards = useCallback(async () => {
    if (authLoading) return;
    if (!user) { setCards([]); setLoading(false); return; }
    try {
      const data = await getUserCards(user.id);
      setCards(data);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleEditCard = (card: CardData) => {
    router.push(`/app/ecard/${card.id}/edit`, undefined, { locale });
  };

  /* ── Card limit check ── */
  const getCardLimit = () => {
    if (isSuperAdmin) return CARD_LIMITS.super_admin;
    if (isPro) return CARD_LIMITS.pro;
    return CARD_LIMITS.free;
  };

  const canCreateCard = () => {
    if (isSuperAdmin) return true;
    const limit = getCardLimit();
    return cards.length < limit;
  };

  const handleFabClick = () => {
    if (canCreateCard()) {
      router.push('/app/ecard/new', undefined, { locale });
    } else {
      setModalStep('card-limit');
    }
  };

  const handleViewCard = (card: CardData) => {
    router.push(`/app/ecard/${card.id}/preview`, undefined, { locale });
  };

  const handleDeleteCard = async () => {
    if (!deleteModalCard) return;
    setDeleting(true);
    try {
      const success = await deleteCard(deleteModalCard.id);
      if (success) {
        setCards(prev => prev.filter(c => c.id !== deleteModalCard.id));
        setDeleteModalCard(null);
      } else {
        alert('Failed to delete card.');
      }
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Failed to delete card.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateCard = async (card: CardData) => {
    if (!user || duplicating) return;
    // Check card limit before duplicating
    if (!canCreateCard()) {
      setModalStep('card-limit');
      return;
    }
    setDuplicating(card.id);
    try {
      const newCard = await duplicateCard(card.id, user.id);
      if (newCard) {
        setCards(prev => [newCard, ...prev]);
        router.push(`/app/ecard/${newCard.id}/edit`, undefined, { locale });
      } else {
        alert('Failed to duplicate card.');
      }
    } catch (err) {
      console.error('Error duplicating card:', err);
      alert('Failed to duplicate card.');
    } finally {
      setDuplicating(null);
    }
  };

  const bg = isDark ? '#000' : '#FAFAFA';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#888888';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // ── Loading ──
  if (loading) {
    return (
      <>
        <Head><title>My eCards | TavvY</title></Head>
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
        <title>My eCards | TavvY</title>
        <meta name="description" content="Manage your digital business cards" />
      </Head>

      <AppLayout hideTabBar={false}>
        <div style={{ minHeight: '100vh', backgroundColor: bg, paddingBottom: 100 }}>

          {/* ── Header ── */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
          }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8 }}>
              <IoArrowBack size={22} color={textPrimary} />
            </button>
            <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: textPrimary, letterSpacing: '-0.3px' }}>My eCards</h1>
            <div style={{ width: 38 }} />
          </header>

          {/* ── Cards List ── */}
          {cards.length > 0 ? (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleEditCard(card)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: 14, borderRadius: 16, backgroundColor: cardBg,
                    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                    border: `1px solid ${border}`, cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                >
                  {/* Card Preview Thumbnail */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg, ${card.gradient_color_1 || '#667eea'}, ${card.gradient_color_2 || '#764ba2'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {card.profile_photo_url ? (
                      <img src={card.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                        {(card.full_name || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600, color: textPrimary,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {card.full_name || 'Untitled Card'}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: card.is_published ? 'rgba(0,200,83,0.12)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                        color: card.is_published ? ACCENT : textSecondary,
                        flexShrink: 0,
                      }}>
                        {card.is_published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    {card.title && (
                      <p style={{ fontSize: 13, color: textSecondary, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {card.title}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IoEye size={12} /> {card.view_count || 0}
                      </span>
                      <span style={{ fontSize: 12, color: textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IoHandLeft size={12} /> {card.tap_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {/* Stats button — prominent */}
                    <button
                      title="View Stats"
                      onClick={(e) => { e.stopPropagation(); router.push(`/app/ecard/${card.id}/stats`, undefined, { locale }); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', border: 'none', borderRadius: 8,
                        background: isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.08)',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: ACCENT,
                      }}
                    >
                      <IoBarChartOutline size={14} />
                      Stats
                    </button>
                    {/* Secondary actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        title="Duplicate"
                        onClick={(e) => { e.stopPropagation(); handleDuplicateCard(card); }}
                        disabled={duplicating === card.id}
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', borderRadius: 6, display: 'flex', opacity: duplicating === card.id ? 0.4 : 1 }}
                      >
                        <IoCopy size={14} color={textSecondary} />
                      </button>
                      <button
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); setDeleteModalCard(card); }}
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', borderRadius: 6, display: 'flex' }}
                      >
                        <IoTrash size={14} color="#EF4444" />
                      </button>
                      <IoChevronForward size={14} color={textSecondary} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Empty State ── */
            <button
              onClick={handleFabClick}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '80px 40px', textAlign: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                width: '100%',
              }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: 'rgba(0,200,83,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                transition: 'transform 0.2s, background 0.2s',
              }}>
                <IoAdd size={36} color={ACCENT} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 0 8px' }}>
                Create your first eCard
              </h2>
              <p style={{ fontSize: 14, color: textSecondary, margin: 0, lineHeight: 1.5, maxWidth: 260 }}>
                Tap here to get started with your digital card
              </p>
            </button>
          )}

          {/* ── FAB (Floating Action Button) ── */}
          <button
            onClick={handleFabClick}
            style={{
              position: 'fixed', bottom: 90, right: 24,
              width: 56, height: 56, borderRadius: 16,
              background: `linear-gradient(135deg, ${ACCENT}, #00A843)`,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,200,83,0.35)',
              zIndex: 100, transition: 'transform 0.2s',
            }}
          >
            <IoAdd size={28} color="#fff" />
          </button>
        </div>

        {/* ── Card Limit Modal ── */}
        {modalStep !== 'closed' && (
          <div
            onClick={() => setModalStep('closed')}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 9999, animation: 'fadeIn 0.15s ease',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 480,
                backgroundColor: cardBg, borderRadius: '24px 24px 0 0',
                padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
                animation: 'slideUp 0.25s ease',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.15)' : '#DDD', margin: '8px auto 16px', flexShrink: 0 }} />

              {/* ── CARD LIMIT REACHED ── */}
              {modalStep === 'card-limit' && (
                <div style={{ padding: '0 20px', textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 36,
                    background: isPro ? 'rgba(139,92,246,0.1)' : 'rgba(0,200,83,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '8px auto 20px',
                  }}>
                    {isPro ? (
                      <IoStarOutline size={36} color="#8B5CF6" />
                    ) : (
                      <IoLockClosedOutline size={36} color={ACCENT} />
                    )}
                  </div>

                  <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                    {isPro ? 'Additional Card' : 'Upgrade to Pro'}
                  </h2>
                  <p style={{ fontSize: 14, color: textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
                    {isPro
                      ? 'Your Pro subscription includes 1 premium card. To create additional cards, an extra fee applies per card.'
                      : 'Free accounts include 1 card. Upgrade to Pro to unlock premium templates, analytics, and more.'
                    }
                  </p>

                  {/* Current plan badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 12, marginBottom: 20,
                    background: isPro ? 'rgba(139,92,246,0.08)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7'),
                    border: `1px solid ${isPro ? 'rgba(139,92,246,0.2)' : border}`,
                  }}>
                    <IoShieldCheckmarkOutline size={16} color={isPro ? '#8B5CF6' : textSecondary} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isPro ? '#8B5CF6' : textSecondary }}>
                      {isPro ? 'Pro Plan' : 'Free Plan'} — {cards.length}/{isPro ? '1' : '1'} card{cards.length !== 1 ? 's' : ''} used
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {/* Primary CTA */}
                    <button
                      onClick={() => {
                        setModalStep('closed');
                        router.push(isPro ? '/app/ecard/purchase-card' : '/app/pros', undefined, { locale });
                      }}
                      style={{
                        width: '100%', padding: '14px 20px', border: 'none', borderRadius: 14,
                        fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        background: isPro
                          ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                          : `linear-gradient(135deg, ${ACCENT}, #00A843)`,
                        color: '#fff',
                        boxShadow: isPro
                          ? '0 4px 16px rgba(139,92,246,0.3)'
                          : '0 4px 16px rgba(0,200,83,0.3)',
                      }}
                    >
                      {isPro ? 'Purchase Additional Card' : 'Upgrade to Pro'}
                    </button>

                    {/* Secondary */}
                    <button
                      onClick={() => setModalStep('closed')}
                      style={{
                        width: '100%', padding: '12px 20px', border: 'none', borderRadius: 14,
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                        color: textSecondary,
                      }}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {deleteModalCard && (
          <div
            onClick={() => !deleting && setDeleteModalCard(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 360, borderRadius: 20,
                padding: '28px 24px 24px', backgroundColor: cardBg,
                position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <button
                onClick={() => !deleting && setDeleteModalCard(null)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8 }}
              >
                <IoClose size={20} color={textSecondary} />
              </button>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <IoTrash size={28} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', textAlign: 'center', color: textPrimary }}>Delete Card?</h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 24px', textAlign: 'center', color: textSecondary }}>
                This will permanently remove <strong>&ldquo;{deleteModalCard.full_name || 'Untitled Card'}&rdquo;</strong> and all its data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeleteModalCard(null)}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px 16px', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: isDark ? '#334155' : '#F1F5F9', color: textPrimary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px 16px', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: '#EF4444', color: '#fff',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>
      </AppLayout>
    </>
  );
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
