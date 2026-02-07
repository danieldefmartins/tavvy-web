// Tavvy eCard Templates Configuration v2.0
// Templates are now LAYOUT-based — each template has a fundamentally different card structure.
// Colors are a secondary choice via a simple color picker, not separate "templates".
// Multi-page feature requires $4.99/month subscription

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;      // Main gradient start
  secondary: string;    // Main gradient end
  accent: string;       // Buttons, highlights
  text: string;         // Primary text color
  textSecondary: string; // Secondary text color
  background: string;   // Card background
  cardBg: string;       // Inner card background (for minimal templates)
  border?: string;      // Border color (for luxury templates)
  isFree?: boolean;     // If true, available to all users
}

export type TemplateLayout = 
  | 'classic'       // Centered photo circle, name below, gradient bg
  | 'banner'        // Full-width banner image at top, circular profile overlapping
  | 'bold'          // Full-width hero photo with gradient overlay, name ON the photo
  | 'minimal'       // Clean white card on dark background, compact layout
  | 'elegant'       // Luxury dark theme with ornate accents and borders
  | 'modern'        // Large rounded photo at top, card-style sections below
  | 'split'         // Photo on left, info on right (business card style)
  | 'showcase'      // Gallery-focused with large photo grid
  | 'neon'          // Vibrant neon glow effects for creators/influencers
  | 'executive';    // Corporate professional with structured layout

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'luxury' | 'fun';
  previewImage: string;
  isPremium: boolean;
  isProOnly?: boolean;
  proCategories?: string[];
  features: string[];
  layout: TemplateLayout;
  colorSchemes: ColorScheme[];
  layoutConfig: {
    photoPosition: 'top' | 'left' | 'right' | 'center' | 'cover' | 'banner-overlap';
    photoSize: 'small' | 'medium' | 'large' | 'cover' | 'hero';
    photoStyle: 'circle' | 'rounded' | 'square' | 'ornate' | 'cover';
    buttonStyle: 'rounded' | 'pill' | 'square' | 'outline' | 'frosted' | 'minimal';
    fontFamily: 'modern' | 'classic' | 'elegant' | 'playful' | 'executive';
    showBorder: boolean;
    borderStyle?: 'solid' | 'ornate' | 'gradient' | 'accent';
    backgroundPattern?: 'none' | 'icons' | 'geometric' | 'motion' | 'texture';
    hasBannerImage?: boolean;    // Template supports banner/cover image
    hasGradientOverlay?: boolean; // Photo has gradient overlay with text on top
    hasWhiteCard?: boolean;       // Content in a white card container
  };
}

