import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fetchPlaceById } from '../../../lib/placeService';
import { supabase } from '../../../lib/supabaseClient';
import { Place } from '../../../types';
import { fetchPlaceSignals, SignalAggregate } from '../../../lib/signalService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ChevronLeft, Heart, Phone, BookOpen, Globe, MapPin, Scissors, Brush, Spa } from 'lucide-react';
import SignalMatrix from '../../../components/SignalMatrix';

const categoryEmoji: Record<string, string> = {
  restaurant: '\uD83C\uDF7D\uFE0F',
  cafe: '\u2615',
  coffee: '\u2615',
  bar: '\uD83C\uDF78',
  bakery: '\uD83E\uDD50',
  pizza: '\uD83C\uDF55',
  sushi: '\uD83C\uDF63',
  mexican: '\uD83C\uDF2E',
  italian: '\uD83C\uDF5D',
  chinese: '\uD83E\uDD62',
  indian: '\uD83C\uDF5B',
  thai: '\uD83C\uDF5C',
  burger: '\uD83C\uDF54',
  seafood: '\uD83E\uDD90',
  steakhouse: '\uD83E\uDD69',
  dessert: '\uD83C\uDF70',
  brunch: '\uD83E\uDD5E',
  vegan: '\uD83E\uDD57',
  default: '\uD83D\uDCCD',
};

function getCategoryEmoji(category?: string): string {
  if (!category) return categoryEmoji.default;
  const lower = category.toLowerCase();
  for (const key of Object.keys(categoryEmoji)) {
    if (lower.includes(key)) return categoryEmoji[key];
  }
  return categoryEmoji.default;
}

function getFallbackCover(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('coffee') || cat.includes('cafe'))
    return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&fit=crop';
  if (cat.includes('bar'))
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80&fit=crop';
  if (cat.includes('bakery'))
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&fit=crop';
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop';
}

/* SVG Icon Components */
// Icons from lucide-react — clean, monochrome, Apple/Google style

function isRestaurantCategory(tavvyCategory?: string): boolean {
  if (!tavvyCategory) return true;
  const lower = tavvyCategory.toLowerCase();
  return lower === 'restaurants' || lower === 'cafes';
}

function isFoodBusiness(tavvyCategory?: string): boolean {
  if (!tavvyCategory) return true;
  const lower = tavvyCategory.toLowerCase();
  return lower === 'restaurants' || lower === 'cafes';
}

