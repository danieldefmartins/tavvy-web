/**
 * Public Digital Card Viewer
 * Path: pages/card/[slug].tsx
 * URL: tavvy.com/card/[slug]
 *
 * Features:
 * - View anyone's digital business card
 * - Integrated links section (part of the card design)
 * - Toggle to show more content (links, products, etc.)
 * - Save to phone contacts (vCard download)
 * - Call, Text, Email actions
 * - Social links
 * - "Powered by Tavvy" branding with app download CTA
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
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  gradientColor1: string;
  gradientColor2: string;
  profilePhotoUrl: string | null;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  links: CardLink[];
}

interface PageProps {
  cardData: CardData | null;
  error: string | null;
}

export default function PublicCardPage({ cardData: initialCardData, error: initialError }: PageProps) {
  const [cardData] = useState<CardData | null>(initialCardData);
  const [error] = useState<string | null>(initialError);
  const [showMore, setShowMore] = useState(false);

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
          
          <p style={styles.location}>
            <span style={styles.locationIcon}>📍</span> Your City
          </p>
          
          <div style={styles.actionButtons}>
            <div style={styles.actionButton}>
              <span style={styles.actionIcon}>📞</span>
              <span style={styles.actionText}>Call</span>
            </div>
            <div style={styles.actionButton}>
              <span style={styles.actionIcon}>💬</span>
              <span style={styles.actionText}>Text</span>
            </div>
            <div style={styles.actionButton}>
              <span style={styles.actionIcon}>✉️</span>
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
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={styles.page}>
        {/* Main Card Container - Unified Design */}
        <div 
          style={{
            ...styles.cardContainer,
            background: `linear-gradient(180deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 60%, #0F1233 100%)`,
          }}
        >
          {/* Profile Section */}
          <div style={styles.profileSection}>
            {/* Profile Photo */}
            <div style={styles.photoContainer}>
              {cardData.profilePhotoUrl ? (
                <img 
                  src={cardData.profilePhotoUrl} 
                  alt={cardData.fullName}
                  style={styles.profilePhoto}
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const placeholder = document.createElement('div');
                      placeholder.style.cssText = 'width: 120px; height: 120px; border-radius: 60px; background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%); display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: white;';
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

            {/* Name & Info */}
            <h1 style={styles.name}>{cardData.fullName}</h1>
            {cardData.title && <p style={styles.title}>{cardData.title}</p>}
            {cardData.company && <p style={styles.company}>{cardData.company}</p>}
            {location && (
              <p style={styles.location}>
                <span style={styles.locationIcon}>📍</span> {location}
              </p>
            )}

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={styles.actionButton}>
                  <span style={styles.actionIcon}>📞</span>
                  <span style={styles.actionText}>Call</span>
                </a>
              )}
              {cardData.phone && (
                <a href={`sms:${cardData.phone}`} style={styles.actionButton}>
                  <span style={styles.actionIcon}>💬</span>
                  <span style={styles.actionText}>Text</span>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={styles.actionButton}>
                  <span style={styles.actionIcon}>✉️</span>
                  <span style={styles.actionText}>Email</span>
                </a>
              )}
              {cardData.website && (
                <a 
                  href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.actionButton}
                >
                  <span style={styles.actionIcon}>🌐</span>
                  <span style={styles.actionText}>Website</span>
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
                    style={styles.socialButton}
                    title="Instagram"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {cardData.socialFacebook && (
                  <a 
                    href={cardData.socialFacebook.startsWith('http') ? cardData.socialFacebook : `https://facebook.com/${cardData.socialFacebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.socialButton}
                    title="Facebook"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {cardData.socialLinkedin && (
                  <a 
                    href={cardData.socialLinkedin.startsWith('http') ? cardData.socialLinkedin : `https://linkedin.com/in/${cardData.socialLinkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.socialButton}
                    title="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {cardData.socialTwitter && (
                  <a 
                    href={`https://twitter.com/${cardData.socialTwitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.socialButton}
                    title="X (Twitter)"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {cardData.socialTiktok && (
                  <a 
                    href={`https://tiktok.com/@${cardData.socialTiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.socialButton}
                    title="TikTok"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Toggle for More Content */}
          {hasLinks && (
            <button 
              onClick={() => setShowMore(!showMore)}
              style={styles.toggleButton}
            >
              <span style={styles.toggleText}>{showMore ? 'Hide Links' : 'View Links'}</span>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="white"
                style={{
                  transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
          )}

          {/* Links Section - Integrated into Card */}
          {hasLinks && showMore && (
            <div style={styles.linksSection}>
              <h3 style={styles.linksSectionTitle}>Links</h3>
              {cardData.links.map((link, index) => (
                <a
                  key={link.id || index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkButton}
                  onClick={() => handleLinkClick(link)}
                >
                  <div style={styles.linkIconContainer}>
                    {link.icon === 'shop' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    )}
                    {link.icon === 'calendar' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                      </svg>
                    )}
                    {link.icon === 'portfolio' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                      </svg>
                    )}
                    {(link.icon === 'link' || !link.icon) && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                      </svg>
                    )}
                  </div>
                  <span style={styles.linkButtonText}>{link.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Save & Share Buttons */}
          <div style={styles.bottomActions}>
            <button onClick={handleSaveContact} style={styles.saveButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Save Contact
            </button>
            <button onClick={handleShare} style={styles.shareButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share
            </button>
          </div>

          {/* Powered by Tavvy */}
          <div style={styles.poweredBy}>
            <p style={styles.poweredByText}>Powered by</p>
            <a href="https://tavvy.com" style={styles.tavvyLink}>
              <img src="/brand/tavvy-logo-white.png" alt="Tavvy" style={styles.tavvyLogo} />
            </a>
            <p style={styles.ctaText}>Create your own free digital card</p>
            <div style={styles.appButtons}>
              <a 
                href="https://apps.apple.com/app/tavvy"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.appStoreButton}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>App Store</span>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.tavvy.app"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.playStoreButton}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
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

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: '#0F1233',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '480px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px 30px',
    boxSizing: 'border-box',
  },
  profileSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  photoContainer: {
    width: '130px',
    height: '130px',
    borderRadius: '65px',
    overflow: 'hidden',
    marginBottom: '20px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: '40px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  name: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 8px 0',
    textAlign: 'center',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  company: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 12px 0',
    textAlign: 'center',
  },
  location: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.15)',
    padding: '8px 16px',
    borderRadius: '20px',
  },
  locationIcon: {
    fontSize: '14px',
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    width: '100%',
    maxWidth: '320px',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  actionText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  socialLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  socialButton: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '30px',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
  },
  toggleText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
  },
  linksSection: {
    width: '100%',
    maxWidth: '380px',
    marginBottom: '24px',
    animation: 'fadeIn 0.3s ease',
  },
  linksSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    textDecoration: 'none',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  linkIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '14px',
  },
  linkButtonText: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  },
  bottomActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    maxWidth: '380px',
    marginBottom: '32px',
  },
  saveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '14px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    borderRadius: '14px',
    color: '#1E3A5F',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '20px',
  },
  poweredByText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 8px 0',
  },
  tavvyLink: {
    textDecoration: 'none',
  },
  tavvyLogo: {
    height: '28px',
    opacity: 0.9,
  },
  ctaText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '12px 0 16px 0',
  },
  appButtons: {
    display: 'flex',
    gap: '12px',
  },
  appStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  playStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  // Error page styles
  errorContainer: {
    minHeight: '100vh',
    background: '#0F1233',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  errorGradientBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '50vh',
    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.2) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  errorMessageSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    marginTop: '20px',
    zIndex: 1,
  },
  errorIconSmall: {
    fontSize: '16px',
  },
  errorTextSmall: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    borderRadius: '24px',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '40px',
    zIndex: 1,
  },
  ctaTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 24px 0',
  },
};

// Server-side data fetching
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
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
      fullName: data.full_name,
      title: data.title || '',
      company: data.company || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      city: data.city || '',
      state: data.state || '',
      gradientColor1: data.gradient_color_1 || '#8B5CF6',
      gradientColor2: data.gradient_color_2 || '#4F46E5',
      profilePhotoUrl: data.profile_photo_url,
      socialInstagram: data.social_instagram || '',
      socialFacebook: data.social_facebook || '',
      socialLinkedin: data.social_linkedin || '',
      socialTwitter: data.social_twitter || '',
      socialTiktok: data.social_tiktok || '',
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
