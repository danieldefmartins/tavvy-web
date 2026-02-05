/**
 * Universe Landing Screen - Web Version
 * Matches iOS UniverseLandingScreen.tsx exactly
 * 
 * Features:
 * - Working tabs: Places, Map, Reviews, Info
 * - Add Place button for verified users
 * - Reviews section matching Place Details style
 * - Suggest Changes functionality
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  IoArrowBack, IoHeartOutline, IoShareOutline, IoLocation,
  IoSearch, IoExitOutline, IoRestaurantOutline, IoWaterOutline,
  IoCarOutline, IoSparkles, IoClose, IoAdd, IoMap, IoInformationCircle,
  IoChatbubbles, IoThumbsUp, IoAlertCircle, IoCreate, IoRocket,
  IoStorefront, IoTicket, IoEllipsisHorizontal, IoNavigate
} from 'react-icons/io5';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'restroom': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    'dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  return imageMap.default;
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  total_signals?: number;
  place_count?: number;
  sub_universe_count?: number;
  parent_universe_id?: string;
  latitude?: number;
  longitude?: number;
}

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  cover_image_url?: string;
  latitude?: number;
  longitude?: number;
}

interface Review {
  id: string;
  type: 'good' | 'vibe' | 'heads_up';
  text: string;
  user_name: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  place_id: string;
  item_name: string;
  description?: string;
  price?: number;
  category?: string;
  dietary_tags?: string[];
  image_url?: string;
  place_name?: string;
  place_thumbnail?: string;
}

export default function UniverseLandingScreen() {
  const router = useRouter();
  const { slug } = router.query;
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [subUniverses, setSubUniverses] = useState<Universe[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  
  // Food search states
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<MenuItem[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  
  // Check if user is verified (simplified - you'd check from auth context)
  const [isVerified, setIsVerified] = useState(true); // TODO: Get from auth context
  
  

  useEffect(() => {
    if (slug) {
      loadUniverseData();
    }
  }, [slug]);

  const loadUniverseData = async () => {
    setLoading(true);
    console.log('[Universe] Loading data for slug:', slug);
    console.log('[Universe] Supabase client:', supabase);
    try {
      // Fetch universe by slug or id
      let universeData = null;
      
      const { data: bySlug } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (bySlug) {
        universeData = bySlug;
      } else {
        const { data: byId } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        universeData = byId;
      }

      if (!universeData) {
        setLoading(false);
        return;
      }
      
      setUniverse(universeData);

      // Fetch sub-universes
      const { data: subUniversesData } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeData.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      // Fetch places - two-step approach for reliability
      const { data: placeLinks, error: linksError } = await supabase
        .from('atlas_universe_places')
        .select('place_id')
        .eq('universe_id', universeData.id)
        .limit(100);

      

      if (placeLinks && placeLinks.length > 0) {
        const placeIds = placeLinks.map(link => link.place_id);
        const { data: placesData, error: placesError } = await supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, cover_image_url, latitude, longitude')
          .in('id', placeIds);
        
        
        
        if (placesData) {
          setPlaces(placesData as Place[]);
        }
      } else {
        console.log('[Universe] No place links found for this universe');
      }

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('universe_reviews')
        .select('*')
        .eq('universe_id', universeData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewsData) {
        setReviews(reviewsData);
      }

    } catch (error) {
      console.error('Error loading universe:', error);
    } finally {
      setLoading(false);
    }
  };

  // Theme colors matching iOS exactly
  const colors = {
    primary: '#06B6D4',
    background: isDark ? '#000000' : '#F9FAFB',
    surface: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1F2937',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textTertiary: '#9CA3AF',
    border: isDark ? '#374151' : '#F3F4F6',
    inputBg: isDark ? '#1F2937' : '#F3F4F6',
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',
  };

  const stats = [
    { val: String(universe?.place_count || places.length || 0), label: 'Places', icon: IoLocation },
    { val: '—', label: 'Map', icon: IoMap },
    { val: formatNumber(universe?.total_signals || reviews.length || 0), label: 'Reviews', icon: IoChatbubbles },
    { val: 'Info', label: 'Info', icon: IoInformationCircle },
  ];

  const zones = ['All Zones', ...subUniverses.map(s => s.name)];

  const filteredPlaces = places.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tavvy_category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = activeZone === 'All Zones' || true;
    return matchesSearch && matchesZone;
  });

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // Group reviews by type
  const goodReviews = reviews.filter(r => r.type === 'good');
  const vibeReviews = reviews.filter(r => r.type === 'vibe');
  const headsUpReviews = reviews.filter(r => r.type === 'heads_up');

  // Handle add place
  const handleAddPlace = (type: string) => {
    router.push(`/app/add-place?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}&placeType=${type}`);
    setShowAddPlaceModal(false);
  };

  // Handle food search
  const handleFoodSearch = async (query: string) => {
    setFoodSearchQuery(query);
    if (!query.trim() || !universe?.id) {
      setFoodSearchResults([]);
      return;
    }

    setFoodSearchLoading(true);
    try {
      // Get all dining places in this universe
      const { data: placeLinks } = await supabase
        .from('atlas_universe_places')
        .select('place_id')
        .eq('universe_id', universe.id);

      if (!placeLinks || placeLinks.length === 0) {
        setFoodSearchResults([]);
        setFoodSearchLoading(false);
        return;
      }

      const placeIds = placeLinks.map(link => link.place_id);

      // Search menu items in those places
      const { data: menuItems, error } = await supabase
        .from('restaurant_menu_items')
        .select(`
          id,
          place_id,
          item_name,
          description,
          price,
          category,
          dietary_tags,
          image_url
        `)
        .in('place_id', placeIds)
        .ilike('item_name', `%${query}%`)
        .eq('is_available', true)
        .limit(20);

      if (error) throw error;

      // Get place names for the results
      if (menuItems && menuItems.length > 0) {
        const uniquePlaceIds = [...new Set(menuItems.map(item => item.place_id))];
        const { data: placesData } = await supabase
          .from('places')
          .select('id, name, cover_image_url')
          .in('id', uniquePlaceIds);

        const placeMap = new Map(placesData?.map(p => [p.id, p]) || []);
        
        const resultsWithPlaces = menuItems.map(item => ({
          ...item,
          place_name: placeMap.get(item.place_id)?.name || 'Unknown Restaurant',
          place_thumbnail: placeMap.get(item.place_id)?.cover_image_url
        }));

        setFoodSearchResults(resultsWithPlaces);
      } else {
        setFoodSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching food:', error);
      setFoodSearchResults([]);
    } finally {
      setFoodSearchLoading(false);
    }
  };

  // Handle submit suggestion
  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      alert('Please enter your suggestion');
      return;
    }

    try {
      const { error } = await supabase
        .from('universe_suggestions')
        .insert({
          universe_id: universe?.id,
          suggestion_text: suggestionText,
          status: 'pending'
        });

      if (error) throw error;

      alert('Thank you! Your suggestion has been submitted for review.');
      setSuggestionText('');
      setShowSuggestModal(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion. Please try again.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          color: colors.textSecondary 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <div>Loading universe...</div>
        </div>
      </AppLayout>
    );
  }

  if (!universe) {
    return (
      <AppLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          color: colors.textSecondary 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <div>Universe not found</div>
          <button 
            onClick={() => router.back()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  // Render Places Tab
  const renderPlacesTab = () => (
    <>
      {/* Search & Filter */}
      <div style={{ padding: '16px', backgroundColor: colors.surface, marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          padding: '10px',
          borderRadius: '12px',
          marginBottom: '12px'
        }}>
          <IoSearch size={16} color={colors.textTertiary} />
          <input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              marginLeft: '8px',
              fontSize: '14px',
              color: colors.text,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none'
            }}
          />
          {searchQuery.length > 0 && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <IoClose size={18} color={colors.textTertiary} />
            </button>
          )}
        </div>
        
        {zones.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  backgroundColor: activeZone === zone ? colors.primary : colors.inputBg,
                  color: activeZone === zone ? '#fff' : colors.textSecondary,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {zone}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub-Universes (Planets) */}
      {subUniverses.length > 0 && (
        <div style={{ padding: '16px 0', backgroundColor: colors.surface, marginBottom: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, paddingLeft: '16px', marginBottom: '12px' }}>
            Parks & Areas
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingLeft: '16px', paddingRight: '16px' }}>
            {subUniverses.map((subUniverse) => (
              <div
                key={subUniverse.id}
                onClick={() => router.push(`/app/universe/${subUniverse.slug || subUniverse.id}`)}
                style={{
                  minWidth: '140px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: colors.cardBg,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={subUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE}
                  alt={subUniverse.name}
                  style={{ width: '100%', height: '90px', objectFit: 'cover' }}
                />
                <div style={{ padding: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subUniverse.name}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                    {subUniverse.place_count || 0} places
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '16px', marginBottom: '16px' }}>
        {[
          { icon: IoExitOutline, label: "Entrances", type: "entrance", action: () => setSearchQuery('entrance') },
          { icon: IoRestaurantOutline, label: "Dining", type: "dining", action: () => setShowFoodSearchModal(true) },
          { icon: IoWaterOutline, label: "Restrooms", type: "restroom", action: () => setSearchQuery('restroom') },
          { icon: IoCarOutline, label: "Parking", type: "parking", action: () => setSearchQuery('parking') }
        ].map((actionItem, i) => {
          const Icon = actionItem.icon;
          return (
            <button
              key={i}
              onClick={actionItem.action}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '14px',
                backgroundColor: colors.surface,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Icon size={24} color="#374151" />
              <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '6px', fontWeight: '500' }}>
                {actionItem.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Places List */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text }}>Places in this Universe</h3>
          <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '500' }}>{filteredPlaces.length} places</span>
        </div>

        {filteredPlaces.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => router.push(`/app/place/${place.id}`)}
                style={{
                  display: 'flex',
                  backgroundColor: colors.surface,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={place.cover_image_url || getCategoryFallbackImage(place.tavvy_category || '')}
                  alt={place.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>{place.name}</div>
                    <div style={{ fontSize: '11px', color: colors.primary, fontWeight: '500' }}>{place.tavvy_category || 'Attraction'}</div>
                  </div>
                  {place.tavvy_subcategory && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#ECFEFF',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid #CFFAFE',
                      width: 'fit-content'
                    }}>
                      <span style={{ fontSize: '10px', color: '#0891B2', fontWeight: '500' }}>{place.tavvy_subcategory}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <IoLocation size={48} color={colors.textTertiary} />
            <p style={{ marginTop: '12px', fontSize: '14px', color: colors.textSecondary }}>No places found</p>
            {isVerified && (
              <button
                onClick={() => setShowAddPlaceModal(true)}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  backgroundColor: colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add the first place
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Render Map Tab
  const renderMapTab = () => {
    const hasCoordinates = universe?.latitude && universe?.longitude;
    
    return (
      <div style={{ padding: '16px' }}>
        {hasCoordinates ? (
          <div style={{
            height: '400px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#E0F2FE'
          }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${universe.latitude},${universe.longitude}&zoom=15`}
            />
          </div>
        ) : (
          <div style={{
            height: '400px',
            backgroundColor: '#E0F2FE',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IoMap size={64} color="#9CA3AF" />
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#0284C7', marginTop: '16px' }}>Map coming soon</p>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>Location data not available yet</p>
          </div>
        )}
      </div>
    );
  };

  // Render Reviews Tab
  const renderReviewsTab = () => (
    <div style={{ padding: '16px' }}>
      {/* Community Signals Card */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.text, marginBottom: '16px' }}>Community Reviews</h3>
        
        {/* The Good - Blue */}
        <button
          onClick={() => router.push(`/app/add-review?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}&type=good`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#0A84FF',
            border: 'none',
            borderRadius: '12px',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <IoThumbsUp size={18} color="#FFFFFF" style={{ marginRight: '10px' }} />
          <span style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600', fontStyle: 'italic', opacity: 0.9 }}>
            {goodReviews.length > 0 ? `The Good · ${goodReviews.length} reviews` : 'The Good · Be the first to tap!'}
          </span>
        </button>
        
        {/* The Vibe - Purple */}
        <button
          onClick={() => router.push(`/app/add-review?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}&type=vibe`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#8B5CF6',
            border: 'none',
            borderRadius: '12px',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <IoSparkles size={18} color="#FFFFFF" style={{ marginRight: '10px' }} />
          <span style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600', fontStyle: 'italic', opacity: 0.9 }}>
            {vibeReviews.length > 0 ? `The Vibe · ${vibeReviews.length} reviews` : 'The Vibe · Be the first to tap!'}
          </span>
        </button>
        
        {/* Heads Up - Orange */}
        <button
          onClick={() => router.push(`/app/add-review?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}&type=heads_up`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#FF9500',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          <IoAlertCircle size={18} color="#FFFFFF" style={{ marginRight: '10px' }} />
          <span style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600', fontStyle: 'italic', opacity: 0.9 }}>
            {headsUpReviews.length > 0 ? `Heads Up · ${headsUpReviews.length} reviews` : 'Heads Up · Be the first to tap!'}
          </span>
        </button>
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>Recent Reviews</h3>
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} style={{
              display: 'flex',
              backgroundColor: colors.surface,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: review.type === 'good' ? '#0A84FF' : review.type === 'vibe' ? '#8B5CF6' : '#FF9500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                {review.type === 'good' && <IoThumbsUp size={12} color="#FFFFFF" />}
                {review.type === 'vibe' && <IoSparkles size={12} color="#FFFFFF" />}
                {review.type === 'heads_up' && <IoAlertCircle size={12} color="#FFFFFF" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>{review.text}</p>
                <p style={{ fontSize: '12px', color: colors.textTertiary }}>{review.user_name} · {new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Been Here Card */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>Been here?</h3>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>Share your experience with the community</p>
        <button
          onClick={() => router.push(`/app/add-review?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <IoCreate size={20} />
          Write a Review
        </button>
      </div>
    </div>
  );

  // Render Info Tab
  const renderInfoTab = () => (
    <div style={{ padding: '16px' }}>
      {/* About */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>About {universe?.name}</h3>
        <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '22px' }}>
          {universe?.description || 'No description available yet. Be the first to suggest one!'}
        </p>
      </div>

      {/* Location */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>Location</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <IoLocation size={20} color={colors.primary} />
          <span style={{ fontSize: '14px', color: colors.textSecondary }}>{universe?.location || 'Location not specified'}</span>
        </div>
        {universe?.latitude && universe?.longitude && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IoNavigate size={20} color={colors.primary} />
            <span style={{ fontSize: '14px', color: colors.textSecondary }}>
              {universe.latitude.toFixed(4)}, {universe.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { value: universe?.place_count || places.length, label: 'Places' },
            { value: subUniverses.length, label: 'Parks/Areas' },
            { value: reviews.length, label: 'Reviews' },
            { value: universe?.total_signals || 0, label: 'Signals' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: colors.inputBg,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggest Changes */}
      <button
        onClick={() => setShowSuggestModal(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: colors.surface,
          border: `2px solid ${colors.primary}`,
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer'
        }}
      >
        <IoCreate size={20} color={colors.primary} />
        <span style={{ fontSize: '16px', fontWeight: '600', color: colors.primary }}>Suggest a Change</span>
      </button>
    </div>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Places': return renderPlacesTab();
      case 'Map': return renderMapTab();
      case 'Reviews': return renderReviewsTab();
      case 'Info': return renderInfoTab();
      default: return renderPlacesTab();
    }
  };

  return (
    <>
      <Head>
        <title>{universe.name} | TavvY</title>
        <meta name="description" content={universe.description || `Explore ${universe.name}`} />
      </Head>

      <AppLayout>
        <div style={{ backgroundColor: colors.background, minHeight: '100vh', position: 'relative' }}>
          {/* Hero Section */}
          <div style={{ position: 'relative', height: '300px' }}>
            <img 
              src={universe.banner_image_url || PLACEHOLDER_IMAGE}
              alt={universe.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
            }} />
            
            {/* Hero Nav */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px',
              paddingTop: '40px'
            }}>
              <button
                onClick={() => router.back()}
                style={{
                  width: '36px', height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <IoArrowBack size={24} color="#1F2937" />
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{
                  width: '36px', height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <IoHeartOutline size={24} color="#1F2937" />
                </button>
                <button style={{
                  width: '36px', height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <IoShareOutline size={24} color="#1F2937" />
                </button>
              </div>
            </div>

            {/* Hero Content */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(6, 182, 212, 0.9)',
                padding: '4px 10px',
                borderRadius: '12px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '12px', marginRight: '4px' }}>🌌</span>
                <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>UNIVERSE</span>
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '6px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {universe.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IoLocation size={14} color="#fff" style={{ marginRight: '4px' }} />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {universe.location || 'Location TBD'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar - Clickable */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '16px',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`
          }}>
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const isActive = activeTab === stat.label;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(stat.label)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={20} color={isActive ? colors.primary : colors.textTertiary} />
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: isActive ? colors.primary : colors.text,
                    marginTop: '4px'
                  }}>
                    {stat.val}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: isActive ? colors.primary : colors.textTertiary,
                    marginTop: '2px'
                  }}>
                    {stat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`
          }}>
            {['Places', 'Map', 'Reviews', 'Info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${colors.primary}` : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: activeTab === tab ? colors.primary : colors.textTertiary
                }}>
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Spacer for floating button */}
          <div style={{ height: '100px' }} />

          {/* Floating Add Place Button */}
          {isVerified && (
            <button
              onClick={() => setShowAddPlaceModal(true)}
              style={{
                position: 'fixed',
                bottom: '100px',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: colors.primary,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                zIndex: 100
              }}
            >
              <IoAdd size={28} color="#FFFFFF" />
            </button>
          )}

          {/* Add Place Modal */}
          {showAddPlaceModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>Add a Place</h3>
                  <button onClick={() => setShowAddPlaceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <IoClose size={24} color={colors.text} />
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                  What type of place would you like to add?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { icon: IoRocket, label: 'Ride', type: 'ride' },
                    { icon: IoRestaurantOutline, label: 'Dining', type: 'dining' },
                    { icon: IoWaterOutline, label: 'Restroom', type: 'restroom' },
                    { icon: IoStorefront, label: 'Shop', type: 'shop' },
                    { icon: IoTicket, label: 'Attraction', type: 'attraction' },
                    { icon: IoCarOutline, label: 'Parking', type: 'parking' },
                    { icon: IoExitOutline, label: 'Entrance', type: 'entrance' },
                    { icon: IoEllipsisHorizontal, label: 'Other', type: 'other' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleAddPlace(item.type)}
                        style={{
                          aspectRatio: '1',
                          backgroundColor: colors.inputBg,
                          borderRadius: '16px',
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon size={32} color={colors.primary} />
                        <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '6px', fontWeight: '500' }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Suggest Changes Modal */}
          {showSuggestModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>Suggest a Change</h3>
                  <button onClick={() => setShowSuggestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <IoClose size={24} color={colors.text} />
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                  Help us improve {universe?.name}. Your suggestion will be reviewed by our team.
                </p>
                <textarea
                  placeholder="Describe your suggestion..."
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    color: colors.text,
                    resize: 'vertical',
                    marginBottom: '16px'
                  }}
                />
                <button
                  onClick={handleSubmitSuggestion}
                  style={{
                    width: '100%',
                    backgroundColor: colors.primary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '600' }}>Submit Suggestion</span>
                </button>
              </div>
            </div>
          )}

          {/* Food Search Modal */}
          {showFoodSearchModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '85%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>🍽️ What do you want to eat?</h3>
                  <button onClick={() => { setShowFoodSearchModal(false); setFoodSearchQuery(''); setFoodSearchResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <IoClose size={24} color={colors.text} />
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                  Search for a food item and we'll show you which restaurants have it!
                </p>

                {/* Search Input */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: colors.inputBg,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <IoSearch size={20} color={colors.textTertiary} />
                  <input
                    type="text"
                    placeholder="e.g., pizza, burger, vegan..."
                    value={foodSearchQuery}
                    onChange={(e) => handleFoodSearch(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      marginLeft: '12px',
                      fontSize: '16px',
                      color: colors.text,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                  {foodSearchQuery && (
                    <button onClick={() => { setFoodSearchQuery(''); setFoodSearchResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <IoClose size={20} color={colors.textTertiary} />
                    </button>
                  )}
                </div>

                {/* Quick Suggestions */}
                {!foodSearchQuery && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px', fontWeight: '600' }}>POPULAR SEARCHES</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Pizza', 'Burger', 'Ice Cream', 'Chicken', 'Salad', 'Vegan', 'Fries', 'Hot Dog'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleFoodSearch(suggestion)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: colors.inputBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: colors.text,
                            cursor: 'pointer'
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {foodSearchLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                      <p style={{ color: colors.textSecondary }}>Searching menus...</p>
                    </div>
                  ) : foodSearchQuery && foodSearchResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤷</div>
                      <p style={{ color: colors.textSecondary, fontSize: '14px' }}>No menu items found for "{foodSearchQuery}"</p>
                      <p style={{ color: colors.textTertiary, fontSize: '12px', marginTop: '8px' }}>Try a different search term or check back later as menus are being added.</p>
                    </div>
                  ) : foodSearchResults.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '600' }}>
                        {foodSearchResults.length} RESULT{foodSearchResults.length !== 1 ? 'S' : ''} FOUND
                      </p>
                      {foodSearchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => router.push(`/app/place/${item.place_id}`)}
                          style={{
                            display: 'flex',
                            backgroundColor: colors.inputBg,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `1px solid ${colors.border}`
                          }}
                        >
                          {item.image_url || item.place_thumbnail ? (
                            <img
                              src={item.image_url || item.place_thumbnail || ''}
                              alt={item.item_name}
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: colors.surface,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px'
                            }}>
                              🍽️
                            </div>
                          )}
                          <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '2px' }}>
                              {item.item_name}
                            </div>
                            <div style={{ fontSize: '12px', color: colors.primary, fontWeight: '500', marginBottom: '4px' }}>
                              📍 {item.place_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {item.price && (
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                              {item.category && (
                                <span style={{
                                  fontSize: '10px',
                                  backgroundColor: colors.surface,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  color: colors.textSecondary,
                                  textTransform: 'capitalize'
                                }}>
                                  {item.category}
                                </span>
                              )}
                              {item.dietary_tags && item.dietary_tags.length > 0 && (
                                <span style={{ fontSize: '10px', color: '#10B981' }}>
                                  {item.dietary_tags.includes('vegan') ? '🌱' : ''}
                                  {item.dietary_tags.includes('vegetarian') ? '🥬' : ''}
                                  {item.dietary_tags.includes('gluten-free') ? '🌾' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍔</div>
                      <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Search for your favorite food above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
