/**
 * Public Digital Card Viewer
 * Path: pages/card/[slug].tsx
 * URL: tavvy.com/card/[slug]
 *
 * Features:
 * - View anyone's digital business card
 * - Save to phone contacts (vCard download)
 * - Call, Text, Email actions
 * - Social links
 * - "Powered by Tavvy" branding with app download CTA
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

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
  const [activeTab, setActiveTab] = useState<'card' | 'links'>('card');

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
    
    const shareData = {
      title: `${cardData.fullName}'s Digital Card`,
      text: `Check out ${cardData.fullName}'s digital business card`,
      url: `https://tavvy.com/card/${cardData.slug}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  if (error || !cardData) {
    return (
      <div style={styles.errorContainer}>
        <Head>
          <title>Card Not Found | Tavvy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        
        {/* Decorative gradient background */}
        <div style={styles.errorGradientBg}></div>
        
        {/* Small error message at top */}
        <div style={styles.errorMessageSmall}>
          <span style={styles.errorIconSmall}>🔍</span>
          <span style={styles.errorTextSmall}>This card doesn't exist or has been removed</span>
        </div>
        
        {/* MAIN ATTRACTION: Beautiful Sample Card */}
        <div style={{
          ...styles.card,
          background: 'linear-gradient(145deg, #2563EB 0%, #1E40AF 50%, #1E3A8A 100%)',
          marginTop: '16px',
        }}>
          {/* Sample Avatar */}
          <div style={styles.photoContainer}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
              border: '4px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          
          {/* Sample Name & Title */}
          <h1 style={styles.name}>Your Name Here</h1>
          <p style={styles.title}>Your Title</p>
          <p style={styles.company}>Your Company</p>
          
          {/* Sample Location Badge */}
          <div style={styles.locationBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Your City
          </div>
          
          {/* Sample Action Buttons */}
          <div style={styles.actions}>
            <div style={styles.actionButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>Call</span>
            </div>
            <div style={styles.actionButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Text</span>
            </div>
            <div style={styles.actionButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>Email</span>
            </div>
          </div>
        </div>
        
        {/* Subtle CTA at bottom */}
        <div style={styles.subtleCta}>
          <p style={styles.subtleCtaText}>Create your own digital card for free</p>
          <div style={styles.subtleCtaButtons}>
            <a 
              href="https://apps.apple.com/app/tavvy"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.subtleAppButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=com.tavvy.app"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.subtleAppButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
            </a>
          </div>
        </div>
        
        {/* Tavvy Logo */}
        <div style={styles.errorFooter}>
          <a href="https://tavvy.com" style={styles.tavvyLinkSmall}>
            <img src="/brand/tavvy-logo-white.png" alt="Tavvy" style={styles.tavvyLogoSmall} />
          </a>
        </div>
      </div>
    );
  }

  const hasSocialLinks = cardData.socialInstagram || cardData.socialFacebook || 
                         cardData.socialLinkedin || cardData.socialTwitter || cardData.socialTiktok;
  const location = [cardData.city, cardData.state].filter(Boolean).join(', ');

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
        {/* Card */}
        <div 
          style={{
            ...styles.card,
            background: `linear-gradient(135deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`,
          }}
        >
          {/* Profile Photo */}
          <div style={styles.photoContainer}>
            {cardData.profilePhotoUrl ? (
              <img 
                src={cardData.profilePhotoUrl} 
                alt={cardData.fullName}
                style={styles.profilePhoto}
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
                  title="Twitter/X"
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

        {/* Toggle Tabs - Card / Links (only show if there are links) */}
        {cardData.links && cardData.links.length > 0 && (
          <div style={styles.toggleContainer}>
            <button
              onClick={() => setActiveTab('card')}
              style={{
                ...styles.toggleTab,
                ...(activeTab === 'card' ? styles.toggleTabActive : {}),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z"/>
              </svg>
              Card
            </button>
            <button
              onClick={() => setActiveTab('links')}
              style={{
                ...styles.toggleTab,
                ...(activeTab === 'links' ? styles.toggleTabActive : {}),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
              Links
            </button>
          </div>
        )}

        {/* Links Section */}
        {activeTab === 'links' && cardData.links && cardData.links.length > 0 && (
          <div style={styles.linksSection}>
            {cardData.links.map((link, index) => (
              <a
                key={link.id || index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.linkButton,
                  background: `linear-gradient(135deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`,
                }}
                onClick={async (e) => {
                  // Track click
                  try {
                    await supabase
                      .from('card_links')
                      .update({ clicks: link.clicks + 1 })
                      .eq('id', link.id);
                  } catch (err) {
                    console.error('Error tracking click:', err);
                  }
                }}
              >
                <span style={styles.linkButtonText}>{link.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
              </a>
            ))}
          </div>
        )}

        {/* Save & Share Buttons */}
        <div style={styles.bottomActions}>
          <button onClick={handleSaveContact} style={styles.saveButton}>
            <span style={styles.buttonIcon}>👤</span>
            Save to Contacts
          </button>
          <button onClick={handleShare} style={styles.shareButton}>
            <span style={styles.buttonIcon}>📤</span>
            Share Card
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <span>Google Play</span>
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #0F172A;
          min-height: 100vh;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 20px',
    paddingBottom: '50px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0F172A',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(139, 92, 246, 0.3)',
    borderTopColor: '#8B5CF6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#94A3B8',
    fontSize: '18px',
    fontWeight: '500',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0F172A',
    padding: '28px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  errorGradientBg: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(79, 70, 229, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  errorCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px 32px',
    maxWidth: '380px',
    width: '100%',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    zIndex: 1,
  },
  errorIconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  errorIconEmoji: {
    fontSize: '40px',
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '0',
  },
  ctaSection: {
    marginTop: '32px',
    position: 'relative',
    zIndex: 1,
    maxWidth: '380px',
    width: '100%',
  },
  ctaDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  ctaDividerText: {
    color: '#64748B',
    fontSize: '14px',
    fontWeight: '500',
    padding: '0 16px',
    background: '#0F172A',
  },
  ctaTitle: {
    color: '#F8FAFC',
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '8px',
    letterSpacing: '-0.3px',
  },
  ctaSubtitle: {
    color: '#94A3B8',
    fontSize: '15px',
    marginBottom: '24px',
  },
  ctaButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  ctaAppButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)',
    color: '#fff',
    padding: '14px 24px',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
  },
  errorMessageSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '12px',
    marginBottom: '8px',
    position: 'relative',
    zIndex: 1,
  },
  errorIconSmall: {
    fontSize: '16px',
  },
  errorTextSmall: {
    color: '#94A3B8',
    fontSize: '14px',
    fontWeight: '500',
  },
  subtleCta: {
    marginTop: '32px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  subtleCtaText: {
    color: '#64748B',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '12px',
  },
  subtleCtaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtleAppButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(148, 163, 184, 0.15)',
    color: '#94A3B8',
    textDecoration: 'none',
    transition: 'background 0.2s, color 0.2s',
  },
  errorFooter: {
    marginTop: '32px',
    position: 'relative',
    zIndex: 1,
  },
  tavvyLinkSmall: {
    display: 'block',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  tavvyLogoSmall: {
    height: '24px',
    width: 'auto',
  },
  errorLink: {
    color: '#8B5CF6',
    fontSize: '18px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '28px',
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
  },
  photoContainer: {
    marginBottom: '24px',
  },
  profilePhoto: {
    width: '130px',
    height: '130px',
    borderRadius: '65px',
    objectFit: 'cover',
    border: '5px solid rgba(255, 255, 255, 0.35)',
  },
  photoPlaceholder: {
    width: '130px',
    height: '130px',
    borderRadius: '65px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '5px solid rgba(255, 255, 255, 0.35)',
  },
  photoInitials: {
    color: '#fff',
    fontSize: '48px',
    fontWeight: '800',
  },
  name: {
    color: '#fff',
    fontSize: '34px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  title: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: '22px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '6px',
  },
  company: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '20px',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '12px',
  },
  location: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '16px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '28px',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: '10px 18px',
    borderRadius: '24px',
  },
  locationIcon: {
    fontSize: '16px',
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '14px',
    marginBottom: '28px',
    width: '100%',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: '20px',
    textDecoration: 'none',
    transition: 'background-color 0.2s, transform 0.2s',
  },
  actionIcon: {
    fontSize: '28px',
    marginBottom: '6px',
  },
  actionText: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
  socialLinks: {
    display: 'flex',
    gap: '18px',
    marginBottom: '20px',
  },
  socialButton: {
    width: '52px',
    height: '52px',
    borderRadius: '26px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, transform 0.2s',
  },
  bottomActions: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    gap: '14px',
    marginTop: '28px',
  },
  saveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '18px',
    backgroundColor: '#8B5CF6',
    color: '#fff',
    border: 'none',
    borderRadius: '18px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
  },
  shareButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '18px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '2px solid rgba(255, 255, 255, 0.35)',
    borderRadius: '18px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  buttonIcon: {
    fontSize: '20px',
  },
  poweredBy: {
    marginTop: '48px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  poweredByText: {
    color: '#64748B',
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '10px',
  },
  tavvyLink: {
    marginBottom: '16px',
  },
  tavvyLogo: {
    height: '48px',
    maxWidth: '180px',
    objectFit: 'contain',
  },
  ctaText: {
    color: '#94A3B8',
    fontSize: '16px',
    marginBottom: '20px',
  },
  appButtons: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  appStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'background-color 0.2s',
  },
  playStoreButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'background-color 0.2s',
  },
  // Toggle tabs styles
  toggleContainer: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px',
    marginTop: '20px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '16px',
    padding: '6px',
  },
  toggleTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    color: '#94A3B8',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggleTabActive: {
    background: '#8B5CF6',
    color: '#fff',
  },
  // Links section styles
  linksSection: {
    width: '100%',
    maxWidth: '420px',
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderRadius: '16px',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
  },
};


// Server-side data fetching - this runs on the server where env vars are available
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  console.log('[Card SSR] Fetching card:', slug);
  console.log('[Card SSR] Supabase URL available:', !!supabaseUrl);
  console.log('[Card SSR] Supabase Key available:', !!supabaseKey);
  
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
    // Create a server-side Supabase client
    const serverSupabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch the card
    const { data, error: fetchError } = await serverSupabase
      .from('digital_cards')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (fetchError || !data) {
      console.log('[Card SSR] Card not found:', slug, fetchError?.message);
      return {
        props: {
          cardData: null,
          error: 'Card not found',
        },
      };
    }
    
    console.log('[Card SSR] Card found:', data.full_name);
    
    // Fetch links for this card
    const { data: linksData } = await serverSupabase
      .from('card_links')
      .select('*')
      .eq('card_id', data.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    // Increment view count (fire and forget)
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
