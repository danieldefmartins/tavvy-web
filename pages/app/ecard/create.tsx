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

/* ============================================================
   FULL-SCREEN CARD PREVIEW — Renders a realistic full card
   with sample data for the swipeable gallery
   ============================================================ */
const SAMPLE_AVATAR = '/images/sample-avatar.png';
const SAMPLE_BANNER = '/images/sample-banner.jpg';

const SAMPLE_DATA = {
  name: 'Jane Smith',
  title: 'Content Creator & Designer',
  company: 'Creative Studio',
  bio: 'Helping brands tell their story through design and strategy',
  phone: '(555) 123-4567',
  email: 'jane@example.com',
  website: 'janesmith.com',
  location: 'Los Angeles, CA',
  links: ['My Portfolio', 'Book a Call', 'Latest Work'],
  socials: ['instagram', 'tiktok', 'youtube', 'linkedin'],
  industry: 'Marketing',
  services: ['Branding', 'Web Design', 'Photography', 'Social Media'],
};

// SVG icon components for the preview
const PreviewPhoneIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
const PreviewEmailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
const PreviewGlobeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const PreviewLocationIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
const PreviewMsgIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>;

// Social icon for preview
function PreviewSocialIcon({ platform, size = 16, color = '#fff' }: { platform: string; size?: number; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <IoLogoInstagram size={size} color={color} />,
    tiktok: <IoLogoTiktok size={size} color={color} />,
    youtube: <IoLogoYoutube size={size} color={color} />,
    linkedin: <IoLogoLinkedin size={size} color={color} />,
    twitter: <IoLogoTwitter size={size} color={color} />,
    facebook: <IoLogoFacebook size={size} color={color} />,
  };
  return <>{icons[platform] || <IoGlobe size={size} color={color} />}</>;
}

