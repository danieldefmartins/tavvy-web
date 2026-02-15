/**
 * eCard Dashboard Screen
 * Full editing interface for eCard - content, links, appearance, analytics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import ECardInbox from '../../../components/ECardInbox';
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
import { TEMPLATES, getTemplateById, resolveTemplateId, Template, TemplateLayout } from '../../../config/eCardTemplates';
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
  IoImage,
  IoGrid,
  IoCall,
  IoMail,
  IoGlobe,
  IoPlayForward,
  IoPersonAdd,
  IoRefresh,
  IoBusinessOutline,
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#000000';

type Tab = 'content' | 'links' | 'appearance' | 'analytics' | 'inbox';

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
  const { t } = useTranslation();
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
  const [websiteLabelField, setWebsiteLabelField] = useState('');
  const [addressField, setAddressField] = useState('');
  const [address1Field, setAddress1Field] = useState('');
  const [address2Field, setAddress2Field] = useState('');
  const [zipCodeField, setZipCodeField] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [featuredIcons, setFeaturedIcons] = useState<FeaturedSocial[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [videos, setVideos] = useState<{ type: string; url: string }[]>([]);
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showSocialIcons, setShowSocialIcons] = useState(true);
  const [showFeaturedPicker, setShowFeaturedPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTypeInput, setVideoTypeInput] = useState<'youtube' | 'tavvy_short' | 'external'>('youtube');

  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  const [selectedButtonStyle, setSelectedButtonStyle] = useState('fill');
  const [selectedFont, setSelectedFont] = useState('default');
  const [profilePhotoSize, setProfilePhotoSize] = useState('medium');
  const [fontColor, setFontColor] = useState<string | null>(null);
  
  // Banner image state
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Company logo state
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
          setWebsiteLabelField(card.website_label || '');
          setAddressField(card.city || '');
          setAddress1Field(card.address_1 || '');
          setAddress2Field(card.address_2 || '');
          setZipCodeField(card.zip_code || '');
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
          // Visibility toggles
          setShowContactInfo(card.show_contact_info !== false);
          setShowSocialIcons(card.show_social_icons !== false);
          // Appearance fields
          setGradientColors([card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']);
          setSelectedTheme(card.theme || 'classic');
          setSelectedButtonStyle(card.button_style || 'fill');
          setSelectedFont(card.font_style || 'default');
          setProfilePhotoSize(card.profile_photo_size || 'medium');
          setFontColor(card.font_color || null);
          setBannerImageUrl(card.banner_image_url || null);
          setCompanyLogoUrl(card.company_logo_url || null);
          // Resolve template ID (handles migration from old template IDs)
          const resolvedTemplate = resolveTemplateId(card.template_id || card.theme || 'classic');
          setSelectedTemplateId(resolvedTemplate);
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
          if (uploaded) {
            photoUrl = uploaded;
            setProfilePhotoUrl(uploaded);
            setProfilePhotoFile(null);
          } else {
            console.warn('Photo upload returned null');
          }
        } catch (e) {
          console.warn('Photo upload failed:', e);
        }
      }
      // Never save blob: URLs to database
      if (photoUrl && photoUrl.startsWith('blob:')) {
        photoUrl = null;
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

      // Upload banner image if changed
      let bannerUrl = bannerImageUrl;
      if (bannerImageFile && user) {
        try {
          const uploaded = await uploadEcardFile(user.id, bannerImageFile, 'banner');
          if (uploaded) {
            bannerUrl = uploaded;
            setBannerImageUrl(uploaded);
            setBannerImageFile(null);
          } else {
            console.warn('Banner upload returned null');
          }
        } catch (e) {
          console.warn('Banner upload failed:', e);
        }
      }
      // Never save blob: URLs to database
      if (bannerUrl && bannerUrl.startsWith('blob:')) {
        bannerUrl = null;
      }

      // Upload company logo if changed
      let logoUrl = companyLogoUrl;
      if (companyLogoFile && user) {
        try {
          const uploaded = await uploadEcardFile(user.id, companyLogoFile, 'logo');
          if (uploaded) {
            logoUrl = uploaded;
            setCompanyLogoUrl(uploaded);
            setCompanyLogoFile(null);
          } else {
            console.warn('Logo upload returned null');
          }
        } catch (e) {
          console.warn('Logo upload failed:', e);
        }
      }
      // Never save blob: URLs to database
      if (logoUrl && logoUrl.startsWith('blob:')) {
        logoUrl = null;
      }

      await updateCard(cardId, {
        full_name: fullName.trim(),
        title: titleRole || undefined,
        bio: bio || undefined,
        email: emailField || undefined,
        phone: phoneField || undefined,
        website: websiteField || undefined,
        website_label: websiteLabelField || undefined,
        city: addressField || undefined,
        address_1: address1Field || undefined,
        address_2: address2Field || undefined,
        zip_code: zipCodeField || undefined,
        profile_photo_url: photoUrl || undefined,
        profile_photo_size: profilePhotoSize,
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
        theme: selectedTheme,
        template_id: selectedTemplateId,
        button_style: selectedButtonStyle,
        font_style: selectedFont,
        font_color: fontColor || null,
        banner_image_url: bannerUrl || null,
        company_logo_url: logoUrl || null,
        featured_socials: featuredIcons.length > 0 ? featuredIcons : [],
        gallery_images: uploadedGallery,
        videos: videos,
        show_contact_info: showContactInfo,
        show_social_icons: showSocialIcons,
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
        website_label: websiteLabelField,
        city: addressField,
        address_1: address1Field,
        address_2: address2Field,
        zip_code: zipCodeField,
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

  // Reset card - clears all content fields back to defaults
  const handleResetCard = () => {
    if (!confirm('Are you sure you want to reset this card? This will clear all content (name, title, bio, photo, banner, links, gallery, videos). This cannot be undone.')) return;
    // Clear content fields
    setFullName('');
    setTitleRole('');
    setBio('');
    setEmailField('');
    setPhoneField('');
    setWebsiteField('');
    setWebsiteLabelField('');
    setAddressField('');
    setAddress1Field('');
    setAddress2Field('');
    setZipCodeField('');
    // Clear media
    setProfilePhotoUrl(null);
    setProfilePhotoFile(null);
    setBannerImageUrl(null);
    setBannerImageFile(null);
    setCompanyLogoUrl(null);
    setCompanyLogoFile(null);
    setGalleryImages([]);
    setVideos([]);
    setVideoFile(null);
    // Clear links
    setLinks([]);
    setFeaturedIcons([]);
    // Reset appearance to defaults
    setShowContactInfo(true);
    setShowSocialIcons(true);
  };

  // Photo handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      setBannerImageUrl(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoUrl(URL.createObjectURL(file));
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
      router.push('/app/ecard/premium', undefined, { locale });
      return;
    }
    setLinks([...links, { id: Date.now().toString(), platform, value: '', url: '', title: platform }]);
    setShowAddLink(false);
  };

  const updateLink = (id: string, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, value, url: value } : link));
  };

  const updateLinkTitle = (id: string, title: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, title } : link));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  // Copy card URL
  const copyCardUrl = () => {
    const url = `https://tavvy.com/${cardData?.slug}`;
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
          <input type="file" ref={bannerInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleBannerChange} />
          <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <input type="file" ref={videoInputRef} accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} />

          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.push('/app/ecard', undefined, { locale })}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <h1 style={{ color: isDark ? '#fff' : '#333' }}>Edit Card</h1>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </header>

          {/* Card Preview */}
          <div className="preview-section">
            {(() => {
              const currentTpl = getTemplateById(selectedTemplateId);
              const layout = currentTpl?.layout || 'basic';
              const bgGrad = `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`;
              // Compute if background is light for text contrast
              const hexToLum = (hex: string) => {
                const c = hex.replace('#', '');
                if (c.length < 6) return 0.5;
                const r = parseInt(c.substring(0,2),16)/255;
                const g = parseInt(c.substring(2,4),16)/255;
                const b = parseInt(c.substring(4,6),16)/255;
                const toL = (v: number) => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
                return 0.2126*toL(r) + 0.7152*toL(g) + 0.0722*toL(b);
              };
              const bgLight = (hexToLum(gradientColors[0]) + hexToLum(gradientColors[1])) / 2 > 0.35;
              const txtColor = bgLight ? '#1a1a1a' : '#ffffff';
              const txtSecondary = bgLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';

              const statusBadge = (
                <div className={`status-badge ${cardData?.is_published ? 'published' : 'draft'}`}>
                  {cardData?.is_published ? 'Live' : 'Draft'}
                </div>
              );

              const photoEl = profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="preview-photo" onClick={() => photoInputRef.current?.click()} />
              ) : (
                <div className="preview-photo-placeholder" onClick={() => photoInputRef.current?.click()}>
                  <IoCamera size={24} color={bgLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                </div>
              );

              // ===== BLOGGER =====
              if (layout === 'blogger') {
                return (
                  <div className="card-preview blogger-preview" style={{ background: bgGrad, padding: 0 }}>
                    {statusBadge}
                    <div style={{ paddingTop: 40 }} />
                    <div style={{ background: '#fff', borderRadius: '20px 20px 16px 16px', margin: '0 12px 12px', padding: '48px 16px 20px', position: 'relative', textAlign: 'center' }}>
                      <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)' }}>
                        {profilePhotoUrl ? (
                          <img src={profilePhotoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onClick={() => photoInputRef.current?.click()} />
                        ) : (
                          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }} onClick={() => photoInputRef.current?.click()}>
                            <IoCamera size={24} color="#ccc" />
                          </div>
                        )}
                      </div>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, fontWeight: 600, color: '#333', margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#999', margin: 0 }}>{titleRole}</p>}
                    </div>
                  </div>
                );
              }

              // ===== BUSINESS CARD =====
              if (layout === 'business-card') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Dark top section */}
                    <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', border: `2px solid ${currentTpl?.colorSchemes[0]?.accent || '#C9A84C'}` }} onClick={() => photoInputRef.current?.click()} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => photoInputRef.current?.click()}>
                          <IoCamera size={20} color="rgba(255,255,255,0.5)" />
                        </div>
                      )}
                      <div style={{ textAlign: 'left' }}>
                        <h3 style={{ color: txtColor, fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                        {titleRole && <p style={{ color: txtSecondary, fontSize: 12, margin: 0 }}>{titleRole}</p>}
                      </div>
                    </div>
                    {/* White bottom section */}
                    <div style={{ background: '#fff', padding: '12px 16px 16px', borderRadius: '12px 12px 0 0' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoCall size={14} color="#fff" />
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMail size={14} color="#fff" />
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoGlobe size={14} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===== FULL WIDTH =====
              if (layout === 'full-width') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: 0, overflow: 'hidden', minHeight: 160 }}>
                    {statusBadge}
                    {profilePhotoUrl ? (
                      <div style={{ position: 'relative', height: 120 }}>
                        <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => photoInputRef.current?.click()} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
                      </div>
                    ) : (
                      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => photoInputRef.current?.click()}>
                        <IoCamera size={32} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                    <div style={{ padding: '12px 16px 16px' }}>
                      <h3 style={{ color: txtColor, fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ color: txtSecondary, fontSize: 13, margin: 0 }}>{titleRole}</p>}
                    </div>
                  </div>
                );
              }

              // ===== PRO REALTOR =====
              if (layout === 'pro-realtor') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: '20px 16px', textAlign: 'center' }}>
                    {statusBadge}
                    {profilePhotoUrl ? (
                      <div style={{ width: 72, height: 72, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', overflow: 'hidden', margin: '0 auto 10px', border: '3px solid rgba(255,255,255,0.3)' }}>
                        <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => photoInputRef.current?.click()} />
                      </div>
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: 'rgba(255,255,255,0.1)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => photoInputRef.current?.click()}>
                        <IoCamera size={24} color="rgba(255,255,255,0.5)" />
                      </div>
                    )}
                    <p style={{ color: txtSecondary, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 2px' }}>HI, I'M</p>
                    <h3 style={{ color: txtColor, fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                    {titleRole && <p style={{ color: txtSecondary, fontSize: 13, margin: 0 }}>{titleRole}</p>}
                  </div>
                );
              }

              // ===== PRO CREATIVE =====
              if (layout === 'pro-creative') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <h3 style={{ color: txtColor, fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                        {titleRole && <p style={{ color: txtSecondary, fontSize: 12, margin: 0 }}>{titleRole}</p>}
                      </div>
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} onClick={() => photoInputRef.current?.click()} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => photoInputRef.current?.click()}>
                          <IoCamera size={20} color="rgba(255,255,255,0.5)" />
                        </div>
                      )}
                    </div>
                    {/* Wave divider */}
                    <svg viewBox="0 0 400 30" style={{ display: 'block', width: '100%' }}>
                      <path d="M0,15 Q100,0 200,15 T400,15 L400,30 L0,30 Z" fill="#fff" />
                    </svg>
                    <div style={{ background: '#fff', padding: '8px 16px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoCall size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMail size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoGlobe size={12} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===== PRO CORPORATE =====
              if (layout === 'pro-corporate') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: 40, border: `2px solid ${bgLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }} />
                    <div style={{ position: 'absolute', top: 10, right: -15, width: 60, height: 60, borderRadius: 30, border: `2px solid ${bgLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }} />
                    {photoEl}
                    <h3 style={{ color: txtColor, fontSize: 18, fontWeight: 700, margin: '0 0 2px', position: 'relative', zIndex: 1 }}>{fullName || 'Your Name'}</h3>
                    {titleRole && <p style={{ color: txtSecondary, fontSize: 13, margin: 0, position: 'relative', zIndex: 1 }}>{titleRole}</p>}
                  </div>
                );
              }

              // ===== PRO CARD =====
              if (layout === 'pro-card') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Banner area */}
                    {bannerImageUrl ? (
                      <div style={{ height: 80, position: 'relative' }}>
                        <img src={bannerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${gradientColors[0]})` }} />
                      </div>
                    ) : (
                      <div style={{ height: 40 }} />
                    )}
                    {/* Photo overlapping */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: bannerImageUrl ? -28 : 0, marginBottom: 8, position: 'relative', zIndex: 2 }}>
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', border: `3px solid ${currentTpl?.colorSchemes[0]?.accent || '#C9A84C'}` }} onClick={() => photoInputRef.current?.click()} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${currentTpl?.colorSchemes[0]?.accent || '#C9A84C'}` }} onClick={() => photoInputRef.current?.click()}>
                          <IoCamera size={20} color="rgba(255,255,255,0.5)" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
                      <h3 style={{ color: txtColor, fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ color: txtSecondary, fontSize: 12, margin: 0 }}>{titleRole}</p>}
                    </div>
                  </div>
                );
              }

              // ===== BIZ TRADITIONAL =====
              if (layout === 'biz-traditional') {
                return (
                  <div className="card-preview" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Colored header band */}
                    <div style={{ background: bgGrad, padding: '16px 16px 24px', position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IoBusinessOutline size={14} color="rgba(255,255,255,0.8)" />
                      </div>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0 }}>{titleRole}</p>}
                      {/* Photo circle on right */}
                      <div style={{ position: 'absolute', bottom: -20, right: 16 }}>
                        {profilePhotoUrl ? (
                          <img src={profilePhotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '3px solid #fff' }} onClick={() => photoInputRef.current?.click()} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }} onClick={() => photoInputRef.current?.click()}>
                            <IoCamera size={16} color="#9ca3af" />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* White bottom */}
                    <div style={{ padding: '28px 16px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoCall size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMail size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoGlobe size={12} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===== BIZ MODERN =====
              if (layout === 'biz-modern') {
                return (
                  <div className="card-preview" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Colored top with diagonal or banner image */}
                    <div style={{ background: bannerImageUrl ? 'none' : bgGrad, padding: bannerImageUrl ? 0 : '16px', minHeight: 80, position: 'relative', overflow: 'hidden' }}>
                      {bannerImageUrl && (
                        <>
                          <img src={bannerImageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)' }} />
                        </>
                      )}
                      <div style={{ position: bannerImageUrl ? 'absolute' : 'relative' as any, bottom: bannerImageUrl ? 0 : undefined, left: 0, right: 0, padding: '16px' }}>
                      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0 }}>{titleRole}</p>}
                      {/* Photo on right */}
                      <div style={{ position: 'absolute', bottom: -16, right: 16 }}>
                        {profilePhotoUrl ? (
                          <img src={profilePhotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: '3px solid #fff' }} onClick={() => photoInputRef.current?.click()} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }} onClick={() => photoInputRef.current?.click()}>
                            <IoCamera size={16} color="#9ca3af" />
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                    {/* Diagonal transition */}
                    <svg viewBox="0 0 400 20" style={{ display: 'block', width: '100%', marginTop: -1 }}>
                      <path d="M0,0 L400,0 L400,20 L0,0 Z" fill={gradientColors[0]} />
                    </svg>
                    {/* White bottom */}
                    <div style={{ padding: '12px 16px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoCall size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMail size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: gradientColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoGlobe size={12} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===== BIZ MINIMALIST =====
              if (layout === 'biz-minimalist') {
                return (
                  <div className="card-preview" style={{ background: '#fff', padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Thin accent line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: bgGrad }} />
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', marginBottom: 8 }} onClick={() => photoInputRef.current?.click()} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, margin: '0 auto 8px' }} onClick={() => photoInputRef.current?.click()}>
                        <IoCamera size={16} color="#9ca3af" />
                      </div>
                    )}
                    <h3 style={{ color: '#1f2937', fontSize: 16, fontWeight: 600, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                    {titleRole && <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>{titleRole}</p>}
                  </div>
                );
              }

              // ===== COVER CARD =====
              if (layout === 'cover-card') {
                return (
                  <div className="card-preview" style={{ background: '#fff', padding: 0, overflow: 'hidden' }}>
                    {statusBadge}
                    {/* Cover photo area */}
                    {bannerImageUrl ? (
                      <div style={{ height: 100, position: 'relative' }}>
                        <img src={bannerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : profilePhotoUrl ? (
                      <div style={{ height: 100, position: 'relative' }}>
                        <img src={profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => photoInputRef.current?.click()} />
                      </div>
                    ) : (
                      <div style={{ height: 80, background: bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IoCamera size={28} color="rgba(255,255,255,0.4)" />
                      </div>
                    )}
                    {/* Wave transition */}
                    <svg viewBox="0 0 400 20" style={{ display: 'block', width: '100%', marginTop: -10 }}>
                      <path d="M0,20 Q100,0 200,10 T400,0 L400,20 Z" fill="#fff" />
                    </svg>
                    <div style={{ padding: '4px 16px 16px' }}>
                      <h3 style={{ color: '#1f2937', fontSize: 15, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                      {titleRole && <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>{titleRole}</p>}
                    </div>
                  </div>
                );
              }

              // ===== PREMIUM STATIC =====
              if (layout === 'premium-static') {
                return (
                  <div className="card-preview" style={{ background: bgGrad, padding: 0, overflow: 'hidden', minHeight: 160 }}>
                    {statusBadge}
                    {bannerImageUrl ? (
                      <div style={{ position: 'relative', height: 120 }}>
                        <img src={bannerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
                        <div style={{ position: 'absolute', bottom: 8, left: 12 }}>
                          <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{fullName || 'Your Name'}</h3>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                        {photoEl}
                        <h3 style={{ color: txtColor, fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{fullName || 'Your Name'}</h3>
                        {titleRole && <p style={{ color: txtSecondary, fontSize: 12, margin: 0 }}>{titleRole}</p>}
                      </div>
                    )}
                    <div style={{ padding: '8px 16px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoCall size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoMail size={12} color="#fff" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoGlobe size={12} color="#fff" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ===== BASIC (default) =====
              return (
                <div className="card-preview" style={{ background: bgGrad, padding: '24px 16px', textAlign: 'center' }}>
                  {statusBadge}
                  {photoEl}
                  <h3 style={{ color: txtColor, fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>{fullName || 'Your Name'}</h3>
                  {titleRole && <p style={{ color: txtSecondary, fontSize: 14, margin: 0 }}>{titleRole}</p>}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="preview-actions">
              <button className="action-btn" onClick={() => router.push(`/app/ecard/preview?cardId=${cardId}`, undefined, { locale })}>
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
              <button className="action-btn reset" onClick={handleResetCard}>
                <IoRefresh size={18} />
                <span>Reset</span>
              </button>
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
            <button 
              className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              <IoMail size={16} />
              <span>Inbox</span>
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
                  <div className="section-header-toggle">
                    <h3 style={{ color: isDark ? '#fff' : '#333' }}>Contact Info</h3>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showContactInfo} onChange={(e) => setShowContactInfo(e.target.checked)} />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{showContactInfo ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </div>
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
                  {websiteField && (
                    <div className="field-group">
                      <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Website Label <span style={{ fontSize: 11, opacity: 0.7 }}>(optional)</span></label>
                      <input
                        type="text"
                        value={websiteLabelField}
                        onChange={(e) => setWebsiteLabelField(e.target.value)}
                        placeholder="e.g. My Portfolio, Book Appointment"
                        className="field-input"
                        style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                      />
                    </div>
                  )}
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
                  <div className="field-group">
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Street Address <span style={{ fontSize: 11, opacity: 0.6 }}>(optional — fills in, full address displays on card)</span></label>
                    <input
                      type="text"
                      value={address1Field}
                      onChange={(e) => setAddress1Field(e.target.value)}
                      placeholder="123 Main Street"
                      className="field-input"
                      style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                    />
                  </div>
                  {address1Field && (
                    <>
                      <div className="field-group">
                        <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Apt / Suite <span style={{ fontSize: 11, opacity: 0.6 }}>(optional)</span></label>
                        <input
                          type="text"
                          value={address2Field}
                          onChange={(e) => setAddress2Field(e.target.value)}
                          placeholder="Apt 4B"
                          className="field-input"
                          style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                        />
                      </div>
                      <div className="field-group">
                        <label style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Zip Code <span style={{ fontSize: 11, opacity: 0.6 }}>(optional)</span></label>
                        <input
                          type="text"
                          value={zipCodeField}
                          onChange={(e) => setZipCodeField(e.target.value)}
                          placeholder="33139"
                          className="field-input"
                          style={{ backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#333' }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Featured Social Icons */}
                <div className="section">
                  <div className="section-header-toggle">
                    <h3 style={{ color: isDark ? '#fff' : '#333' }}>Featured Social Icons <span className="hint">(up to 4)</span></h3>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showSocialIcons} onChange={(e) => setShowSocialIcons(e.target.checked)} />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{showSocialIcons ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </div>
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
                        <input
                          type="text"
                          className="link-title-input"
                          value={link.title || ''}
                          onChange={(e) => updateLinkTitle(link.id, e.target.value)}
                          placeholder={platform?.name || 'Link Title'}
                          style={{ color: isDark ? '#fff' : '#333', fontWeight: 600, fontSize: '15px', border: 'none', background: 'transparent', padding: '0', width: '100%', outline: 'none' }}
                        />
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
                    onClick={() => canAddMoreLinks ? setShowAddLink(true) : router.push('/app/ecard/premium', undefined, { locale })}
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
                    {links.length}/{FREE_LINK_LIMIT} links used • <a onClick={() => router.push('/app/ecard/premium', undefined, { locale })}>Upgrade for unlimited</a>
                  </p>
                )}
              </div>
            )}

            {/* ── Appearance Tab ── */}
            {activeTab === 'appearance' && (
              <div className="appearance-tab">
                {/* Template Selector */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Card Layout</h3>
                  <p style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: '13px', marginBottom: '12px' }}>
                    Choose how your card looks. Each template has a unique layout.
                  </p>
                  <div className="template-grid">
                    {TEMPLATES.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      const isLocked = template.isPremium && !isPro;
                      return (
                        <button
                          key={template.id}
                          className={`template-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                          onClick={() => {
                            if (isLocked) {
                              router.push('/app/ecard/premium', undefined, { locale });
                              return;
                            }
                            setSelectedTemplateId(template.id);
                            // Apply default color scheme
                            const defaultScheme = template.colorSchemes[0];
                            if (defaultScheme) {
                              setGradientColors([defaultScheme.primary, defaultScheme.secondary]);
                            }
                          }}
                          style={{
                            backgroundColor: isDark ? '#1E293B' : '#fff',
                            borderColor: isSelected ? ACCENT_GREEN : (isDark ? '#334155' : '#E5E7EB'),
                          }}
                        >
                          {/* Template Preview Mini */}
                          <div className="template-preview-mini" style={{
                            background: template.layout === 'blogger'
                              ? (template.colorSchemes[0]?.background || '#fce4ec')
                              : `linear-gradient(135deg, ${template.colorSchemes[0]?.primary || '#667eea'}, ${template.colorSchemes[0]?.secondary || '#764ba2'})`,
                          }}>
                            {/* Basic: circle photo + name + link buttons */}
                            {template.layout === 'basic' && (
                              <>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', margin: '8px auto 4px' }} />
                                <div style={{ width: '50%', height: 3, background: 'rgba(255,255,255,0.5)', margin: '0 auto 3px', borderRadius: 2 }} />
                                <div style={{ width: '70%', height: 6, background: 'rgba(255,255,255,0.2)', margin: '2px auto', borderRadius: 3 }} />
                                <div style={{ width: '70%', height: 6, background: 'rgba(255,255,255,0.15)', margin: '2px auto', borderRadius: 3 }} />
                                <div style={{ width: '70%', height: 6, background: 'rgba(255,255,255,0.12)', margin: '2px auto', borderRadius: 3 }} />
                              </>
                            )}
                            {/* Blogger: white card cutout, circle photo, pastel buttons */}
                            {template.layout === 'blogger' && (
                              <div style={{ background: '#fff', borderRadius: 6, margin: 5, padding: 5, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E5E7EB', margin: '2px auto 3px' }} />
                                <div style={{ width: '55%', height: 2, background: '#333', margin: '0 auto 2px', borderRadius: 2 }} />
                                <div style={{ width: '70%', height: 5, background: template.colorSchemes[0]?.accent ? `${template.colorSchemes[0].accent}30` : '#f0e0e0', margin: '2px auto', borderRadius: 2 }} />
                                <div style={{ width: '70%', height: 5, background: template.colorSchemes[0]?.accent ? `${template.colorSchemes[0].accent}25` : '#f0e0e0', margin: '2px auto', borderRadius: 2 }} />
                              </div>
                            )}
                            {/* Business Card: dark top with name + photo, light bottom with contacts */}
                            {template.layout === 'business-card' && (
                              <>
                                <div style={{ flex: 1, display: 'flex', padding: '6px 5px 0', gap: 4 }}>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ width: '80%', height: 3, background: template.colorSchemes[0]?.accent || '#d4af37', borderRadius: 2 }} />
                                    <div style={{ width: '60%', height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                                  </div>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: `1px solid ${template.colorSchemes[0]?.accent || '#d4af37'}` }} />
                                </div>
                                <div style={{ background: '#f8f8f8', margin: '3px 0 0', padding: '4px 5px', borderRadius: '0 0 4px 4px' }}>
                                  <div style={{ width: '70%', height: 2, background: '#ccc', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '50%', height: 2, background: '#ddd', borderRadius: 2 }} />
                                </div>
                              </>
                            )}
                            {/* Full Width: hero photo with gradient overlay + name */}
                            {template.layout === 'full-width' && (
                              <>
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                                <div style={{ position: 'absolute', bottom: 20, left: 6, width: '60%', height: 5, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                                <div style={{ position: 'absolute', bottom: 12, left: 6, width: '40%', height: 3, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                                <div style={{ position: 'absolute', bottom: 3, left: 6, display: 'flex', gap: 2 }}>
                                  {[1,2,3,4].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)' }} />)}
                                </div>
                              </>
                            )}
                            {/* Pro Realtor: arch photo + intro text + buttons */}
                            {template.layout === 'pro-realtor' && (
                              <>
                                <div style={{ height: '35%', background: 'rgba(255,255,255,0.12)', borderRadius: '4px 4px 0 0' }} />
                                <div style={{ width: 22, height: 22, borderRadius: '6px 6px 50% 50%', background: 'rgba(255,255,255,0.3)', margin: '-8px auto 3px', border: '2px solid rgba(255,255,255,0.5)' }} />
                                <div style={{ width: '65%', height: 5, background: `${template.colorSchemes[0]?.accent || '#c8a87c'}60`, margin: '2px auto', borderRadius: 2 }} />
                                <div style={{ width: '65%', height: 5, background: `${template.colorSchemes[0]?.accent || '#c8a87c'}40`, margin: '2px auto', borderRadius: 2 }} />
                              </>
                            )}
                            {/* Pro Creative: bold top + wave divider + contacts */}
                            {template.layout === 'pro-creative' && (
                              <>
                                <div style={{ height: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.3)' }} />
                                </div>
                                <svg viewBox="0 0 60 8" style={{ width: '100%', height: 8 }}><path d="M0 4 Q15 0 30 4 Q45 8 60 4 L60 8 L0 8 Z" fill="white" opacity="0.9" /></svg>
                                <div style={{ background: '#fff', flex: 1, padding: '3px 5px' }}>
                                  <div style={{ width: '60%', height: 2, background: '#333', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '80%', height: 2, background: '#ddd', borderRadius: 2 }} />
                                </div>
                              </>
                            )}
                            {/* Pro Corporate: logo + photo + structured layout */}
                            {template.layout === 'pro-corporate' && (
                              <>
                                <div style={{ width: 14, height: 6, background: 'rgba(255,255,255,0.4)', borderRadius: 2, margin: '6px auto 4px' }} />
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', margin: '0 auto 3px' }} />
                                <div style={{ width: '55%', height: 3, background: 'rgba(255,255,255,0.5)', margin: '0 auto 2px', borderRadius: 2 }} />
                                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 2 }}>
                                  {[1,2,3,4].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)' }} />)}
                                </div>
                              </>
                            )}
                            {/* Pro Card: banner + photo + industry + services grid */}
                            {template.layout === 'pro-card' && (
                              <>
                                <div style={{ height: '30%', background: 'rgba(255,255,255,0.15)', borderRadius: '4px 4px 0 0' }} />
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', margin: '-8px auto 2px', border: '2px solid rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }} />
                                <div style={{ width: '50%', height: 2, background: 'rgba(255,255,255,0.5)', margin: '0 auto 3px', borderRadius: 2 }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, margin: '0 5px', flex: 1 }}>
                                  <div style={{ background: `${template.colorSchemes[0]?.accent || '#fbbf24'}30`, borderRadius: 2 }} />
                                  <div style={{ background: `${template.colorSchemes[0]?.accent || '#fbbf24'}25`, borderRadius: 2 }} />
                                </div>
                              </>
                            )}
                            {/* BIZ TRADITIONAL */}
                            {template.layout === 'biz-traditional' && (
                              <>
                                <div style={{ background: template.colorSchemes[0]?.primary || '#1e3a5f', padding: '6px 5px 10px', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.25)', marginBottom: 4 }} />
                                  <div style={{ width: '55%', height: 3, background: 'rgba(255,255,255,0.7)', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '35%', height: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                                  <div style={{ position: 'absolute', bottom: -6, right: 6, width: 16, height: 16, borderRadius: 8, background: '#e5e7eb', border: '2px solid #fff' }} />
                                </div>
                                <div style={{ background: '#fff', padding: '10px 5px 5px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: template.colorSchemes[0]?.primary || '#1e3a5f' }} />)}
                                  </div>
                                </div>
                              </>
                            )}
                            {/* BIZ MODERN */}
                            {template.layout === 'biz-modern' && (
                              <>
                                <div style={{ background: template.colorSchemes[0]?.primary || '#1e40af', padding: '8px 5px', minHeight: 28, position: 'relative' }}>
                                  <div style={{ width: '55%', height: 3, background: 'rgba(255,255,255,0.7)', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '35%', height: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                                  <div style={{ position: 'absolute', bottom: -6, right: 6, width: 16, height: 16, borderRadius: 8, background: '#e5e7eb', border: '2px solid #fff' }} />
                                </div>
                                <svg viewBox="0 0 60 8" style={{ display: 'block', width: '100%', marginTop: -1 }}>
                                  <path d="M0,0 L60,0 L60,8 L0,0 Z" fill={template.colorSchemes[0]?.primary || '#1e40af'} />
                                </svg>
                                <div style={{ background: '#fff', padding: '6px 5px 5px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: template.colorSchemes[0]?.primary || '#1e40af' }} />)}
                                  </div>
                                </div>
                              </>
                            )}
                            {/* BIZ MINIMALIST */}
                            {template.layout === 'biz-minimalist' && (
                              <>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: template.colorSchemes[0]?.primary || '#374151' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '8px 5px' }}>
                                  <div style={{ width: 16, height: 16, borderRadius: 4, background: '#f3f4f6', marginBottom: 4 }} />
                                  <div style={{ width: '50%', height: 2, background: '#374151', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '35%', height: 2, background: '#9ca3af', borderRadius: 2 }} />
                                </div>
                              </>
                            )}
                            {/* COVER CARD */}
                            {template.layout === 'cover-card' && (
                              <>
                                <div style={{ height: '45%', background: `linear-gradient(135deg, ${template.colorSchemes[0]?.primary || '#6366f1'}, ${template.colorSchemes[0]?.accent || '#f97316'})`, position: 'relative' }} />
                                <svg viewBox="0 0 60 8" style={{ display: 'block', width: '100%', marginTop: -4 }}>
                                  <path d="M0,8 Q15,0 30,4 T60,0 L60,8 Z" fill="#fff" />
                                </svg>
                                <div style={{ background: '#fff', padding: '4px 5px 5px', flex: 1 }}>
                                  <div style={{ width: '55%', height: 2, background: '#374151', borderRadius: 2, marginBottom: 2 }} />
                                  <div style={{ width: '35%', height: 2, background: '#9ca3af', borderRadius: 2 }} />
                                </div>
                              </>
                            )}
                            {/* PREMIUM STATIC */}
                            {template.layout === 'premium-static' && (
                              <>
                                <div style={{ height: '55%', background: `linear-gradient(135deg, ${template.colorSchemes[0]?.primary || '#0f172a'}, ${template.colorSchemes[0]?.accent || '#C9A84C'})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 5px 4px' }}>
                                  <div style={{ width: '50%', height: 2, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                                </div>
                                <div style={{ padding: '4px 5px', flex: 1, display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
                                  {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.15)' }} />)}
                                </div>
                              </>
                            )}
                          </div>
                          <span className="template-name" style={{ color: isDark ? '#fff' : '#333' }}>
                            {template.name}
                          </span>
                          {isLocked && (
                            <span className="template-lock">
                              <IoLockClosed size={10} />
                              {template.category === 'paid' ? 'Pro' : 'Premium'}
                            </span>
                          )}
                          {isSelected && (
                            <span className="template-check">
                              <IoCheckmark size={12} color="#fff" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Banner Image</h3>
                  <p style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: '13px', marginBottom: '12px' }}>
                    Add a cover photo to your card. Works with Banner, Bold, Modern, and other templates.
                  </p>
                  {bannerImageUrl ? (
                    <div className="banner-preview">
                      <img src={bannerImageUrl} alt="Banner" className="banner-img" />
                      <div className="banner-actions">
                        <button onClick={() => bannerInputRef.current?.click()} className="banner-action-btn">
                          <IoCamera size={16} /> Change
                        </button>
                        <button onClick={() => { setBannerImageUrl(null); setBannerImageFile(null); }} className="banner-action-btn remove">
                          <IoClose size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="banner-upload-btn"
                      onClick={() => bannerInputRef.current?.click()}
                      style={{ backgroundColor: isDark ? '#1E293B' : '#F3F4F6', color: isDark ? '#94A3B8' : '#6B7280' }}
                    >
                      <IoImage size={24} />
                      <span>Upload Banner Image</span>
                      <span style={{ fontSize: '11px' }}>Recommended: 1200 x 400px</span>
                    </button>
                  )}
                </div>

                {/* Company Logo Upload */}
                {(selectedTemplateId === 'biz-traditional' || selectedTemplateId === 'biz-modern' || selectedTemplateId === 'biz-minimalist' || selectedTemplateId === 'pro-card' || selectedTemplateId === 'cover-card') && (
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Company Logo</h3>
                  <p style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: '13px', marginBottom: '12px' }}>
                    Upload your company logo. PNG with transparent background recommended.
                  </p>
                  {companyLogoUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#1E293B' : '#f9fafb' }}>
                        <img src={companyLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => logoInputRef.current?.click()} className="banner-action-btn">
                          <IoCamera size={14} /> Change
                        </button>
                        <button onClick={() => { setCompanyLogoUrl(null); setCompanyLogoFile(null); }} className="banner-action-btn remove">
                          <IoClose size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="banner-upload-btn"
                      onClick={() => logoInputRef.current?.click()}
                      style={{ backgroundColor: isDark ? '#1E293B' : '#F3F4F6', color: isDark ? '#94A3B8' : '#6B7280', height: 60 }}
                    >
                      <IoImage size={20} />
                      <span>Upload Company Logo</span>
                    </button>
                  )}
                </div>
                )}

                {/* Color Scheme */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Color</h3>
                  {(() => {
                    const currentTemplate = getTemplateById(selectedTemplateId);
                    if (!currentTemplate) return null;
                    return (
                      <div className="color-scheme-grid">
                        {currentTemplate.colorSchemes.map((scheme) => (
                          <button
                            key={scheme.id}
                            className={`color-scheme-btn ${gradientColors[0] === scheme.primary && gradientColors[1] === scheme.secondary ? 'selected' : ''}`}
                            onClick={() => setGradientColors([scheme.primary, scheme.secondary])}
                          >
                            <div className="color-swatch" style={{ background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})` }} />
                            <span style={{ color: isDark ? '#ccc' : '#555', fontSize: '11px' }}>{scheme.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: '13px' }}>Custom:</label>
                    <input
                      type="color"
                      value={gradientColors[0]}
                      onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                      style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'none' }}
                    />
                    <input
                      type="color"
                      value={gradientColors[1]}
                      onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                      style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'none' }}
                    />
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

                {/* Font Color */}
                <div className="section">
                  <h3 style={{ color: isDark ? '#fff' : '#333' }}>Font Color</h3>
                  <div className="font-color-options">
                    <button
                      className={`font-color-btn ${!fontColor ? 'selected' : ''}`}
                      onClick={() => setFontColor(null)}
                      style={{
                        backgroundColor: !fontColor ? ACCENT_GREEN : (isDark ? '#1E293B' : '#F3F4F6'),
                        color: !fontColor ? '#fff' : (isDark ? '#fff' : '#333'),
                      }}
                    >
                      Auto
                    </button>
                    {[
                      { id: '#FFFFFF', name: 'White', preview: '#FFFFFF' },
                      { id: '#000000', name: 'Black', preview: '#000000' },
                      { id: '#1f2937', name: 'Dark Gray', preview: '#1f2937' },
                      { id: '#d4af37', name: 'Gold', preview: '#d4af37' },
                    ].map((color) => (
                      <button
                        key={color.id}
                        className={`font-color-btn ${fontColor === color.id ? 'selected' : ''}`}
                        onClick={() => setFontColor(color.id)}
                        style={{
                          backgroundColor: fontColor === color.id ? ACCENT_GREEN : (isDark ? '#1E293B' : '#F3F4F6'),
                          color: fontColor === color.id ? '#fff' : (isDark ? '#fff' : '#333'),
                        }}
                      >
                        <span style={{
                          display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%',
                          backgroundColor: color.preview, border: '1px solid rgba(128,128,128,0.3)',
                          marginRight: '6px', verticalAlign: 'middle',
                        }} />
                        {color.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: '13px' }}>Custom:</label>
                    <input
                      type="color"
                      value={fontColor || '#FFFFFF'}
                      onChange={(e) => setFontColor(e.target.value)}
                      style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px', background: 'none' }}
                    />
                  </div>
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
                    <button onClick={() => router.push('/app/ecard/premium', undefined, { locale })}>
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* ── Inbox Tab ── */}
            {activeTab === 'inbox' && cardId && (
              <ECardInbox cardId={cardId} isDark={isDark} />
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
                    tavvy.com/
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

          .action-btn.reset {
            background: ${isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)'};
            color: #EF4444;
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

          .section-header-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }

          .section-header-toggle h3 {
            margin: 0;
          }

          .toggle-switch {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }

          .toggle-switch input {
            display: none;
          }

          .toggle-slider {
            width: 44px;
            height: 24px;
            background-color: ${isDark ? '#374151' : '#D1D5DB'};
            border-radius: 12px;
            position: relative;
            transition: background-color 0.2s;
          }

          .toggle-slider::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.2s;
          }

          .toggle-switch input:checked + .toggle-slider {
            background-color: #22C55E;
          }

          .toggle-switch input:checked + .toggle-slider::after {
            transform: translateX(20px);
          }

          .toggle-label {
            font-size: 12px;
            font-weight: 500;
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
          .template-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .template-card {
            position: relative;
            border: 2px solid;
            border-radius: 12px;
            padding: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }

          .template-card.selected {
            border-color: ${ACCENT_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(0,200,83,0.2);
          }

          .template-card.locked {
            opacity: 0.6;
          }

          .template-preview-mini {
            width: 100%;
            height: 80px;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .template-name {
            font-size: 11px;
            font-weight: 600;
            text-align: center;
          }

          .template-lock {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0,0,0,0.6);
            color: #fff;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 3px;
          }

          .template-check {
            position: absolute;
            top: 4px;
            left: 4px;
            background: ${ACCENT_GREEN};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Banner Upload */
          .banner-preview {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
          }

          .banner-img {
            width: 100%;
            height: 160px;
            object-fit: cover;
            display: block;
          }

          .banner-actions {
            position: absolute;
            bottom: 8px;
            right: 8px;
            display: flex;
            gap: 6px;
          }

          .banner-action-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border-radius: 8px;
            border: none;
            background: rgba(0,0,0,0.6);
            color: #fff;
            font-size: 12px;
            cursor: pointer;
            backdrop-filter: blur(4px);
          }

          .banner-action-btn.remove {
            background: rgba(239,68,68,0.8);
          }

          .banner-upload-btn {
            width: 100%;
            height: 120px;
            border: 2px dashed ${isDark ? '#334155' : '#D1D5DB'};
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
          }

          .banner-upload-btn:hover {
            border-color: ${ACCENT_GREEN};
          }

          /* Color Scheme Grid */
          .color-scheme-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .color-scheme-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 4px;
            border: 2px solid transparent;
            border-radius: 10px;
            background: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .color-scheme-btn.selected {
            border-color: ${ACCENT_GREEN};
          }

          .color-swatch {
            width: 44px;
            height: 44px;
            border-radius: 22px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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

          .font-color-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .font-color-btn {
            padding: 8px 14px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
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


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
