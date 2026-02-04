// Font configurations - 50+ options (8 free, rest premium)
export interface FontConfig {
  id: string;
  name: string;
  style: {
    fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    letterSpacing?: number;
    lineHeight?: number;
  };
  preview: string;
  isPremium: boolean;
}

export const FONTS: FontConfig[] = [
  // Free fonts (8)
  { id: 'default', name: 'Default', style: {}, preview: 'Aa', isPremium: false },
  { id: 'modern', name: 'Modern', style: { fontWeight: '300' }, preview: 'Aa', isPremium: false },
  { id: 'classic', name: 'Classic', style: { fontStyle: 'italic' }, preview: 'Aa', isPremium: false },
  { id: 'bold', name: 'Bold', style: { fontWeight: '900' }, preview: 'Aa', isPremium: false },
  { id: 'light', name: 'Light', style: { fontWeight: '200' }, preview: 'Aa', isPremium: false },
  { id: 'medium', name: 'Medium', style: { fontWeight: '500' }, preview: 'Aa', isPremium: false },
  { id: 'semibold', name: 'Semi Bold', style: { fontWeight: '600' }, preview: 'Aa', isPremium: false },
  { id: 'extrabold', name: 'Extra Bold', style: { fontWeight: '800' }, preview: 'Aa', isPremium: false },
  
  // Premium fonts (42+)
  { id: 'thin', name: 'Thin', style: { fontWeight: '100' }, preview: 'Aa', isPremium: true },
  { id: 'ultralight', name: 'Ultra Light', style: { fontWeight: '200', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'condensed', name: 'Condensed', style: { letterSpacing: -1 }, preview: 'Aa', isPremium: true },
  { id: 'expanded', name: 'Expanded', style: { letterSpacing: 3 }, preview: 'Aa', isPremium: true },
  { id: 'elegant', name: 'Elegant', style: { fontStyle: 'italic', fontWeight: '300' }, preview: 'Aa', isPremium: true },
  { id: 'script', name: 'Script', style: { fontStyle: 'italic', fontWeight: '400' }, preview: 'Aa', isPremium: true },
  { id: 'display', name: 'Display', style: { fontWeight: '700', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'headline', name: 'Headline', style: { fontWeight: '800', letterSpacing: -0.5 }, preview: 'Aa', isPremium: true },
  { id: 'poster', name: 'Poster', style: { fontWeight: '900', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'caption', name: 'Caption', style: { fontWeight: '400', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'body', name: 'Body', style: { fontWeight: '400', lineHeight: 24 }, preview: 'Aa', isPremium: true },
  { id: 'title', name: 'Title', style: { fontWeight: '600', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'subtitle', name: 'Subtitle', style: { fontWeight: '500', fontStyle: 'italic' }, preview: 'Aa', isPremium: true },
  { id: 'mono', name: 'Mono', style: { letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'rounded', name: 'Rounded', style: { fontWeight: '500' }, preview: 'Aa', isPremium: true },
  { id: 'sharp', name: 'Sharp', style: { fontWeight: '600', letterSpacing: -1 }, preview: 'Aa', isPremium: true },
  { id: 'soft', name: 'Soft', style: { fontWeight: '300', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'strong', name: 'Strong', style: { fontWeight: '700' }, preview: 'Aa', isPremium: true },
  { id: 'delicate', name: 'Delicate', style: { fontWeight: '200', fontStyle: 'italic' }, preview: 'Aa', isPremium: true },
  { id: 'handwritten', name: 'Handwritten', style: { fontStyle: 'italic', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'brush', name: 'Brush', style: { fontWeight: '600', fontStyle: 'italic' }, preview: 'Aa', isPremium: true },
  { id: 'marker', name: 'Marker', style: { fontWeight: '700', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'chalk', name: 'Chalk', style: { fontWeight: '400', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'neon', name: 'Neon', style: { fontWeight: '500', letterSpacing: 3 }, preview: 'Aa', isPremium: true },
  { id: 'retro', name: 'Retro', style: { fontWeight: '700', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'vintage', name: 'Vintage', style: { fontStyle: 'italic', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'futuristic', name: 'Futuristic', style: { fontWeight: '300', letterSpacing: 4 }, preview: 'Aa', isPremium: true },
  { id: 'minimalFont', name: 'Minimal', style: { fontWeight: '200', letterSpacing: 3 }, preview: 'Aa', isPremium: true },
  { id: 'luxe', name: 'Luxe', style: { fontWeight: '400', letterSpacing: 4 }, preview: 'Aa', isPremium: true },
  { id: 'editorial', name: 'Editorial', style: { fontWeight: '500', fontStyle: 'italic' }, preview: 'Aa', isPremium: true },
  { id: 'magazine', name: 'Magazine', style: { fontWeight: '600', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'newspaper', name: 'Newspaper', style: { fontWeight: '400', letterSpacing: 0 }, preview: 'Aa', isPremium: true },
  { id: 'book', name: 'Book', style: { fontWeight: '400', lineHeight: 26 }, preview: 'Aa', isPremium: true },
  { id: 'novel', name: 'Novel', style: { fontStyle: 'italic', lineHeight: 24 }, preview: 'Aa', isPremium: true },
  { id: 'tech', name: 'Tech', style: { fontWeight: '500', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'startup', name: 'Startup', style: { fontWeight: '600', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'corporate', name: 'Corporate', style: { fontWeight: '500', letterSpacing: 0 }, preview: 'Aa', isPremium: true },
  { id: 'creative', name: 'Creative', style: { fontWeight: '400', fontStyle: 'italic', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'artistic', name: 'Artistic', style: { fontWeight: '300', fontStyle: 'italic', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'playful', name: 'Playful', style: { fontWeight: '600', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'serious', name: 'Serious', style: { fontWeight: '700', letterSpacing: -0.5 }, preview: 'Aa', isPremium: true },
  { id: 'casual', name: 'Casual', style: { fontWeight: '400', letterSpacing: 0.5 }, preview: 'Aa', isPremium: true },
  { id: 'formal', name: 'Formal', style: { fontWeight: '500', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'sporty', name: 'Sporty', style: { fontWeight: '800', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'fashion', name: 'Fashion', style: { fontWeight: '300', letterSpacing: 4 }, preview: 'Aa', isPremium: true },
  { id: 'beauty', name: 'Beauty', style: { fontWeight: '400', fontStyle: 'italic', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'wellness', name: 'Wellness', style: { fontWeight: '300', letterSpacing: 2 }, preview: 'Aa', isPremium: true },
  { id: 'organic', name: 'Organic', style: { fontWeight: '400', letterSpacing: 1 }, preview: 'Aa', isPremium: true },
  { id: 'natural', name: 'Natural', style: { fontWeight: '400', fontStyle: 'italic' }, preview: 'Aa', isPremium: true },
];

// Get free fonts only
export const FREE_FONTS = FONTS.filter(f => !f.isPremium);

// Get premium fonts only
export const PREMIUM_FONTS = FONTS.filter(f => f.isPremium);

// Total font count
export const TOTAL_FONT_COUNT = FONTS.length;
export const FREE_FONT_COUNT = FREE_FONTS.length;
export const PREMIUM_FONT_COUNT = PREMIUM_FONTS.length;
