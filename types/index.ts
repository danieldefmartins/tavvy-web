// Place types
export interface Signal {
  bucket: string;
  tap_total: number;
}

export interface Place {
  id: string;
  name: string;
  address_line1: string;
  city?: string;
  state_region?: string;
  category: string;
  primary_category?: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  distance?: number;
  current_status?: string;
  cover_image_url?: string;
  phone?: string;
  website?: string;
  instagram_url?: string;
  description?: string;
  signals?: Signal[];
  photos?: string[];
}

export interface SearchSuggestion {
  id: string;
  type: 'place' | 'category' | 'location' | 'recent' | 'address';
  title: string;
  subtitle?: string;
  icon: string;
  data?: any;
}

export interface AddressInfo {
  displayName: string;
  shortName: string;
  coordinates: [number, number];
  road?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface ParkingLocation {
  coordinates: [number, number];
  address?: string;
  savedAt: number;
  note?: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  icon: string;
  createdAt: number;
}

// Navigation types
export type TabName = 'Home' | 'Explore' | 'Pros' | 'Atlas' | 'Apps';

// Signal types
export type SignalType = 'positive' | 'neutral' | 'negative';

// User types
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
}
