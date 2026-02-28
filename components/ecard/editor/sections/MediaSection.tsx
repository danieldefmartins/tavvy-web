/**
 * MediaSection -- Gallery images and video management.
 */

import React, { useRef, useState } from 'react';
import {
  IoImages,
  IoAdd,
  IoTrash,
  IoClose,
  IoVideocam,
  IoLogoYoutube,
  IoGlobe,
  IoFilm,
  IoCloudUpload,
} from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { uploadEcardFile } from '../../../../lib/ecard';
import { supabase } from '../../../../lib/supabaseClient';
import EditorSection from '../shared/EditorSection';

interface MediaSectionProps {
  isDark: boolean;
  isPro: boolean;
}

type VideoType = 'youtube' | 'tavvy_short' | 'external';

const VIDEO_TYPES: { id: VideoType; name: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'youtube', name: 'YouTube', icon: <IoLogoYoutube size={18} />, placeholder: 'https://youtube.com/watch?v=...' },
  { id: 'tavvy_short', name: 'Tavvy Short', icon: <IoFilm size={18} />, placeholder: 'https://tavvy.com/short/...' },
  { id: 'external', name: 'External URL', icon: <IoGlobe size={18} />, placeholder: 'https://example.com/video.mp4' },
];

export default function MediaSection({ isDark, isPro }: MediaSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const galleryImages = card.gallery_images || [];
  const videos = card.videos || [];

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';
  const overlayBg = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';
  const modalBg = isDark ? '#1E293B' : '#fff';

  // -- Gallery --
  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const previewUrl = URL.createObjectURL(file);
      dispatch({ type: 'ADD_GALLERY_IMAGE', image: { id, url: previewUrl, file } });
    });

    // Reset input so same file(s) can be re-selected
    e.target.value = '';
  };

  const handleGalleryRemove = (id: string) => {
    dispatch({ type: 'REMOVE_GALLERY_IMAGE', id });
  };

  // -- Video file upload (Tavvy Short) --
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        alert('Please sign in to upload videos.');
        return;
      }

      const url = await uploadEcardFile(userId, file, 'videos');
      if (url) {
        setVideoUrl(url);
      } else {
        alert('Failed to upload video. Please try again.');
      }
    } catch (err) {
      console.error('Video upload error:', err);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // -- Videos --
  const handleAddVideo = () => {
    if (!videoUrl.trim()) return;
    dispatch({ type: 'ADD_VIDEO', video: { type: videoType, url: videoUrl.trim() } });
    setVideoUrl('');
    setVideoType('youtube');
    setVideoModalOpen(false);
  };

  const handleRemoveVideo = (index: number) => {
    dispatch({ type: 'REMOVE_VIDEO', index });
  };

  return (
    <EditorSection
      id="media"
      title="Media"
      icon={<IoImages size={20} />}
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Gallery Section ===== */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>Gallery</span>
          <span style={{ fontSize: 12, color: textSecondary }}>
            {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Hidden file input for gallery */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleGalleryAdd}
        />

        {/* Gallery grid */}
        {galleryImages.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {galleryImages.map((img) => (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: cardBg,
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => handleGalleryRemove(img.id)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <IoTrash size={12} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add gallery image button */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            border: `1px dashed ${borderColor}`,
            borderRadius: 10,
            background: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#00C853',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <IoAdd size={18} />
          Add Images
        </button>
      </div>

      {/* ===== Videos Section ===== */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>Videos</span>
          <span style={{ fontSize: 12, color: textSecondary }}>
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Video list */}
        {videos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {videos.map((video, index) => {
              const typeInfo = VIDEO_TYPES.find((t) => t.id === video.type) || VIDEO_TYPES[2];
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: textSecondary,
                    }}
                  >
                    {typeInfo.icon}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: textSecondary,
                        textTransform: 'capitalize',
                      }}
                    >
                      {typeInfo.name}
                    </span>
                    <p
                      style={{
                        fontSize: 12,
                        color: textSecondary,
                        margin: '2px 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {video.url}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveVideo(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 6,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <IoTrash size={16} color="#EF4444" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add video button */}
        <button
          onClick={() => setVideoModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            border: `1px dashed ${borderColor}`,
            borderRadius: 10,
            background: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#00C853',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <IoVideocam size={18} />
          Add Video
        </button>
      </div>

      {/* ===== Add Video Modal ===== */}
      {videoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: overlayBg,
          }}
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 420,
              background: modalBg,
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: textPrimary }}>Add Video</span>
              <button
                onClick={() => setVideoModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <IoClose size={20} color={textSecondary} />
              </button>
            </div>

            {/* Video type selector */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: textSecondary,
                  marginBottom: 8,
                }}
              >
                Video Type
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {VIDEO_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setVideoType(type.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: `2px solid ${videoType === type.id ? '#00C853' : borderColor}`,
                      background: videoType === type.id
                        ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                        : 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                      color: videoType === type.id ? '#00C853' : textSecondary,
                    }}
                  >
                    {type.icon}
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload / URL input */}
            <div style={{ marginBottom: 20 }}>
              {/* Hidden file input for video upload */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoFileSelect}
              />

              {videoType === 'tavvy_short' && (
                <>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    Upload Video
                  </label>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '14px 16px',
                      border: `2px dashed ${uploading ? '#00C853' : borderColor}`,
                      borderRadius: 10,
                      background: uploading
                        ? (isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.04)')
                        : 'none',
                      cursor: uploading ? 'wait' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: uploading ? '#00C853' : textSecondary,
                      transition: 'all 0.2s',
                    }}
                  >
                    <IoCloudUpload size={20} />
                    {uploading ? 'Uploading...' : 'Choose Video from Device'}
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      margin: '12px 0',
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: borderColor }} />
                    <span style={{ fontSize: 12, color: textSecondary }}>or paste URL</span>
                    <div style={{ flex: 1, height: 1, background: borderColor }} />
                  </div>
                </>
              )}

              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: textSecondary,
                  marginBottom: 6,
                }}
              >
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={VIDEO_TYPES.find((t) => t.id === videoType)?.placeholder}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  fontSize: 14,
                  backgroundColor: inputBg,
                  color: inputColor,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setVideoModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  background: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  color: textSecondary,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: videoUrl.trim() ? '#00C853' : (isDark ? '#334155' : '#E5E7EB'),
                  fontSize: 14,
                  fontWeight: 500,
                  color: videoUrl.trim() ? '#fff' : textSecondary,
                  cursor: videoUrl.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}
    </EditorSection>
  );
}
