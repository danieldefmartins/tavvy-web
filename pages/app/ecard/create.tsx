/**
 * eCard Create Screen - Live Card Editor
 * 
 * Two-step flow:
 * Step 1: Template Gallery — realistic full-card previews with sample data
 * Step 2: Card Editor — renders the ACTUAL template layout for editing
 *   - Bottom bar has color dots to switch color scheme
 *   - Each template has its own unique editor layout
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
  getUserCards,
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
  IoPerson,
  IoBriefcase,
  IoHome,
  IoStar,
  IoChevronDown,
  IoLogoGoogle,
  IoBusinessOutline,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';

const PROFESSIONAL_CATEGORIES = [
  { id: 'universal', label: 'General' },
  { id: 'sales', label: 'Sales' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'food_dining', label: 'Food & Dining' },
  { id: 'health_wellness', label: 'Health & Wellness' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'home_services', label: 'Home Services' },
  { id: 'legal_finance', label: 'Legal & Finance' },
  { id: 'creative_marketing', label: 'Creative & Marketing' },
  { id: 'education_coaching', label: 'Education & Coaching' },
  { id: 'tech_it', label: 'Tech & IT' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'events_entertainment', label: 'Events & Entertainment' },
  { id: 'pets', label: 'Pets' },
];

const EXTERNAL_REVIEW_PLATFORMS = [
  { id: 'google', label: 'Google Reviews', field: 'reviewGoogleUrl', color: '#4285F4', icon: '🔍' },
  { id: 'yelp', label: 'Yelp', field: 'reviewYelpUrl', color: '#D32323', icon: '⭐' },
  { id: 'tripadvisor', label: 'TripAdvisor', field: 'reviewTripadvisorUrl', color: '#00AF87', icon: '🦉' },
  { id: 'facebook', label: 'Facebook Reviews', field: 'reviewFacebookUrl', color: '#1877F2', icon: '👍' },
  { id: 'bbb', label: 'BBB', field: 'reviewBbbUrl', color: '#005A8C', icon: '🏛️' },
];

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

/* ============================================================
   FULL-SCREEN CARD PREVIEW — Renders a realistic full card
   with sample data for the swipeable gallery.
   Each template matches the reference images pixel-perfectly.
   ============================================================ */
const SAMPLE_AVATAR = '/images/sample-avatar.png';
const SAMPLE_BANNER = '/images/sample-banner.jpg';

const SAMPLE_DATA = {
  name: 'Jane Smith',
  title: 'Content Creator & Designer',
  company: 'Creative Studio',
  bio: 'Helping brands tell their story through design and strategy.',
  phone: '+1 (555) 123-4567',
  email: 'jane@creativestudio.com',
  website: 'www.janesmith.com',
  location: 'Los Angeles, CA',
  handle: '@janesmith',
  pronouns: '(She/Her)',
  links: ['Get in Touch', 'Freebies & Resources', 'Read our Latest Blog Post', 'Shop Templates', 'Visit the Website'],
  bloggerLinks: ['ABOUT', 'MY BLOG', 'SHOP', 'NEWSLETTER', 'FREEBIE', 'CONTACT'],
  realtorLinks: ['ALL ABOUT ME', 'CLIENT TESTIMONIALS', 'VISIT MY WEBSITE', 'BOOK A FREE CONSULTATION'],
  socials: ['instagram', 'twitter', 'linkedin', 'facebook'] as string[],
  realtorSocials: ['instagram', 'twitter', 'linkedin', 'facebook', 'website'] as string[],
  industry: 'Marketing & Design',
  services: ['Branding', 'Web Design', 'Photography', 'Social Media'],
};

