/**
 * CONTENT BLOCK RENDERER - Atlas v2.0 (Web Version)
 * ============================================================================
 * Renders block-based content for Atlas articles
 * Ported from tavvy-mobile/components/atlas/ContentBlockRenderer.tsx
 * Supports: heading, paragraph, image, bullet_list, numbered_list,
 * place_card, itinerary, itinerary_day, callout, checklist, quote, divider, list, tip_box
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { IoCheckmark, IoBulb, IoWarning, IoInformationCircle, IoPaw, IoChatboxEllipses, IoLocation } from 'react-icons/io5';

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_BG = '#F0FDFA';
const AMBER_WARNING = '#F59E0B';
const AMBER_BG = '#FFFBEB';
const BLUE_INFO = '#3B82F6';
const BLUE_BG = '#EFF6FF';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentBlock {
  type: string;
  [key: string]: any;
}

export interface HeadingBlock extends ContentBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock extends ContentBlock {
  type: 'paragraph';
  text: string;
}

export interface ImageBlock extends ContentBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface BulletListBlock extends ContentBlock {
  type: 'bullet_list';
  items: string[];
}

export interface NumberedListBlock extends ContentBlock {
  type: 'numbered_list';
  items: string[];
}

export interface PlaceCardBlock extends ContentBlock {
  type: 'place_card';
  place_id: string;
}

export interface ItineraryBlock extends ContentBlock {
  type: 'itinerary';
  title?: string;
  days: ItineraryDay[];
}

export interface ItineraryDay {
  day_number: number;
  title: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  time?: string;
  title: string;
  description?: string;
  place_id?: string;
}

export interface ItineraryDayBlock extends ContentBlock {
  type: 'itinerary_day';
  title: string;
  items: ItineraryDayItem[];
}

export interface ItineraryDayItem {
  time: string;
  activity: string;
}

export interface CalloutBlock extends ContentBlock {
  type: 'callout';
  style: 'tip' | 'warning' | 'tavvy_note' | 'info';
  title?: string;
  text: string;
}

export interface ChecklistBlock extends ContentBlock {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface QuoteBlock extends ContentBlock {
  type: 'quote';
  text: string;
  author?: string;
}

export interface DividerBlock extends ContentBlock {
  type: 'divider';
}

interface PlaceData {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  photos?: any;
  street?: string;
  city?: string;
  region?: string;
  cover_image_url?: string;
}

interface ReadingSettings {
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  isDark?: boolean;
}

// ============================================================================
// BLOCK COMPONENTS
// ============================================================================

// Heading Block
const HeadingBlockComponent: React.FC<{ block: HeadingBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26, isDark } = settings;
  
  const headingSizes = {
    1: { fontSize: fontSize + 12, lineHeight: lineHeight + 10 },
    2: { fontSize: fontSize + 6, lineHeight: lineHeight + 4 },
    3: { fontSize: fontSize + 2, lineHeight: lineHeight },
  };

  const textContent = block.text || (block as any).content || '';
  const defaultColor = isDark ? '#F9FAFB' : '#111827';

  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag style={{
      fontSize: headingSizes[block.level].fontSize,
      lineHeight: `${headingSizes[block.level].lineHeight}px`,
      color: textColor || defaultColor,
      fontWeight: 700,
      marginTop: 24,
      marginBottom: 12,
    }}>
      {textContent}
    </Tag>
  );
};

// Paragraph Block
const ParagraphBlockComponent: React.FC<{ block: ParagraphBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26, isDark } = settings;
  
  const textContent = block.text || (block as any).content || '';
  const defaultColor = isDark ? '#D1D5DB' : '#374151';

  // Simple markdown-like parsing for bold
  const renderText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <p style={{
      fontSize,
      lineHeight: `${lineHeight}px`,
      color: textColor || defaultColor,
      marginBottom: 16,
    }}>
      {renderText(textContent)}
    </p>
  );
};

// Image Block
const ImageBlockComponent: React.FC<{ block: ImageBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, isDark } = settings;
  
  return (
    <div style={{ marginTop: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
      <img
        src={block.url}
        alt={block.alt || ''}
        style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: '#E5E7EB' }}
      />
      {block.caption && (
        <p style={{
          fontSize: 13,
          color: textColor ? `${textColor}B3` : (isDark ? '#9CA3AF' : '#6B7280'),
          textAlign: 'center',
          marginTop: 8,
          fontStyle: 'italic',
        }}>
          {block.caption}
        </p>
      )}
    </div>
  );
};

// Bullet List Block
const BulletListBlockComponent: React.FC<{ block: BulletListBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24, isDark } = settings;
  const defaultColor = isDark ? '#D1D5DB' : '#374151';
  
  return (
    <ul style={{ marginTop: 12, marginBottom: 12, paddingLeft: 0, listStyle: 'none' }}>
      {block.items.map((item, index) => (
        <li key={index} style={{ display: 'flex', marginBottom: 8, paddingRight: 16 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: TEAL_PRIMARY,
            marginTop: 8,
            marginRight: 12,
            flexShrink: 0,
          }} />
          <span style={{ flex: 1, fontSize, lineHeight: `${lineHeight}px`, color: textColor || defaultColor }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
};

// Numbered List Block
const NumberedListBlockComponent: React.FC<{ block: NumberedListBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24, isDark } = settings;
  const defaultColor = isDark ? '#D1D5DB' : '#374151';
  
  return (
    <ol style={{ marginTop: 12, marginBottom: 12, paddingLeft: 0, listStyle: 'none' }}>
      {block.items.map((item, index) => (
        <li key={index} style={{ display: 'flex', marginBottom: 8, paddingRight: 16 }}>
          <span style={{
            fontSize,
            fontWeight: 600,
            color: TEAL_PRIMARY,
            marginRight: 8,
            minWidth: 20,
          }}>
            {index + 1}.
          </span>
          <span style={{ flex: 1, fontSize, lineHeight: `${lineHeight}px`, color: textColor || defaultColor }}>
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
};

// Place Card Block
const PlaceCardBlockComponent: React.FC<{ block: PlaceCardBlock }> = ({ block }) => {
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaceData = async () => {
      try {
        const { data, error } = await supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, photos, street, city, region, cover_image_url')
          .eq('id', block.place_id)
          .single();

        if (error) throw error;
        setPlace(data);
      } catch (error) {
        console.error('Error fetching place:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceData();
  }, [block.place_id]);

  if (loading) {
    return (
      <div style={{
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginVertical: 12,
      }}>
        <span style={{ color: '#6B7280', fontSize: 14 }}>Loading place...</span>
      </div>
    );
  }

  if (!place) return null;

  const placeImage = place.cover_image_url || 
    (Array.isArray(place.photos) ? place.photos[0]?.url || place.photos[0] : null) || 
    'https://via.placeholder.com/100';

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      marginBottom: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #E5E7EB',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={placeImage}
          alt={place.name}
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            objectFit: 'cover',
          }}
        />
        <div style={{ marginLeft: 12, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
            {place.name}
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: TEAL_PRIMARY }}>
            {place.tavvy_category || place.tavvy_subcategory || 'Local Business'}
          </p>
          {place.city && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
              {place.city}{place.region ? `, ${place.region}` : ''}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/app/place/${place.id}`}
        style={{
          display: 'block',
          marginTop: 12,
          padding: '10px 16px',
          backgroundColor: TEAL_PRIMARY,
          color: '#fff',
          textAlign: 'center',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        View on Tavvy
      </Link>
    </div>
  );
};

// Itinerary Block
const ItineraryBlockComponent: React.FC<{ block: ItineraryBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24, isDark } = settings;
  const defaultColor = isDark ? '#D1D5DB' : '#374151';

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      {block.title && (
        <h3 style={{ fontSize: 18, fontWeight: 700, color: textColor || (isDark ? '#F9FAFB' : '#111827'), marginBottom: 16 }}>
          {block.title}
        </h3>
      )}
      {block.days.map((day, dayIndex) => (
        <div key={dayIndex} style={{ marginBottom: 20, paddingLeft: 16, borderLeft: `3px solid ${TEAL_PRIMARY}` }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{
              backgroundColor: TEAL_PRIMARY,
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 600,
            }}>
              Day {day.day_number}
            </span>
            <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 600, color: textColor || defaultColor }}>
              {day.title}
            </span>
          </div>
          {day.items.map((item, itemIndex) => (
            <div key={itemIndex} style={{ marginBottom: 12, paddingLeft: 8 }}>
              {item.time && (
                <span style={{ fontSize: fontSize - 2, color: TEAL_PRIMARY, fontWeight: 500 }}>
                  {item.time}
                </span>
              )}
              <p style={{ margin: '4px 0', fontSize, color: textColor || defaultColor, fontWeight: 500 }}>
                {item.title}
              </p>
              {item.description && (
                <p style={{ margin: '4px 0', fontSize: fontSize - 2, color: textColor || '#6B7280', opacity: 0.8 }}>
                  {item.description}
                </p>
              )}
              {item.place_id && (
                <Link
                  href={`/app/place/${item.place_id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: TEAL_PRIMARY, fontSize: 13, marginTop: 4, textDecoration: 'none' }}
                >
                  <IoLocation size={14} />
                  <span>View on Tavvy</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Itinerary Day Block (single day)
const ItineraryDayBlockComponent: React.FC<{ block: ItineraryDayBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, isDark } = settings;
  const defaultColor = isDark ? '#D1D5DB' : '#374151';
  
  return (
    <div style={{ marginTop: 16, marginBottom: 16, paddingLeft: 16, borderLeft: `3px solid ${TEAL_PRIMARY}` }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          backgroundColor: TEAL_PRIMARY,
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 16,
          fontSize: 13,
          fontWeight: 600,
        }}>
          Itinerary
        </span>
        <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 600, color: textColor || defaultColor }}>
          {block.title}
        </span>
      </div>
      {block.items.map((item, itemIndex) => (
        <div key={itemIndex} style={{ marginBottom: 12, paddingLeft: 8 }}>
          <span style={{ fontSize: fontSize - 2, color: TEAL_PRIMARY, fontWeight: 500 }}>
            {item.time}
          </span>
          <p style={{ margin: '4px 0', fontSize, color: textColor || defaultColor, fontWeight: 500 }}>
            {item.activity}
          </p>
        </div>
      ))}
    </div>
  );
};

// Callout Block
const CalloutBlockComponent: React.FC<{ block: CalloutBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { fontSize = 16, lineHeight = 22 } = settings;
  
  const getCalloutStyle = () => {
    switch (block.style) {
      case 'tip':
        return { backgroundColor: TEAL_BG, borderColor: TEAL_PRIMARY, iconColor: TEAL_PRIMARY, Icon: IoBulb };
      case 'warning':
        return { backgroundColor: AMBER_BG, borderColor: AMBER_WARNING, iconColor: AMBER_WARNING, Icon: IoWarning };
      case 'tavvy_note':
        return { backgroundColor: TEAL_BG, borderColor: TEAL_PRIMARY, iconColor: TEAL_PRIMARY, Icon: IoPaw };
      case 'info':
      default:
        return { backgroundColor: BLUE_BG, borderColor: BLUE_INFO, iconColor: BLUE_INFO, Icon: IoInformationCircle };
    }
  };

  const calloutStyle = getCalloutStyle();
  const textContent = block.text || (block as any).content || '';

  return (
    <div style={{
      backgroundColor: calloutStyle.backgroundColor,
      borderLeft: `4px solid ${calloutStyle.borderColor}`,
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <calloutStyle.Icon size={20} color={calloutStyle.iconColor} />
        {block.title && (
          <span style={{ marginLeft: 8, fontWeight: 600, color: calloutStyle.iconColor }}>
            {block.title}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: fontSize - 1, lineHeight: `${lineHeight}px`, color: '#374151' }}>
        {textContent}
      </p>
    </div>
  );
};

// Checklist Block
const ChecklistBlockComponent: React.FC<{ block: ChecklistBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, isDark } = settings;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const defaultColor = isDark ? '#D1D5DB' : '#374151';

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const normalizedItems = (block.items || []).map((item, index) => {
    if (typeof item === 'string') {
      return { id: `item-${index}`, text: item };
    }
    return {
      id: item.id || `item-${index}`,
      text: item.text || (item as any).content || String(item),
    };
  });

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      {block.title && (
        <h4 style={{ fontSize: 16, fontWeight: 600, color: textColor || (isDark ? '#F9FAFB' : '#111827'), marginBottom: 12 }}>
          {block.title}
        </h4>
      )}
      {normalizedItems.map((item) => {
        const isChecked = checkedItems.has(item.id);
        return (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: isChecked ? 'none' : '2px solid #D1D5DB',
              backgroundColor: isChecked ? TEAL_PRIMARY : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              transition: 'all 0.2s',
            }}>
              {isChecked && <IoCheckmark size={14} color="#fff" />}
            </div>
            <span style={{
              fontSize,
              color: textColor || defaultColor,
              textDecoration: isChecked ? 'line-through' : 'none',
              opacity: isChecked ? 0.6 : 1,
            }}>
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Quote Block
const QuoteBlockComponent: React.FC<{ block: QuoteBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26, isDark } = settings;
  const textContent = block.text || (block as any).content || '';
  const defaultColor = isDark ? '#D1D5DB' : '#374151';
  
  return (
    <div style={{
      borderLeft: `4px solid ${TEAL_PRIMARY}`,
      paddingLeft: 20,
      marginTop: 20,
      marginBottom: 20,
    }}>
      <IoChatboxEllipses size={24} color={TEAL_PRIMARY} style={{ marginBottom: 8 }} />
      <p style={{
        fontSize: fontSize + 1,
        lineHeight: `${lineHeight}px`,
        color: textColor || defaultColor,
        fontStyle: 'italic',
        margin: 0,
      }}>
        "{textContent}"
      </p>
      {block.author && (
        <p style={{ marginTop: 8, fontSize: 14, color: TEAL_PRIMARY, fontWeight: 500 }}>
          — {block.author}
        </p>
      )}
    </div>
  );
};

// Divider Block
const DividerBlockComponent: React.FC = () => {
  return <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '24px 0' }} />;
};

// ============================================================================
// MAIN RENDERER
// ============================================================================

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  isDark?: boolean;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ 
  blocks,
  textColor,
  fontSize,
  lineHeight,
  isDark = false,
}) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const readingSettings: ReadingSettings = {
    textColor,
    fontSize,
    lineHeight,
    isDark,
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const key = `block-${index}`;

    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent key={key} block={block as HeadingBlock} settings={readingSettings} />;
      case 'paragraph':
        return <ParagraphBlockComponent key={key} block={block as ParagraphBlock} settings={readingSettings} />;
      case 'image':
        return <ImageBlockComponent key={key} block={block as ImageBlock} settings={readingSettings} />;
      case 'bullet_list':
        return <BulletListBlockComponent key={key} block={block as BulletListBlock} settings={readingSettings} />;
      case 'numbered_list':
        return <NumberedListBlockComponent key={key} block={block as NumberedListBlock} settings={readingSettings} />;
      case 'place_card':
        return <PlaceCardBlockComponent key={key} block={block as PlaceCardBlock} />;
      case 'itinerary':
        return <ItineraryBlockComponent key={key} block={block as ItineraryBlock} settings={readingSettings} />;
      case 'itinerary_day':
        return <ItineraryDayBlockComponent key={key} block={block as ItineraryDayBlock} settings={readingSettings} />;
      case 'callout':
        return <CalloutBlockComponent key={key} block={block as CalloutBlock} settings={readingSettings} />;
      case 'checklist':
        return <ChecklistBlockComponent key={key} block={block as ChecklistBlock} settings={readingSettings} />;
      case 'quote':
        return <QuoteBlockComponent key={key} block={block as QuoteBlock} settings={readingSettings} />;
      case 'divider':
        return <DividerBlockComponent key={key} />;
      case 'list':
        const listBlock = block as any;
        if (listBlock.style === 'ordered') {
          return <NumberedListBlockComponent key={key} block={{ type: 'numbered_list', items: listBlock.items || [] } as NumberedListBlock} settings={readingSettings} />;
        }
        return <BulletListBlockComponent key={key} block={{ type: 'bullet_list', items: listBlock.items || [] } as BulletListBlock} settings={readingSettings} />;
      case 'tip_box':
        const tipBlock = block as any;
        return <CalloutBlockComponent key={key} block={{ type: 'callout', style: 'tip', title: tipBlock.title, text: tipBlock.content || tipBlock.text || '' } as CalloutBlock} settings={readingSettings} />;
      default:
        console.warn(`Unknown block type: ${block.type}`);
        return null;
    }
  };

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default ContentBlockRenderer;
