/**
 * PlatformPicker — grid of social/link platform icons for adding links or featured socials.
 */

import React from 'react';
import {
  IoLogoInstagram, IoLogoTiktok, IoLogoYoutube, IoLogoTwitter,
  IoLogoLinkedin, IoLogoFacebook, IoLogoWhatsapp, IoLogoSnapchat,
  IoLogoGithub, IoLogoDiscord, IoLogoPinterest, IoLogoTwitch,
  IoMusicalNotes, IoPaperPlane, IoMail, IoGlobe, IoCall, IoLink,
} from 'react-icons/io5';
import { PLATFORM_ICONS } from '../../../../lib/ecard';

export interface PlatformOption {
  id: string;
  name: string;
  placeholder?: string;
}

export const SOCIAL_PLATFORMS: PlatformOption[] = [
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

export const FEATURED_PLATFORMS: PlatformOption[] = [
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

const PLATFORM_REACT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  instagram: IoLogoInstagram,
  tiktok: IoLogoTiktok,
  youtube: IoLogoYoutube,
  twitter: IoLogoTwitter,
  linkedin: IoLogoLinkedin,
  facebook: IoLogoFacebook,
  snapchat: IoLogoSnapchat,
  whatsapp: IoLogoWhatsapp,
  github: IoLogoGithub,
  discord: IoLogoDiscord,
  pinterest: IoLogoPinterest,
  twitch: IoLogoTwitch,
  spotify: IoMusicalNotes,
  telegram: IoPaperPlane,
  email: IoMail,
  website: IoGlobe,
  phone: IoCall,
  other: IoLink,
};

export function getPlatformIcon(platformId: string, size = 18, color?: string): React.ReactNode {
  const Icon = PLATFORM_REACT_ICONS[platformId] || PLATFORM_REACT_ICONS.other;
  const iconInfo = PLATFORM_ICONS[platformId];
  return <Icon size={size} color={color || iconInfo?.bgColor || '#8E8E93'} />;
}

interface PlatformPickerProps {
  platforms: PlatformOption[];
  onSelect: (platformId: string) => void;
  excludeIds?: string[];
  isDark?: boolean;
}

export default function PlatformPicker({
  platforms,
  onSelect,
  excludeIds = [],
  isDark = false,
}: PlatformPickerProps) {
  const filtered = platforms.filter(p => !excludeIds.includes(p.id));
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
    }}>
      {filtered.map((platform) => {
        const iconInfo = PLATFORM_ICONS[platform.id];
        return (
          <button
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '12px 4px',
              borderRadius: 12,
              border: `1px solid ${border}`,
              background: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: iconInfo?.bgColor || '#8E8E93',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {getPlatformIcon(platform.id, 18, '#fff')}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              color: isDark ? '#94A3B8' : '#6B7280',
              textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {platform.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
