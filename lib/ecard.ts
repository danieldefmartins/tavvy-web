/**
 * eCard Library - Data fetching and management functions
 * Ported from tavvy-mobile eCard implementation
 */

import { supabase } from './supabaseClient';

// Types
export interface CardData {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  title: string;
  company: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
  bio?: string;
  profile_photo_url?: string;
  profile_photo_size?: string;
  gradient_color_1: string;
  gradient_color_2: string;
  theme?: string;
  background_type?: string;
  background_image_url?: string;
  background_video_url?: string;
  button_style?: string;
  font_style?: string;
  view_count?: number;
  tap_count?: number;
  is_published?: boolean;
  form_block?: any;
  gallery_images?: GalleryImage[];
  pro_credentials?: ProCredentials;
  review_count?: number;
  review_rating?: number;
  industry_icons?: IndustryIcon[];
  youtube_video_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LinkItem {
  id: string;
  card_id?: string;
  platform: string;
  title?: string;
  url: string;
  value?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  clicks?: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface ProCredentials {
  isLicensed: boolean;
  licenseNumber?: string;
  isInsured: boolean;
  isBonded: boolean;
  isTavvyVerified: boolean;
  yearsInBusiness?: number;
  serviceArea?: string;
}

export interface IndustryIcon {
  id: string;
  icon: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
}

export interface FeaturedSocial {
  platformId: string;
  url: string;
}

// Platform icons mapping
export const PLATFORM_ICONS: Record<string, { icon: string; color: string; bgColor: string }> = {
  instagram: { icon: 'logo-instagram', color: '#fff', bgColor: '#E4405F' },
  tiktok: { icon: 'logo-tiktok', color: '#fff', bgColor: '#000000' },
  youtube: { icon: 'logo-youtube', color: '#fff', bgColor: '#FF0000' },
  twitter: { icon: 'logo-twitter', color: '#fff', bgColor: '#1DA1F2' },
  linkedin: { icon: 'logo-linkedin', color: '#fff', bgColor: '#0A66C2' },
  facebook: { icon: 'logo-facebook', color: '#fff', bgColor: '#1877F2' },
  snapchat: { icon: 'logo-snapchat', color: '#000', bgColor: '#FFFC00' },
  whatsapp: { icon: 'logo-whatsapp', color: '#fff', bgColor: '#25D366' },
  telegram: { icon: 'paper-plane', color: '#fff', bgColor: '#0088CC' },
  spotify: { icon: 'musical-notes', color: '#fff', bgColor: '#1DB954' },
  github: { icon: 'logo-github', color: '#fff', bgColor: '#181717' },
  dribbble: { icon: 'logo-dribbble', color: '#fff', bgColor: '#EA4C89' },
  twitch: { icon: 'logo-twitch', color: '#fff', bgColor: '#9146FF' },
  discord: { icon: 'logo-discord', color: '#fff', bgColor: '#5865F2' },
  pinterest: { icon: 'logo-pinterest', color: '#fff', bgColor: '#E60023' },
  email: { icon: 'mail', color: '#fff', bgColor: '#EA4335' },
  website: { icon: 'globe', color: '#fff', bgColor: '#4A90D9' },
  phone: { icon: 'call', color: '#fff', bgColor: '#34C759' },
  custom: { icon: 'link', color: '#fff', bgColor: '#8E8E93' },
  other: { icon: 'link', color: '#fff', bgColor: '#8E8E93' },
};

// Theme configurations
export const THEMES = [
  { id: 'classic', name: 'Classic', colors: ['#667eea', '#764ba2'], textColor: '#fff', isPremium: false },
  { id: 'modern', name: 'Modern', colors: ['#00C853', '#00E676'], textColor: '#fff', isPremium: false },
  { id: 'minimal', name: 'Minimal', colors: ['#FAFAFA', '#F5F5F5'], textColor: '#1A1A1A', hasBorder: true, isPremium: false },
  { id: 'bold', name: 'Bold', colors: ['#FF6B6B', '#FF8E53'], textColor: '#fff', isPremium: false },
  { id: 'elegant', name: 'Elegant', colors: ['#1A1A1A', '#333333'], textColor: '#fff', isPremium: true },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'], textColor: '#fff', isPremium: true },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#FACC15'], textColor: '#fff', isPremium: true },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'], textColor: '#fff', isPremium: true },
];

// Preset gradient colors
export const PRESET_GRADIENTS = [
  { id: 'purple', name: 'Purple', colors: ['#667eea', '#764ba2'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'] },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#EC4899'] },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'] },
  { id: 'fire', name: 'Fire', colors: ['#EF4444', '#F97316'] },
  { id: 'pink', name: 'Pink', colors: ['#EC4899', '#F472B6'] },
  { id: 'teal', name: 'Teal', colors: ['#14B8A6', '#06B6D4'] },
  { id: 'gold', name: 'Gold', colors: ['#D4AF37', '#F59E0B'] },
  { id: 'midnight', name: 'Midnight', colors: ['#1E1B4B', '#312E81'] },
  { id: 'coral', name: 'Coral', colors: ['#FB7185', '#F43F5E'] },
  { id: 'lavender', name: 'Lavender', colors: ['#A78BFA', '#8B5CF6'] },
  { id: 'mint', name: 'Mint', colors: ['#6EE7B7', '#34D399'] },
];

// Button style configurations
export const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'pill', name: 'Pill' },
  { id: 'minimal', name: 'Minimal' },
];

