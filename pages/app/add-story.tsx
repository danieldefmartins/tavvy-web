/**
 * Add Story Page - Web Version
 * Allows users to upload stories to places within a universe
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  IoArrowBack, IoClose, IoCamera, IoImage, IoCheckmark,
  IoLocation, IoChevronDown
} from 'react-icons/io5';

interface Place {
  id: string;
  name: string;
  cover_image_url: string | null;
  category: string | null;
}

export default function AddStoryPage() {
  const router = useRouter();
  const { universeId, universeName, placeId: initialPlaceId } = router.query;
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showPlaceSelector, setShowPlaceSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#0D0D1A' : '#FFFFFF',
    card: isDark ? '#1A1A2E' : '#F8F9FA',
    text: isDark ? '#FFFFFF' : '#1B2B5B',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    border: isDark ? '#333' : '#E5E7EB',
    primary: '#06B6D4',
    error: '#EF4444',
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        router.push('/app/login?redirect=' + encodeURIComponent(router.asPath));
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!universeId) return;
      
      try {
        setLoading(true);
        
        // Get place IDs for this universe
        const { data: placeLinks } = await supabase
          .from('atlas_universe_places')
          .select('place_id')
          .eq('universe_id', universeId);
        
        if (!placeLinks || placeLinks.length === 0) {
          setPlaces([]);
          return;
        }

        const placeIds = placeLinks.map(link => link.place_id);

        // Fetch place details
        const { data: placesData } = await supabase
          .from('places')
          .select('id, name, cover_image_url, category')
          .in('id', placeIds)
          .order('name');

        if (placesData && placesData.length > 0) {
          setPlaces(placesData);
          
          // If initialPlaceId is provided, select that place
          if (initialPlaceId) {
            const place = placesData.find(p => p.id === initialPlaceId);
            if (place) setSelectedPlace(place);
          } else {
            // Auto-select the first place (or only place)
            setSelectedPlace(placesData[0]);
          }
        } else {
          // No places found in canonical table — try fsq_places_raw
          const { data: fsqPlaces } = await supabase
            .from('fsq_places_raw')
            .select('fsq_id, name, category')
            .in('fsq_id', placeIds)
            .limit(50);
          if (fsqPlaces && fsqPlaces.length > 0) {
            const mapped = fsqPlaces.map(p => ({
              id: p.fsq_id,
              name: p.name,
              cover_image_url: null,
              category: p.category,
            }));
            setPlaces(mapped);
            setSelectedPlace(mapped[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [universeId, initialPlaceId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('[Story Upload] onChange fired, files:', files?.length);
    if (!files || files.length === 0) {
      console.log('[Story Upload] No files in input');
      return;
    }
    
    // Copy the file reference immediately
    const file = files[0];
    const fileName = file.name || 'unknown';
    const fileType = file.type || '';
    const fileSize = file.size || 0;
    
    console.log('[Story Upload] File selected:', { name: fileName, type: fileType, size: fileSize });
    
    // Determine media type from MIME or extension
    const isVideo = fileType.startsWith('video/') || /\.(mp4|mov|m4v|avi|quicktime|3gp)$/i.test(fileName);
    const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(fileName);
    // iOS sometimes gives empty type for .mov files
    const isLikelyVideo = !fileType && /\.(mp4|mov|m4v)$/i.test(fileName);
    const isLikelyImage = !fileType && /\.(jpg|jpeg|png|heic|heif)$/i.test(fileName);
    
    if (!isVideo && !isImage && !isLikelyVideo && !isLikelyImage) {
      // Be very lenient — if we can't determine type, still accept it
      console.log('[Story Upload] Unknown type, accepting anyway:', fileType, fileName);
    }
    
    // Validate file size (max 50MB)
    if (fileSize > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    // Clean up previous preview URL
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch(e) {}
    }

    const detectedType = (isVideo || isLikelyVideo) ? 'video' : 'image';
    setMediaType(detectedType);
    setSelectedFile(file);
    setFileSelected(true);
    setError(null);

    // Try to create preview URL
    try {
      const url = URL.createObjectURL(file);
      console.log('[Story Upload] Preview URL created:', url, 'type:', detectedType);
      setPreviewUrl(url);
    } catch (err) {
      console.error('[Story Upload] createObjectURL failed:', err);
      // Even if preview fails, the file is still selected for upload
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedPlace || !user) {
      setError('Please select a place and upload a photo or video');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload file to Supabase Storage (bucket: place-stories, matching iOS)
      const fileExt = selectedFile.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
      const fileName = `${user.id}/${selectedPlace.id}/${Date.now()}.${fileExt}`;
      // Determine content type — iOS Safari may give empty type for .mov
      let contentType = selectedFile.type;
      if (!contentType) {
        if (/\.mov$/i.test(selectedFile.name)) contentType = 'video/quicktime';
        else if (/\.mp4$/i.test(selectedFile.name)) contentType = 'video/mp4';
        else if (/\.(jpg|jpeg)$/i.test(selectedFile.name)) contentType = 'image/jpeg';
        else if (/\.png$/i.test(selectedFile.name)) contentType = 'image/png';
        else if (/\.heic$/i.test(selectedFile.name)) contentType = 'image/heic';
        else contentType = 'application/octet-stream';
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('place-stories')
        .upload(fileName, selectedFile, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('place-stories')
        .getPublicUrl(fileName);

      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create story record (matching iOS schema exactly)
      const { error: insertError } = await supabase
        .from('place_stories')
        .insert({
          place_id: selectedPlace.id,
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption || null,
          expires_at: expiresAt.toISOString(),
          status: 'active',
          is_permanent: false,
          universe_id: universeId || null,
        });

      if (insertError) throw insertError;

      // Success - go back to previous page (universe page)
      alert('Story uploaded successfully! It will be visible for 24 hours.');
      router.back();
      
    } catch (err: any) {
      console.error('Error uploading story:', err);
      setError(err.message || 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AppLayout>
      <Head>
        <title>Add Story | TavvY</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IoArrowBack size={24} color={colors.text} />
          </button>
          
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.text,
            margin: 0,
          }}>
            Add Story
          </h1>
          
          <button
            onClick={handleUpload}
            disabled={!fileSelected || !selectedPlace || uploading}
            style={{
              background: fileSelected && selectedPlace ? colors.primary : colors.border,
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              cursor: fileSelected && selectedPlace ? 'pointer' : 'not-allowed',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? (
              <span style={{ color: '#fff', fontSize: '14px' }}>Uploading...</span>
            ) : (
              <IoCheckmark size={20} color="#fff" />
            )}
          </button>
        </div>

        {/* Universe Name */}
        {universeName && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: isDark ? '#1A1A2E' : '#F0F9FF',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: colors.textSecondary,
            }}>
              Adding story to <strong style={{ color: colors.primary }}>{universeName}</strong>
            </p>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '16px' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ margin: 0, color: colors.error, fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {/* Place Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.text,
              marginBottom: '8px',
            }}>
              Select a Place
            </label>
            
            <button
              onClick={() => setShowPlaceSelector(!showPlaceSelector)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedPlace ? (
                  <>
                    {selectedPlace.cover_image_url && (
                      <img
                        src={selectedPlace.cover_image_url}
                        alt={selectedPlace.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, color: colors.text, fontWeight: '500' }}>
                        {selectedPlace.name}
                      </p>
                      {selectedPlace.category && (
                        <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                          {selectedPlace.category}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ color: colors.textSecondary }}>
                    {loading ? 'Loading places...' : 'Choose a place'}
                  </span>
                )}
              </div>
              <IoChevronDown size={20} color={colors.textSecondary} />
            </button>

            {/* Place Dropdown */}
            {showPlaceSelector && (
              <div style={{
                marginTop: '8px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {places.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
                    No places found in this universe.
                  </div>
                ) : places.map(place => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setShowPlaceSelector(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: selectedPlace?.id === place.id ? (isDark ? '#2A2A3E' : '#E0F7FA') : 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {place.cover_image_url && (
                      <img
                        src={place.cover_image_url}
                        alt={place.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div>
                      <p style={{ margin: 0, color: colors.text, fontWeight: '500' }}>
                        {place.name}
                      </p>
                      {place.category && (
                        <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                          {place.category}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.text,
              marginBottom: '8px',
            }}>
              Photo or Video
            </label>

            {/* File input - use sr-only pattern that works on iOS Safari */}
            <input
              id="story-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture={undefined}
              onChange={handleFileSelect}
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0,
              }}
            />

            {(previewUrl || fileSelected) ? (
              <div style={{ position: 'relative' }}>
                {!previewUrl && fileSelected ? (
                  /* Fallback when preview URL couldn't be created */
                  <div style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? '#1A1A2E' : '#F0F0F0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '48px' }}>{mediaType === 'video' ? '🎬' : '📷'}</span>
                    <p style={{ margin: 0, color: colors.text, fontWeight: '500' }}>
                      {selectedFile?.name || 'File selected'}
                    </p>
                    <p style={{ margin: 0, color: colors.textSecondary, fontSize: '12px' }}>
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                    </p>
                    <p style={{ margin: 0, color: colors.primary, fontSize: '13px' }}>
                      Ready to upload ✓
                    </p>
                  </div>
                ) : mediaType === 'video' ? (
                  <video
                    key={previewUrl}
                    src={previewUrl}
                    controls
                    playsInline
                    muted
                    autoPlay={false}
                    preload="auto"
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      objectFit: 'contain',
                      backgroundColor: '#000',
                    }}
                    onError={(e) => {
                      console.error('[Story Upload] Video preview error:', e);
                      // If video preview fails, show a fallback
                      setError('Video preview not available, but the file is selected. You can still upload it.');
                    }}
                  />
                ) : (
                  <img
                    key={previewUrl}
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      objectFit: 'contain',
                      backgroundColor: colors.card,
                    }}
                    onError={(e) => {
                      console.error('[Story Upload] Image preview error:', e);
                    }}
                  />
                )}
                <button
                  onClick={() => {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setFileSelected(false);
                    setMediaType('image');
                    // Reset file input so same file can be re-selected
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IoClose size={20} color="#fff" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="story-file-input"
                style={{
                  display: 'flex',
                  width: '100%',
                  aspectRatio: '9/16',
                  maxHeight: '400px',
                  backgroundColor: colors.card,
                  border: `2px dashed ${colors.border}`,
                  borderRadius: '12px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#2A2A3E' : '#E0F7FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <IoCamera size={32} color={colors.primary} />
                </div>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                  Tap to add photo or video
                </p>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '12px' }}>
                  Max 50MB
                </p>
              </label>
            )}
          </div>

          {/* Caption */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.text,
              marginBottom: '8px',
            }}>
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              maxLength={500}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 16px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                color: colors.text,
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <p style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: colors.textSecondary,
              textAlign: 'right',
            }}>
              {caption.length}/500
            </p>
          </div>

          {/* Info */}
          <div style={{
            padding: '16px',
            backgroundColor: isDark ? '#1A1A2E' : '#F0F9FF',
            borderRadius: '12px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: colors.textSecondary,
              lineHeight: '1.5',
            }}>
              📸 Your story will be visible for 24 hours. If it's the only story for this place, it will stay visible until someone adds a new one.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
