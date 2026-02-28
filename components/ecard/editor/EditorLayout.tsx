/**
 * EditorLayout — main editor shell with header, live preview, scrollable sections,
 * and section navigation.
 * Matches the mobile EditorLayout: sticky header with save animation, QR, share,
 * live preview card, and 3 split style sections.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import { publishCard, unpublishCard, THEMES, FREE_LINK_LIMIT } from '../../../lib/ecard';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import EditorSection from './shared/EditorSection';
import SectionNavigator from './SectionNavigator';
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
  IoShareSocial,
  IoLink,
  IoImages,
  IoColorPalette,
  IoText,
  IoImageOutline,
  IoFlagOutline,
  IoRestaurantOutline,
  IoSettingsOutline,
  IoQrCodeOutline,
  IoShareOutline,
  IoClose,
  IoRocketOutline,
  IoCloudDoneOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';

const ACCENT = '#00C853';

export default function EditorLayout() {
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

  // QR modal
  const [showQR, setShowQR] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const isPublished = !!card.is_published;

  /** Check if this card uses premium features */
  const hasPremiumFeatures = (): boolean => {
    const themeObj = THEMES.find(t => t.id === card.theme);
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
    // Save any pending changes first
    if (isDirty) await saveNow();
    setPublishing(true);
    try {
      const success = await publishCard(cardId, card.slug || cardId);
      if (success) {
        // Force reload card data
        window.location.reload();
      } else {
        alert('Failed to publish card.');
      }
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
      if (success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Unpublish error:', error);
    } finally {
      setPublishing(false);
    }
  };

  // Determine which conditional sections to show
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate = templateId.startsWith('pro-') || templateId === 'business-card' || templateId === 'cover-card';

  // Build section list for navigator (matches mobile)
  const sections = useMemo(() => {
    const base = [
      { id: 'profile', label: 'Profile' },
      { id: 'contact', label: 'Contact' },
      { id: 'social', label: 'Social' },
      { id: 'links', label: 'Links' },
      { id: 'media', label: 'Media' },
      { id: 'template-colors', label: 'Template' },
      { id: 'images-layout', label: 'Images' },
      { id: 'typography', label: 'Fonts' },
    ];
    if (isCivic) base.push({ id: 'civic', label: 'Civic' });
    if (isMobileBiz) base.push({ id: 'mobile-business', label: 'Menu' });
    if (isProTemplate) base.push({ id: 'advanced', label: 'Advanced' });
    return base;
  }, [isCivic, isMobileBiz, isProTemplate]);

  const bg = isDark ? '#000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Save status text
  const saveStatusText = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Save'
    : lastSaved
    ? 'Saved'
    : 'Save';

  // Save animation
  const [saveFlash, setSaveFlash] = useState(false);
  const [saveScale, setSaveScale] = useState(1);
  const prevLastSaved = useRef<Date | null>(null);

  useEffect(() => {
    if (lastSaved && lastSaved !== prevLastSaved.current) {
      prevLastSaved.current = lastSaved;
      setSaveScale(0.85);
      setSaveFlash(true);
      requestAnimationFrame(() => {
        setTimeout(() => setSaveScale(1), 50);
        setTimeout(() => setSaveFlash(false), 500);
      });
    }
  }, [lastSaved]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: card.card_name || card.full_name, url: cardUrl });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(cardUrl);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        backgroundColor: headerBg,
        borderBottom: `1px solid ${border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => router.push('/app/ecard', undefined, { locale })}
          style={{
            background: 'none', border: 'none', padding: 8,
            cursor: 'pointer', borderRadius: 8, display: 'flex',
          }}
        >
          <IoArrowBack size={22} color={textPrimary} />
        </button>

        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <h1 style={{
            fontSize: 16, fontWeight: 600, color: textPrimary, margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {card.card_name || card.full_name || 'Edit Card'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Save button with animation */}
          <button
            onClick={saveNow}
            disabled={isSaving || !isDirty}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDirty ? 'pointer' : 'default',
              background: isDirty
                ? ACCENT
                : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
              color: isDirty ? '#fff' : (lastSaved ? ACCENT : textSecondary),
              transition: 'all 0.2s',
              transform: `scale(${saveScale})`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Green flash overlay */}
            <span style={{
              position: 'absolute',
              inset: 0,
              background: ACCENT,
              borderRadius: 8,
              opacity: saveFlash ? 0.3 : 0,
              transition: 'opacity 0.4s',
              pointerEvents: 'none',
            }} />
            {!isDirty && lastSaved && <IoCheckmark size={14} />}
            {saveStatusText}
          </button>

          {/* QR Code */}
          {cardId && (
            <button
              onClick={() => setShowQR(true)}
              title="QR Code"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoQrCodeOutline size={20} color={textSecondary} />
            </button>
          )}

          {/* Share */}
          {cardId && (
            <button
              onClick={handleShare}
              title="Share card"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoShareOutline size={20} color={textSecondary} />
            </button>
          )}

          {/* Preview button */}
          {cardId && (
            <button
              onClick={() => router.push(`/app/ecard/${cardId}/preview`, undefined, { locale })}
              title="Preview card"
              style={{
                background: 'none', border: 'none', padding: 8,
                cursor: 'pointer', borderRadius: 8, display: 'flex',
              }}
            >
              <IoEye size={20} color={textSecondary} />
            </button>
          )}
        </div>
      </header>

      {/* Scrollable sections */}
      <div id="editor-scroll-container" style={{ paddingBottom: 100 }}>
        {/* Live Preview Card */}
        <div style={{ padding: '16px 20px 0' }}>
          <LivePreviewCard
            isDark={isDark}
            onExpandPreview={() => router.push(`/app/ecard/${cardId}/preview`, undefined, { locale })}
          />
        </div>

        <EditorSection id="profile" title="Profile" icon={<IoPersonCircle size={20} />} isDark={isDark}>
          <ProfileSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="contact" title="Contact" icon={<IoCall size={20} />} isDark={isDark}>
          <ContactSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="social" title="Social" icon={<IoShareSocial size={20} />} isDark={isDark}>
          <SocialSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="links" title="Links" icon={<IoLink size={20} />} isDark={isDark}>
          <LinksSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="media" title="Media" icon={<IoImages size={20} />} isDark={isDark} defaultOpen={false}>
          <MediaSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="template-colors" title="Template & Colors" icon={<IoColorPalette size={20} />} isDark={isDark} defaultOpen={true}>
          <TemplateColorSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="images-layout" title="Images & Layout" icon={<IoImageOutline size={20} />} isDark={isDark} defaultOpen={false}>
          <ImagesLayoutSection isDark={isDark} isPro={isPro} />
        </EditorSection>

        <EditorSection id="typography" title="Typography & Buttons" icon={<IoText size={20} />} isDark={isDark} defaultOpen={false}>
          <TypographySection isDark={isDark} isPro={isPro} />
        </EditorSection>

        {isCivic && (
          <EditorSection id="civic" title="Civic" icon={<IoFlagOutline size={20} />} isDark={isDark}>
            <CivicSection isDark={isDark} isPro={isPro} />
          </EditorSection>
        )}

        {isMobileBiz && (
          <EditorSection id="mobile-business" title="Menu & Business" icon={<IoRestaurantOutline size={20} />} isDark={isDark}>
            <MobileBusinessSection isDark={isDark} isPro={isPro} />
          </EditorSection>
        )}

        {isProTemplate && (
          <EditorSection id="advanced" title="Advanced" icon={<IoSettingsOutline size={20} />} isDark={isDark} defaultOpen={false}>
            <AdvancedSection isDark={isDark} isPro={isPro} />
          </EditorSection>
        )}
        {/* Publish / Unpublish Button */}
        {cardId && (
          <div style={{ padding: '24px 20px 8px' }}>
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
                  background: isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.08)',
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
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    background: 'transparent',
                    color: isDark ? '#94A3B8' : '#6B7280',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Unpublish
                </button>
              </div>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing || isSaving}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '16px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background: `linear-gradient(135deg, ${ACCENT}, #00A843)`,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  opacity: publishing || isSaving ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(0,200,83,0.3)',
                  transition: 'transform 0.2s, opacity 0.2s',
                }}
              >
                <IoRocketOutline size={20} />
                {publishing ? 'Publishing...' : 'Publish Card'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section navigator dots */}
      <SectionNavigator sections={sections} isDark={isDark} />

      {/* Premium Modal */}
      {showPremiumModal && (
        <div
          onClick={() => setShowPremiumModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20, animation: 'editorFadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 380, borderRadius: 24, padding: 28,
              background: isDark ? '#1E293B' : '#FFFFFF', textAlign: 'center',
              position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <button
              onClick={() => setShowPremiumModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex' }}
            >
              <IoClose size={22} color={isDark ? '#94A3B8' : '#666'} />
            </button>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <IoLockClosedOutline size={28} color="#8B5CF6" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#fff' : '#333', margin: '0 0 8px' }}>Premium Features Detected</h3>
            <p style={{ fontSize: 14, color: isDark ? '#94A3B8' : '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your card includes premium features. Upgrade to Tavvy Pro to publish this card, or remove premium features to use the free version.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowPremiumModal(false); router.push('/app/ecard/premium', undefined, { locale }); }}
                style={{ padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowPremiumModal(false)}
                style={{ padding: '10px', background: 'none', border: 'none', color: isDark ? '#64748B' : '#9CA3AF', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            animation: 'editorFadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: 24,
              padding: 28,
              background: isDark ? '#1E293B' : '#FFFFFF',
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
              <IoClose size={22} color={isDark ? '#94A3B8' : '#666'} />
            </button>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: '0 0 4px' }}>
              QR Code
            </h3>
            <p style={{ fontSize: 14, color: textSecondary, margin: '0 0 24px' }}>
              Scan to view your card
            </p>

            <div style={{
              padding: 16,
              background: '#FFFFFF',
              borderRadius: 16,
              display: 'inline-block',
              marginBottom: 16,
            }}>
              {/* QR code rendered as SVG via inline generation */}
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
              color: textSecondary,
              margin: '0 0 20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {cardUrl}
            </p>

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
                background: ACCENT,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <IoShareOutline size={18} />
              Share
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes editorFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