// SVG icon components for the preview — sized appropriately
const PIcon = ({ d, size = 16 }: { d: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d}/></svg>;
const PreviewPhoneIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />;
const PreviewEmailIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />;
const PreviewGlobeIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />;
const PreviewLocationIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />;
const PreviewMsgIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />;
const PreviewWhatsAppIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.22.54-.27.72-.27l.58.01c.17.01.43-.07.68.52.25.6.83 2.09.9 2.24.07.15.05.34-.07.55-.12.21-.18.34-.35.52-.17.19-.37.42-.52.56-.17.16-.35.33-.15.65.2.32.89 1.48 1.88 2.38 1.27 1.14 2.38 1.52 2.72 1.69.34.17.54.14.74-.09.2-.23.83-.97 1.05-1.31.22-.34.44-.28.74-.17.3.11 1.95.92 2.28 1.08z" />;

// Social icon for preview
function PreviewSocialIcon({ platform, size = 16, color = '#fff' }: { platform: string; size?: number; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <IoLogoInstagram size={size} color={color} />,
    tiktok: <IoLogoTiktok size={size} color={color} />,
    youtube: <IoLogoYoutube size={size} color={color} />,
    linkedin: <IoLogoLinkedin size={size} color={color} />,
    twitter: <IoLogoTwitter size={size} color={color} />,
    facebook: <IoLogoFacebook size={size} color={color} />,
    website: <IoGlobe size={size} color={color} />,
  };
  return <>{icons[platform] || <IoGlobe size={size} color={color} />}</>;
}

function FullCardPreview({ tmpl }: { tmpl: Template }) {
  const cs = tmpl.colorSchemes[0];
  const primary = cs?.primary || '#333';
  const secondary = cs?.secondary || '#555';
  const txtCol = cs?.text || '#fff';
  const txtSec = cs?.textSecondary || 'rgba(255,255,255,0.7)';
  const accentCol = cs?.accent || '#00C853';
  const cardBgCol = cs?.cardBg || '#fff';
  const isLightBg = cs?.text === '#2d2d2d' || cs?.text === '#1f2937';

  // Real photo avatar
  const PhotoAvatar = ({ size, border: avatarBorder, borderRadius, shadow, style: extraStyle }: { size: number; border?: string; borderRadius?: string; shadow?: string; style?: React.CSSProperties }) => (
    <div style={{
      width: size, height: size, borderRadius: borderRadius || '50%',
      border: avatarBorder || 'none',
      flexShrink: 0, overflow: 'hidden',
      boxShadow: shadow || 'none',
      ...extraStyle,
    }}>
      <img src={SAMPLE_AVATAR} alt="Jane Smith" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     1. BASIC — Linktree style
     Reference: Linktree+Alternatives-min.png.webp
     White bg, circle photo, @handle, dark rounded link buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'basic') {
    // Basic template always has a white/light card background
    const btnBg = '#2D3436';
    const btnTxt = '#FFFFFF';
    const nameTxt = '#1a1a1a';
    const subTxt = '#555';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px 36px', background: '#fff', borderRadius: 16 }}>
        <PhotoAvatar size={110} border="3px solid rgba(0,0,0,0.06)" shadow="0 4px 20px rgba(0,0,0,0.1)" />
        <div style={{ fontSize: 20, fontWeight: 700, color: nameTxt, marginTop: 16, textAlign: 'center' }}>{SAMPLE_DATA.handle}</div>
        <div style={{ fontSize: 13, color: subTxt, marginTop: 6, textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>
          Helping brands tell their story through design and creative strategy
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
          {SAMPLE_DATA.links.map(l => (
            <div key={l} style={{
              width: '100%', height: 54, borderRadius: 12, background: btnBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: btnTxt }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     2. BLOGGER — Hannah Stone style
     Reference: blogger.jpg
     Pastel bg, white card cutout, large circle photo, script name,
     uppercase subtitle, pastel link buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'blogger') {
    const outerBg = `${accentCol}18`;
    const cardTxt = '#1a1a1a';
    const btnBg = `${accentCol}20`;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 24px' }}>
        {/* White inner card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '0 24px 28px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          position: 'relative',
          marginTop: 50,
        }}>
          {/* Photo overlapping top of card */}
          <div style={{ marginTop: -50 }}>
            <PhotoAvatar size={100} border="4px solid #fff" shadow="0 4px 20px rgba(0,0,0,0.1)" />
          </div>
          {/* Script name */}
          <div style={{ fontSize: 28, fontWeight: 400, color: cardTxt, marginTop: 14, fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic', letterSpacing: -0.5 }}>
            {SAMPLE_DATA.name}
          </div>
          <div style={{ fontSize: 10, color: '#777', marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: 2.5, fontWeight: 600, textAlign: 'center' }}>
            BUSINESS COACH &amp; ENTREPRENEUR
          </div>
          {/* Link buttons */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            {SAMPLE_DATA.bloggerLinks.map(l => (
              <div key={l} style={{
                width: '100%', height: 46, borderRadius: 4, background: btnBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: cardTxt, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     3. BUSINESS CARD — EdgeKart / Thomas Smith style
     Reference: Digital-Business-Card-1.webp
     Deep navy top, company name + logo, circle photo with white
     border, name, pronouns, title, company, colored action icons,
     white bottom "About Me"
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'business-card') {
    const darkBg = primary;
    const lightBottom = cardBgCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark navy top */}
        <div style={{ background: darkBg, padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* Company name at top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>T</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
          </div>
          {/* Circle photo */}
          <PhotoAvatar size={100} border="4px solid rgba(255,255,255,0.9)" shadow="0 4px 20px rgba(0,0,0,0.3)" />
          {/* Name & details */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 10, textAlign: 'center' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'center' }}>{SAMPLE_DATA.pronouns}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'center', marginTop: 2 }}>Solutions Manager</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{SAMPLE_DATA.company} Public Solutions LLP</div>
        </div>
        {/* Action icon row at the transition */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '16px 0', background: lightBottom }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewGlobeIcon, PreviewLocationIcon].map((Icon, i) => (
            <div key={i} style={{ width: 46, height: 46, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <span style={{ color: '#fff' }}><Icon size={18} /></span>
            </div>
          ))}
        </div>
        {/* White bottom — About Me */}
        <div style={{ background: lightBottom, padding: '4px 28px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 8 }}>About Me</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            I am a skilled Solutions Manager with seven years of experience in solving problems and engaging customers across industries.
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     4. FULL WIDTH — John Richards style
     Reference: FullwidtheCard.jpg
     Full-bleed B&W hero photo, bold white name overlaid left,
     title, company logo pill, action icon row, white "About Me"
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'full-width') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Full-bleed hero photo with overlay */}
        <div style={{ width: '100%', height: 300, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'grayscale(80%) brightness(0.6) contrast(1.1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
          {/* Name overlaid at bottom-left */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, zIndex: 2 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: -1, textTransform: 'uppercase' as const }}>
              JANE<br/>SMITH
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: 500 }}>Marketing Manager</div>
            {/* Company pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 20, background: `${accentCol}cc` }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: accentCol }}>T</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{SAMPLE_DATA.company}</span>
            </div>
          </div>
        </div>
        {/* Action icon row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '14px 0', background: '#111' }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewMsgIcon, PreviewWhatsAppIcon, PreviewGlobeIcon].map((Icon, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff' }}><Icon size={16} /></span>
            </div>
          ))}
        </div>
        {/* White bottom — About Me */}
        <div style={{ background: '#fff', padding: '20px 28px 28px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>About Me</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginTop: 8 }}>
            Hi, I am Jane, working as a marketing manager at {SAMPLE_DATA.company}. Expert in building client relationships and driving growth.
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     5. PRO REALTOR — Realtor Hannah style
     Reference: realtor.jpg
     Full-width banner photo, arch-framed portrait overlapping,
     "Hi I'm Jane," bold heading, tan/beige link buttons,
     social icon row, company footer bar
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-realtor') {
    const btnBg = `${accentCol}30`;
    const btnTxt = txtCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* Full-width banner photo */}
        <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* Arch-framed portrait overlapping banner */}
        <div style={{ marginTop: -70, zIndex: 2, position: 'relative' }}>
          <div style={{
            width: 130, height: 160, borderRadius: '65px 65px 65px 65px',
            overflow: 'hidden', border: `3px solid ${cardBgCol}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        {/* Name section */}
        <div style={{ textAlign: 'center', marginTop: 14, padding: '0 28px' }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: txtSec }}>HI <span style={{ fontSize: 24, fontWeight: 800, color: txtCol, letterSpacing: -0.5 }}>I&apos;M JANE,</span></div>
          <div style={{ fontSize: 12, color: txtSec, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 2, fontWeight: 500 }}>YOUR LOCAL REALTOR</div>
        </div>
        {/* Link buttons */}
        <div style={{ width: '82%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {SAMPLE_DATA.realtorLinks.map(l => (
            <div key={l} style={{
              width: '100%', height: 44, borderRadius: 4, background: btnBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: btnTxt, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>{l}</span>
            </div>
          ))}
        </div>
        {/* Social icons row */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          {SAMPLE_DATA.realtorSocials.map(s => (
            <div key={s} style={{ width: 36, height: 36, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={16} color="#fff" />
            </div>
          ))}
        </div>
        {/* Company footer bar */}
        <div style={{ width: '100%', padding: '10px 0', marginTop: 16, borderTop: `2px solid ${accentCol}`, textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: accentCol, letterSpacing: 2, textTransform: 'uppercase' as const }}>YOUR COMPANY NAME HERE</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     6. PRO CREATIVE — Arianne / A.Rich Culture style
     Reference: Digital-Business-Card-3.jpg
     Purple/colored gradient top with large photo, company logo,
     white bottom with name, title, company, bio, contact rows
     with colored circle icons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-creative') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Colored gradient top with photo */}
        <div style={{ position: 'relative', padding: '28px 24px 60px', display: 'flex', justifyContent: 'center' }}>
          {/* Company logo in top-right */}
          <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>CS</span>
            </div>
          </div>
          {/* Large circle photo */}
          <PhotoAvatar size={140} border="4px solid rgba(255,255,255,0.3)" shadow="0 8px 32px rgba(0,0,0,0.25)" />
        </div>
        {/* White bottom section */}
        <div style={{ background: cardBgCol, padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>Founder &amp; Principal Consultant</div>
          <div style={{ fontSize: 13, color: accentCol, fontStyle: 'italic', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5, marginTop: 8 }}>
            Business Consulting &amp; Talent Management for Creative Professionals
          </div>
          {/* Contact rows with colored circle icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[
              { icon: <PreviewEmailIcon size={16} />, text: SAMPLE_DATA.email, bg: '#FF6B35' },
              { icon: <PreviewPhoneIcon size={16} />, text: SAMPLE_DATA.phone, bg: '#4CAF50' },
              { icon: <PreviewMsgIcon size={16} />, text: '+1 (555) 987-6543', bg: '#2196F3' },
              { icon: <PreviewGlobeIcon size={16} />, text: SAMPLE_DATA.website, bg: accentCol },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff' }}>{row.icon}</span>
                </div>
                <span style={{ fontSize: 13, color: '#444' }}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     7. PRO CORPORATE — Arch Gleason / Blue corporate style
     Reference: qrcc_dbc_key_benefits.png.webp
     Blue gradient top with abstract shapes, circle photo,
     name + title centered, action icon circles, Schedule Meeting
     section with CTA buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-corporate') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Blue gradient top with decorative shapes */}
        <div style={{ position: 'relative', padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: -20, left: -30, width: 100, height: 100, borderRadius: '50%', background: `${accentCol}40`, zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `${accentCol}20`, zIndex: 0 }} />
          {/* Photo */}
          <div style={{ zIndex: 1, marginTop: 16 }}>
            <PhotoAvatar size={100} border="4px solid rgba(255,255,255,0.9)" shadow="0 4px 20px rgba(0,0,0,0.2)" />
          </div>
        </div>
        {/* Name section on white */}
        <div style={{ background: cardBgCol, padding: '16px 24px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 14, color: '#777', marginTop: 4 }}>General Contractor</div>
        </div>
        {/* Action icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '12px 0', background: cardBgCol }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewMsgIcon, PreviewWhatsAppIcon].map((Icon, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span style={{ color: '#555' }}><Icon size={18} /></span>
            </div>
          ))}
        </div>
        {/* Industry + Services section */}
        <div style={{ background: cardBgCol, padding: '12px 24px 24px' }}>
          {/* Industry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={accentCol}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Industry</span>
          </div>
          <div style={{ background: `${accentCol}15`, padding: '8px 14px', borderRadius: 8, marginBottom: 14, display: 'inline-block', borderLeft: `3px solid ${accentCol}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: accentCol }}>Construction</span>
          </div>

          {/* Services */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={accentCol}><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Services</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Remodeling', 'Roofing', 'Plumbing', 'Electrical', 'Painting', 'Flooring'].map((service, i) => (
              <div key={i} style={{ background: `${accentCol}12`, padding: '6px 12px', borderRadius: 16, border: `1px solid ${accentCol}30`, fontSize: 11, fontWeight: 500, color: accentCol }}>
                {service}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     8. PRO CARD — Craft Media / Aisha Khan style
     Reference: eCardBusinessCard.webp
     Dark navy top with company logo, left-aligned name + pronouns
     + title + company, large circle photo on right with decorative
     ring, diagonal split to white bottom, bio, contact rows with
     icon circles, "Add to Contacts" button
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-card') {
    const darkBg = primary;
    const goldAccent = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark top section */}
        <div style={{ background: darkBg, padding: '24px 28px 0', position: 'relative', minHeight: 280 }}>
          {/* Company logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={goldAccent}><path d="M2 21l10-9L2 3v18zm10 0l10-9L12 3v18z" opacity="0.8"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{SAMPLE_DATA.company}</div>
              <div style={{ fontSize: 8, color: goldAccent, letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 600 }}>CREATIVE AGENCY</div>
            </div>
          </div>
          {/* Name + details (left) and photo (right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: goldAccent, lineHeight: 1.2 }}>Ms. {SAMPLE_DATA.name.split(' ')[0]}<br/>{SAMPLE_DATA.name.split(' ')[1] || 'Smith'}</div>
              <div style={{ fontSize: 12, color: `${goldAccent}99`, fontStyle: 'italic', marginTop: 4 }}>{SAMPLE_DATA.pronouns}</div>
              <div style={{ fontSize: 14, color: goldAccent, fontWeight: 600, marginTop: 10 }}>Creative Director</div>
              <div style={{ fontSize: 12, color: goldAccent, opacity: 0.7, marginTop: 2 }}>{SAMPLE_DATA.company}</div>
            </div>
            {/* Large photo with decorative ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 130, height: 130, borderRadius: '50%',
                border: `2px solid ${goldAccent}40`,
                padding: 4,
                position: 'relative',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: `2px dashed ${goldAccent}30`,
                  padding: 3,
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                    <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Angled transition */}
        <div style={{ position: 'relative', height: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: darkBg }} />
          <svg viewBox="0 0 400 40" style={{ width: '100%', height: 40, display: 'block', position: 'relative', zIndex: 1 }} preserveAspectRatio="none">
            <path d="M0 40 L400 0 L400 40 Z" fill={cardBgCol} />
          </svg>
        </div>
        {/* White bottom section */}
        <div style={{ background: cardBgCol, padding: '8px 28px 28px' }}>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
            Passionate creative director with a love for storytelling and brand strategy.
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 16 }} />
          {/* Contact rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <PreviewPhoneIcon size={16} />, text: SAMPLE_DATA.phone, label: 'Work' },
              { icon: <PreviewEmailIcon size={16} />, text: SAMPLE_DATA.email, label: 'Work' },
              { icon: <PreviewGlobeIcon size={16} />, text: SAMPLE_DATA.website, label: 'Company' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: goldAccent }}>{row.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{row.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Add to Contacts button */}
          <div style={{ width: '100%', height: 48, borderRadius: 10, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>+ Add to Contacts</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── COVER CARD ─── Cover photo top, white bottom
  if (tmpl.layout === 'cover-card') {
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Cover photo */}
        <div style={{ width: '100%', height: 200, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Logo overlay */}
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={primary}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: primary }}>Logo</span>
          </div>
        </div>
        {/* Wavy accent */}
        <svg viewBox="0 0 400 20" style={{ width: '100%', height: 16, display: 'block', marginTop: -12 }} preserveAspectRatio="none">
          <path d="M0 20 C100 0 200 18 300 4 C350 -2 380 8 400 0 L400 20 Z" fill={cardBgCol} />
          <path d="M0 20 C80 6 160 20 260 6 C320 -1 370 12 400 4 L400 20 Z" fill={accentC} opacity="0.12" />
        </svg>
        {/* White bottom */}
        <div style={{ background: cardBgCol, padding: '4px 28px 28px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>Arianne S. Richardson</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 2 }}>Founder & Principal Consultant</div>
          <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 8 }}>A.Rich Culture</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>Business Consulting & Talent Management for Caribbean Creatives</div>
          {/* Contact rows */}
          {[
            { icon: <PreviewEmailIcon size={14} />, text: 'mail@arichculture.com', bg: primary },
            { icon: <PreviewPhoneIcon size={14} />, text: '+1 561 485 7408', bg: accentC },
            { icon: <PreviewMsgIcon size={14} />, text: 'Send a Text', bg: primary },
            { icon: <PreviewGlobeIcon size={14} />, text: 'www.arichculture.com', bg: accentC },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{row.icon}</div>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     10. BIZ TRADITIONAL — Classic centered business card
     White card, logo top, circle photo, name/title/company centered,
     thin divider, contact rows with icons, social row at bottom
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-traditional') {
    const darkBg = primary;
    const accentC = accentCol;
    const borderC = cs?.border || '#c9a84c';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', overflow: 'hidden' }}>
        {/* Colored accent bar at top */}
        <div style={{ width: '100%', height: 6, background: darkBg }} />
        {/* Logo area */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={accentC}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: darkBg, letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
        </div>
        {/* Thin accent line */}
        <div style={{ width: 50, height: 2, background: accentC, margin: '16px auto' }} />
        {/* Circle photo */}
        <PhotoAvatar size={100} border={`3px solid ${borderC}`} shadow="0 4px 16px rgba(0,0,0,0.1)" />
        {/* Name / Title / Company */}
        <div style={{ textAlign: 'center', padding: '14px 28px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: darkBg, marginTop: 4 }}>Solutions Manager</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
        </div>
        {/* Divider */}
        <div style={{ width: '80%', height: 1, background: '#e5e5e5', margin: '16px auto' }} />
        {/* Contact rows */}
        <div style={{ width: '100%', padding: '0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <PreviewPhoneIcon size={14} />, text: SAMPLE_DATA.phone },
            { icon: <PreviewEmailIcon size={14} />, text: SAMPLE_DATA.email },
            { icon: <PreviewGlobeIcon size={14} />, text: SAMPLE_DATA.website },
            { icon: <PreviewLocationIcon size={14} />, text: '123 Main St, Los Angeles, CA 90001' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${darkBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: darkBg }}>{row.icon}</div>
              <span style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>{row.text}</span>
            </div>
          ))}
        </div>
        {/* Social icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '18px 0 6px' }}>
          {['instagram', 'tiktok', 'linkedin'].map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={14} color="#fff" />
            </div>
          ))}
        </div>
        {/* Save Contact button */}
        <div style={{ width: 'calc(100% - 56px)', margin: '12px 28px 24px', height: 44, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>+ Save Contact</span>
        </div>
        {/* Bottom accent bar */}
        <div style={{ width: '100%', height: 4, background: accentC }} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     11. BIZ MODERN — Split layout modern business card
     Colored top with logo + name + title, photo overlapping,
     curved transition, white bottom with contact rows + social
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-modern') {
    const darkBg = primary;
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Colored top section */}
        <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`, padding: '28px 24px 60px', position: 'relative' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
          </div>
          {/* Name + Title (left) */}
          <div style={{ paddingRight: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>Solutions Manager</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
          </div>
          {/* Photo (right, overlapping) */}
          <div style={{ position: 'absolute', right: 24, bottom: -40 }}>
            <PhotoAvatar size={110} border="4px solid #fff" shadow="0 4px 20px rgba(0,0,0,0.2)" />
          </div>
        </div>
        {/* Curved transition */}
        <svg viewBox="0 0 400 30" style={{ width: '100%', height: 24, display: 'block', marginTop: -1 }} preserveAspectRatio="none">
          <path d="M0 0 L400 0 L400 30 C300 0 100 0 0 30 Z" fill={`url(#modernGrad_${tmpl.id})`} />
          <defs><linearGradient id={`modernGrad_${tmpl.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={primary}/><stop offset="100%" stopColor={secondary}/></linearGradient></defs>
        </svg>
        {/* White bottom */}
        <div style={{ background: '#fff', padding: '28px 24px 24px' }}>
          {/* Contact rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <PreviewPhoneIcon size={14} />, text: SAMPLE_DATA.phone, label: 'Work' },
              { icon: <PreviewEmailIcon size={14} />, text: SAMPLE_DATA.email, label: 'Work' },
              { icon: <PreviewGlobeIcon size={14} />, text: SAMPLE_DATA.website, label: 'Company' },
              { icon: <PreviewLocationIcon size={14} />, text: '123 Main St, LA, CA 90001', label: 'Office' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{row.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{row.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Social icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            {['instagram', 'tiktok', 'linkedin'].map(s => (
              <div key={s} style={{ width: 34, height: 34, borderRadius: '50%', background: accentC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PreviewSocialIcon platform={s} size={14} color="#fff" />
              </div>
            ))}
          </div>
          {/* Save Contact button */}
          <div style={{ width: '100%', height: 44, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>+ Save Contact</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     12. BIZ MINIMALIST — Ultra-clean minimal business card
     Lots of whitespace, small logo, square photo, thin type,
     minimal contact rows, text-style social handles
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-minimalist') {
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '32px 28px 28px' }}>
        {/* Small logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${accentC}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={accentC}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: 1, textTransform: 'uppercase' as const }}>{SAMPLE_DATA.company}</span>
        </div>
        {/* Square photo */}
        <PhotoAvatar size={120} borderRadius="12px" border="none" shadow="0 2px 12px rgba(0,0,0,0.06)" />
        {/* Name */}
        <div style={{ fontSize: 26, fontWeight: 300, color: primary, marginTop: 20, letterSpacing: -0.5 }}>{SAMPLE_DATA.name}</div>
        {/* Title */}
        <div style={{ fontSize: 11, fontWeight: 500, color: '#999', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 2 }}>Solutions Manager</div>
        {/* Company */}
        <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
        {/* Thin line */}
        <div style={{ width: 40, height: 1, background: '#e0e0e0', margin: '20px 0' }} />
        {/* Contact info — minimal style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Phone', text: SAMPLE_DATA.phone },
            { label: 'Email', text: SAMPLE_DATA.email },
            { label: 'Web', text: SAMPLE_DATA.website },
            { label: 'Address', text: '123 Main St, Los Angeles, CA 90001' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#bbb', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#444', fontWeight: 400, marginTop: 1 }}>{row.text}</span>
            </div>
          ))}
        </div>
        {/* Social handles as text */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { platform: 'Instagram', handle: '@janesmith' },
            { platform: 'TikTok', handle: '@janesmith' },
            { platform: 'LinkedIn', handle: 'in/janesmith' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#bbb', width: 60 }}>{s.platform}</span>
              <span style={{ fontSize: 12, color: accentC, fontWeight: 500 }}>{s.handle}</span>
            </div>
          ))}
        </div>
        {/* Save Contact — minimal */}
        <div style={{ width: '100%', height: 40, borderRadius: 6, border: `1.5px solid ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: primary }}>Save Contact</span>
        </div>
      </div>
    );
  }

  return null;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ECardCreateScreen() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);

  // Step: 'gallery' = pick template, 'editor' = customize card
  const [step, setStep] = useState<'gallery' | 'editor'>('gallery');

  // Template & color
  const [templateIndex, setTemplateIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  // Gallery swiper state
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const tapStartTime = useRef(0);
  const handleSwipeStart = (x: number) => { touchStartX.current = x; touchEndX.current = x; isSwiping.current = true; tapStartTime.current = Date.now(); };
  const handleSwipeMove = (x: number) => { if (isSwiping.current) touchEndX.current = x; };
  const handleSwipeEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && galleryIndex < TEMPLATES.length - 1) {
      setGalleryIndex(prev => prev + 1);
    } else if (diff < -threshold && galleryIndex > 0) {
      setGalleryIndex(prev => prev - 1);
    }
  };

  // Card data
  const [name, setName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [websiteLabel, setWebsiteLabel] = useState('');
  const [company, setCompany] = useState('');
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

  // Banner image
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  // Photo size picker
  const [showPhotoSizePicker, setShowPhotoSizePicker] = useState(false);

  // Professional category & external reviews
  const [professionalCategory, setProfessionalCategory] = useState('general');
  const [reviewGoogleUrl, setReviewGoogleUrl] = useState('');
  const [reviewYelpUrl, setReviewYelpUrl] = useState('');
  const [reviewTripadvisorUrl, setReviewTripadvisorUrl] = useState('');
  const [reviewFacebookUrl, setReviewFacebookUrl] = useState('');
  const [reviewBbbUrl, setReviewBbbUrl] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showExternalReviews, setShowExternalReviews] = useState(false);

  // Auto-fill from previous card
  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);
  const [previousCard, setPreviousCard] = useState<CardData | null>(null);

  const applyAutoFill = (card: CardData) => {
    if (card.full_name) setName(card.full_name);
    if (card.title_role) setTitleRole(card.title_role);
    if (card.bio) setBio(card.bio);
    if (card.email) setEmail(card.email);
    if (card.phone) setPhone(card.phone);
    if (card.website) setWebsite(card.website);
    if (card.website_label) setWebsiteLabel(card.website_label);
    if (card.address) setAddress(card.address);
    if (card.profile_photo_url) setProfileImage(card.profile_photo_url);
    if (card.professional_category) setProfessionalCategory(card.professional_category);
    if (card.review_google_url) setReviewGoogleUrl(card.review_google_url);
    if (card.review_yelp_url) setReviewYelpUrl(card.review_yelp_url);
    if (card.review_tripadvisor_url) setReviewTripadvisorUrl(card.review_tripadvisor_url);
    if (card.review_facebook_url) setReviewFacebookUrl(card.review_facebook_url);
    if (card.review_bbb_url) setReviewBbbUrl(card.review_bbb_url);
    if (card.featured_icons && Array.isArray(card.featured_icons)) {
      setFeaturedIcons(card.featured_icons.map((item: any) =>
        typeof item === 'string' ? { platform: item, url: '' } : item
      ));
    }
    if (card.links && Array.isArray(card.links)) {
      setLinks(card.links.map((l: any) => ({ id: `link_${Date.now()}_${Math.random()}`, label: l.label || l.title || '', url: l.url || '' })));
    }
    setShowAutoFillBanner(false);
  };

  // Check for existing cards on mount
  useEffect(() => {
    const checkExistingCards = async () => {
      if (!user?.id) return;
      try {
        const cards = await getUserCards(user.id);
        if (cards && cards.length > 0) {
          setPreviousCard(cards[0] as CardData);
          setShowAutoFillBanner(true);
        }
      } catch (e) {
        console.warn('Could not fetch existing cards:', e);
      }
    };
    checkExistingCards();
  }, [user?.id]);

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
        if (draft.websiteLabel) setWebsiteLabel(draft.websiteLabel);
        if (draft.address) setAddress(draft.address);
        if (typeof draft.templateIndex === 'number') setTemplateIndex(draft.templateIndex);
        if (typeof draft.colorIndex === 'number') setColorIndex(draft.colorIndex);
        if (typeof draft.photoSizeIndex === 'number') setPhotoSizeIndex(draft.photoSizeIndex);
        if (Array.isArray(draft.featuredIcons)) {
          setFeaturedIcons(draft.featuredIcons.map((item: any) => 
            typeof item === 'string' ? { platform: item, url: '' } : item
          ));
        }
        if (Array.isArray(draft.links)) setLinks(draft.links);
        if (Array.isArray(draft.videos)) setVideos(draft.videos);
        if (draft.profileImage) setProfileImage(draft.profileImage);
        if (draft.professionalCategory) setProfessionalCategory(draft.professionalCategory);
        if (draft.reviewGoogleUrl) setReviewGoogleUrl(draft.reviewGoogleUrl);
        if (draft.reviewYelpUrl) setReviewYelpUrl(draft.reviewYelpUrl);
        if (draft.reviewTripadvisorUrl) setReviewTripadvisorUrl(draft.reviewTripadvisorUrl);
        if (draft.reviewFacebookUrl) setReviewFacebookUrl(draft.reviewFacebookUrl);
        if (draft.reviewBbbUrl) setReviewBbbUrl(draft.reviewBbbUrl);
        localStorage.removeItem('ecard_draft');
      }
    } catch (e) {
      console.warn('Could not restore eCard draft:', e);
    }
  }, []);

  const template = TEMPLATES[templateIndex];
  const colorSchemes = template?.colorSchemes || [];
  const color = colorSchemes[colorIndex] || colorSchemes[0];
  const usesPremiumTemplate = template?.isPremium || false;
  const templateLayout = template?.layout || 'basic';

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
  const cardBg = color?.background?.includes('gradient')
    ? color.background
    : color?.cardBg && color.cardBg !== 'transparent'
      ? color.cardBg
      : `linear-gradient(180deg, ${color?.primary}, ${color?.secondary})`;
  const effectiveLum = (color?.cardBg && color.cardBg !== 'transparent' && color.cardBg.startsWith('#'))
    ? hexToLum(color.cardBg)
    : avgLum;
  const isLight = effectiveLum > 0.45;
  const txtColor = isLight ? '#1A1A1A' : '#FFFFFF';
  const txtSecondary = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)';
  const accentColor = color?.accent || 'rgba(255,255,255,0.2)';
  const btnRadius = template?.layoutConfig?.buttonStyle === 'pill' ? 24
    : template?.layoutConfig?.buttonStyle === 'square' ? 4
    : template?.layoutConfig?.buttonStyle === 'outline' ? 12 : 12;
  const isOutline = template?.layoutConfig?.buttonStyle === 'outline';
  const isFrosted = template?.layoutConfig?.buttonStyle === 'frosted';
  const isAccentTab = template?.layoutConfig?.buttonStyle === 'accent-tab';
  const photoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];
  const isCover = photoSize.id === 'cover';
  const font = template?.layoutConfig?.fontFamily === 'elegant' ? "'Georgia', serif"
    : template?.layoutConfig?.fontFamily === 'script' ? "'Georgia', serif"
    : template?.layoutConfig?.fontFamily === 'classic' ? "'Times New Roman', serif"
    : template?.layoutConfig?.fontFamily === 'executive' ? "'Georgia', serif"
    : "'Inter', -apple-system, sans-serif";

  // Template selection from gallery — go directly to editor
  const selectTemplate = () => {
    setTemplateIndex(galleryIndex);
    setColorIndex(0);
    setStep('editor');
  };

  // Template navigation
  const goToPrevTemplate = () => { if (templateIndex > 0) { setTemplateIndex(templateIndex - 1); setColorIndex(0); } };
  const goToNextTemplate = () => { if (templateIndex < TEMPLATES.length - 1) { setTemplateIndex(templateIndex + 1); setColorIndex(0); } };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setProfileImageFile(file); setProfileImage(URL.createObjectURL(file)); }
  };

  // Banner image upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerImageFile(file); setBannerImage(URL.createObjectURL(file)); }
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
  const removeFeaturedIcon = (platformId: string) => { setFeaturedIcons(prev => prev.filter(fi => fi.platform !== platformId)); };
  const updateFeaturedIconUrl = (platformId: string, url: string) => { setFeaturedIcons(prev => prev.map(fi => fi.platform === platformId ? { ...fi, url } : fi)); };

  // Video management
  const addVideo = (type: VideoData['type']) => {
    if (type === 'tavvy_short') { videoInputRef.current?.click(); } else { setVideos(prev => [...prev, { type, url: '' }]); }
    setShowVideoTypePicker(false);
  };
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB'); return; }
      setVideos(prev => [...prev, { type: 'tavvy_short', url: URL.createObjectURL(file), file }]);
    }
  };
  const removeVideo = (index: number) => { setVideos(prev => prev.filter((_, i) => i !== index)); };
  const updateVideoUrl = (index: number, url: string) => { setVideos(prev => prev.map((v, i) => i === index ? { ...v, url } : v)); };

  // Add link
  const addLink = (platformId: string) => {
    setLinks(prev => [...prev, { id: `link-${Date.now()}`, platform: platformId, value: '' }]);
    setShowAddLink(false);
  };
  const removeLink = (id: string) => { setLinks(prev => prev.filter(l => l.id !== id)); };
  const updateLinkValue = (id: string, value: string) => { setLinks(prev => prev.map(l => l.id === id ? { ...l, value } : l)); };

  // Save draft
  const saveDraftToLocalStorage = () => {
    try {
      localStorage.setItem('ecard_draft', JSON.stringify({
        name, titleRole, bio, email, phone, website, websiteLabel, address,
        templateIndex, colorIndex, photoSizeIndex,
        featuredIcons, links, videos: videos.map(v => ({ type: v.type, url: v.url })),
        profileImage, professionalCategory,
        reviewGoogleUrl, reviewYelpUrl, reviewTripadvisorUrl, reviewFacebookUrl, reviewBbbUrl,
      }));
    } catch (e) { console.warn('Could not save eCard draft:', e); }
  };

  // Save card
  const handleSave = async () => {
    if (!user) { saveDraftToLocalStorage(); router.push('/app/login?returnUrl=/app/ecard/create'); return; }
    if (!name.trim()) { alert('Please enter your name.'); return; }
    setIsCreating(true);
    try {
      let photoUrl: string | null = null;
      if (profileImageFile) {
        try { photoUrl = await uploadProfilePhoto(user.id, profileImageFile); } catch (e) { console.warn('Photo upload failed:', e); }
      }
      const uploadedGallery: { id: string; url: string; caption: string }[] = [];
      for (const img of galleryImages) {
        if (img.file) {
          try { const u = await uploadEcardFile(user.id, img.file, 'gallery'); if (u) uploadedGallery.push({ id: img.id, url: u, caption: '' }); } catch (e) { console.warn('Gallery upload failed:', e); }
        } else if (img.url && !img.url.startsWith('blob:')) { uploadedGallery.push({ id: img.id, url: img.url, caption: '' }); }
      }
      const uploadedVideos: { type: string; url: string }[] = [];
      for (const vid of videos) {
        if ((vid as any).file) {
          try { const u = await uploadEcardFile(user.id, (vid as any).file, 'video'); if (u) uploadedVideos.push({ type: vid.type, url: u }); } catch (e) { console.warn('Video upload failed:', e); }
        } else if (vid.url && !vid.url.startsWith('blob:')) { uploadedVideos.push({ type: vid.type, url: vid.url }); }
      }
      const uniqueId = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const slug = `draft_${user.id.substring(0, 8)}_${uniqueId}`;
      let bannerUrl: string | undefined;
      if (bannerImageFile) { try { bannerUrl = await uploadEcardFile(user.id, bannerImageFile, 'banner'); } catch (e) { console.warn('Banner upload failed:', e); } }

      const card = await createCard({
        user_id: user.id, slug, full_name: name.trim(),
        title: titleRole || undefined, bio: bio || undefined,
        email: email || undefined, phone: phone || undefined,
        website: website || undefined, website_label: websiteLabel || undefined, company: company || undefined, city: address || undefined,
        profile_photo_url: photoUrl || undefined,
        banner_image_url: bannerUrl || undefined,
        profile_photo_size: photoSize.id,
        gradient_color_1: color?.primary, gradient_color_2: color?.secondary,
        template_id: template.id, color_scheme_id: color?.id || undefined,
        theme: template.id,
        button_style: template.layoutConfig.buttonStyle,
        font_style: template.layoutConfig.fontFamily,
        background_type: color?.background?.includes('gradient') ? 'gradient' : 'solid',
        is_published: false, is_active: true,
        gallery_images: uploadedGallery.length > 0 ? uploadedGallery : undefined,
        featured_socials: featuredIcons.length > 0 ? featuredIcons.map(fi => ({ platform: fi.platform, url: fi.url })) : undefined,
        videos: uploadedVideos.length > 0 ? uploadedVideos : undefined,
        professional_category: professionalCategory || undefined,
        review_google_url: reviewGoogleUrl || undefined,
        review_yelp_url: reviewYelpUrl || undefined,
        review_tripadvisor_url: reviewTripadvisorUrl || undefined,
        review_facebook_url: reviewFacebookUrl || undefined,
        review_bbb_url: reviewBbbUrl || undefined,
      } as any);

      if (!card) { alert('Failed to save card. Please check your connection and try again.'); setIsCreating(false); return; }
      if (links.length > 0) {
        try {
          await saveCardLinks(card.id, links.filter(l => l.value.trim()).map((l, i) => ({
            id: l.id, card_id: card.id, platform: l.platform, url: l.value, value: l.value, sort_order: i, is_active: true,
          })));
        } catch (e) { console.warn('Links save failed:', e); }
      }
      router.push(`/app/ecard/dashboard?cardId=${card.id}`);
    } catch (err: any) {
      console.error('Error creating card:', err);
      alert(`Error: ${err?.message || 'Unknown error'}. Please try again.`);
    } finally { setIsCreating(false); }
  };

  // Button style helper
  const btnStyle = (): React.CSSProperties => ({
    height: 44, borderRadius: isAccentTab ? 8 : btnRadius,
    background: isOutline ? 'transparent' : isFrosted ? (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)') : isAccentTab ? `${accentColor}20` : accentColor,
    border: isOutline ? `1.5px solid ${isLight ? 'rgba(0,0,0,0.15)' : (accentColor || 'rgba(255,255,255,0.2)')}` : 'none',
    borderLeft: isAccentTab ? `4px solid ${accentColor}` : undefined,
    backdropFilter: isFrosted ? 'blur(10px)' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    color: isOutline ? txtColor : (isLight ? '#333' : '#fff'),
    fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', fontFamily: font,
  });

  // Input style on the card
  const cardInputStyle = (align = 'center'): React.CSSProperties => ({
    background: 'transparent', border: 'none', outline: 'none',
    color: txtColor, textAlign: align as any, width: '100%', fontFamily: font, padding: '4px 0',
  });

  /* ============================================================
     SHARED EDITOR SECTIONS — reusable across all templates
     ============================================================ */
  const renderFeaturedIcons = () => (
    <div className="featured-icons-section">
      <div className="featured-icons-row">
        {featuredIcons.map(fi => {
          const iconInfo = PLATFORM_ICONS[fi.platform];
          return (
            <div key={fi.platform} className="featured-icon-slot" style={{ background: iconInfo?.bgColor || '#666' }}>
              {getSocialIcon(fi.platform, 18)}
              <button className="featured-icon-remove" onClick={(e) => { e.stopPropagation(); removeFeaturedIcon(fi.platform); }}>
                <IoClose size={10} />
              </button>
            </div>
          );
        })}
        {featuredIcons.length < 4 && (
          <button className="featured-icon-add" onClick={() => setShowFeaturedIconPicker(true)} style={{ borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)' }}>
            <IoAdd size={18} color={isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'} />
          </button>
        )}
      </div>
      {featuredIcons.map(fi => {
        const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
        return (
          <div key={`url-${fi.platform}`} className="featured-icon-url-row">
            <span style={{ color: txtSecondary, flexShrink: 0 }}>{getSocialIcon(fi.platform, 14)}</span>
            <input style={{ ...cardInputStyle('left'), fontSize: 13 }} placeholder={`${platform?.name || fi.platform} URL`} value={fi.url} onChange={e => updateFeaturedIconUrl(fi.platform, e.target.value)} />
          </div>
        );
      })}
    </div>
  );

  const renderContactFields = () => (
    <div className="contact-fields">
      {[
        { icon: <IoMail size={16} />, placeholder: 'Email', value: email, set: setEmail },
        { icon: <IoCall size={16} />, placeholder: 'Phone', value: phone, set: setPhone },
        { icon: <IoGlobe size={16} />, placeholder: 'Website URL', value: website, set: setWebsite },
        { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
      ].map((field, i) => (
        <div key={i} className="contact-row">
          <span className="contact-icon" style={{ color: txtSecondary }}>{field.icon}</span>
          <input style={{ ...cardInputStyle('left'), fontSize: 14, padding: '8px 0' }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
        </div>
      ))}
      {website.trim() && (
        <div className="contact-row" style={{ marginTop: -4 }}>
          <span className="contact-icon" style={{ color: txtSecondary, opacity: 0.5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </span>
          <input
            style={{ ...cardInputStyle('left'), fontSize: 13, padding: '6px 0', fontStyle: websiteLabel ? 'normal' : 'italic' as any, opacity: websiteLabel ? 1 : 0.6 }}
            placeholder='Website label (e.g. "My Portfolio", "Book Now")'
            value={websiteLabel}
            onChange={e => setWebsiteLabel(e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const renderLinksSection = () => (
    <div className="links-section">
      {links.map(link => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
        return (
          <div key={link.id} className="link-button" style={btnStyle()}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              {getSocialIcon(link.platform, 16)}
              <input style={{ ...cardInputStyle('left'), fontSize: 14, width: 'auto', flex: 1 }} placeholder={platform?.placeholder || 'Enter URL'} value={link.value} onChange={e => updateLinkValue(link.id, e.target.value)} onClick={e => e.stopPropagation()} />
            </span>
            <button className="link-action" onClick={() => removeLink(link.id)} style={{ color: '#EF4444' }}><IoTrash size={14} /></button>
          </div>
        );
      })}
      <button className="add-link-btn" onClick={() => setShowAddLink(true)}>
        <IoAdd size={20} color={ACCENT_GREEN} />
        <span>Add Link</span>
      </button>
    </div>
  );

  const renderGallerySection = () => (
    <div className="gallery-section editor-section">
      <div className="editor-section-label" style={{ color: txtSecondary }}><IoImages size={16} /> Photo Gallery</div>
      {galleryImages.length === 0 ? (
        <button className="gallery-empty-upload" onClick={() => galleryInputRef.current?.click()} style={{ borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }}>
          <IoImages size={20} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />
          <span style={{ fontSize: 13, fontWeight: 500, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)' }}>Add Photos</span>
        </button>
      ) : (
        <div className="gallery-grid">
          {galleryImages.map((img) => (
            <div key={img.id} className="gallery-thumb" onClick={() => setLightboxImage(img.url)}>
              <img src={img.url} alt="" />
              <button className="gallery-remove" onClick={e => { e.stopPropagation(); setGalleryImages(prev => prev.filter(g => g.id !== img.id)); }}><IoClose size={12} /></button>
            </div>
          ))}
          <button className="gallery-add" onClick={() => galleryInputRef.current?.click()} style={{ borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>
            <IoAdd size={24} color={txtSecondary} />
          </button>
        </div>
      )}
    </div>
  );

  const renderVideoSection = () => (
    <div className="video-section editor-section">
      <div className="editor-section-label" style={{ color: txtSecondary }}><IoVideocam size={16} /> Videos</div>
      {videos.map((video, idx) => (
        <div key={idx} className="video-item" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
          <span style={{ color: txtSecondary, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {video.type === 'youtube' ? <IoLogoYoutube size={18} color="#FF0000" /> : video.type === 'tavvy_short' ? <IoFilm size={18} /> : <IoPlay size={18} />}
            <span style={{ fontSize: 12, fontWeight: 500 }}>{video.type === 'youtube' ? 'YouTube' : video.type === 'tavvy_short' ? 'Tavvy Short' : 'Video URL'}</span>
          </span>
          {video.type === 'tavvy_short' && video.url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <video src={video.url} style={{ width: 64, height: 44, borderRadius: 8, objectFit: 'cover' }} />
              <span style={{ fontSize: 12, color: txtSecondary }}>15s video ready</span>
            </div>
          ) : (
            <input style={{ ...cardInputStyle('left'), fontSize: 13, flex: 1 }} placeholder={video.type === 'youtube' ? 'YouTube URL' : 'Video URL'} value={video.url} onChange={e => updateVideoUrl(idx, e.target.value)} />
          )}
          <button className="link-action" onClick={() => removeVideo(idx)} style={{ color: '#EF4444' }}><IoTrash size={14} /></button>
        </div>
      ))}
      {videos.length === 0 ? (
        <button className="gallery-empty-upload" onClick={() => setShowVideoTypePicker(true)} style={{ borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }}>
          <IoVideocam size={20} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />
          <span style={{ fontSize: 13, fontWeight: 500, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)' }}>Add Video</span>
        </button>
      ) : (
        <button className="add-link-btn" onClick={() => setShowVideoTypePicker(true)}>
          <IoAdd size={20} color={ACCENT_GREEN} />
          <span>Add Video</span>
        </button>
      )}
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileUpload} />
    </div>
  );

  const renderPhotoUpload = () => {
    if (isCover) {
      return (
        <div className="cover-photo" onClick={() => fileInputRef.current?.click()}>
          {profileImage ? (
            <img src={profileImage} alt="Cover" className="cover-img" />
          ) : (
            <div className="cover-placeholder">
              <IoCamera size={24} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
              <span style={{ color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>Add Cover Photo</span>
            </div>
          )}
        </div>
      );
    }
    // Enhanced photo size for better visibility
    const displaySize = Math.max(photoSize.size, 120);
    return (
      <div className="profile-section">
        <div className="profile-photo" style={{
          width: displaySize, height: displaySize,
          borderRadius: template?.layoutConfig?.photoStyle === 'square' ? 16 : template?.layoutConfig?.photoStyle === 'arch' ? '12px 12px 50% 50%' : '50%',
          border: color?.border ? `3px solid ${color.border}` : `3px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)'}`,
          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)',
        }} onClick={() => fileInputRef.current?.click()}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="profile-img" />
          ) : (
            <div className="photo-placeholder" style={{ background: 'transparent' }}>
              <IoCamera size={24} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: 11, fontWeight: 500, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)', marginTop: 4 }}>Add Photo</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // External review URL getter/setter map
  const reviewUrlMap: Record<string, { value: string; set: (v: string) => void }> = {
    reviewGoogleUrl: { value: reviewGoogleUrl, set: setReviewGoogleUrl },
    reviewYelpUrl: { value: reviewYelpUrl, set: setReviewYelpUrl },
    reviewTripadvisorUrl: { value: reviewTripadvisorUrl, set: setReviewTripadvisorUrl },
    reviewFacebookUrl: { value: reviewFacebookUrl, set: setReviewFacebookUrl },
    reviewBbbUrl: { value: reviewBbbUrl, set: setReviewBbbUrl },
  };

  const renderCategoryPicker = () => (
    <div className="category-picker-section editor-section">
      <div className="editor-section-label" style={{ color: txtSecondary }}>
        <IoBriefcase size={14} /> Professional Category
      </div>
      <button className="category-select-btn" onClick={() => setShowCategoryPicker(true)} style={{ color: txtColor, borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }}>
        <span>{PROFESSIONAL_CATEGORIES.find(c => c.id === professionalCategory)?.label || 'Select Category'}</span>
        <IoChevronDown size={16} color={txtSecondary} />
      </button>
    </div>
  );

  const renderExternalReviews = () => (
    <div className="external-reviews-section editor-section">
      <div className="editor-section-label" style={{ color: txtSecondary }}>
        <IoStar size={14} /> External Reviews
      </div>
      <div className="external-reviews-list">
        {EXTERNAL_REVIEW_PLATFORMS.map(platform => {
          const { value, set } = reviewUrlMap[platform.field];
          return (
            <div key={platform.id} className="external-review-row">
              <span className="external-review-badge" style={{ background: platform.color }}>
                {platform.icon}
              </span>
              <input
                style={{ ...cardInputStyle('left'), fontSize: 13, flex: 1 }}
                placeholder={`${platform.label} URL`}
                value={value}
                onChange={e => set(e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderNameFields = () => (
    <div className="card-fields">
      <input style={{ ...cardInputStyle(), fontSize: 24, fontWeight: 700, letterSpacing: -0.3 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
      <input style={{ ...cardInputStyle(), fontSize: 15, color: txtSecondary, fontWeight: 500 }} placeholder="Your Title / Role" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
      <textarea style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary, resize: 'none', minHeight: 44, lineHeight: 1.5 }} placeholder="Short bio about yourself..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
    </div>
  );

  const renderBannerUpload = () => (
    <div className="banner-upload" onClick={() => bannerInputRef.current?.click()}>
      {bannerImage ? (
        <img src={bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div className="banner-placeholder">
          <IoImage size={20} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />
          <span style={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500 }}>Add Banner</span>
        </div>
      )}
    </div>
  );

  /* ============================================================
     TEMPLATE-SPECIFIC EDITOR LAYOUTS
     ============================================================ */
  const renderEditorCard = () => {
    // ─── BASIC ───
    if (templateLayout === 'basic') {
      return (
        <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative' }}>
          {/* Profile photo - centered and prominent */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {renderPhotoUpload()}
            <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary, fontSize: 11, opacity: 0.6 }}>
              <IoExpand size={10} /> {photoSize.label} &middot; Tap to change size
            </button>
          </div>

          {/* Name & bio section */}
          <div className="editor-section">
            {renderNameFields()}
          </div>

          {/* Social icons */}
          <div className="editor-section" style={{ alignItems: 'center' }}>
            {renderFeaturedIcons()}
          </div>

          {/* Contact info section */}
          <div className="editor-section">
            <div className="editor-section-label" style={{ color: txtSecondary }}>
              <IoMail size={14} /> Contact Information
            </div>
            {renderContactFields()}
          </div>

          {/* Links section */}
          <div className="editor-section">
            <div className="editor-section-label" style={{ color: txtSecondary }}>
              <IoLink size={14} /> Links
            </div>
            {renderLinksSection()}
          </div>

          {/* Category & External Reviews */}
          {renderCategoryPicker()}
          {renderExternalReviews()}

          {/* Media sections */}
          {renderGallerySection()}
          {renderVideoSection()}
        </div>
      );
    }

    // ─── BLOGGER ───
    if (templateLayout === 'blogger') {
      const outerBg = color?.background || '#f8e8ee';
      const innerBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ background: outerBg, fontFamily: font, position: 'relative', padding: 0 }}>
          <div style={{ background: innerBg, borderRadius: 16, margin: 16, padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: 'calc(100% - 32px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {renderPhotoUpload()}
              <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
                <IoExpand size={12} /> {photoSize.label}
              </button>
            </div>
            <div className="editor-section">
              {renderNameFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── BUSINESS CARD ───
    if (templateLayout === 'business-card') {
      const topBg = `linear-gradient(180deg, ${color?.primary}, ${color?.secondary})`;
      const bottomBg = color?.cardBg || '#f8f9fa';
      const accentC = color?.accent || '#d4af37';
      const topTextColor = color?.text || '#d4af37';
      const topTextSec = color?.textSecondary || 'rgba(212,175,55,0.8)';
      return (
        <div className="live-card" style={{ background: topBg, fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden' }}>
          {/* Dark top section */}
          <div style={{ padding: '24px 20px 16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input style={{ ...cardInputStyle('left'), fontSize: 22, fontWeight: 700, color: accentC }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ ...cardInputStyle('left'), fontSize: 14, color: topTextSec }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
              <textarea style={{ ...cardInputStyle('left'), fontSize: 12, color: topTextSec, resize: 'none', minHeight: 30 }} placeholder="Company name..." value={bio} onChange={e => setBio(e.target.value)} rows={1} />
            </div>
            <div onClick={() => fileInputRef.current?.click()} style={{
              width: 90, height: 90, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
              border: `3px solid ${accentC}`, overflow: 'hidden',
              background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={24} color="rgba(255,255,255,0.3)" />}
            </div>
          </div>
          {/* Accent divider */}
          <div style={{ height: 2, background: accentC, opacity: 0.3 }} />
          {/* Light bottom section */}
          <div style={{ background: bottomBg, padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {renderFeaturedIcons()}
            <div className="contact-fields">
              {[
                { icon: <IoMail size={16} />, placeholder: 'Email', value: email, set: setEmail },
                { icon: <IoCall size={16} />, placeholder: 'Phone', value: phone, set: setPhone },
                { icon: <IoGlobe size={16} />, placeholder: 'Website URL', value: website, set: setWebsite },
                { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
              ].map((field, i) => (
                <div key={i} className="contact-row" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
                  <span style={{ color: accentC, flexShrink: 0 }}>{field.icon}</span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 13 }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
                </div>
              ))}
              {website.trim() && (
                <div className="contact-row" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)`, marginTop: -2 }}>
                  <span style={{ color: accentC, flexShrink: 0, opacity: 0.5 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 12, fontStyle: websiteLabel ? 'normal' : 'italic', opacity: websiteLabel ? 1 : 0.5 }} placeholder='Website label (e.g. "My Portfolio")' value={websiteLabel} onChange={e => setWebsiteLabel(e.target.value)} />
                </div>
              )}
            </div>
            {renderLinksSection()}
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── FULL WIDTH ───
    if (templateLayout === 'full-width') {
      return (
        <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden' }}>
          {/* Hero photo area */}
          <div className="banner-upload" onClick={() => fileInputRef.current?.click()} style={{ height: 300, position: 'relative' }}>
            {profileImage ? (
              <>
                <img src={profileImage} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
              </>
            ) : (
              <div className="banner-placeholder" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IoCamera size={28} color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)'} />
                </div>
                <span style={{ color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500 }}>Tap to add hero photo</span>
                <span style={{ color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', fontSize: 11 }}>Recommended: 1200 x 800px</span>
              </div>
            )}
            {/* Name overlay at bottom of hero */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, zIndex: 2 }}>
              <input style={{ ...cardInputStyle('left'), fontSize: 26, fontWeight: 700, color: '#fff' }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ ...cardInputStyle('left'), fontSize: 14, color: 'rgba(255,255,255,0.8)' }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
            </div>
          </div>
          {/* Content below hero */}
          <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="editor-section" style={{ alignItems: 'center', borderTop: 'none' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <textarea style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary, resize: 'none', minHeight: 48, width: '100%', background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }} placeholder="Short bio about yourself..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: txtSecondary }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: txtSecondary }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── PRO REALTOR ───
    if (templateLayout === 'pro-realtor') {
      return (
        <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden' }}>
          {/* Banner */}
          <div onClick={() => bannerInputRef.current?.click()} style={{ height: 140, cursor: 'pointer', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
            {bannerImage ? <img src={bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <IoImage size={24} color={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'} />
                <span style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>Add banner photo</span>
              </div>
            )}
          </div>
          {/* Arch photo overlapping banner */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -50 }}>
            <div onClick={() => fileInputRef.current?.click()} style={{
              width: 100, height: 100, borderRadius: '12px 12px 50% 50%', cursor: 'pointer',
              border: `3px solid ${color?.accent || '#c8a87c'}`, overflow: 'hidden',
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />}
            </div>
          </div>
          {/* Content */}
          <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="editor-section" style={{ borderTop: 'none' }}>
              {renderNameFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: txtSecondary }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: txtSecondary }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── PRO CREATIVE ───
    if (templateLayout === 'pro-creative') {
      const topBg = `linear-gradient(135deg, ${color?.primary}, ${color?.secondary})`;
      const bottomBg = color?.cardBg || '#FFFFFF';
      const topIsLight = false; // top is always dark/colored
      return (
        <div className="live-card" style={{ background: topBg, fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden' }}>
          {/* Bold colored top */}
          <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* Logo/photo */}
            <div onClick={() => fileInputRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: 16, cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color="rgba(255,255,255,0.4)" />}
            </div>
            <input style={{ ...cardInputStyle(), fontSize: 22, fontWeight: 700, color: '#fff' }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={{ ...cardInputStyle(), fontSize: 14, color: 'rgba(255,255,255,0.8)' }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
          </div>
          {/* Wave divider */}
          <svg viewBox="0 0 400 40" style={{ width: '100%', height: 40, display: 'block', marginTop: 8 }} preserveAspectRatio="none">
            <path d="M0 20 Q100 0 200 20 Q300 40 400 20 L400 40 L0 40 Z" fill={bottomBg} />
          </svg>
          {/* White bottom */}
          <div style={{ background: bottomBg, padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {renderFeaturedIcons()}
            <textarea style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'center', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 13, resize: 'none', minHeight: 40 }} placeholder="Short bio..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            <div className="contact-fields">
              {[
                { icon: <IoMail size={16} />, placeholder: 'Email', value: email, set: setEmail },
                { icon: <IoCall size={16} />, placeholder: 'Phone', value: phone, set: setPhone },
                { icon: <IoGlobe size={16} />, placeholder: 'Website URL', value: website, set: setWebsite },
                { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
              ].map((field, i) => (
                <div key={i} className="contact-row" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ color: color?.accent || '#f97316', flexShrink: 0 }}>{field.icon}</span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 13 }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
                </div>
              ))}
              {website.trim() && (
                <div className="contact-row" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', marginTop: -2 }}>
                  <span style={{ color: color?.accent || '#f97316', flexShrink: 0, opacity: 0.5 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 12, fontStyle: websiteLabel ? 'normal' : 'italic', opacity: websiteLabel ? 1 : 0.5 }} placeholder='Website label (e.g. "My Portfolio")' value={websiteLabel} onChange={e => setWebsiteLabel(e.target.value)} />
                </div>
              )}
            </div>
            {renderLinksSection()}
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── PRO CORPORATE ───
    if (templateLayout === 'pro-corporate') {
      return (
        <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative' }}>
          {/* Company logo bar */}
          <div style={{ width: '100%', padding: '8px 0', borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <input style={{ ...cardInputStyle(), fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: accentColor }} placeholder="COMPANY NAME" value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          {renderPhotoUpload()}
          <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
            <IoExpand size={12} /> {photoSize.label}
          </button>
          <div className="editor-section" style={{ borderTop: 'none' }}>
            <div className="card-fields">
              <input style={{ ...cardInputStyle(), fontSize: 22, fontWeight: 700 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary }} placeholder="Your Title / Role" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
            </div>
          </div>
          <div className="editor-section" style={{ alignItems: 'center' }}>
            {renderFeaturedIcons()}
          </div>
          <div className="editor-section">
            <div className="editor-section-label" style={{ color: txtSecondary }}>
              <IoMail size={14} /> Contact Information
            </div>
            {renderContactFields()}
          </div>
          <div className="editor-section">
            <div className="editor-section-label" style={{ color: txtSecondary }}>
              <IoLink size={14} /> Links
            </div>
            {renderLinksSection()}
          </div>
          {renderCategoryPicker()}
          {renderExternalReviews()}
          {renderGallerySection()}
          {renderVideoSection()}
        </div>
      );
    }

    // ─── PRO CARD ─── (dark top with name/photo, diagonal, white bottom)
    if (templateLayout === 'pro-card') {
      const darkBg = `linear-gradient(135deg, ${color?.primary || '#1e40af'}, ${color?.secondary || '#3b82f6'})`;
      const goldAccent = color?.accent || '#fbbf24';
      const whiteBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden', background: whiteBg }}>
          {/* Dark top section */}
          <div style={{ background: darkBg, padding: '24px 24px 50px', position: 'relative', minHeight: 200 }}>
            {/* Company badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: goldAccent, flexShrink: 0 }} />
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: goldAccent, width: '100%' }} placeholder="COMPANY NAME" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            {/* Name (left) + Photo (right) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: goldAccent, width: '100%', lineHeight: 1.2 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
                <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: goldAccent, width: '100%', marginTop: 8 }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
              </div>
              {/* Photo with decorative ring */}
              <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', border: `2px solid ${goldAccent}40`, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `1px dashed ${goldAccent}30`, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color="rgba(255,255,255,0.4)" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Diagonal transition */}
          <div style={{ position: 'relative', height: 30, marginTop: -1 }}>
            <div style={{ position: 'absolute', inset: 0, background: color?.primary || '#1e40af' }} />
            <svg viewBox="0 0 400 30" style={{ width: '100%', height: 30, display: 'block', position: 'relative', zIndex: 1 }} preserveAspectRatio="none">
              <path d="M0 30 L400 0 L400 30 Z" fill={whiteBg} />
            </svg>
          </div>
          {/* White bottom section */}
          <div style={{ background: whiteBg, padding: '4px 24px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#555', resize: 'none', minHeight: 44, lineHeight: 1.6, width: '100%' }} placeholder="Short bio about yourself..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            <div style={{ height: 1, background: '#e5e5e5' }} />
            <div className="editor-section" style={{ borderTop: 'none' }}>
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── COVER CARD ─── (cover photo top, white bottom)
    if (templateLayout === 'cover-card') {
      const primaryCol = color?.primary || '#7c3aed';
      const accentCol = color?.accent || '#f97316';
      const whiteBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden', background: whiteBg }}>
          {/* Cover photo section */}
          <div onClick={() => fileInputRef.current?.click()} style={{ width: '100%', height: 220, cursor: 'pointer', background: `linear-gradient(135deg, ${primaryCol}, ${color?.secondary || primaryCol})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <IoImage size={40} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Add Cover Photo</span>
              </div>
            )}
            {/* Logo overlay placeholder */}
            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IoBusinessOutline size={16} color={primaryCol} />
              <span style={{ fontSize: 10, color: primaryCol, fontWeight: 600 }}>Logo</span>
            </div>
          </div>
          {/* Wavy accent transition */}
          <svg viewBox="0 0 400 20" style={{ width: '100%', height: 16, display: 'block', marginTop: -12 }} preserveAspectRatio="none">
            <path d="M0 20 C100 0 200 18 300 4 C350 -2 380 8 400 0 L400 20 Z" fill={whiteBg} />
            <path d="M0 20 C80 6 160 20 260 6 C320 -1 370 12 400 4 L400 20 Z" fill={accentCol} opacity="0.12" />
          </svg>
          {/* White bottom section */}
          <div style={{ background: whiteBg, padding: '4px 24px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="card-fields">
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 700, color: '#1a1a2e', width: '100%' }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#444', width: '100%' }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#888', fontStyle: 'italic', width: '100%' }} placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} />
              <textarea style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#555', resize: 'none', minHeight: 44, lineHeight: 1.6, width: '100%' }} placeholder="Short bio..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── BIZ TRADITIONAL ─── (classic centered business card)
    if (templateLayout === 'biz-traditional') {
      const darkBg = color?.primary || '#0c1b3a';
      const accentC = color?.accent || '#c9a84c';
      const borderC = color?.border || '#c9a84c';
      const whiteBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden', background: whiteBg }}>
          {/* Colored accent bar */}
          <div style={{ width: '100%', height: 6, background: darkBg }} />
          {/* Logo area */}
          <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IoBusinessOutline size={18} color={accentC} />
            </div>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: darkBg, letterSpacing: 0.5, flex: 1 }} placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          {/* Accent line */}
          <div style={{ width: 50, height: 2, background: accentC, margin: '14px auto' }} />
          {/* Photo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${borderC}`, overflow: 'hidden', cursor: 'pointer', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color="#ccc" />}
            </div>
          </div>
          {/* Name / Title / Company */}
          <div style={{ textAlign: 'center', padding: '12px 24px 0' }}>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 700, color: '#1a1a2e', width: '100%', textAlign: 'center' }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: darkBg, width: '100%', textAlign: 'center', marginTop: 2 }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
          </div>
          {/* Divider */}
          <div style={{ width: '80%', height: 1, background: '#e5e5e5', margin: '14px auto' }} />
          {/* Contact fields + bio */}
          <div style={{ padding: '0 24px 8px' }}>
            <textarea style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#555', resize: 'none', minHeight: 36, lineHeight: 1.5, width: '100%', textAlign: 'center' }} placeholder="Short bio..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
          </div>
          <div style={{ padding: '0 24px 16px' }}>
            <div className="editor-section" style={{ borderTop: 'none' }}>
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
          {/* Bottom accent bar */}
          <div style={{ width: '100%', height: 4, background: accentC }} />
        </div>
      );
    }

    // ─── BIZ MODERN ─── (split layout modern business card)
    if (templateLayout === 'biz-modern') {
      const darkBg = color?.primary || '#0f2b5b';
      const secondaryBg = color?.secondary || '#1a3f7a';
      const accentC = color?.accent || '#3b82f6';
      const whiteBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden', background: whiteBg }}>
          {/* Colored top section */}
          <div style={{ background: `linear-gradient(135deg, ${darkBg} 0%, ${secondaryBg} 100%)`, padding: '24px 24px 56px', position: 'relative' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IoBusinessOutline size={14} color="#fff" />
              </div>
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5, flex: 1 }} placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            {/* Name + Title (left) */}
            <div style={{ paddingRight: 120 }}>
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: '#fff', width: '100%', lineHeight: 1.2 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', width: '100%', marginTop: 4 }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
            </div>
            {/* Photo (right, overlapping) */}
            <div onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', right: 24, bottom: -40, cursor: 'pointer' }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color="rgba(255,255,255,0.4)" />}
              </div>
            </div>
          </div>
          {/* Curved transition */}
          <svg viewBox="0 0 400 30" style={{ width: '100%', height: 24, display: 'block', marginTop: -1 }} preserveAspectRatio="none">
            <path d="M0 0 L400 0 L400 30 C300 0 100 0 0 30 Z" fill={darkBg} />
          </svg>
          {/* White bottom */}
          <div style={{ background: whiteBg, padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#555', resize: 'none', minHeight: 36, lineHeight: 1.5, width: '100%' }} placeholder="Short bio..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            <div className="editor-section" style={{ borderTop: 'none' }}>
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoMail size={14} /> Contact Information
              </div>
              {renderContactFields()}
            </div>
            <div className="editor-section" style={{ alignItems: 'center' }}>
              {renderFeaturedIcons()}
            </div>
            <div className="editor-section">
              <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.4)' }}>
                <IoLink size={14} /> Links
              </div>
              {renderLinksSection()}
            </div>
            {renderCategoryPicker()}
            {renderExternalReviews()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // ─── BIZ MINIMALIST ─── (ultra-clean minimal business card)
    if (templateLayout === 'biz-minimalist') {
      const accentC = color?.accent || '#111111';
      const whiteBg = color?.cardBg || '#FFFFFF';
      return (
        <div className="live-card" style={{ fontFamily: font, position: 'relative', padding: '28px 24px 24px', overflow: 'hidden', background: whiteBg }}>
          {/* Small logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${accentC}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IoBusinessOutline size={14} color={accentC} />
            </div>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: 1, textTransform: 'uppercase' as const, flex: 1 }} placeholder="COMPANY NAME" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          {/* Square photo */}
          <div onClick={() => fileInputRef.current?.click()} style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={28} color="#ccc" />}
          </div>
          {/* Name */}
          <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 300, color: color?.primary || '#111', width: '100%', marginTop: 18, letterSpacing: -0.5 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
          {/* Title */}
          <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, fontWeight: 500, color: '#999', width: '100%', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 2 }} placeholder="YOUR TITLE" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
          {/* Thin line */}
          <div style={{ width: 40, height: 1, background: '#e0e0e0', margin: '18px 0' }} />
          {/* Bio */}
          <textarea style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#555', resize: 'none', minHeight: 36, lineHeight: 1.5, width: '100%' }} placeholder="Short bio..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
          {/* Contact fields */}
          <div className="editor-section" style={{ borderTop: 'none', marginTop: 8 }}>
            <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.35)' }}>
              <IoMail size={14} /> Contact
            </div>
            {renderContactFields()}
          </div>
          <div className="editor-section" style={{ alignItems: 'center' }}>
            {renderFeaturedIcons()}
          </div>
          <div className="editor-section">
            <div className="editor-section-label" style={{ color: 'rgba(0,0,0,0.35)' }}>
              <IoLink size={14} /> Links
            </div>
            {renderLinksSection()}
          </div>
          {renderCategoryPicker()}
          {renderExternalReviews()}
          {renderGallerySection()}
          {renderVideoSection()}
        </div>
      );
    }

    // Fallback — basic layout
    return (
      <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {renderPhotoUpload()}
          <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
            <IoExpand size={12} /> {photoSize.label} &middot; Tap to change size
          </button>
        </div>
        <div className="editor-section">
          {renderNameFields()}
        </div>
        <div className="editor-section" style={{ alignItems: 'center' }}>
          {renderFeaturedIcons()}
        </div>
        <div className="editor-section">
          <div className="editor-section-label" style={{ color: txtSecondary }}>
            <IoMail size={14} /> Contact Information
          </div>
          {renderContactFields()}
        </div>
        <div className="editor-section">
          <div className="editor-section-label" style={{ color: txtSecondary }}>
            <IoLink size={14} /> Links
          </div>
          {renderLinksSection()}
        </div>
        {renderCategoryPicker()}
        {renderExternalReviews()}
        {renderGallerySection()}
        {renderVideoSection()}
      </div>
    );
  };

  return (
    <AppLayout>
      <Head><title>Create eCard | Tavvy</title></Head>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
      <input type="file" ref={galleryInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
      <input type="file" ref={bannerInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />

      <div className="ecard-editor">
        {step === 'gallery' ? (
          /* ===== STEP 1: FULL-SCREEN SWIPEABLE TEMPLATE BROWSER ===== */
          <>
            {/* Top bar with back button */}
            <div className="gallery-top-bar">
              <button className="back-btn" onClick={() => router.back()}>
                <IoArrowBack size={22} color={isDark ? '#fff' : '#333'} />
              </button>
              <div style={{ width: 30 }} />
            </div>

            {/* Template name + description + badge — ABOVE the card */}
            <div className="swiper-header">
              <div className="tg-name-row" style={{ justifyContent: 'center' }}>
                <span className="tg-name" style={{ fontSize: 20 }}>{TEMPLATES[galleryIndex].name}</span>
                {TEMPLATES[galleryIndex].isPremium ? (
                  <span className="tg-pro-tag">PRO</span>
                ) : (
                  <span className="tg-free-tag">FREE</span>
                )}
              </div>
              <span className="tg-desc" style={{ textAlign: 'center', display: 'block', marginTop: 4 }}>{TEMPLATES[galleryIndex].description}</span>
              <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.3)' : '#bbb', display: 'block', marginTop: 6 }}>Swipe to browse &middot; Tap card to select</span>
            </div>

            {/* Swipeable card area */}
            <div
              className="swiper-container"
              onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
              onTouchMove={e => handleSwipeMove(e.touches[0].clientX)}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={e => handleSwipeStart(e.clientX)}
              onMouseMove={e => handleSwipeMove(e.clientX)}
              onMouseUp={handleSwipeEnd}
              onMouseLeave={handleSwipeEnd}
            >
              {/* Navigation arrows */}
              {galleryIndex > 0 && (
                <button className="swiper-arrow swiper-arrow-left" onClick={() => setGalleryIndex(prev => prev - 1)}>
                  <IoChevronBack size={24} color={isDark ? '#fff' : '#333'} />
                </button>
              )}
              {galleryIndex < TEMPLATES.length - 1 && (
                <button className="swiper-arrow swiper-arrow-right" onClick={() => setGalleryIndex(prev => prev + 1)}>
                  <IoChevronForward size={24} color={isDark ? '#fff' : '#333'} />
                </button>
              )}

              {/* The card */}
              {(() => {
                const currentTmpl = TEMPLATES[galleryIndex];
                const cs = currentTmpl.colorSchemes[0];
                const bg = cs?.background?.includes('gradient') ? cs.background : `linear-gradient(135deg, ${cs?.primary || '#333'}, ${cs?.secondary || '#555'})`;
                const isBloggerLayout = currentTmpl.layout === 'blogger';
                const isProCardLayout = currentTmpl.layout === 'pro-card';
                const isCoverCardLayout = currentTmpl.layout === 'cover-card';
                const isBizLayout = currentTmpl.layout === 'biz-traditional' || currentTmpl.layout === 'biz-modern' || currentTmpl.layout === 'biz-minimalist';
                const hasOwnBg = isProCardLayout || isCoverCardLayout || isBizLayout;
                return (
                  <div
                    className="swiper-card"
                    style={{
                      background: hasOwnBg ? 'transparent' : isBloggerLayout ? (cs?.background || '#f8e8ee') : bg,
                      overflow: hasOwnBg ? 'hidden' : undefined,
                      borderColor: currentTmpl.layout === 'business-card' ? (cs?.border || 'transparent') : 'transparent',
                      borderWidth: currentTmpl.layout === 'business-card' ? 1 : 0,
                      borderStyle: 'solid',
                    }}
                    onClick={() => {
                      const elapsed = Date.now() - tapStartTime.current;
                      const dist = Math.abs(touchStartX.current - touchEndX.current);
                      if (elapsed < 500 && dist < 30) {
                        selectTemplate();
                      }
                    }}
                  >
                    <FullCardPreview tmpl={currentTmpl} />
                  </div>
                );
              })()}
            </div>

            {/* Dots + Use button — BELOW the card */}
            <div className="swiper-footer">
              <div className="swiper-dots">
                {TEMPLATES.map((_, i) => (
                  <button
                    key={i}
                    className={`swiper-dot ${i === galleryIndex ? 'active' : ''}`}
                    onClick={() => setGalleryIndex(i)}
                  />
                ))}
              </div>
              <button className="use-template-btn" onClick={selectTemplate}>
                Use This Template
              </button>
            </div>
          </>
        ) : (
          /* ===== STEP 2: CARD EDITOR ===== */
          <>
            {/* Top bar */}
            <div className="top-bar">
              <button className="back-btn" onClick={() => setStep('gallery')}>
                <IoArrowBack size={22} color={isDark ? '#fff' : '#333'} />
              </button>
              <div className="template-indicator">
                <div className="template-name-row">
                  <span className="template-name-label">{template?.name}</span>
                  {usesPremiumTemplate && (
                    <span className="pro-badge"><IoLockClosed size={9} color="#fff" /> PRO</span>
                  )}
                </div>
                <span className="template-count">Edit &amp; customize your card</span>
              </div>
              <button className="save-btn" onClick={handleSave} disabled={isCreating || !name.trim()}>
                {isCreating ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Auto-fill banner */}
            {showAutoFillBanner && previousCard && (
              <div className="autofill-banner">
                <div className="autofill-text">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Use info from your previous card?</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{previousCard.full_name || 'Your last card'}</span>
                </div>
                <div className="autofill-actions">
                  <button className="autofill-yes" onClick={() => applyAutoFill(previousCard)}>Yes, use it</button>
                  <button className="autofill-no" onClick={() => setShowAutoFillBanner(false)}>No thanks</button>
                </div>
              </div>
            )}

            {/* THE CARD — template-specific layout */}
            <div className="card-container">
              {renderEditorCard()}
            </div>

            {/* Bottom toolbar - template switcher + color dots */}
            <div className="bottom-bar">
              <div className="template-switcher">
                <button className="template-nav-btn" onClick={goToPrevTemplate} disabled={templateIndex === 0}>
                  <IoChevronBack size={18} />
                </button>
                <span className="template-nav-label">{template?.name}</span>
                <button className="template-nav-btn" onClick={goToNextTemplate} disabled={templateIndex === TEMPLATES.length - 1}>
                  <IoChevronForward size={18} />
                </button>
              </div>
              <div className="color-dots">
                {colorSchemes.map((cs, i) => (
                  <button
                    key={cs.id}
                    className={`color-dot ${i === colorIndex ? 'active' : ''}`}
                    style={{ background: cs.background?.includes('gradient') ? cs.background : `linear-gradient(135deg, ${cs.primary}, ${cs.secondary})` }}
                    onClick={() => setColorIndex(i)}
                  />
                ))}
              </div>
            </div>

            {/* Photo size picker modal */}
            {showPhotoSizePicker && (
              <div className="modal-overlay" onClick={() => setShowPhotoSizePicker(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>Photo Size</h3>
                  {PHOTO_SIZE_OPTIONS.map((opt, i) => (
                    <button key={opt.id} className={`size-option ${i === photoSizeIndex ? 'active' : ''}`} onClick={() => { setPhotoSizeIndex(i); setShowPhotoSizePicker(false); }}>
                      <span className="size-preview" style={{ width: opt.size > 0 ? Math.min(opt.size, 40) : 40, height: opt.size > 0 ? Math.min(opt.size, 40) : 24, borderRadius: opt.id === 'cover' ? 4 : '50%', background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
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
                  <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999', fontSize: 13, margin: '-8px 0 16px' }}>Choose a social media icon ({featuredIcons.length}/4 used)</p>
                  <div className="platform-grid">
                    {FEATURED_ICON_PLATFORMS.filter(p => !featuredIcons.find(fi => fi.platform === p.id)).map(p => (
                      <button key={p.id} className="platform-btn" onClick={() => addFeaturedIcon(p.id)}>
                        <div className="platform-icon" style={{ background: PLATFORM_ICONS[p.id]?.bgColor || '#666' }}>{getSocialIcon(p.id, 20)}</div>
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
                        <div className="platform-icon" style={{ background: PLATFORM_ICONS[p.id]?.bgColor || '#666' }}>{getSocialIcon(p.id, 20)}</div>
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
                  <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999', fontSize: 13, margin: '-8px 0 16px' }}>Choose a video type</p>
                  <div className="platform-grid">
                    <button className="platform-btn" onClick={() => addVideo('youtube')}>
                      <div className="platform-icon" style={{ background: '#FF0000' }}><IoLogoYoutube size={20} color="#fff" /></div>
                      <span>YouTube</span>
                    </button>
                    <button className="platform-btn" onClick={() => addVideo('tavvy_short')}>
                      <div className="platform-icon" style={{ background: ACCENT_GREEN }}><IoFilm size={20} color="#fff" /></div>
                      <span>Tavvy Short (15s)</span>
                    </button>
                    <button className="platform-btn" onClick={() => addVideo('external')}>
                      <div className="platform-icon" style={{ background: '#6366F1' }}><IoPlay size={20} color="#fff" /></div>
                      <span>Video URL</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category picker modal */}
            {showCategoryPicker && (
              <div className="modal-overlay" onClick={() => setShowCategoryPicker(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>Professional Category</h3>
                  <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#999', fontSize: 13, margin: '-8px 0 16px' }}>Choose your industry for relevant endorsement tags</p>
                  <div className="category-list">
                    {PROFESSIONAL_CATEGORIES.map(cat => (
                      <button key={cat.id} className={`category-option ${professionalCategory === cat.id ? 'active' : ''}`} onClick={() => { setProfessionalCategory(cat.id); setShowCategoryPicker(false); }}>
                        <span>{cat.label}</span>
                        {professionalCategory === cat.id && <span className="check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        .ecard-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: ${isDark ? '#000000' : '#F5F5F5'};
          overflow: hidden;
        }

        /* ===== STEP 1: SWIPEABLE TEMPLATE BROWSER ===== */
        .gallery-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px 0;
          flex-shrink: 0;
        }

        .swiper-header {
          flex-shrink: 0;
          text-align: center;
          padding: 4px 24px 10px;
        }

        .swiper-container {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 0 16px;
          user-select: none;
          -webkit-user-select: none;
          cursor: grab;
        }

        .swiper-container:active {
          cursor: grabbing;
        }

        .swiper-card {
          width: 100%;
          max-width: 360px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
          transition: transform 0.3s ease, opacity 0.3s ease;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 300px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          cursor: pointer;
        }

        .swiper-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          transition: background 0.2s;
        }

        .swiper-arrow:hover {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
        }

        .swiper-arrow-left {
          left: 4px;
        }

        .swiper-arrow-right {
          right: 4px;
        }

        .swiper-footer {
          flex-shrink: 0;
          padding: 10px 24px;
          padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .swiper-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin: 10px 0;
        }

        .swiper-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s;
        }

        .swiper-dot.active {
          background: ${ACCENT_GREEN};
          transform: scale(1.3);
        }

        .use-template-btn {
          width: 100%;
          max-width: 320px;
          margin: 4px auto 0;
          padding: 14px 24px;
          border-radius: 14px;
          border: none;
          background: ${ACCENT_GREEN};
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          display: block;
        }

        .use-template-btn:hover {
          transform: scale(1.02);
        }

        .use-template-btn:active {
          transform: scale(0.98);
        }

        .tg-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .tg-name {
          font-size: 14px;
          font-weight: 600;
          color: ${isDark ? '#fff' : '#111'};
        }

        .tg-pro-tag {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tg-free-tag {
          display: inline-flex;
          align-items: center;
          background: ${ACCENT_GREEN};
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tg-desc {
          font-size: 12px;
          color: ${isDark ? 'rgba(255,255,255,0.45)' : '#888'};
          line-height: 1.3;
        }

        /* ===== STEP 2: CARD EDITOR ===== */
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
        }

        .back-btn {
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'};
        }

        .template-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .template-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .template-name-label {
          font-size: 17px;
          font-weight: 700;
          color: ${isDark ? '#fff' : '#1a1a1a'};
          letter-spacing: -0.2px;
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
          padding: 10px 24px;
          border-radius: 22px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px ${ACCENT_GREEN}40;
          transition: all 0.2s ease;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${ACCENT_GREEN}50;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .card-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 16px 16px;
          -webkit-overflow-scrolling: touch;
        }

        .live-card {
          border-radius: 24px;
          min-height: 500px;
          padding: 20px 18px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          transition: background 0.3s ease;
        }

        .editor-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 0;
          border-top: 1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};
        }

        .editor-section:first-of-type {
          border-top: none;
        }

        .editor-section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          opacity: 0.5;
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
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .profile-photo:hover {
          opacity: 0.9;
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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: inherit;
        }

        .photo-upload-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2.5px dashed;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s;
        }

        .profile-photo:hover .photo-upload-ring {
          border-color: ${ACCENT_GREEN} !important;
        }

        .size-hint {
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'};
          border: none;
          font-size: 11px;
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${txtSecondary};
          transition: background 0.2s;
        }

        .size-hint:hover {
          background: ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'};
        }

        /* Cover photo */
        .cover-photo {
          width: calc(100% + 36px);
          margin: -20px -18px 0;
          height: 180px;
          cursor: pointer;
          overflow: hidden;
          border-radius: 20px 20px 0 0;
          transition: opacity 0.2s;
        }

        .cover-photo:hover {
          opacity: 0.92;
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
          gap: 4px;
          background: ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};
        }

        .cover-upload-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px dashed ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'};
        }

        /* Banner upload */
        .banner-upload {
          width: 100%;
          height: 120px;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          border-radius: 16px;
          transition: opacity 0.2s;
        }

        .banner-upload:hover {
          opacity: 0.92;
        }

        .banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: ${isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'};
          border: 1.5px dashed ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'};
          border-radius: 12px;
        }

        .banner-upload-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== FEATURED ICONS ROW ===== */
        .featured-icons-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
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
          transition: transform 0.2s ease;
        }

        .featured-icon-slot:hover {
          transform: scale(1.05);
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
          border: 1.5px dashed;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .featured-icon-add:hover {
          background: ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'};
          transform: scale(1.08);
          border-color: ${ACCENT_GREEN};
        }

        .featured-icons-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .featured-icon-url-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
        }

        .featured-icon-url-row:last-child {
          border-bottom: none;
        }

        .featured-icon-url-row input::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'};
        }

        /* Video section */
        .video-section {
          width: 100%;
          padding: 12px 0;
        }

        .video-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .video-empty-upload {
          width: 100%;
          min-height: 90px;
          border: 2px dashed;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          padding: 20px 16px;
          transition: all 0.25s ease;
        }

        .video-empty-upload:hover {
          border-color: ${ACCENT_GREEN}60;
          background: ${ACCENT_GREEN}08 !important;
        }

        .video-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }

        /* Card fields */
        .card-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .card-fields input,
        .card-fields textarea {
          text-align: center;
        }

        .card-fields input::placeholder,
        .card-fields textarea::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'};
        }

        /* Contact fields */
        .contact-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 0;
          border-bottom: 1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};
        }

        .contact-row:last-child {
          border-bottom: none;
        }

        .contact-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.5;
        }

        .contact-row input::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'};
        }

        /* Links */
        .links-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .link-button {
          position: relative;
          padding: 0 14px;
          border-radius: 12px;
        }

        .link-button input::placeholder {
          color: ${isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'};
        }

        .link-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .link-action:hover {
          background: rgba(239,68,68,0.1);
        }

        .add-link-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px dashed ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          background: transparent;
          color: ${ACCENT_GREEN};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .add-link-btn:hover {
          border-color: ${ACCENT_GREEN}40;
          background: ${ACCENT_GREEN}08;
        }

        /* Gallery */
        .gallery-section {
          width: 100%;
          margin-top: 4px;
        }

        .gallery-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .gallery-empty-upload {
          width: 100%;
          min-height: 70px;
          border: 1.5px dashed;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          padding: 16px 12px;
          transition: all 0.2s ease;
        }

        .gallery-empty-upload:hover {
          border-color: ${ACCENT_GREEN}60;
          background: ${ACCENT_GREEN}08 !important;
        }

        .gallery-empty-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .gallery-thumb {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .gallery-thumb:hover {
          transform: scale(1.03);
        }

        .gallery-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0,0,0,0.65);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .gallery-remove:hover {
          background: rgba(239,68,68,0.9);
        }

        .gallery-add {
          aspect-ratio: 1;
          border-radius: 12px;
          border: 2px dashed;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gallery-add:hover {
          border-color: ${ACCENT_GREEN}60;
          background: ${ACCENT_GREEN}08;
        }

        /* ===== BOTTOM BAR ===== */
        .bottom-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: ${isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'};
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          flex-shrink: 0;
          backdrop-filter: blur(10px);
        }

        .template-switcher {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .template-nav-btn {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${isDark ? '#fff' : '#333'};
          transition: all 0.2s ease;
        }

        .template-nav-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .template-nav-btn:not(:disabled):hover {
          background: ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'};
          transform: scale(1.05);
        }

        .template-nav-label {
          font-size: 14px;
          font-weight: 600;
          color: ${isDark ? '#fff' : '#333'};
          min-width: 120px;
          text-align: center;
        }

        .color-dots {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .color-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .color-dot:hover {
          transform: scale(1.1);
        }

        .color-dot.active {
          border-color: ${ACCENT_GREEN};
          transform: scale(1.2);
          box-shadow: 0 0 0 2px ${isDark ? '#000000' : '#F5F5F5'}, 0 0 0 4px ${ACCENT_GREEN};
        }

        /* ===== MODALS ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-content {
          background: ${isDark ? '#1E293B' : '#fff'};
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 380px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.25s ease;
        }

        .modal-content h3 {
          margin: 0 0 16px;
          color: ${isDark ? '#fff' : '#1a1a1a'};
          font-size: 20px;
          font-weight: 700;
        }

        .size-option {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 12px;
          color: ${isDark ? '#fff' : '#333'};
          font-size: 15px;
          transition: background 0.2s;
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
          font-size: 18px;
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .platform-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'};
          border-radius: 14px;
          cursor: pointer;
          color: ${isDark ? '#fff' : '#333'};
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .platform-btn:hover {
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
          border-color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          transform: translateY(-1px);
        }

        .platform-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .lightbox-img {
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 12px;
          object-fit: contain;
        }

        /* ===== CATEGORY PICKER ===== */
        .category-select-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .category-select-btn:hover {
          opacity: 0.8;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 400px;
          overflow-y: auto;
        }

        .category-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          color: ${isDark ? '#fff' : '#333'};
          border-radius: 8px;
          transition: background 0.15s ease;
        }

        .category-option:hover {
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
        }

        .category-option.active {
          background: ${ACCENT_GREEN}15;
          color: ${ACCENT_GREEN};
          font-weight: 600;
        }

        /* ===== EXTERNAL REVIEWS ===== */
        .external-reviews-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .external-review-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
        }

        .external-review-row:last-child {
          border-bottom: none;
        }

        .external-review-badge {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          color: #fff;
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

        /* Auto-fill banner */
        .autofill-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          margin: 0 0 4px;
          background: rgba(59, 159, 217, 0.08);
          border: 1px solid rgba(59, 159, 217, 0.2);
          border-radius: 12px;
        }
        .autofill-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .autofill-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .autofill-yes {
          padding: 6px 12px;
          border-radius: 8px;
          background: #3B9FD9;
          color: #fff;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .autofill-no {
          padding: 6px 10px;
          border-radius: 8px;
          background: transparent;
          color: #888;
          border: 1px solid #ddd;
          font-size: 12px;
          cursor: pointer;
        }
      `}</style>>
    </AppLayout>
  );
}
