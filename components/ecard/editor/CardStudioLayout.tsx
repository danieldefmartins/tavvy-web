/**
 * CardStudioLayout — Apple-style Card Studio editor for the web.
 *
 * Replaces the old accordion-based EditorLayout with a modern
 * bottom-sheet tab-based interface:
 *
 *   ┌─────────────────────────────┐
 *   │  Top bar (Back / Save)      │
 *   ├─────────────────────────────┤
 *   │                             │
 *   │   Live Card Preview         │
 *   │   (dark canvas)             │
 *   │                             │
 *   ├─────────────────────────────┤
 *   │  Bottom Sheet (inspector)   │
 *   │  ─ tab content panels ─     │
 *   ├─────────────────────────────┤
 *   │  Tab Bar (5 tabs)           │
 *   └─────────────────────────────┘
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import { publishCard, unpublishCard, THEMES } from '../../../lib/ecard';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';

// Existing section components (reused inside tab panels)
import LivePreviewCard from './LivePreviewCard';
import ProfileSection from './sections/ProfileSection';
import ContactSection from './sections/ContactSection';
import SocialSection from './sections/SocialSection';
import LinksSection from './sections/LinksSection';
import MediaSection from './sections/MediaSection';
import TemplateColorSection from './sections/TemplateColorSection';
import ImagesLayoutSection from './sections/ImagesLayoutSection';
import TypographySection from './sections/TypographySection';
import CivicSection from './sections/CivicSection';
import MobileBusinessSection from './sections/MobileBusinessSection';
import AdvancedSection from './sections/AdvancedSection';

import {
  IoArrowBack,
  IoEye,
  IoCheckmark,
  IoPersonCircle,
  IoCall,
  IoColorPalette,
  IoImages,
  IoSettingsOutline,
  IoQrCodeOutline,
  IoShareOutline,
  IoClose,
  IoCloudDoneOutline,
  IoLockClosedOutline,
  IoChevronDown,
  IoChevronUp,
} from 'react-icons/io5';

// ── Constants ────────────────────────────────────────────────
const AMBER = '#FF9F0A';
const AMBER_BG = 'rgba(255,159,10,0.12)';
const CANVAS_BG = '#1C1C1E';
const SHEET_BG = 'rgba(44,44,46,0.98)';
const TAB_BAR_BG = 'rgba(28,28,30,0.98)';
const ACCENT = '#00C853';

type TabId = 'profile' | 'contact' | 'style' | 'media' | 'more';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <IoPersonCircle size={20} /> },
  { id: 'contact', label: 'Contact', icon: <IoCall size={20} /> },
  { id: 'style', label: 'Style', icon: <IoColorPalette size={20} /> },
  { id: 'media', label: 'Media', icon: <IoImages size={20} /> },
  { id: 'more', label: 'More', icon: <IoSettingsOutline size={20} /> },
];

// ── Component ────────────────────────────────────────────────
export default function CardStudioLayout() {
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const { isPro } = useRoles();
  const { state } = useEditor();
  const { isSaving, isDirty, lastSaved, saveNow } = useAutoSave({
    userId: user?.id,
    isPro,
  });

  const card = state.card;
  const cardId = card.id;
  const templateId = card.template_id || 'basic';
  const cardUrl = `https://tavvy.com/${card.slug || 'preview'}`;

  // State
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [sheetHeight, setSheetHeight] = useState<'half' | 'full'>('half');
  const [showQR, setShowQR] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isPublished = !!card.is_published;

  // Conditional sections
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate = templateId.startsWith('pro-') || templateId === 'business-card' || templateId === 'cover-card';

  // Save animation
  const [saveFlash, setSaveFlash] = useState(false);
  const prevLastSaved = useRef<Date | null>(null);
  useEffect(() => {
    if (lastSaved && lastSaved !== prevLastSaved.current) {
      prevLastSaved.current = lastSaved;
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 500);
    }
  }, [lastSaved]);

  const saveStatusText = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Save'
    : lastSaved
    ? 'Saved'
    : 'Save';

  const hasPremiumFeatures = (): boolean => {
    const themeObj = THEMES.find((t: any) => t.id === card.theme);
    if (themeObj?.isPremium) return true;
    if (card.template_id && ['pro-', 'business-card', 'cover-card'].some(p => card.template_id!.startsWith(p))) return true;
    if (card.gallery_images && card.gallery_images.length > 0) return true;
    if (card.youtube_video_url) return true;
    if (card.pro_credentials) return true;
    if (card.form_block) return true;
    return false;
  };

  const handlePublish = async () => {
    if (!cardId) return;
    if (!isPro && hasPremiumFeatures()) {
      setShowPremiumModal(true);
      return;
    }
    if (isDirty) await saveNow();
    setPublishing(true);
    try {
      const success = await publishCard(cardId, card.slug || cardId);
      if (success) window.location.reload();
      else alert('Failed to publish card.');
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish card.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!cardId) return;
    if (!confirm('This will make your card invisible to others. Continue?')) return;
    setPublishing(true);
    try {
      const success = await unpublishCard(cardId);
      if (success) window.location.reload();
    } catch (error) {
      console.error('Unpublish error:', error);
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: card.card_name || card.full_name, url: cardUrl });
      } catch { /* User cancelled */ }
    } else {
      await navigator.clipboard.writeText(cardUrl);
    }
  };

  const handleTabPress = (tabId: TabId) => {
    if (activeTab === tabId) {
      setActiveTab(null); // Toggle off
    } else {
      setActiveTab(tabId);
      setSheetHeight('half');
    }
  };

  const toggleSheetHeight = () => {
    setSheetHeight(h => h === 'half' ? 'full' : 'half');
  };

  // ── Render tab panel content ───────────────────────────────
  const renderTabContent = () => {
    if (!activeTab) return null;

    switch (activeTab) {
      case 'profile':
        return (
          <div>
            <StudioPanelHeader title="Profile" />
            <ProfileSection isDark={true} isPro={isPro} />
          </div>
        );
      case 'contact':
        return (
          <div>
            <StudioPanelHeader title="Contact" />
            <ContactSection isDark={true} isPro={isPro} />
            <div style={{ marginTop: 8 }}>
              <SocialSection isDark={true} isPro={isPro} />
            </div>
            <div style={{ marginTop: 8 }}>
              <LinksSection isDark={true} isPro={isPro} />
            </div>
          </div>
        );
      case 'style':
        return (
          <div>
            <StudioPanelHeader title="Style" />
            <TemplateColorSection isDark={true} isPro={isPro} />
            <div style={{ marginTop: 8 }}>
              <TypographySection isDark={true} isPro={isPro} />
            </div>
          </div>
        );
      case 'media':
        return (
          <div>
            <StudioPanelHeader title="Media" />
            <MediaSection isDark={true} isPro={isPro} />
            <div style={{ marginTop: 8 }}>
              <ImagesLayoutSection isDark={true} isPro={isPro} />
            </div>
          </div>
        );
      case 'more':
        return (
          <div>
            <StudioPanelHeader title="More" />
            {isCivic && <CivicSection isDark={true} isPro={isPro} />}
            {isMobileBiz && <MobileBusinessSection isDark={true} isPro={isPro} />}
            {isProTemplate && <AdvancedSection isDark={true} isPro={isPro} />}
            {/* Publish / Unpublish */}
            {cardId && (
              <div style={{ padding: '20px 0' }}>
                {isPublished ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '14px 20px',
                      borderRadius: 14,
                      background: 'rgba(0,200,83,0.1)',
                      border: `1px solid ${ACCENT}33`,
                    }}>
                      <IoCloudDoneOutline size={18} color={ACCENT} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>Published</span>
                    </div>
                    <button
                      onClick={handleUnpublish}
                      disabled={publishing}
                      style={{
                        padding: '14px 20px',
                        borderRadius: 14,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#EF4444',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: publishing ? 0.5 : 1,
                      }}
                    >
                      Unpublish
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 14,
                      border: 'none',
                      background: ACCENT,
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: publishing ? 0.5 : 1,
                    }}
                  >
                    {publishing ? 'Publishing...' : 'Publish Card'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // ── Main render ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: CANVAS_BG,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: TAB_BAR_BG,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Left: Back */}
        <button
          onClick={() => router.push('/app/ecard', undefined, { locale })}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IoArrowBack size={20} color="#fff" />
        </button>

        {/* Center: Title + unsaved dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#fff',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {card.full_name || card.card_name || 'Edit Card'}
          </span>
          {isDirty && (
            <span style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: AMBER,
              display: 'inline-block',
            }} />
          )}
          {saveFlash && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: ACCENT,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <IoCheckmark size={14} /> Saved
            </span>
          )}
        </div>

        {/* Right: QR, Share, Preview, Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {cardId && (
            <button
              onClick={() => setShowQR(true)}
              title="QR Code"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoQrCodeOutline size={20} color="rgba(255,255,255,0.5)" />
            </button>
          )}
          {cardId && (
            <button
              onClick={handleShare}
              title="Share card"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoShareOutline size={20} color="rgba(255,255,255,0.5)" />
            </button>
          )}
          {cardId && (
            <button
              onClick={() => router.push(`/app/ecard/${cardId}/preview`, undefined, { locale })}
              title="Preview card"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoEye size={20} color="rgba(255,255,255,0.5)" />
            </button>
          )}
          <button
            onClick={saveNow}
            disabled={isSaving || !isDirty}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              background: isDirty ? AMBER : 'rgba(255,255,255,0.08)',
              color: isDirty ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: 15,
              fontWeight: 700,
              cursor: isDirty ? 'pointer' : 'default',
              opacity: isSaving ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {saveStatusText}
          </button>
        </div>
      </header>

      {/* ── Live Preview Canvas ─────────────────────────────── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: activeTab ? 'flex-start' : 'center',
        transition: 'all 0.3s ease',
        paddingBottom: activeTab ? (sheetHeight === 'full' ? '85vh' : '50vh') : 80,
      }}>
        <div style={{
          maxWidth: 420,
          width: '100%',
          transform: activeTab ? 'scale(0.85)' : 'scale(1)',
          transformOrigin: 'top center',
          transition: 'transform 0.3s ease',
        }}>
          <LivePreviewCard
            isDark={true}
            onExpandPreview={() => router.push(`/app/ecard/${cardId}/preview`, undefined, { locale })}
          />
        </div>
      </div>

      {/* ── Bottom Sheet (inspector) ────────────────────────── */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 56, // tab bar height
          left: 0,
          right: 0,
          maxHeight: activeTab ? (sheetHeight === 'full' ? '85vh' : '45vh') : 0,
          backgroundColor: SHEET_BG,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: activeTab ? '0 -4px 30px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Drag handle + expand/collapse */}
        {activeTab && (
          <div
            onClick={toggleSheetHeight}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px 6px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
            }} />
          </div>
        )}

        {/* Close button */}
        {activeTab && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 16px 4px',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setActiveTab(null)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                width: 28,
                height: 28,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IoClose size={16} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 20px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {renderTabContent()}
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: TAB_BAR_BG,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? AMBER : 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: AMBER,
                }} />
              )}
              <span style={{ display: 'flex' }}>{tab.icon}</span>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.3,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── QR Code Modal ───────────────────────────────────── */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            animation: 'studioFadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: 24,
              padding: 28,
              background: 'rgba(44,44,46,0.98)',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <button
              onClick={() => setShowQR(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                borderRadius: 8,
                display: 'flex',
              }}
            >
              <IoClose size={22} color="rgba(255,255,255,0.6)" />
            </button>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              QR Code
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
              Scan to view your card
            </p>
            <div style={{
              padding: 16,
              background: '#FFFFFF',
              borderRadius: 16,
              display: 'inline-block',
              marginBottom: 16,
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`}
                alt="QR Code"
                width={200}
                height={200}
                style={{ display: 'block' }}
              />
            </div>
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {cardUrl}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowQR(false);
                  handleShare();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: AMBER,
                  color: '#000',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <IoShareOutline size={18} />
                Share
              </button>
              <button
                onClick={() => {
                  setShowQR(false);
                  navigator.clipboard.writeText(cardUrl);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Premium Modal ───────────────────────────────────── */}
      {showPremiumModal && (
        <div
          onClick={() => setShowPremiumModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            animation: 'studioFadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 24,
              padding: 28,
              background: 'rgba(44,44,46,0.98)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowPremiumModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                borderRadius: 8,
                display: 'flex',
              }}
            >
              <IoClose size={22} color="rgba(255,255,255,0.6)" />
            </button>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: 'rgba(139,92,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <IoLockClosedOutline size={28} color="#8B5CF6" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              Premium Features Detected
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your card includes premium features. Upgrade to Tavvy Pro to publish this card.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowPremiumModal(false); router.push('/app/ecard/premium', undefined, { locale }); }}
                style={{
                  padding: '14px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowPremiumModal(false)}
                style={{
                  padding: '10px', background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes studioFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Helper: Panel header ─────────────────────────────────────
function StudioPanelHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 20,
      fontWeight: 700,
      color: '#fff',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {title}
    </div>
  );
}
