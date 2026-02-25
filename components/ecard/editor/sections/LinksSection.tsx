/**
 * LinksSection -- Manage link items with platform picker and free-tier limit notice.
 */

import React, { useState } from 'react';
import { IoLink, IoAdd, IoClose, IoLockClosed } from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { FREE_LINK_LIMIT } from '../../../../lib/ecard';
import EditorSection from '../shared/EditorSection';
import LinkEditor from '../shared/LinkEditor';
import PlatformPicker, { SOCIAL_PLATFORMS } from '../shared/PlatformPicker';

interface LinksSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function LinksSection({ isDark, isPro }: LinksSectionProps) {
  const { state, dispatch } = useEditor();
  const links = state.links;
  const [pickerOpen, setPickerOpen] = useState(false);

  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const warningBg = isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB';
  const warningBorder = isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A';

  const isAtLimit = !isPro && links.length >= FREE_LINK_LIMIT;

  const handleAddLink = (platformId: string) => {
    if (isAtLimit) return;

    const newLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: platformId,
      title: '',
      url: '',
      sort_order: links.length,
      is_active: true,
    };

    dispatch({ type: 'ADD_LINK', link: newLink });
    setPickerOpen(false);
  };

  const handleUpdateTitle = (id: string, title: string) => {
    dispatch({ type: 'UPDATE_LINK', id, updates: { title } });
  };

  const handleUpdateUrl = (id: string, url: string) => {
    dispatch({ type: 'UPDATE_LINK', id, updates: { url } });
  };

  const handleRemoveLink = (id: string) => {
    dispatch({ type: 'REMOVE_LINK', id });
  };

  return (
    <EditorSection
      id="links"
      title="Links"
      icon={<IoLink size={20} />}
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Link List */}
      {links.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {links.map((link) => (
            <LinkEditor
              key={link.id}
              link={link}
              onUpdateTitle={(title) => handleUpdateTitle(link.id, title)}
              onUpdateUrl={(url) => handleUpdateUrl(link.id, url)}
              onRemove={() => handleRemoveLink(link.id)}
              isDark={isDark}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {links.length === 0 && !pickerOpen && (
        <p style={{ fontSize: 13, color: textSecondary, marginBottom: 16, textAlign: 'center' }}>
          No links added yet. Add links to share on your card.
        </p>
      )}

      {/* Free tier limit notice */}
      {isAtLimit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 10,
            background: warningBg,
            border: `1px solid ${warningBorder}`,
            marginBottom: 16,
          }}
        >
          <IoLockClosed size={16} color="#F59E0B" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#F59E0B', margin: 0 }}>
              Free plan limit reached ({FREE_LINK_LIMIT} links)
            </p>
            <p style={{ fontSize: 12, color: textSecondary, margin: '4px 0 0' }}>
              Upgrade to Pro for unlimited links.
            </p>
          </div>
        </div>
      )}

      {/* Link count */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: textSecondary }}>
          {links.length}{!isPro ? ` / ${FREE_LINK_LIMIT}` : ''} links
        </span>
      </div>

      {/* Add button / Picker */}
      {!isAtLimit && (
        <>
          {!pickerOpen ? (
            <button
              onClick={() => setPickerOpen(true)}
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
              Add Link
            </button>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: textSecondary }}>
                  Choose a platform
                </span>
                <button
                  onClick={() => setPickerOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <IoClose size={18} color={textSecondary} />
                </button>
              </div>
              <PlatformPicker
                platforms={SOCIAL_PLATFORMS}
                onSelect={handleAddLink}
                isDark={isDark}
              />
            </div>
          )}
        </>
      )}
    </EditorSection>
  );
}