function FullCardPreview({ tmpl }: { tmpl: Template }) {
  const cs = tmpl.colorSchemes[0];
  const bg = cs?.background?.includes('gradient') ? cs.background : `linear-gradient(135deg, ${cs?.primary || '#333'}, ${cs?.secondary || '#555'})`;
  const txtCol = cs?.text || '#fff';
  const txtSec = cs?.textSecondary || 'rgba(255,255,255,0.7)';
  const accentCol = cs?.accent || '#00C853';
  const cardBgCol = cs?.cardBg || '#fff';
  const borderCol = cs?.border || 'transparent';
  const isLightBg = cs?.text === '#2d2d2d' || cs?.text === '#1f2937';

  // Real photo avatar
  const PhotoAvatar = ({ size, border: avatarBorder, borderRadius, shadow }: { size: number; border?: string; borderRadius?: string; shadow?: string }) => (
    <div style={{
      width: size, height: size, borderRadius: borderRadius || '50%',
      border: avatarBorder || 'none',
      flexShrink: 0, overflow: 'hidden',
      boxShadow: shadow || 'none',
    }}>
      <img src={SAMPLE_AVATAR} alt="Jane Smith" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );

  // Social icons row
  const SocialIconsRow = ({ iconColor, bgColor, size = 28 }: { iconColor: string; bgColor: string; size?: number }) => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '4px 0' }}>
      {SAMPLE_DATA.socials.map(s => (
        <div key={s} style={{ width: size, height: size, borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PreviewSocialIcon platform={s} size={size * 0.5} color={iconColor} />
        </div>
      ))}
    </div>
  );

  // Link button
  const LinkBtn = ({ text, btnBg, btnBorder, textColor, borderLeft: bl, borderRadius: br, height: h }: { text: string; btnBg: string; btnBorder?: string; textColor: string; borderLeft?: string; borderRadius?: number; height?: number }) => (
    <div style={{
      width: '100%', height: h || 44, borderRadius: br ?? 10, background: btnBg,
      border: btnBorder || 'none', borderLeft: bl || undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: textColor, letterSpacing: 0.3 }}>{text}</span>
    </div>
  );

  // Contact row
  const ContactRow = ({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 0' }}>
      <span style={{ color, opacity: 0.8, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 13, color, opacity: 0.85 }}>{text}</span>
    </div>
  );

  // Action button (Call, Text, Email, Website)
  const ActionBtn = ({ icon, label, btnBg, textColor }: { icon: React.ReactNode; label: string; btnBg: string; textColor: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }}>{icon}</div>
      <span style={{ fontSize: 10, color: textColor, opacity: 0.8, fontWeight: 500 }}>{label}</span>
    </div>
  );

  // ─── BASIC ───
  if (tmpl.layout === 'basic') {
    const btnBg = isLightBg ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.12)';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 24px 28px' }}>
        <PhotoAvatar size={96} border={`3px solid ${isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)'}`} shadow="0 4px 16px rgba(0,0,0,0.12)" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: txtCol, letterSpacing: -0.3 }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 13, color: txtSec, marginTop: 4 }}>{SAMPLE_DATA.title}</div>
        </div>
        <div style={{ fontSize: 12, color: txtSec, textAlign: 'center', lineHeight: 1.5, padding: '0 12px', opacity: 0.8 }}>{SAMPLE_DATA.bio}</div>
        <SocialIconsRow iconColor="#fff" bgColor={isLightBg ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} size={34} />
        <div style={{ width: '88%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
          {SAMPLE_DATA.links.map(l => <LinkBtn key={l} text={l} btnBg={btnBg} textColor={txtCol} borderRadius={10} />)}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
          <ActionBtn icon={<PreviewPhoneIcon />} label="Call" btnBg={btnBg} textColor={txtCol} />
          <ActionBtn icon={<PreviewMsgIcon />} label="Text" btnBg={btnBg} textColor={txtCol} />
          <ActionBtn icon={<PreviewEmailIcon />} label="Email" btnBg={btnBg} textColor={txtCol} />
          <ActionBtn icon={<PreviewGlobeIcon />} label="Website" btnBg={btnBg} textColor={txtCol} />
        </div>
      </div>
    );
  }

  // ─── BLOGGER ───
  if (tmpl.layout === 'blogger') {
    const cardTxt = cs?.text || '#2d2d2d';
    const cardSec = cs?.textSecondary || '#666';
    return (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 14px' }}>
        <div style={{
          background: cardBgCol, borderRadius: 24, padding: '28px 20px 24px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <PhotoAvatar size={96} border={`3px solid ${accentCol}40`} shadow="0 4px 16px rgba(0,0,0,0.1)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: cardTxt, fontStyle: 'italic', letterSpacing: -0.3 }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 12, color: cardSec, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 500, fontSize: 10 }}>Business Coach & Entrepreneur</div>
          </div>
          <div style={{ fontSize: 12, color: cardSec, textAlign: 'center', lineHeight: 1.5, padding: '0 10px' }}>{SAMPLE_DATA.bio}</div>
          <div style={{ width: '92%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {['About', 'My Blog', 'Shop', 'Newsletter', 'Contact'].map(l => <LinkBtn key={l} text={l} btnBg={`${accentCol}15`} textColor={cardTxt} borderRadius={6} />)}
          </div>
          <SocialIconsRow iconColor="#fff" bgColor={accentCol} size={32} />
        </div>
      </div>
    );
  }

  // ─── BUSINESS CARD ───
  if (tmpl.layout === 'business-card') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark top half */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: accentCol, letterSpacing: -0.3 }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 13, color: txtSec }}>{SAMPLE_DATA.title}</div>
            <div style={{ fontSize: 12, color: txtSec, opacity: 0.6 }}>{SAMPLE_DATA.company}</div>
          </div>
          <PhotoAvatar size={80} border={`3px solid ${accentCol}`} shadow={`0 4px 20px ${accentCol}40`} />
        </div>
        {/* Accent divider */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accentCol}, ${accentCol}40)` }} />
        {/* Light bottom half */}
        <div style={{ background: cardBgCol, padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ContactRow icon={<PreviewPhoneIcon />} text={SAMPLE_DATA.phone} color={accentCol} />
          <ContactRow icon={<PreviewEmailIcon />} text={SAMPLE_DATA.email} color={accentCol} />
          <ContactRow icon={<PreviewGlobeIcon />} text={SAMPLE_DATA.website} color={accentCol} />
          <ContactRow icon={<PreviewLocationIcon />} text={SAMPLE_DATA.location} color={accentCol} />
          <div style={{ marginTop: 10 }}>
            <SocialIconsRow iconColor="#fff" bgColor={accentCol} size={32} />
          </div>
        </div>
      </div>
    );
  }

  // ─── FULL WIDTH ───
  if (tmpl.layout === 'full-width') {
    const darkBg = cs?.primary || '#000';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero photo area — full bleed with gradient overlay */}
        <div style={{ width: '100%', height: 280, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, ${darkBg}80 40%, ${darkBg} 100%)` }} />
          {/* Profile photo centered */}
          <div style={{ position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
            <PhotoAvatar size={100} border="3px solid rgba(255,255,255,0.25)" shadow="0 8px 32px rgba(0,0,0,0.4)" />
          </div>
          {/* Name overlaid at bottom */}
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 2, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: 500 }}>Marketing Manager</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
          </div>
        </div>
        {/* Content below hero */}
        <div style={{ padding: '16px 24px 28px', background: darkBg, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <ActionBtn icon={<PreviewPhoneIcon />} label="Call" btnBg="rgba(255,255,255,0.12)" textColor="#fff" />
            <ActionBtn icon={<PreviewMsgIcon />} label="Text" btnBg="rgba(255,255,255,0.12)" textColor="#fff" />
            <ActionBtn icon={<PreviewEmailIcon />} label="Email" btnBg="rgba(255,255,255,0.12)" textColor="#fff" />
            <ActionBtn icon={<PreviewGlobeIcon />} label="Website" btnBg="rgba(255,255,255,0.12)" textColor="#fff" />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, textAlign: 'center' }}>{SAMPLE_DATA.bio}</div>
          <SocialIconsRow iconColor="#fff" bgColor="rgba(255,255,255,0.12)" size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <ContactRow icon={<PreviewPhoneIcon />} text={SAMPLE_DATA.phone} color="rgba(255,255,255,0.6)" />
            <ContactRow icon={<PreviewEmailIcon />} text={SAMPLE_DATA.email} color="rgba(255,255,255,0.6)" />
            <ContactRow icon={<PreviewGlobeIcon />} text={SAMPLE_DATA.website} color="rgba(255,255,255,0.6)" />
          </div>
        </div>
      </div>
    );
  }

  // ─── PRO REALTOR ───
  if (tmpl.layout === 'pro-realtor') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{ width: '100%', height: 160, overflow: 'hidden', position: 'relative' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* Arch photo overlapping */}
        <div style={{ marginTop: -50, zIndex: 2 }}>
          <PhotoAvatar size={100} border={`4px solid ${cardBgCol}`} borderRadius="16px 16px 50% 50%" shadow="0 4px 20px rgba(0,0,0,0.15)" />
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, padding: '0 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: txtCol, letterSpacing: -0.3 }}>Hi, I&apos;m {SAMPLE_DATA.name.split(' ')[0]},</div>
          <div style={{ fontSize: 13, color: txtSec, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 500 }}>Your Local Realtor</div>
        </div>
        <div style={{ fontSize: 12, color: txtSec, textAlign: 'center', padding: '6px 24px', lineHeight: 1.5 }}>{SAMPLE_DATA.bio}</div>
        <div style={{ width: '85%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {['All About Me', 'Client Testimonials', 'Visit My Website', 'Book a Free Consultation'].map(l => (
            <LinkBtn key={l} text={l} btnBg={`${accentCol}18`} textColor={txtCol} borderLeft={`4px solid ${accentCol}`} borderRadius={8} />
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <SocialIconsRow iconColor="#fff" bgColor={accentCol} size={32} />
        </div>
        <div style={{ marginTop: 8, padding: '0 24px 8px', width: '100%' }}>
          <ContactRow icon={<PreviewPhoneIcon />} text={SAMPLE_DATA.phone} color={txtCol} />
          <ContactRow icon={<PreviewEmailIcon />} text={SAMPLE_DATA.email} color={txtCol} />
        </div>
      </div>
    );
  }

  // ─── PRO CREATIVE ───
  if (tmpl.layout === 'pro-creative') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Bold colored top */}
        <div style={{ padding: '28px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <PhotoAvatar size={90} border="none" borderRadius="50%" shadow="0 4px 20px rgba(0,0,0,0.2)" />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Creative Director</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{SAMPLE_DATA.company}</div>
        </div>
        {/* Wave divider */}
        <svg viewBox="0 0 400 50" style={{ width: '100%', height: 40, display: 'block', flexShrink: 0, marginTop: 12 }} preserveAspectRatio="none">
          <path d="M0 25 Q100 0 200 25 Q300 50 400 25 L400 50 L0 50 Z" fill={cardBgCol} />
        </svg>
        {/* White bottom */}
        <div style={{ background: cardBgCol, padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 8, lineHeight: 1.5, fontStyle: 'italic' }}>{SAMPLE_DATA.bio}</div>
          <ContactRow icon={<PreviewPhoneIcon />} text={SAMPLE_DATA.phone} color={accentCol} />
          <ContactRow icon={<PreviewEmailIcon />} text={SAMPLE_DATA.email} color={accentCol} />
          <ContactRow icon={<PreviewGlobeIcon />} text={SAMPLE_DATA.website} color={accentCol} />
          <ContactRow icon={<PreviewLocationIcon />} text={SAMPLE_DATA.location} color={accentCol} />
          <div style={{ marginTop: 10 }}>
            <SocialIconsRow iconColor="#fff" bgColor={accentCol} size={32} />
          </div>
        </div>
      </div>
    );
  }

  // ─── PRO CORPORATE ───
  if (tmpl.layout === 'pro-corporate') {
    const glassBg = isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0' }}>
        {/* Company name bar */}
        <div style={{ width: '100%', padding: '14px 24px', borderBottom: `1px solid ${isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: accentCol }}>{SAMPLE_DATA.company}</span>
        </div>
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <PhotoAvatar size={90} border={`3px solid ${isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)'}`} shadow="0 4px 16px rgba(0,0,0,0.12)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: txtCol, letterSpacing: -0.3 }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 13, color: txtSec, marginTop: 4 }}>VP of Marketing</div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            <ActionBtn icon={<PreviewPhoneIcon />} label="Call" btnBg={glassBg} textColor={txtCol} />
            <ActionBtn icon={<PreviewMsgIcon />} label="Text" btnBg={glassBg} textColor={txtCol} />
            <ActionBtn icon={<PreviewEmailIcon />} label="Email" btnBg={glassBg} textColor={txtCol} />
            <ActionBtn icon={<PreviewGlobeIcon />} label="Website" btnBg={glassBg} textColor={txtCol} />
          </div>
          <div style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: glassBg, marginTop: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: accentCol, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>About</div>
            <div style={{ fontSize: 12, color: txtSec, lineHeight: 1.5 }}>{SAMPLE_DATA.bio}</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRO CARD ───
  if (tmpl.layout === 'pro-card') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{ width: '100%', height: 130, overflow: 'hidden' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* Overlapping photo */}
        <div style={{ marginTop: -45, zIndex: 2 }}>
          <PhotoAvatar size={90} border={`4px solid ${accentCol}`} shadow={`0 4px 20px ${accentCol}30`} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, padding: '0 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: txtCol, letterSpacing: -0.3 }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 13, color: txtSec, marginTop: 4 }}>{SAMPLE_DATA.title}</div>
        </div>
        {/* Industry badge */}
        <div style={{ padding: '6px 18px', borderRadius: 16, background: `${accentCol}20`, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: accentCol, fontWeight: 600 }}>{SAMPLE_DATA.industry}</span>
        </div>
        {/* Services grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '88%', marginTop: 12 }}>
          {SAMPLE_DATA.services.map(s => (
            <div key={s} style={{ padding: '10px 8px', background: `${accentCol}12`, borderRadius: 10, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: txtCol, fontWeight: 500 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <ActionBtn icon={<PreviewPhoneIcon />} label="Call" btnBg={`${accentCol}18`} textColor={txtCol} />
          <ActionBtn icon={<PreviewMsgIcon />} label="Text" btnBg={`${accentCol}18`} textColor={txtCol} />
          <ActionBtn icon={<PreviewEmailIcon />} label="Email" btnBg={`${accentCol}18`} textColor={txtCol} />
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

  const handleSwipeStart = (x: number) => { touchStartX.current = x; isSwiping.current = true; };
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
          setFeaturedIcons(draft.featuredIcons.map((item: any) => 
            typeof item === 'string' ? { platform: item, url: '' } : item
          ));
        }
        if (Array.isArray(draft.links)) setLinks(draft.links);
        if (Array.isArray(draft.videos)) setVideos(draft.videos);
        if (draft.profileImage) setProfileImage(draft.profileImage);
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
        name, titleRole, bio, email, phone, website, address,
        templateIndex, colorIndex, photoSizeIndex,
        featuredIcons, links, videos: videos.map(v => ({ type: v.type, url: v.url })),
        profileImage,
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
        website: website || undefined, city: address || undefined,
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
          <button className="featured-icon-add" onClick={() => setShowFeaturedIconPicker(true)} style={{ borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }}>
            <IoAdd size={18} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
          </button>
        )}
      </div>
      {featuredIcons.map(fi => {
        const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
        return (
          <div key={`url-${fi.platform}`} className="featured-icon-url-row" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
            <span style={{ color: txtSecondary, flexShrink: 0, fontSize: 12 }}>{getSocialIcon(fi.platform, 14)}</span>
            <input style={{ ...cardInputStyle('left'), fontSize: 12 }} placeholder={`${platform?.name || fi.platform} URL or @username`} value={fi.url} onChange={e => updateFeaturedIconUrl(fi.platform, e.target.value)} />
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
        { icon: <IoGlobe size={16} />, placeholder: 'Website', value: website, set: setWebsite },
        { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
      ].map((field, i) => (
        <div key={i} className="contact-row" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
          <span style={{ color: txtSecondary, flexShrink: 0 }}>{field.icon}</span>
          <input style={{ ...cardInputStyle('left'), fontSize: 13 }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
        </div>
      ))}
    </div>
  );

  const renderLinksSection = () => (
    <div className="links-section">
      {links.map(link => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
        return (
          <div key={link.id} className="link-button" style={btnStyle()}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              {getSocialIcon(link.platform, 16)}
              <input style={{ ...cardInputStyle('left'), fontSize: 13, width: 'auto', flex: 1 }} placeholder={platform?.placeholder || 'Enter URL'} value={link.value} onChange={e => updateLinkValue(link.id, e.target.value)} onClick={e => e.stopPropagation()} />
            </span>
            <button className="link-action" onClick={() => removeLink(link.id)} style={{ color: '#EF4444' }}><IoTrash size={14} /></button>
          </div>
        );
      })}
      <button className="add-link-btn" onClick={() => setShowAddLink(true)} style={btnStyle()}><IoAdd size={18} /> Add Link</button>
    </div>
  );

  const renderGallerySection = () => (
    <div className="gallery-section">
      <div className="gallery-header" style={{ color: txtSecondary }}><IoImages size={16} /> Photo Gallery</div>
      <div className="gallery-grid">
        {galleryImages.map((img) => (
          <div key={img.id} className="gallery-thumb" onClick={() => setLightboxImage(img.url)}>
            <img src={img.url} alt="" />
            <button className="gallery-remove" onClick={e => { e.stopPropagation(); setGalleryImages(prev => prev.filter(g => g.id !== img.id)); }}><IoClose size={12} /></button>
          </div>
        ))}
        <button className="gallery-add" onClick={() => galleryInputRef.current?.click()} style={{ borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>
          <IoAdd size={22} color={txtSecondary} />
        </button>
      </div>
    </div>
  );

  const renderVideoSection = () => (
    <div className="video-section">
      <div className="gallery-header" style={{ color: txtSecondary }}><IoVideocam size={16} /> Videos</div>
      {videos.map((video, idx) => (
        <div key={idx} className="video-item" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
          <span style={{ color: txtSecondary, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            {video.type === 'youtube' ? <IoLogoYoutube size={16} color="#FF0000" /> : video.type === 'tavvy_short' ? <IoFilm size={16} /> : <IoPlay size={16} />}
            <span style={{ fontSize: 11, opacity: 0.7 }}>{video.type === 'youtube' ? 'YouTube' : video.type === 'tavvy_short' ? 'Tavvy Short' : 'Video URL'}</span>
          </span>
          {video.type === 'tavvy_short' && video.url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <video src={video.url} style={{ width: 60, height: 40, borderRadius: 6, objectFit: 'cover' }} />
              <span style={{ fontSize: 11, color: txtSecondary }}>15s video ready</span>
            </div>
          ) : (
            <input style={{ ...cardInputStyle('left'), fontSize: 12, flex: 1 }} placeholder={video.type === 'youtube' ? 'YouTube URL' : 'Video URL'} value={video.url} onChange={e => updateVideoUrl(idx, e.target.value)} />
          )}
          <button className="link-action" onClick={() => removeVideo(idx)} style={{ color: '#EF4444' }}><IoTrash size={14} /></button>
        </div>
      ))}
      <button className="add-link-btn" onClick={() => setShowVideoTypePicker(true)} style={btnStyle()}><IoAdd size={18} /> Add Video</button>
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
              <IoCamera size={28} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
              <span style={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)', fontSize: 12 }}>Tap to add cover photo</span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="profile-section">
        <div className="profile-photo" style={{
          width: photoSize.size, height: photoSize.size,
          borderRadius: template?.layoutConfig?.photoStyle === 'square' ? 12 : template?.layoutConfig?.photoStyle === 'arch' ? '8px 8px 50% 50%' : '50%',
          border: color?.border ? `3px solid ${color.border}` : `3px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
        }} onClick={() => fileInputRef.current?.click()}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="profile-img" />
          ) : (
            <div className="photo-placeholder" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }}>
              <IoCamera size={photoSize.size > 100 ? 28 : 22} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNameFields = () => (
    <div className="card-fields">
      <input style={{ ...cardInputStyle(), fontSize: 22, fontWeight: 700 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
      <input style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary }} placeholder="Your Title / Role" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
      <textarea style={{ ...cardInputStyle(), fontSize: 13, color: txtSecondary, resize: 'none', minHeight: 40 }} placeholder="Short bio about yourself..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
    </div>
  );

  const renderBannerUpload = () => (
    <div className="banner-upload" onClick={() => bannerInputRef.current?.click()}>
      {bannerImage ? (
        <img src={bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div className="banner-placeholder">
          <IoImage size={24} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />
          <span style={{ color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)', fontSize: 11 }}>Tap to add banner</span>
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
          {renderPhotoUpload()}
          <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
            <IoExpand size={12} /> {photoSize.label} &middot; Tap to change size
          </button>
          {renderFeaturedIcons()}
          {renderNameFields()}
          {renderContactFields()}
          {renderLinksSection()}
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
          <div style={{ background: innerBg, borderRadius: 16, margin: 16, padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: 'calc(100% - 32px)' }}>
            {renderPhotoUpload()}
            <button className="size-hint" onClick={() => setShowPhotoSizePicker(true)} style={{ color: txtSecondary }}>
              <IoExpand size={12} /> {photoSize.label}
            </button>
            {renderFeaturedIcons()}
            {renderNameFields()}
            {renderContactFields()}
            {renderLinksSection()}
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
                { icon: <IoGlobe size={16} />, placeholder: 'Website', value: website, set: setWebsite },
                { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
              ].map((field, i) => (
                <div key={i} className="contact-row" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
                  <span style={{ color: accentC, flexShrink: 0 }}>{field.icon}</span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 13 }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
                </div>
              ))}
            </div>
            {renderLinksSection()}
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
          <div className="banner-upload" onClick={() => fileInputRef.current?.click()} style={{ height: 280, position: 'relative' }}>
            {profileImage ? (
              <>
                <img src={profileImage} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
              </>
            ) : (
              <div className="banner-placeholder" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)' }}>
                <IoCamera size={32} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />
                <span style={{ color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)', fontSize: 12 }}>Tap to add hero photo</span>
              </div>
            )}
            {/* Name overlay at bottom of hero */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, zIndex: 2 }}>
              <input style={{ ...cardInputStyle('left'), fontSize: 26, fontWeight: 700, color: '#fff' }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={{ ...cardInputStyle('left'), fontSize: 14, color: 'rgba(255,255,255,0.8)' }} placeholder="Your Title" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
            </div>
          </div>
          {/* Content below hero */}
          <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {renderFeaturedIcons()}
            <textarea style={{ ...cardInputStyle(), fontSize: 13, color: txtSecondary, resize: 'none', minHeight: 40, width: '100%' }} placeholder="Short bio about yourself..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
            {renderContactFields()}
            {renderLinksSection()}
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
          <div style={{ padding: '12px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {renderNameFields()}
            {renderFeaturedIcons()}
            {renderContactFields()}
            {renderLinksSection()}
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
                { icon: <IoGlobe size={16} />, placeholder: 'Website', value: website, set: setWebsite },
                { icon: <IoLocationOutline size={16} />, placeholder: 'Address', value: address, set: setAddress },
              ].map((field, i) => (
                <div key={i} className="contact-row" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ color: color?.accent || '#f97316', flexShrink: 0 }}>{field.icon}</span>
                  <input style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', textAlign: 'left', width: '100%', fontFamily: font, padding: '4px 0', fontSize: 13 }} placeholder={field.placeholder} value={field.value} onChange={e => field.set(e.target.value)} />
                </div>
              ))}
            </div>
            {renderLinksSection()}
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
          <div className="card-fields">
            <input style={{ ...cardInputStyle(), fontSize: 22, fontWeight: 700 }} placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={{ ...cardInputStyle(), fontSize: 14, color: txtSecondary }} placeholder="Your Title / Role" value={titleRole} onChange={e => setTitleRole(e.target.value)} />
          </div>
          {renderFeaturedIcons()}
          {renderContactFields()}
          {renderLinksSection()}
          {renderGallerySection()}
          {renderVideoSection()}
        </div>
      );
    }

    // ─── PRO CARD ───
    if (templateLayout === 'pro-card') {
      return (
        <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative', padding: 0, overflow: 'hidden' }}>
          {/* Banner */}
          <div onClick={() => bannerInputRef.current?.click()} style={{ height: 120, cursor: 'pointer', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
            {bannerImage ? <img src={bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <IoImage size={24} color={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'} />
                <span style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>Add banner</span>
              </div>
            )}
          </div>
          {/* Overlapping photo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40 }}>
            <div onClick={() => fileInputRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
              border: `3px solid ${color?.accent || '#fbbf24'}`, overflow: 'hidden',
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IoCamera size={24} color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'} />}
            </div>
          </div>
          {/* Content */}
          <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {renderNameFields()}
            {renderFeaturedIcons()}
            {renderContactFields()}
            {renderLinksSection()}
            {renderGallerySection()}
            {renderVideoSection()}
          </div>
        </div>
      );
    }

    // Fallback — basic layout
    return (
      <div className="live-card" style={{ background: cardBg, fontFamily: font, position: 'relative' }}>
        {renderPhotoUpload()}
        {renderFeaturedIcons()}
        {renderNameFields()}
        {renderContactFields()}
        {renderLinksSection()}
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
            {/* Top bar */}
            <div className="gallery-top-bar">
              <button className="back-btn" onClick={() => router.back()}>
                <IoArrowBack size={22} color={isDark ? '#fff' : '#333'} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#111' }}>Choose a Style</div>
                <div style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : '#888', marginTop: 2 }}>Swipe to browse templates</div>
              </div>
              <div style={{ width: 30 }} />
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
                return (
                  <div
                    className="swiper-card"
                    style={{
                      background: isBloggerLayout ? (cs?.background || '#f8e8ee') : bg,
                      borderColor: currentTmpl.layout === 'business-card' ? (cs?.border || 'transparent') : 'transparent',
                      borderWidth: currentTmpl.layout === 'business-card' ? 1 : 0,
                      borderStyle: 'solid',
                    }}
                  >
                    <FullCardPreview tmpl={currentTmpl} />
                  </div>
                );
              })()}
            </div>

            {/* Template info + Use button */}
            <div className="swiper-info">
              <div className="tg-name-row" style={{ justifyContent: 'center' }}>
                <span className="tg-name" style={{ fontSize: 18 }}>{TEMPLATES[galleryIndex].name}</span>
                {TEMPLATES[galleryIndex].isPremium ? (
                  <span className="tg-pro-tag">PRO</span>
                ) : (
                  <span className="tg-free-tag">FREE</span>
                )}
              </div>
              <span className="tg-desc" style={{ textAlign: 'center', display: 'block', marginTop: 4 }}>{TEMPLATES[galleryIndex].description}</span>

              {/* Dot indicators */}
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
                <span className="template-count">Customize your card</span>
              </div>
              <button className="save-btn" onClick={handleSave} disabled={isCreating || !name.trim()}>
                {isCreating ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* THE CARD — template-specific layout */}
            <div className="card-container">
              {renderEditorCard()}
            </div>

            {/* Bottom toolbar - color dots */}
            <div className="bottom-bar">
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
          </>
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

        /* ===== STEP 1: SWIPEABLE TEMPLATE BROWSER ===== */
        .gallery-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          flex-shrink: 0;
        }

        .swiper-container {
          flex: 1;
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
          max-height: calc(100vh - 260px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
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

        .swiper-info {
          flex-shrink: 0;
          padding: 12px 24px 16px;
          text-align: center;
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
          color: ${txtSecondary};
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

        /* Banner upload */
        .banner-upload {
          width: 100%;
          height: 160px;
          cursor: pointer;
          overflow: hidden;
          position: relative;
        }

        .banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
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
          color: ${isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'};
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
          color: ${isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'};
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
          color: ${isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'};
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
