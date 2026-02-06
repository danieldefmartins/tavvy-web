/**
 * eCard Create Screen - Redesigned
 * 
 * Flow:
 * 1. Template Selection (swipeable cards)
 * 2. Color Selection (free: white, black, gradient; premium locked)
 * 3. Real-time Card Builder (live preview with all fields)
 * 4. Continue to pricing/payment/sharing
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
  saveCardLinks,
  updateCard,
  PLATFORM_ICONS, 
  PHOTO_SIZES,
  CardData, 
  LinkItem as ECardLink,
  GalleryImage,
} from '../../../lib/ecard';
import { TEMPLATES, ColorScheme, Template } from '../../../config/eCardTemplates';
import { 
  IoArrowBack, 
  IoArrowForward,
  IoChevronBack,
  IoChevronForward,
  IoCamera,
  IoClose,
  IoCheckmark,
  IoAdd,
  IoTrash,
  IoReorderThree,
  IoLockClosed,
  IoImage,
  IoExpand,
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
} from 'react-icons/io5';

// Brand colors
const ACCENT_GREEN = '#00C853';
const BG_DARK = '#0F172A';
const BG_LIGHT = '#FAFAFA';

type Step = 'template' | 'colors' | 'builder';

// Photo size options
const PHOTO_SIZE_OPTIONS = [
  { id: 'small', label: 'Small', size: 80, description: 'Round' },
  { id: 'medium', label: 'Medium', size: 110, description: 'Bigger Round' },
  { id: 'large', label: 'Large', size: 150, description: 'Large Round' },
  { id: 'xl', label: 'Extra Large', size: 200, description: 'XL Round' },
  { id: 'cover', label: 'Cover', size: -1, description: 'Full Width' },
];

// Free color options (3 only)
const FREE_COLORS: ColorScheme[] = [
  {
    id: 'free-white',
    name: 'White',
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    accent: '#333333',
    text: '#1A1A1A',
    textSecondary: '#666666',
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
  },
  {
    id: 'free-black',
    name: 'Black',
    primary: '#1A1A1A',
    secondary: '#2D2D2D',
    accent: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    background: '#1A1A1A',
    cardBg: '#1A1A1A',
  },
  {
    id: 'free-gradient',
    name: 'Gradient',
    primary: '#667eea',
    secondary: '#764ba2',
    accent: 'rgba(255,255,255,0.2)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.8)',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    cardBg: 'transparent',
  },
];

// Social media platforms with icons
const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'IoLogoInstagram', color: '#E4405F', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', icon: 'IoLogoTiktok', color: '#000000', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', icon: 'IoLogoYoutube', color: '#FF0000', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', icon: 'IoLogoTwitter', color: '#1DA1F2', placeholder: '@username' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'IoLogoLinkedin', color: '#0A66C2', placeholder: 'Profile URL' },
  { id: 'facebook', name: 'Facebook', icon: 'IoLogoFacebook', color: '#1877F2', placeholder: 'Profile URL' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'IoLogoWhatsapp', color: '#25D366', placeholder: 'Phone number' },
  { id: 'website', name: 'Website', icon: 'IoGlobe', color: '#4A90D9', placeholder: 'https://...' },
  { id: 'email', name: 'Email', icon: 'IoMail', color: '#EA4335', placeholder: 'email@example.com' },
  { id: 'phone', name: 'Phone', icon: 'IoCall', color: '#34C759', placeholder: '+1 (555) 123-4567' },
];

// Featured social icons (max 4 shown on profile photo)
const FEATURED_SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

interface LinkData {
  id: string;
  platform: string;
  value: string;
  isFeatured: boolean;
}

function getSocialIcon(platformId: string, size: number = 18) {
  const iconMap: Record<string, React.ReactNode> = {
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
  return iconMap[platformId] || <IoGlobe size={size} />;
}

export default function ECardCreateScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const templateScrollRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [isCreating, setIsCreating] = useState(false);

  // Template state
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);

  // Color state
  const [selectedColor, setSelectedColor] = useState<ColorScheme>(
    TEMPLATES[0]?.colorSchemes?.find(c => c.isFree) || TEMPLATES[0]?.colorSchemes?.[0] || FREE_COLORS[0]
  ); // Default to first free color from template
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Profile state
  const [name, setName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [photoSizeIndex, setPhotoSizeIndex] = useState(1); // Default medium

  // Links state
  const [links, setLinks] = useState<LinkData[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Drag state for gallery reordering
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Section order (draggable)
  const [sectionOrder, setSectionOrder] = useState<string[]>(['socials', 'links', 'gallery']);

  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const steps: Step[] = ['template', 'colors', 'builder'];
  const currentStepIndex = steps.indexOf(currentStep);
  const currentPhotoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];

  // Get featured socials (up to 4)
  const featuredSocials = links.filter(l => l.isFeatured && FEATURED_SOCIAL_PLATFORMS.includes(l.platform)).slice(0, 4);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      router.back();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryImages(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            file,
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const cyclePhotoSize = () => {
    setPhotoSizeIndex((prev) => (prev + 1) % PHOTO_SIZE_OPTIONS.length);
  };

  const addLink = (platform: string) => {
    const isFeatured = FEATURED_SOCIAL_PLATFORMS.includes(platform) && featuredSocials.length < 4;
    setLinks([...links, { id: Date.now().toString(), platform, value: '', isFeatured }]);
    setShowAddLink(false);
  };

  const updateLink = (id: string, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, value } : link));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const toggleFeatured = (id: string) => {
    setLinks(links.map(link => {
      if (link.id === id) {
        if (!link.isFeatured && featuredSocials.length >= 4) return link;
        return { ...link, isFeatured: !link.isFeatured };
      }
      return link;
    }));
  };

  const removeGalleryImage = (id: string) => {
    setGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  // Gallery drag and drop
  const handleGalleryDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleGalleryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newImages = [...galleryImages];
    const draggedItem = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setGalleryImages(newImages);
    setDragIndex(index);
  };

  const handleGalleryDragEnd = () => {
    setDragIndex(null);
  };

  // Template swipe
  const scrollToTemplate = (index: number) => {
    const bounded = Math.max(0, Math.min(index, TEMPLATES.length - 1));
    setSelectedTemplateIndex(bounded);
    setSelectedTemplate(TEMPLATES[bounded]);
    // Reset color to first scheme of template or free color
    if (TEMPLATES[bounded].colorSchemes.length > 0) {
      // Will be handled in color step
    }
  };

  const handleCreate = async () => {
    if (!user) {
      router.push('/app/login');
      return;
    }
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsCreating(true);

    try {
      // Upload profile photo if exists
      let photoUrl = profileImage;
      if (profileImageFile) {
        const uploaded = await uploadProfilePhoto(user.id, profileImageFile);
        if (uploaded) photoUrl = uploaded;
      }

      const tempSlug = `draft_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;

      const cardData: Partial<CardData> = {
        user_id: user.id,
        slug: tempSlug,
        full_name: name,
        title: titleRole,
        bio: bio,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        city: address || undefined,
        profile_photo_url: photoUrl || undefined,
        profile_photo_size: currentPhotoSize.id,
        gradient_color_1: selectedColor.primary,
        gradient_color_2: selectedColor.secondary,
        theme: selectedTemplate.id,
        button_style: selectedTemplate.layout.buttonStyle || 'fill',
        font_style: selectedTemplate.layout.fontFamily || 'modern',
        is_published: false,
        gallery_images: galleryImages.map((img, i) => ({ id: img.id, url: img.url, caption: '' })),
      };

      const newCard = await createCard(cardData);

      if (newCard) {
        // Save links
        if (links.length > 0) {
          const cardLinks: ECardLink[] = links.map((link, index) => ({
            id: link.id,
            card_id: newCard.id,
            platform: link.platform,
            title: SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform,
            url: link.value,
            value: link.value,
            icon: link.platform,
            sort_order: index,
            is_active: true,
          }));
          await saveCardLinks(newCard.id, cardLinks);
        }

        // Navigate to premium/payment screen
        router.push(`/app/ecard/premium?cardId=${newCard.id}`);
      } else {
        alert('Failed to create card. Please try again.');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Get the background style for the card preview
  const getCardBackground = () => {
    if (selectedColor.id === 'free-white') {
      return { background: '#FFFFFF' };
    }
    if (selectedColor.id === 'free-black') {
      return { background: 'linear-gradient(180deg, #1A1A1A, #2D2D2D)' };
    }
    return { background: `linear-gradient(135deg, ${selectedColor.primary}, ${selectedColor.secondary})` };
  };

  const getTextColor = () => selectedColor.text || '#FFFFFF';
  const getSecondaryTextColor = () => selectedColor.textSecondary || 'rgba(255,255,255,0.7)';
  const isLightCard = () => {
    const lightColors = ['free-white'];
    return lightColors.includes(selectedColor.id) || selectedColor.text === '#1A1A1A' || selectedColor.text === '#1f2937';
  };

  // ==================== STEP 1: TEMPLATE SELECTION ====================
  const renderTemplateStep = () => {
    const template = TEMPLATES[selectedTemplateIndex];
    const isLocked = template.isPremium && !isPremiumUser;

    return (
      <div className="step-content template-step">
        <h2 style={{ color: isDark ? '#fff' : '#333', textAlign: 'center' }}>Choose Your Style</h2>
        <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666', textAlign: 'center' }}>
          Swipe to browse templates
        </p>

        {/* Swipeable Template Carousel */}
        <div className="template-carousel">
          <button 
            className="carousel-arrow left"
            onClick={() => scrollToTemplate(selectedTemplateIndex - 1)}
            disabled={selectedTemplateIndex === 0}
          >
            <IoChevronBack size={24} color={selectedTemplateIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff'} />
          </button>

          <div className="carousel-cards" ref={templateScrollRef}>
            {/* Previous card (peek) */}
            {selectedTemplateIndex > 0 && (
              <div 
                className="carousel-card peek left"
                onClick={() => scrollToTemplate(selectedTemplateIndex - 1)}
              >
                <div 
                  className="card-face"
                  style={{ 
                    background: `linear-gradient(135deg, ${TEMPLATES[selectedTemplateIndex - 1].colorSchemes[0]?.primary || '#667eea'}, ${TEMPLATES[selectedTemplateIndex - 1].colorSchemes[0]?.secondary || '#764ba2'})`,
                  }}
                >
                  <div className="card-face-content">
                    <div className="face-photo-placeholder" />
                    <div className="face-line w60" />
                    <div className="face-line w40" />
                  </div>
                </div>
              </div>
            )}

            {/* Current card */}
            <div className="carousel-card active">
              <div 
                className="card-face"
                style={{ 
                  background: template.colorSchemes[0]?.cardBg === '#FFFFFF' 
                    ? '#FFFFFF' 
                    : `linear-gradient(135deg, ${template.colorSchemes[0]?.primary || '#667eea'}, ${template.colorSchemes[0]?.secondary || '#764ba2'})`,
                  border: template.colorSchemes[0]?.border ? `2px solid ${template.colorSchemes[0].border}` : 'none',
                }}
              >
                {isLocked && (
                  <div className="lock-overlay">
                    <IoLockClosed size={32} color="#fff" />
                    <span>Premium</span>
                  </div>
                )}
                <div className="card-face-content">
                  <div 
                    className="face-photo-placeholder"
                    style={{ 
                      width: template.layout.photoSize === 'small' ? 50 : template.layout.photoSize === 'large' ? 80 : 65,
                      height: template.layout.photoSize === 'small' ? 50 : template.layout.photoSize === 'large' ? 80 : 65,
                      borderRadius: template.layout.photoStyle === 'square' ? 8 : '50%',
                      border: template.colorSchemes[0]?.border ? `2px solid ${template.colorSchemes[0].border}` : '2px solid rgba(255,255,255,0.3)',
                    }}
                  />
                  <div className="face-line w60" style={{ 
                    backgroundColor: template.colorSchemes[0]?.text === '#1f2937' || template.colorSchemes[0]?.text === '#1A1A1A' 
                      ? 'rgba(0,0,0,0.3)' 
                      : template.colorSchemes[0]?.text === '#d4af37' || template.colorSchemes[0]?.text === '#c0c0c0'
                        ? template.colorSchemes[0].text
                        : 'rgba(255,255,255,0.5)' 
                  }} />
                  <div className="face-line w40" style={{ 
                    backgroundColor: template.colorSchemes[0]?.text === '#1f2937' || template.colorSchemes[0]?.text === '#1A1A1A'
                      ? 'rgba(0,0,0,0.2)' 
                      : template.colorSchemes[0]?.text === '#d4af37' || template.colorSchemes[0]?.text === '#c0c0c0'
                        ? `${template.colorSchemes[0].text}80`
                        : 'rgba(255,255,255,0.3)' 
                  }} />
                  <div className="face-buttons">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className="face-button"
                        style={{ 
                          borderRadius: template.layout.buttonStyle === 'pill' ? 20 : template.layout.buttonStyle === 'square' ? 4 : 8,
                          backgroundColor: template.colorSchemes[0]?.accent || 'rgba(255,255,255,0.2)',
                          border: template.layout.buttonStyle === 'outline' ? `1px solid ${template.colorSchemes[0]?.accent || 'rgba(255,255,255,0.3)'}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="card-label">
                <span className="template-name" style={{ color: isDark ? '#fff' : '#333' }}>
                  {template.name}
                </span>
                <span className="template-category" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999' }}>
                  {template.category}
                </span>
                {template.isPremium && (
                  <span className="premium-badge">Premium</span>
                )}
                {template.isProOnly && (
                  <span className="pro-badge">Pro</span>
                )}
              </div>
            </div>

            {/* Next card (peek) */}
            {selectedTemplateIndex < TEMPLATES.length - 1 && (
              <div 
                className="carousel-card peek right"
                onClick={() => scrollToTemplate(selectedTemplateIndex + 1)}
              >
                <div 
                  className="card-face"
                  style={{ 
                    background: `linear-gradient(135deg, ${TEMPLATES[selectedTemplateIndex + 1].colorSchemes[0]?.primary || '#667eea'}, ${TEMPLATES[selectedTemplateIndex + 1].colorSchemes[0]?.secondary || '#764ba2'})`,
                  }}
                >
                  <div className="card-face-content">
                    <div className="face-photo-placeholder" />
                    <div className="face-line w60" />
                    <div className="face-line w40" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            className="carousel-arrow right"
            onClick={() => scrollToTemplate(selectedTemplateIndex + 1)}
            disabled={selectedTemplateIndex === TEMPLATES.length - 1}
          >
            <IoChevronForward size={24} color={selectedTemplateIndex === TEMPLATES.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff'} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="carousel-dots">
          {TEMPLATES.map((_, i) => (
            <div 
              key={i}
              className={`dot ${i === selectedTemplateIndex ? 'active' : ''}`}
              onClick={() => scrollToTemplate(i)}
            />
          ))}
        </div>

        {/* Template count */}
        <p className="template-counter" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#999' }}>
          {selectedTemplateIndex + 1} / {TEMPLATES.length}
        </p>
      </div>
    );
  };

  // ==================== STEP 2: COLOR SELECTION ====================
  const renderColorStep = () => {
    const allColors = selectedTemplate.colorSchemes || [];
    const freeColors = allColors.filter(c => c.isFree);
    const premiumColors = allColors.filter(c => !c.isFree);

    return (
      <div className="step-content color-step">
        <h2 style={{ color: isDark ? '#fff' : '#333', textAlign: 'center' }}>Choose Colors</h2>
        <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666', textAlign: 'center' }}>
          Pick a color scheme for your card
        </p>

        {/* Free Colors */}
        {freeColors.length > 0 && (
          <div className="color-section">
            <h3 style={{ color: isDark ? '#fff' : '#333' }}>Free</h3>
            <div className="color-grid">
              {freeColors.map((color) => (
                <button
                  key={color.id}
                  className={`color-swatch ${selectedColor.id === color.id ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(color)}
                >
                  <div 
                    className="swatch-preview"
                    style={{ 
                      background: color.primary === color.secondary 
                        ? color.primary 
                        : `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                      border: color.primary === '#FFFFFF' ? '2px solid #E5E7EB' : 'none',
                    }}
                  >
                    {selectedColor.id === color.id && (
                      <IoCheckmark size={20} color={color.text === '#1A1A1A' ? '#333' : '#fff'} />
                    )}
                  </div>
                  <span style={{ color: isDark ? '#fff' : '#333' }}>{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium Colors */}
        {premiumColors.length > 0 && (
          <div className="color-section">
            <h3 style={{ color: isDark ? '#fff' : '#333' }}>
              Premium Colors
              {!isPremiumUser && (
                <span className="premium-label">
                  <IoLockClosed size={14} /> Premium
                </span>
              )}
            </h3>
            <div className="color-grid">
              {premiumColors.map((color) => {
                const locked = !isPremiumUser;
                return (
                  <button
                    key={color.id}
                    className={`color-swatch ${selectedColor.id === color.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                    onClick={() => !locked && setSelectedColor(color)}
                  >
                    <div 
                      className="swatch-preview"
                      style={{ 
                        background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                        border: color.border ? `2px solid ${color.border}` : 'none',
                      }}
                    >
                      {locked && <IoLockClosed size={16} color="rgba(255,255,255,0.7)" />}
                      {selectedColor.id === color.id && <IoCheckmark size={20} color="#fff" />}
                    </div>
                    <span style={{ color: isDark ? '#fff' : '#333' }}>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview mini card */}
        <div className="color-preview-card" style={getCardBackground()}>
          <div className="mini-photo" style={{ 
            border: `2px solid ${isLightCard() ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'}` 
          }} />
          <div className="mini-name" style={{ color: getTextColor() }}>Your Name</div>
          <div className="mini-title" style={{ color: getSecondaryTextColor() }}>Your Title</div>
          <div className="mini-button" style={{ 
            backgroundColor: selectedColor.accent || 'rgba(255,255,255,0.2)',
            color: isLightCard() ? '#fff' : '#fff',
          }}>Link</div>
        </div>
      </div>
    );
  };

  // ==================== STEP 3: REAL-TIME CARD BUILDER ====================
  const renderBuilderStep = () => {
    const isCover = currentPhotoSize.id === 'cover';
    const photoSize = currentPhotoSize.size;

    return (
      <div className="step-content builder-step">
        {/* Live Card Preview */}
        <div className="live-card" style={getCardBackground()}>
          
          {/* Profile Photo - Tappable to change size */}
          {isCover ? (
            <div className="cover-photo-container" onClick={profileImage ? cyclePhotoSize : () => fileInputRef.current?.click()}>
              {profileImage ? (
                <img src={profileImage} alt="Cover" className="cover-photo" />
              ) : (
                <div className="cover-placeholder">
                  <IoCamera size={36} color="rgba(255,255,255,0.6)" />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Add Cover Photo</span>
                </div>
              )}
              <div className="photo-size-hint cover-hint">
                <IoExpand size={14} />
                <span>Tap to change size</span>
              </div>
            </div>
          ) : (
            <div className="profile-photo-section" onClick={profileImage ? cyclePhotoSize : () => fileInputRef.current?.click()}>
              <div 
                className="profile-photo-wrapper"
                style={{ 
                  width: photoSize, 
                  height: photoSize,
                  position: 'relative',
                }}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="profile-photo"
                    style={{ width: photoSize, height: photoSize, borderRadius: '50%' }}
                  />
                ) : (
                  <div 
                    className="photo-placeholder-circle"
                    style={{ 
                      width: photoSize, 
                      height: photoSize,
                      borderColor: isLightCard() ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <IoCamera size={photoSize > 100 ? 32 : 24} color={isLightCard() ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                  </div>
                )}

                {/* Featured social icons around photo */}
                {featuredSocials.map((social, i) => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
                  const angle = -90 + (i * (360 / Math.max(featuredSocials.length, 1)));
                  const radius = (photoSize / 2) + 8;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  return (
                    <div
                      key={social.id}
                      className="featured-social-icon"
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${x}px - 14px)`,
                        top: `calc(50% + ${y}px - 14px)`,
                        backgroundColor: platform?.color || '#333',
                      }}
                    >
                      {getSocialIcon(social.platform, 14)}
                    </div>
                  );
                })}
              </div>
              <div className="photo-size-hint">
                <IoExpand size={12} />
                <span>{currentPhotoSize.description} &middot; Tap to change</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {/* Editable Fields on Card */}
          <div className="card-fields" style={{ padding: isCover ? '20px 20px 0' : '0 20px' }}>
            <input
              className="card-field name-field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              style={{ color: getTextColor() }}
            />
            <input
              className="card-field title-field"
              type="text"
              value={titleRole}
              onChange={(e) => setTitleRole(e.target.value)}
              placeholder="Title / Role"
              style={{ color: getSecondaryTextColor() }}
            />
            <textarea
              className="card-field bio-field"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio about yourself..."
              rows={2}
              style={{ color: getSecondaryTextColor() }}
            />

            {/* Contact Fields */}
            <div className="contact-fields">
              <div className="contact-row">
                <IoMail size={16} color={getSecondaryTextColor()} />
                <input
                  className="card-field contact-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ color: getTextColor() }}
                />
              </div>
              <div className="contact-row">
                <IoCall size={16} color={getSecondaryTextColor()} />
                <input
                  className="card-field contact-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  style={{ color: getTextColor() }}
                />
              </div>
              <div className="contact-row">
                <IoGlobe size={16} color={getSecondaryTextColor()} />
                <input
                  className="card-field contact-input"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Website URL"
                  style={{ color: getTextColor() }}
                />
              </div>
              <div className="contact-row">
                <IoLocationOutline size={16} color={getSecondaryTextColor()} />
                <input
                  className="card-field contact-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State"
                  style={{ color: getTextColor() }}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="card-section" style={{ padding: '0 20px' }}>
            <div className="section-header">
              <span style={{ color: getTextColor(), fontSize: 14, fontWeight: 600 }}>Social Links</span>
              <button className="add-btn-inline" onClick={() => setShowAddLink(true)}>
                <IoAdd size={18} color={ACCENT_GREEN} />
              </button>
            </div>

            {links.map((link) => {
              const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
              return (
                <div key={link.id} className="link-row-card">
                  <div className="link-icon-wrapper" style={{ backgroundColor: platform?.color || '#333' }}>
                    {getSocialIcon(link.platform, 16)}
                  </div>
                  <input
                    className="card-field link-input"
                    type="text"
                    value={link.value}
                    onChange={(e) => updateLink(link.id, e.target.value)}
                    placeholder={platform?.placeholder || 'Enter URL'}
                    style={{ color: getTextColor() }}
                  />
                  <div className="link-actions">
                    {FEATURED_SOCIAL_PLATFORMS.includes(link.platform) && (
                      <button 
                        className={`star-btn ${link.isFeatured ? 'active' : ''}`}
                        onClick={() => toggleFeatured(link.id)}
                        title={link.isFeatured ? 'Remove from profile' : 'Show on profile photo'}
                      >
                        ★
                      </button>
                    )}
                    <button className="remove-btn" onClick={() => removeLink(link.id)}>
                      <IoTrash size={14} color="#EF4444" />
                    </button>
                  </div>
                </div>
              );
            })}

            {links.length === 0 && !showAddLink && (
              <button className="add-link-card-btn" onClick={() => setShowAddLink(true)}>
                <IoAdd size={20} color={isLightCard() ? '#666' : 'rgba(255,255,255,0.6)'} />
                <span style={{ color: isLightCard() ? '#666' : 'rgba(255,255,255,0.6)' }}>Add social media links</span>
              </button>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="card-section" style={{ padding: '12px 20px 20px' }}>
            <div className="section-header">
              <span style={{ color: getTextColor(), fontSize: 14, fontWeight: 600 }}>Photo Gallery</span>
              <button className="add-btn-inline" onClick={() => galleryInputRef.current?.click()}>
                <IoAdd size={18} color={ACCENT_GREEN} />
              </button>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              style={{ display: 'none' }}
            />

            {galleryImages.length > 0 ? (
              <div className="gallery-grid">
                {galleryImages.map((img, index) => (
                  <div
                    key={img.id}
                    className={`gallery-thumb ${dragIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleGalleryDragStart(index)}
                    onDragOver={(e) => handleGalleryDragOver(e, index)}
                    onDragEnd={handleGalleryDragEnd}
                    onClick={() => setLightboxImage(img.url)}
                  >
                    <img src={img.url} alt="" />
                    <button 
                      className="gallery-remove"
                      onClick={(e) => { e.stopPropagation(); removeGalleryImage(img.id); }}
                    >
                      <IoClose size={12} color="#fff" />
                    </button>
                    <div className="gallery-drag-handle">
                      <IoReorderThree size={14} color="rgba(255,255,255,0.8)" />
                    </div>
                  </div>
                ))}
                <button 
                  className="gallery-add-btn"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <IoAdd size={24} color={isLightCard() ? '#999' : 'rgba(255,255,255,0.4)'} />
                </button>
              </div>
            ) : (
              <button 
                className="gallery-empty-btn"
                onClick={() => galleryInputRef.current?.click()}
              >
                <IoImage size={24} color={isLightCard() ? '#999' : 'rgba(255,255,255,0.4)'} />
                <span style={{ color: isLightCard() ? '#999' : 'rgba(255,255,255,0.4)' }}>Add photos to gallery</span>
              </button>
            )}
            <p className="gallery-hint" style={{ color: isLightCard() ? '#aaa' : 'rgba(255,255,255,0.3)' }}>
              Drag to rearrange &middot; Tap to view full size
            </p>
          </div>
        </div>

        {/* Add Link Modal */}
        {showAddLink && (
          <div className="modal-overlay" onClick={() => setShowAddLink(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
              <div className="modal-header">
                <h3 style={{ color: isDark ? '#fff' : '#333' }}>Add Link</h3>
                <button onClick={() => setShowAddLink(false)}>
                  <IoClose size={24} color={isDark ? '#94A3B8' : '#6B7280'} />
                </button>
              </div>
              <div className="modal-platforms">
                {SOCIAL_PLATFORMS.filter(p => !links.some(l => l.platform === p.id)).map((platform) => (
                  <button
                    key={platform.id}
                    className="modal-platform-btn"
                    onClick={() => addLink(platform.id)}
                    style={{ backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }}
                  >
                    <div className="modal-platform-icon" style={{ backgroundColor: platform.color }}>
                      {getSocialIcon(platform.id, 18)}
                    </div>
                    <span style={{ color: isDark ? '#fff' : '#333' }}>{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxImage && (
          <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
              <IoClose size={28} color="#fff" />
            </button>
            <img src={lightboxImage} alt="" className="lightbox-image" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Create eCard | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div className="create-screen" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={handleBack}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <div className="progress-bar">
              {steps.map((step, index) => (
                <div 
                  key={step}
                  className={`progress-dot ${index <= currentStepIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            <div style={{ width: 40 }} />
          </header>

          {/* Step Content */}
          <div className="content">
            {currentStep === 'template' && renderTemplateStep()}
            {currentStep === 'colors' && renderColorStep()}
            {currentStep === 'builder' && renderBuilderStep()}
          </div>

          {/* Footer */}
          <footer className="footer">
            {currentStep === 'builder' ? (
              <button 
                className="create-btn"
                onClick={handleCreate}
                disabled={isCreating || !name.trim()}
              >
                {isCreating ? 'Creating...' : 'Continue →'}
              </button>
            ) : (
              <button 
                className="next-btn"
                onClick={handleNext}
              >
                <span>Continue</span>
                <IoArrowForward size={20} color="#fff" />
              </button>
            )}
          </footer>
        </div>

        <style jsx>{`
          .create-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
            position: sticky;
            top: 0;
            z-index: 10;
            background: ${bgColor};
          }

          .back-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .progress-bar {
            display: flex;
            gap: 8px;
          }

          .progress-dot {
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: ${isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB'};
            transition: all 0.3s;
          }

          .progress-dot.active {
            background: ${ACCENT_GREEN};
            width: 28px;
          }

          .content {
            flex: 1;
            overflow-y: auto;
            padding-bottom: 100px;
          }

          .step-content h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
            padding: 0 20px;
          }

          .step-content > p {
            font-size: 14px;
            margin: 0 0 24px;
            padding: 0 20px;
          }

          /* ========== TEMPLATE CAROUSEL ========== */
          .template-carousel {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 8px;
            margin-bottom: 20px;
          }

          .carousel-arrow {
            background: rgba(255,255,255,0.1);
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
          }

          .carousel-arrow:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .carousel-cards {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            overflow: hidden;
          }

          .carousel-card {
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .carousel-card.active {
            transform: scale(1);
          }

          .carousel-card.peek {
            transform: scale(0.8);
            opacity: 0.5;
            cursor: pointer;
          }

          .carousel-card.peek .card-face {
            width: 140px;
            height: 200px;
          }

          .card-face {
            width: 200px;
            height: 300px;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }

          .lock-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            z-index: 2;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
          }

          .card-face-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 24px 16px;
            gap: 12px;
          }

          .face-photo-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            border: 2px solid rgba(255,255,255,0.3);
          }

          .face-line {
            height: 10px;
            border-radius: 5px;
            background: rgba(255,255,255,0.4);
          }

          .face-line.w60 { width: 60%; }
          .face-line.w40 { width: 40%; }

          .face-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 80%;
            margin-top: 8px;
          }

          .face-button {
            height: 28px;
            border-radius: 8px;
            background: rgba(255,255,255,0.2);
          }

          .card-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            margin-top: 12px;
          }

          .template-name {
            font-size: 16px;
            font-weight: 600;
          }

          .template-category {
            font-size: 12px;
            text-transform: capitalize;
          }

          .premium-badge, .pro-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            margin-top: 4px;
          }

          .premium-badge {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: #fff;
          }

          .pro-badge {
            background: linear-gradient(135deg, ${ACCENT_GREEN}, #00E676);
            color: #fff;
          }

          .carousel-dots {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-bottom: 8px;
            flex-wrap: wrap;
            padding: 0 20px;
          }

          .dot {
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background: ${isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB'};
            cursor: pointer;
            transition: all 0.2s;
          }

          .dot.active {
            background: ${ACCENT_GREEN};
            width: 16px;
          }

          .template-counter {
            text-align: center;
            font-size: 12px;
            margin: 0;
          }

          /* ========== COLOR SELECTION ========== */
          .color-section {
            padding: 0 20px;
            margin-bottom: 24px;
          }

          .color-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .premium-label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #F59E0B;
            font-weight: 500;
          }

          .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 12px;
          }

          .color-swatch {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
          }

          .color-swatch.locked {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .swatch-preview {
            width: 56px;
            height: 56px;
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .color-swatch.selected .swatch-preview {
            transform: scale(1.1);
            box-shadow: 0 0 0 3px ${ACCENT_GREEN};
          }

          .color-swatch span {
            font-size: 11px;
            font-weight: 500;
          }

          .color-preview-card {
            margin: 24px 20px 0;
            border-radius: 16px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }

          .mini-photo {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: rgba(128,128,128,0.3);
          }

          .mini-name {
            font-size: 16px;
            font-weight: 700;
          }

          .mini-title {
            font-size: 12px;
          }

          .mini-button {
            margin-top: 8px;
            padding: 8px 24px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }

          /* ========== CARD BUILDER ========== */
          .live-card {
            margin: 0 16px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(0,0,0,0.25);
            padding-bottom: 20px;
          }

          /* Cover photo */
          .cover-photo-container {
            width: 100%;
            height: 220px;
            position: relative;
            cursor: pointer;
            overflow: hidden;
          }

          .cover-photo {
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
            background: rgba(0,0,0,0.2);
          }

          .cover-hint {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
          }

          /* Profile photo */
          .profile-photo-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 0 8px;
            cursor: pointer;
          }

          .profile-photo-wrapper {
            position: relative;
          }

          .profile-photo {
            object-fit: cover;
            border: 3px solid rgba(255,255,255,0.3);
          }

          .photo-placeholder-circle {
            border-radius: 50%;
            border: 2px dashed;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .photo-size-hint {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            background: rgba(0,0,0,0.3);
            padding: 4px 10px;
            border-radius: 12px;
          }

          .featured-social-icon {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.9);
            z-index: 2;
          }

          /* Card fields */
          .card-fields {
            text-align: center;
          }

          .card-field {
            background: none;
            border: none;
            outline: none;
            width: 100%;
            text-align: center;
            font-family: inherit;
          }

          .card-field::placeholder {
            opacity: 0.4;
          }

          .name-field {
            font-size: 22px;
            font-weight: 700;
            padding: 8px 0 2px;
          }

          .title-field {
            font-size: 14px;
            font-weight: 500;
            padding: 2px 0;
          }

          .bio-field {
            font-size: 13px;
            padding: 4px 0;
            resize: none;
            min-height: 40px;
          }

          .contact-fields {
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .contact-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px;
          }

          .contact-input {
            text-align: left !important;
            font-size: 13px;
            padding: 6px 0;
            flex: 1;
          }

          /* Social links section */
          .card-section {
            margin-top: 12px;
          }

          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .add-btn-inline {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
          }

          .link-row-card {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            padding: 6px 8px;
            border-radius: 10px;
            background: rgba(128,128,128,0.1);
          }

          .link-icon-wrapper {
            width: 30px;
            height: 30px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            flex-shrink: 0;
          }

          .link-input {
            text-align: left !important;
            font-size: 13px;
            flex: 1;
            min-width: 0;
          }

          .link-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
          }

          .star-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: rgba(255,255,255,0.3);
            padding: 2px;
          }

          .star-btn.active {
            color: #FFD700;
          }

          .remove-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px;
          }

          .add-link-card-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 12px;
            border: 1px dashed rgba(128,128,128,0.3);
            border-radius: 10px;
            background: none;
            cursor: pointer;
          }

          /* Gallery */
          .gallery-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .gallery-thumb {
            aspect-ratio: 1;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          }

          .gallery-thumb.dragging {
            opacity: 0.5;
            transform: scale(0.95);
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
            opacity: 0;
            transition: opacity 0.2s;
          }

          .gallery-thumb:hover .gallery-remove {
            opacity: 1;
          }

          .gallery-drag-handle {
            position: absolute;
            bottom: 4px;
            left: 4px;
            background: rgba(0,0,0,0.5);
            border-radius: 4px;
            padding: 2px 4px;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .gallery-thumb:hover .gallery-drag-handle {
            opacity: 1;
          }

          .gallery-add-btn {
            aspect-ratio: 1;
            border-radius: 10px;
            border: 2px dashed rgba(128,128,128,0.3);
            background: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .gallery-empty-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 24px;
            border: 1px dashed rgba(128,128,128,0.3);
            border-radius: 10px;
            background: none;
            cursor: pointer;
          }

          .gallery-hint {
            font-size: 11px;
            text-align: center;
            margin: 8px 0 0;
          }

          /* Modal */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 100;
          }

          .modal-content {
            width: 100%;
            max-width: 500px;
            max-height: 70vh;
            border-radius: 20px 20px 0 0;
            padding: 20px;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .modal-header h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }

          .modal-header button {
            background: none;
            border: none;
            cursor: pointer;
          }

          .modal-platforms {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .modal-platform-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .modal-platform-btn:hover {
            transform: scale(1.02);
          }

          .modal-platform-icon {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
          }

          /* Lightbox */
          .lightbox-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
            cursor: pointer;
          }

          .lightbox-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .lightbox-image {
            max-width: 90vw;
            max-height: 85vh;
            object-fit: contain;
            border-radius: 8px;
          }

          /* Footer */
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px 20px;
            padding-bottom: max(16px, env(safe-area-inset-bottom));
            background: ${bgColor};
            border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            z-index: 50;
          }

          .next-btn, .create-btn {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            background: ${ACCENT_GREEN};
            border: none;
            border-radius: 14px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .next-btn:disabled, .create-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .next-btn:hover:not(:disabled), .create-btn:hover:not(:disabled) {
            opacity: 0.9;
          }

          /* Touch support for template swipe */
          @media (max-width: 480px) {
            .carousel-card.peek .card-face {
              width: 100px;
              height: 150px;
            }
            .card-face {
              width: 180px;
              height: 270px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
