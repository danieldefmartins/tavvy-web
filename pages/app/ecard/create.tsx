/**
 * eCard Create Screen - Live Card Editor
 * 
 * Single screen experience:
 * - One full card on screen at a time
 * - Swipe left/right to change template
 * - Edit directly on the card (tap fields to type)
 * - Tap photo to upload; tap "change size" to open size picker (always available)
 * - 4 independent featured social icon slots (centered row, tap to pick platform)
 * - Links section separate from featured icons
 * - Bottom bar: color picker + template arrows
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { 
  createCard, 
  generateSlug, 
  uploadProfilePhoto,
  uploadEcardFile,
  saveCardLinks,
  updateCard,
  PLATFORM_ICONS, 
  CardData, 
  LinkItem as ECardLink,
} from '../../../lib/ecard';
import { TEMPLATES, ColorScheme, Template } from '../../../config/eCardTemplates';
import { 
  IoArrowBack, 
  IoChevronBack,
  IoChevronForward,
  IoCamera,
  IoClose,
  IoAdd,
  IoTrash,
  IoImage,
  IoMail,
  IoGlobe,
  IoCall,
  IoLocationOutline,
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoYoutube,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoFacebook,
  IoLogoWhatsapp,
  IoColorPalette,
  IoSave,
  IoImages,
  IoLink,
  IoExpand,
  IoLockClosed,
  IoVideocam,
  IoPlay,
  IoFilm,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';

const PHOTO_SIZE_OPTIONS = [
  { id: 'small', label: 'Small', size: 80 },
  { id: 'medium', label: 'Medium', size: 120 },
  { id: 'large', label: 'Large', size: 160 },
  { id: 'xl', label: 'Extra Large', size: 200 },
  { id: 'cover', label: 'Cover', size: -1 },
];

// Platforms available for the 4 featured icon slots
const FEATURED_ICON_PLATFORMS = [
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

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', placeholder: '@handle' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'Profile URL' },
  { id: 'facebook', name: 'Facebook', placeholder: 'Profile URL' },
  { id: 'whatsapp', name: 'WhatsApp', placeholder: 'Phone number' },
  { id: 'website', name: 'Website', placeholder: 'https://...' },
  { id: 'email', name: 'Email', placeholder: 'email@example.com' },
  { id: 'phone', name: 'Phone', placeholder: '+1 (555) 123-4567' },
];

interface LinkData {
  id: string;
  platform: string;
  value: string;
}

interface FeaturedIcon {
  platform: string;
  url: string;
}

interface VideoData {
  type: 'youtube' | 'tavvy_short' | 'external';
  url: string;
  file?: File;
}

function getSocialIcon(pid: string, size = 18) {
  const m: Record<string, React.ReactNode> = {
    instagram: <IoLogoInstagram size={size} />,
    tiktok: <IoLogoTiktok size={size} />,
    youtube: <IoLogoYoutube size={size} />,
    twitter: <IoLogoTwitter size={size} />,
    linkedin: <IoLogoLinkedin size={size} />,
    facebook: <IoLogoFacebook size={size} />,
    whatsapp: <IoLogoWhatsapp size={size} />,
    website: <IoGlobe size={size} />,
    email: <IoMail size={size} />,
    phone: <IoCall size={size} />,
  };
  return m[pid] || <IoGlobe size={size} />;
}

export default function ECardCreateScreen() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);

  // Template & color
  const [templateIndex, setTemplateIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  // Card data
  const [name, setName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [photoSizeIndex, setPhotoSizeIndex] = useState(1);

  // Featured social icons (independent, up to 4, each with a URL)
  const [featuredIcons, setFeaturedIcons] = useState<FeaturedIcon[]>([]);
  const [showFeaturedIconPicker, setShowFeaturedIconPicker] = useState(false);

  // Video section
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [showVideoTypePicker, setShowVideoTypePicker] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Links (separate from featured icons)
  const [links, setLinks] = useState<LinkData[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);

  // Gallery
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Photo size picker
  const [showPhotoSizePicker, setShowPhotoSizePicker] = useState(false);

  // ── Restore saved card data after login redirect ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecard_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.name) setName(draft.name);
        if (draft.titleRole) setTitleRole(draft.titleRole);
        if (draft.bio) setBio(draft.bio);
        if (draft.email) setEmail(draft.email);
        if (draft.phone) setPhone(draft.phone);
        if (draft.website) setWebsite(draft.website);
        if (draft.address) setAddress(draft.address);
        if (typeof draft.templateIndex === 'number') setTemplateIndex(draft.templateIndex);
        if (typeof draft.colorIndex === 'number') setColorIndex(draft.colorIndex);
        if (typeof draft.photoSizeIndex === 'number') setPhotoSizeIndex(draft.photoSizeIndex);
        if (Array.isArray(draft.featuredIcons)) {
          // Normalize: handle both flat strings and objects
          setFeaturedIcons(draft.featuredIcons.map((item: any) => 
            typeof item === 'string' ? { platform: item, url: '' } : item
          ));
        }
        if (Array.isArray(draft.links)) setLinks(draft.links);
        if (Array.isArray(draft.videos)) setVideos(draft.videos);
        if (draft.profileImage) setProfileImage(draft.profileImage);
        // Clear the draft after restoring
        localStorage.removeItem('ecard_draft');
      }
    } catch (e) {
      console.warn('Could not restore eCard draft:', e);
    }
  }, []);


  const template = TEMPLATES[templateIndex];
  const colorSchemes = template?.colorSchemes || [];
  const color = colorSchemes[colorIndex] || colorSchemes[0];
  // Premium check deferred to upsell — let users design freely
  const usesPremiumTemplate = template?.isPremium || false;

  // Auto-compute contrast text color based on background luminance
  const hexToLum = (hex: string): number => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 0.5;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const toL = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
  };
  const p1 = color?.primary || '#667eea';
  const p2 = color?.secondary || '#764ba2';
  const avgLum = (hexToLum(p1.startsWith('#') ? p1 : '#667eea') + hexToLum(p2.startsWith('#') ? p2 : '#764ba2')) / 2;
  const isLight = avgLum > 0.45;
  const cardBg = color?.background?.includes('gradient')
    ? color.background
    : color?.cardBg && color.cardBg !== 'transparent'
      ? color.cardBg
      : `linear-gradient(180deg, ${color?.primary}, ${color?.secondary})`;
  const txtColor = isLight ? '#1A1A1A' : '#FFFFFF';
  const txtSecondary = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)';
  const accentColor = color?.accent || 'rgba(255,255,255,0.2)';
  const btnRadius = template?.layout?.buttonStyle === 'pill' ? 24
    : template?.layout?.buttonStyle === 'square' ? 4
    : template?.layout?.buttonStyle === 'outline' ? 12 : 12;
  const isOutline = template?.layout?.buttonStyle === 'outline';
  const isFrosted = template?.layout?.buttonStyle === 'frosted';
  const photoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];
  const isCover = photoSize.id === 'cover';
  const font = template?.layout?.fontFamily === 'elegant' ? "'Georgia', serif"
    : template?.layout?.fontFamily === 'playful' ? "'Comic Sans MS', cursive"
    : template?.layout?.fontFamily === 'classic' ? "'Times New Roman', serif"
    : "'Inter', -apple-system, sans-serif";

  // Template navigation helpers
  const goToPrevTemplate = () => { if (templateIndex > 0) { setTemplateIndex(templateIndex - 1); setColorIndex(0); } };
  const goToNextTemplate = () => { if (templateIndex < TEMPLATES.length - 1) { setTemplateIndex(templateIndex + 1); setColorIndex(0); } };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  // Gallery upload
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => ({
        id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
      }));
      setGalleryImages(prev => [...prev, ...newImages]);
    }
  };

  // Featured icons management
  const addFeaturedIcon = (platformId: string) => {
    if (featuredIcons.length < 4 && !featuredIcons.find(fi => fi.platform === platformId)) {
      setFeaturedIcons(prev => [...prev, { platform: platformId, url: '' }]);
    }
    setShowFeaturedIconPicker(false);
  };

  const removeFeaturedIcon = (platformId: string) => {
    setFeaturedIcons(prev => prev.filter(fi => fi.platform !== platformId));
  };

  const updateFeaturedIconUrl = (platformId: string, url: string) => {
    setFeaturedIcons(prev => prev.map(fi => fi.platform === platformId ? { ...fi, url } : fi));
  };

  // Video management
  const addVideo = (type: VideoData['type']) => {
    if (type === 'tavvy_short') {
      videoInputRef.current?.click();
    } else {
      setVideos(prev => [...prev, { type, url: '' }]);
    }
    setShowVideoTypePicker(false);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB'); return; }
      const url = URL.createObjectURL(file);
      setVideos(prev => [...prev, { type: 'tavvy_short', url, file }]);
    }
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const updateVideoUrl = (index: number, url: string) => {
    setVideos(prev => prev.map((v, i) => i === index ? { ...v, url } : v));
  };

  // Add link
  const addLink = (platformId: string) => {
    const newLink: LinkData = {
      id: `link-${Date.now()}`,
      platform: platformId,
      value: '',
    };
    setLinks(prev => [...prev, newLink]);
    setShowAddLink(false);
  };

  const removeLink = (id: string) => { setLinks(prev => prev.filter(l => l.id !== id)); };
  const updateLinkValue = (id: string, value: string) => { setLinks(prev => prev.map(l => l.id === id ? { ...l, value } : l)); };

  // Save card draft to localStorage (for login redirect)
  const saveDraftToLocalStorage = () => {
    try {
      const draft = {
        name, titleRole, bio, email, phone, website, address,
        templateIndex, colorIndex, photoSizeIndex,
        featuredIcons, links, videos: videos.map(v => ({ type: v.type, url: v.url })),
        profileImage, // base64 or blob URL (blob URLs won't persist across sessions, but base64 will)
      };
      localStorage.setItem('ecard_draft', JSON.stringify(draft));
    } catch (e) {
      console.warn('Could not save eCard draft:', e);
    }
  };

  // Save card
  const handleSave = async () => {
    if (!user) {
      // Save all card data to localStorage before redirecting to login
      saveDraftToLocalStorage();
      router.push('/app/login?returnUrl=/app/ecard/create');
      return;
    }
    if (!name.trim()) { alert('Please enter your name.'); return; }
    setIsCreating(true);
    try {
      // Upload profile photo to storage
      let photoUrl: string | null = null;
      if (profileImageFile) {
        try {
          photoUrl = await uploadProfilePhoto(user.id, profileImageFile);
        } catch (uploadErr) {
          console.warn('Photo upload failed, continuing without photo:', uploadErr);
        }
      }

      // Upload gallery images to storage (convert blob URLs to real URLs)
      const uploadedGallery: { id: string; url: string; caption: string }[] = [];
      for (const img of galleryImages) {
        if (img.file) {
          try {
            const galleryUrl = await uploadEcardFile(user.id, img.file, 'gallery');
            if (galleryUrl) {
              uploadedGallery.push({ id: img.id, url: galleryUrl, caption: '' });
            }
          } catch (e) {
            console.warn('Gallery image upload failed:', e);
          }
        } else if (img.url && !img.url.startsWith('blob:')) {
          // Already a real URL (e.g. from draft restore)
          uploadedGallery.push({ id: img.id, url: img.url, caption: '' });
        }
      }

      // Upload video files to storage
      const uploadedVideos: { type: string; url: string }[] = [];
      for (const vid of videos) {
        if ((vid as any).file) {
          try {
            const vidUrl = await uploadEcardFile(user.id, (vid as any).file, 'video');
            if (vidUrl) uploadedVideos.push({ type: vid.type, url: vidUrl });
          } catch (e) {
            console.warn('Video upload failed:', e);
          }
        } else if (vid.url && !vid.url.startsWith('blob:')) {
          uploadedVideos.push({ type: vid.type, url: vid.url });
        }
      }

      // Generate unique slug to avoid conflicts
      const uniqueId = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const slug = `draft_${user.id.substring(0, 8)}_${uniqueId}`;

      const card = await createCard({
        user_id: user.id,
        slug,
        full_name: name.trim(),
        title: titleRole || undefined,
        bio: bio || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        city: address || undefined,
        profile_photo_url: photoUrl || undefined,
        profile_photo_size: photoSize.id,
        gradient_color_1: color?.primary,
        gradient_color_2: color?.secondary,
        template_id: template.id,
        color_scheme_id: color?.id || undefined,
        theme: template.id,
        button_style: template.layout.buttonStyle,
        font_style: template.layout.fontFamily,
        background_type: color?.background?.includes('gradient') ? 'gradient' : 'solid',
        is_published: false,
        is_active: true,
        gallery_images: uploadedGallery.length > 0 ? uploadedGallery : undefined,
        featured_socials: featuredIcons.length > 0 ? featuredIcons.map(fi => ({ platform: fi.platform, url: fi.url })) : undefined,
        videos: uploadedVideos.length > 0 ? uploadedVideos : undefined,
      } as any);

      if (!card) {
        alert('Failed to save card. Please check your connection and try again.');
        setIsCreating(false);
        return;
      }

      // Save links (non-blocking)
      if (links.length > 0) {
        try {
          await saveCardLinks(card.id, links.filter(l => l.value.trim()).map((l, i) => ({
            id: l.id,
            card_id: card.id,
            platform: l.platform,
            url: l.value,
            value: l.value,
            sort_order: i,
            is_active: true,
          })));
        } catch (linkErr) {
          console.warn('Links save failed, card still saved:', linkErr);
        }
      }

      router.push(`/app/ecard/dashboard?cardId=${card.id}`);
    } catch (err: any) {
      console.error('Error creating card:', err);
      alert(`Error: ${err?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsCreating(false);
    }
  };

  // Button style helper
  const btnStyle = (): React.CSSProperties => ({
    height: 44,
    borderRadius: btnRadius,
    background: isOutline ? 'transparent' : isFrosted ? (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)') : accentColor,
    border: isOutline ? `1.5px solid ${isLight ? 'rgba(0,0,0,0.15)' : (accentColor || 'rgba(255,255,255,0.2)')}` : 'none',
    backdropFilter: isFrosted ? 'blur(10px)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: isOutline ? txtColor : (isLight ? '#333' : '#fff'),
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    fontFamily: font,
  });

  // Input style on the card
  const cardInputStyle = (align = 'center'): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: txtColor,
    textAlign: align as any,
    width: '100%',
    fontFamily: font,
    padding: '4px 0',
  });

  return (
    <AppLayout>
      <Head><title>Create eCard | Tavvy</title></Head>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
      <input type="file" ref={galleryInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />

      <div className="ecard-editor">
        {/* Top bar */}
        <div className="top-bar">
          <button className="back-btn" onClick={() => router.back()}>
            <IoArrowBack size={22} color={isDark ? '#fff' : '#333'} />
          </button>
          <div className="template-indicator">
            <div className="template-name-row">
              <span className="template-name-label">{template?.name}</span>
              {usesPremiumTemplate && (
                <span className="pro-badge">
                  <IoLockClosed size={9} color="#fff" />
                  PRO
                </span>
              )}
            </div>
            <span className="template-count">{templateIndex + 1} / {TEMPLATES.length}</span>
          </div>
          <button className="save-btn" onClick={handleSave} disabled={isCreating || !name.trim()}>
            {isCreating ? 'Saving...' : 'Continue'}
          </button>
        </div>

        {/* ===== THE CARD ===== */}
        <div className="card-container">
          <div key={`card_${templateIndex}_${colorIndex}`} className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative' }}>
            {/* Big overlay arrows for template switching */}
            {templateIndex > 0 && (
              <button className="overlay-arrow overlay-arrow-left" onClick={goToPrevTemplate} type="button">
                <IoChevronBack size={28} color="#fff" />
              </button>
            )}
            {templateIndex < TEMPLATES.length - 1 && (
              <button className="overlay-arrow overlay-arrow-right" onClick={goToNextTemplate} type="button">
                <IoChevronForward size={28} color="#fff" />
              </button>
            )}
            {/* Cover photo */}
            {isCover ? (
              <div className="cover-photo" onClick={() => fileInputRef.current?.click()}>
                {profileImage ? (
                  <img src={profileImage} alt="Cover" className="cover-img" />
                ) : (
                  <div className="cover-placeholder">
                    <IoCamera size={28} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                    <span style={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      Tap to add cover photo
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Profile photo */
              <div className="profile-section">
                <div 
                  className="profile-photo"
                  style={{
                    width: photoSize.size,
                    height: photoSize.size,
                    borderRadius: template?.layout?.photoStyle === 'square' ? 12 : '50%',
                    border: color?.border ? `3px solid ${color.border}` : `3px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="profile-img" />
                  ) : (
                    <div className="photo-placeholder" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }}>
                      <IoCamera size={photoSize.size > 100 ? 28 : 22} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Size hint - ALWAYS visible, works for both cover and regular */}
            <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
              <IoExpand size={12} /> {photoSize.label} &middot; Tap to change size
            </button>

            {/* ===== FEATURED SOCIAL ICONS (independent, up to 4, each with URL) ===== */}
            <div className="featured-icons-section">
              <div className="featured-icons-row">
                {featuredIcons.map(fi => {
                  const iconInfo = PLATFORM_ICONS[fi.platform];
                  return (
                    <div key={fi.platform} className="featured-icon-slot" style={{ background: iconInfo?.bgColor || '#666' }}>
                      {getSocialIcon(fi.platform, 18)}
                      <button 
                        className="featured-icon-remove"
                        onClick={(e) => { e.stopPropagation(); removeFeaturedIcon(fi.platform); }}
                      >
                        <IoClose size={10} />
                      </button>
                    </div>
                  );
                })}
                {featuredIcons.length < 4 && (
                  <button 
                    className="featured-icon-add"
                    onClick={() => setShowFeaturedIconPicker(true)}
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }}
                  >
                    <IoAdd size={18} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                  </button>
                )}
              </div>
              {/* URL inputs for each featured icon */}
              {featuredIcons.map(fi => {
                const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
                return (
                  <div key={`url-${fi.platform}`} className="featured-icon-url-row" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                    <span style={{ color: txtSecondary, flexShrink: 0, fontSize: 12 }}>{getSocialIcon(fi.platform, 14)}</span>
                    <input
                      style={{ ...cardInputStyle('left'), fontSize: 12 }}
                      placeholder={`${platform?.name || fi.platform} URL or @username`}
                      value={fi.url}
                      onChange={e => updateFeaturedIconUrl(fi.platform, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Editable fields */}
            <div className="card-fields">
              <input
                style={{ ...cardInputStyle(), fontSize: 22, fontWeight: 700 }}
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary }}
                placeholder="Your Title / Role"
                value={titleRole}
                onChange={e => setTitleRole(e.target.value)}
              />
              <textarea
                style={{ ...cardInputStyle(), fontSize: 13, color: txtSecondary, resize: 'none', minHeight: 40 }}
                placeholder="Short bio about yourself..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={2}
              />
            </div>

            {/* Contact info */}
            <div className="contact-fields">
              {[
                { icon: <IoMail size={16} />, placeholder: 'Email', value: email, set: setEmail },
                { icon: <IoCall size={16} />, placeholder: 'Phone', value: phone, set: setPhone },
                { icon: <IoGlobe size={16} />, placeholder: 'Website', value: website, set: setWebsite },
                { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
              ].map((field, i) => (
                <div key={i} className="contact-row" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                  <span style={{ color: txtSecondary, flexShrink: 0 }}>{field.icon}</span>
                  <input
                    style={{ ...cardInputStyle('left'), fontSize: 13 }}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Links section */}
            <div className="links-section">
              {links.map(link => {
                const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                return (
                  <div key={link.id} className="link-button" style={btnStyle()}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      {getSocialIcon(link.platform, 16)}
                      <input
                        style={{ ...cardInputStyle('left'), fontSize: 13, width: 'auto', flex: 1 }}
                        placeholder={platform?.placeholder || 'Enter URL'}
                        value={link.value}
                        onChange={e => updateLinkValue(link.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </span>
                    <button className="link-action" onClick={() => removeLink(link.id)} style={{ color: '#EF4444' }}>
                      <IoTrash size={14} />
                    </button>
                  </div>
                );
              })}

              <button 
                className="add-link-btn" 
                onClick={() => setShowAddLink(true)}
                style={btnStyle()}
              >
                <IoAdd size={18} /> Add Link
              </button>
            </div>

            {/* Gallery section */}
            <div className="gallery-section">
              <div className="gallery-header" style={{ color: txtSecondary }}>
                <IoImages size={16} /> Photo Gallery
              </div>
              <div className="gallery-grid">
                {galleryImages.map((img) => (
                  <div key={img.id} className="gallery-thumb" onClick={() => setLightboxImage(img.url)}>
                    <img src={img.url} alt="" />
                    <button className="gallery-remove" onClick={e => { e.stopPropagation(); setGalleryImages(prev => prev.filter(g => g.id !== img.id)); }}>
                      <IoClose size={12} />
                    </button>
                  </div>
                ))}
                <button className="gallery-add" onClick={() => galleryInputRef.current?.click()} style={{ borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>
                  <IoAdd size={22} color={txtSecondary} />
                </button>
              </div>
            </div>

            {/* Video section */}
            <div className="video-section">
              <div className="gallery-header" style={{ color: txtSecondary }}>
                <IoVideocam size={16} /> Videos
              </div>
              {videos.map((video, idx) => (
                <div key={idx} className="video-item" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                  <span style={{ color: txtSecondary, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {video.type === 'youtube' ? <IoLogoYoutube size={16} color="#FF0000" /> : video.type === 'tavvy_short' ? <IoFilm size={16} /> : <IoPlay size={16} />}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      {video.type === 'youtube' ? 'YouTube' : video.type === 'tavvy_short' ? 'Tavvy Short' : 'Video URL'}
                    </span>
                  </span>
                  {video.type === 'tavvy_short' && video.url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <video src={video.url} style={{ width: 60, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      <span style={{ fontSize: 11, color: txtSecondary }}>15s video ready</span>
                    </div>
                  ) : (
                    <input
                      style={{ ...cardInputStyle('left'), fontSize: 12, flex: 1 }}
                      placeholder={video.type === 'youtube' ? 'YouTube URL (e.g. https://youtube.com/watch?v=...)' : 'Video URL'}
                      value={video.url}
                      onChange={e => updateVideoUrl(idx, e.target.value)}
                    />
                  )}
                  <button className="link-action" onClick={() => removeVideo(idx)} style={{ color: '#EF4444' }}>
                    <IoTrash size={14} />
                  </button>
                </div>
              ))}
              <button 
                className="add-link-btn" 
                onClick={() => setShowVideoTypePicker(true)}
                style={btnStyle()}
              >
                <IoAdd size={18} /> Add Video
              </button>
              <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileUpload} />
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="bottom-bar">
          <button 
            className="nav-arrow" 
            onClick={goToPrevTemplate}
            disabled={templateIndex === 0}
          >
            <IoChevronBack size={20} />
          </button>

          <div className="color-dots">
            {colorSchemes.map((cs, i) => {
              return (
                <button
                  key={cs.id}
                  className={`color-dot ${i === colorIndex ? 'active' : ''}`}
                  style={{
                    background: cs.background?.includes('gradient') ? cs.background : `linear-gradient(135deg, ${cs.primary}, ${cs.secondary})`,
                  }}
                  onClick={() => setColorIndex(i)}
                >
                </button>
              );
            })}
          </div>

          <button 
            className="nav-arrow" 
            onClick={goToNextTemplate}
            disabled={templateIndex === TEMPLATES.length - 1}
          >
            <IoChevronForward size={20} />
          </button>
        </div>

        {/* Photo size picker modal */}
        {showPhotoSizePicker && (
          <div className="modal-overlay" onClick={() => setShowPhotoSizePicker(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Photo Size</h3>
              {PHOTO_SIZE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.id}
                  className={`size-option ${i === photoSizeIndex ? 'active' : ''}`}
                  onClick={() => { setPhotoSizeIndex(i); setShowPhotoSizePicker(false); }}
                >
                  <span className="size-preview" style={{
                    width: opt.size > 0 ? Math.min(opt.size, 40) : 40,
                    height: opt.size > 0 ? Math.min(opt.size, 40) : 24,
                    borderRadius: opt.id === 'cover' ? 4 : '50%',
                    background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                  }} />
                  <span>{opt.label}</span>
                  {i === photoSizeIndex && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured icon picker modal */}
        {showFeaturedIconPicker && (
          <div className="modal-overlay" onClick={() => setShowFeaturedIconPicker(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Add Featured Icon</h3>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999', fontSize: 13, margin: '-8px 0 16px' }}>
                Choose a social media icon ({featuredIcons.length}/4 used)
              </p>
              <div className="platform-grid">
                {FEATURED_ICON_PLATFORMS.filter(p => !featuredIcons.find(fi => fi.platform === p.id)).map(p => (
                  <button key={p.id} className="platform-btn" onClick={() => addFeaturedIcon(p.id)}>
                    <div className="platform-icon" style={{ background: PLATFORM_ICONS[p.id]?.bgColor || '#666' }}>
                      {getSocialIcon(p.id, 20)}
                    </div>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add link modal */}
        {showAddLink && (
          <div className="modal-overlay" onClick={() => setShowAddLink(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Add Link</h3>
              <div className="platform-grid">
                {SOCIAL_PLATFORMS.map(p => (
                  <button key={p.id} className="platform-btn" onClick={() => addLink(p.id)}>
                    <div className="platform-icon" style={{ background: PLATFORM_ICONS[p.id]?.bgColor || '#666' }}>
                      {getSocialIcon(p.id, 20)}
                    </div>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxImage && (
          <div className="modal-overlay" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} className="lightbox-img" alt="" />
          </div>
        )}

        {/* Video type picker modal */}
        {showVideoTypePicker && (
          <div className="modal-overlay" onClick={() => setShowVideoTypePicker(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Add Video</h3>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999', fontSize: 13, margin: '-8px 0 16px' }}>
                Choose a video type
              </p>
              <div className="platform-grid">
                <button className="platform-btn" onClick={() => addVideo('youtube')}>
                  <div className="platform-icon" style={{ background: '#FF0000' }}>
                    <IoLogoYoutube size={20} color="#fff" />
                  </div>
                  <span>YouTube</span>
                </button>
                <button className="platform-btn" onClick={() => addVideo('tavvy_short')}>
                  <div className="platform-icon" style={{ background: ACCENT_GREEN }}>
                    <IoFilm size={20} color="#fff" />
                  </div>
                  <span>Tavvy Short (15s)</span>
                </button>
                <button className="platform-btn" onClick={() => addVideo('external')}>
                  <div className="platform-icon" style={{ background: '#6366F1' }}>
                    <IoPlay size={20} color="#fff" />
                  </div>
                  <span>Video URL</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .ecard-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: ${isDark ? '#000000' : '#F5F5F5'};
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          flex-shrink: 0;
        }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .template-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .template-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .template-name-label {
          font-size: 16px;
          font-weight: 700;
          color: ${isDark ? '#fff' : '#333'};
        }

        .pro-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #F59E0B;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .template-count {
          font-size: 11px;
          color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
        }

        .save-btn {
          background: ${ACCENT_GREEN};
          color: #fff;
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 16px 16px;
          -webkit-overflow-scrolling: touch;
        }


        .live-card {
          border-radius: 20px;
          min-height: 500px;
          padding: 24px 20px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          box-shadow: 0 8px 40px rgba(0,0,0,0.2);
          transition: background 0.3s ease;
        }

        /* Big overlay arrows on card */
        .overlay-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0,0,0,0.45);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: background 0.2s, transform 0.2s;
        }
        .overlay-arrow:hover {
          background: rgba(0,0,0,0.65);
          transform: translateY(-50%) scale(1.1);
        }
        .overlay-arrow-left {
          left: 8px;
        }
        .overlay-arrow-right {
          right: 8px;
        }

        /* Profile photo */
        .profile-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .profile-photo {
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .profile-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        .size-hint {
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'};
          border: none;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Cover photo */
        .cover-photo {
          width: calc(100% + 40px);
          margin: -24px -20px 0;
          height: 200px;
          cursor: pointer;
          overflow: hidden;
          border-radius: 20px 20px 0 0;
        }

        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'};
        }

        /* ===== FEATURED ICONS ROW ===== */
        .featured-icons-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 4px 0;
        }

        .featured-icon-slot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          position: relative;
          cursor: default;
        }

        .featured-icon-remove {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(239,68,68,0.9);
          color: #fff;
          border: 2px solid ${isLight ? '#fff' : '#1a1a2e'};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }

        .featured-icon-add {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px dashed;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .featured-icons-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .featured-icon-url-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
        }

        /* Video section */
        .video-section {
          width: 100%;
          padding: 12px 16px;
        }

        .video-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }

        /* Card fields */
        .card-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .card-fields input,
        .card-fields textarea {
          text-align: center;
        }

        .card-fields input::placeholder,
        .card-fields textarea::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'};
        }

        /* Contact fields */
        .contact-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }

        .contact-row input::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'};
        }

        /* Links */
        .links-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .link-button {
          position: relative;
          padding: 0 12px;
        }

        .link-button input::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'};
        }

        .link-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .add-link-btn {
          opacity: 0.6;
          border-style: dashed !important;
          border-width: 1.5px !important;
          border-color: ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} !important;
          background: transparent !important;
        }

        /* Gallery */
        .gallery-section {
          width: 100%;
          margin-top: 8px;
        }

        .gallery-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .gallery-thumb {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
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
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .gallery-add {
          aspect-ratio: 1;
          border-radius: 8px;
          border: 2px dashed;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* ===== BOTTOM BAR ===== */
        .bottom-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 16px;
          background: ${isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'};
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          flex-shrink: 0;
          backdrop-filter: blur(10px);
        }

        .nav-arrow {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${isDark ? '#fff' : '#333'};
          flex-shrink: 0;
        }

        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .color-dots {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .color-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .color-dot.active {
          border-color: ${ACCENT_GREEN};
          transform: scale(1.15);
          box-shadow: 0 0 0 2px ${isDark ? '#000000' : '#F5F5F5'}, 0 0 0 4px ${ACCENT_GREEN};
        }


        /* ===== MODALS ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal-content {
          background: ${isDark ? '#1E293B' : '#fff'};
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 360px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 16px;
          color: ${isDark ? '#fff' : '#333'};
          font-size: 18px;
        }

        .size-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 10px;
          color: ${isDark ? '#fff' : '#333'};
          font-size: 15px;
        }

        .size-option:hover, .size-option.active {
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
        }

        .size-preview {
          flex-shrink: 0;
        }

        .check {
          margin-left: auto;
          color: ${ACCENT_GREEN};
          font-weight: 700;
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .platform-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          color: ${isDark ? '#fff' : '#333'};
          font-size: 13px;
        }

        .platform-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .lightbox-img {
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 12px;
          object-fit: contain;
        }

        @media (max-width: 480px) {
          .live-card {
            border-radius: 16px;
            padding: 20px 16px 28px;
          }

          .cover-photo {
            width: calc(100% + 32px);
            margin: -20px -16px 0;
            border-radius: 16px 16px 0 0;
          }
        }

        @media (min-width: 768px) {
          .card-container {
            display: flex;
            justify-content: center;
          }

          .live-card {
            max-width: 420px;
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
