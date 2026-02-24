/**
 * CardPreview — renders a card preview directly (no iframe).
 * Supports all business card templates and the main card templates.
 * Receives card data + links and renders a faithful visual preview.
 */

import React from 'react';
import { CardData, LinkItem, FeaturedSocial } from '../../lib/ecard';

interface CardPreviewProps {
  card: CardData;
  links: LinkItem[];
}

// Helper: compute luminance from hex color
function hexLuminance(hex: string): number {
  const c = hex.replace('#', '');
  if (c.length !== 6) return 0;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toL = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
}

function isLightColor(hex: string): boolean {
  return hexLuminance(hex) > 0.4;
}

// Social icon SVG paths
const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  snapchat: 'M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.254.04-.02.08-.04.12-.04.26 0 .479.2.479.46 0 .18-.09.33-.24.42-.42.24-1.08.54-1.68.63-.18.03-.32.08-.42.18-.12.12-.15.3-.12.51.12.45.36 1.05.63 1.56.63 1.17 1.5 2.07 2.58 2.67.18.09.27.21.33.36.06.18 0 .36-.12.48-.42.36-1.14.42-1.74.54-.18.03-.33.06-.42.12-.12.09-.18.21-.18.39 0 .06.01.12.03.18.09.33.15.63.15.9 0 .3-.09.54-.33.69-.39.27-.99.36-1.56.42-.3.03-.54.06-.69.12-.18.09-.3.24-.42.45-.21.33-.51.78-.87.99-.36.21-.75.33-1.17.33-.45 0-.9-.12-1.44-.36-.84-.39-1.56-.57-2.22-.57-.66 0-1.38.18-2.22.57-.54.24-.99.36-1.44.36-.42 0-.81-.12-1.17-.33-.36-.21-.66-.66-.87-.99-.12-.21-.24-.36-.42-.45-.15-.06-.39-.09-.69-.12-.57-.06-1.17-.15-1.56-.42-.24-.15-.33-.39-.33-.69 0-.27.06-.57.15-.9.02-.06.03-.12.03-.18 0-.18-.06-.3-.18-.39-.09-.06-.24-.09-.42-.12-.6-.12-1.32-.18-1.74-.54-.12-.12-.18-.3-.12-.48.06-.15.15-.27.33-.36 1.08-.6 1.95-1.5 2.58-2.67.27-.51.51-1.11.63-1.56.03-.21 0-.39-.12-.51-.1-.1-.24-.15-.42-.18-.6-.09-1.26-.39-1.68-.63-.15-.09-.24-.24-.24-.42 0-.26.22-.46.48-.46.04 0 .08.02.12.04.26.13.62.24.92.25.2 0 .33-.04.4-.09-.01-.16-.02-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.447 1.069 10.8.793 11.794.793h.412z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  pinterest: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z',
  email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  website: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

const SOCIAL_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  linkedin: '#0077B5',
  tiktok: '#000000',
  facebook: '#1877F2',
  youtube: '#FF0000',
  twitter: '#000000',
  snapchat: '#FFFC00',
  whatsapp: '#25D366',
  pinterest: '#E60023',
  email: '#EA4335',
  phone: '#34C759',
  website: '#4A90D9',
};

