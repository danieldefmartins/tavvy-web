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

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getTemplateByIdWithMigration, resolveTemplateId, TemplateLayout } from '../config/eCardTemplates';
import CivicCardSection from '../components/CivicCardSection';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface CardLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  clicks: number;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBlockData {
  formType: 'native' | 'gohighlevel' | 'typeform' | 'jotform' | 'googleforms' | 'calendly' | 'webhook';
  title: string;
  description?: string;
  buttonText: string;
  fields?: FormField[];
  successMessage?: string;
  ghlFormId?: string;
  ghlLocationId?: string;
  ghlWebhookUrl?: string;
  ghlEmbedCode?: string;
  embedUrl?: string;
  embedCode?: string;
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
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
  websiteLabel: string;
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
  profilePhotoSize: 'small' | 'medium' | 'large' | 'xlarge';
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
  // Featured socials (array of platform IDs or objects with platform+url)
  featuredSocials: (string | { platform: string; url: string })[];
  // YouTube video block
  youtubeVideoId: string;
  youtubeTitle: string;
  // Gallery block
  galleryImages: { id: string; url: string; uri?: string; caption?: string }[];
  galleryTitle: string;
  // Testimonials block
  testimonials: { id: string; customerName: string; reviewText: string; rating: number; customerPhoto?: string; date?: string; source?: string }[];
  testimonialsTitle: string;
  // Form block
  formBlock: FormBlockData | null;
  // Appearance settings
  theme: string;
  backgroundType: string;
  backgroundImageUrl: string | null;
  buttonStyle: string;
  fontStyle: string;
  links: CardLink[];
  // Videos (Tavvy Shorts, external URLs)
  videos: { type: string; url: string }[];
  tapCount: number;
  showContactInfo: boolean;
  showSocialIcons: boolean;
  fontColor: string | null;
  bannerImageUrl: string | null;
  // Professional category & endorsements
  professionalCategory: string;
  endorsementCount: number;
  topEndorsementTags: { label: string; emoji: string; count: number }[];
  recentEndorsements: { endorserName: string; note: string; createdAt: string }[];
  endorsementSignals: { id: string; label: string; emoji: string; category: string }[];
  // External review URLs
  reviewGoogleUrl: string;
  reviewYelpUrl: string;
  reviewTripadvisorUrl: string;
  reviewFacebookUrl: string;
  reviewBbbUrl: string;
  // Civic Card fields (political santinho)
  ballotNumber: string;
  partyName: string;
  officeRunningFor: string;
  electionYear: string;
  campaignSlogan: string;
  region: string;
  civicProposals: { id: string; title: string; description: string; sortOrder: number; reactions: { support: number; needs_improvement: number; disagree: number } }[];
  civicQuestions: { id: string; questionText: string; upvoteCount: number; answerText: string | null; answeredAt: string | null; createdAt: string }[];
  civicCommitments: { id: string; title: string; description: string; status: 'planned' | 'in_progress' | 'completed'; sortOrder: number }[];
  showVoteCounts: boolean;
  companyLogoUrl: string | null;
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

// Default form fields
const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
  { id: '3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: false },
  { id: '4', type: 'textarea', label: 'Message', placeholder: 'How can I help you?', required: false },
];

const SIGNAL_KEY_MAP: Record<string, string> = {
  'Highly Recommended': 'signalHighlyRecommended', 'Trustworthy': 'signalTrustworthy', 'Responsive': 'signalResponsive', 'Expert': 'signalExpert', 'Reliable': 'signalReliable', 'Great Communicator': 'signalGreatCommunicator', 'Goes Above & Beyond': 'signalGoesAboveBeyond', 'On Time': 'signalOnTime',
  'Transparent': 'signalTransparent', 'Keeps Promises': 'signalKeepsPromises', 'Community Leader': 'signalCommunityLeader', 'Clear Communicator': 'signalClearCommunicator', 'Fair & Just': 'signalFairJust', 'Gets Things Done': 'signalGetsThingsDone', 'Innovative Ideas': 'signalInnovativeIdeas', 'Fights for People': 'signalFightsForPeople',
  'Great Closer': 'signalGreatCloser', 'Knowledgeable': 'signalKnowledgeable', 'Follows Through': 'signalFollowsThrough', 'Data-Driven': 'signalDataDriven', 'Persistent': 'signalPersistent',
  'Market Expert': 'signalMarketExpert', 'Great Negotiator': 'signalGreatNegotiator', 'Always Available': 'signalAlwaysAvailable', 'Creative Solutions': 'signalCreativeSolutions', 'Detail Oriented': 'signalDetailOriented', 'Got Best Price': 'signalGotBestPrice',
  'Great Food': 'signalGreatFood', 'Fast Service': 'signalFastService', 'Friendly Staff': 'signalFriendlyStaff', 'Clean': 'signalClean', 'Good Value': 'signalGoodValue', 'Great Presentation': 'signalGreatPresentation',
  'Thorough': 'signalThorough', 'Puts You at Ease': 'signalPutsYouAtEase', 'Great Results': 'signalGreatResults', 'Clear Explanations': 'signalClearExplanations',
  'Skilled': 'signalSkilled', 'Creative': 'signalCreative', 'Listens Well': 'signalListensWell', 'Punctual': 'signalPunctual', 'Attention to Detail': 'signalAttentionToDetail',
  'Quality Work': 'signalQualityWork', 'Fair Pricing': 'signalFairPricing', 'Left It Clean': 'signalLeftItClean', 'On Schedule': 'signalOnSchedule', 'Stands Behind Work': 'signalStandsBehindWork',
  'Fair & Honest': 'signalFairHonest', 'Strategic': 'signalStrategic', 'Clear Advice': 'signalClearAdvice', 'Confidential': 'signalConfidential',
  'Creative Vision': 'signalCreativeVision', 'Great Eye': 'signalGreatEye', 'Delivers Results': 'signalDeliversResults', 'Innovative': 'signalInnovative', 'Understands Brand': 'signalUnderstandsBrand',
  'Inspiring': 'signalInspiring', 'Goal-Oriented': 'signalGoalOriented', 'Patient': 'signalPatient', 'Tracks Progress': 'signalTracksProgress',
  'Problem Solver': 'signalProblemSolver', 'Fast Turnaround': 'signalFastTurnaround', 'Security-Minded': 'signalSecurityMinded', 'Up to Date': 'signalUpToDate', 'Smart Solutions': 'signalSmartSolutions',
  'Honest Diagnosis': 'signalHonestDiagnosis', 'Quick Service': 'signalQuickService', 'Warranty Backed': 'signalWarrantyBacked', 'Quality Parts': 'signalQualityParts',
  'Great Energy': 'signalGreatEnergy', 'Well Organized': 'signalWellOrganized', 'Perfect Vibe': 'signalPerfectVibe', 'Memorable': 'signalMemorable', 'Creative Ideas': 'signalCreativeIdeas',
  'Loves Animals': 'signalLovesAnimals', 'Gentle': 'signalGentle', 'Clean Facility': 'signalCleanFacility', 'Friendly': 'signalFriendly',
};

export default function PublicCardPage({ cardData: initialCardData, error: initialError }: PageProps) {
  const { t } = useTranslation();
  const [cardData, setCardData] = useState<CardData | null>(initialCardData);
  const [error] = useState<string | null>(initialError);
  const [showMore, setShowMore] = useState(false);
  const [hasTapped, setHasTapped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showFormEmbed, setShowFormEmbed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Endorsement state
  const [showEndorsementPopup, setShowEndorsementPopup] = useState(false);
  const [showEndorseFlow, setShowEndorseFlow] = useState(false);
  // signalTaps: { signalId: intensity (0=not selected, 1=selected, 2=strong, 3=strongest) }
  const [signalTaps, setSignalTaps] = useState<Record<string, number>>({});
  const [endorseNote, setEndorseNote] = useState('');
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);
  const [endorsementSubmitted, setEndorsementSubmitted] = useState(false);

  // Auto-submit pending endorsement after login redirect
  useEffect(() => {
    const pending = typeof window !== 'undefined' ? localStorage.getItem('tavvy_pending_endorsement') : null;
    if (!pending || !cardData) return;
    try {
      const data = JSON.parse(pending);
      // Only auto-submit if this is the same card the endorsement was for
      if (data.cardId !== cardData.id) return;
      // Wait for Supabase auth to initialize, then submit with the session token
      const submitPending = async () => {
        // Give Supabase auth time to restore the session from localStorage
        // The login page redirects here, but the auth state listener needs a moment
        let accessToken: string | undefined;
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.access_token) {
            accessToken = currentSession.access_token;
            break;
          }
          // Wait 500ms before retrying (total max wait: 5 seconds)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!accessToken) {
          // Still no session after waiting — user may not have completed login
          return;
        }
        setIsSubmittingEndorsement(true);
        try {
          const res = await fetch('/api/ecard/endorse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ cardId: data.cardId, signals: data.signals, intensities: data.intensities, note: data.note }),
          });
          if (res.ok) {
            localStorage.removeItem('tavvy_pending_endorsement');
            const resData = await res.json();
            // Update the displayed count and tags immediately
            setCardData(prev => prev ? {
              ...prev,
              endorsementCount: resData.endorsementCount ?? (prev.endorsementCount + (data.signals?.length || 1)),
              tapCount: (prev.tapCount || 0) + (data.signals?.length || 1),
              topEndorsementTags: resData.topEndorsementTags ?? prev.topEndorsementTags,
            } : prev);
            setEndorsementSubmitted(true);
            setShowEndorsementPopup(true);
          } else {
            const resData = await res.json();
            if (!resData?.requireLogin) {
              // Auth succeeded but endorsement failed for another reason — clear pending
              localStorage.removeItem('tavvy_pending_endorsement');
            }
          }
        } catch (err) {
          // Network error — keep pending for retry
        } finally {
          setIsSubmittingEndorsement(false);
        }
      };
      submitPending();
    } catch (e) {
      localStorage.removeItem('tavvy_pending_endorsement');
    }
  }, [cardData?.id]);

  // Badge contrast: sample actual pixels behind the badge (top-right of card/photo)
  const [badgeOnLightBg, setBadgeOnLightBg] = useState<boolean | null>(null);
  useEffect(() => {
    // Determine what's behind the badge at position top:20px, right:20px
    // Priority: banner image > profile photo (if cover/large) > gradient colors
    const imageUrl = cardData.bannerImageUrl || 
      (['large', 'xlarge'].includes(cardData.profilePhotoSize) ? cardData.profilePhotoUrl : null);
    
    if (imageUrl) {
      // Sample the top-right region of the image to detect brightness
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) { fallbackToGradient(); return; }
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          // Sample a region in the top-right corner (where the badge sits)
          const sampleW = Math.max(1, Math.floor(img.naturalWidth * 0.2));
          const sampleH = Math.max(1, Math.floor(img.naturalHeight * 0.15));
          const startX = img.naturalWidth - sampleW;
          const startY = 0;
          const imageData = ctx.getImageData(startX, startY, sampleW, sampleH);
          const pixels = imageData.data;
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          // Sample every 4th pixel for performance
          for (let i = 0; i < pixels.length; i += 16) {
            totalR += pixels[i];
            totalG += pixels[i + 1];
            totalB += pixels[i + 2];
            count++;
          }
          if (count > 0) {
            const avgR = totalR / count / 255;
            const avgG = totalG / count / 255;
            const avgB = totalB / count / 255;
            const toL = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            const luminance = 0.2126 * toL(avgR) + 0.7152 * toL(avgG) + 0.0722 * toL(avgB);
            setBadgeOnLightBg(luminance > 0.3);
          } else {
            fallbackToGradient();
          }
        } catch (e) {
          // CORS or canvas error — fall back to gradient check
          fallbackToGradient();
        }
      };
      img.onerror = () => fallbackToGradient();
      img.src = imageUrl;
    } else {
      fallbackToGradient();
    }

    function fallbackToGradient() {
      // No image behind badge — use gradient color luminance
      const hexToLum = (hex: string): number => {
        const c = hex.replace('#', '');
        if (c.length !== 6) return 0;
        const r = parseInt(c.substring(0, 2), 16) / 255;
        const g = parseInt(c.substring(2, 4), 16) / 255;
        const b = parseInt(c.substring(4, 6), 16) / 255;
        const toL = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
      };
      const avgLum = (hexToLum(cardData.gradientColor1) + hexToLum(cardData.gradientColor2)) / 2;
      setBadgeOnLightBg(avgLum > 0.35);
    }
  }, [cardData.profilePhotoUrl, cardData.bannerImageUrl, cardData.gradientColor1, cardData.gradientColor2]);

  // Resolved badge contrast — badgeOnLightBg is set by useEffect after image loads.
  // Default to false (dark bg / white text) until detection completes.
  // bgIsActuallyLight is defined later in the component, so we can't reference it here.

  const handleSignalTap = (signalId: string) => {
    setSignalTaps(prev => {
      const current = prev[signalId] || 0;
      if (current >= 3) {
        // Deselect on 4th tap
        const next = { ...prev };
        delete next[signalId];
        return next;
      }
      return { ...prev, [signalId]: current + 1 };
    });
  };

  const selectedSignalCount = Object.keys(signalTaps).length;
  const fireEmojis = (intensity: number) => '🔥'.repeat(Math.max(0, intensity - 1));

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

  const handleAppleWallet = () => {
    if (!cardData) return;
    fetch('/api/ecard/wallet/apple-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: cardData.slug }),
    }).then(res => {
      if (res.status === 503 || !res.ok) {
        window.open(`/api/ecard/wallet/vcard?slug=${cardData.slug}`, '_blank');
        return;
      }
      return res.blob();
    }).then(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${cardData.slug}.pkpass`; a.click();
        URL.revokeObjectURL(url);
      }
    }).catch(() => {
      window.open(`/api/ecard/wallet/vcard?slug=${cardData.slug}`, '_blank');
    });
  };

  const handleGoogleWallet = () => {
    if (!cardData) return;
    fetch('/api/ecard/wallet/google-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: cardData.slug }),
    }).then(res => {
      if (res.status === 503 || !res.ok) {
        window.open(`/api/ecard/wallet/vcard?slug=${cardData.slug}`, '_blank');
        return res.json().catch(() => null);
      }
      return res.json();
    }).then(data => {
      if (data?.saveUrl) window.open(data.saveUrl, '_blank');
    }).catch(() => {
      window.open(`/api/ecard/wallet/vcard?slug=${cardData.slug}`, '_blank');
    });
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

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardData?.formBlock) return;

    const fields = cardData.formBlock.fields || DEFAULT_FORM_FIELDS;
    
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !formData[f.id])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmittingForm(true);

    try {
      // Prepare form data with field labels
      const submitData: Record<string, any> = {};
      fields.forEach(field => {
        submitData[field.label.toLowerCase().replace(/\s+/g, '_')] = formData[field.id] || '';
      });
      submitData.source = 'tavvy_card';
      submitData.cardSlug = cardData.slug;
      submitData.cardOwnerName = cardData.fullName;
      submitData.submittedAt = new Date().toISOString();

      // Determine where to send
      let webhookUrl = cardData.formBlock.webhookUrl;
      if (cardData.formBlock.formType === 'gohighlevel' && cardData.formBlock.ghlWebhookUrl) {
        webhookUrl = cardData.formBlock.ghlWebhookUrl;
      }

      if (webhookUrl) {
        const method = cardData.formBlock.webhookMethod || 'POST';
        
        if (method === 'POST') {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitData),
            mode: 'no-cors', // Allow cross-origin requests
          });
        } else {
          const params = new URLSearchParams(submitData as any).toString();
          await fetch(`${webhookUrl}?${params}`, { mode: 'no-cors' });
        }
      }

      // Also save to Supabase for tracking
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('form_submissions')
            .insert({
              card_id: cardData.id,
              form_data: submitData,
              submitted_at: new Date().toISOString(),
            });
        }
      } catch (dbErr) {
        console.error('Error saving form submission:', dbErr);
      }

      setFormSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      // Still show success since we used no-cors mode
      setFormSubmitted(true);
    } finally {
      setIsSubmittingForm(false);
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
  const fullAddress = [cardData.address1, cardData.address2, cardData.city, cardData.state, cardData.zipCode].filter(Boolean).join(', ');
  const hasSocialLinks = cardData.socialInstagram || cardData.socialFacebook || cardData.socialLinkedin || cardData.socialTwitter || cardData.socialTiktok || cardData.socialYoutube || cardData.socialSnapchat || cardData.socialPinterest || cardData.socialWhatsapp;
  const hasReviewLinks = cardData.reviewGoogleUrl || cardData.reviewYelpUrl || cardData.reviewTripadvisorUrl || cardData.reviewFacebookUrl || cardData.reviewBbbUrl;
  const hasLinks = cardData.links && cardData.links.length > 0;

  // Resolve template to new layout system
  const resolvedTemplateId = resolveTemplateId(cardData.templateId || 'classic');
  const templateConfig = getTemplateByIdWithMigration(cardData.templateId || 'classic');
  const templateLayout: TemplateLayout = templateConfig?.layout || 'basic';

  // Get color scheme from template config
  const activeColorScheme = templateConfig?.colorSchemes.find(cs => cs.id === (cardData as any).colorSchemeId) || templateConfig?.colorSchemes[0];
  // Robust luminance check — works for hex, gradients, and rgba
  const hexToLuminance = (hex: string): number => {
    const c = hex.replace('#', '');
    if (c.length !== 6) return 0;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const isLightBg = (hex: string) => {
    // For gradients, extract hex colors and average their luminance
    if (hex.includes('gradient') || hex.includes('linear') || hex.includes('radial')) {
      const hexMatches = hex.match(/#[0-9a-fA-F]{6}/g);
      if (hexMatches && hexMatches.length > 0) {
        const avgLum = hexMatches.reduce((sum, h) => sum + hexToLuminance(h), 0) / hexMatches.length;
        return avgLum > 0.4;
      }
      return false;
    }
    return hexToLuminance(hex) > 0.4;
  };

  // Compute whether the actual rendered background is light
  const bgString = activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`;
  const bgIsActuallyLight = isLightBg(bgString) || (
    hexToLuminance(cardData.gradientColor1) > 0.4 && hexToLuminance(cardData.gradientColor2) > 0.4
  );

  // Get template-specific styles based on resolved template
  const getTemplateStyles = () => {
    const cs = activeColorScheme;

    // Basic Tavvy eCard — Linktree-style
    if (templateLayout === 'basic') {
      const bgIsLight = isLightBg(cs?.background || cardData.gradientColor1);
      return {
        isLuxury: false,
        isDark: !bgIsLight,
        hasOrnate: false,
        accentColor: cs?.accent || cardData.gradientColor1,
        textColor: cs?.text || (bgIsLight ? '#2d3436' : '#FFFFFF'),
        buttonBg: bgIsLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
        buttonBorder: bgIsLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
        photoStyle: 'circle',
      };
    }

    // Blogger eCard — Soft/creative
    if (templateLayout === 'blogger') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.accent || '#d4a0a0',
        textColor: cs?.text || '#2d2d2d',
        buttonBg: cs?.accent ? `${cs.accent}20` : 'rgba(0,0,0,0.04)',
        buttonBorder: cs?.accent ? `${cs.accent}40` : 'rgba(0,0,0,0.08)',
        photoStyle: 'cutout',
        hasWhiteCard: true,
      };
    }

    // Business Card — Corporate split layout
    if (templateLayout === 'business-card') {
      return {
        isLuxury: true,
        isDark: true,
        hasOrnate: true,
        accentColor: cs?.accent || '#d4af37',
        textColor: cs?.text || '#d4af37',
        buttonBg: cs?.accent ? `${cs.accent}15` : 'rgba(212,175,55,0.08)',
        buttonBorder: cs?.accent ? `${cs.accent}40` : 'rgba(212,175,55,0.25)',
        photoStyle: 'ornate',
        hasSplitLayout: true,
      };
    }

    // Full Width Premium — Hero photo with gradient overlay
    if (templateLayout === 'full-width') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: cs?.accent || '#FFFFFF',
        textColor: '#FFFFFF',
        buttonBg: 'rgba(255,255,255,0.15)',
        buttonBorder: 'rgba(255,255,255,0.2)',
        photoStyle: 'cover',
      };
    }

    // Premium Static — Same as full-width but photo scrolls with content
    if (templateLayout === 'premium-static') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: cs?.accent || '#FFFFFF',
        textColor: '#FFFFFF',
        buttonBg: 'rgba(255,255,255,0.15)',
        buttonBorder: 'rgba(255,255,255,0.2)',
        photoStyle: 'cover',
      };
    }

    // Pro Realtor — Arch photo, intro text
    if (templateLayout === 'pro-realtor') {
      const bgIsLight = isLightBg(cs?.background || '#f5f0eb');
      return {
        isLuxury: false,
        isDark: !bgIsLight,
        hasOrnate: false,
        accentColor: cs?.accent || '#c8a87c',
        textColor: cs?.text || '#2d2d2d',
        buttonBg: cs?.accent ? `${cs.accent}30` : 'rgba(200,168,124,0.2)',
        buttonBorder: cs?.accent ? `${cs.accent}60` : 'rgba(200,168,124,0.4)',
        photoStyle: 'arch',
        hasBannerImage: true,
      };
    }

    // Pro Creative — Bold colored top, wave divider
    if (templateLayout === 'pro-creative') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: cs?.accent || '#f97316',
        textColor: '#FFFFFF',
        buttonBg: cs?.accent ? `${cs.accent}25` : 'rgba(249,115,22,0.15)',
        buttonBorder: cs?.accent ? `${cs.accent}50` : 'rgba(249,115,22,0.3)',
        photoStyle: 'rounded',
        hasWaveDivider: true,
      };
    }

    // Pro Corporate — Company logo, structured layout
    if (templateLayout === 'pro-corporate') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: cs?.accent || '#FFFFFF',
        textColor: '#FFFFFF',
        buttonBg: 'rgba(255,255,255,0.1)',
        buttonBorder: 'rgba(255,255,255,0.2)',
        photoStyle: 'circle',
      };
    }

    // Pro Card — Banner + industry + services
    if (templateLayout === 'pro-card') {
      return {
        isLuxury: false,
        isDark: true,
        hasOrnate: false,
        accentColor: cs?.accent || '#fbbf24',
        textColor: '#FFFFFF',
        buttonBg: cs?.accent ? `${cs.accent}20` : 'rgba(251,191,36,0.12)',
        buttonBorder: cs?.accent ? `${cs.accent}50` : 'rgba(251,191,36,0.3)',
        photoStyle: 'circle',
        hasBannerImage: true,
        hasIndustrySection: true,
        hasServicesGrid: true,
        hasServiceArea: true,
      };
    }

    // Biz Traditional — Classic centered business card
    if (templateLayout === 'biz-traditional') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.accent || '#c9a84c',
        textColor: '#1a1a2e',
        buttonBg: '#f8f9fa',
        buttonBorder: '#e8e8e8',
        photoStyle: 'circle',
      };
    }

    // Biz Modern — Split layout modern business card
    if (templateLayout === 'biz-modern') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.accent || '#3b82f6',
        textColor: '#1a1a2e',
        buttonBg: '#f8f9fa',
        buttonBorder: '#e8e8e8',
        photoStyle: 'circle',
      };
    }

    // Biz Minimalist — Ultra-clean minimal business card
    if (templateLayout === 'biz-minimalist') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.accent || '#111111',
        textColor: cs?.text || '#111111',
        buttonBg: '#f8f9fa',
        buttonBorder: '#e8e8e8',
        photoStyle: 'rounded',
      };
    }

    // Cover Card — Cover photo top, white bottom with contact rows
    if (templateLayout === 'cover-card') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.accent || '#f97316',
        textColor: '#1a1a2e',
        buttonBg: '#f8f9fa',
        buttonBorder: '#e8e8e8',
        photoStyle: 'cover',
      };
    }

    // Civic Card — Brazilian Political Santinho
    if (templateLayout === 'civic-card') {
      return {
        isLuxury: false,
        isDark: false,
        hasOrnate: false,
        accentColor: cs?.primary || '#CC0000',
        textColor: '#1a1a2e',
        buttonBg: cs?.primary ? `${cs.primary}15` : 'rgba(204,0,0,0.08)',
        buttonBorder: cs?.primary ? `${cs.primary}40` : 'rgba(204,0,0,0.25)',
        photoStyle: 'rounded',
      };
    }
    // Default fallback
    return {
      isLuxury: false,
      isDark: false,
      hasOrnate: false,
      accentColor: 'rgba(255,255,255,0.2)',
      textColor: '#FFFFFF',
      buttonBg: 'rgba(255,255,255,0.12)',
      buttonBorder: 'rgba(255,255,255,0.15)',
      photoStyle: 'circle',
    };
  };

  const rawTemplateStyles = getTemplateStyles();

  // Auto-contrast: compute best text color based on ACTUAL background luminance
  const getAutoContrastColor = (): string => {
    const lum1 = hexToLuminance(cardData.gradientColor1.startsWith('#') ? cardData.gradientColor1 : '#667eea');
    const lum2 = hexToLuminance(cardData.gradientColor2.startsWith('#') ? cardData.gradientColor2 : '#764ba2');
    const avgLum = (lum1 + lum2) / 2;
    return avgLum > 0.4 ? '#1f2937' : '#FFFFFF';
  };

  // Validate that a text color has sufficient contrast against the background
  const ensureContrast = (textColor: string): string => {
    if (!textColor || textColor === 'transparent') return getAutoContrastColor();
    // If text color is light and background is also light → force dark text
    const textLum = hexToLuminance(textColor.startsWith('#') && textColor.length === 7 ? textColor : '#FFFFFF');
    if (bgIsActuallyLight && textLum > 0.4) {
      return '#1f2937'; // Force dark text on light bg
    }
    // If text color is dark and background is also dark → force light text
    if (!bgIsActuallyLight && textLum < 0.15) {
      return '#FFFFFF'; // Force light text on dark bg
    }
    return textColor;
  };

  // Apply user font color override, or auto-contrast with validation
  const autoTextColor = cardData.fontColor
    ? cardData.fontColor
    : ensureContrast(rawTemplateStyles.textColor);

  // Also fix button colors for light backgrounds
  const autoButtonBg = bgIsActuallyLight
    ? 'rgba(0,0,0,0.06)'
    : rawTemplateStyles.buttonBg;
  const autoButtonBorder = bgIsActuallyLight
    ? 'rgba(0,0,0,0.1)'
    : rawTemplateStyles.buttonBorder;

  const templateStyles = {
    ...rawTemplateStyles,
    textColor: autoTextColor,
    buttonBg: (rawTemplateStyles.buttonBg && !rawTemplateStyles.buttonBg.includes('255,255,255')) ? rawTemplateStyles.buttonBg : autoButtonBg,
    buttonBorder: (rawTemplateStyles.buttonBorder && !rawTemplateStyles.buttonBorder.includes('255,255,255')) ? rawTemplateStyles.buttonBorder : autoButtonBorder,
    isDark: !bgIsActuallyLight,
  };

  // Compute the best icon color for social buttons:
  // If the button background is light (e.g. #f8f9fa, rgba with low alpha on white), icons should be dark.
  // If the button background is dark, icons should be light.
  const getSocialIconColor = (): string => {
    const btnBg = templateStyles.buttonBg;
    // For templates with white card sections, the social buttons sit on a light background
    const isOnLightSection = templateLayout === 'pro-card' || templateLayout === 'cover-card' || 
      templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || 
      templateLayout === 'biz-minimalist' || templateLayout === 'pro-realtor' || 
      templateLayout === 'blogger' || templateLayout === 'civic-card';
    if (isOnLightSection) return '#333333';
    // For templates with dark gradient backgrounds
    if (bgIsActuallyLight) return '#333333';
    return templateStyles.textColor;
  };
  const socialIconColor = getSocialIconColor();

  // Get button style based on cardData.buttonStyle
  const getButtonStyleOverrides = () => {
    const buttonStyle = cardData.buttonStyle || 'fill';
    switch (buttonStyle) {
      case 'outline':
        return {
          background: 'transparent',
          border: `2px solid ${templateStyles.textColor || 'rgba(255,255,255,0.5)'}`,
        };
      case 'rounded':
        return {
          borderRadius: '50px',
        };
      case 'shadow':
        return {
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        };
      default: // 'fill'
        return {};
    }
  };

  const buttonStyleOverrides = getButtonStyleOverrides();

  // Get font style based on cardData.fontStyle
  const getFontStyleOverrides = () => {
    const fontStyle = cardData.fontStyle || 'default';
    switch (fontStyle) {
      case 'modern':
        return { fontWeight: '300', letterSpacing: '0.5px' };
      case 'classic':
        return { fontStyle: 'italic' };
      case 'bold':
        return { fontWeight: '900', letterSpacing: '-0.5px' };
      default:
        return {};
    }
  };

  const fontStyleOverrides = getFontStyleOverrides();

  // Determine if the footer area has a light background (for logo color switching)
  // pro-card always has a white bottom section, so footer is always on light bg
  const isLightFooterBg = (templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || templateLayout === 'civic-card') ? true : bgIsActuallyLight;

  return (
    <>
      <Head>
        <title>{cardData.fullName} | Digital Card | Tavvy</title>
        <meta name="description" content={[
          cardData.fullName,
          cardData.title,
          cardData.company ? `at ${cardData.company}` : '',
          cardData.phone ? `\u260E ${cardData.phone}` : '',
          cardData.email ? `\u2709 ${cardData.email}` : '',
        ].filter(Boolean).join(' · ')} key="description" />
        <meta property="og:site_name" content="Tavvy" />
        <meta property="og:title" content={`${cardData.fullName}${cardData.title ? ` — ${cardData.title}` : ''}`} key="og:title" />
        <meta property="og:description" content={[
          cardData.company || '',
          cardData.phone || '',
          cardData.email || '',
          cardData.city || '',
        ].filter(Boolean).join(' · ') || 'Digital Business Card on Tavvy'} key="og:description" />
        <meta property="og:type" content="profile" key="og:type" />
        <meta property="og:url" content={`https://tavvy.com/${cardData.slug}`} key="og:url" />
        <meta property="og:image" content={`https://tavvy.com/api/og/${cardData.slug}`} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta property="og:image:alt" content={`${cardData.fullName}'s digital business card on Tavvy`} />
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:title" content={`${cardData.fullName}${cardData.title ? ` — ${cardData.title}` : ''}`} key="twitter:title" />
        <meta name="twitter:description" content={[
          cardData.company || '',
          cardData.city || '',
          cardData.description || '',
        ].filter(Boolean).join(' · ') || 'Digital Business Card on Tavvy'} key="twitter:description" />
        <meta name="twitter:image" content={`https://tavvy.com/api/og/${cardData.slug}`} key="twitter:image" />
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
            opacity: 0.8;
          }
          .link-btn:hover {
            transform: translateX(4px);
            opacity: 0.85;
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
        {/* Background - supports solid, gradient, image, and template layouts */}
        <div 
          style={{
            ...styles.backgroundGradient,
            ...((templateLayout === 'full-width') && (cardData.bannerImageUrl || cardData.profilePhotoUrl)
              ? {
                  backgroundImage: `url(${cardData.bannerImageUrl || cardData.profilePhotoUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : templateLayout === 'premium-static'
                ? { background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 50%, #0a0f1e 100%)` }
              : templateLayout === 'blogger'
                ? { background: activeColorScheme?.background || cardData.gradientColor1 }
                : templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || templateLayout === 'civic-card'
                  ? { background: activeColorScheme?.background || '#f0f2f5' }
                : cardData.backgroundType === 'solid' 
                  ? { background: cardData.gradientColor1 }
                  : cardData.backgroundType === 'image' && cardData.backgroundImageUrl
                    ? { 
                        backgroundImage: `url(${cardData.backgroundImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 50%, #0a0f1e 100%)` }
            ),
          }}
        />

        {/* Full Width template gradient overlay */}
        {templateLayout === 'full-width' && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            background: `linear-gradient(to bottom, transparent 0%, transparent 30%, ${cardData.gradientColor1}cc 60%, ${cardData.gradientColor2} 100%)`,
          }} />
        )}

        {/* Premium Static — Inline hero photo that scrolls with content */}
        {templateLayout === 'premium-static' && (
          <div style={{
            position: 'relative', width: '100%', maxWidth: '100%', zIndex: 1,
          }}>
            {(cardData.bannerImageUrl || cardData.profilePhotoUrl) ? (
              <img
                src={cardData.bannerImageUrl || cardData.profilePhotoUrl}
                alt={cardData.fullName}
                style={{
                  width: '100%', height: '60vh', objectFit: 'cover', objectPosition: 'center top', display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 50%, #0a0f1e 100%)`,
              }}>
                {/* Decorative pattern for no-photo fallback */}
                <div style={{ textAlign: 'center' as const, padding: '40px' }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
                    border: `3px dashed ${activeColorScheme?.accent || '#d4af37'}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: 48, fontWeight: '700', color: activeColorScheme?.accent || '#d4af37', opacity: 0.6 }}>
                      {cardData.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' as const }}>Add a photo to personalize</p>
                </div>
              </div>
            )}
            {/* Gradient overlay on the photo */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: `linear-gradient(to bottom, transparent 0%, ${cardData.gradientColor1}cc 60%, ${cardData.gradientColor2} 100%)`,
            }} />
          </div>
        )}

        {/* Main Card Container */}
        <div style={{
          ...styles.cardContainer,
          ...(templateLayout === 'blogger' ? {
            maxWidth: '400px',
            background: activeColorScheme?.cardBg || '#FFFFFF',
            borderRadius: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            margin: '60px auto 20px',
            minHeight: 'auto',
            padding: '0 24px 40px',
            overflow: 'visible' as const,
          } : {}),
          ...(templateLayout === 'full-width' ? { padding: '0 24px 40px' } : {}),
          ...(templateLayout === 'premium-static' ? { padding: '0 24px 40px', marginTop: '-80px', position: 'relative' as const, zIndex: 2 } : {}),
          ...(templateLayout === 'business-card' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '0',
            borderRadius: '20px',
            overflow: 'hidden' as const,
            border: `2px solid ${templateStyles.accentColor}40`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${templateStyles.accentColor}20`,
          } : {}),
          ...(templateLayout === 'pro-card' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '0',
            borderRadius: '20px',
            overflow: 'hidden' as const,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: activeColorScheme?.cardBg || '#ffffff',
          } : {}),
          ...(templateLayout === 'pro-corporate' ? {
            maxWidth: '440px',
            overflow: 'visible' as const,
          } : {}),
          ...(templateLayout === 'cover-card' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '0',
            borderRadius: '20px',
            overflow: 'hidden' as const,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: '#ffffff',
          } : {}),
          ...(templateLayout === 'biz-traditional' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '0',
            borderRadius: '16px',
            overflow: 'hidden' as const,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            background: '#ffffff',
          } : {}),
          ...(templateLayout === 'biz-modern' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '0',
            borderRadius: '16px',
            overflow: 'hidden' as const,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: '#ffffff',
          } : {}),
          ...(templateLayout === 'biz-minimalist' ? {
            maxWidth: '420px',
            margin: '20px auto',
            padding: '28px 28px 24px',
            borderRadius: '16px',
            overflow: 'hidden' as const,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            background: '#ffffff',
          } : {}),
        }}>
          {/* Star Badge - Top Right — Opens Endorsement Popup */}
          {/* Pixel-sampled contrast: detects actual image/gradient behind badge */}
          {(() => {
            const isLight = badgeOnLightBg ?? bgIsActuallyLight;
            return (
              <button 
                onClick={() => setShowEndorsementPopup(true)}
                className="crown-btn"
                style={{
                  ...styles.crownButton,
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.45)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isLight
                    ? '0 2px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1, color: isLight ? '#d97706' : '#facc15' }}>★</span>
                <span style={{
                  ...styles.crownCount,
                  color: isLight ? '#1a1a1a' : '#ffffff',
                  textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.3)',
                  fontSize: '17px',
                  fontWeight: '700',
                }}>{cardData.endorsementCount || cardData.tapCount || 0}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.6 }}>
                  <path d="M1 1L5 5L9 1" stroke={isLight ? '#333333' : '#ffffff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            );
          })()}

          {/* Banner Image (for banner, modern, executive templates) */}
          {(templateLayout === 'pro-realtor' || templateLayout === 'pro-card' || templateLayout === 'pro-creative') && cardData.bannerImageUrl && (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              height: '180px',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: (templateLayout === 'pro-realtor' || templateLayout === 'pro-card') ? '-50px' : '16px',
              position: 'relative',
              zIndex: 2,
            }}>
              <img
                src={cardData.bannerImageUrl}
                alt="Banner"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Minimal template - add white card class to container via CSS */}

          {/* Pro Corporate: Decorative circles */}
          {templateLayout === 'pro-corporate' && (
            <>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: `${templateStyles.accentColor}10`, border: `1px solid ${templateStyles.accentColor}20`, zIndex: 0 }} />
              <div style={{ position: 'absolute', top: '80px', left: '-60px', width: '120px', height: '120px', borderRadius: '50%', background: `${templateStyles.accentColor}08`, border: `1px solid ${templateStyles.accentColor}15`, zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: '200px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: `${templateStyles.accentColor}06`, border: `1px solid ${templateStyles.accentColor}10`, zIndex: 0 }} />
            </>
          )}

          {/* Business Card: Dark Top Section */}
          {templateLayout === 'business-card' && (
            <div style={{
              background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`,
              padding: '40px 24px 30px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              position: 'relative' as const,
            }}>
              {/* Company Badge */}
              {cardData.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: templateStyles.accentColor }} />
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: templateStyles.accentColor }}>{cardData.company}</span>
                </div>
              )}
            </div>
          )}

          {/* Pro Card: Dark Top Section with Name LEFT + Photo RIGHT */}
          {templateLayout === 'pro-card' && (
            <div style={{
              background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`,
              padding: '24px 28px 40px',
              width: '100%',
              position: 'relative' as const,
              minHeight: 260,
            }}>
              {/* Company Logo + Name Row */}
              {cardData.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  {cardData.companyLogoUrl ? (
                    <img src={cardData.companyLogoUrl} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={templateStyles.accentColor}><path d="M2 21l10-9L2 3v18zm10 0l10-9L12 3v18z" opacity="0.8"/></svg>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{cardData.company}</div>
                    {cardData.title && <div style={{ fontSize: 8, color: templateStyles.accentColor, letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 600 }}>{cardData.professionalCategory || cardData.title}</div>}
                  </div>
                </div>
              )}
              {/* Name LEFT + Photo RIGHT */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 700, color: templateStyles.accentColor, margin: '0 0 4px 0', lineHeight: 1.2 }}>{cardData.fullName}</h1>
                  {cardData.pronouns && <p style={{ fontSize: 12, color: `${templateStyles.accentColor}99`, fontStyle: 'italic', margin: '4px 0 0 0' }}>({cardData.pronouns})</p>}
                  {cardData.title && <p style={{ fontSize: 14, color: templateStyles.accentColor, fontWeight: 600, margin: '10px 0 0 0' }}>{cardData.title}</p>}
                  {cardData.company && <p style={{ fontSize: 12, color: templateStyles.accentColor, opacity: 0.7, margin: '2px 0 0 0' }}>{cardData.company}</p>}
                </div>
                {/* Large photo with decorative ring */}
                {cardData.profilePhotoUrl && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 130, height: 130, borderRadius: '50%',
                      border: `2px solid ${templateStyles.accentColor}40`,
                      padding: 4,
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        border: `2px dashed ${templateStyles.accentColor}30`,
                        padding: 3,
                      }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                          <img src={cardData.profilePhotoUrl} alt={cardData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pro Card: Diagonal Transition */}
          {templateLayout === 'pro-card' && (
            <div style={{ width: '100%', height: 40, position: 'relative' as const, marginTop: -40 }}>
              <div style={{ position: 'absolute', inset: 0, background: activeColorScheme?.background || `linear-gradient(165deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)` }} />
              <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block', position: 'relative', zIndex: 1 }}>
                <path d="M0 40 L400 0 L400 40 Z" fill={activeColorScheme?.cardBg || (bgIsActuallyLight ? '#f8f9fa' : '#ffffff')} />
              </svg>
            </div>
          )}

          {/* Cover Card: Hero Photo Section */}
          {templateLayout === 'cover-card' && (
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Cover photo */}
              <div style={{
                width: '100%', height: 280, position: 'relative',
                background: activeColorScheme?.background || `linear-gradient(135deg, ${cardData.gradientColor1} 0%, ${cardData.gradientColor2} 100%)`,
                overflow: 'hidden',
              }}>
                {cardData.profilePhotoUrl && (
                  <img
                    src={cardData.bannerImageUrl || cardData.profilePhotoUrl}
                    alt={cardData.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                )}
                {/* Company logo overlay */}
                {cardData.companyLogoUrl && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: '8px 12px',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <img src={cardData.companyLogoUrl} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              {/* Wavy accent transition */}
              <div style={{ width: '100%', position: 'relative', marginTop: -20 }}>
                <svg viewBox="0 0 400 30" preserveAspectRatio="none" style={{ width: '100%', height: 30, display: 'block' }}>
                  <path d="M0 30 C100 0 200 25 300 5 C350 -5 380 10 400 0 L400 30 Z" fill="#ffffff" />
                  <path d="M0 30 C80 8 160 28 260 8 C320 -2 370 15 400 5 L400 30 Z" fill={templateStyles.accentColor} opacity="0.15" />
                </svg>
              </div>
            </div>
          )}

          {/* Biz Traditional: Top accent bar + centered logo + photo + name */}
          {templateLayout === 'biz-traditional' && (
            <div style={{ width: '100%' }}>
              {/* Top accent bar or banner image */}
              {cardData.bannerImageUrl ? (
                <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
                  <img src={cardData.bannerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: 6, background: activeColorScheme?.primary || '#0c1b3a' }} />
              )}
              {/* Logo area */}
              <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                {cardData.companyLogoUrl ? (
                  <img src={cardData.companyLogoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: activeColorScheme?.primary || '#0c1b3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={templateStyles.accentColor}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                  </div>
                )}
                {cardData.company && <span style={{ fontSize: 14, fontWeight: 700, color: activeColorScheme?.primary || '#0c1b3a', letterSpacing: 0.5 }}>{cardData.company}</span>}
              </div>
              {/* Gold accent line */}
              <div style={{ width: 50, height: 2, background: templateStyles.accentColor, margin: '16px auto' }} />
              {/* Centered photo */}
              {cardData.profilePhotoUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{ width: 110, height: 110, borderRadius: '50%', border: `3px solid ${templateStyles.accentColor}`, overflow: 'hidden' }}>
                    <img src={cardData.profilePhotoUrl} alt={cardData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}
              {/* Name + Title centered */}
              <div style={{ textAlign: 'center' as const, padding: '0 28px' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px', ...fontStyleOverrides }}>{cardData.fullName}</h1>
                {cardData.pronouns && <p style={{ fontSize: 12, color: '#999', fontStyle: 'italic', margin: '2px 0 0' }}>({cardData.pronouns})</p>}
                {cardData.title && <p style={{ fontSize: 14, fontWeight: 600, color: activeColorScheme?.primary || '#0c1b3a', margin: '6px 0 0' }}>{cardData.title}</p>}
              </div>
              {/* Divider */}
              <div style={{ width: '80%', height: 1, background: '#e5e5e5', margin: '16px auto' }} />
              {/* Bio */}
              {cardData.bio && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, textAlign: 'center' as const, padding: '0 28px 8px', margin: 0 }}>{cardData.bio}</p>}
            </div>
          )}

          {/* Biz Modern: Dark gradient top with name LEFT + photo RIGHT */}
          {templateLayout === 'biz-modern' && (
            <div style={{ width: '100%' }}>
              <div style={{
                background: cardData.bannerImageUrl ? 'none' : (activeColorScheme?.background || `linear-gradient(135deg, ${activeColorScheme?.primary || '#0f2b5b'} 0%, ${activeColorScheme?.secondary || '#1a3f7a'} 100%)`),
                padding: cardData.bannerImageUrl ? '0' : '24px 28px 56px',
                position: 'relative' as const,
                overflow: 'hidden',
              }}>
                {/* Banner image background */}
                {cardData.bannerImageUrl && (
                  <>
                    <img src={cardData.bannerImageUrl} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)' }} />
                  </>
                )}
                {/* Content overlay */}
                <div style={{ position: cardData.bannerImageUrl ? 'absolute' : 'relative' as const, bottom: cardData.bannerImageUrl ? 0 : undefined, left: 0, right: 0, padding: '24px 28px 56px' }}>
                  {/* Logo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    {cardData.companyLogoUrl ? (
                      <img src={cardData.companyLogoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                      </div>
                    )}
                    {cardData.company && <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>{cardData.company}</span>}
                  </div>
                  {/* Name + Title (left) */}
                  <div style={{ paddingRight: 130 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2, ...fontStyleOverrides }}>{cardData.fullName}</h1>
                    {cardData.pronouns && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: '4px 0 0' }}>({cardData.pronouns})</p>}
                    {cardData.title && <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>{cardData.title}</p>}
                  </div>
                  {/* Photo (right, overlapping) */}
                  {cardData.profilePhotoUrl && (
                    <div style={{ position: 'absolute', right: 28, bottom: -40 }}>
                      <div style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <img src={cardData.profilePhotoUrl} alt={cardData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Curved transition */}
              <svg viewBox="0 0 400 30" style={{ width: '100%', height: 24, display: 'block', marginTop: -1 }} preserveAspectRatio="none">
                <path d="M0 0 L400 0 L400 30 C300 0 100 0 0 30 Z" fill={cardData.bannerImageUrl ? '#ffffff' : (activeColorScheme?.primary || '#0f2b5b')} />
              </svg>
              {/* White bottom: bio */}
              <div style={{ padding: '28px 28px 0', background: '#ffffff' }}>
                {cardData.bio && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 8px' }}>{cardData.bio}</p>}
              </div>
            </div>
          )}

          {/* Biz Minimalist: Clean white with small logo + square photo */}
          {templateLayout === 'biz-minimalist' && (
            <div style={{ width: '100%' }}>
              {/* Banner image if available */}
              {cardData.bannerImageUrl && (
                <div style={{ width: '100%', height: 140, borderRadius: '0 0 12px 12px', overflow: 'hidden', marginBottom: 20 }}>
                  <img src={cardData.bannerImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Small logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                {cardData.companyLogoUrl ? (
                  <img src={cardData.companyLogoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${activeColorScheme?.primary || '#111'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#111'}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                  </div>
                )}
                {cardData.company && <span style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: 1, textTransform: 'uppercase' as const }}>{cardData.company}</span>}
              </div>
              {/* Square photo */}
              {cardData.profilePhotoUrl && (
                <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 18 }}>
                  <img src={cardData.profilePhotoUrl} alt={cardData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Name */}
              <h1 style={{ fontSize: 28, fontWeight: 300, color: activeColorScheme?.primary || '#111', margin: '0 0 4px', letterSpacing: -0.5, ...fontStyleOverrides }}>{cardData.fullName}</h1>
              {cardData.pronouns && <p style={{ fontSize: 11, color: '#999', fontStyle: 'italic', margin: '2px 0 0' }}>({cardData.pronouns})</p>}
              {cardData.title && <p style={{ fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 2, margin: '6px 0 0' }}>{cardData.title}</p>}
              {/* Thin line */}
              <div style={{ width: 40, height: 1, background: '#e0e0e0', margin: '18px 0' }} />
              {/* Bio */}
              {cardData.bio && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 8px' }}>{cardData.bio}</p>}
            </div>
          )}

          {/* Profile Section */}
          <div style={{
            ...styles.profileSection,
            ...((templateLayout === 'pro-realtor' || templateLayout === 'pro-card') && cardData.bannerImageUrl ? { zIndex: 3, position: 'relative' as const } : {}),
            ...(templateLayout === 'full-width' ? { marginTop: '40vh', zIndex: 2 } : {}),
            ...(templateLayout === 'premium-static' ? { zIndex: 2 } : {}),
            ...(templateLayout === 'pro-creative' || templateLayout === 'pro-card' ? { alignItems: 'flex-start' } : {}),
            ...(templateLayout === 'business-card' ? { padding: '0 24px 20px', background: '#FFFFFF', color: '#1a1a2e' } : {}),
            ...(templateLayout === 'pro-card' ? { padding: '8px 28px 20px', background: activeColorScheme?.cardBg || '#ffffff', color: '#333' } : {}),
            ...(templateLayout === 'cover-card' ? { padding: '4px 28px 16px', background: '#ffffff', color: '#1a1a2e', alignItems: 'flex-start' } : {}),
            ...(templateLayout === 'biz-traditional' ? { padding: '0', display: 'none' } : {}),
            ...(templateLayout === 'biz-modern' ? { padding: '0', display: 'none' } : {}),
            ...(templateLayout === 'biz-minimalist' ? { padding: '0', display: 'none' } : {}),
            ...(templateLayout === 'blogger' ? { paddingTop: 0 } : {}),
          }}>
            {/* Profile Photo - skip for full-width, premium-static (photo IS the hero), pro-card, cover-card, and biz templates (photo in their own sections) */}
            {templateLayout !== 'full-width' && templateLayout !== 'premium-static' && templateLayout !== 'pro-card' && templateLayout !== 'cover-card' && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && (() => {
              // Photo size configurations
              const photoSizes = {
                small: { ring: 100, photo: 92, initials: 28, borderRadius: 50 },
                medium: { ring: 140, photo: 132, initials: 42, borderRadius: 70 },
                large: { ring: 180, photo: 172, initials: 52, borderRadius: 90 },
                xlarge: { ring: 220, photo: 212, initials: 62, borderRadius: 110 },
              };
              const sizeConfig = photoSizes[cardData.profilePhotoSize] || photoSizes.medium;
              
              // Neon glow for neon template
              const neonGlow = (templateLayout === 'pro-creative') ? {
                boxShadow: `0 0 20px ${cardData.gradientColor1}80, 0 0 40px ${cardData.gradientColor1}40, 0 12px 40px rgba(0,0,0,0.25)`,
              } : {};
              
              return (
                <div style={{
                  ...styles.photoWrapper,
                  ...(templateLayout === 'blogger' ? { marginTop: '-50px', zIndex: 10 } : {}),
                }}>
                  <div style={{
                    ...styles.photoRing,
                    width: `${sizeConfig.ring}px`,
                    height: `${sizeConfig.ring}px`,
                    borderRadius: `${sizeConfig.borderRadius}px`,
                    background: templateLayout === 'blogger'
                      ? `linear-gradient(145deg, ${templateStyles.accentColor}40 0%, ${templateStyles.accentColor}15 100%)`
                      : bgIsActuallyLight
                        ? 'linear-gradient(145deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                    boxShadow: templateLayout === 'blogger'
                      ? `0 12px 40px rgba(0,0,0,0.1), 0 0 0 4px ${activeColorScheme?.cardBg || '#FFFFFF'}`
                      : bgIsActuallyLight
                        ? '0 12px 40px rgba(0,0,0,0.1), inset 0 2px 0 rgba(0,0,0,0.05)'
                        : '0 12px 40px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.2)',
                    ...neonGlow,
                  }}>
                    {cardData.profilePhotoUrl ? (
                      <img 
                        src={cardData.profilePhotoUrl} 
                        alt={cardData.fullName}
                        style={{
                          ...styles.profilePhoto,
                          borderRadius: `${sizeConfig.borderRadius - 4}px`,
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.style.cssText = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: ${sizeConfig.initials}px; font-weight: 700; color: white; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%); border-radius: ${sizeConfig.borderRadius - 4}px;`;
                            placeholder.textContent = cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div style={{
                        ...styles.photoPlaceholder,
                        borderRadius: `${sizeConfig.borderRadius - 4}px`,
                      }}>
                        <span style={{
                          ...styles.photoInitials,
                          fontSize: `${sizeConfig.initials}px`,
                        }}>
                          {cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Pro Realtor: 'HI I'M' intro text */}
            {templateLayout === 'pro-realtor' && (
              <p style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' as const, color: templateStyles.accentColor || templateStyles.textColor, margin: '8px 0 4px 0', textAlign: 'center' as const, opacity: 0.7 }}>HI, I&apos;M</p>
            )}

            {/* Name & Info */}
            {/* Name (skip for pro-card and biz templates — rendered in their own sections) */}
            {templateLayout !== 'pro-card' && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && <h1 style={{
              ...styles.name,
              color: templateStyles.textColor,
              ...fontStyleOverrides,
              ...(templateLayout === 'pro-creative' ? { textAlign: 'left' as const, width: '100%' } : {}),
              ...(templateLayout === 'blogger' ? { fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: '700', fontStyle: 'italic' as const, fontSize: '28px' } : {}),
              ...(templateLayout === 'business-card' ? { color: '#1a1a2e', fontWeight: '800' } : {}),
              ...(templateLayout === 'pro-realtor' ? { fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' } : {}),
              ...(templateLayout === 'cover-card' ? { textAlign: 'left' as const, width: '100%', color: '#1a1a2e', fontWeight: '700', fontSize: '24px' } : {}),
            }}>{cardData.fullName}</h1>}
            {/* Title (skip for pro-card and biz templates) */}
            {cardData.title && templateLayout !== 'pro-card' && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && <p style={{
              ...styles.title,
              color: templateStyles.textColor,
              opacity: 0.9,
              ...fontStyleOverrides,
              ...(templateLayout === 'pro-creative' ? { textAlign: 'left' as const, width: '100%' } : {}),
              ...(templateLayout === 'blogger' ? { fontSize: '10px', fontWeight: '600', letterSpacing: '2.5px', textTransform: 'uppercase' as const, opacity: 0.6, color: '#666' } : {}),
              ...(templateLayout === 'business-card' ? { color: '#555', fontWeight: '600' } : {}),
              ...(templateLayout === 'pro-realtor' ? { fontWeight: '600', letterSpacing: '0.5px' } : {}),
              ...(templateLayout === 'cover-card' ? { textAlign: 'left' as const, width: '100%', color: '#444', fontWeight: '600', fontSize: '14px' } : {}),
            }}>{cardData.title}</p>}
            {/* Company (skip for pro-card and biz templates) */}
            {cardData.company && templateLayout !== 'pro-card' && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && <p style={{
              ...styles.company,
              color: templateStyles.textColor,
              opacity: 0.7,
              ...fontStyleOverrides,
              ...(templateLayout === 'pro-creative' ? { textAlign: 'left' as const, width: '100%' } : {}),
              ...(templateLayout === 'blogger' ? { fontSize: '11px', letterSpacing: '1px', color: templateStyles.accentColor, fontWeight: '600' } : {}),
              ...(templateLayout === 'business-card' ? { color: '#888' } : {}),
              ...(templateLayout === 'pro-realtor' ? { fontSize: '13px', fontWeight: '500' } : {}),
              ...(templateLayout === 'cover-card' ? { textAlign: 'left' as const, width: '100%', color: '#888', fontStyle: 'italic', fontSize: '13px' } : {}),
            }}>{cardData.company}</p>}
            
            {/* Bio (skip for biz templates — rendered in their own sections) */}
            {cardData.bio && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && (
              <p style={{
                ...styles.bio,
                color: templateStyles.textColor,
                ...(templateLayout === 'pro-creative' ? { textAlign: 'left' as const, width: '100%', padding: '0' } : {}),
                ...(templateLayout === 'pro-card' ? { textAlign: 'left' as const, width: '100%', padding: '0', color: '#555', fontSize: '14px', lineHeight: '1.6' } : {}),
                ...(templateLayout === 'business-card' ? { color: '#555', fontSize: '14px' } : {}),
                ...(templateLayout === 'blogger' ? { color: '#555', fontSize: '14px', lineHeight: '1.6' } : {}),
                ...(templateLayout === 'cover-card' ? { textAlign: 'left' as const, width: '100%', padding: '0', color: '#555', fontSize: '14px', lineHeight: '1.6' } : {}),
              }}>
                {cardData.bio}
              </p>
            )}

            {/* Pro Creative: Wave divider */}
            {templateLayout === 'pro-creative' && (
              <div style={{ width: '100%', margin: '8px 0 16px', overflow: 'hidden' }}>
                <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                  <path d="M0 10 Q50 0 100 10 T200 10 T300 10 T400 10 V20 H0 Z" fill={`${templateStyles.accentColor}30`} />
                </svg>
              </div>
            )}

            {/* Business Card: Accent divider line */}
            {templateLayout === 'business-card' && (
              <div style={{ width: '60px', height: '3px', background: templateStyles.accentColor, borderRadius: '2px', margin: '8px 0 16px' }} />
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

            {/* Pro Corporate: Industry & Services Tags */}
            {templateLayout === 'pro-corporate' && cardData.title && (
              <div style={{ width: '100%', marginTop: 16, zIndex: 1, position: 'relative' as const }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: templateStyles.accentColor, marginBottom: 8 }}>Industry</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  <span style={{ padding: '6px 14px', borderRadius: 20, background: `${templateStyles.accentColor}15`, border: `1px solid ${templateStyles.accentColor}25`, fontSize: 13, fontWeight: 600, color: templateStyles.textColor }}>{cardData.title}</span>
                </div>
              </div>
            )}
            {templateLayout === 'pro-corporate' && cardData.bio && (
              <div style={{ width: '100%', marginTop: 14, zIndex: 1, position: 'relative' as const }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: templateStyles.accentColor, marginBottom: 8 }}>Services</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {cardData.bio.split(/[,.]/).filter(Boolean).slice(0, 5).map((service, i) => (
                    <span key={i} style={{ padding: '6px 14px', borderRadius: 20, background: `${templateStyles.accentColor}10`, border: `1px solid ${templateStyles.accentColor}18`, fontSize: 12, fontWeight: 500, color: templateStyles.textColor }}>{service.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Business Card: Contact Rows with Labels (replaces grid action buttons) */}
          {templateLayout === 'business-card' && cardData.showContactInfo && (
            <div style={{ width: '100%', padding: '0 24px 20px', background: '#FFFFFF' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#999', marginBottom: 12 }}>Contact</div>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#1a1a2e' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${templateStyles.accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: templateStyles.accentColor }}>
                    <PhoneIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{cardData.phone}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Phone</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#1a1a2e' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${templateStyles.accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: templateStyles.accentColor }}>
                    <EmailIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, wordBreak: 'break-all' as const }}>{cardData.email}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Email</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#1a1a2e' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${templateStyles.accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: templateStyles.accentColor }}>
                    <GlobeIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{cardData.websiteLabel || 'Website'}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{cardData.website.replace(/^https?:\/\//, '')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
            </div>
          )}

          {/* Pro Card: Full Contact Rows (icon + label + value + chevron) */}
          {templateLayout === 'pro-card' && cardData.showContactInfo && (
            <div style={{ width: '100%', padding: '0 28px 16px', background: activeColorScheme?.cardBg || '#ffffff' }}>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${templateStyles.accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: templateStyles.accentColor, flexShrink: 0 }}>
                    <PhoneIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.phone}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Phone</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.phone && (
                <a href={`sms:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#34D39915', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: '#34D399', flexShrink: 0 }}>
                    <MessageIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>Send a Text</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Message</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#60A5FA15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: '#60A5FA', flexShrink: 0 }}>
                    <EmailIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333', wordBreak: 'break-all' as const }}>{cardData.email}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Email</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#A78BFA15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: '#A78BFA', flexShrink: 0 }}>
                    <GlobeIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.websiteLabel || 'Website'}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{cardData.website.replace(/^https?:\/\//, '')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {fullAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5920015', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: '#F59200', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{fullAddress}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Location</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
            </div>
          )}

          {/* Cover Card: Contact Rows with colored circle icons */}
          {templateLayout === 'cover-card' && cardData.showContactInfo && (
            <div style={{ width: '100%', padding: '0 28px 16px', background: '#ffffff' }}>
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeColorScheme?.primary || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <EmailIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333', wordBreak: 'break-all' as const }}>{cardData.email}</div>
                  </div>
                </a>
              )}
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: templateStyles.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <PhoneIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.phone}</div>
                  </div>
                </a>
              )}
              {cardData.phone && (
                <a href={`sms:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeColorScheme?.primary || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <MessageIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>Send a Text</div>
                  </div>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: templateStyles.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <GlobeIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.websiteLabel || cardData.website.replace(/^https?:\/\//, '')}</div>
                    {cardData.websiteLabel && <div style={{ fontSize: 11, color: '#999' }}>{cardData.website.replace(/^https?:\/\//, '')}</div>}
                  </div>
                </a>
              )}
              {fullAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeColorScheme?.primary || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{fullAddress}</div>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Biz Traditional: Contact rows with accent-colored icons */}
          {templateLayout === 'biz-traditional' && cardData.showContactInfo && (
            <div style={{ width: '100%', padding: '0 28px 16px', background: '#ffffff' }}>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <PhoneIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.phone}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Phone</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <EmailIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333', wordBreak: 'break-all' as const }}>{cardData.email}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Email</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <GlobeIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.websiteLabel || cardData.website.replace(/^https?:\/\//, '')}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{cardData.websiteLabel ? cardData.website.replace(/^https?:\/\//, '') : 'Website'}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {fullAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{fullAddress}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Address</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialInstagram && (
                <a href={`https://instagram.com/${cardData.socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0c1b3a'}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.socialInstagram}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Instagram</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialLinkedin && (
                <a href={`https://linkedin.com/in/${cardData.socialLinkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0c1b3a'}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.socialLinkedin}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>LinkedIn</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialTiktok && (
                <a href={`https://tiktok.com/${cardData.socialTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${activeColorScheme?.primary || '#0c1b3a'}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0c1b3a'}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{cardData.socialTiktok}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>TikTok</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {/* Bottom accent bar */}
              <div style={{ width: '100%', height: 4, background: templateStyles.accentColor, marginTop: 16 }} />
            </div>
          )}

          {/* Biz Modern: Contact rows with rounded icon backgrounds */}
          {templateLayout === 'biz-modern' && cardData.showContactInfo && (
            <div style={{ width: '100%', padding: '0 28px 16px', background: '#ffffff' }}>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <PhoneIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.phone}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Work</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <EmailIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333', wordBreak: 'break-all' as const }}>{cardData.email}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Work</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <GlobeIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.websiteLabel || cardData.website.replace(/^https?:\/\//, '')}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{cardData.websiteLabel ? cardData.website.replace(/^https?:\/\//, '') : 'Company'}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {fullAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{fullAddress}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Location</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialInstagram && (
                <a href={`https://instagram.com/${cardData.socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0f2b5b'}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.socialInstagram}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Instagram</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialLinkedin && (
                <a href={`https://linkedin.com/in/${cardData.socialLinkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0f2b5b'}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.socialLinkedin}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>LinkedIn</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.socialTiktok && (
                <a href={`https://tiktok.com/${cardData.socialTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#333' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeColorScheme?.primary || '#0f2b5b'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: activeColorScheme?.primary || '#0f2b5b', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={activeColorScheme?.primary || '#0f2b5b'}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{cardData.socialTiktok}</div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>TikTok</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
            </div>
          )}

          {/* Biz Minimalist: Ultra-clean contact rows with thin icons */}
          {templateLayout === 'biz-minimalist' && cardData.showContactInfo && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {cardData.phone && (
                <a href={`tel:${cardData.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <PhoneIcon />
                  <span style={{ fontSize: 14, color: '#333' }}>{cardData.phone}</span>
                </a>
              )}
              {cardData.email && (
                <a href={`mailto:${cardData.email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <EmailIcon />
                  <span style={{ fontSize: 14, color: '#333', wordBreak: 'break-all' as const }}>{cardData.email}</span>
                </a>
              )}
              {cardData.website && (
                <a href={cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <GlobeIcon />
                  <span style={{ fontSize: 14, color: '#333' }}>{cardData.websiteLabel || cardData.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {fullAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 14, color: '#333' }}>{fullAddress}</span>
                </a>
              )}
              {cardData.socialInstagram && (
                <a href={`https://instagram.com/${cardData.socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#333"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  <span style={{ fontSize: 14, color: '#333' }}>{cardData.socialInstagram}</span>
                </a>
              )}
              {cardData.socialLinkedin && (
                <a href={`https://linkedin.com/in/${cardData.socialLinkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#333"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <span style={{ fontSize: 14, color: '#333' }}>{cardData.socialLinkedin}</span>
                </a>
              )}
              {cardData.socialTiktok && (
                <a href={`https://tiktok.com/${cardData.socialTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#333' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#333"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z"/></svg>
                  <span style={{ fontSize: 14, color: '#333' }}>{cardData.socialTiktok}</span>
                </a>
              )}
            </div>
          )}

          {/* Standard Action Buttons (for all other templates) */}
          {templateLayout !== 'business-card' && templateLayout !== 'pro-card' && templateLayout !== 'cover-card' && templateLayout !== 'biz-traditional' && templateLayout !== 'biz-modern' && templateLayout !== 'biz-minimalist' && cardData.showContactInfo && <div style={{
            ...styles.actionButtons,
            ...(templateLayout === 'blogger' ? { padding: '0 0 10px', gap: '10px' } : {}),
            ...(templateLayout === 'pro-realtor' ? { gap: '10px' } : {}),
          }}>
            {cardData.phone && (
              <a href={`tel:${cardData.phone}`} className="action-btn" style={{
                ...styles.actionButton,
                background: templateStyles.buttonBg,
                borderColor: templateStyles.buttonBorder,
                color: templateStyles.textColor,
                ...buttonStyleOverrides,
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
                ...buttonStyleOverrides,
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
                ...buttonStyleOverrides,
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
                  ...buttonStyleOverrides,
                }}
              >
                <div style={styles.actionIconWrapper}>
                  <GlobeIcon />
                </div>
                <span style={{...styles.actionText, color: templateStyles.textColor}}>{cardData.websiteLabel || 'Website'}</span>
              </a>
            )}
          </div>}

          {/* Featured Social Icons */}
          {cardData.showSocialIcons && cardData.featuredSocials && cardData.featuredSocials.length > 0 && (
            <div style={styles.featuredSocials}>
              {cardData.featuredSocials.map((item, index) => {
                const platform = typeof item === 'string' ? item : item.platform;
                const url = typeof item === 'string' ? '' : (item.url || '');
                const platformConfig: Record<string, { bgColor: string; label: string; svgPath: string; urlPrefix: string }> = {
                  instagram: { bgColor: '#E4405F', label: 'Instagram', svgPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', urlPrefix: 'https://instagram.com/' },
                  tiktok: { bgColor: '#000000', label: 'TikTok', svgPath: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z', urlPrefix: 'https://tiktok.com/@' },
                  youtube: { bgColor: '#FF0000', label: 'YouTube', svgPath: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z', urlPrefix: 'https://youtube.com/@' },
                  twitter: { bgColor: '#1DA1F2', label: 'X', svgPath: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', urlPrefix: 'https://x.com/' },
                  linkedin: { bgColor: '#0A66C2', label: 'LinkedIn', svgPath: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', urlPrefix: 'https://linkedin.com/in/' },
                  facebook: { bgColor: '#1877F2', label: 'Facebook', svgPath: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', urlPrefix: 'https://facebook.com/' },
                  whatsapp: { bgColor: '#25D366', label: 'WhatsApp', svgPath: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z', urlPrefix: 'https://wa.me/' },
                  snapchat: { bgColor: '#FFFC00', label: 'Snapchat', svgPath: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z', urlPrefix: 'https://snapchat.com/add/' },
                  spotify: { bgColor: '#1DB954', label: 'Spotify', svgPath: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z', urlPrefix: 'https://open.spotify.com/user/' },
                  telegram: { bgColor: '#0088CC', label: 'Telegram', svgPath: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z', urlPrefix: 'https://t.me/' },
                };
                const config = platformConfig[platform];
                if (!config) return null;
                
                // Build the link URL
                let href = '';
                if (url) {
                  href = url.startsWith('http') ? url : `${config.urlPrefix}${url.replace('@', '')}`;
                } else {
                  href = '#';
                }
                
                return (
                  <a
                    key={`featured-${platform}-${index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.featuredSocialButton,
                      backgroundColor: config.bgColor,
                    }}
                    title={config.label}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d={config.svgPath} />
                    </svg>
                  </a>
                );
              })}
            </div>
          )}

          {/* Social Links — skip platforms already shown in Featured Socials */}
          {cardData.showSocialIcons && hasSocialLinks && (() => {
            const featuredPlatforms = new Set(
              (cardData.featuredSocials || []).map((item: any) => typeof item === 'string' ? item : item.platform)
            );
            const showInstagram = cardData.socialInstagram && !featuredPlatforms.has('instagram');
            const showFacebook = cardData.socialFacebook && !featuredPlatforms.has('facebook');
            const showLinkedin = cardData.socialLinkedin && !featuredPlatforms.has('linkedin');
            const showTwitter = cardData.socialTwitter && !featuredPlatforms.has('twitter');
            const showTiktok = cardData.socialTiktok && !featuredPlatforms.has('tiktok');
            const showYoutube = cardData.socialYoutube && !featuredPlatforms.has('youtube');
            const showSnapchat = cardData.socialSnapchat && !featuredPlatforms.has('snapchat');
            const showPinterest = cardData.socialPinterest && !featuredPlatforms.has('pinterest');
            const showWhatsapp = cardData.socialWhatsapp && !featuredPlatforms.has('whatsapp');
            const hasAny = showInstagram || showFacebook || showLinkedin || showTwitter || showTiktok || showYoutube || showSnapchat || showPinterest || showWhatsapp;
            if (!hasAny) return null;
            return (
            <div style={styles.socialLinks}>
              {showInstagram && (
                <a 
                  href={`https://instagram.com/${cardData.socialInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {showFacebook && (
                <a 
                  href={cardData.socialFacebook.startsWith('http') ? cardData.socialFacebook : `https://facebook.com/${cardData.socialFacebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="Facebook"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {showLinkedin && (
                <a 
                  href={cardData.socialLinkedin.startsWith('http') ? cardData.socialLinkedin : `https://linkedin.com/in/${cardData.socialLinkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {showTwitter && (
                <a 
                  href={`https://twitter.com/${cardData.socialTwitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {showTiktok && (
                <a 
                  href={`https://tiktok.com/@${cardData.socialTiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="TikTok"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
              {showYoutube && (
                <a 
                  href={cardData.socialYoutube.startsWith('http') ? cardData.socialYoutube : `https://youtube.com/@${cardData.socialYoutube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="YouTube"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {showSnapchat && (
                <a 
                  href={`https://snapchat.com/add/${cardData.socialSnapchat}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="Snapchat"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                  </svg>
                </a>
              )}
              {showPinterest && (
                <a 
                  href={`https://pinterest.com/${cardData.socialPinterest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="Pinterest"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                  </svg>
                </a>
              )}
              {showWhatsapp && (
                <a 
                  href={`https://wa.me/${cardData.socialWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  style={{...styles.socialButton, background: templateStyles.buttonBg, borderColor: templateStyles.buttonBorder}}
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={socialIconColor}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}

            </div>
            );
          })()}

          {/* Divider */}
          <div style={{...styles.divider, background: templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'}} />

          {/* Links Section - always visible */}

          {/* YouTube Video Block */}
          {cardData.youtubeVideoId && (
            <div style={styles.youtubeBlock}>
              {cardData.youtubeTitle && (
                <h3 style={styles.youtubeTitle}>{cardData.youtubeTitle}</h3>
              )}
              <a 
                href={`https://youtube.com/watch?v=${cardData.youtubeVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.youtubeThumbnailContainer}
              >
                <img 
                  src={`https://img.youtube.com/vi/${cardData.youtubeVideoId}/maxresdefault.jpg`}
                  alt="YouTube Video"
                  style={styles.youtubeThumbnail}
                />
                <div style={styles.youtubePlayOverlay}>
                  <div style={styles.youtubePlayButton}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div style={styles.youtubeBadge}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#FF0000">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  </svg>
                  <span style={styles.youtubeBadgeText}>YouTube</span>
                </div>
              </a>
            </div>
          )}

          {/* Gallery Block */}
          {cardData.galleryImages && cardData.galleryImages.length > 0 && (
            <div style={styles.galleryBlock}>
              {cardData.galleryTitle && (
                <h3 style={styles.galleryTitle}>{cardData.galleryTitle}</h3>
              )}
              <div style={styles.galleryGrid}>
                {cardData.galleryImages.slice(0, 9).map((image, index) => (
                  <div 
                    key={image.id || index} 
                    style={{...styles.galleryImageContainer, cursor: 'pointer'}}
                    onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                  >
                    <img 
                      src={image.url || image.uri} 
                      alt={image.caption || `Gallery image ${index + 1}`}
                      style={styles.galleryImage}
                    />
                    {index === 8 && cardData.galleryImages.length > 9 && (
                      <div 
                        style={styles.galleryMoreOverlay}
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); setLightboxOpen(true); }}
                      >
                        <span style={styles.galleryMoreText}>+{cardData.galleryImages.length - 9}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={styles.galleryCountBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>{cardData.galleryImages.length} photos</span>
              </div>
            </div>
          )}

          {/* Testimonials Block */}
          {cardData.testimonials && cardData.testimonials.length > 0 && (
            <div style={styles.testimonialsBlock}>
              {cardData.testimonialsTitle && (
                <h3 style={styles.testimonialsTitle}>{cardData.testimonialsTitle}</h3>
              )}
              <div style={styles.testimonialsQuoteIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                </svg>
              </div>
              <div style={styles.testimonialsCarousel}>
                {cardData.testimonials.map((testimonial, index) => (
                  <div key={testimonial.id || index} style={styles.testimonialCard}>
                    <div style={styles.testimonialHeader}>
                      {testimonial.customerPhoto ? (
                        <img 
                          src={testimonial.customerPhoto} 
                          alt={testimonial.customerName}
                          style={styles.testimonialPhoto}
                        />
                      ) : (
                        <div style={styles.testimonialPhotoPlaceholder}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                      <div style={styles.testimonialInfo}>
                        <span style={styles.testimonialName}>{testimonial.customerName}</span>
                        <div style={styles.testimonialStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill={star <= testimonial.rating ? '#FFD700' : 'rgba(255,255,255,0.3)'}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      {testimonial.source && (
                        <div style={styles.testimonialSourceBadge}>
                          <span style={styles.testimonialSourceText}>{testimonial.source}</span>
                        </div>
                      )}
                    </div>
                    <p style={styles.testimonialText}>"{testimonial.reviewText}"</p>
                    {testimonial.date && (
                      <span style={styles.testimonialDate}>{testimonial.date}</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={styles.testimonialsCountBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{cardData.testimonials.length} reviews</span>
              </div>
            </div>
          )}

          {/* Form Block */}
          {cardData.formBlock && (
            <div style={styles.formBlock}>
              {/* Form Title */}
              {cardData.formBlock.title && (
                <h3 style={styles.formTitle}>{cardData.formBlock.title}</h3>
              )}
              {cardData.formBlock.description && (
                <p style={styles.formDescription}>{cardData.formBlock.description}</p>
              )}

              {/* Show success message if submitted */}
              {formSubmitted ? (
                <div style={styles.formSuccess}>
                  <div style={styles.formSuccessIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h4 style={styles.formSuccessTitle}>Thank You!</h4>
                  <p style={styles.formSuccessMessage}>
                    {cardData.formBlock.successMessage || "We'll be in touch soon."}
                  </p>
                  <button
                    style={styles.formResetButton}
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({});
                    }}
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <>
                  {/* External form embed button (Typeform, JotForm, Google Forms, Calendly) */}
                  {['typeform', 'jotform', 'googleforms', 'calendly'].includes(cardData.formBlock.formType) && cardData.formBlock.embedUrl ? (
                    <>
                      {showFormEmbed ? (
                        <div style={styles.formEmbedContainer}>
                          <button
                            style={styles.formEmbedClose}
                            onClick={() => setShowFormEmbed(false)}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                          <iframe
                            src={cardData.formBlock.embedUrl}
                            style={styles.formEmbed}
                            title="Form"
                            frameBorder="0"
                          />
                        </div>
                      ) : (
                        <button
                          style={styles.formExternalButton}
                          onClick={() => setShowFormEmbed(true)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            {cardData.formBlock.formType === 'calendly' ? (
                              <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                            ) : (
                              <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>
                            )}
                          </svg>
                          <span>
                            {cardData.formBlock.formType === 'calendly' ? 'Book Appointment' : cardData.formBlock.buttonText || 'Open Form'}
                          </span>
                        </button>
                      )}
                    </>
                  ) : cardData.formBlock.formType === 'gohighlevel' && cardData.formBlock.ghlEmbedCode && !cardData.formBlock.ghlWebhookUrl ? (
                    /* GHL Embed Form */
                    <>
                      {showFormEmbed ? (
                        <div style={styles.formEmbedContainer}>
                          <button
                            style={styles.formEmbedClose}
                            onClick={() => setShowFormEmbed(false)}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                          <div
                            style={styles.formEmbed}
                            dangerouslySetInnerHTML={{ __html: cardData.formBlock.ghlEmbedCode }}
                          />
                        </div>
                      ) : (
                        <button
                          style={styles.formExternalButton}
                          onClick={() => setShowFormEmbed(true)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          <span>{cardData.formBlock.buttonText || 'Open Form'}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    /* Native form or webhook form */
                    <form onSubmit={handleFormSubmit} style={styles.formContainer}>
                      {(cardData.formBlock.fields || DEFAULT_FORM_FIELDS).map((field) => (
                        <div key={field.id} style={styles.formFieldContainer}>
                          <label style={styles.formFieldLabel}>
                            {field.label}
                            {field.required && <span style={styles.formRequired}> *</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              style={{ ...styles.formInput, ...styles.formTextarea }}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              placeholder={field.placeholder}
                              rows={4}
                            />
                          ) : (
                            <input
                              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                              style={styles.formInput}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              placeholder={field.placeholder}
                            />
                          )}
                        </div>
                      ))}
                      <button
                        type="submit"
                        style={styles.formSubmitButton}
                        disabled={isSubmittingForm}
                      >
                        {isSubmittingForm ? (
                          <span>Sending...</span>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13"/>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            <span>{cardData.formBlock.buttonText || 'Send Message'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* Videos Section (Tavvy Shorts & External) */}
          {cardData.videos && cardData.videos.length > 0 && (
            <div style={{ width: '100%', maxWidth: '360px', marginTop: 16 }}>
              {cardData.videos.map((video, index) => {
                if (video.type === 'tavvy_short') {
                  return (
                    <div key={index} style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <video
                        src={video.url}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', display: 'block', borderRadius: 16, maxHeight: 400 }}
                      />
                      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <span style={{ fontSize: 12, color: bgIsActuallyLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Tavvy Short</span>
                      </div>
                    </div>
                  );
                } else if (video.type === 'youtube') {
                  // Extract YouTube video ID from URL
                  const ytMatch = video.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
                  const ytId = ytMatch ? ytMatch[1] : null;
                  if (!ytId) return null;
                  return (
                    <div key={index} style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                          alt="YouTube Video"
                          style={{ width: '100%', display: 'block', borderRadius: 16 }}
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'rgba(255,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      </a>
                    </div>
                  );
                } else {
                  // External video URL
                  return (
                    <a
                      key={index}
                      href={video.url.startsWith('http') ? video.url : `https://${video.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                        backgroundColor: templateStyles.buttonBg, borderRadius: 14,
                        border: `1px solid ${templateStyles.buttonBorder}`, marginBottom: 10,
                        textDecoration: 'none', color: templateStyles.textColor,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={templateStyles.textColor} strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>Video</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </a>
                  );
                }
              })}
            </div>
          )}

          {/* Links Section */}
          {hasLinks && (
            <div style={styles.linksSection}>
              {cardData.links.map((link, index) => {
                // Ensure URL has protocol prefix for proper linking
                let href = link.url;
                if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
                  href = 'https://' + href;
                }
                return (
                  <a
                    key={link.id || index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn"
                    style={{
                      ...styles.linkButton,
                      background: templateStyles.buttonBg,
                      borderColor: templateStyles.buttonBorder,
                      animationDelay: `${index * 0.05}s`,
                      ...(templateLayout === 'blogger' ? {
                        background: `${templateStyles.accentColor}15`,
                        borderColor: `${templateStyles.accentColor}30`,
                        borderRadius: '16px',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '1px',
                        fontSize: '12px',
                      } : {}),
                      ...(templateLayout === 'business-card' ? {
                        background: '#f8f9fa',
                        borderColor: '#e5e7eb',
                        borderRadius: '12px',
                      } : {}),
                      ...(templateLayout === 'pro-card' || templateLayout === 'cover-card' ? {
                        background: '#f8f9fa',
                        borderColor: '#e8e8e8',
                        borderRadius: '12px',
                      } : {}),
                    }}
                    onClick={() => handleLinkClick(link)}
                  >
                    <div style={{...styles.linkIconContainer, 
                      background: templateLayout === 'business-card' || templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' ? `${templateStyles.accentColor}15` : templateLayout === 'blogger' ? `${templateStyles.accentColor}20` : bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', 
                      color: templateLayout === 'business-card' || templateLayout === 'pro-card' || templateLayout === 'cover-card' ? templateStyles.accentColor : templateLayout === 'blogger' ? templateStyles.accentColor : templateStyles.textColor
                    }}>
                      {link.icon === 'website' || link.icon === 'link' ? (
                        <GlobeIcon />
                      ) : (
                        <LinkIcon />
                      )}
                    </div>
                    <span style={{...styles.linkButtonText, color: templateLayout === 'business-card' || templateLayout === 'pro-card' || templateLayout === 'cover-card' ? '#1a1a2e' : templateLayout === 'blogger' ? '#333' : templateStyles.textColor}}>{link.title}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </a>
                );
              })}
            </div>
          )}

          {/* Review Links — rendered as regular link rows */}
          {hasReviewLinks && (
            <div style={styles.linksSection}>
              {cardData.reviewGoogleUrl && (
                <a
                  href={cardData.reviewGoogleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    background: templateStyles.buttonBg,
                    borderColor: templateStyles.buttonBorder,
                    opacity: 1,
                  }}
                >
                  <div style={{...styles.linkIconContainer, background: bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', color: templateStyles.textColor}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                  </div>
                  <span style={{...styles.linkButtonText, color: templateStyles.textColor}}>Google Reviews</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.reviewYelpUrl && (
                <a
                  href={cardData.reviewYelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    background: templateStyles.buttonBg,
                    borderColor: templateStyles.buttonBorder,
                    opacity: 1,
                  }}
                >
                  <div style={{...styles.linkIconContainer, background: bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', color: templateStyles.textColor}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#D32323"><path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 011.596-.206 9.194 9.194 0 012.364 3.2 1.073 1.073 0 01-.694 1.511zm-3.005 5.69a9.157 9.157 0 01-2.677 2.87 1.073 1.073 0 01-1.592-.35l-2.453-4.578c-.477-.89.474-1.834 1.438-1.427l4.995 2.108c.76.32.88 1.27.289 1.377zm-8.89-1.032l1.59-4.88c.31-.95-.73-1.74-1.57-1.192L3.68 14.2a1.073 1.073 0 00-.12 1.606 9.2 9.2 0 003.33 2.206 1.073 1.073 0 001.375-.76zM7.15 7.088a9.2 9.2 0 010-3.96 1.073 1.073 0 011.378-.756l4.882 1.59c.95.31.95 1.63 0 1.94L8.528 7.492a1.073 1.073 0 01-1.378-.404zm4.1-5.835a1.073 1.073 0 011.592-.35 9.2 9.2 0 012.677 2.87c.591.107.471 1.057-.289 1.377l-4.995 2.108c-.964.407-1.915-.537-1.438-1.427l2.453-4.578z"/></svg>
                  </div>
                  <span style={{...styles.linkButtonText, color: templateStyles.textColor}}>Yelp Reviews</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.reviewTripadvisorUrl && (
                <a
                  href={cardData.reviewTripadvisorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    background: templateStyles.buttonBg,
                    borderColor: templateStyles.buttonBorder,
                    opacity: 1,
                  }}
                >
                  <div style={{...styles.linkIconContainer, background: bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', color: templateStyles.textColor}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#34E0A1"><path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 004.04 10.43 5.976 5.976 0 004.075-1.6L12 19.625l1.922-2.012a5.976 5.976 0 004.075 1.6 5.997 5.997 0 004.04-10.43L24 6.648h-4.35a13.573 13.573 0 00-7.644-2.353zM6.003 17.213a3.997 3.997 0 110-7.994 3.997 3.997 0 010 7.994zm11.994 0a3.997 3.997 0 110-7.994 3.997 3.997 0 010 7.994zM6.003 11.219a2.0 2.0 0 100 4.0 2.0 2.0 0 000-4.0zm11.994 0a2.0 2.0 0 100 4.0 2.0 2.0 0 000-4.0z"/></svg>
                  </div>
                  <span style={{...styles.linkButtonText, color: templateStyles.textColor}}>TripAdvisor Reviews</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.reviewFacebookUrl && (
                <a
                  href={cardData.reviewFacebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    background: templateStyles.buttonBg,
                    borderColor: templateStyles.buttonBorder,
                    opacity: 1,
                  }}
                >
                  <div style={{...styles.linkIconContainer, background: bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', color: templateStyles.textColor}}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span style={{...styles.linkButtonText, color: templateStyles.textColor}}>Facebook Reviews</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {cardData.reviewBbbUrl && (
                <a
                  href={cardData.reviewBbbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn"
                  style={{
                    ...styles.linkButton,
                    background: templateStyles.buttonBg,
                    borderColor: templateStyles.buttonBorder,
                    opacity: 1,
                  }}
                >
                  <div style={{...styles.linkIconContainer, background: bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', color: templateStyles.textColor}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={socialIconColor}><path d="M3.5 3h5.914c1.398 0 2.513.362 3.344 1.087.831.725 1.247 1.687 1.247 2.888 0 .9-.225 1.65-.675 2.25-.45.6-1.05 1.012-1.8 1.237v.05c.975.175 1.725.6 2.25 1.275.525.675.787 1.5.787 2.475 0 1.35-.462 2.4-1.387 3.15-.925.75-2.175 1.125-3.75 1.125H3.5V3zm3 4.5h2.5c.55 0 .987-.15 1.312-.45.325-.3.488-.7.488-1.2 0-.5-.163-.887-.488-1.162-.325-.275-.762-.413-1.312-.413H6.5v3.225zm0 5h2.75c.6 0 1.075-.162 1.425-.487.35-.325.525-.775.525-1.35 0-.575-.175-1.025-.525-1.35-.35-.325-.825-.488-1.425-.488H6.5V12.5zM16 3h5c1.35 0 2.4.362 3.15 1.087.75.725 1.125 1.7 1.125 2.925 0 .9-.225 1.65-.675 2.25-.45.6-1.05 1.012-1.8 1.237v.05c.975.175 1.725.6 2.25 1.275.525.675.787 1.5.787 2.475 0 1.35-.462 2.4-1.387 3.15-.925.75-2.175 1.125-3.75 1.125H16V3zm3 4.5h2c.55 0 .987-.15 1.312-.45.325-.3.488-.7.488-1.2 0-.5-.163-.887-.488-1.162-.325-.275-.762-.413-1.312-.413H19v3.225zm0 5h2.25c.6 0 1.075-.162 1.425-.487.35-.325.525-.775.525-1.35 0-.575-.175-1.025-.525-1.35-.35-.325-.825-.488-1.425-.488H19V12.5z"/></svg>
                  </div>
                  <span style={{...styles.linkButtonText, color: templateStyles.textColor}}>BBB</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bgIsActuallyLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
            </div>
          )}

          {/* ═══ CIVIC CARD SECTION ═══ */}
          {templateLayout === 'civic-card' && (
            <CivicCardSection
              cardId={cardData.id}
              cardSlug={cardData.slug}
              fullName={cardData.fullName}
              ballotNumber={cardData.ballotNumber || ''}
              partyName={cardData.partyName || ''}
              officeRunningFor={cardData.officeRunningFor || ''}
              electionYear={cardData.electionYear || ''}
              campaignSlogan={cardData.campaignSlogan || ''}
              region={cardData.region || ''}
              profilePhotoUrl={cardData.profilePhotoUrl}
              accentColor={activeColorScheme?.primary || templateStyles.accentColor}
              secondaryColor={activeColorScheme?.secondary || templateStyles.accentColor}
              proposals={cardData.civicProposals || []}
              questions={cardData.civicQuestions || []}
              commitments={cardData.civicCommitments || []}
              showVoteCounts={cardData.showVoteCounts !== false}
            />
          )}
          {/* ═══ CARD FOOTER ═══ */}
          <div style={{ width: '100%', marginTop: 20, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>

            {/* Action Icons — Save, Share, Apple Wallet, Google Wallet */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, width: '100%', padding: '4px 0' }}>
              <button onClick={handleSaveContact} title="Save Contact" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 14,
                background: templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
                border: `1px solid ${templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', padding: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? '#1a1a2e' : '#ffffff'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </button>
              <button onClick={handleShare} title="Share" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 14,
                background: templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
                border: `1px solid ${templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', padding: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={templateLayout === 'pro-card' || templateLayout === 'cover-card' || templateLayout === 'biz-traditional' || templateLayout === 'biz-modern' || templateLayout === 'biz-minimalist' || bgIsActuallyLight ? '#1a1a2e' : '#ffffff'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <button onClick={handleAppleWallet} title="Apple Wallet" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 14,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer', padding: 0,
                overflow: 'hidden',
              }}>
                <img src="/apple-wallet-icon.png" alt="Apple Wallet" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} />
              </button>
              <button onClick={handleGoogleWallet} title="Google Wallet" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: 14,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer', padding: 0,
                overflow: 'hidden',
              }}>
                <img src="/google-wallet-icon.png" alt="Google Wallet" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover' }} />
              </button>
            </div>

            {/* Pro Realtor: Company Footer Bar */}
            {templateLayout === 'pro-realtor' && cardData.company && (
              <div style={{ width: '100%', padding: '14px 20px', background: `${templateStyles.accentColor}15`, borderRadius: 14, textAlign: 'center' as const }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: templateStyles.accentColor }}>{cardData.company}</span>
              </div>
            )}

            {/* Row 4: Tavvy Branding */}
            <div style={{ width: '100%', textAlign: 'center' as const, paddingTop: 8, paddingBottom: 8 }}>
              <a href="https://tavvy.com/ecard" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', textDecoration: 'none' }}>
                <img 
                  src={isLightFooterBg ? '/tavvy-logo-dark.png' : '/tavvy-logo-white.png'}
                  alt="Tavvy" 
                  style={{ height: 22, width: 'auto', objectFit: 'contain' as const, marginBottom: 4 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const span = document.createElement('span');
                    span.textContent = 'tavvy';
                    span.style.cssText = `font-size: 20px; font-weight: 700; color: ${isLightFooterBg ? '#2d3e50' : 'white'}; letter-spacing: -0.5px;`;
                    target.parentElement?.appendChild(span);
                  }}
                />
              </a>
              <br />
              <a href="https://tavvy.com/ecard" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, color: isLightFooterBg ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
              }}>Create your free digital card</a>
            </div>
          </div>
        </div>
      </div>

      {/* Endorsement Popup */}
      {showEndorsementPopup && cardData && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowEndorsementPopup(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420, maxHeight: '80vh', overflowY: 'auto', padding: '24px 20px 32px', color: '#1a1a2e' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header — Tavvy logo + Endorsements */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="/brand/tavvy-logo-horizontal-light.png" alt="Tavvy" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#2d3a4a', letterSpacing: '-0.3px' }}>{t('endorsement.title')}</span>
              </div>
              <button onClick={() => setShowEndorsementPopup(false)} style={{ background: '#f0f0f0', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: -14, marginBottom: 16 }}>{t('endorsement.totalCount', { count: cardData.endorsementCount || cardData.tapCount || 0 })}</div>

            {/* Top Endorsement Tags — shown as rows with ×count */}
            {cardData.topEndorsementTags && cardData.topEndorsementTags.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                {cardData.topEndorsementTags.map((tag, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{tag.emoji}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>{SIGNAL_KEY_MAP[tag.label] ? t(`endorsement.${SIGNAL_KEY_MAP[tag.label]}`) : tag.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#3B9FD9' }}>×{tag.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#aaa', fontSize: 15 }}>
                {t('endorsement.noEndorsements')}
              </div>
            )}

            {/* Endorse Button */}
            {!endorsementSubmitted ? (
              <button
                onClick={() => { setShowEndorsementPopup(false); setSignalTaps({}); setEndorseNote(''); setShowEndorseFlow(true); }}
                style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#3B9FD9', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {t('endorsement.endorseButton', { name: cardData.fullName.split(' ')[0] })}
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', borderRadius: 14, background: 'rgba(0,200,83,0.1)', color: '#00C853', fontSize: 15, fontWeight: 700 }}>
                ✅ {t('endorsement.thankYou')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Endorse Flow - Tavvy Tap Tile System */}
      {showEndorseFlow && cardData && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowEndorseFlow(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420, maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const, color: '#1a1a2e' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header - fixed at top */}
            <div style={{ padding: '24px 20px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{t('endorsement.whatStoodOut')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#3B9FD9' }}>{selectedSignalCount} selected</div>
                  <button onClick={() => setShowEndorseFlow(false)} style={{ background: '#f0f0f0', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{t('endorsement.tapInstructions')}</div>
            </div>
            {/* Scrollable content area */}
            <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1, minHeight: 0 }}>

            {/* Group signals by category */}
            {(() => {
              const signals = cardData.endorsementSignals || [];
              const categories = [...new Set(signals.map(s => s.category))];
              const catColors: Record<string, string> = { universal: '#3B9FD9', politics: '#1B5E20', sales: '#E87D3E', real_estate: '#6B7280', food_dining: '#E53E3E', health_wellness: '#38A169', beauty: '#D53F8C', home_services: '#DD6B20', legal_finance: '#2B6CB0', creative_marketing: '#8B5CF6', education_coaching: '#D69E2E', tech_it: '#319795', automotive: '#718096', events_entertainment: '#9F7AEA', pets: '#ED8936' };
              const catLabels: Record<string, string> = { universal: t('endorsement.catStrengths'), politics: t('endorsement.catPolitics'), sales: t('endorsement.catSales'), real_estate: t('endorsement.catRealEstate'), food_dining: t('endorsement.catFoodDining'), health_wellness: t('endorsement.catHealthWellness'), beauty: t('endorsement.catBeauty'), home_services: t('endorsement.catHomeServices'), legal_finance: t('endorsement.catLegalFinance'), creative_marketing: t('endorsement.catCreativeMarketing'), education_coaching: t('endorsement.catEducationCoaching'), tech_it: t('endorsement.catTechIt'), automotive: t('endorsement.catAutomotive'), events_entertainment: t('endorsement.catEventsEntertainment'), pets: t('endorsement.catPets') };
              return categories.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 12, background: catColors[cat] || '#3B9FD9', color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {catLabels[cat] || cat}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {signals.filter(s => s.category === cat).map(signal => {
                      const intensity = signalTaps[signal.id] || 0;
                      const isSelected = intensity > 0;
                      return (
                        <button
                          key={signal.id}
                          onClick={() => handleSignalTap(signal.id)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '14px 6px', borderRadius: 14, minHeight: 90, cursor: 'pointer',
                            background: isSelected ? (catColors[cat] || '#3B9FD9') : '#f0f4f8',
                            border: isSelected ? 'none' : '1.5px solid #e0e4e8',
                            color: isSelected ? '#fff' : '#555',
                            transition: 'all 0.15s ease',
                            position: 'relative' as const,
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                          <span style={{ fontSize: 28, marginBottom: 4 }}>{signal.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{SIGNAL_KEY_MAP[signal.label] ? t(`endorsement.${SIGNAL_KEY_MAP[signal.label]}`) : signal.label}</span>
                          {intensity > 1 && (
                            <span style={{ fontSize: 12, marginTop: 2 }}>{fireEmojis(intensity)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Optional Note */}
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <textarea
                value={endorseNote}
                onChange={e => setEndorseNote(e.target.value)}
                placeholder={t('endorsement.notePlaceholder')}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#f5f5f5', border: '1px solid #e0e0e0', color: '#333', fontSize: 14, resize: 'none', minHeight: 50, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                rows={2}
              />
            </div>
            </div>{/* end scrollable content area */}

            {/* Continue Button - sticky at bottom */}
            <div style={{ padding: '12px 20px 32px', flexShrink: 0, borderTop: '1px solid #f0f0f0', background: '#fff' }}>
            <button
              onClick={async () => {
                if (selectedSignalCount === 0) return;
                setIsSubmittingEndorsement(true);
                try {
                  // Convert signalTaps to array of signal IDs
                  const signalIds = Object.keys(signalTaps);
                  // Get the current Supabase session token
                  const { data: { session: currentSession } } = await supabase.auth.getSession();
                  const accessToken = currentSession?.access_token;
                  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                  if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                  }
                  const res = await fetch('/api/ecard/endorse', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ cardId: cardData.id, signals: signalIds, intensities: signalTaps, note: endorseNote }),
                  });
                  const resData = await res.json();
                  if (res.ok) {
                    // Update the displayed count and tags immediately
                    setCardData(prev => prev ? {
                      ...prev,
                      endorsementCount: resData.endorsementCount ?? (prev.endorsementCount + signalIds.length),
                      tapCount: (prev.tapCount || 0) + signalIds.length,
                      topEndorsementTags: resData.topEndorsementTags ?? prev.topEndorsementTags,
                    } : prev);
                    setEndorsementSubmitted(true);
                    setShowEndorseFlow(false);
                    setShowEndorsementPopup(true);
                  } else {
                    if (resData?.requireLogin) {
                      // Save endorsement data to localStorage so it persists through login
                      localStorage.setItem('tavvy_pending_endorsement', JSON.stringify({
                        cardId: cardData.id,
                        signals: signalIds,
                        intensities: signalTaps,
                        note: endorseNote,
                        cardSlug: cardData.slug,
                      }));
                      // Redirect to login/signup with return URL back to this card
                      const currentPath = `/${cardData.slug}`;
                      window.location.href = `/app/login?returnUrl=${encodeURIComponent(currentPath)}`;
                    } else {
                      alert(resData?.error || 'Failed to submit endorsement.');
                    }
                  }
                } catch (err) {
                  alert('Network error. Please try again.');
                } finally {
                  setIsSubmittingEndorsement(false);
                }
              }}
              disabled={isSubmittingEndorsement || selectedSignalCount === 0}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: selectedSignalCount > 0 ? '#3B9FD9' : '#e0e0e0',
                border: 'none', color: selectedSignalCount > 0 ? '#fff' : '#999',
                fontSize: 16, fontWeight: 700, cursor: selectedSignalCount > 0 ? 'pointer' : 'not-allowed',
                opacity: isSubmittingEndorsement ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isSubmittingEndorsement ? t('endorsement.submitting') : t('endorsement.continue')}
            </button>
            </div>{/* end sticky bottom */}
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxOpen && cardData?.galleryImages && (
        <div 
          style={styles.lightboxOverlay}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            style={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>

          {/* Counter */}
          <div style={styles.lightboxCounter}>
            {lightboxIndex + 1} / {cardData.galleryImages.length}
          </div>

          {/* Previous button */}
          {lightboxIndex > 0 && (
            <button 
              style={{...styles.lightboxNav, left: 8}}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img 
            src={cardData.galleryImages[lightboxIndex]?.url || cardData.galleryImages[lightboxIndex]?.uri}
            alt={cardData.galleryImages[lightboxIndex]?.caption || `Photo ${lightboxIndex + 1}`}
            style={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          {cardData.galleryImages[lightboxIndex]?.caption && (
            <div style={styles.lightboxCaption}>
              {cardData.galleryImages[lightboxIndex].caption}
            </div>
          )}

          {/* Next button */}
          {lightboxIndex < cardData.galleryImages.length - 1 && (
            <button 
              style={{...styles.lightboxNav, right: 8}}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              ›
            </button>
          )}
        </div>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  crownButtonTapped: {
    background: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  crownCount: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
  featuredSocials: {
    display: 'flex',
    justifyContent: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  featuredSocialButton: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    border: 'none',
    cursor: 'pointer',
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
  youtubeBlock: {
    width: '100%',
    maxWidth: '360px',
    marginBottom: '24px',
  },
  youtubeTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  youtubeThumbnailContainer: {
    display: 'block',
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  youtubePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.25)',
  },
  youtubePlayButton: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    background: '#FF0000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '3px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  youtubeBadge: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.95)',
    padding: '5px 10px',
    borderRadius: '6px',
  },
  youtubeBadgeText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
  },
  // Gallery Block Styles
  galleryBlock: {
    width: '100%',
    maxWidth: '360px',
    marginBottom: '24px',
  },
  galleryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  galleryImageContainer: {
    position: 'relative',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  galleryMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryMoreText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
  },
  galleryCountBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    marginTop: '12px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
  },
  // Testimonials Block Styles
  testimonialsBlock: {
    width: '100%',
    maxWidth: '360px',
    marginBottom: '24px',
  },
  testimonialsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  testimonialsQuoteIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  testimonialsCarousel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  testimonialCard: {
    background: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  testimonialHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px',
  },
  testimonialPhoto: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  testimonialPhotoPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
  },
  testimonialStars: {
    display: 'flex',
    gap: '2px',
  },
  testimonialSourceBadge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  testimonialSourceText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
  },
  testimonialText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.5',
    fontStyle: 'italic',
    margin: '0 0 8px 0',
  },
  testimonialDate: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  testimonialsCountBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    marginTop: '12px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
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
    paddingTop: '24px',
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
    margin: '8px 0 0 0',
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
  // Form Block Styles
  formBlock: {
    width: '100%',
    maxWidth: '360px',
    marginBottom: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  formDescription: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    margin: '0 0 20px 0',
    lineHeight: '1.5',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formFieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formFieldLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formRequired: {
    color: '#ef4444',
  },
  formInput: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '15px',
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
  },
  formTextarea: {
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formSubmitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
  formExternalButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  formEmbedContainer: {
    position: 'relative',
    width: '100%',
    minHeight: '400px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'white',
  },
  formEmbedClose: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  formEmbed: {
    width: '100%',
    minHeight: '400px',
    border: 'none',
  },
  formSuccess: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  formSuccessIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  formSuccessTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 8px 0',
  },
  formSuccessMessage: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.5',
  },
  formResetButton: {
    marginTop: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Lightbox styles
  lightboxOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 16px 40px',
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    zIndex: 10001,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightboxCounter: {
    position: 'absolute' as const,
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 10001,
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain' as const,
    borderRadius: '8px',
    userSelect: 'none' as const,
  },
  lightboxNav: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: 'white',
    fontSize: '36px',
    cursor: 'pointer',
    zIndex: 10001,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    lineHeight: 1,
  },
  lightboxCaption: {
    position: 'absolute' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    textAlign: 'center' as const,
    maxWidth: '80%',
    zIndex: 10001,
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
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  }
  
  try {
    const serverSupabase = createClient(supabaseUrl, supabaseKey);
    
    // First try to find by slug
    let { data, error: fetchError } = await serverSupabase
      .from('digital_cards')
      .select('*')
      .eq('slug', slug)
      .single();
    
    // If not found by slug, try custom domain (for when accessed via custom domain)
    if (fetchError || !data) {
      // Check if the host header contains a custom domain
      const host = context.req.headers.host || '';
      if (host && !host.includes('tavvy.com') && !host.includes('localhost')) {
        const { data: domainData, error: domainError } = await serverSupabase
          .from('digital_cards')
          .select('*')
          .eq('custom_domain', host)
          .eq('custom_domain_verified', true)
          .single();
        
        if (!domainError && domainData) {
          data = domainData;
          fetchError = null;
        }
      }
    }
    
    if (fetchError || !data) {
      console.log('[Card SSR] Card not found:', slug);
      return {
        props: {
          cardData: null,
          error: 'Card not found',
          ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
        },
      };
    }
    
    console.log('[Card SSR] Card found:', data.full_name);
    
    // Fetch links from digital_card_links (primary) and card_links (legacy fallback)
    let linksData: any[] = [];
    const { data: digitalLinksData } = await serverSupabase
      .from('digital_card_links')
      .select('*')
      .eq('card_id', data.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (digitalLinksData && digitalLinksData.length > 0) {
      linksData = digitalLinksData;
    } else {
      // Fallback to legacy card_links table
      const { data: legacyLinksData } = await serverSupabase
        .from('card_links')
        .select('*')
        .eq('card_id', data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      linksData = legacyLinksData || [];
    }
    
    // Increment view count
    serverSupabase
      .from('digital_cards')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {});

    // Fetch endorsement data
    let endorsementCount = 0;
    let topEndorsementTags: { label: string; emoji: string; count: number }[] = [];
    let recentEndorsements: { endorserName: string; note: string; createdAt: string }[] = [];
    let endorsementSignals: { id: string; label: string; emoji: string; category: string }[] = [];

    try {
      // Get endorsement count (each signal tap = +1)
      const { count } = await serverSupabase
        .from('ecard_endorsement_signals')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', data.id);
      endorsementCount = count || 0;

      // Get top signal tags (aggregated)
      const { data: signalTaps } = await serverSupabase
        .from('ecard_endorsement_signals')
        .select('signal_id, review_items(label, icon_emoji)')
        .eq('card_id', data.id);
      if (signalTaps && signalTaps.length > 0) {
        const tagCounts: Record<string, { label: string; emoji: string; count: number }> = {};
        signalTaps.forEach((tap: any) => {
          const ri = tap.review_items;
          if (ri) {
            if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '⭐', count: 0 };
            tagCounts[tap.signal_id].count++;
          }
        });
        topEndorsementTags = Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 8);
      }

      // Get recent endorsements with endorser names
      const { data: recentData } = await serverSupabase
        .from('ecard_endorsements')
        .select('public_note, created_at, endorser_id, profiles(full_name)')
        .eq('card_id', data.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentData) {
        recentEndorsements = recentData.map((e: any) => ({
          endorserName: e.profiles?.full_name || 'Tavvy User',
          note: e.public_note || '',
          createdAt: e.created_at,
        }));
      }

      // Get available endorsement signals for this card's category
      // Always show universal + the card's specific category
      const cardCategory = data.professional_category || 'universal';
      const categoriesToShow = cardCategory === 'universal' ? ['universal'] : ['universal', cardCategory];
      const { data: signals } = await serverSupabase
        .from('review_items')
        .select('id, label, icon_emoji, sort_order, category')
        .eq('signal_type', 'pro_endorsement')
        .eq('is_active', true)
        .in('category', categoriesToShow)
        .order('sort_order', { ascending: true });
      endorsementSignals = (signals || []).map((s: any) => ({
        id: s.id,
        label: s.label,
        emoji: s.icon_emoji || '⭐',
        category: s.category || 'universal',
      }));
    } catch (endorseErr) {
      console.error('[Card SSR] Endorsement fetch error:', endorseErr);
    }

    // Fetch civic card data if this is a civic-card template
    let civicProposals: any[] = [];
    let civicQuestions: any[] = [];
    let civicCommitments: any[] = [];
    const resolvedTemplate = resolveTemplateId(data.template_id || 'classic-blue');
    if (resolvedTemplate === 'civic-card') {
      try {
        // Fetch proposals
        const { data: proposalsData } = await serverSupabase
          .from('civic_proposals')
          .select('*')
          .eq('card_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (proposalsData) {
          // Fetch reaction counts for each proposal
          for (const p of proposalsData) {
            const { data: reactions } = await serverSupabase
              .from('civic_reactions')
              .select('reaction_type')
              .eq('proposal_id', p.id);
            const counts = { support: 0, needs_improvement: 0, disagree: 0 };
            (reactions || []).forEach((r: any) => {
              if (r.reaction_type in counts) counts[r.reaction_type as keyof typeof counts]++;
            });
            civicProposals.push({
              id: p.id,
              title: p.title,
              description: p.description || '',
              sortOrder: p.sort_order || 0,
              reactions: counts,
            });
          }
        }

        // Fetch questions
        const { data: questionsData } = await serverSupabase
          .from('civic_questions')
          .select('*')
          .eq('card_id', data.id)
          .order('upvote_count', { ascending: false })
          .limit(50);

        civicQuestions = (questionsData || []).map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          upvoteCount: q.upvote_count || 0,
          answerText: q.answer_text || null,
          answeredAt: q.answered_at || null,
          createdAt: q.created_at,
        }));

        // Fetch commitments
        const { data: commitmentsData } = await serverSupabase
          .from('civic_commitments')
          .select('*')
          .eq('card_id', data.id)
          .order('sort_order', { ascending: true });

        civicCommitments = (commitmentsData || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          status: c.status || 'planned',
          sortOrder: c.sort_order || 0,
        }));

        // For civic cards, also load political endorsement signals
        const { data: politicalSignals } = await serverSupabase
          .from('review_items')
          .select('id, label, icon_emoji, sort_order, category')
          .eq('signal_type', 'pro_endorsement')
          .eq('is_active', true)
          .eq('category', 'politics')
          .order('sort_order', { ascending: true });
        if (politicalSignals && politicalSignals.length > 0) {
          endorsementSignals = politicalSignals.map((s: any) => ({
            id: s.id,
            label: s.label,
            emoji: s.icon_emoji || '\u2B50',
            category: s.category || 'politics',
          }));
        }
      } catch (civicErr) {
        console.error('[Card SSR] Civic data fetch error:', civicErr);
      }
    }

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
      websiteLabel: data.website_label || '',
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
      profilePhotoSize: data.profile_photo_size || 'medium',
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
      // YouTube video block
      youtubeVideoId: data.youtube_video_id || '',
      youtubeTitle: data.youtube_title || '',
      // Gallery block
      galleryImages: data.gallery_images ? 
        (typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images) 
        : [],
      galleryTitle: data.gallery_title || '',
      // Testimonials block
      testimonials: data.testimonials ? 
        (typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials) 
        : [],
      testimonialsTitle: data.testimonials_title || '',
      // Form block
      formBlock: data.form_block ? 
        (typeof data.form_block === 'string' ? JSON.parse(data.form_block) : data.form_block) 
        : null,
      // Appearance settings
      theme: data.theme || 'classic',
      backgroundType: data.background_type || 'gradient',
      backgroundImageUrl: data.background_image_url || null,
      buttonStyle: data.button_style || 'fill',
      fontStyle: data.font_style || 'default',
      tapCount: data.tap_count || 0,
      links: linksData?.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon || 'link',
        sort_order: l.sort_order,
        clicks: l.clicks || 0,
      })) || [],
      // Videos
      videos: data.videos ?
        (typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos)
        : [],
      // Visibility toggles
      showContactInfo: data.show_contact_info !== false,
      showSocialIcons: data.show_social_icons !== false,
      fontColor: data.font_color || null,
      bannerImageUrl: data.banner_image_url || null,
      companyLogoUrl: data.company_logo_url || null,
      // Professional category & endorsements
      professionalCategory: data.professional_category || '',
      endorsementCount,
      topEndorsementTags,
      recentEndorsements,
      endorsementSignals,
      // External review URLs
      reviewGoogleUrl: data.review_google_url || '',
      reviewYelpUrl: data.review_yelp_url || '',
      reviewTripadvisorUrl: data.review_tripadvisor_url || '',
      reviewFacebookUrl: data.review_facebook_url || '',
      reviewBbbUrl: data.review_bbb_url || '',
      // Civic card fields
      ballotNumber: data.ballot_number || '',
      partyName: data.party_name || '',
      officeRunningFor: data.office_running_for || '',
      electionYear: data.election_year || '',
      campaignSlogan: data.campaign_slogan || '',
      region: data.region || '',
      civicProposals,
      civicQuestions,
      civicCommitments,
      showVoteCounts: data.show_vote_counts !== false,
    };
    
    return {
      props: {
        cardData,
        error: null,
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  } catch (err) {
    console.error('[Card SSR] Error:', err);
    return {
      props: {
        cardData: null,
        error: 'Failed to load card',
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  }
};
