/**
 * useEditorField — convenience hook that binds a single CardData field
 * to the editor context. Returns [value, setter] like useState.
 *
 * Usage:
 *   const [fullName, setFullName] = useEditorField('full_name');
 */

import { useCallback } from 'react';
import { useEditor } from './EditorContext';
import { CardData } from '../ecard';

export function useEditorField<K extends keyof CardData>(
  field: K
): [CardData[K] | undefined, (value: CardData[K]) => void] {
  const { state, dispatch } = useEditor();

  const value = state.card[field] as CardData[K] | undefined;

  const setValue = useCallback(
    (newValue: CardData[K]) => {
      dispatch({ type: 'SET_FIELD', field, value: newValue });
    },
    [dispatch, field]
  );

  return [value, setValue];
}
