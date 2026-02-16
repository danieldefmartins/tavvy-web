/**
 * eCard Hub Screen
 * Clean, simple entry point — shows existing cards or prompts to create one.
 * Single "+" FAB to create. Card type picker before template gallery.
 * Politician flow includes a country selector with search.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  IoSearch,
  IoChevronBack,
} from 'react-icons/io5';

const ACCENT = '#00C853';

/* ── Country list with flag emojis ── */
const COUNTRIES = [
  { code: 'BR', name: 'Brazil', nameLocal: 'Brasil', flag: '🇧🇷', featured: true, template: 'civic-card' },
  { code: 'US', name: 'United States', nameLocal: 'Estados Unidos', flag: '🇺🇸', featured: false, template: 'politician-generic' },
  { code: 'GB', name: 'United Kingdom', nameLocal: 'Reino Unido', flag: '🇬🇧', featured: false, template: 'politician-generic' },
  { code: 'CA', name: 'Canada', nameLocal: 'Canadá', flag: '🇨🇦', featured: false, template: 'politician-generic' },
  { code: 'MX', name: 'Mexico', nameLocal: 'México', flag: '🇲🇽', featured: false, template: 'politician-generic' },
  { code: 'AR', name: 'Argentina', nameLocal: 'Argentina', flag: '🇦🇷', featured: false, template: 'politician-generic' },
  { code: 'CO', name: 'Colombia', nameLocal: 'Colombia', flag: '🇨🇴', featured: false, template: 'politician-generic' },
  { code: 'CL', name: 'Chile', nameLocal: 'Chile', flag: '🇨🇱', featured: false, template: 'politician-generic' },
  { code: 'PE', name: 'Peru', nameLocal: 'Perú', flag: '🇵🇪', featured: false, template: 'politician-generic' },
  { code: 'PT', name: 'Portugal', nameLocal: 'Portugal', flag: '🇵🇹', featured: false, template: 'politician-generic' },
  { code: 'ES', name: 'Spain', nameLocal: 'España', flag: '🇪🇸', featured: false, template: 'politician-generic' },
  { code: 'FR', name: 'France', nameLocal: 'France', flag: '🇫🇷', featured: false, template: 'politician-generic' },
  { code: 'DE', name: 'Germany', nameLocal: 'Deutschland', flag: '🇩🇪', featured: false, template: 'politician-generic' },
  { code: 'IT', name: 'Italy', nameLocal: 'Italia', flag: '🇮🇹', featured: false, template: 'politician-generic' },
  { code: 'AU', name: 'Australia', nameLocal: 'Australia', flag: '🇦🇺', featured: false, template: 'politician-generic' },
  { code: 'JP', name: 'Japan', nameLocal: '日本', flag: '🇯🇵', featured: false, template: 'politician-generic' },
  { code: 'KR', name: 'South Korea', nameLocal: '대한민국', flag: '🇰🇷', featured: false, template: 'politician-generic' },
  { code: 'IN', name: 'India', nameLocal: 'भारत', flag: '🇮🇳', featured: false, template: 'politician-generic' },
  { code: 'NG', name: 'Nigeria', nameLocal: 'Nigeria', flag: '🇳🇬', featured: false, template: 'politician-generic' },
  { code: 'ZA', name: 'South Africa', nameLocal: 'South Africa', flag: '🇿🇦', featured: false, template: 'politician-generic' },
  { code: 'KE', name: 'Kenya', nameLocal: 'Kenya', flag: '🇰🇪', featured: false, template: 'politician-generic' },
  { code: 'EG', name: 'Egypt', nameLocal: 'مصر', flag: '🇪🇬', featured: false, template: 'politician-generic' },
  { code: 'IL', name: 'Israel', nameLocal: 'ישראל', flag: '🇮🇱', featured: false, template: 'politician-generic' },
  { code: 'PH', name: 'Philippines', nameLocal: 'Pilipinas', flag: '🇵🇭', featured: false, template: 'politician-generic' },
  { code: 'ID', name: 'Indonesia', nameLocal: 'Indonesia', flag: '🇮🇩', featured: false, template: 'politician-generic' },
  { code: 'PL', name: 'Poland', nameLocal: 'Polska', flag: '🇵🇱', featured: false, template: 'politician-generic' },
  { code: 'SE', name: 'Sweden', nameLocal: 'Sverige', flag: '🇸🇪', featured: false, template: 'politician-generic' },
  { code: 'UY', name: 'Uruguay', nameLocal: 'Uruguay', flag: '🇺🇾', featured: false, template: 'politician-generic' },
  { code: 'PY', name: 'Paraguay', nameLocal: 'Paraguay', flag: '🇵🇾', featured: false, template: 'politician-generic' },
  { code: 'EC', name: 'Ecuador', nameLocal: 'Ecuador', flag: '🇪🇨', featured: false, template: 'politician-generic' },
  { code: 'VE', name: 'Venezuela', nameLocal: 'Venezuela', flag: '🇻🇪', featured: false, template: 'politician-generic' },
  { code: 'BO', name: 'Bolivia', nameLocal: 'Bolivia', flag: '🇧🇴', featured: false, template: 'politician-generic' },
  { code: 'CR', name: 'Costa Rica', nameLocal: 'Costa Rica', flag: '🇨🇷', featured: false, template: 'politician-generic' },
  { code: 'PA', name: 'Panama', nameLocal: 'Panamá', flag: '🇵🇦', featured: false, template: 'politician-generic' },
  { code: 'DO', name: 'Dominican Republic', nameLocal: 'República Dominicana', flag: '🇩🇴', featured: false, template: 'politician-generic' },
  { code: 'GT', name: 'Guatemala', nameLocal: 'Guatemala', flag: '🇬🇹', featured: false, template: 'politician-generic' },
  { code: 'HN', name: 'Honduras', nameLocal: 'Honduras', flag: '🇭🇳', featured: false, template: 'politician-generic' },
  { code: 'SV', name: 'El Salvador', nameLocal: 'El Salvador', flag: '🇸🇻', featured: false, template: 'politician-generic' },
  { code: 'NI', name: 'Nicaragua', nameLocal: 'Nicaragua', flag: '🇳🇮', featured: false, template: 'politician-generic' },
  { code: 'CU', name: 'Cuba', nameLocal: 'Cuba', flag: '🇨🇺', featured: false, template: 'politician-generic' },
];

