/**
 * Public Digital Card Viewer - Premium Design
 * Path: pages/[username].tsx
 * URL: tavvy.com/[username] (e.g., tavvy.com/danielmartins)
 *
 * Features:
 * - Premium, polished card design
 * - Crown endorsement in top-right corner
 * - Integrated links section
 * - Save to phone contacts (vCard download)
 * - Call, Text, Email actions
 * - Social links
 * - "Powered by Tavvy" branding
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';

interface CardLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  clicks: number;
}

interface CardData {
  id: string;
  slug: string;
  templateId: string;
  colorSchemeId: string;
  fullName: string;
  title: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  // Address fields
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  gradientColor1: string;
  gradientColor2: string;
  profilePhotoUrl: string | null;
  // Social links
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  socialYoutube: string;
  socialSnapchat: string;
  socialPinterest: string;
  socialWhatsapp: string;
  // Featured socials (array of platform IDs to show in icon row)
  featuredSocials: string[];
  links: CardLink[];
  tapCount: number;
}

interface PageProps {
  cardData: CardData | null;
  error: string | null;
}

// SVG Icons as components for cleaner rendering
const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ChevronIcon = ({ rotated }: { rotated: boolean }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{
      transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

export default function PublicCardPage({ cardData: initialCardData, error: initialError }: PageProps) {
  const [cardData, setCardData] = useState<CardData | null>(initialCardData);
  const [error] = useState<string | null>(initialError);
  const [showMore, setShowMore] = useState(false);
  const [hasTapped, setHasTapped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const generateVCard = () => {
    if (!cardData) return '';
    
    const nameParts = cardData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${cardData.fullName}`,
      cardData.company ? `ORG:${cardData.company}` : '',
      cardData.title ? `TITLE:${cardData.title}` : '',
      cardData.phone ? `TEL;TYPE=CELL:${cardData.phone}` : '',
      cardData.email ? `EMAIL:${cardData.email}` : '',
      cardData.website ? `URL:${cardData.website}` : '',
      cardData.city || cardData.state ? `ADR;TYPE=WORK:;;${cardData.city};${cardData.state};;;` : '',
      `NOTE:Tavvy Card: https://tavvy.com/card/${cardData.slug}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');
    
    return vcard;
  };

  const handleSaveContact = () => {
    if (!cardData) return;
    
    const vcard = generateVCard();
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cardData.fullName.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!cardData) return;
    
    const shareUrl = `https://tavvy.com/card/${cardData.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.fullName}'s Digital Card`,
          text: `Check out ${cardData.fullName}'s digital business card`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleTap = async () => {
    if (!cardData || hasTapped) return;
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    
    // Optimistic update
    setCardData(prev => prev ? { ...prev, tapCount: prev.tapCount + 1 } : null);
    setHasTapped(true);
    
    // Save to localStorage to prevent multiple taps
    try {
      localStorage.setItem(`tavvy_tapped_${cardData.id}`, 'true');
    } catch (e) {}
    
    // Update database
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('digital_cards')
          .update({ tap_count: cardData.tapCount + 1 })
          .eq('id', cardData.id);
      }
    } catch (err) {
      console.error('Error updating tap count:', err);
    }
  };

  // Check if user has already tapped this card
  React.useEffect(() => {
    if (cardData) {
      try {
        const tapped = localStorage.getItem(`tavvy_tapped_${cardData.id}`);
        if (tapped) setHasTapped(true);
      } catch (e) {}
    }
  }, [cardData]);

  const handleLinkClick = async (link: CardLink) => {
    // Track click (fire and forget)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('card_links')
          .update({ clicks: (link.clicks || 0) + 1 })
          .eq('id', link.id);
      }
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  if (error || !cardData) {
    return (
      <div style={styles.errorContainer}>
        <Head>
          <title>Card Not Found | Tavvy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        
        <div style={styles.errorGradientBg}></div>
        
        <div style={styles.errorMessageSmall}>
          <span style={styles.errorIconSmall}>🔍</span>
          <span style={styles.errorTextSmall}>This card doesn't exist or has been removed</span>
        </div>
        
        <div style={{
          ...styles.card,
          background: 'linear-gradient(145deg, #2563EB 0%, #1E40AF 50%, #1E3A8A 100%)',
          marginTop: '16px',
        }}>
          <div style={styles.photoContainer}>
            <div style={styles.photoPlaceholder}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          
          <h1 style={styles.name}>Your Name Here</h1>
          <p style={styles.title}>Your Title</p>
          <p style={styles.company}>Your Company</p>
          
          <p style={styles.locationBadge}>
            <LocationIcon /> Your City
          </p>
          
          <div style={styles.actionButtons}>
            <div style={styles.actionButton}>
              <PhoneIcon />
              <span style={styles.actionText}>Call</span>
            </div>
            <div style={styles.actionButton}>
              <MessageIcon />
              <span style={styles.actionText}>Text</span>
            </div>
            <div style={styles.actionButton}>
              <EmailIcon />
              <span style={styles.actionText}>Email</span>
            </div>
          </div>
        </div>
        
        <div style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Create Your Own Digital Card</h2>
          <p style={styles.ctaSubtitle}>Free forever. Share anywhere.</p>
          <div style={styles.appButtons}>
            <a href="https://apps.apple.com/app/tavvy" target="_blank" rel="noopener noreferrer" style={styles.appStoreButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>App Store</span>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.tavvy.app" target="_blank" rel="noopener noreferrer" style={styles.playStoreButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <span>Google Play</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const location = [cardData.city, cardData.state].filter(Boolean).join(', ');
  const hasSocialLinks = cardData.socialInstagram || cardData.socialFacebook || cardData.socialLinkedin || cardData.socialTwitter || cardData.socialTiktok;
  const hasLinks = cardData.links && cardData.links.length > 0;

  // Get template-specific styles based on templateId
  const getTemplateStyles = () => {
    const templateId = cardData.templateId || 'classic-blue';
    
    // Luxury templates (black/gold)
    if (templateId === 'luxury-gold') {
      return {
        isLuxury: true,
        isDark: true,
        hasOrnate: true,
        accentColor: '#d4af37',
        textColor: '#d4af37',
        buttonBg: 'rgba(212, 175, 55, 0.1)',
        buttonBorder: 'rgba(212, 175, 55, 0.3)',
        photoStyle: 'ornate',
      };
    }
    
    // Dark Pro templates
    if (templateId === 'dark-pro') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: '#d4af37',
        textColor: '#FFFFFF',
        buttonBg: 'rgba(255, 255, 255, 0.1)',
        buttonBorder: 'rgba(255, 255, 255, 0.15)',
        photoStyle: 'circle',
      };
    }
    
    // Minimal templates (white card)
    if (templateId === 'minimal-white') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cardData.gradientColor1,
        textColor: '#1f2937',
        buttonBg: 'rgba(0, 0, 0, 0.05)',
        buttonBorder: 'rgba(0, 0, 0, 0.1)',
        photoStyle: 'circle',
        hasWhiteCard: true,
      };
    }
    
    // Fun/Colorful templates
    if (templateId === 'fun-colorful') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: '#fde047',
        textColor: '#FFFFFF',
        buttonBg: 'rgba(255, 255, 255, 0.2)',
        buttonBorder: 'rgba(255, 255, 255, 0.2)',
        photoStyle: 'circle',
      };
    }
    
    // Default (classic, creator, etc.)
    return {
      isLuxury: false,
      isDark: false,
      hasOrnate: false,
      accentColor: 'rgba(255, 255, 255, 0.2)',
      textColor: '#FFFFFF',
      buttonBg: 'rgba(255, 255, 255, 0.12)',
      buttonBorder: 'rgba(255, 255, 255, 0.15)',
      photoStyle: 'circle',
    };
  };

  const templateStyles = getTemplateStyles();

  return (
    <>
      <Head>
        <title>{cardData.fullName} | Digital Card | Tavvy</title>
        <meta name="description" content={`${cardData.fullName}${cardData.title ? ` - ${cardData.title}` : ''}${cardData.company ? ` at ${cardData.company}` : ''}`} />
        <meta property="og:title" content={`${cardData.fullName}'s Digital Card`} />
        <meta property="og:description" content={`${cardData.title || 'Professional'}${cardData.company ? ` at ${cardData.company}` : ''}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://tavvy.com/card/${cardData.slug}`} />
        {cardData.profilePhotoUrl && <meta property="og:image" content={cardData.profilePhotoUrl} />}
        <meta name="twitter:card" content="summary" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes crownPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15) rotate(-5deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          }
          .social-btn:hover {
            transform: scale(1.1);
            background: rgba(255,255,255,0.25) !important;
          }
          .link-btn:hover {
            transform: translateX(4px);
            background: rgba(255,255,255,0.18) !important;
          }
          .crown-btn:hover:not(:disabled) {
            transform: scale(1.05);
          }
          .crown-btn:active:not(:disabled) {
            transform: scale(0.95);
          }
        `}</style>
      </Head>

      <div style={styles.page}>
        {/* Background Gradient */}
        <div 
          style={{
            ...styles.backgroundGradient,
            background: `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 50%, #0a0f1e 100%)`,
          }}
        />

        {/* Main Card Container */}
        <div style={styles.cardContainer}>
          {/* Crown Button - Top Right */}
          <button 
            onClick={handleTap}
            className="crown-btn"
            style={{
              ...styles.crownButton,
              ...(hasTapped ? styles.crownButtonTapped : {}),
            }}
            disabled={hasTapped}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              style={{
                animation: isAnimating ? 'crownPulse 0.6s ease' : 'none',
              }}
            >
              <defs>
                <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE066" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" />
                </linearGradient>
              </defs>
              <path 
                d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" 
                fill="url(#crownGold)"
              />
            </svg>
            <span style={styles.crownCount}>{cardData.tapCount || 0}</span>
          </button>

          {/* Profile Section */}
          <div style={styles.profileSection}>
            {/* Profile Photo */}
            <div style={styles.photoWrapper}>
              <div style={styles.photoRing}>
                {cardData.profilePhotoUrl ? (
                  <img 
                    src={cardData.profilePhotoUrl} 
                    alt={cardData.fullName}
                    style={styles.profilePhoto}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const placeholder = document.createElement('div');
                        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 700; color: white; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);';
                        placeholder.textContent = cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div style={styles.photoPlaceholder}>
                    <span style={styles.photoInitials}>
                      {cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name & Info */}
            <h1 style={{...styles.name, color: templateStyles.textColor}}>{cardData.fullName}</h1>
            {cardData.title && <p style={{...styles.title, color: templateStyles.textColor, opacity: 0.9}}>{cardData.title}</p>}
            {cardData.company && <p style={{...styles.company, color: templateStyles.textColor, opacity: 0.7}}>{cardData.company}</p>}
            
            {/* Bio */}
            {cardData.bio && (
              <p style={{
                ...styles.bio,
                color: templateStyles.textColor,
              }}>
                {cardData.bio}
              </p>
            )}
            
            {/* Address Display */}
            {(cardData.address1 || cardData.city) && (
              <div style={{
                ...styles.addressBadge,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
              }}>
                <LocationIcon />
                <div style={styles.addressText}>
                  {cardData.address1 && <span>{cardData.address1}</span>}
                  {cardData.address2 && <span> {cardData.address2}</span>}
                  {(cardData.city || cardData.state || cardData.zipCode) && (
                    <span style={styles.addressLine2}>
                      {[cardData.city, cardData.state].filter(Boolean).join(', ')}
                      {cardData.zipCode && ` ${cardData.zipCode}`}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Simple Location Badge (fallback if no full address) */}
            {!cardData.address1 && !cardData.city && location && (
              <div style={{
                ...styles.locationBadge,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
              }}>
                <LocationIcon />
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            {cardData.phone && (
              <a href={`tel:${cardData.phone}`} className="action-btn" style={{
                ...styles.actionButton,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
              }}>
                <div style={styles.actionIconWrapper}>
                  <PhoneIcon />
                </div>
                <span style={{...styles.actionText, color: templateStyles.textColor}}>Call</span>
              </a>
            )}
            {cardData.phone && (
              <a href={`sms:${cardData.phone}`} className="action-btn" style={{
                ...styles.actionButton,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
              }}>
                <div style={styles.actionIconWrapper}>
                  <MessageIcon />
                </div>
                <span style={{...styles.actionText, color: templateStyles.textColor}}>Text</span>
              </a>
            )}
            {cardData.email && (
              <a href={`mailto:${cardData.email}`} className="action-btn" style={{
                ...styles.actionButton,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
              }}>
                <div style={styles.actionIconWrapper}>
                  <EmailIcon />
                </div>
                <span style={{...styles.actionText, color: templateStyles.textColor}}>Email</span>
              </a>
            )}
            {cardData.website && (
              <a 
                href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="action-btn"
                style={{
                  ...styles.actionButton,
                  background: templateStyles.buttonBg,
                  borderColor: templateStyles.buttonBorder,
                  color: templateStyles.textColor,
                }}
              >
                <div style={styles.actionIconWrapper}>
                  <GlobeIcon />
                </div>
                <span style={{...styles.actionText, color: templateStyles.textColor}}>Website</span>
              </a>
            )}
          </div>

          {/* Social Links */}
          {hasSocialLinks && (
            <div style={styles.socialLinks}>
              {cardData.socialInstagram && (
                <a 
                  href={`https://instagram.com/${cardData.socialInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {cardData.socialFacebook && (
                <a 
                  href={cardData.socialFacebook.startsWith('http') ? cardData.socialFacebook : `https://facebook.com/${cardData.socialFacebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="Facebook"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {cardData.socialLinkedin && (
                <a 
                  href={cardData.socialLinkedin.startsWith('http') ? cardData.socialLinkedin : `https://linkedin.com/in/${cardData.socialLinkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {cardData.socialTwitter && (
                <a 
                  href={`https://twitter.com/${cardData.socialTwitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {cardData.socialTiktok && (
                <a 
                  href={`https://tiktok.com/@${cardData.socialTiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="TikTok"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
              {cardData.socialYoutube && (
                <a 
                  href={cardData.socialYoutube.startsWith('http') ? cardData.socialYoutube : `https://youtube.com/@${cardData.socialYoutube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="YouTube"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {cardData.socialSnapchat && (
                <a 
                  href={`https://snapchat.com/add/${cardData.socialSnapchat}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="Snapchat"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                  </svg>
                </a>
              )}
              {cardData.socialPinterest && (
                <a 
                  href={`https://pinterest.com/${cardData.socialPinterest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="Pinterest"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                  </svg>
                </a>
              )}
              {cardData.socialWhatsapp && (
                <a 
                  href={`https://wa.me/${cardData.socialWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={styles.socialButton}
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={styles.divider} />

          {/* Toggle for Links */}
          {hasLinks && (
            <button 
              onClick={() => setShowMore(!showMore)}
              style={styles.toggleButton}
            >
              <span style={styles.toggleText}>{showMore ? 'Hide Links' : 'View Links'}</span>
              <ChevronIcon rotated={showMore} />
            </button>
          )}

          {/* Links Section */}
          {hasLinks && showMore && (
            <div style={styles.linksSection}>
              {cardData.links.map((link, index) => (
                <a
                  key={link.id || index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    animationDelay: `${index * 0.05}s`,
                  }}
                  onClick={() => handleLinkClick(link)}
                >
                  <div style={styles.linkIconContainer}>
                    <LinkIcon />
                  </div>
                  <span style={styles.linkButtonText}>{link.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          <div style={styles.bottomActions}>
            <button onClick={handleSaveContact} style={styles.saveButton}>
              <SaveIcon />
              <span>Save Contact</span>
            </button>
            <button onClick={handleShare} style={styles.shareButton}>
              <ShareIcon />
              <span>Share</span>
            </button>
          </div>

          {/* Powered by Tavvy */}
          <div style={styles.poweredBy}>
            <span style={styles.poweredByText}>Powered by</span>
            <a href="https://tavvy.com" target="_blank" rel="noopener noreferrer" style={styles.tavvyLink}>
              <img 
                src="https://tavvy.com/tavvy-logo-white.png" 
                alt="Tavvy" 
                style={styles.tavvyLogo}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const span = document.createElement('span');
                  span.textContent = 'Tavvy';
                  span.style.cssText = 'font-size: 20px; font-weight: 700; color: white; letter-spacing: -0.5px;';
                  target.parentElement?.appendChild(span);
                }}
              />
            </a>
            <p style={styles.ctaText}>Create your free digital card</p>
            <div style={styles.appButtons}>
              <a href="https://apps.apple.com/app/tavvy" target="_blank" rel="noopener noreferrer" style={styles.appStoreButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>App Store</span>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.tavvy.app" target="_blank" rel="noopener noreferrer" style={styles.playStoreButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span>Google Play</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Premium Styles
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  cardContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '440px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px 40px',
    boxSizing: 'border-box',
    zIndex: 1,
  },
  crownButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '10px 14px 8px',
    background: 'linear-gradient(145deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  crownButtonTapped: {
    background: 'linear-gradient(145deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 165, 0, 0.2) 100%)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
    boxShadow: '0 6px 24px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  crownCount: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFD700',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    letterSpacing: '0.3px',
  },
  profileSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  photoWrapper: {
    marginBottom: '20px',
  },
  photoRing: {
    width: '140px',
    height: '140px',
    borderRadius: '70px',
    padding: '4px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.2)',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: '66px',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '66px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: '42px',
    fontWeight: '700',
    color: 'white',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  name: {
    fontSize: '30px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 6px 0',
    textAlign: 'center',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: '17px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '0 0 2px 0',
    textAlign: 'center',
    letterSpacing: '0.2px',
  },
  company: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  bio: {
    fontSize: '14px',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.75)',
    margin: '0 0 16px 0',
    textAlign: 'center',
    lineHeight: '1.5',
    maxWidth: '320px',
    padding: '0 16px',
  },
  addressBadge: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    background: 'rgba(255, 255, 255, 0.12)',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '8px',
  },
  addressText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  addressLine2: {
    display: 'block',
    opacity: 0.85,
  },
  locationBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    background: 'rgba(255, 255, 255, 0.12)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    width: '100%',
    maxWidth: '340px',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '76px',
    height: '76px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    textDecoration: 'none',
    transition: 'all 0.25s ease',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
  },
  actionIconWrapper: {
    marginBottom: '6px',
    opacity: 0.95,
  },
  actionText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: '0.3px',
  },
  socialLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  socialButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    background: 'rgba(255, 255, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  divider: {
    width: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    borderRadius: '2px',
    marginBottom: '20px',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '30px',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    color: 'white',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  toggleText: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  linksSection: {
    width: '100%',
    maxWidth: '360px',
    marginBottom: '24px',
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    textDecoration: 'none',
    marginBottom: '10px',
    transition: 'all 0.25s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeInUp 0.4s ease forwards',
    opacity: 0,
  },
  linkIconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '14px',
    color: 'white',
  },
  linkButtonText: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    letterSpacing: '0.2px',
  },
  bottomActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    maxWidth: '360px',
    marginBottom: '40px',
  },
  saveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  shareButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    background: 'white',
    border: 'none',
    borderRadius: '16px',
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '20px',
  },
  poweredByText: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    margin: '0 0 6px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tavvyLink: {
    textDecoration: 'none',
  },
  tavvyLogo: {
    height: '24px',
    opacity: 0.9,
  },
  ctaText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '12px 0 14px 0',
  },
  appButtons: {
    display: 'flex',
    gap: '10px',
  },
  appStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  playStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  // Error page styles
  errorContainer: {
    minHeight: '100vh',
    background: '#0a0f1e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  errorGradientBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '50vh',
    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  errorMessageSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '30px',
    marginTop: '20px',
    zIndex: 1,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  errorIconSmall: {
    fontSize: '16px',
  },
  errorTextSmall: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    borderRadius: '28px',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  photoContainer: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    overflow: 'hidden',
    marginBottom: '20px',
    border: '4px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '40px',
    zIndex: 1,
  },
  ctaTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 8px 0',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  ctaSubtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 24px 0',
  },
};

// Server-side data fetching
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { username } = context.params as { username: string };
  const slug = username; // For compatibility with existing code
  
  // Reserved usernames that should not be treated as card slugs
  const RESERVED_ROUTES = [
    'home', 'login', 'signup', 'register', 'logout', 'auth', 'api', 'admin', 'dashboard',
    'pros', 'atlas', 'universe', 'universes', 'explore', 'discover', 'search', 'places',
    'cities', 'rides', 'realtors', 'wallet', 'apps', 'menu', 'settings', 'profile', 'account',
    'card', 'cards', 'ecard', 'ecards', 'c', 'create', 'edit', 'preview', 'templates', 'themes',
    'shop', 'store', 'marketplace', 'events', 'tickets', 'booking', 'bookings', 'jobs', 'careers',
    'blog', 'news', 'help', 'support', 'contact', 'about', 'about-us', 'terms', 'privacy', 'legal',
    'faq', 'pricing', 'plans', 'premium', 'pro', 'business', 'enterprise',
    'tavvy', 'tavvyapp', 'official', 'verified', 'team', 'staff', 'moderator', 'mod',
    'www', 'mail', 'email', 'ftp', 'cdn', 'static', 'assets', 'images', 'img', 'files',
    'uploads', 'download', 'downloads', 'place', 'app', '_next', 'favicon.ico'
  ];
  
  // Check if this is a reserved route
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return {
      notFound: true,
    };
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  console.log('[Card SSR] Fetching card:', slug);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Card SSR] Missing Supabase credentials');
    return {
      props: {
        cardData: null,
        error: 'Configuration error',
      },
    };
  }
  
  try {
    const serverSupabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error: fetchError } = await serverSupabase
      .from('digital_cards')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (fetchError || !data) {
      console.log('[Card SSR] Card not found:', slug);
      return {
        props: {
          cardData: null,
          error: 'Card not found',
        },
      };
    }
    
    console.log('[Card SSR] Card found:', data.full_name);
    
    const { data: linksData } = await serverSupabase
      .from('card_links')
      .select('*')
      .eq('card_id', data.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    // Increment view count
    serverSupabase
      .from('digital_cards')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {});
    
    const cardData: CardData = {
      id: data.id,
      slug: data.slug,
      templateId: data.template_id || 'classic-blue',
      colorSchemeId: data.color_scheme_id || 'blue',
      fullName: data.full_name,
      title: data.title || '',
      company: data.company || '',
      bio: data.bio || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      // Address fields
      address1: data.address_1 || data.address1 || '',
      address2: data.address_2 || data.address2 || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zip_code || data.zipCode || '',
      country: data.country || 'USA',
      gradientColor1: data.gradient_color_1 || '#1E90FF',
      gradientColor2: data.gradient_color_2 || '#00BFFF',
      profilePhotoUrl: data.profile_photo_url,
      // Social links
      socialInstagram: data.social_instagram || '',
      socialFacebook: data.social_facebook || '',
      socialLinkedin: data.social_linkedin || '',
      socialTwitter: data.social_twitter || '',
      socialTiktok: data.social_tiktok || '',
      socialYoutube: data.social_youtube || '',
      socialSnapchat: data.social_snapchat || '',
      socialPinterest: data.social_pinterest || '',
      socialWhatsapp: data.social_whatsapp || '',
      // Featured socials (parse JSON if stored as string)
      featuredSocials: data.featured_socials ? 
        (typeof data.featured_socials === 'string' ? JSON.parse(data.featured_socials) : data.featured_socials) 
        : [],
      tapCount: data.tap_count || 0,
      links: linksData?.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon || 'link',
        sort_order: l.sort_order,
        clicks: l.clicks || 0,
      })) || [],
    };
    
    return {
      props: {
        cardData,
        error: null,
      },
    };
  } catch (err) {
    console.error('[Card SSR] Error:', err);
    return {
      props: {
        cardData: null,
        error: 'Failed to load card',
      },
    };
  }
};
