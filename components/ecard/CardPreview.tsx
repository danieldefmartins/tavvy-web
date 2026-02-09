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
};

const SOCIAL_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  linkedin: '#0077B5',
  tiktok: '#000000',
  facebook: '#1877F2',
  youtube: '#FF0000',
  twitter: '#000000',
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
