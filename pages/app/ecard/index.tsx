/**
 * eCard Hub Screen
 * Clean, simple entry point — shows existing cards or prompts to create one.
 * Single "+" FAB to create. Card type picker before template gallery.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { getUserCards, deleteCard, duplicateCard, CardData } from '../../../lib/ecard';
import { useTranslation } from 'next-i18next';
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
  IoBusinessOutline,
  IoPerson,
  IoFlagOutline,
} from 'react-icons/io5';

const ACCENT = '#00C853';

export default function ECardHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const { user, loading: authLoading } = useAuth();

  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalCard, setDeleteModalCard] = useState<CardData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

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
    router.push(`/app/ecard/dashboard?cardId=${card.id}`, undefined, { locale });
  };

  const handleCreateWithType = (type: string) => {
    setShowTypePicker(false);
    router.push(`/app/ecard/create?type=${type}`, undefined, { locale });
  };

  const handleViewCard = (card: CardData) => {
    router.push(`/app/ecard/preview?cardId=${card.id}`, undefined, { locale });
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
    setDuplicating(card.id);
    try {
      const newCard = await duplicateCard(card.id, user.id);
      if (newCard) {
        setCards(prev => [newCard, ...prev]);
        router.push(`/app/ecard/dashboard?cardId=${newCard.id}`, undefined, { locale });
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button
                      title="Duplicate"
                      onClick={(e) => { e.stopPropagation(); handleDuplicateCard(card); }}
                      disabled={duplicating === card.id}
                      style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 6, display: 'flex', opacity: duplicating === card.id ? 0.4 : 1 }}
                    >
                      <IoCopy size={16} color={textSecondary} />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); setDeleteModalCard(card); }}
                      style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 6, display: 'flex' }}
                    >
                      <IoTrash size={16} color="#EF4444" />
                    </button>
                    <IoChevronForward size={16} color={textSecondary} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Empty State ── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '80px 40px', textAlign: 'center',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <IoAdd size={36} color={ACCENT} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 0 8px' }}>
                Create your first eCard
              </h2>
              <p style={{ fontSize: 14, color: textSecondary, margin: 0, lineHeight: 1.5, maxWidth: 260 }}>
                Tap the + button below to get started with your digital card
              </p>
            </div>
          )}

          {/* ── FAB (Floating Action Button) ── */}
          <button
            onClick={() => setShowTypePicker(true)}
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

        {/* ── Card Type Picker Modal ── */}
        {showTypePicker && (
          <div
            onClick={() => setShowTypePicker(false)}
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
              }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.15)' : '#DDD', margin: '8px auto 20px' }} />

              <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 24px 6px', letterSpacing: '-0.3px' }}>
                Choose your card type
              </h2>
              <p style={{ fontSize: 14, color: textSecondary, margin: '0 24px 20px' }}>
                Select the type that best fits your needs
              </p>

              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Business */}
                <button
                  onClick={() => handleCreateWithType('business')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 18px', borderRadius: 16,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7',
                    border: `1px solid ${border}`, cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IoBusinessOutline size={24} color="#fff" />
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: textPrimary, display: 'block' }}>Business</span>
                    <span style={{ fontSize: 13, color: textSecondary }}>For your company, store, or service</span>
                  </div>
                  <IoChevronForward size={18} color={textSecondary} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </button>

                {/* Personal */}
                <button
                  onClick={() => handleCreateWithType('personal')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 18px', borderRadius: 16,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7',
                    border: `1px solid ${border}`, cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IoPerson size={24} color="#fff" />
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: textPrimary, display: 'block' }}>Personal</span>
                    <span style={{ fontSize: 13, color: textSecondary }}>Your personal brand & link page</span>
                  </div>
                  <IoChevronForward size={18} color={textSecondary} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </button>

                {/* Politician / Civic */}
                <button
                  onClick={() => handleCreateWithType('politician')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 18px', borderRadius: 16,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7',
                    border: `1px solid ${border}`, cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #00C853, #00A843)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IoFlagOutline size={24} color="#fff" />
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: textPrimary, display: 'block' }}>Politician</span>
                    <span style={{ fontSize: 13, color: textSecondary }}>For public servants & candidates</span>
                  </div>
                  <IoChevronForward size={18} color={textSecondary} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </button>
              </div>
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
