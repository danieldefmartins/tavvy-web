/**
 * EditorLayout — main editor shell with header, scrollable sections, and section navigation.
 * Replaces the 5-tab dashboard with vertically scrollable collapsible sections.
 */

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import EditorSection from './shared/EditorSection';
import SectionNavigator from './SectionNavigator';
import ProfileSection from './sections/ProfileSection';
import ContactSection from './sections/ContactSection';
import SocialSection from './sections/SocialSection';
import LinksSection from './sections/LinksSection';
import MediaSection from './sections/MediaSection';
import StyleSection from './sections/StyleSection';
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
  IoFlagOutline,
  IoRestaurantOutline,
  IoSettingsOutline,
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

  // Determine which conditional sections to show
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate = templateId.startsWith('pro-') || templateId === 'business-card' || templateId === 'cover-card';

  // Build section list for navigator
  const sections = useMemo(() => {
    const base = [
      { id: 'profile', label: 'Profile' },
      { id: 'contact', label: 'Contact' },
      { id: 'social', label: 'Social' },
      { id: 'links', label: 'Links' },
      { id: 'media', label: 'Media' },
      { id: 'style', label: 'Style' },
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
          {/* Save indicator */}
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
            }}
          >
            {!isDirty && lastSaved && <IoCheckmark size={14} />}
            {saveStatusText}
          </button>

          {/* Preview button */}
          {cardId && (
            <button
              onClick={() => router.push(`/app/ecard/${cardId}/preview`, undefined, { locale })}
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

        <EditorSection id="style" title="Style" icon={<IoColorPalette size={20} />} isDark={isDark} defaultOpen={false}>
          <StyleSection isDark={isDark} isPro={isPro} />
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
      </div>

      {/* Section navigator dots */}
      <SectionNavigator sections={sections} isDark={isDark} />
    </div>
  );
}
