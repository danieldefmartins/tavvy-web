// Tavvy eCard Templates Configuration v3.0
// 8 real layout-based templates: 3 free + 5 paid (pro/premium)
// Step 1: Choose template layout
// Step 2: Choose color/style variation
// Step 3: Card editor

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  background: string;
  cardBg: string;
  border?: string;
  isFree?: boolean;
}

export type TemplateLayout =
  | 'basic'          // Linktree-style: circle photo, name, stacked link buttons
  | 'blogger'        // Soft/creative: large photo with card cutout, script name, pastel buttons
  | 'business-card'  // Corporate split: dark top with info + photo, light bottom with contacts
  | 'full-width'     // Hero photo with gradient overlay, name on photo, premium feel
  | 'pro-realtor'    // Arch photo, intro text, link buttons with accent tabs
  | 'pro-creative'   // Bold colored top, wave divider, logo badge, contact rows
  | 'pro-corporate'  // Company logo top, structured professional layout
  | 'pro-card';      // Banner + industry + services grid + service area

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'free' | 'paid';
  previewImage: string;
  isPremium: boolean;
  features: string[];
  layout: TemplateLayout;
  colorSchemes: ColorScheme[];
  layoutConfig: {
    photoPosition: 'top' | 'left' | 'right' | 'center' | 'cover' | 'banner-overlap' | 'arch';
    photoSize: 'small' | 'medium' | 'large' | 'cover' | 'hero';
    photoStyle: 'circle' | 'rounded' | 'square' | 'ornate' | 'cover' | 'arch' | 'cutout';
    buttonStyle: 'rounded' | 'pill' | 'square' | 'outline' | 'frosted' | 'minimal' | 'flat' | 'accent-tab';
    fontFamily: 'modern' | 'classic' | 'elegant' | 'script' | 'executive';
    showBorder: boolean;
    borderStyle?: 'solid' | 'ornate' | 'gradient' | 'accent';
    hasBannerImage?: boolean;
    hasGradientOverlay?: boolean;
    hasWhiteCard?: boolean;
    hasSplitLayout?: boolean;
    hasWaveDivider?: boolean;
    hasIndustrySection?: boolean;
    hasServicesGrid?: boolean;
    hasServiceArea?: boolean;
  };
}

