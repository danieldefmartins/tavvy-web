/**
 * LivePreviewCard -- real-time mini card preview at top of editor.
 * Reads state.card from EditorContext and renders a compact preview
 * that updates instantly as the user edits fields.
 *
 * - Gradient background with profile photo, name, title, social icons
 * - Collapsible with state persisted to localStorage
 * - Tap/click to expand full preview (navigates to preview page)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { SOCIAL_PLATFORMS } from './shared/PlatformPicker';
import { IoChevronDown, IoChevronUp, IoExpand } from 'react-icons/io5';

const ACCENT = '#00C853';
const STORAGE_KEY = 'ecard_live_preview_collapsed';

interface LivePreviewCardProps {
  isDark: boolean;
  onExpandPreview: () => void;
}

export default function LivePreviewCard({ isDark, onExpandPreview }: LivePreviewCardProps) {
  const { state } = useEditor();
  const card = state.card;

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  // Pulse animation on data changes
  const [pulse, setPulse] = useState(false);
  const fingerprint = useMemo(
    () =>
      `${card.full_name}|${card.title}|${card.gradient_color_1}|${card.gradient_color_2}|${card.profile_photo_url}|${card.template_id}`,
    [card.full_name, card.title, card.gradient_color_1, card.gradient_color_2, card.profile_photo_url, card.template_id]
  );
  const prevFingerprint = useRef(fingerprint);

  useEffect(() => {
    if (fingerprint !== prevFingerprint.current) {
      prevFingerprint.current = fingerprint;
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [fingerprint]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const surfaceBg = isDark ? '#111' : '#fff';

  const grad1 = card.gradient_color_1 || '#667eea';
  const grad2 = card.gradient_color_2 || '#764ba2';

  // Collect social links that have values
  const activeSocials = useMemo(() => {
    if (!card.featured_socials || !Array.isArray(card.featured_socials)) return [];
    return card.featured_socials
      .filter((s) => s.url && s.url.trim())
      .slice(0, 6)
      .map((s) => {
        const platform = SOCIAL_PLATFORMS.find((p) => p.id === s.platform);
        return { id: s.platform, name: platform?.name || s.platform };
      });
  }, [card.featured_socials]);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Toggle bar */}
      <button
        onClick={toggleCollapsed}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
          border: `1px solid ${border}`,
          borderRadius: collapsed ? 12 : '12px 12px 0 0',
          cursor: 'pointer',
          transition: 'border-radius 0.2s',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: textSecondary }}>
          Live Preview
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!collapsed && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onExpandPreview();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: ACCENT,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 6,
                background: isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.08)',
              }}
            >
              <IoExpand size={12} />
              Full Preview
            </span>
          )}
          {collapsed ? (
            <IoChevronDown size={16} color={textSecondary} />
          ) : (
            <IoChevronUp size={16} color={textSecondary} />
          )}
        </span>
      </button>

      {/* Preview card */}
      <div
        style={{
          maxHeight: collapsed ? 0 : 280,
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.25s ease',
        }}
      >
        <div
          style={{
            border: `1px solid ${border}`,
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
            background: surfaceBg,
          }}
        >
          {/* Gradient header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${grad1}, ${grad2})`,
              padding: '32px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              animation: pulse ? 'livePreviewPulse 0.6s ease' : undefined,
            }}
          >
            {/* Profile photo */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {card.profile_photo_url ? (
                <img
                  src={card.profile_photo_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {(card.full_name || 'U')[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                textAlign: 'center',
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                lineHeight: 1.2,
              }}
            >
              {card.full_name || 'Your Name'}
            </div>

            {/* Title */}
            {(card.title || '') && (
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {card.title}
              </div>
            )}

            {/* Company */}
            {(card.company || '') && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                {card.company}
              </div>
            )}
          </div>

          {/* Social icons row */}
          {activeSocials.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderTop: `1px solid ${border}`,
              }}
            >
              {activeSocials.map((s) => (
                <div
                  key={s.id}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: textSecondary,
                    textTransform: 'uppercase',
                  }}
                  title={s.name}
                >
                  {s.id.slice(0, 2)}
                </div>
              ))}
            </div>
          )}

          {/* Template badge */}
          <div
            style={{
              padding: '8px 16px 12px',
              textAlign: 'center',
              fontSize: 11,
              color: textSecondary,
              borderTop: activeSocials.length > 0 ? 'none' : `1px solid ${border}`,
            }}
          >
            Template: <strong>{card.template_id || 'basic'}</strong>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes livePreviewPulse {
          0% { opacity: 1; }
          50% { opacity: 0.85; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