export default function PlaceDetailsScreen({ placeId }: { placeId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = placeId || (router.query.id as string);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [livingSignals, setLivingSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
    medals: string[];
  }>({ best_for: [], vibe: [], heads_up: [], medals: [] });
  const [photos, setPhotos] = useState<{ url: string; caption?: string }[]>([]);
  const [stories, setStories] = useState<{ id: string; url: string; thumbnail_url?: string; caption?: string }[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [expandGood, setExpandGood] = useState(false);
  const [expandVibe, setExpandVibe] = useState(false);
  const [expandHeadsUp, setExpandHeadsUp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth + saved status
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        // Check if this place is saved
        if (id) {
          supabase.from('saved_places')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('place_id', id)
            .maybeSingle()
            .then(({ data: saved }) => {
              setIsSaved(!!saved);
            });
        }
      }
    });
  }, [id]);

  const toggleSave = async () => {
    if (!id) return;

    // Not logged in → redirect to login
    if (!userId) {
      router.push(`/app/login?redirect=${encodeURIComponent(`/place/${id}`)}`);
      return;
    }

    if (isSaved) {
      await supabase.from('saved_places')
        .delete()
        .eq('user_id', userId)
        .eq('place_id', id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_places')
        .insert({ user_id: userId, place_id: id });
      setIsSaved(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPlaceById(id).then(data => {
        setPlace(data);
        setLoading(false);
        if (data?.id) {
          fetchPlaceSignals(data.id).then(setLivingSignals).catch(() => {});
          // Load photos
          supabase
            .from('place_photos')
            .select('url, caption')
            .eq('place_id', data.id)
            .eq('status', 'live')
            .limit(12)
            .then(({ data: photoData }) => {
              if (photoData) setPhotos(photoData.filter((p: any) => p.url));
            })
            .catch(() => {});
          // Load stories
          supabase
            .from('place_stories')
            .select('id, url, thumbnail_url, caption')
            .eq('place_id', data.id)
            .eq('status', 'live')
            .order('created_at', { ascending: false })
            .limit(10)
            .then(({ data: storyData }) => {
              if (storyData) setStories(storyData);
            })
            .catch(() => {});
        }
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: place?.name || 'Check this place', url });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  const handleCall = () => {
    if (place?.phone) window.open(`tel:${place.phone}`, '_self');
  };

  const handleDirections = () => {
    const lat = place?.latitude || place?.lat;
    const lng = place?.longitude || place?.lng;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (place?.address_line1) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address_line1 + ' ' + (place.city || ''))}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#FAFAFA',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #E8E8E8',
            borderTopColor: '#8A05BE', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#999', fontSize: 14, margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#FAFAFA', flexDirection: 'column', gap: 12,
      }}>
        <span style={{ fontSize: 48 }}>😕</span>
        <p style={{ color: '#666', fontSize: 16, margin: 0 }}>Place not found</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 8, padding: '10px 24px', background: '#8A05BE',
            color: '#fff', border: 'none', borderRadius: 24, fontSize: 14,
            cursor: 'pointer', fontWeight: 600,
          }}
        >Go Back</button>
      </div>
    );
  }

  const coverUrl = place.cover_image_url || getFallbackCover(place.category);
  const emoji = getCategoryEmoji(place.category);
  // Format subcategory: "italian" → "Italian Restaurant", "pizza" → "Pizza", etc.
  const rawSub = place.tavvy_subcategory || '';
  const formatSubcategory = (sub: string): string => {
    if (!sub) return '';
    const formatted = sub.charAt(0).toUpperCase() + sub.slice(1).replace(/_/g, ' ');
    // Add "Restaurant" suffix for cuisine types
    const cuisines = ['italian', 'mexican', 'chinese', 'japanese', 'thai', 'indian', 'french', 'korean', 'vietnamese', 'brazilian', 'mediterranean', 'greek', 'american'];
    if (cuisines.includes(sub.toLowerCase())) return `${formatted} Restaurant`;
    return formatted;
  };
  const displayCategory = formatSubcategory(rawSub) || place.primary_category || place.category || 'Restaurant';

  const iconBtnStyle: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(12px)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: 1.2, color: '#888', margin: '0 0 14px 0',
  };

  return (
    <>
      <Head>
        <title>{place.name} | Tavvy</title>
        <meta name="description" content={`${place.name} - ${displayCategory} in ${place.city || ''}`} />
      </Head>

      <div style={{
        maxWidth: 480, margin: '0 auto', background: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh',
        position: 'relative',
      }}>

        {/* ===== HERO IMAGE ===== */}
        <div style={{
          position: 'relative', height: '45vh', minHeight: 320,
          overflow: 'hidden',
        }}>
          <img
            src={coverUrl}
            alt={place.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Dark vignette overlay for depth */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
          }} />
          {/* Refined gradient overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)',
          }} />

          {/* Top nav buttons — SVG icons for iOS-like feel */}
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button onClick={() => router.back()} style={iconBtnStyle} aria-label="Go back">
              <ChevronLeft size={20} color="#333" />
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleShare} style={iconBtnStyle} aria-label="Share">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </button>
              <button onClick={toggleSave} style={iconBtnStyle} aria-label="Save">
                <Heart size={18} color={isSaved ? '#E11D48' : '#333'} fill={isSaved ? '#E11D48' : 'none'} />
              </button>
            </div>
          </div>

          {/* Hero text */}
          <div style={{
            position: 'absolute', bottom: 24, left: 20, right: 20,
          }}>
            {/* Glass-morphism category badge — background: white/10 with blur effect */}
            <div style={{
              display: 'inline-block', padding: '5px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase' as const, marginBottom: 10,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {emoji} {displayCategory}
            </div>
            {/* Logo */}
            {place.logo_url && (
              <img src={place.logo_url} alt="" style={{
                width: 48, height: 48, borderRadius: 12, objectFit: 'cover',
                marginBottom: 8, border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }} />
            )}
            <h1 style={{
              margin: 0, fontSize: 32, fontWeight: 800, color: '#fff',
              lineHeight: 1.12, textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}>
              {place.name}
            </h1>
            {place.city && (
              <p style={{
                margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.85)',
                fontWeight: 500,
              }}>
                {place.address_line1}{place.city ? `, ${place.city}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* ===== ACTION BAR ===== */}
        <div style={{
          display: 'flex', gap: 8, padding: '16px 16px',
          borderBottom: '1px solid #F0F0F0', alignItems: 'center',
        }}>
          <button
            onClick={() => router.push(`/place/${id}/menu`)}
            style={{
              flex: 1, padding: '13px 0', background: '#8A05BE', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.3, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(138,5,190,0.35)',
            }}
          >
            <BookOpen size={18} /> Menu
          </button>
          {place.phone && (
            <button onClick={handleCall} style={{
              width: 44, height: 44, borderRadius: 12, border: '1px solid #ECECEC',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} aria-label="Call">
              <Phone size={18} color="#444" />
            </button>
          )}
          <button onClick={handleDirections} style={{
            width: 44, height: 44, borderRadius: 12, border: '1px solid #ECECEC',
            background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-label="Directions">
            <MapPin size={18} color="#444" />
          </button>
        </div>

        {/* ===== SIGNAL SUMMARY ===== */}
        <div style={{ padding: '24px 16px 8px' }}>

          {/* Medals row */}
          {livingSignals.medals && livingSignals.medals.length > 0 && (
            <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {livingSignals.medals.map((medal, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 14px', background: 'rgba(255,215,0,0.12)',
                  borderRadius: 20, fontSize: 13, fontWeight: 700,
                  color: '#8B6914', border: '1px solid rgba(255,215,0,0.25)',
                }}>
                  {medal}
                </span>
              ))}
            </div>
          )}

          {/* Signal Matrix — 2x2 Grid Reviews */}
          <SignalMatrix
            signals={livingSignals}
            onReview={() => router.push(`/app/add-review?placeId=${id}&placeName=${encodeURIComponent(place.name || '')}`)}
          />

          {/* Leave a Review CTA */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <button
              onClick={() => router.push(`/app/add-review?placeId=${id}&placeName=${encodeURIComponent(place.name || '')}`)}
              style={{
                width: '100%', padding: '14px 0', background: 'transparent',
                color: '#8A05BE', border: '2px solid #8A05BE', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                letterSpacing: 0.3, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Add Your Signal
            </button>
          </div>
        </div>

        {/* ===== STORIES (latest videos) ===== */}
        {stories.length > 0 && (
          <div style={{ padding: '0 16px 24px' }}>
            <p style={sectionTitleStyle}>Latest Stories</p>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => window.open(story.url, '_blank')}
                  style={{
                    width: 80, flexShrink: 0, cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                    border: '3px solid #8A05BE', padding: 2, margin: '0 auto 6px',
                  }}>
                    <img
                      src={story.thumbnail_url || story.url}
                      alt={story.caption || 'Story'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  {story.caption && (
                    <p style={{ fontSize: 11, color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {story.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PHOTOS ===== */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ ...sectionTitleStyle, margin: 0 }}>Photos {photos.length > 0 && `(${photos.length})`}</p>
            <button
              onClick={() => {
                if (!userId) { router.push(`/app/login?redirect=${encodeURIComponent(`/place/${id}`)}`); return; }
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.split('.').pop();
                  const fileName = `${id}/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from('place-photos').upload(fileName, file, { contentType: file.type });
                  if (error) { alert('Upload failed'); return; }
                  const { data: urlData } = supabase.storage.from('place-photos').getPublicUrl(fileName);
                  await supabase.from('place_photos').insert({ place_id: id, user_id: userId, url: urlData.publicUrl, status: 'live' });
                  // Reload photos
                  const { data: newPhotos } = await supabase.from('place_photos').select('url, caption').eq('place_id', id).eq('status', 'live').limit(12);
                  if (newPhotos) setPhotos(newPhotos.filter((p: any) => p.url));
                };
                input.click();
              }}
              style={{
                padding: '6px 14px', background: 'none', border: '1.5px solid #ddd',
                borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#666',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Add Photo
            </button>
          </div>
          {photos.length > 0 ? (
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
              paddingBottom: 6,
            }}>
              {photos.map((p, i) => (
                <img
                  key={i}
                  src={p.url}
                  alt={p.caption || `${place.name} photo ${i + 1}`}
                  style={{
                    width: 150, height: 160, objectFit: 'cover',
                    borderRadius: 14, flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>No photos yet — be the first to add one!</p>
          )}
        </div>

        {/* ===== MAP ===== */}
        {(place.latitude || place.lat) && (place.longitude || place.lng) && (
          <div style={{ padding: '0 16px 24px' }}>
            <div
              onClick={handleDirections}
              style={{
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                border: '1px solid #F0F0F0', position: 'relative',
              }}
            >
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${place.latitude || place.lat},${place.longitude || place.lng}&zoom=15&size=480x200&scale=2&markers=color:0x8A05BE%7C${place.latitude || place.lat},${place.longitude || place.lng}&style=feature:all%7Csaturation:-30&key=`}
                alt="Map"
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Fallback if no Google API key */}
              <div style={{
                width: '100%', height: 160, background: 'linear-gradient(135deg, #f0f0f0, #e8e8e8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', top: 0, left: 0, zIndex: -1,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <MapPin size={24} color="#8A05BE" />
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666' }}>
                    {place.address_line1}{place.city ? `, ${place.city}` : ''}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8A05BE', fontWeight: 600 }}>
                    Tap for directions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== INFO SECTION ===== */}
        <div style={{
          padding: '0 16px 32px',
        }}>
          <p style={sectionTitleStyle}>Info</p>

          <div style={{
            background: '#FAFAFA', borderRadius: 16, overflow: 'hidden',
            border: '1px solid #F0F0F0',
          }}>
            {/* Address — hover: background #F5F5F5 (apply via onMouseEnter in production) */}
            <div style={{
              padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: '1px solid #F0F0F0',
              /* hover: { background: '#F5F5F5' } */
            }}>
              <MapPin size={18} color="#8A05BE" />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#444' }}>
                  {place.address_line1}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>
                  {[place.city, place.state_region].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            {/* Phone — hover: { background: '#F5F5F5' } */}
            {place.phone && (
              <div
                onClick={handleCall}
                style={{
                  padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid #F0F0F0', cursor: 'pointer',
                  /* hover: { background: '#F5F5F5' } */
                }}
              >
                <Phone size={18} color="#8A05BE" />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#8A05BE' }}>
                  {place.phone}
                </p>
              </div>
            )}

            {/* Website — hover: { background: '#F5F5F5' } */}
            {place.website && (
              <div
                onClick={() => window.open(place!.website!, '_blank')}
                style={{
                  padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid #F0F0F0', cursor: 'pointer',
                  /* hover: { background: '#F5F5F5' } */
                }}
              >
                <Globe size={18} color="#8A05BE" />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#8A05BE' }}>
                  Visit Website
                </p>
              </div>
            )}

            {/* Directions — hover: { background: '#F5F5F5' } */}
            <div
              onClick={handleDirections}
              style={{
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                /* hover: { background: '#F5F5F5' } */
              }}
            >
              <MapPin size={18} color="#8A05BE" />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#8A05BE' }}>
                Get Directions
              </p>
            </div>
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        {place.description && (
          <div style={{ padding: '0 16px 32px' }}>
            <p style={sectionTitleStyle}>About</p>
            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.7, color: '#444',
            }}>
              {place.description}
            </p>
          </div>
        )}

        {/* Bottom safe area spacer */}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

export const getServerSideProps = async ({ params }: { params: { id: string }; locale: string }) => {
  // The place detail now lives at /app/place/[id] (new signal-review design).
  // Redirect the legacy /place/[id] URL there so old links keep working.
  return {
    redirect: { destination: `/app/place/${params?.id || ''}`, permanent: false },
  };
};
