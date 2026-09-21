/**
 * Universe Landing Screen - Web Version
 * Matches iOS UniverseLandingScreen.tsx exactly
 * 
 * Features:
 * - Working tabs: Places, Map, Reviews, Info
 * - Add Place button for signed-in users
 * - Reviews section matching Place Details style
 * - Suggest Changes functionality
 */

import ContentSafetyActions,{CONTENT_SAFETY_CHANGED} from '../../../components/ContentSafetyActions';
import CruiseUniverseEntry from '../../../components/cruises/CruiseUniverseEntry';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
const UniverseMap = dynamic(() => import('../../../components/UniverseMap'), { ssr: false });
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import StoriesRow from '../../../components/StoriesRow';
import { supabase } from '../../../lib/supabaseClient';
import {
  IoArrowBack, IoHeartOutline, IoShareOutline, IoLocation,
  IoSearch, IoExitOutline, IoRestaurantOutline, IoWaterOutline,
  IoCarOutline, IoSparkles, IoClose, IoAdd, IoMap, IoInformationCircle,
  IoChatbubbles, IoThumbsUp, IoAlertCircle, IoCreate, IoRocket,
  IoStorefront, IoTicket, IoEllipsisHorizontal, IoNavigate,
  IoFlash, IoPeople, IoMusicalNotes, IoStar, IoCalendar, IoGameController
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';


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

import { useAuth } from '../../../contexts/AuthContext';
import { loadUniversePlaces, hasUniverseCoordinates } from '../../../lib/universePlaces';
import { searchFoodMenus } from '../../../lib/foodMenu';

interface Universe {
  universe_kind?: 'place_collection' | 'cruise_ship';
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
  universe_ids?: string[];
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
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [subUniverses, setSubUniverses] = useState<Universe[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewType, setReviewType] = useState<'good' | 'vibe' | 'heads_up' | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Modal states
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  
  // Food search states
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<MenuItem[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [foodSearchError, setFoodSearchError] = useState('');
  const foodRequest = useRef(0);
  
  const { user } = useAuth();
  const canContribute = !!user;
  const [loadError, setLoadError] = useState('');
  const [reviewsError, setReviewsError] = useState('');
  const universeRequest = useRef(0);
  
  

  useEffect(() => {
    if (slug) {
      loadUniverseData();
    }
    const refresh=()=>loadUniverseData();window.addEventListener(CONTENT_SAFETY_CHANGED,refresh);return()=>{universeRequest.current++;window.removeEventListener(CONTENT_SAFETY_CHANGED,refresh)};
  }, [slug,user?.id]);

  const loadUniverseData = async () => {
    const request=++universeRequest.current;
    setLoading(true);
    setUniverse(null); setPlaces([]); setSubUniverses([]); setReviews([]);
    setLoadError(''); setReviewsError(''); setActiveZone('All Zones');
    console.log('[Universe] Loading data for slug:', slug);
    console.log('[Universe] Supabase client:', supabase);
    try {
      // Fetch universe by slug or id
      let universeData = null;
      
      const { data: bySlug, error: slugError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if(request!==universeRequest.current)return;
      if (slugError) throw slugError;
      if (bySlug) {
        universeData = bySlug;
      } else if (typeof slug === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(slug)) {
        const { data: byId, error: idError } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        if(request!==universeRequest.current)return;
        if (idError) throw idError;
        universeData = byId;
      }

      if (!universeData) {
        setLoading(false);
        return;
      }
      
      setUniverse(universeData);
      if (universeData.universe_kind === 'cruise_ship') return;

      // Fetch sub-universes
      const { data: subUniversesData, error: subError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeData.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if(request!==universeRequest.current)return;
      if (subError) throw subError;
      if (subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      const loadedPlaces=await loadUniversePlaces([universeData.id, ...(subUniversesData || []).map(s => s.id)]);
      if(request!==universeRequest.current)return;
      setPlaces(loadedPlaces);

      // Fetch reviews
      const { data: reviewsData, error: reviewReadError } = await supabase
        .from('universe_reviews')
        .select('*')
        .eq('universe_id', universeData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if(request!==universeRequest.current)return;
      if (reviewReadError) setReviewsError('Reviews are unavailable. Please try again later.');
      if (reviewsData) {
        setReviews(reviewsData);
      }

    } catch (error) {
      if(request!==universeRequest.current)return;
      setUniverse(null);
      setLoadError('Unable to load this universe. Please try again.');
      console.error('Error loading universe:', error);
    } finally {
      if(request===universeRequest.current)setLoading(false);
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

  const zones = [{ id: 'All Zones', name: 'All Zones' }, ...subUniverses.map(s => ({ id: s.id, name: s.name }))];

  // Category filter definitions
  const RIDE_SUBCATEGORIES = ['water_rides', 'thrill_rides', 'dark_rides', 'family_rides', 'simulators'];
  const ATTRACTION_SUBCATEGORIES = ['explore', 'interactive', 'animals'];

  const filteredPlaces = places.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tavvy_category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tavvy_subcategory || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = activeZone === 'All Zones' || !!p.universe_ids?.includes(activeZone);
    
    // Category filter
    let matchesFilter = true;
    if (activeFilter) {
      const cat = (p.tavvy_category || '').toLowerCase();
      const sub = (p.tavvy_subcategory || '').toLowerCase();
      switch (activeFilter) {
        case 'rides':
          matchesFilter = RIDE_SUBCATEGORIES.includes(sub);
          break;
        case 'attractions':
          matchesFilter = ATTRACTION_SUBCATEGORIES.includes(sub) || (cat === 'attraction' && !RIDE_SUBCATEGORIES.includes(sub) && sub !== 'shows' && sub !== 'characters');
          break;
        case 'characters':
          matchesFilter = sub === 'characters';
          break;
        case 'shows':
          matchesFilter = sub === 'shows';
          break;
        case 'fireworks':
          matchesFilter = sub === 'fireworks' || p.name.toLowerCase().includes('firework');
          break;
        case 'special_events':
          matchesFilter = sub === 'special_events' || cat === 'special_events';
          break;
        case 'entrance':
          matchesFilter = cat === 'entrance' || p.name.toLowerCase().includes('entrance');
          break;
        case 'dining':
          matchesFilter = cat === 'restaurant' || cat === 'dining' || p.name.toLowerCase().includes('dining') || p.name.toLowerCase().includes('restaurant');
          break;
        case 'restroom':
          matchesFilter = cat === 'restroom' || p.name.toLowerCase().includes('restroom');
          break;
        case 'parking':
          matchesFilter = cat === 'parking' || p.name.toLowerCase().includes('parking');
          break;
      }
    }
    
    return matchesSearch && matchesZone && matchesFilter;
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
    router.push(`/app/add?universeId=${universe?.id}&universeName=${encodeURIComponent(universe?.name || '')}&placeType=${type}`);
    setShowAddPlaceModal(false);
  };

  // Query the same menu data used by the restaurant's online menu.
  const handleFoodSearch = async (query: string) => {
    const current = ++foodRequest.current;
    setFoodSearchQuery(query); setFoodSearchError(''); setFoodSearchResults([]);
    if (!query.trim() || !universe?.id) { setFoodSearchLoading(false); return; }
    setFoodSearchLoading(true);
    try {
      const results = await searchFoodMenus({ query, universeId: universe?.id });
      if (current === foodRequest.current) setFoodSearchResults(results as MenuItem[]);
    } catch (error) {
      if (current === foodRequest.current) setFoodSearchError((error as Error).message);
    } finally {
      if (current === foodRequest.current) setFoodSearchLoading(false);
    }
  };

  // Handle submit suggestion
  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      alert('Please enter your suggestion');
      return;
    }

    try {
      if (!user) { alert('Sign in to submit a suggestion.'); return; }
      const { error } = await supabase
        .from('universe_suggestions')
        .insert({
          universe_id: universe?.id,
          user_id: user.id,
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

  const submitReview = async () => {
    if (!user || !universe || !reviewType || !reviewText.trim() || reviewSaving) return;
    setReviewSaving(true); setReviewSubmitError('');
    try {
      const { error } = await supabase.from('universe_reviews').insert({ universe_id: universe.id, user_id: user.id, type: reviewType, text: reviewText.trim() });
      if (error) throw error;
      setReviewType(null); setReviewText(''); await loadUniverseData(); setActiveTab('Reviews');
    } catch { setReviewSubmitError('Unable to post your review. Please try again.'); }
    finally { setReviewSaving(false); }
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
          <div>{loadError || 'Universe not found'}</div>
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

  if (universe.universe_kind === 'cruise_ship') return <CruiseUniverseEntry universeId={universe.id}/>;

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
            onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setActiveFilter(null); }}
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
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  backgroundColor: activeZone === zone.id ? colors.primary : colors.inputBg,
                  color: activeZone === zone.id ? '#fff' : colors.textSecondary,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {zone.name}
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
                onClick={() => router.push(`/app/universe/${subUniverse.slug || subUniverse.id}`, undefined, { locale })}
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

      {/* Category Filter Icons */}
      <div style={{ padding: '0 16px', marginBottom: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'min-content' }}>
          {[
            { icon: IoRocket, label: "Rides", filter: "rides", color: '#EF4444' },
            { icon: IoStar, label: "Attractions", filter: "attractions", color: '#F59E0B' },
            { icon: IoPeople, label: "Characters", filter: "characters", color: '#8A05BE' },
            { icon: IoMusicalNotes, label: "Shows", filter: "shows", color: '#EC4899' },
            { icon: IoFlash, label: "Fireworks", filter: "fireworks", color: '#00C2CB' },
            { icon: IoCalendar, label: "Events", filter: "special_events", color: '#06B6D4' },
            { icon: IoExitOutline, label: "Entrances", filter: "entrance", color: '#6366F1' },
            { icon: IoRestaurantOutline, label: "Dining", filter: "dining", color: '#00C2CB' },
            { icon: IoWaterOutline, label: "Restrooms", filter: "restroom", color: '#8A05BE' },
            { icon: IoCarOutline, label: "Parking", filter: "parking", color: '#6B7280' },
          ].map((item, i) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.filter;
            return (
              <button
                key={i}
                onClick={() => {
                  if (item.filter === 'dining' && !isActive) {
                    setActiveFilter('dining');
                  } else if (isActive) {
                    setActiveFilter(null);
                  } else {
                    setActiveFilter(item.filter);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: isActive ? item.color : colors.surface,
                  border: isActive ? 'none' : `1px solid ${colors.border || '#E5E7EB'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                  minWidth: '68px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Icon size={22} color={isActive ? '#FFFFFF' : item.color} />
                <span style={{ 
                  fontSize: '10px', 
                  color: isActive ? '#FFFFFF' : colors.textSecondary, 
                  marginTop: '4px', 
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
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
                onClick={() => router.push(`/app/place/${place.id}`, undefined, { locale })}
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
            {canContribute && (
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
  const renderMapTab = () => (
    <div style={{ padding: 16 }}>
      <p>{filteredPlaces.filter(hasUniverseCoordinates).length} of {filteredPlaces.length} matching places have map locations. Filters from Places apply here.</p>
      <UniverseMap places={filteredPlaces} universe={universe!} onSelect={place => router.push(`/app/place/${place.id}`, undefined, { locale })} />
    </div>
  );

  // Render Reviews Tab
  const renderReviewsTab = () => (
    <div style={{ padding: '16px' }}>
      {reviewsError && <p role="alert">{reviewsError}</p>}
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
          onClick={() => { setReviewSubmitError(''); setReviewType('good'); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#00C2CB',
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
          onClick={() => { setReviewSubmitError(''); setReviewType('vibe'); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#8A05BE',
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
          onClick={() => { setReviewSubmitError(''); setReviewType('heads_up'); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            backgroundColor: '#F5A623',
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
                backgroundColor: review.type === 'good' ? '#00C2CB' : review.type === 'vibe' ? '#8A05BE' : '#F5A623',
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
                <ContentSafetyActions kind="universe_review" contentId={review.id} />
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
          onClick={() => { setReviewSubmitError(''); setReviewType('good'); }}
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
                <button aria-label="Share universe" onClick={async () => { try { if (navigator.share) await navigator.share({ title: universe.name, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); alert('Link copied'); } } catch (error) { if ((error as Error).name !== 'AbortError') alert('Unable to share this link.'); } }} style={{
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

          {/* Stories Row */}
          <StoriesRow
            universeId={universe.id}
            isDark={isDark}
            onAddStoryPress={() => router.push(`/app/add-story?universeId=${universe.id}&universeName=${encodeURIComponent(universe.name)}`)}
          />

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
          {canContribute && (
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
          {reviewType && <div role="dialog" aria-modal="true" aria-label="Write universe review" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center' }}><div style={{ background: colors.surface, color: colors.text, padding: 24, borderRadius: 16, width: 'min(90vw,480px)' }}>
            <h2>Write a review</h2>
            {!user ? <p>Sign in to post a review.</p> : <><label>Review type <select value={reviewType} onChange={e => setReviewType(e.target.value as 'good' | 'vibe' | 'heads_up')}><option value="good">The Good</option><option value="vibe">The Vibe</option><option value="heads_up">Heads Up</option></select></label><textarea aria-label="Your review" value={reviewText} onChange={e => setReviewText(e.target.value)} maxLength={4000} rows={5} style={{ width: '100%', margin: '16px 0' }} /><button disabled={reviewSaving || !reviewText.trim()} onClick={submitReview}>{reviewSaving ? 'Posting…' : 'Post review'}</button></>}
            {reviewSubmitError && <p role="alert">{reviewSubmitError}</p>}<button disabled={reviewSaving} onClick={() => setReviewType(null)}>Close</button>
          </div></div>}
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
                  {foodSearchError ? <p role="alert">{foodSearchError}</p> : foodSearchLoading ? (
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
                          onClick={() => router.push(`/place/${item.place_id}/menu?dish=${item.id}`, undefined, { locale })}
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
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#00C2CB' }}>
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
                                <span style={{ fontSize: '10px', color: '#00C2CB' }}>
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


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
