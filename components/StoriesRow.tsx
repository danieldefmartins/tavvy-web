// =============================================
// STORIES ROW COMPONENT - Web Version
// =============================================
// Horizontal scrollable row of place story avatars
// Similar to Instagram/Facebook stories at the top

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PlaceWithStories {
  placeId: string;
  placeName: string;
  placeImage: string | null;
  storyCount: number;
  hasUnviewedStories: boolean;
  latestStoryId: string;
  latestMediaUrl: string;
  latestMediaType: 'image' | 'video';
}

interface Story {
  id: string;
  placeId: string;
  placeName: string;
  placeImage: string | null;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  expiresAt: string;
}

interface StoriesRowProps {
  universeId?: string;
  placeIds?: string[];
  userId?: string;
  onStoryPress?: (placeId: string, stories: Story[]) => void;
  onAddStoryPress?: () => void;
  maxPlaces?: number;
  isDark?: boolean;
}

const COLORS = {
  storyRingActive: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4, #45B7D1)',
  storyRingViewed: 'linear-gradient(135deg, #C4C4C4, #A0A0A0)',
};

export default function StoriesRow({
  universeId,
  placeIds,
  userId,
  onStoryPress,
  onAddStoryPress,
  maxPlaces = 10,
  isDark = false,
}: StoriesRowProps) {
  const [placesWithStories, setPlacesWithStories] = useState<PlaceWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const fetchStoriesForUniverse = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Get place IDs for this universe
      let targetPlaceIds = placeIds || [];
      
      if (universeId && !placeIds) {
        const { data: placeLinks } = await supabase
          .from('atlas_universe_places')
          .select('place_id')
          .eq('universe_id', universeId);
        
        if (placeLinks) {
          targetPlaceIds = placeLinks.map(link => link.place_id);
        }
      }

      if (targetPlaceIds.length === 0) {
        setPlacesWithStories([]);
        return;
      }

      // Get active stories for these places
      const { data: stories, error: storiesError } = await supabase
        .from('place_stories')
        .select(`
          id,
          place_id,
          media_url,
          media_type,
          caption,
          thumbnail_url,
          created_at,
          expires_at,
          user_id,
          is_permanent
        `)
        .in('place_id', targetPlaceIds)
        .eq('status', 'active')
        .or(`expires_at.gt.${now},is_permanent.eq.true`)
        .order('created_at', { ascending: false });

      if (storiesError || !stories || stories.length === 0) {
        setPlacesWithStories([]);
        return;
      }

      // Get unique place IDs with stories
      const placeIdsWithStories = [...new Set(stories.map((s: any) => s.place_id))];

      // Fetch place details
      const { data: places } = await supabase
        .from('places')
        .select('id, name, cover_image_url')
        .in('id', placeIdsWithStories);

      // Get user's viewed stories
      let viewedIds = new Set<string>();
      if (userId) {
        const { data: views } = await supabase
          .from('place_story_views')
          .select('story_id')
          .eq('user_id', userId);
        
        if (views) {
          viewedIds = new Set(views.map((v: any) => v.story_id));
        }
      }
      setViewedStoryIds(viewedIds);

      // Build places with stories data
      const placesMap = new Map<string, PlaceWithStories>();
      
      stories.forEach((story: any) => {
        const place = places?.find((p: any) => p.id === story.place_id);
        if (!place) return;

        const existing = placesMap.get(story.place_id);
        const isUnviewed = !viewedIds.has(story.id);

        if (existing) {
          existing.storyCount++;
          if (isUnviewed) existing.hasUnviewedStories = true;
        } else {
          placesMap.set(story.place_id, {
            placeId: story.place_id,
            placeName: place.name,
            placeImage: place.cover_image_url,
            storyCount: 1,
            hasUnviewedStories: isUnviewed,
            latestStoryId: story.id,
            latestMediaUrl: story.media_url,
            latestMediaType: story.media_type || 'image',
          });
        }
      });

      const result = Array.from(placesMap.values()).slice(0, maxPlaces);
      setPlacesWithStories(result);

    } catch (err) {
      console.error('[StoriesRow] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [universeId, placeIds, userId, maxPlaces]);

  useEffect(() => {
    fetchStoriesForUniverse();
  }, [fetchStoriesForUniverse]);

  const handleStoryPress = async (placeId: string) => {
    const now = new Date().toISOString();
    const { data: stories } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'active')
      .or(`expires_at.gt.${now},is_permanent.eq.true`)
      .order('created_at', { ascending: true });

    if (stories && stories.length > 0) {
      const place = placesWithStories.find(p => p.placeId === placeId);
      const formattedStories: Story[] = stories.map((s: any) => ({
        id: s.id,
        placeId: s.place_id,
        placeName: place?.placeName || 'Unknown Place',
        placeImage: place?.placeImage || null,
        userId: s.user_id,
        mediaUrl: s.media_url,
        mediaType: s.media_type || 'image',
        caption: s.caption,
        thumbnailUrl: s.thumbnail_url,
        createdAt: s.created_at,
        expiresAt: s.expires_at,
      }));
      
      if (onStoryPress) {
        onStoryPress(placeId, formattedStories);
      } else {
        setSelectedStories(formattedStories);
        setCurrentStoryIndex(0);
        setShowStoryViewer(true);
      }
    }
  };

  const markStoryAsViewed = async (storyId: string) => {
    if (!userId || viewedStoryIds.has(storyId)) return;
    
    await supabase
      .from('place_story_views')
      .insert({ story_id: storyId, user_id: userId });
    
    setViewedStoryIds(prev => new Set([...prev, storyId]));
  };

  const closeStoryViewer = () => {
    setShowStoryViewer(false);
    setSelectedStories([]);
    setCurrentStoryIndex(0);
  };

  const nextStory = () => {
    if (currentStoryIndex < selectedStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      closeStoryViewer();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  // Mark current story as viewed when it's displayed
  useEffect(() => {
    if (showStoryViewer && selectedStories[currentStoryIndex]) {
      markStoryAsViewed(selectedStories[currentStoryIndex].id);
    }
  }, [showStoryViewer, currentStoryIndex, selectedStories]);

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e0e0e0',
          borderTopColor: '#06B6D4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (placesWithStories.length === 0 && !onAddStoryPress) {
    return null;
  }

  const colors = {
    background: isDark ? '#1A1A2E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1B2B5B',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    border: isDark ? '#333' : '#E5E7EB',
  };

  return (
    <>
      <div style={{
        padding: '12px 0',
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingLeft: '16px',
          paddingRight: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Add Story Button */}
          {onAddStoryPress && (
            <div
              onClick={onAddStoryPress}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                minWidth: '72px',
              }}
            >
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                border: '2px dashed #06B6D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#2A2A3E' : '#F0F9FF',
              }}>
                <span style={{ fontSize: '28px', color: '#06B6D4' }}>+</span>
              </div>
              <span style={{
                fontSize: '11px',
                color: colors.textSecondary,
                marginTop: '6px',
                textAlign: 'center',
                maxWidth: '72px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                Add Story
              </span>
            </div>
          )}

          {/* Story Avatars */}
          {placesWithStories.map((place) => (
            <div
              key={place.placeId}
              onClick={() => handleStoryPress(place.placeId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                minWidth: '72px',
              }}
            >
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                padding: '3px',
                background: place.hasUnviewedStories
                  ? COLORS.storyRingActive
                  : COLORS.storyRingViewed,
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `3px solid ${colors.background}`,
                  backgroundColor: isDark ? '#2A2A3E' : '#F3F4F6',
                }}>
                  {place.placeImage ? (
                    <img
                      src={place.placeImage}
                      alt={place.placeName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      🏪
                    </div>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                color: colors.text,
                marginTop: '6px',
                textAlign: 'center',
                maxWidth: '72px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {place.placeName}
              </span>
              {place.storyCount > 1 && (
                <span style={{
                  fontSize: '9px',
                  color: colors.textSecondary,
                }}>
                  {place.storyCount} stories
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {showStoryViewer && selectedStories.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Progress Bar */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 16px',
          }}>
            {selectedStories.map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: idx <= currentStoryIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginRight: '12px',
              backgroundColor: '#333',
            }}>
              {selectedStories[currentStoryIndex]?.placeImage ? (
                <img
                  src={selectedStories[currentStoryIndex].placeImage!}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  🏪
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                {selectedStories[currentStoryIndex]?.placeName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {new Date(selectedStories[currentStoryIndex]?.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={closeStoryViewer}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              ×
            </button>
          </div>

          {/* Story Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Left tap area */}
            <div
              onClick={prevStory}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '30%',
                cursor: 'pointer',
              }}
            />
            
            {/* Story media */}
            {selectedStories[currentStoryIndex]?.mediaType === 'video' ? (
              <video
                src={selectedStories[currentStoryIndex].mediaUrl}
                autoPlay
                playsInline
                onEnded={nextStory}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <img
                src={selectedStories[currentStoryIndex]?.mediaUrl}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            )}

            {/* Right tap area */}
            <div
              onClick={nextStory}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '30%',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Caption */}
          {selectedStories[currentStoryIndex]?.caption && (
            <div style={{
              padding: '16px',
              color: '#FFFFFF',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {selectedStories[currentStoryIndex].caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