export const TEMPLATES: Template[] = [
  // ============ FREE TEMPLATES (3) ============

  // 1. BASIC TAVVY eCARD — Linktree-style link page
  {
    id: 'basic',
    name: 'Basic Tavvy eCard',
    description: 'Simple link-in-bio style. Profile photo, name, and stacked link buttons.',
    category: 'free',
    previewImage: 'basic',
    isPremium: false,
    features: ['circle-photo', 'link-buttons', 'social-icons', 'clean-layout'],
    layout: 'basic',
    colorSchemes: [
      // Classic light
      { id: 'light', name: 'Light', primary: '#FFFFFF', secondary: '#f5f5f5', accent: '#2d3436', text: '#2d3436', textSecondary: '#636e72', background: '#FFFFFF', cardBg: '#FFFFFF', isFree: true },
      // Dark
      { id: 'dark', name: 'Dark', primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#1a1a2e', cardBg: '#1a1a2e', isFree: true },
      // Tavvy Green
      { id: 'tavvy-green', name: 'Tavvy Green', primary: '#00C853', secondary: '#00E676', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(165deg, #00C853 0%, #00E676 50%, #004D40 100%)', cardBg: 'transparent', isFree: true },
      // Ocean Blue
      { id: 'ocean', name: 'Ocean Blue', primary: '#1E90FF', secondary: '#00BFFF', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #1E90FF 0%, #00BFFF 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      // Sunset
      { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#ec4899', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #f97316 0%, #ec4899 50%, #1a1a2e 100%)', cardBg: 'transparent' },
      // Purple
      { id: 'purple', name: 'Purple', primary: '#581c87', secondary: '#9333ea', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #581c87 0%, #9333ea 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      // Emerald
      { id: 'emerald', name: 'Emerald', primary: '#065f46', secondary: '#10b981', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #065f46 0%, #10b981 50%, #0a0f1e 100%)', cardBg: 'transparent' },
      // Coral
      { id: 'coral', name: 'Coral', primary: '#fb7185', secondary: '#f43f5e', accent: 'rgba(255,255,255,0.2)', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: 'linear-gradient(165deg, #fb7185 0%, #f43f5e 50%, #1a1a2e 100%)', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'circle',
      buttonStyle: 'rounded',
      fontFamily: 'modern',
      showBorder: false,
    },
  },

  // 2. BLOGGER eCARD — Soft/creative with script font
  {
    id: 'blogger',
    name: 'Blogger eCard',
    description: 'Elegant creative style. Script name, soft colors, perfect for personal brands.',
    category: 'free',
    previewImage: 'blogger',
    isPremium: false,
    features: ['script-font', 'card-cutout', 'pastel-buttons', 'creative-layout'],
    layout: 'blogger',
    colorSchemes: [
      // Blush Pink
      { id: 'blush', name: 'Blush Pink', primary: '#f8e8ee', secondary: '#fce4ec', accent: '#d4a0a0', text: '#2d2d2d', textSecondary: '#666666', background: '#f8e8ee', cardBg: '#FFFFFF', isFree: true },
      // Lavender
      { id: 'lavender', name: 'Lavender', primary: '#e8e0f0', secondary: '#ede7f6', accent: '#9575cd', text: '#2d2d2d', textSecondary: '#666666', background: '#e8e0f0', cardBg: '#FFFFFF', isFree: true },
      // Sage
      { id: 'sage', name: 'Sage', primary: '#e0ebe0', secondary: '#e8f5e9', accent: '#81a784', text: '#2d2d2d', textSecondary: '#666666', background: '#e0ebe0', cardBg: '#FFFFFF', isFree: true },
      // Cream
      { id: 'cream', name: 'Cream', primary: '#faf0e6', secondary: '#fff8e1', accent: '#c8a87c', text: '#2d2d2d', textSecondary: '#666666', background: '#faf0e6', cardBg: '#FFFFFF' },
      // Sky
      { id: 'sky', name: 'Sky Blue', primary: '#e0f0ff', secondary: '#e3f2fd', accent: '#64b5f6', text: '#2d2d2d', textSecondary: '#666666', background: '#e0f0ff', cardBg: '#FFFFFF' },
      // Peach
      { id: 'peach', name: 'Peach', primary: '#fde8d8', secondary: '#fff3e0', accent: '#e8a87c', text: '#2d2d2d', textSecondary: '#666666', background: '#fde8d8', cardBg: '#FFFFFF' },
      // Dark Elegant
      { id: 'dark-elegant', name: 'Dark Elegant', primary: '#1a1a2e', secondary: '#16213e', accent: '#d4a0a0', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)', background: '#1a1a2e', cardBg: 'rgba(255,255,255,0.05)' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'cutout',
      buttonStyle: 'flat',
      fontFamily: 'script',
      showBorder: false,
      hasWhiteCard: true,
    },
  },

  // 3. TAVVY BUSINESS CARD — Real digital business card
  {
    id: 'business-card',
    name: 'Tavvy Business Card',
    description: 'A real digital business card. Company logo, contact info, professional layout.',
    category: 'free',
    previewImage: 'business-card',
    isPremium: false,
    features: ['company-logo', 'split-layout', 'contact-rows', 'decorative-ring', 'add-to-contacts'],
    layout: 'business-card',
    colorSchemes: [
      // Navy & Gold
      { id: 'navy-gold', name: 'Navy & Gold', primary: '#0c1b3a', secondary: '#1a2d5a', accent: '#d4af37', text: '#d4af37', textSecondary: 'rgba(212,175,55,0.8)', background: '#0c1b3a', cardBg: '#f8f9fa', border: '#d4af37', isFree: true },
      // Charcoal & Silver
      { id: 'charcoal-silver', name: 'Charcoal & Silver', primary: '#1f1f1f', secondary: '#333333', accent: '#c0c0c0', text: '#c0c0c0', textSecondary: 'rgba(192,192,192,0.8)', background: '#1f1f1f', cardBg: '#f8f9fa', border: '#c0c0c0', isFree: true },
      // White & Blue
      { id: 'white-blue', name: 'White & Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#1e40af', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#1e40af', cardBg: '#FFFFFF', border: '#1e40af', isFree: true },
      // Black & Rose Gold
      { id: 'black-rosegold', name: 'Black & Rose Gold', primary: '#0c0a09', secondary: '#1c1917', accent: '#b76e79', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.75)', background: '#0c0a09', cardBg: '#f8f9fa', border: '#b76e79' },
      // Forest & Cream
      { id: 'forest-cream', name: 'Forest & Cream', primary: '#1a3c2a', secondary: '#2d5a3f', accent: '#d4c5a0', text: '#d4c5a0', textSecondary: 'rgba(212,197,160,0.8)', background: '#1a3c2a', cardBg: '#faf8f0', border: '#d4c5a0' },
      // Burgundy & Gold
      { id: 'burgundy-gold', name: 'Burgundy & Gold', primary: '#450a0a', secondary: '#7f1d1d', accent: '#d4af37', text: '#d4af37', textSecondary: 'rgba(212,175,55,0.8)', background: '#450a0a', cardBg: '#f8f9fa', border: '#d4af37' },
    ],
    layoutConfig: {
      photoPosition: 'right',
      photoSize: 'large',
      photoStyle: 'ornate',
      buttonStyle: 'rounded',
      fontFamily: 'executive',
      showBorder: true,
      borderStyle: 'ornate',
      hasSplitLayout: true,
    },
  },

  // ============ PAID / PRO TEMPLATES (5) ============

  // 4. FULL WIDTH PREMIUM — Hero photo with gradient overlay
  {
    id: 'full-width',
    name: 'Full Width Premium',
    description: 'Full-screen hero photo with your name overlaid. Bold and premium.',
    category: 'paid',
    previewImage: 'full-width',
    isPremium: true,
    features: ['hero-photo', 'gradient-overlay', 'text-on-image', 'about-me-card', 'company-logo', 'action-icons'],
    layout: 'full-width',
    colorSchemes: [
      // Dark (B&W photo feel)
      { id: 'dark', name: 'Dark', primary: '#000000', secondary: '#1a1a1a', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: '#0a0a0a', cardBg: '#1a1a1a', isFree: false },
      // Blue
      { id: 'blue', name: 'Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, #1e40af 100%)', cardBg: '#0f172a' },
      // Purple
      { id: 'purple', name: 'Purple', primary: '#581c87', secondary: '#9333ea', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, #581c87 100%)', cardBg: '#1e1b4b' },
      // Warm
      { id: 'warm', name: 'Warm', primary: '#7c2d12', secondary: '#c2410c', accent: '#fef3c7', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, #7c2d12 100%)', cardBg: '#451a03' },
      // Emerald
      { id: 'emerald', name: 'Emerald', primary: '#065f46', secondary: '#10b981', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, #065f46 100%)', cardBg: '#022c22' },
      // Navy & Gold
      { id: 'navy-gold', name: 'Navy & Gold', primary: '#0f172a', secondary: '#1e293b', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: 'linear-gradient(to bottom, transparent 0%, #0f172a 100%)', cardBg: '#0f172a', border: '#d4af37' },
    ],
    layoutConfig: {
      photoPosition: 'cover',
      photoSize: 'hero',
      photoStyle: 'cover',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
      hasGradientOverlay: true,
      hasBannerImage: true,
    },
  },

  // 5. PROS: REALTOR — Arch photo, intro text, link buttons
  {
    id: 'pro-realtor',
    name: 'Pros: Realtor',
    description: 'Arch-framed photo with intro text. Perfect for realtors and agents.',
    category: 'paid',
    previewImage: 'pro-realtor',
    isPremium: true,
    features: ['arch-photo', 'intro-text', 'accent-tab-buttons', 'social-icons', 'company-name'],
    layout: 'pro-realtor',
    colorSchemes: [
      // Warm Neutral
      { id: 'warm-neutral', name: 'Warm Neutral', primary: '#f5f0eb', secondary: '#ede5db', accent: '#c8a87c', text: '#2d2d2d', textSecondary: '#666666', background: '#f5f0eb', cardBg: '#FFFFFF', border: '#c8a87c', isFree: false },
      // Navy Professional
      { id: 'navy', name: 'Navy', primary: '#0f172a', secondary: '#1e293b', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: '#0f172a', cardBg: 'rgba(255,255,255,0.05)', border: '#d4af37' },
      // Forest
      { id: 'forest', name: 'Forest', primary: '#1a3c2a', secondary: '#2d5a3f', accent: '#d4c5a0', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: '#1a3c2a', cardBg: 'rgba(255,255,255,0.05)', border: '#d4c5a0' },
      // Modern White
      { id: 'modern-white', name: 'Modern White', primary: '#FFFFFF', secondary: '#f8f9fa', accent: '#1e40af', text: '#1f2937', textSecondary: '#6b7280', background: '#FFFFFF', cardBg: '#f8f9fa', border: '#1e40af' },
      // Burgundy
      { id: 'burgundy', name: 'Burgundy', primary: '#450a0a', secondary: '#7f1d1d', accent: '#fef3c7', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.8)', background: '#450a0a', cardBg: 'rgba(255,255,255,0.05)', border: '#fef3c7' },
    ],
    layoutConfig: {
      photoPosition: 'arch',
      photoSize: 'large',
      photoStyle: 'arch',
      buttonStyle: 'accent-tab',
      fontFamily: 'elegant',
      showBorder: false,
      hasBannerImage: true,
    },
  },

  // 6. PROS: CREATIVE — Bold colored top, wave divider, contact rows
  {
    id: 'pro-creative',
    name: 'Pros: Creative',
    description: 'Bold colors with wave divider. Great for consultants and creatives.',
    category: 'paid',
    previewImage: 'pro-creative',
    isPremium: true,
    features: ['wave-divider', 'logo-badge', 'contact-rows', 'colored-icons', 'bold-colors'],
    layout: 'pro-creative',
    colorSchemes: [
      // Purple & Orange
      { id: 'purple-orange', name: 'Purple & Orange', primary: '#6b21a8', secondary: '#7c3aed', accent: '#f97316', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#6b21a8', cardBg: '#FFFFFF', border: '#f97316', isFree: false },
      // Blue & Teal
      { id: 'blue-teal', name: 'Blue & Teal', primary: '#1e40af', secondary: '#3b82f6', accent: '#14b8a6', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#1e40af', cardBg: '#FFFFFF', border: '#14b8a6' },
      // Red & Gold
      { id: 'red-gold', name: 'Red & Gold', primary: '#991b1b', secondary: '#dc2626', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#991b1b', cardBg: '#FFFFFF', border: '#d4af37' },
      // Dark & Neon
      { id: 'dark-neon', name: 'Dark & Neon', primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#22d3ee', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#0a0a0a', cardBg: '#1a1a1a', border: '#22d3ee' },
      // Green & White
      { id: 'green-white', name: 'Green & White', primary: '#166534', secondary: '#22c55e', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#166534', cardBg: '#FFFFFF', border: '#22c55e' },
    ],
    layoutConfig: {
      photoPosition: 'top',
      photoSize: 'large',
      photoStyle: 'rounded',
      buttonStyle: 'rounded',
      fontFamily: 'modern',
      showBorder: false,
      hasWaveDivider: true,
    },
  },

  // 7. PROS: CORPORATE — Company logo top, structured layout
  {
    id: 'pro-corporate',
    name: 'Pros: Corporate',
    description: 'Structured corporate layout. Company logo, action icons, about section.',
    category: 'paid',
    previewImage: 'pro-corporate',
    isPremium: true,
    features: ['company-logo', 'action-icons', 'about-section', 'structured-layout', 'pronouns'],
    layout: 'pro-corporate',
    colorSchemes: [
      // Navy Blue
      { id: 'navy', name: 'Navy Blue', primary: '#1e3a5f', secondary: '#2d5a87', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#1e3a5f', cardBg: 'transparent', isFree: false },
      // Charcoal
      { id: 'charcoal', name: 'Charcoal', primary: '#374151', secondary: '#4b5563', accent: '#10b981', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#374151', cardBg: 'transparent' },
      // Burgundy
      { id: 'burgundy', name: 'Burgundy', primary: '#7f1d1d', secondary: '#991b1b', accent: '#fcd34d', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#7f1d1d', cardBg: 'transparent' },
      // Slate
      { id: 'slate', name: 'Slate', primary: '#1e293b', secondary: '#334155', accent: '#f8fafc', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#1e293b', cardBg: 'transparent' },
      // Royal Blue
      { id: 'royal', name: 'Royal Blue', primary: '#1e40af', secondary: '#2563eb', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.85)', background: '#1e40af', cardBg: 'transparent' },
    ],
    layoutConfig: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'circle',
      buttonStyle: 'outline',
      fontFamily: 'executive',
      showBorder: false,
    },
  },

  // 8. TAVVY PRO CARD — Banner + industry + services + service area
  {
    id: 'pro-card',
    name: 'Tavvy Pro Card',
    description: 'The ultimate pro card. Industry, services, service area — all in one.',
    category: 'paid',
    previewImage: 'pro-card',
    isPremium: true,
    features: ['banner-image', 'industry-section', 'services-grid', 'service-area', 'action-icons', 'add-to-contacts'],
    layout: 'pro-card',
    colorSchemes: [
      // Trust Blue
      { id: 'trust-blue', name: 'Trust Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#fbbf24', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', cardBg: '#FFFFFF', border: '#fbbf24', isFree: false },
      // Pro Green
      { id: 'pro-green', name: 'Pro Green', primary: '#166534', secondary: '#22c55e', accent: '#fef08a', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)', cardBg: '#FFFFFF', border: '#fef08a' },
      // Dark Pro
      { id: 'dark-pro', name: 'Dark Pro', primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#00C853', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: '#0a0a0a', cardBg: '#1a1a1a', border: '#00C853' },
      // Orange Energy
      { id: 'orange-energy', name: 'Energy Orange', primary: '#c2410c', secondary: '#f97316', accent: '#FFFFFF', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #c2410c 0%, #f97316 100%)', cardBg: '#FFFFFF', border: '#FFFFFF' },
      // Navy & Gold
      { id: 'navy-gold', name: 'Navy & Gold', primary: '#0f172a', secondary: '#1e293b', accent: '#d4af37', text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.9)', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', cardBg: '#FFFFFF', border: '#d4af37' },
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
      hasIndustrySection: true,
      hasServicesGrid: true,
      hasServiceArea: true,
    },
  },
];

// Helper functions
export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

export const getFreeTemplates = (): Template[] => {
  return TEMPLATES.filter(t => !t.isPremium);
};

export const getPaidTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.isPremium);
};

export const getTemplatesForUser = (hasPaidSubscription: boolean): Template[] => {
  if (hasPaidSubscription) return TEMPLATES;
  return TEMPLATES; // Show all, but lock paid ones in UI
};

export const getColorSchemeById = (templateId: string, colorSchemeId: string): ColorScheme | undefined => {
  const template = getTemplateById(templateId);
  return template?.colorSchemes.find(cs => cs.id === colorSchemeId);
};

// Template ID migration map: old template IDs -> new template IDs
// This ensures existing cards don't break when we switch to the new system
export const TEMPLATE_MIGRATION_MAP: Record<string, string> = {
  // Old v1 templates -> new equivalents
  'classic-blue': 'basic',
  'classic': 'basic',
  'minimal-white': 'basic',
  'minimal': 'basic',
  'creator': 'blogger',
  'kids-fun': 'basic',
  'modern-professional': 'business-card',
  'business-card': 'business-card',
  'gradient-wave': 'basic',
  'photo-focus': 'full-width',
  'bold': 'full-width',
  'banner': 'blogger',
  // Old premium -> new equivalents
  'neon-creator': 'full-width',
  'neon': 'full-width',
  'luxury-gold': 'business-card',
  'elegant': 'business-card',
  'dark-pro': 'full-width',
  'modern': 'full-width',
  'fun-colorful': 'basic',
  'social-star': 'blogger',
  'elegant-script': 'blogger',
  'corporate': 'pro-corporate',
  'executive': 'pro-corporate',
  'artist-portfolio': 'pro-creative',
  'showcase': 'pro-creative',
  'music-artist': 'full-width',
  'real-estate': 'pro-realtor',
  'fitness-coach': 'full-width',
  'restaurant': 'blogger',
  'startup': 'pro-corporate',
  'split': 'business-card',
  // Old pro templates
  'pro-service-trust': 'pro-card',
  'pro-portfolio-showcase': 'pro-creative',
  'pro-booking-focused': 'pro-card',
  'pro-energy-impact': 'pro-card',
  'pro-dark-premium': 'full-width',
  'pro-contractor': 'pro-card',
};

// Resolve a template ID (handles migration from old IDs)
export const resolveTemplateId = (id: string): string => {
  // If the ID directly matches a current template, use it
  if (TEMPLATES.find(t => t.id === id)) return id;
  // Otherwise check migration map
  return TEMPLATE_MIGRATION_MAP[id] || 'basic';
};

// Get a template by ID with migration support
export const getTemplateByIdWithMigration = (id: string): Template | undefined => {
  const resolvedId = resolveTemplateId(id);
  return getTemplateById(resolvedId);
};

export default TEMPLATES;
