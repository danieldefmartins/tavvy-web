/**
 * eCard Dashboard Screen
 * Full editing interface for eCard - links, appearance, analytics
 * Ported from tavvy-mobile/screens/ecard/ECardDashboardScreen.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { 
  getCardById, 
  getCardLinks, 
  updateCard, 
  saveCardLinks,
  checkSlugAvailability,
  publishCard,
  generateSlug,
  CardData, 
  LinkItem,
  PLATFORM_ICONS,
  THEMES,
  PRESET_GRADIENTS,
  BUTTON_STYLES,
  PHOTO_SIZES,
  FREE_LINK_LIMIT,
} from '../../../lib/ecard';
import { FONTS, PREMIUM_FONT_COUNT } from '../../../config/eCardFonts';
import { 
  IoArrowBack, 
  IoEye,
  IoLink,
  IoColorPalette,
  IoBarChart,
  IoAdd,
  IoTrash,
  IoReorderTwo,
  IoShare,
  IoQrCode,
  IoCopy,
  IoCheckmark,
  IoClose,
  IoCamera,
  IoChevronForward,
  IoLockClosed,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#0F172A';

type Tab = 'links' | 'appearance' | 'analytics';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', placeholder: '@username' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'Profile URL' },
  { id: 'facebook', name: 'Facebook', placeholder: 'Profile URL' },
  { id: 'website', name: 'Website', placeholder: 'https://...' },
  { id: 'email', name: 'Email', placeholder: 'email@example.com' },
  { id: 'phone', name: 'Phone', placeholder: '+1 (555) 123-4567' },
  { id: 'whatsapp', name: 'WhatsApp', placeholder: 'Phone number' },
  { id: 'telegram', name: 'Telegram', placeholder: '@username' },
  { id: 'spotify', name: 'Spotify', placeholder: 'Profile URL' },
  { id: 'github', name: 'GitHub', placeholder: '@username' },
  { id: 'discord', name: 'Discord', placeholder: 'Server invite' },
];

export default function ECardDashboardScreen() {
  const router = useRouter();
  const { cardId, isNew, openAppearance } = router.query;
  const { theme, isDark } = useThemeContext();
  const { user, isPro } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(openAppearance ? 'appearance' : 'links');

  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  const [selectedButtonStyle, setSelectedButtonStyle] = useState('fill');
  const [selectedFont, setSelectedFont] = useState('default');
  const [profilePhotoSize, setProfilePhotoSize] = useState('medium');

  // Modals
  const [showAddLink, setShowAddLink] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const canAddMoreLinks = isPro || links.length < FREE_LINK_LIMIT;

  // Load card data
  useEffect(() => {
    const loadCard = async () => {
      if (!cardId || typeof cardId !== 'string') {
        setLoading(false);
        return;
      }

      try {
        const card = await getCardById(cardId);
        if (card) {
          setCardData(card);
          setGradientColors([card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']);
          setSelectedTheme(card.theme || 'classic');
          setSelectedButtonStyle(card.button_style || 'fill');
          setSelectedFont(card.font_style || 'default');
          setProfilePhotoSize(card.profile_photo_size || 'medium');
          setSlugInput(card.slug?.startsWith('draft_') ? generateSlug(card.full_name || '') : card.slug || '');

          const cardLinks = await getCardLinks(cardId);
          setLinks(cardLinks.map(l => ({
            id: l.id,
            platform: l.icon || l.platform || 'other',
            value: l.url,
            title: l.title,
          })));
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [cardId]);

  // Save changes
  const handleSave = async () => {
    if (!cardData || !cardId) return;

    setSaving(true);
    try {
      await updateCard(cardId as string, {
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
        theme: selectedTheme,
        button_style: selectedButtonStyle,
        font_style: selectedFont,
        profile_photo_size: profilePhotoSize,
      });

      await saveCardLinks(cardId as string, links);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Check slug availability
  const checkSlug = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    const available = await checkSlugAvailability(slug, cardId as string);
    setSlugAvailable(available);
    setCheckingSlug(false);
  };

  // Publish card
  const handlePublish = async () => {
    if (!slugAvailable || !cardId) return;

    setPublishing(true);
    try {
      const success = await publishCard(cardId as string, slugInput);
      if (success) {
        setCardData(prev => prev ? { ...prev, is_published: true, slug: slugInput } : null);
        setShowPublishModal(false);
        alert('Card published successfully!');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish card');
    } finally {
      setPublishing(false);
    }
  };

  // Add link
  const addLink = (platform: string) => {
    if (!canAddMoreLinks) {
      router.push('/app/ecard/premium');
      return;
    }
    setLinks([...links, { id: Date.now().toString(), platform, value: '', title: platform }]);
    setShowAddLink(false);
  };

  // Update link
  const updateLink = (id: string, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, value } : link));
  };

  // Remove link
  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  // Copy card URL
  const copyCardUrl = () => {
    const url = `https://tavvy.com/c/${cardData?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Head><title>Edit eCard | TavvY</title></Head>
        <AppLayout>
          <div className="loading" style={{ backgroundColor: bgColor }}>
            <div className="spinner" />
          </div>
          <style jsx>{`
            .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .spinner { width: 40px; height: 40px; border: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; border-top-color: ${ACCENT_GREEN}; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit eCard | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div className="dashboard" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.push('/app/ecard')}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <h1 style={{ color: isDark ? '#fff' : '#333' }}>Edit Card</h1>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </header>

          {/* Card Preview */}
          <div className="preview-section">
            <div 
              className="card-preview"
              style={{ background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` }}
            >
              {cardData?.profile_photo_url ? (
                <img src={cardData.profile_photo_url} alt="" className="preview-photo" />
              ) : (
                <div className="preview-photo-placeholder">
                  <IoCamera size={24} color="rgba(255,255,255,0.5)" />
                </div>
              )}
              <h3 className="preview-name">{cardData?.full_name || 'Your Name'}</h3>
              {cardData?.title && <p className="preview-title">{cardData.title}</p>}
              
              {/* Status Badge */}
              <div className={`status-badge ${cardData?.is_published ? 'published' : 'draft'}`}>
                {cardData?.is_published ? 'Live' : 'Draft'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="preview-actions">
              <button className="action-btn" onClick={() => router.push(`/app/ecard/preview?cardId=${cardId}`)}>
                <IoEye size={18} />
                <span>Preview</span>
              </button>
              {cardData?.is_published ? (
                <button className="action-btn" onClick={copyCardUrl}>
                  {copied ? <IoCheckmark size={18} color={ACCENT_GREEN} /> : <IoCopy size={18} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              ) : (
                <button className="action-btn publish" onClick={() => setShowPublishModal(true)}>
                  <IoShare size={18} />
                  <span>Publish</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'links' ? 'active' : ''}`}
              onClick={() => setActiveTab('links')}
            >
              <IoLink size={18} />
              <span>Links</span>
            </button>
            <button 
              className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <IoColorPalette size={18} />
              <span>Appearance</span>
            </button>
            <button 
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <IoBarChart size={18} />
              <span>Analytics</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Links Tab */}
            {activeTab === 'links' && (
              <div className="links-tab">
                {/* Links List */}
                {links.map((link) => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                  return (
                    <div key={link.id} className="link-item" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                      <div className="link-drag">
                        <IoReorderTwo size={20} color={isDark ? '#64748B' : '#9CA3AF'} />
                      </div>
                      <div className="link-content">
                        <span className="link-platform" style={{ color: isDark ? '#fff' : '#333' }}>
                          {platform?.name || link.platform}
                        </span>
                        <input
                          type="text"
                          value={link.value}
                          onChange={(e) => updateLink(link.id, e.target.value)}
                          placeholder={platform?.placeholder || 'Enter URL'}
                          style={{ color: isDark ? '#94A3B8' : '#6B7280' }}
                        />
                      </div>
                      <button className="link-remove" onClick={() => removeLink(link.id)}>
                        <IoTrash size={18} color="#EF4444" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Link Button */}
                {!showAddLink ? (
                  <button 
                    className="add-link-btn"
                    onClick={() => canAddMoreLinks ? setShowAddLink(true) : router.push('/app/ecard/premium')}
                    style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}
                  >
                    <IoAdd size={20} color={ACCENT_GREEN} />
                    <span style={{ color: isDark ? '#fff' : '#333' }}>Add Link</span>
                    {!canAddMoreLinks && <IoLockClosed size={16} color="#F59E0B" />}
                  </button>
                ) : (
                  <div className="platform-picker" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                    <div className="picker-header">
                      <span style={{ color: isDark ? '#fff' : '#333' }}>Choose Platform</span>
                      <button onClick={() => setShowAddLink(false)}>
                        <IoClose size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                      </button>
                    </div>
                    <div className="platform-grid">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          className="platform-option"
                          onClick={() => addLink(platform.id)}
                          style={{ backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }}
                        >
                          <span style={{ color: isDark ? '#fff' : '#333' }}>{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link Limit Warning */}
                {!isPro && (
                  <p className="link-limit" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                    {links.length}/{FREE_LINK_LIMIT} links used • <a onClick={() => router.push('/app/ecard/premium')}>Upgrade for unlimited</a>
                  </p>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="appearance-tab">
                {/* Gradient Colors */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Background Color</h3>
                  <div className="gradient-presets">
                    {PRESET_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient.id}
                        className={`gradient-btn ${gradientColors[0] === gradient.colors[0] ? 'selected' : ''}`}
                        onClick={() => setGradientColors(gradient.colors as [string, string])}
                        style={{ background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Photo Size */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Photo Size</h3>
                  <div className="size-options">
                    {PHOTO_SIZES.map((size) => (
                      <button
                        key={size.id}
                        className={`size-btn ${profilePhotoSize === size.id ? 'selected' : ''}`}
                        onClick={() => setProfilePhotoSize(size.id)}
                        style={{ 
                          backgroundColor: profilePhotoSize === size.id ? ACCENT_GREEN : (isDark ? '#1E293B' : '#F3F4F6'),
                          color: profilePhotoSize === size.id ? '#fff' : (isDark ? '#fff' : '#333'),
                        }}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Style */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Button Style</h3>
                  <div className="button-styles">
                    {BUTTON_STYLES.map((style) => (
                      <button
                        key={style.id}
                        className={`style-btn ${selectedButtonStyle === style.id ? 'selected' : ''}`}
                        onClick={() => setSelectedButtonStyle(style.id)}
                        style={{ 
                          backgroundColor: selectedButtonStyle === style.id ? ACCENT_GREEN : (isDark ? '#1E293B' : '#F3F4F6'),
                          color: selectedButtonStyle === style.id ? '#fff' : (isDark ? '#fff' : '#333'),
                        }}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Style */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Font Style</h3>
                  <div className="font-options">
                    {FONTS.slice(0, 8).map((font) => (
                      <button
                        key={font.id}
                        className={`font-btn ${selectedFont === font.id ? 'selected' : ''}`}
                        onClick={() => setSelectedFont(font.id)}
                        style={{ 
                          backgroundColor: selectedFont === font.id ? ACCENT_GREEN : (isDark ? '#1E293B' : '#F3F4F6'),
                          color: selectedFont === font.id ? '#fff' : (isDark ? '#fff' : '#333'),
                          fontWeight: font.style.fontWeight || '400',
                          fontStyle: font.style.fontStyle || 'normal',
                        }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                  {!isPro && (
                    <p className="premium-hint" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      <IoLockClosed size={14} /> {PREMIUM_FONT_COUNT}+ premium fonts available with Pro
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="analytics-tab">
                <div className="stats-grid">
                  <div className="stat-card" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                    <span className="stat-value" style={{ color: isDark ? '#fff' : '#333' }}>
                      {cardData?.view_count || 0}
                    </span>
                    <span className="stat-label" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      Views
                    </span>
                  </div>
                  <div className="stat-card" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                    <span className="stat-value" style={{ color: isDark ? '#fff' : '#333' }}>
                      {cardData?.tap_count || 0}
                    </span>
                    <span className="stat-label" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      Link Taps
                    </span>
                  </div>
                </div>

                {!isPro && (
                  <div className="pro-banner" style={{ backgroundColor: isDark ? '#1E293B' : '#FFF9E6' }}>
                    <h4 style={{ color: isDark ? '#fff' : '#333' }}>Unlock Advanced Analytics</h4>
                    <p style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      See detailed click tracking, visitor locations, and more with Pro
                    </p>
                    <button onClick={() => router.push('/app/ecard/premium')}>
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Publish Modal */}
          {showPublishModal && (
            <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                <h2 style={{ color: isDark ? '#fff' : '#333' }}>Publish Your Card</h2>
                <p style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                  Choose a URL for your card
                </p>

                <div className="slug-input-group">
                  <span className="slug-prefix" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
                    tavvy.com/c/
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setSlugInput(value);
                      checkSlug(value);
                    }}
                    placeholder="yourname"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: isDark ? '#fff' : '#333',
                    }}
                  />
                  {checkingSlug && <div className="slug-spinner" />}
                  {!checkingSlug && slugAvailable === true && <IoCheckmark size={20} color={ACCENT_GREEN} />}
                  {!checkingSlug && slugAvailable === false && <IoClose size={20} color="#EF4444" />}
                </div>

                {slugAvailable === false && (
                  <p className="slug-error">This URL is already taken</p>
                )}

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setShowPublishModal(false)}>
                    Cancel
                  </button>
                  <button 
                    className="publish-btn"
                    onClick={handlePublish}
                    disabled={!slugAvailable || publishing}
                  >
                    {publishing ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .dashboard {
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

          .save-btn {
            background: ${ACCENT_GREEN};
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .save-btn:disabled {
            opacity: 0.5;
          }

          /* Preview Section */
          .preview-section {
            padding: 0 20px 20px;
          }

          .card-preview {
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            position: relative;
            margin-bottom: 12px;
          }

          .preview-photo {
            width: 64px;
            height: 64px;
            border-radius: 32px;
            object-fit: cover;
            margin-bottom: 12px;
            border: 2px solid rgba(255,255,255,0.3);
          }

          .preview-photo-placeholder {
            width: 64px;
            height: 64px;
            border-radius: 32px;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
          }

          .preview-name {
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 4px;
          }

          .preview-title {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin: 0;
          }

          .status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }

          .status-badge.published {
            background: rgba(0, 200, 83, 0.2);
            color: #00C853;
          }

          .status-badge.draft {
            background: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.8);
          }

          .preview-actions {
            display: flex;
            gap: 12px;
          }

          .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: none;
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 14px;
            cursor: pointer;
          }

          .action-btn.publish {
            background: ${ACCENT_GREEN};
            color: #fff;
          }

          /* Tabs */
          .tabs {
            display: flex;
            padding: 0 20px;
            gap: 8px;
            margin-bottom: 20px;
          }

          .tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: none;
            border-radius: 12px;
            color: ${isDark ? '#94A3B8' : '#6B7280'};
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .tab.active {
            background: ${ACCENT_GREEN};
            color: #fff;
          }

          /* Tab Content */
          .tab-content {
            padding: 0 20px;
          }

          /* Links Tab */
          .link-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .link-drag {
            cursor: grab;
          }

          .link-content {
            flex: 1;
          }

          .link-platform {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .link-content input {
            width: 100%;
            background: none;
            border: none;
            outline: none;
            font-size: 13px;
          }

          .link-remove {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .add-link-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px;
            border: 1px dashed;
            border-radius: 12px;
            background: transparent;
            cursor: pointer;
          }

          .platform-picker {
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
          }

          .picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .picker-header button {
            background: none;
            border: none;
            cursor: pointer;
          }

          .platform-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .platform-option {
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
          }

          .link-limit {
            text-align: center;
            font-size: 13px;
            margin-top: 16px;
          }

          .link-limit a {
            color: ${ACCENT_GREEN};
            cursor: pointer;
          }

          /* Appearance Tab */
          .section {
            margin-bottom: 24px;
          }

          .section h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px;
          }

          .gradient-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .gradient-btn {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .gradient-btn.selected {
            border-color: ${isDark ? '#fff' : '#333'};
            transform: scale(1.1);
          }

          .size-options, .button-styles, .font-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .size-btn, .style-btn, .font-btn {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .premium-hint {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            margin-top: 12px;
          }

          /* Analytics Tab */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }

          .stat-card {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }

          .stat-value {
            display: block;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 13px;
          }

          .pro-banner {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }

          .pro-banner h4 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px;
          }

          .pro-banner p {
            font-size: 13px;
            margin: 0 0 16px;
          }

          .pro-banner button {
            background: ${ACCENT_GREEN};
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          /* Modal */
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
            max-width: 400px;
            padding: 24px;
            border-radius: 16px;
          }

          .modal h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px;
          }

          .modal > p {
            font-size: 14px;
            margin: 0 0 20px;
          }

          .slug-input-group {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background: ${isDark ? '#0F172A' : '#F3F4F6'};
            border-radius: 12px;
            margin-bottom: 12px;
          }

          .slug-prefix {
            font-size: 14px;
          }

          .slug-input-group input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            background: transparent;
          }

          .slug-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
            border-top-color: ${ACCENT_GREEN};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .slug-error {
            color: #EF4444;
            font-size: 13px;
            margin: 0 0 16px;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
          }

          .cancel-btn {
            flex: 1;
            padding: 12px;
            background: ${isDark ? '#0F172A' : '#F3F4F6'};
            border: none;
            border-radius: 8px;
            color: ${isDark ? '#fff' : '#333'};
            font-weight: 500;
            cursor: pointer;
          }

          .publish-btn {
            flex: 1;
            padding: 12px;
            background: ${ACCENT_GREEN};
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .publish-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