type ModalStep = 'closed' | 'type-picker' | 'country-picker';

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
  const [modalStep, setModalStep] = useState<ModalStep>('closed');
  const [countrySearch, setCountrySearch] = useState('');

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
    if (type === 'politician') {
      setModalStep('country-picker');
      setCountrySearch('');
      return;
    }
    setModalStep('closed');
    router.push(`/app/ecard/create?type=${type}`, undefined, { locale });
  };

  const handleSelectCountry = (country: typeof COUNTRIES[0]) => {
    setModalStep('closed');
    router.push(`/app/ecard/create?type=politician&country=${country.code}&template=${country.template}`, undefined, { locale });
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

  /* ── Filtered countries ── */
  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.nameLocal.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const featuredCountries = filteredCountries.filter(c => c.featured);
  const otherCountries = filteredCountries.filter(c => !c.featured);

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
                background: 'rgba(0,200,83,0.08)',
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
            onClick={() => setModalStep('type-picker')}
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

        {/* ══════════════════════════════════════════════════════════
            MODAL: Card Type Picker + Country Selector
           ══════════════════════════════════════════════════════════ */}
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

              {/* ── STEP 1: Card Type Picker ── */}
              {modalStep === 'type-picker' && (
                <div style={{ padding: '0 20px' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 4px 6px', letterSpacing: '-0.3px' }}>
                    Choose your card type
                  </h2>
                  <p style={{ fontSize: 14, color: textSecondary, margin: '0 4px 20px' }}>
                    Select the type that best fits your needs
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              )}

              {/* ── STEP 2: Country Selector (Politician only) ── */}
              {modalStep === 'country-picker' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {/* Header with back button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 12px', flexShrink: 0 }}>
                    <button
                      onClick={() => setModalStep('type-picker')}
                      style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}
                    >
                      <IoChevronBack size={22} color={textPrimary} />
                    </button>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: 0, letterSpacing: '-0.3px' }}>
                        Select your country
                      </h2>
                      <p style={{ fontSize: 13, color: textSecondary, margin: '2px 0 0' }}>
                        Choose where the politician operates
                      </p>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                      border: `1px solid ${border}`,
                    }}>
                      <IoSearch size={18} color={textSecondary} />
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        style={{
                          flex: 1, border: 'none', outline: 'none', background: 'transparent',
                          fontSize: 15, color: textPrimary,
                        }}
                        autoFocus
                      />
                      {countrySearch && (
                        <button
                          onClick={() => setCountrySearch('')}
                          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}
                        >
                          <IoClose size={16} color={textSecondary} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Country list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0 }}>
                    {/* Featured countries */}
                    {featuredCountries.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.5, padding: '8px 4px', marginBottom: 4 }}>
                          Featured
                        </div>
                        {featuredCountries.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => handleSelectCountry(country)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 14px', borderRadius: 14, width: '100%',
                              background: isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.06)',
                              border: `1.5px solid ${ACCENT}33`,
                              cursor: 'pointer', textAlign: 'left', marginBottom: 8,
                              transition: 'background 0.15s',
                            }}
                          >
                            <span style={{ fontSize: 32, lineHeight: 1 }}>{country.flag}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, display: 'block' }}>{country.name}</span>
                              <span style={{ fontSize: 12, color: textSecondary }}>{country.nameLocal !== country.name ? country.nameLocal : ''}</span>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
                              background: ACCENT, color: '#fff',
                            }}>
                              Civic Card
                            </span>
                            <IoChevronForward size={16} color={textSecondary} />
                          </button>
                        ))}
                      </>
                    )}

                    {/* Other countries */}
                    {otherCountries.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, padding: '12px 4px 8px' }}>
                          All Countries
                        </div>
                        {otherCountries.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => handleSelectCountry(country)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '12px 14px', borderRadius: 12, width: '100%',
                              background: 'transparent',
                              border: 'none', borderBottom: `1px solid ${border}`,
                              cursor: 'pointer', textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                          >
                            <span style={{ fontSize: 28, lineHeight: 1 }}>{country.flag}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 15, fontWeight: 500, color: textPrimary, display: 'block' }}>{country.name}</span>
                              {country.nameLocal !== country.name && (
                                <span style={{ fontSize: 12, color: textSecondary }}>{country.nameLocal}</span>
                              )}
                            </div>
                            <IoChevronForward size={16} color={textSecondary} />
                          </button>
                        ))}
                      </>
                    )}

                    {filteredCountries.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <p style={{ fontSize: 15, color: textSecondary }}>No countries found for &ldquo;{countrySearch}&rdquo;</p>
                      </div>
                    )}
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
