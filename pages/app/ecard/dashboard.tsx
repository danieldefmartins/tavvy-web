/**
 * eCard Dashboard Screen
 * Full editing interface for eCard - content, links, appearance, analytics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import AppLayout from '../../../components/AppLayout';
import { 
  getCardById, 
  getCardLinks, 
  updateCard, 
  saveCardLinks,
  checkSlugAvailability,
  publishCard,
  generateSlug,
  uploadProfilePhoto,
  uploadEcardFile,
  deleteEcardFile,
  CardData, 
  LinkItem,
  FeaturedSocial,
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
  IoPersonCircle,
  IoCreate,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#000000';

type Tab = 'content' | 'links' | 'appearance' | 'analytics';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', placeholder: '@username or URL' },
  { id: 'tiktok', name: 'TikTok', placeholder: '@username or URL' },
  { id: 'youtube', name: 'YouTube', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', placeholder: '@username or URL' },
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
  { id: 'snapchat', name: 'Snapchat', placeholder: '@username' },
  { id: 'pinterest', name: 'Pinterest', placeholder: 'Profile URL' },
  { id: 'twitch', name: 'Twitch', placeholder: 'Channel URL' },
];

const FEATURED_PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'spotify', name: 'Spotify' },
  { id: 'github', name: 'GitHub' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'discord', name: 'Discord' },
];

export default function ECardDashboardScreen() {
  const router = useRouter();
  const { cardId: queryCardId, isNew, openAppearance } = router.query;
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const { isPro } = useRoles();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoDurationError, setVideoDurationError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  // Store cardId in state so it persists even if router.query changes
  const [cardId, setCardId] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(openAppearance ? 'appearance' : 'content');

  // Content state
  const [fullName, setFullName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [emailField, setEmailField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [websiteField, setWebsiteField] = useState('');
  const [addressField, setAddressField] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [featuredIcons, setFeaturedIcons] = useState<FeaturedSocial[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [videos, setVideos] = useState<{ type: string; url: string }[]>([]);
  const [showFeaturedPicker, setShowFeaturedPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTypeInput, setVideoTypeInput] = useState<'youtube' | 'tavvy_short' | 'external'>('youtube');

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

  // Sync cardId from router query to state (persists across re-renders)
  useEffect(() => {
    if (router.isReady && queryCardId && typeof queryCardId === 'string') {
      setCardId(queryCardId);
    }
  }, [router.isReady, queryCardId]);

  // Load card data when cardId is available
  useEffect(() => {
    const loadCard = async () => {
      if (!cardId) {
        // Only stop loading if router is ready but no cardId
        if (router.isReady) setLoading(false);
        return;
      }

      try {
        const card = await getCardById(cardId);
        if (card) {
          setCardData(card);
          // Content fields
          setFullName(card.full_name || '');
          setTitleRole(card.title || '');
          setBio(card.bio || '');
          setEmailField(card.email || '');
          setPhoneField(card.phone || '');
          setWebsiteField(card.website || '');
          setAddressField(card.city || '');
          setProfilePhotoUrl(card.profile_photo_url || null);
          // Normalize featured_socials: handle both flat strings ["instagram"] and objects [{platform:"instagram",url:""}]
          const rawSocials = card.featured_socials || [];
          const normalizedSocials = rawSocials.map((item: any) => {
            if (typeof item === 'string') {
              return { platform: item, url: '' };
            }
            return item;
          });
          setFeaturedIcons(normalizedSocials);
          setGalleryImages((card.gallery_images || []).map((g: any) => ({ id: g.id, url: g.url })));
          setVideos(card.videos || []);
          // Appearance fields
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
            url: l.url,
            title: l.title,
          })));
        } else {
          console.error('[Dashboard] Card not found for id:', cardId);
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
    if (!cardData || !cardId) {
      console.error('[Dashboard] Cannot save: cardData=', !!cardData, 'cardId=', cardId);
      if (!cardId) alert('Error: Card ID not found. Please go back and try again.');
      return;
    }

    setSaving(true);
    try {
      // Upload new profile photo if changed
      let photoUrl = profilePhotoUrl;
      if (profilePhotoFile && user) {
        try {
          const uploaded = await uploadProfilePhoto(user.id, profilePhotoFile);
          if (uploaded) photoUrl = uploaded;
        } catch (e) {
          console.warn('Photo upload failed:', e);
        }
      }

      // Upload new gallery images
      const uploadedGallery: { id: string; url: string; caption: string }[] = [];
      for (const img of galleryImages) {
        if (img.file && user) {
          try {
            const url = await uploadEcardFile(user.id, img.file, 'gallery');
            if (url) uploadedGallery.push({ id: img.id, url, caption: '' });
          } catch (e) {
            console.warn('Gallery upload failed:', e);
          }
        } else if (img.url && !img.url.startsWith('blob:')) {
          uploadedGallery.push({ id: img.id, url: img.url, caption: '' });
        }
      }

      await updateCard(cardId, {
        full_name: fullName.trim(),
        title: titleRole || undefined,
        bio: bio || undefined,
        email: emailField || undefined,
        phone: phoneField || undefined,
        website: websiteField || undefined,
        city: addressField || undefined,
        profile_photo_url: photoUrl || undefined,
        profile_photo_size: profilePhotoSize,
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
        theme: selectedTheme,
        button_style: selectedButtonStyle,
        font_style: selectedFont,
        featured_socials: featuredIcons.length > 0 ? featuredIcons : [],
        gallery_images: uploadedGallery,
        videos: videos,
      } as any);

      await saveCardLinks(cardId, links);

      // Update local state
      setCardData(prev => prev ? {
        ...prev,
        full_name: fullName.trim(),
        title: titleRole,
        bio,
        email: emailField,
        phone: phoneField,
        website: websiteField,
        city: addressField,
        profile_photo_url: photoUrl || undefined,
        profile_photo_size: profilePhotoSize,
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
      } : null);

      setProfilePhotoFile(null);
      alert('Card saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Photo handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(f => ({
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: URL.createObjectURL(f),
        file: f,
      }));
      setGalleryImages(prev => [...prev, ...newImages]);
    }
  };

  const removeGalleryImage = async (id: string) => {
    const imageToRemove = galleryImages.find(g => g.id === id);
    setGalleryImages(prev => prev.filter(g => g.id !== id));
    // Delete from Supabase Storage if it's a remote URL (not a blob)
    if (imageToRemove && imageToRemove.url && !imageToRemove.url.startsWith('blob:')) {
      await deleteEcardFile(imageToRemove.url);
    }
  };

  // Featured icon handlers
  const addFeaturedIcon = (platformId: string) => {
    if (featuredIcons.length >= 4) return;
    if (featuredIcons.some(fi => fi.platform === platformId)) return;
    setFeaturedIcons(prev => [...prev, { platform: platformId, url: '' }]);
    setShowFeaturedPicker(false);
  };

  const updateFeaturedIconUrl = (platform: string, url: string) => {
    setFeaturedIcons(prev => prev.map(fi => fi.platform === platform ? { ...fi, url } : fi));
  };

  const removeFeaturedIcon = (platform: string) => {
    setFeaturedIcons(prev => prev.filter(fi => fi.platform !== platform));
  };

  // Video handlers
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoDurationError(null);
    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setVideoDurationError('Video file is too large. Maximum size is 50MB.');
      return;
    }
    // Check video duration using HTML5 video element
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      if (videoEl.duration > 16) {
        setVideoDurationError(`Video is ${Math.round(videoEl.duration)} seconds. Max is 15 seconds.`);
        setVideoFile(null);
        setVideoUrlInput('');
      } else {
        setVideoFile(file);
        setVideoUrlInput(file.name);
        setVideoDurationError(null);
      }
    };
    videoEl.onerror = () => {
      // If we can't read metadata, allow the upload anyway
      setVideoFile(file);
      setVideoUrlInput(file.name);
    };
    videoEl.src = URL.createObjectURL(file);
  };

  const addVideo = async () => {
    if (videoTypeInput === 'tavvy_short' && videoFile) {
      // Upload video file to Supabase Storage
      setIsUploadingVideo(true);
      try {
        const userId = user?.id;
        if (!userId) { alert('Please log in to upload videos'); setIsUploadingVideo(false); return; }
        const uploadedUrl = await uploadEcardFile(userId, videoFile, 'video');
        if (uploadedUrl) {
          setVideos(prev => [...prev, { type: 'tavvy_short', url: uploadedUrl }]);
        } else {
          alert('Failed to upload video. Please check the file format and try again.');
        }
      } catch (err) {
        console.error('Video upload error:', err);
        alert('Failed to upload video. Please try a different file or check your connection.');
      } finally {
        setIsUploadingVideo(false);
      }
      setVideoFile(null);
      setVideoUrlInput('');
      setShowVideoModal(false);
      return;
    }
    if (!videoUrlInput.trim()) return;
    setVideos(prev => [...prev, { type: videoTypeInput, url: videoUrlInput.trim() }]);
    setVideoUrlInput('');
    setVideoFile(null);
    setShowVideoModal(false);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Check slug availability
  const checkSlug = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    const available = await checkSlugAvailability(slug, cardId || undefined);
    setSlugAvailable(available);
    setCheckingSlug(false);
  };

  // Publish card
  const handlePublish = async () => {
    if (!slugAvailable || !cardId) return;

    setPublishing(true);
    try {
      const success = await publishCard(cardId!, slugInput);
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

  // Link handlers
  const addLink = (platform: string) => {
    if (!canAddMoreLinks) {
      router.push('/app/ecard/premium');
      return;
    }
    setLinks([...links, { id: Date.now().toString(), platform, value: '', url: '', title: platform }]);
    setShowAddLink(false);
  };

  const updateLink = (id: string, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, value, url: value } : link));
  };

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
          {/* Hidden file inputs */}
          <input type="file" ref={photoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <input type="file" ref={galleryInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryAdd} />
          <input type="file" ref={videoInputRef} accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} />

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
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="preview-photo" onClick={() => photoInputRef.current?.click()} />
              ) : (
                <div className="preview-photo-placeholder" onClick={() => photoInputRef.current?.click()}>
                  <IoCamera size={24} color="rgba(255,255,255,0.5)" />
                </div>
              )}
              <h3 className="preview-name">{fullName || 'Your Name'}</h3>
              {titleRole && <p className="preview-title">{titleRole}</p>}
              
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
              className={`tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <IoCreate size={16} />
              <span>Content</span>
            </button>
            <button 
              className={`tab ${activeTab === 'links' ? 'active' : ''}`}
              onClick={() => setActiveTab('links')}
            >
              <IoLink size={16} />
              <span>Links</span>
            </button>
            <button 
              className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <IoColorPalette size={16} />
              <span>Style</span>
            </button>
            <button 
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <IoBarChart size={16} />
              <span>Stats</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">

            {/* ── Content Tab ── */}
            {activeTab === 'content' && (
              <div className="content-tab">
                {/* Profile Photo */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Profile Photo</h3>
                  <div className="photo-edit-row">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="" className="edit-photo" onClick={() => photoInputRef.current?.click()} />
                    ) : (
                      <div className="edit-photo-placeholder" onClick={() => photoInputRef.current?.click()}>
                        <IoCamera size={28} color={isDark ? '#94A3B8' : '#9CA3AF'} />
                      </div>
                    )}
                    <div className="photo-actions">
                      <button className="photo-action-btn" onClick={() => photoInputRef.current?.click()}>
                        {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {profilePhotoUrl && (
                        <button className="photo-action-btn danger" onClick={() => { setProfilePhotoUrl(null); setProfilePhotoFile(null); }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Basic Info</h3>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Title / Role</label>
                    <input
                      type="text"
                      value={titleRole}
                      onChange={(e) => setTitleRole(e.target.value)}
                      placeholder="e.g. CEO, Designer, Realtor"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A short bio about yourself"
                      className="field-textarea"
                      rows={3}
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Contact Info</h3>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Email</label>
                    <input
                      type="email"
                      value={emailField}
                      onChange={(e) => setEmailField(e.target.value)}
                      placeholder="your@email.com"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Phone</label>
                    <input
                      type="tel"
                      value={phoneField}
                      onChange={(e) => setPhoneField(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Website</label>
                    <input
                      type="url"
                      value={websiteField}
                      onChange={(e) => setWebsiteField(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Location</label>
                    <input
                      type="text"
                      value={addressField}
                      onChange={(e) => setAddressField(e.target.value)}
                      placeholder="City, State"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                </div>

                {/* Featured Social Icons */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Featured Social Icons <span className="hint">(up to 4)</span></h3>
                  <div className="featured-icons-list">
                    {featuredIcons.map((fi) => {
                      const pi = PLATFORM_ICONS[fi.platform];
                      const pName = FEATURED_PLATFORMS.find(p => p.id === fi.platform)?.name || fi.platform;
                      return (
                        <div key={fi.platform} className="featured-icon-item" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                          <div className="fi-header">
                            <div className="fi-left">
                              <div className="fi-dot" style={{ backgroundColor: pi?.bgColor || '#888' }} />
                              <span className="fi-name" style={{ color: isDark ? '#fff' : '#333' }}>{pName}</span>
                            </div>
                            <button className="fi-remove" onClick={() => removeFeaturedIcon(fi.platform)}>
                              <IoTrash size={16} color="#EF4444" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={fi.url}
                            onChange={(e) => updateFeaturedIconUrl(fi.platform, e.target.value)}
                            placeholder={`Enter your ${pName} URL or @username`}
                            className="fi-url-input"
                            style={{ color: isDark ? '#fff' : '#333', backgroundColor: isDark ? '#000000' : '#F3F4F6' }}
                          />
                        </div>
                      );
                    })}
                    {featuredIcons.length < 4 && (
                      <button
                        className="add-featured-btn"
                        onClick={() => setShowFeaturedPicker(true)}
                        style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}
                      >
                        <IoAdd size={20} color={ACCENT_GREEN} />
                        <span style={{ color: isDark ? '#fff' : '#333' }}>Add Social Icon</span>
                      </button>
                    )}
                  </div>

                  {/* Featured Icon Picker */}
                  {showFeaturedPicker && (
                    <div className="platform-picker" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                      <div className="picker-header">
                        <span style={{ color: isDark ? '#fff' : '#333' }}>Choose Platform</span>
                        <button onClick={() => setShowFeaturedPicker(false)}>
                          <IoClose size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
                        </button>
                      </div>
                      <div className="platform-grid">
                        {FEATURED_PLATFORMS.filter(p => !featuredIcons.some(fi => fi.platform === p.id)).map((platform) => (
                          <button
                            key={platform.id}
                            className="platform-option"
                            onClick={() => addFeaturedIcon(platform.id)}
                            style={{ backgroundColor: isDark ? '#000000' : '#F3F4F6' }}
                          >
                            <div className="po-dot" style={{ backgroundColor: PLATFORM_ICONS[platform.id]?.bgColor || '#888' }} />
                            <span style={{ color: isDark ? '#fff' : '#333' }}>{platform.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Gallery */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Photo Gallery</h3>
                  <div className="gallery-grid">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="gallery-thumb">
                        <img src={img.url} alt="" />
                        <button className="gallery-remove" onClick={() => removeGalleryImage(img.id)}>
                          <IoClose size={14} color="#fff" />
                        </button>
                      </div>
                    ))}
                    <button className="gallery-add" onClick={() => galleryInputRef.current?.click()} style={{ backgroundColor: isDark ? '#1E293B' : '#F3F4F6' }}>
                      <IoAdd size={24} color={isDark ? '#94A3B8' : '#9CA3AF'} />
                    </button>
                  </div>
                </div>

                {/* Videos */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Videos</h3>
                  {videos.map((vid, i) => (
                    <div key={i} className="video-item" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                      <div className="video-info">
                        <span className="video-type" style={{ color: isDark ? '#fff' : '#333' }}>
                          {vid.type === 'youtube' ? 'YouTube' : vid.type === 'tavvy_short' ? 'Tavvy Short' : 'Video URL'}
                        </span>
                        <span className="video-url" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{vid.url}</span>
                      </div>
                      <button onClick={() => removeVideo(i)}>
                        <IoTrash size={16} color="#EF4444" />
                      </button>
                    </div>
                  ))}
                  <button
                    className="add-featured-btn"
                    onClick={() => setShowVideoModal(true)}
                    style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}
                  >
                    <IoAdd size={20} color={ACCENT_GREEN} />
                    <span style={{ color: isDark ? '#fff' : '#333' }}>Add Video</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Links Tab ── */}
            {activeTab === 'links' && (
              <div className="links-tab">
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
                          value={link.value || link.url || ''}
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
                          style={{ backgroundColor: isDark ? '#000000' : '#F3F4F6' }}
                        >
                          <span style={{ color: isDark ? '#fff' : '#333' }}>{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isPro && (
                  <p className="link-limit" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                    {links.length}/{FREE_LINK_LIMIT} links used • <a onClick={() => router.push('/app/ecard/premium')}>Upgrade for unlimited</a>
                  </p>
                )}
              </div>
            )}

            {/* ── Appearance Tab ── */}
            {activeTab === 'appearance' && (
              <div className="appearance-tab">
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

            {/* ── Analytics Tab ── */}
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

          {/* Video Add Modal */}
          {showVideoModal && (
            <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                <h2 style={{ color: isDark ? '#fff' : '#333' }}>Add Video</h2>
                <div className="video-type-picker">
                  {(['youtube', 'tavvy_short', 'external'] as const).map(t => (
                    <button
                      key={t}
                      className={`vt-btn ${videoTypeInput === t ? 'active' : ''}`}
                      onClick={() => setVideoTypeInput(t)}
                      style={{
                        backgroundColor: videoTypeInput === t ? ACCENT_GREEN : (isDark ? '#000000' : '#F3F4F6'),
                        color: videoTypeInput === t ? '#fff' : (isDark ? '#fff' : '#333'),
                      }}
                    >
                      {t === 'youtube' ? 'YouTube' : t === 'tavvy_short' ? 'Tavvy Short (15s)' : 'Video URL'}
                    </button>
                  ))}
                </div>
                {videoTypeInput === 'tavvy_short' ? (
                  <>
                    <button
                      className="publish-btn"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploadingVideo}
                      style={{ marginTop: 12, width: '100%', padding: '14px', borderRadius: 12, border: `2px dashed ${isDark ? '#444' : '#ccc'}`, backgroundColor: isDark ? '#000000' : '#F3F4F6', color: isDark ? '#fff' : '#333', cursor: isUploadingVideo ? 'not-allowed' : 'pointer', fontSize: 15, opacity: isUploadingVideo ? 0.5 : 1 }}
                    >
                      {videoFile ? `Selected: ${videoFile.name}` : 'Choose Video from Device'}
                    </button>
                    <p style={{ fontSize: 12, color: isDark ? '#888' : '#999', marginTop: 6, textAlign: 'center' }}>Max 15 seconds. Tap to select from camera, library, or files.</p>
                    {videoDurationError && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 6, textAlign: 'center', fontWeight: 600 }}>{videoDurationError}</p>}
                  </>
                ) : (
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder={videoTypeInput === 'youtube' ? 'Paste YouTube URL' : 'Paste any video URL'}
                    className="field-input"
                    style={{ backgroundColor: isDark ? '#000000' : '#F3F4F6', color: isDark ? '#fff' : '#333', marginTop: 12 }}
                  />
                )}
                <div className="modal-actions" style={{ marginTop: 16 }}>
                  <button className="cancel-btn" onClick={() => { setShowVideoModal(false); setVideoUrlInput(''); setVideoFile(null); }}>
                    Cancel
                  </button>
                  <button className="publish-btn" onClick={addVideo} disabled={isUploadingVideo || (videoTypeInput === 'tavvy_short' ? !videoFile : !videoUrlInput.trim())} style={{ opacity: isUploadingVideo ? 0.6 : 1, cursor: isUploadingVideo ? 'not-allowed' : 'pointer' }}>
                    {isUploadingVideo ? 'Uploading...' : (videoTypeInput === 'tavvy_short' ? 'Upload' : 'Add')}
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
            cursor: pointer;
          }

          .preview-photo {
            width: 64px;
            height: 64px;
            border-radius: 32px;
            object-fit: cover;
            margin: 0 auto 12px;
            display: block;
            border: 2px solid rgba(255,255,255,0.3);
            cursor: pointer;
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
            cursor: pointer;
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
            gap: 6px;
            margin-bottom: 20px;
          }

          .tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px 6px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: none;
            border-radius: 12px;
            color: ${isDark ? '#94A3B8' : '#6B7280'};
            font-size: 12px;
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

          /* Content Tab */
          .section {
            margin-bottom: 24px;
          }

          .section h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px;
          }

          .section h3 .hint {
            font-size: 12px;
            font-weight: 400;
            color: ${isDark ? '#64748B' : '#9CA3AF'};
          }

          .field-group {
            margin-bottom: 12px;
          }

          .field-group label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .field-input {
            width: 100%;
            padding: 12px 14px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
          }

          .field-textarea {
            width: 100%;
            padding: 12px 14px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
            resize: vertical;
            font-family: inherit;
            box-sizing: border-box;
          }

          /* Photo Edit */
          .photo-edit-row {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .edit-photo {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid ${isDark ? '#334155' : '#E5E7EB'};
          }

          .edit-photo-placeholder {
            width: 72px;
            height: 72px;
            border-radius: 36px;
            background: ${isDark ? '#1E293B' : '#F3F4F6'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 2px dashed ${isDark ? '#334155' : '#E5E7EB'};
          }

          .photo-actions {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .photo-action-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: ${isDark ? '#1E293B' : '#F3F4F6'};
            color: ${isDark ? '#fff' : '#333'};
            font-size: 13px;
            cursor: pointer;
          }

          .photo-action-btn.danger {
            color: #EF4444;
          }

          /* Featured Icons */
          .featured-icons-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .featured-icon-item {
            display: flex;
            flex-direction: column;
            padding: 12px;
            border-radius: 10px;
            gap: 8px;
          }

          .fi-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .fi-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .fi-dot {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            flex-shrink: 0;
          }

          .fi-name {
            font-size: 15px;
            font-weight: 600;
            white-space: nowrap;
          }

          .fi-url-input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 14px;
            padding: 8px 10px;
            border-radius: 8px;
            min-width: 0;
          }

          .fi-remove {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            flex-shrink: 0;
          }

          .add-featured-btn {
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

          /* Gallery */
          .gallery-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .gallery-thumb {
            position: relative;
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
          }

          .gallery-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .gallery-remove {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 22px;
            height: 22px;
            border-radius: 11px;
            background: rgba(239,68,68,0.9);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .gallery-add {
            aspect-ratio: 1;
            border-radius: 8px;
            border: 2px dashed ${isDark ? '#334155' : '#E5E7EB'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          /* Video */
          .video-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 8px;
            gap: 12px;
          }

          .video-info {
            flex: 1;
            min-width: 0;
          }

          .video-type {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 2px;
          }

          .video-url {
            display: block;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .video-item button {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
          }

          .video-type-picker {
            display: flex;
            gap: 6px;
          }

          .vt-btn {
            flex: 1;
            padding: 10px 6px;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
          }

          /* Platform Picker */
          .platform-picker {
            border-radius: 12px;
            padding: 16px;
            margin-top: 8px;
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
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
          }

          .po-dot {
            width: 20px;
            height: 20px;
            border-radius: 10px;
            flex-shrink: 0;
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
            background: ${isDark ? '#000000' : '#F3F4F6'};
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
            background: ${isDark ? '#000000' : '#F3F4F6'};
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