// Photo size configurations
export const PHOTO_SIZES = [
  { id: 'small', name: 'Small', size: 80 },
  { id: 'medium', name: 'Medium', size: 110 },
  { id: 'large', name: 'Large', size: 150 },
  { id: 'xl', name: 'Extra Large', size: 200 },
  { id: 'cover', name: 'Cover', size: -1 },
];

// Free tier limits
export const FREE_LINK_LIMIT = 5;

// ============ Data Fetching Functions ============

/**
 * Get all cards for a user
 */
export async function getUserCards(userId: string): Promise<CardData[]> {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cards:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single card by ID
 */
export async function getCardById(cardId: string): Promise<CardData | null> {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (error) {
    console.error('Error fetching card:', error);
    return null;
  }

  return data;
}

/**
 * Get a card by slug (for public viewing)
 */
export async function getCardBySlug(slug: string): Promise<CardData | null> {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('Error fetching card by slug:', error);
    return null;
  }

  return data;
}

/**
 * Get links for a card
 */
export async function getCardLinks(cardId: string): Promise<LinkItem[]> {
  const { data, error } = await supabase
    .from('card_links')
    .select('*')
    .eq('card_id', cardId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching card links:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new card
 */
export async function createCard(cardData: Partial<CardData>): Promise<CardData | null> {
  const { data, error } = await supabase
    .from('digital_cards')
    .insert(cardData)
    .select()
    .single();

  if (error) {
    console.error('Error creating card:', error);
    return null;
  }

  return data;
}

/**
 * Update a card
 */
export async function updateCard(cardId: string, updates: Partial<CardData>): Promise<CardData | null> {
  const { data, error } = await supabase
    .from('digital_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) {
    console.error('Error updating card:', error);
    return null;
  }

  return data;
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('digital_cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting card:', error);
    return false;
  }

  return true;
}

/**
 * Save card links
 */
export async function saveCardLinks(cardId: string, links: LinkItem[]): Promise<boolean> {
  // First, delete existing links
  await supabase
    .from('card_links')
    .delete()
    .eq('card_id', cardId);

  // Then insert new links
  if (links.length > 0) {
    const linksToInsert = links.map((link, index) => ({
      card_id: cardId,
      platform: link.platform,
      title: link.title || link.platform,
      url: link.url || link.value,
      icon: link.icon || link.platform,
      sort_order: index,
      is_active: true,
    }));

    const { error } = await supabase
      .from('card_links')
      .insert(linksToInsert);

    if (error) {
      console.error('Error saving card links:', error);
      return false;
    }
  }

  return true;
}

/**
 * Check if a slug is available
 */
export async function checkSlugAvailability(slug: string, currentCardId?: string): Promise<boolean> {
  if (!slug || slug.length < 3) return false;

  const { data, error } = await supabase
    .from('digital_cards')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .limit(1);

  if (error) {
    console.error('Error checking slug:', error);
    return false;
  }

  // If no card found, slug is available
  if (!data || data.length === 0) return true;

  // If found card is current user's card, it's available
  if (currentCardId && data[0]?.id === currentCardId) return true;

  return false;
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 30);
}

/**
 * Publish a card
 */
export async function publishCard(cardId: string, slug: string): Promise<boolean> {
  const { error } = await supabase
    .from('digital_cards')
    .update({ 
      is_published: true, 
      slug,
      updated_at: new Date().toISOString() 
    })
    .eq('id', cardId);

  if (error) {
    console.error('Error publishing card:', error);
    return false;
  }

  return true;
}

/**
 * Unpublish a card
 */
export async function unpublishCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('digital_cards')
    .update({ 
      is_published: false,
      updated_at: new Date().toISOString() 
    })
    .eq('id', cardId);

  if (error) {
    console.error('Error unpublishing card:', error);
    return false;
  }

  return true;
}

/**
 * Increment view count
 */
export async function incrementViewCount(cardId: string): Promise<void> {
  await supabase.rpc('increment_card_view', { card_id: cardId });
}

/**
 * Increment tap/click count
 */
export async function incrementTapCount(cardId: string): Promise<void> {
  await supabase.rpc('increment_card_tap', { card_id: cardId });
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('ecard-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading photo:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('ecard-photos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Get card URL
 */
export function getCardUrl(slug: string): string {
  return `https://tavvy.com/c/${slug}`;
}

/**
 * Get QR code URL for a card
 */
export function getQRCodeUrl(slug: string): string {
  const cardUrl = getCardUrl(slug);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardUrl)}`;
}