export default function CardPreview({ card, links }: CardPreviewProps) {
  const c1 = card.gradient_color_1 || '#1E90FF';
  const c2 = card.gradient_color_2 || '#00BFFF';
  const template = card.template_id || 'classic-blue';
  const showContact = (card as any).show_contact_info !== false;
  const showSocial = (card as any).show_social_icons !== false;
  const profilePhotoUrl = card.profile_photo_url;
  const bannerImageUrl = card.banner_image_url;
  const featuredSocials: FeaturedSocial[] = card.featured_socials || [];

  // Determine text colors based on background
  const isBiz = template.startsWith('biz-');
  const avgLum = (hexLuminance(c1) + hexLuminance(c2)) / 2;
  const headerTextColor = avgLum > 0.4 ? '#1a1a2e' : '#ffffff';
  const bodyBg = isBiz ? '#ffffff' : 'transparent';
  const bodyTextColor = isBiz ? '#1a1a2e' : headerTextColor;

  // Social links from card data
  const socialInstagram = (card as any).social_instagram;
  const socialLinkedin = (card as any).social_linkedin;
  const socialTiktok = (card as any).social_tiktok;
  const socialFacebook = (card as any).social_facebook;
  const socialTwitter = (card as any).social_twitter;
  const socialYoutube = (card as any).social_youtube;
  const socialSnapchat = (card as any).social_snapchat;
  const socialWhatsapp = (card as any).social_whatsapp;
  const socialPinterest = (card as any).social_pinterest;

  // Determine which social links to show (dedup against featured)
  const featuredPlatforms = new Set(featuredSocials.map(s => s.platform.toLowerCase()));

  const renderProfilePhoto = (size: number = 80) => {
    if (!profilePhotoUrl) return null;
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0,
      }}>
        <img src={profilePhotoUrl} alt={card.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  };

  const renderContactRow = (icon: string, value: string, label: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: bodyTextColor }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6B7280' }}>{label}</div>
      </div>
    </div>
  );

  const renderFeaturedSocials = () => {
    if (!featuredSocials.length || !showSocial) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
        {featuredSocials.map((social, i) => {
          const platform = social.platform.toLowerCase();
          const color = SOCIAL_COLORS[platform] || '#333';
          return (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: '50%', background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d={SOCIAL_ICONS[platform] || ''} />
              </svg>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSocialLinks = () => {
    if (!showSocial) return null;
    const socials: { platform: string; url: string }[] = [];
    if (socialInstagram && !featuredPlatforms.has('instagram')) socials.push({ platform: 'instagram', url: socialInstagram });
    if (socialLinkedin && !featuredPlatforms.has('linkedin')) socials.push({ platform: 'linkedin', url: socialLinkedin });
    if (socialTiktok && !featuredPlatforms.has('tiktok')) socials.push({ platform: 'tiktok', url: socialTiktok });
    if (socialFacebook && !featuredPlatforms.has('facebook')) socials.push({ platform: 'facebook', url: socialFacebook });
    if (socialTwitter && !featuredPlatforms.has('twitter')) socials.push({ platform: 'twitter', url: socialTwitter });
    if (socialYoutube && !featuredPlatforms.has('youtube')) socials.push({ platform: 'youtube', url: socialYoutube });
    if (socialSnapchat && !featuredPlatforms.has('snapchat')) socials.push({ platform: 'snapchat', url: socialSnapchat });
    if (socialWhatsapp && !featuredPlatforms.has('whatsapp')) socials.push({ platform: 'whatsapp', url: socialWhatsapp });
    if (socialPinterest && !featuredPlatforms.has('pinterest')) socials.push({ platform: 'pinterest', url: socialPinterest });
    if (!socials.length) return null;

    const btnBg = isBiz ? 'rgba(0,0,0,0.06)' : `${c1}33`;
    const iconColor = isLightColor(btnBg.includes('rgba') ? '#f0f0f0' : c1) ? '#1a1a2e' : bodyTextColor;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        {socials.map((social, i) => (
          <div key={i} style={{
            width: 44, height: 44, borderRadius: '50%', background: btnBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={iconColor}>
              <path d={SOCIAL_ICONS[social.platform] || ''} />
            </svg>
          </div>
        ))}
      </div>
    );
  };

  const renderLinks = () => {
    if (!links.length) return null;
    return (
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map((link) => (
          <div key={link.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: isBiz ? 'rgba(0,0,0,0.04)' : `${c1}1a`,
            borderRadius: 12, cursor: 'pointer',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isBiz ? 'rgba(0,0,0,0.06)' : `${c1}33`,
            }}>
              <span style={{ fontSize: 14 }}>🌐</span>
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: bodyTextColor }}>{link.title || link.url}</span>
            <span style={{ color: '#9CA3AF', fontSize: 14 }}>›</span>
          </div>
        ))}
      </div>
    );
  };

  // ===== CIVIC / POLITICAL TEMPLATES =====
  const isCivic = template.startsWith('civic-card') || template === 'politician-generic';
  if (isCivic) {
    const ballotNumber = card.ballot_number;
    const partyName = card.party_name;
    const officeRunningFor = card.office_running_for;
    const campaignSlogan = card.campaign_slogan;
    const region = card.region;

    // Determine civic variant colors
    const isFlag = template === 'civic-card-flag';
    const isRally = template === 'civic-card-rally';
    const isClean = template === 'civic-card-clean';
    const isBold = template === 'civic-card-bold';
    const accentColor = isFlag ? '#009739' : isRally ? '#1a2744' : c1 || '#003366';
    const pageBg = isFlag ? '#1a1a2e' : isRally ? '#F5C518' : isClean ? '#e8edf2' : '#f0f2f5';
    const cardBg = '#FFFFFF';

    return (
      <div style={{ background: pageBg, borderRadius: 16, overflow: 'hidden', minHeight: 400 }}>
        {/* Civic header accent bar */}
        <div style={{
          background: isFlag
            ? 'linear-gradient(135deg, #009739 0%, #002776 50%, #FEDD00 100%)'
            : isRally
              ? `linear-gradient(135deg, ${accentColor}, #1a1a2e)`
              : `linear-gradient(135deg, ${c1}, ${c2})`,
          padding: '24px 20px 16px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {ballotNumber && (
            <div style={{
              position: 'absolute', top: 12, right: 16,
              background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 12px',
              fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 2,
            }}>
              {ballotNumber}
            </div>
          )}
          {profilePhotoUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.4)',
              }}>
                <img src={profilePhotoUrl} alt={card.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px', textTransform: 'uppercase' }}>{card.full_name}</h2>
          {partyName && <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{partyName}</p>}
          {officeRunningFor && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: 0 }}>{officeRunningFor}</p>}
        </div>

        {/* Card body */}
        <div style={{ padding: '20px', background: cardBg, margin: isFlag || isRally ? '0 12px 12px' : 0, borderRadius: isFlag || isRally ? 12 : 0 }}>
          {campaignSlogan && (
            <p style={{
              fontSize: 15, fontWeight: 700, color: accentColor, textAlign: 'center',
              margin: '0 0 12px', fontStyle: 'italic',
              borderLeft: `3px solid ${accentColor}`, paddingLeft: 12,
            }}>
              &ldquo;{campaignSlogan}&rdquo;
            </p>
          )}
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 12px' }}>{card.bio}</p>}
          {region && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>📍 {region}</p>}

          {showContact && (
            <div>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== MOBILE BUSINESS TEMPLATE =====
  if (template === 'mobile-business') {
    return (
      <div style={{ background: '#f5f5f5', borderRadius: 16, overflow: 'hidden' }}>
        {/* Cover/banner */}
        <div style={{
          height: 160,
          background: bannerImageUrl || profilePhotoUrl
            ? `url(${bannerImageUrl || profilePhotoUrl}) center/cover`
            : `linear-gradient(135deg, ${c1}, ${c2})`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }} />
        </div>
        <div style={{ padding: '0 24px 24px', background: '#fff' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>{card.full_name}</h2>
          {card.title && <p style={{ fontSize: 14, color: '#374151', margin: '0 0 2px' }}>{card.title}</p>}
          {card.company && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{card.company}</p>}
          {(card as any).city && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>📍 {(card as any).city}</p>}
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>{card.bio}</p>}

          {showContact && (
            <div>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== BIZ-MODERN TEMPLATE =====
  if (template === 'biz-modern') {
    return (
      <div style={{ background: '#f5f5f5', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header with gradient or banner */}
        <div style={{
          position: 'relative', padding: '40px 24px 60px',
          background: bannerImageUrl
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${bannerImageUrl}) center/cover`
            : `linear-gradient(135deg, ${c1}, ${c2})`,
        }}>
          {profilePhotoUrl && (
            <div style={{ position: 'absolute', bottom: -30, right: 24 }}>
              {renderProfilePhoto(60)}
            </div>
          )}
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{card.full_name}</h2>
          {card.title && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{card.title}</p>}
          {card.company && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>{card.company}</p>}
        </div>

        {/* Body */}
        <div style={{ padding: '40px 24px 24px', background: '#fff' }}>
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>{card.bio}</p>}
          
          {showContact && (
            <div>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== BIZ-TRADITIONAL TEMPLATE =====
  if (template === 'biz-traditional') {
    return (
      <div style={{ background: '#faf8f5', borderRadius: 16, overflow: 'hidden' }}>
        {/* Accent bar or banner */}
        {bannerImageUrl ? (
          <div style={{
            height: 120, background: `url(${bannerImageUrl}) center/cover`,
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #faf8f5)' }} />
          </div>
        ) : (
          <div style={{ height: 6, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
        )}

        <div style={{ padding: '24px', textAlign: 'center' }}>
          {profilePhotoUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {renderProfilePhoto(80)}
            </div>
          )}
          <p style={{ fontSize: 11, letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 4px' }}>HI, I'M</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>{card.full_name}</h2>
          {card.title && <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{card.title}</p>}
          {card.company && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px' }}>{card.company}</p>}
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>{card.bio}</p>}

          {showContact && (
            <div style={{ textAlign: 'left' }}>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== BIZ-MINIMALIST TEMPLATE =====
  if (template === 'biz-minimalist') {
    return (
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
        {bannerImageUrl && (
          <div style={{ height: 100, background: `url(${bannerImageUrl}) center/cover` }} />
        )}
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          {profilePhotoUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {renderProfilePhoto(70)}
            </div>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{card.full_name}</h2>
          {card.title && <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 2px' }}>{card.title}</p>}
          {card.company && <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>{card.company}</p>}
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>{card.bio}</p>}

          {showContact && (
            <div style={{ textAlign: 'left' }}>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== COVER-CARD TEMPLATE =====
  if (template === 'cover-card') {
    return (
      <div style={{ background: '#f5f5f5', borderRadius: 16, overflow: 'hidden' }}>
        {/* Cover photo */}
        <div style={{
          height: 200,
          background: bannerImageUrl || profilePhotoUrl
            ? `url(${bannerImageUrl || profilePhotoUrl}) center/cover`
            : `linear-gradient(135deg, ${c1}, ${c2})`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }} />
        </div>
        <div style={{ padding: '0 24px 24px', background: '#fff' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>{card.full_name}</h2>
          {card.title && <p style={{ fontSize: 14, color: '#374151', margin: '0 0 2px' }}>{card.title}</p>}
          {card.company && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>{card.company}</p>}
          {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>{card.bio}</p>}

          {showContact && (
            <div>
              {card.phone && renderContactRow('📞', card.phone, 'Phone')}
              {card.email && renderContactRow('✉️', card.email, 'Email')}
              {card.website && renderContactRow('🌐', card.website, 'Website')}
            </div>
          )}

          {renderFeaturedSocials()}
          {renderSocialLinks()}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // ===== DEFAULT / CLASSIC / PRO-REALTOR / PREMIUM-STATIC =====
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden' }}>
      {/* Header with gradient */}
      <div style={{
        position: 'relative', padding: '40px 24px',
        background: bannerImageUrl
          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${bannerImageUrl}) center/cover`
          : `linear-gradient(135deg, ${c1}, ${c2})`,
        textAlign: 'center',
      }}>
        {profilePhotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {renderProfilePhoto(90)}
          </div>
        )}
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>{card.full_name}</h2>
        {card.title && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '0 0 2px' }}>{card.title}</p>}
        {card.company && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{card.company}</p>}
      </div>

      {/* Body */}
      <div style={{ padding: '24px', background: '#fff' }}>
        {card.bio && <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px', textAlign: 'center' }}>{card.bio}</p>}

        {showContact && (
          <div>
            {card.phone && renderContactRow('📞', card.phone, 'Phone')}
            {card.email && renderContactRow('✉️', card.email, 'Email')}
            {card.website && renderContactRow('🌐', card.website, 'Website')}
          </div>
        )}

        {renderFeaturedSocials()}
        {renderSocialLinks()}
        {renderLinks()}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', letterSpacing: 1 }}>tavvy</p>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>Create your free digital card</p>
        </div>
      </div>
    </div>
  );
}