// ============ UNIVERSAL COLOR PRESETS ============
// These are available as quick-pick colors in any template's color picker
export const UNIVERSAL_COLORS = [
  { id: 'ocean-blue', name: 'Ocean Blue', primary: '#1E90FF', secondary: '#00BFFF' },
  { id: 'midnight', name: 'Midnight', primary: '#1a2a4a', secondary: '#2d4a6f' },
  { id: 'emerald', name: 'Emerald', primary: '#065f46', secondary: '#10b981' },
  { id: 'royal-purple', name: 'Royal Purple', primary: '#581c87', secondary: '#9333ea' },
  { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#ec4899' },
  { id: 'coral', name: 'Coral', primary: '#fb7185', secondary: '#f43f5e' },
  { id: 'forest', name: 'Forest', primary: '#059669', secondary: '#34D399' },
  { id: 'fire', name: 'Fire', primary: '#EF4444', secondary: '#F97316' },
  { id: 'teal', name: 'Teal', primary: '#14B8A6', secondary: '#06B6D4' },
  { id: 'gold', name: 'Gold', primary: '#D4AF37', secondary: '#F59E0B' },
  { id: 'lavender', name: 'Lavender', primary: '#A78BFA', secondary: '#8B5CF6' },
  { id: 'pink', name: 'Pink', primary: '#EC4899', secondary: '#F472B6' },
  { id: 'charcoal', name: 'Charcoal', primary: '#374151', secondary: '#4b5563' },
  { id: 'pure-black', name: 'Black', primary: '#0a0a0a', secondary: '#1a1a1a' },
  { id: 'pure-white', name: 'White', primary: '#FFFFFF', secondary: '#F5F5F5' },
  { id: 'navy', name: 'Navy', primary: '#0f172a', secondary: '#1e293b' },
];

export const TEMPLATES: Template[] = [
  // ============ FREE TEMPLATES (Real Layout Differences) ============

  // 1. CLASSIC — The default. Centered photo, name below, gradient background.
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean centered layout with gradient background. The timeless choice.',
    category: 'professional',
    previewImage: 'classic',
    isPremium: false,
    features: ['gradient-bg', 'action-buttons', 'social-icons', 'centered-layout'],
    layout: 'classic',
    colorSchemes: [
      { id: 'blue', name: 'Ocean Blue', primary: '#1E90FF', secondary: '#00BFFF', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #1E90FF 0%, #00BFFF 50%, #0a0f1e 100%)', cardBg: 'transparent', isFree: true },
      { id: 'black', name: 'Black', primary: '#1A1A1A', secondary: '#333333', accent: 'rgba(255,255,255,0.15)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#1A1A1A', cardBg: '#1A1A1A', isFree: true },
      { id: 'white', name: 'White', primary: '#FFFFFF', secondary: '#F5F5F5', accent: 'rgba(0,0,0,0.1)', text: '#1A1A1A', textSecondary: '#666666', background: '#FFFFFF', cardBg: '#FFFFFF', isFree: true },
      { id: 'purple', name: 'Purple', primary: '#581c87', secondary: '#9333ea', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #581c87 0%, #9333ea 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      { id: 'emerald', name: 'Emerald', primary: '#065f46', secondary: '#10b981', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #065f46 0%, #10b981 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#ec4899', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #f97316 0%, #ec4899 50%, #0a0f1e 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
    },
  },

  // 2. BANNER — Full-width banner/cover image at top, circular profile photo overlapping the banner.
  {
    id: 'banner',
    name: 'Banner',
    description: 'Cover photo with profile picture overlapping. Perfect for personal branding.',
    category: 'creative',
    previewImage: 'banner',
    isPremium: false,
    features: ['banner-image', 'overlap-photo', 'gradient-bg', 'social-icons'],
    layout: 'banner',
    colorSchemes: [
      { id: 'blue', name: 'Ocean Blue', primary: '#1E90FF', secondary: '#00BFFF', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #1E90FF 0%, #00BFFF 50%, #0a0f1e 100%)', cardBg: 'transparent', isFree: true },
      { id: 'black', name: 'Black', primary: '#1A1A1A', secondary: '#333333', accent: 'rgba(255,255,255,0.15)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#1A1A1A', cardBg: '#1A1A1A', isFree: true },
      { id: 'white', name: 'White', primary: '#FFFFFF', secondary: '#F5F5F5', accent: 'rgba(0,0,0,0.1)', text: '#1A1A1A', textSecondary: '#666666', background: '#FFFFFF', cardBg: '#FFFFFF', isFree: true },
      { id: 'purple', name: 'Purple', primary: '#581c87', secondary: '#9333ea', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #581c87 0%, #9333ea 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      { id: 'emerald', name: 'Emerald', primary: '#065f46', secondary: '#10b981', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #065f46 0%, #10b981 50%, #0a0f1e 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'banner-overlap',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
      hasBannerImage: true,
    },
  },

  // 3. BOLD — Full-width hero photo with gradient overlay. Name and info ON the photo.
  {
    id: 'bold',
    name: 'Bold',
    description: 'Full-screen hero photo with your name overlaid. Makes a statement.',
    category: 'creative',
    previewImage: 'bold',
    isPremium: false,
    features: ['hero-photo', 'gradient-overlay', 'text-on-image', 'social-icons'],
    layout: 'bold',
    colorSchemes: [
      { id: 'dark-overlay', name: 'Dark', primary: '#000000', secondary: '#1f2937', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.6)', cardBg: 'transparent', isFree: true },
      { id: 'blue-overlay', name: 'Blue', primary: '#1E90FF', secondary: '#00BFFF', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(to bottom, transparent 0%, rgba(30,144,255,0.8) 100%)', cardBg: 'transparent', isFree: true },
      { id: 'purple-overlay', name: 'Purple', primary: '#8b5cf6', secondary: '#ec4899', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, rgba(139,92,246,0.8) 100%)', cardBg: 'transparent' },
      { id: 'warm-overlay', name: 'Warm', primary: '#f97316', secondary: '#ef4444', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, rgba(249,115,22,0.8) 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'cover',
      photoSize: 'hero',
      photoStyle: 'cover',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
      hasGradientOverlay: true,
    },
  },

  // 4. MINIMAL — Clean white card floating on dark background.
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean white card on dark background. Elegant simplicity.',
    category: 'minimal',
    previewImage: 'minimal',
    isPremium: false,
    features: ['white-card', 'dark-bg', 'subtle-icons', 'clean-layout'],
    layout: 'minimal',
    colorSchemes: [
      { id: 'teal', name: 'Teal', primary: '#14b8a6', secondary: '#0d9488', accent: '#14b8a6', text: '#1f2937', textSecondary: '#6b7280', background: '#0f172a', cardBg: '#FFFFFF', isFree: true },
      { id: 'purple', name: 'Purple', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#8b5cf6', text: '#1f2937', textSecondary: '#6b7280', background: '#1e1b4b', cardBg: '#FFFFFF' },
      { id: 'rose', name: 'Rose', primary: '#f43f5e', secondary: '#e11d48', accent: '#f43f5e', text: '#1f2937', textSecondary: '#6b7280', background: '#1c1917', cardBg: '#FFFFFF' },
      { id: 'slate', name: 'Slate', primary: '#475569', secondary: '#334155', accent: '#475569', text: '#1f2937', textSecondary: '#6b7280', background: '#0f172a', cardBg: '#FFFFFF' },
      { id: 'blue', name: 'Blue', primary: '#2563eb', secondary: '#3b82f6', accent: '#3b82f6', text: '#1f2937', textSecondary: '#6b7280', background: '#0f172a', cardBg: '#FFFFFF' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'circle',
      buttonStyle: 'pill',
      fontFamily: 'modern',
      showBorder: false,
      hasWhiteCard: true,
    },
  },

  // ============ PREMIUM TEMPLATES ($4.99/mo) ============

  // 5. ELEGANT — Luxury dark theme with ornate gold/silver accents.
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Luxury dark theme with ornate accents. For those who demand the best.',
    category: 'luxury',
    previewImage: 'elegant',
    isPremium: true,
    features: ['ornate-border', 'gold-accents', 'premium-fonts', 'luxury-feel'],
    layout: 'elegant',
    colorSchemes: [
      { id: 'black-gold', name: 'Black & Gold', primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#d4af37', text: '#d4af37', textSecondary: 'rgba(212,175,55,0.8)', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', cardBg: '#0a0a0a', border: '#d4af37' },
      { id: 'navy-gold', name: 'Navy & Gold', primary: '#0f172a', secondary: '#1e293b', accent: '#d4af37', text: '#d4af37', textSecondary: 'rgba(212,175,55,0.8)', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', cardBg: '#0f172a', border: '#d4af37' },
      { id: 'black-silver', name: 'Black & Silver', primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#c0c0c0', text: '#c0c0c0', textSecondary: 'rgba(192,192,192,0.8)', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', cardBg: '#0a0a0a', border: '#c0c0c0' },
      { id: 'burgundy-gold', name: 'Burgundy & Gold', primary: '#450a0a', secondary: '#7f1d1d', accent: '#d4af37', text: '#d4af37', textSecondary: 'rgba(212,175,55,0.8)', background: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)', cardBg: '#450a0a', border: '#d4af37' },
      { id: 'black-rose-gold', name: 'Rose Gold', primary: '#0c0a09', secondary: '#1c1917', accent: '#b76e79', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.75)', background: 'linear-gradient(180deg, #0c0a09 0%, #1c1917 100%)', cardBg: 'transparent', border: '#b76e79' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'ornate',
      buttonStyle: 'outline',
      fontFamily: 'elegant',
      showBorder: true,
      borderStyle: 'ornate',
      hasBannerImage: true,
    },
  },

  // 6. MODERN — Large rounded photo at top, card-style content sections below.
  {
    id: 'modern',
    name: 'Modern',
    description: 'Large photo with card-style sections. Clean and contemporary.',
    category: 'professional',
    previewImage: 'modern',
    isPremium: true,
    features: ['large-photo', 'card-sections', 'modern-layout', 'social-icons'],
    layout: 'modern',
    colorSchemes: [
      { id: 'dark', name: 'Dark', primary: '#18181b', secondary: '#27272a', accent: '#3b82f6', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#09090b', cardBg: '#18181b', border: '#3b82f6' },
      { id: 'light', name: 'Light', primary: '#f8fafc', secondary: '#e2e8f0', accent: '#2563eb', text: '#1f2937', textSecondary: '#6b7280', background: '#f1f5f9', cardBg: '#FFFFFF', border: '#2563eb' },
      { id: 'dark-teal', name: 'Dark Teal', primary: '#18181b', secondary: '#27272a', accent: '#14b8a6', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#09090b', cardBg: '#18181b', border: '#14b8a6' },
      { id: 'dark-gold', name: 'Dark Gold', primary: '#18181b', secondary: '#27272a', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#09090b', cardBg: '#18181b', border: '#d4af37' },
    ],
    layoutConfig: {
      photoPosition: 'top',
      photoSize: 'large',
      photoStyle: 'rounded',
      buttonStyle: 'rounded',
      fontFamily: 'modern',
      showBorder: true,
      borderStyle: 'solid',
      hasBannerImage: true,
    },
  },

  // 7. SPLIT — Photo on left, info on right. Classic business card feel.
  {
    id: 'split',
    name: 'Split',
    description: 'Photo on one side, info on the other. Professional business card style.',
    category: 'professional',
    previewImage: 'split',
    isPremium: true,
    features: ['horizontal-layout', 'business-card', 'contact-info', 'company-logo'],
    layout: 'split',
    colorSchemes: [
      { id: 'corporate-blue', name: 'Corporate Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#1e40af', text: '#1f2937', textSecondary: '#6b7280', background: '#f8fafc', cardBg: '#FFFFFF', border: '#1e40af' },
      { id: 'corporate-green', name: 'Corporate Green', primary: '#166534', secondary: '#22c55e', accent: '#166534', text: '#1f2937', textSecondary: '#6b7280', background: '#f8fafc', cardBg: '#FFFFFF', border: '#166534' },
      { id: 'monochrome', name: 'Monochrome', primary: '#18181b', secondary: '#3f3f46', accent: '#18181b', text: '#1f2937', textSecondary: '#6b7280', background: '#f8fafc', cardBg: '#FFFFFF', border: '#18181b' },
      { id: 'dark-split', name: 'Dark', primary: '#0f172a', secondary: '#1e293b', accent: '#3b82f6', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#020617', cardBg: '#0f172a', border: '#3b82f6' },
    ],
    layoutConfig: {
      photoPosition: 'left',
      photoSize: 'medium',
      photoStyle: 'square',
      buttonStyle: 'rounded',
      fontFamily: 'classic',
      showBorder: true,
      borderStyle: 'solid',
    },
  },

  // 8. NEON — Vibrant neon glow effects for creators and influencers.
  {
    id: 'neon',
    name: 'Neon',
    description: 'Vibrant neon glow effects. Stand out as a creator or influencer.',
    category: 'creative',
    previewImage: 'neon',
    isPremium: true,
    features: ['neon-glow', 'rainbow-ring', 'gradient-bg', 'bold-buttons'],
    layout: 'neon',
    colorSchemes: [
      { id: 'pink-purple', name: 'Pink Purple', primary: '#ec4899', secondary: '#8b5cf6', accent: 'rgba(255,255,255,0.3)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 50%, #1e1b4b 100%)', cardBg: 'transparent' },
      { id: 'cyber', name: 'Cyber', primary: '#06b6d4', secondary: '#8b5cf6', accent: 'rgba(255,255,255,0.3)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #06b6d4 0%, #8b5cf6 50%, #0f172a 100%)', cardBg: 'transparent' },
      { id: 'sunset-neon', name: 'Sunset', primary: '#f97316', secondary: '#ec4899', accent: 'rgba(255,255,255,0.3)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #f97316 0%, #ec4899 50%, #1e1b4b 100%)', cardBg: 'transparent' },
      { id: 'electric', name: 'Electric', primary: '#22d3ee', secondary: '#f472b6', accent: '#a3e635', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #22d3ee 0%, #f472b6 100%)', cardBg: 'rgba(0,0,0,0.3)' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'ornate',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
      hasBannerImage: true,
    },
  },

  // 9. SHOWCASE — Gallery-focused layout with large photo grid.
  {
    id: 'showcase',
    name: 'Showcase',
    description: 'Gallery-focused layout. Perfect for photographers, artists, and portfolios.',
    category: 'creative',
    previewImage: 'showcase',
    isPremium: true,
    features: ['gallery-layout', 'creative-fonts', 'portfolio-links', 'large-photo'],
    layout: 'showcase',
    colorSchemes: [
      { id: 'gallery-white', name: 'Gallery White', primary: '#FFFFFF', secondary: '#f3f4f6', accent: '#1f2937', text: '#1f2937', textSecondary: '#6b7280', background: '#FFFFFF', cardBg: '#f9fafb' },
      { id: 'dark-gallery', name: 'Dark Gallery', primary: '#0a0a0a', secondary: '#171717', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#0a0a0a', cardBg: '#171717' },
      { id: 'warm-gallery', name: 'Warm', primary: '#fef3c7', secondary: '#fde68a', accent: '#78350f', text: '#78350f', textSecondary: '#92400e', background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)', cardBg: 'rgba(255,255,255,0.5)' },
    ],
    layoutConfig: {
      photoPosition: 'top',
      photoSize: 'large',
      photoStyle: 'square',
      buttonStyle: 'outline',
      fontFamily: 'elegant',
      showBorder: true,
      borderStyle: 'solid',
      hasBannerImage: true,
    },
  },

  // 10. EXECUTIVE — Corporate professional with structured layout.
  {
    id: 'executive',
    name: 'Executive',
    description: 'Structured corporate layout. Built for business professionals.',
    category: 'professional',
    previewImage: 'executive',
    isPremium: true,
    features: ['business-layout', 'company-branding', 'contact-cta', 'structured'],
    layout: 'executive',
    colorSchemes: [
      { id: 'navy-white', name: 'Navy & White', primary: '#1e3a5f', secondary: '#2d5a87', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)', cardBg: 'transparent' },
      { id: 'charcoal', name: 'Charcoal', primary: '#374151', secondary: '#4b5563', accent: '#10b981', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #374151 0%, #4b5563 100%)', cardBg: 'transparent' },
      { id: 'burgundy', name: 'Burgundy', primary: '#7f1d1d', secondary: '#991b1b', accent: '#fcd34d', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 100%)', cardBg: 'transparent' },
      { id: 'slate', name: 'Slate', primary: '#1e293b', secondary: '#334155', accent: '#f8fafc', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'top',
      photoSize: 'small',
      photoStyle: 'circle',
      buttonStyle: 'rounded',
      fontFamily: 'executive',
      showBorder: false,
      hasBannerImage: true,
    },
  },

  // ============ PRO-ONLY TEMPLATES ============

  // 11. PRO CONTRACTOR — For handymen, plumbers, electricians, etc.
  {
    id: 'pro-contractor',
    name: 'Contractor Pro',
    description: 'Built for service professionals. Show credentials, reviews, and booking.',
    category: 'professional',
    previewImage: 'pro-contractor',
    isPremium: false,
    isProOnly: true,
    proCategories: ['handyman', 'plumber', 'electrician', 'hvac', 'contractor', 'painter', 'landscaper', 'cleaner'],
    features: ['badge-area', 'review-section', 'booking-link', 'credential-badges', 'service-area'],
    layout: 'banner',
    colorSchemes: [
      { id: 'blue-trust', name: 'Trust Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#fbbf24', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', cardBg: 'transparent', border: '#fbbf24' },
      { id: 'green-pro', name: 'Pro Green', primary: '#166534', secondary: '#22c55e', accent: '#fef08a', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)', cardBg: 'transparent', border: '#fef08a' },
      { id: 'orange-energy', name: 'Energy Orange', primary: '#c2410c', secondary: '#f97316', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #c2410c 0%, #f97316 100%)', cardBg: 'transparent', border: '#FFFFFF' },
      { id: 'dark-premium', name: 'Dark Premium', primary: '#0a0a0a', secondary: '#171717', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.75)', background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)', cardBg: 'transparent', border: '#d4af37' },
    ],
    layoutConfig: {
      photoPosition: 'banner-overlap',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'pill',
      fontFamily: 'modern',
      showBorder: true,
      borderStyle: 'accent',
      hasBannerImage: true,
    },
  },

  // 12. PRO REALTOR — For real estate professionals.
  {
    id: 'pro-realtor',
    name: 'Realtor Pro',
    description: 'Designed for real estate agents. Showcase listings and credentials.',
    category: 'professional',
    previewImage: 'pro-realtor',
    isPremium: false,
    isProOnly: true,
    proCategories: ['realtor', 'real-estate', 'property-manager', 'mortgage-broker'],
    features: ['property-links', 'contact-cta', 'professional-layout', 'credential-badges'],
    layout: 'bold',
    colorSchemes: [
      { id: 'luxury-gold', name: 'Luxury Gold', primary: '#1f2937', secondary: '#374151', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #1f2937 0%, #374151 100%)', cardBg: 'transparent', border: '#d4af37' },
      { id: 'modern-blue', name: 'Modern Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #1e40af 0%, #3b82f6 100%)', cardBg: 'transparent' },
      { id: 'earth-tones', name: 'Earth Tones', primary: '#78350f', secondary: '#92400e', accent: '#fef3c7', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(180deg, #78350f 0%, #92400e 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'cover',
      photoSize: 'hero',
      photoStyle: 'cover',
      buttonStyle: 'rounded',
      fontFamily: 'classic',
      showBorder: false,
      hasGradientOverlay: true,
      hasBannerImage: true,
    },
  },

  // 13. PRO CREATIVE — For photographers, designers, artists.
  {
    id: 'pro-creative',
    name: 'Creative Pro',
    description: 'Portfolio-style for creative professionals. Gallery-first design.',
    category: 'creative',
    previewImage: 'pro-creative',
    isPremium: false,
    isProOnly: true,
    proCategories: ['photographer', 'designer', 'artist', 'videographer', 'content-creator'],
    features: ['gallery-layout', 'portfolio-links', 'creative-fonts', 'showcase'],
    layout: 'showcase',
    colorSchemes: [
      { id: 'dark-gallery', name: 'Dark Gallery', primary: '#0a0a0a', secondary: '#171717', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#0a0a0a', cardBg: '#171717' },
      { id: 'light-gallery', name: 'Light Gallery', primary: '#FFFFFF', secondary: '#f3f4f6', accent: '#1f2937', text: '#1f2937', textSecondary: '#6b7280', background: '#FFFFFF', cardBg: '#f9fafb' },
      { id: 'warm-gallery', name: 'Warm', primary: '#fef3c7', secondary: '#fde68a', accent: '#78350f', text: '#78350f', textSecondary: '#92400e', background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)', cardBg: 'rgba(255,255,255,0.5)' },
    ],
    layoutConfig: {
      photoPosition: 'top',
      photoSize: 'large',
      photoStyle: 'rounded',
      buttonStyle: 'outline',
      fontFamily: 'elegant',
      showBorder: true,
      borderStyle: 'solid',
      hasBannerImage: true,
    },
  },
];

// Multi-page subscription price ID (to be set from Stripe)
export const MULTI_PAGE_PRICE_ID = 'price_XXXXXX'; // Replace with actual Stripe price ID

// Helper functions
export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

export const getFreeTemplates = (): Template[] => {
  return TEMPLATES.filter(t => !t.isPremium && !t.isProOnly);
};

export const getPremiumTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.isPremium && !t.isProOnly);
};

export const getProOnlyTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.isProOnly === true);
};

export const getTemplatesForUser = (isPro: boolean, hasPremiumSubscription: boolean): Template[] => {
  return TEMPLATES.filter(t => {
    if (t.isProOnly) return isPro;
    if (t.isPremium) return hasPremiumSubscription;
    return true;
  });
};

export const getProTemplatesByCategory = (proCategory: string): Template[] => {
  return TEMPLATES.filter(t => t.isProOnly && t.proCategories?.includes(proCategory));
};

export const getTemplatesByCategory = (category: Template['category']): Template[] => {
  return TEMPLATES.filter(t => t.category === category);
};

export const getColorSchemeById = (templateId: string, colorSchemeId: string): ColorScheme | undefined => {
  const template = getTemplateById(templateId);
  return template?.colorSchemes.find(cs => cs.id === colorSchemeId);
};

// Template ID migration map: old template IDs -> new template IDs
// This ensures existing cards don't break when we switch to the new system
export const TEMPLATE_MIGRATION_MAP: Record<string, string> = {
  // Old free templates -> new equivalents
  'classic-blue': 'classic',
  'minimal-white': 'minimal',
  'creator': 'classic',
  'kids-fun': 'classic',
  'modern-professional': 'minimal',
  'business-card': 'split',
  'gradient-wave': 'classic',
  'photo-focus': 'bold',
  // Old premium templates -> new equivalents
  'neon-creator': 'neon',
  'luxury-gold': 'elegant',
  'dark-pro': 'modern',
  'fun-colorful': 'classic',
  'social-star': 'neon',
  'elegant-script': 'elegant',
  'corporate': 'executive',
  'artist-portfolio': 'showcase',
  'music-artist': 'neon',
  'real-estate': 'bold',
  'fitness-coach': 'bold',
  'restaurant': 'banner',
  'startup': 'modern',
  'event-planner': 'banner',
  // Old pro templates -> new equivalents
  'pro-service-trust': 'pro-contractor',
  'pro-portfolio-showcase': 'pro-creative',
  'pro-booking-focused': 'pro-contractor',
  'pro-energy-impact': 'pro-contractor',
  'pro-dark-premium': 'elegant',
};

// Resolve a template ID (handles migration from old IDs)
export const resolveTemplateId = (id: string): string => {
  return TEMPLATE_MIGRATION_MAP[id] || id;
};

// Get a template by ID with migration support
export const getTemplateByIdWithMigration = (id: string): Template | undefined => {
  const resolvedId = resolveTemplateId(id);
  return getTemplateById(resolvedId);
};

export default TEMPLATES;
