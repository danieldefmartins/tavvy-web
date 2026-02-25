/**
 * eCard Interactive Preview — /app/ecard/[cardId]/preview
 * Shows the actual public card with a floating quick-edit toolbar.
 * Users can toggle sections, change colors, and see live updates.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import AppLayout from '../../../../components/AppLayout';
import {
  getCardById,
  updateCard,
  getCardLinks,
  CardData,
  LinkItem,
  getCardUrl,
} from '../../../../lib/ecard';
import ECardIframePreview, { ECardIframePreviewHandle } from '../../../../components/ecard/ECardIframePreview';
import StyledQRCode, { QR_STYLE_PRESETS, QRStyleConfig } from '../../../../components/ecard/StyledQRCode';
import {
  IoArrowBack,
  IoShare,
  IoQrCode,
  IoCopy,
  IoCheckmark,
  IoClose,
  IoDownload,
  IoCreate,
  IoColorPalette,
  IoEye,
  IoEyeOff,
  IoChevronDown,
  IoChevronUp,
  IoRefresh,
  IoSave,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';

export default function ECardPreviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { cardId: routeCardId } = router.query;
  const { isDark } = useThemeContext();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [cardLinks, setCardLinks] = useState<LinkItem[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStyle, setQrStyle] = useState<Partial<QRStyleConfig>>({});
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const iframePreviewRef = useRef<ECardIframePreviewHandle>(null);
  const [copied, setCopied] = useState(false);

  const cardId = typeof routeCardId === 'string' ? routeCardId : null;

  // Quick editor state
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarTab, setToolbarTab] = useState<'visibility' | 'colors'>('visibility');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Editable fields (local state for live editing)
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showSocialIcons, setShowSocialIcons] = useState(true);
  const [gradientColor1, setGradientColor1] = useState('#1E90FF');
  const [gradientColor2, setGradientColor2] = useState('#00BFFF');

  const bgColor = isDark ? '#000000' : '#FAFAFA';

  // Load card data
  useEffect(() => {
    if (!router.isReady || !cardId) {
      if (router.isReady) setLoading(false);
      return;
    }

    Promise.all([getCardById(cardId), getCardLinks(cardId)])
      .then(([card, links]) => {
        if (card) {
          setCardData(card);
          setCardLinks(links || []);
          setShowContactInfo((card as any).show_contact_info !== false);
          setShowSocialIcons((card as any).show_social_icons !== false);
          setGradientColor1((card as any).gradient_color_1 || '#1E90FF');
          setGradientColor2((card as any).gradient_color_2 || '#00BFFF');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router.isReady, cardId]);

  // Save changes to database and refresh preview
  const saveChanges = useCallback(async () => {
    if (!cardId || !hasChanges) return;
    setSaving(true);
    try {
      await updateCard(cardId, {
        show_contact_info: showContactInfo,
        show_social_icons: showSocialIcons,
        gradient_color_1: gradientColor1,
        gradient_color_2: gradientColor2,
      } as any);
      setCardData(prev => prev ? {
        ...prev,
        show_contact_info: showContactInfo,
        show_social_icons: showSocialIcons,
        gradient_color_1: gradientColor1,
        gradient_color_2: gradientColor2,
      } as any : prev);
      setHasChanges(false);
      setTimeout(() => iframePreviewRef.current?.reload(), 500);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  }, [cardId, hasChanges, showContactInfo, showSocialIcons, gradientColor1, gradientColor2]);

  // Auto-save after 1.5s delay
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!hasChanges) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveChanges(), 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [hasChanges, saveChanges]);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setHasChanges(true);
  };

  const handleColorChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const copyCardUrl = () => {
    if (!cardData?.slug) return;
    const url = getCardUrl(cardData.slug);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCard = async () => {
    if (!cardData?.slug) return;
    const url = getCardUrl(cardData.slug);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.full_name}'s Card`,
          text: `Check out ${cardData.full_name}'s digital business card`,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyCardUrl();
    }
  };

  const refreshPreview = async () => {
    if (!cardId) return;
    try {
      const [card, links] = await Promise.all([getCardById(cardId), getCardLinks(cardId)]);
      if (card) { setCardData(card); setCardLinks(links || []); }
      iframePreviewRef.current?.reload();
    } catch (error) {
      console.error('Error refreshing preview:', error);
    }
  };

  const isDraft = cardData ? !cardData.is_published : false;
  const isOwner = user && cardData && cardData.user_id === user.id;

  const previewCard: CardData | null = cardData ? {
    ...cardData,
    gradient_color_1: gradientColor1,
    gradient_color_2: gradientColor2,
    show_contact_info: showContactInfo,
    show_social_icons: showSocialIcons,
  } as any : null;

  return (
    <>
      <Head>
        <title>{cardData ? `${cardData.full_name}'s Card` : 'Preview'} | TavvY</title>
        <meta name="description" content={cardData?.bio || 'Digital business card preview'} />
      </Head>

      <AppLayout hideTabBar>
        <div className="preview-screen" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.push('/app/ecard', undefined, { locale })}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <div className="header-center">
              <h1 style={{ color: isDark ? '#fff' : '#333' }}>Preview</h1>
              {saving && <span className="saving-badge">Saving...</span>}
              {!saving && hasChanges && <span className="unsaved-badge">Unsaved</span>}
            </div>
            <div className="header-right">
              <button className="icon-btn" onClick={refreshPreview} title="Refresh">
                <IoRefresh size={20} color={isDark ? '#fff' : '#333'} />
              </button>
              <button className="icon-btn" onClick={shareCard} title="Share">
                <IoShare size={20} color={isDark ? '#fff' : '#333'} />
              </button>
            </div>
          </header>

          {/* Card Preview */}
          {loading ? (
            <div className="card-preview-container">
              <div className="skeleton-card">
                <div className="skeleton-header" />
                <div className="skeleton-body">
                  <div className="skeleton-line wide" />
                  <div className="skeleton-line medium" />
                  <div className="skeleton-line short" />
                  <div className="skeleton-line wide" style={{ marginTop: 24 }} />
                  <div className="skeleton-line wide" />
                  <div className="skeleton-line wide" />
                </div>
              </div>
            </div>
          ) : !cardData || !previewCard ? (
            <div className="card-preview-container">
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h3 style={{ color: isDark ? '#fff' : '#333' }}>Card not found</h3>
                <button onClick={() => router.push('/app/ecard', undefined, { locale })} style={{ marginTop: 16, background: ACCENT_GREEN, border: 'none', padding: '12px 24px', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
              </div>
            </div>
          ) : (
            <div className="card-preview-container">
              <ECardIframePreview
                ref={iframePreviewRef}
                slug={cardData.slug}
                isPublished={!!cardData.is_published}
                fallbackCard={previewCard}
                fallbackLinks={cardLinks}
              />
            </div>
          )}

          {/* Draft Banner */}
          {isDraft && (
            <div className="draft-banner">
              <span>This card is not published yet. Publish to make it visible to others.</span>
            </div>
          )}

          {/* Quick Edit Toolbar Toggle */}
          {isOwner && cardData && (
            <button
              className={`toolbar-toggle ${showToolbar ? 'active' : ''}`}
              onClick={() => setShowToolbar(!showToolbar)}
            >
              <IoColorPalette size={18} />
              <span>Quick Edit</span>
              {showToolbar ? <IoChevronDown size={16} /> : <IoChevronUp size={16} />}
            </button>
          )}

          {/* Quick Edit Toolbar */}
          {isOwner && showToolbar && (
            <div className="quick-edit-toolbar">
              <div className="toolbar-tabs">
                <button
                  className={`tab-btn ${toolbarTab === 'visibility' ? 'active' : ''}`}
                  onClick={() => setToolbarTab('visibility')}
                >
                  <IoEye size={16} />
                  <span>Show / Hide</span>
                </button>
                <button
                  className={`tab-btn ${toolbarTab === 'colors' ? 'active' : ''}`}
                  onClick={() => setToolbarTab('colors')}
                >
                  <IoColorPalette size={16} />
                  <span>Colors</span>
                </button>
              </div>

              {toolbarTab === 'visibility' && (
                <div className="toolbar-content">
                  <div className="toggle-row">
                    <span className="toggle-label">Contact Info</span>
                    <button
                      className={`toggle-switch ${showContactInfo ? 'on' : 'off'}`}
                      onClick={() => handleToggle(setShowContactInfo, !showContactInfo)}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span className="toggle-label">Social Icons</span>
                    <button
                      className={`toggle-switch ${showSocialIcons ? 'on' : 'off'}`}
                      onClick={() => handleToggle(setShowSocialIcons, !showSocialIcons)}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                </div>
              )}

              {toolbarTab === 'colors' && (
                <div className="toolbar-content">
                  <div className="color-row">
                    <span className="color-label">Primary Color</span>
                    <div className="color-picker-wrapper">
                      <div className="color-swatch" style={{ background: gradientColor1 }} />
                      <input
                        type="color"
                        value={gradientColor1}
                        onChange={(e) => handleColorChange(setGradientColor1, e.target.value)}
                        className="color-input"
                      />
                      <span className="color-hex">{gradientColor1}</span>
                    </div>
                  </div>
                  <div className="color-row">
                    <span className="color-label">Secondary Color</span>
                    <div className="color-picker-wrapper">
                      <div className="color-swatch" style={{ background: gradientColor2 }} />
                      <input
                        type="color"
                        value={gradientColor2}
                        onChange={(e) => handleColorChange(setGradientColor2, e.target.value)}
                        className="color-input"
                      />
                      <span className="color-hex">{gradientColor2}</span>
                    </div>
                  </div>
                  <div className="color-preview-bar" style={{ background: `linear-gradient(135deg, ${gradientColor1}, ${gradientColor2})` }} />
                </div>
              )}

              {hasChanges && (
                <button className="save-btn" onClick={saveChanges} disabled={saving}>
                  <IoSave size={16} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="actions">
            <button className="action-btn" onClick={() => setShowQRModal(true)}>
              <IoQrCode size={20} />
              <span>QR Code</span>
            </button>
            <button className="action-btn" onClick={copyCardUrl}>
              {copied ? <IoCheckmark size={20} color={ACCENT_GREEN} /> : <IoCopy size={20} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button className="action-btn primary" onClick={shareCard}>
              <IoShare size={20} />
              <span>Share</span>
            </button>
          </div>

          {/* Edit Button (for owner) */}
          {isOwner && (
            <button
              className="edit-btn"
              onClick={() => router.push(`/app/ecard/${cardId}/edit`, undefined, { locale })}
            >
              <IoCreate size={18} />
              <span>Full Editor</span>
            </button>
          )}

          {/* QR Code Modal */}
          {showQRModal && cardData?.slug && (
            <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
              <div className="modal qr-modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff', maxWidth: 420 }}>
                <button className="modal-close" onClick={() => setShowQRModal(false)}>
                  <IoClose size={24} color={isDark ? '#fff' : '#333'} />
                </button>
                <h2 style={{ color: isDark ? '#fff' : '#333', marginBottom: 4 }}>QR Code</h2>
                <p style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, marginBottom: 16 }}>
                  Customize your QR code style
                </p>

                <div ref={qrContainerRef} className="qr-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <StyledQRCode url={getCardUrl(cardData.slug)} style={qrStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {QR_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setQrStyle(preset.config)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: `2px solid ${JSON.stringify(qrStyle) === JSON.stringify(preset.config) ? '#00C853' : (isDark ? '#334155' : '#E5E7EB')}`,
                        backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: isDark ? '#E2E8F0' : '#374151',
                        textAlign: 'center' as const,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, margin: '0 auto 4px',
                        borderRadius: preset.config.dotStyle === 'dots' ? '50%' : 4,
                        background: preset.config.backgroundColor === '#FFFFFF'
                          ? `linear-gradient(135deg, ${preset.config.dotColor}, ${preset.config.dotColor}88)`
                          : preset.config.backgroundColor,
                        border: `2px solid ${preset.config.dotColor}`,
                      }} />
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Dot Color</label>
                  <input
                    type="color"
                    value={qrStyle.dotColor || '#000000'}
                    onChange={(e) => setQrStyle(prev => ({ ...prev, dotColor: e.target.value, cornerColor: e.target.value }))}
                    style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                  />
                  <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Background</label>
                  <input
                    type="color"
                    value={qrStyle.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setQrStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                  />
                </div>

                <p style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                  {getCardUrl(cardData.slug)}
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="download-btn" onClick={copyCardUrl} style={{ flex: 1 }}>
                    <IoCopy size={16} />
                    <span>Copy Link</span>
                  </button>
                  <button className="download-btn" onClick={async () => {
                    if (qrContainerRef.current) {
                      const { downloadQRCode } = await import('../../../../components/ecard/StyledQRCode');
                      await downloadQRCode(qrContainerRef.current, `${cardData.slug}-qr`);
                    }
                  }} style={{ flex: 1, background: '#00C853' }}>
                    <IoDownload size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .preview-screen {
            min-height: 100vh;
            padding-bottom: 40px;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .header-center {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .icon-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
          }

          .icon-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          }

          .saving-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            background: ${ACCENT_GREEN}33;
            color: ${ACCENT_GREEN};
            font-weight: 600;
            animation: pulse 1.5s ease-in-out infinite;
          }

          .unsaved-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(255, 193, 7, 0.2);
            color: #FFC107;
            font-weight: 600;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .back-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .header h1 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }

          .card-preview-container {
            margin: 0 16px 16px;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }

          .skeleton-card {
            animation: shimmer 1.5s ease-in-out infinite;
          }

          .skeleton-header {
            height: 160px;
            background: ${isDark ? '#334155' : '#E5E7EB'};
          }

          .skeleton-body {
            padding: 24px;
          }

          .skeleton-line {
            height: 14px;
            border-radius: 7px;
            background: ${isDark ? '#334155' : '#E5E7EB'};
            margin-bottom: 12px;
          }

          .skeleton-line.wide { width: 100%; }
          .skeleton-line.medium { width: 60%; }
          .skeleton-line.short { width: 35%; }

          @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .draft-banner {
            margin: 0 16px 16px;
            padding: 12px 16px;
            background: ${isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)'};
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 12px;
            color: ${isDark ? '#FFC107' : '#856404'};
            font-size: 13px;
            text-align: center;
          }

          .toolbar-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: calc(100% - 32px);
            margin: 0 16px 8px;
            padding: 12px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            border-radius: 12px;
            color: ${isDark ? '#E2E8F0' : '#374151'};
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .toolbar-toggle:hover {
            background: ${isDark ? '#334155' : '#F3F4F6'};
          }

          .toolbar-toggle.active {
            border-color: ${ACCENT_GREEN};
            color: ${ACCENT_GREEN};
          }

          .quick-edit-toolbar {
            margin: 0 16px 16px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            border-radius: 16px;
            overflow: hidden;
            animation: slideDown 0.2s ease;
          }

          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .toolbar-tabs {
            display: flex;
            border-bottom: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
          }

          .tab-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            background: none;
            border: none;
            color: ${isDark ? '#94A3B8' : '#6B7280'};
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
          }

          .tab-btn.active {
            color: ${ACCENT_GREEN};
            border-bottom-color: ${ACCENT_GREEN};
            background: rgba(0, 200, 83, 0.05);
          }

          .toolbar-content {
            padding: 16px;
          }

          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
          }

          .toggle-row + .toggle-row {
            border-top: 1px solid ${isDark ? '#334155' : '#F3F4F6'};
          }

          .toggle-label {
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? '#E2E8F0' : '#374151'};
          }

          .toggle-switch {
            width: 48px;
            height: 28px;
            border-radius: 14px;
            border: none;
            cursor: pointer;
            position: relative;
            transition: background 0.3s;
            padding: 0;
          }

          .toggle-switch.on {
            background: ${ACCENT_GREEN};
          }

          .toggle-switch.off {
            background: ${isDark ? '#475569' : '#D1D5DB'};
          }

          .toggle-knob {
            width: 22px;
            height: 22px;
            border-radius: 11px;
            background: #fff;
            position: absolute;
            top: 3px;
            transition: left 0.3s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }

          .toggle-switch.on .toggle-knob {
            left: 23px;
          }

          .toggle-switch.off .toggle-knob {
            left: 3px;
          }

          .color-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
          }

          .color-row + .color-row {
            border-top: 1px solid ${isDark ? '#334155' : '#F3F4F6'};
          }

          .color-label {
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? '#E2E8F0' : '#374151'};
          }

          .color-picker-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .color-swatch {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: 2px solid ${isDark ? '#475569' : '#D1D5DB'};
          }

          .color-input {
            width: 28px;
            height: 28px;
            border: none;
            cursor: pointer;
            border-radius: 6px;
            padding: 0;
            opacity: 0;
            position: absolute;
            left: 0;
            top: 0;
          }

          .color-hex {
            font-size: 12px;
            font-family: monospace;
            color: ${isDark ? '#94A3B8' : '#6B7280'};
            min-width: 60px;
          }

          .color-preview-bar {
            height: 8px;
            border-radius: 4px;
            margin-top: 12px;
          }

          .save-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 12px;
            background: ${ACCENT_GREEN};
            border: none;
            border-top: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .save-btn:disabled {
            opacity: 0.6;
          }

          .actions {
            display: flex;
            gap: 12px;
            padding: 0 16px;
            margin-bottom: 16px;
          }

          .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: none;
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .action-btn:hover {
            transform: scale(1.02);
          }

          .action-btn.primary {
            background: ${ACCENT_GREEN};
            color: #fff;
          }

          .edit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: calc(100% - 32px);
            margin: 0 16px;
            padding: 14px;
            background: transparent;
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
          }

          .edit-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal {
            width: 100%;
            max-width: 340px;
            padding: 24px;
            border-radius: 20px;
            text-align: center;
            position: relative;
          }

          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
          }

          .modal h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px;
          }

          .qr-container {
            background: #fff;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 12px;
            background: ${ACCENT_GREEN};
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }
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
