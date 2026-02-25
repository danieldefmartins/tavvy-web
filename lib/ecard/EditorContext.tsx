/**
 * eCard Editor Context — wraps the editor reducer and provides
 * typed dispatch + state to all editor section components.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  EditorState,
  EditorAction,
  editorReducer,
  initialEditorState,
} from './editorReducer';
import { getCardById, getCardLinks, CardData, LinkItem } from '../ecard';
import { resolveTemplateId } from '../../config/eCardTemplates';

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  loadCard: (cardId: string) => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const loadCard = useCallback(async (cardId: string) => {
    try {
      const [card, links] = await Promise.all([
        getCardById(cardId),
        getCardLinks(cardId),
      ]);

      if (!card) {
        dispatch({ type: 'SET_LOAD_ERROR', error: 'Card not found' });
        return;
      }

      // Normalize featured_socials: handle both flat strings and objects
      const rawSocials = card.featured_socials || [];
      const normalizedSocials = rawSocials.map((item: any) => {
        if (typeof item === 'string') return { platform: item, url: '' };
        return item;
      });

      // Resolve template ID (handles migration from old template IDs)
      const resolvedTemplate = resolveTemplateId(card.template_id || card.theme || 'classic');

      const normalizedCard: CardData = {
        ...card,
        featured_socials: normalizedSocials,
        template_id: resolvedTemplate,
      };

      const normalizedLinks: LinkItem[] = links.map(l => ({
        id: l.id,
        card_id: l.card_id,
        platform: l.icon || l.platform || 'other',
        title: l.title,
        url: l.url,
        value: l.url,
        icon: l.icon,
        sort_order: l.sort_order,
        is_active: l.is_active,
        clicks: l.clicks,
      }));

      dispatch({ type: 'LOAD_CARD', card: normalizedCard, links: normalizedLinks });
    } catch (err) {
      console.error('[EditorContext] Failed to load card:', err);
      dispatch({ type: 'SET_LOAD_ERROR', error: 'Failed to load card' });
    }
  }, []);

  return (
    <EditorContext.Provider value={{ state, dispatch, loadCard }}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook to access the editor context. Must be used within an EditorProvider.
 */
export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
}
