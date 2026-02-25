/**
 * eCard Editor Reducer — centralized state management for the card editor.
 * Replaces 30+ individual useState declarations with a single typed reducer.
 */

import { CardData, LinkItem, FeaturedSocial } from '../ecard';

export interface EditorState {
  card: Partial<CardData>;
  links: LinkItem[];
  pendingUploads: Record<string, File>; // keyed by field name: 'profile_photo', 'banner_image', 'logo', 'gallery_0', etc.
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  loadError: string | null;
}

export type EditorAction =
  | { type: 'LOAD_CARD'; card: CardData; links: LinkItem[] }
  | { type: 'SET_FIELD'; field: keyof CardData; value: any }
  | { type: 'SET_FIELDS'; fields: Partial<CardData> }
  | { type: 'SET_LINKS'; links: LinkItem[] }
  | { type: 'ADD_LINK'; link: LinkItem }
  | { type: 'UPDATE_LINK'; id: string; updates: Partial<LinkItem> }
  | { type: 'REMOVE_LINK'; id: string }
  | { type: 'REORDER_LINKS'; fromIndex: number; toIndex: number }
  | { type: 'SET_TEMPLATE'; templateId: string; colorSchemeId?: string }
  | { type: 'ADD_GALLERY_IMAGE'; image: { id: string; url: string; file?: File } }
  | { type: 'REMOVE_GALLERY_IMAGE'; id: string }
  | { type: 'REORDER_GALLERY'; fromIndex: number; toIndex: number }
  | { type: 'ADD_VIDEO'; video: { type: string; url: string } }
  | { type: 'REMOVE_VIDEO'; index: number }
  | { type: 'ADD_FEATURED_SOCIAL'; social: FeaturedSocial }
  | { type: 'UPDATE_FEATURED_SOCIAL'; platform: string; url: string }
  | { type: 'REMOVE_FEATURED_SOCIAL'; platform: string }
  | { type: 'SET_PENDING_UPLOAD'; key: string; file: File }
  | { type: 'CLEAR_PENDING_UPLOAD'; key: string }
  | { type: 'CLEAR_ALL_PENDING_UPLOADS' }
  | { type: 'MARK_SAVING' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_SAVE_ERROR' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_LOAD_ERROR'; error: string }
  | { type: 'RESET_CARD' };

export const initialEditorState: EditorState = {
  card: {},
  links: [],
  pendingUploads: {},
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  loadError: null,
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_CARD':
      return {
        ...state,
        card: { ...action.card },
        links: action.links,
        isDirty: false,
        isSaving: false,
        loadError: null,
        pendingUploads: {},
      };

    case 'SET_FIELD':
      return {
        ...state,
        card: { ...state.card, [action.field]: action.value },
        isDirty: true,
      };

    case 'SET_FIELDS':
      return {
        ...state,
        card: { ...state.card, ...action.fields },
        isDirty: true,
      };

    case 'SET_LINKS':
      return { ...state, links: action.links, isDirty: true };

    case 'ADD_LINK':
      return { ...state, links: [...state.links, action.link], isDirty: true };

    case 'UPDATE_LINK':
      return {
        ...state,
        links: state.links.map(l => l.id === action.id ? { ...l, ...action.updates } : l),
        isDirty: true,
      };

    case 'REMOVE_LINK':
      return {
        ...state,
        links: state.links.filter(l => l.id !== action.id),
        isDirty: true,
      };

    case 'REORDER_LINKS': {
      const newLinks = [...state.links];
      const [moved] = newLinks.splice(action.fromIndex, 1);
      newLinks.splice(action.toIndex, 0, moved);
      return { ...state, links: newLinks, isDirty: true };
    }

    case 'SET_TEMPLATE':
      return {
        ...state,
        card: {
          ...state.card,
          template_id: action.templateId,
          ...(action.colorSchemeId ? { color_scheme_id: action.colorSchemeId } : {}),
        },
        isDirty: true,
      };

    case 'ADD_GALLERY_IMAGE': {
      const gallery = [...(state.card.gallery_images || []), { id: action.image.id, url: action.image.url }];
      const uploads = action.image.file
        ? { ...state.pendingUploads, [`gallery_${action.image.id}`]: action.image.file }
        : state.pendingUploads;
      return {
        ...state,
        card: { ...state.card, gallery_images: gallery },
        pendingUploads: uploads,
        isDirty: true,
      };
    }

    case 'REMOVE_GALLERY_IMAGE': {
      const newUploads = { ...state.pendingUploads };
      delete newUploads[`gallery_${action.id}`];
      return {
        ...state,
        card: {
          ...state.card,
          gallery_images: (state.card.gallery_images || []).filter(g => g.id !== action.id),
        },
        pendingUploads: newUploads,
        isDirty: true,
      };
    }

    case 'REORDER_GALLERY': {
      const newGallery = [...(state.card.gallery_images || [])];
      const [movedImg] = newGallery.splice(action.fromIndex, 1);
      newGallery.splice(action.toIndex, 0, movedImg);
      return { ...state, card: { ...state.card, gallery_images: newGallery }, isDirty: true };
    }

    case 'ADD_VIDEO':
      return {
        ...state,
        card: { ...state.card, videos: [...(state.card.videos || []), action.video] },
        isDirty: true,
      };

    case 'REMOVE_VIDEO': {
      const newVideos = [...(state.card.videos || [])];
      newVideos.splice(action.index, 1);
      return { ...state, card: { ...state.card, videos: newVideos }, isDirty: true };
    }

    case 'ADD_FEATURED_SOCIAL': {
      const existing = state.card.featured_socials || [];
      if (existing.length >= 4) return state;
      if (existing.some(s => s.platform === action.social.platform)) return state;
      return {
        ...state,
        card: { ...state.card, featured_socials: [...existing, action.social] },
        isDirty: true,
      };
    }

    case 'UPDATE_FEATURED_SOCIAL':
      return {
        ...state,
        card: {
          ...state.card,
          featured_socials: (state.card.featured_socials || []).map(s =>
            s.platform === action.platform ? { ...s, url: action.url } : s
          ),
        },
        isDirty: true,
      };

    case 'REMOVE_FEATURED_SOCIAL':
      return {
        ...state,
        card: {
          ...state.card,
          featured_socials: (state.card.featured_socials || []).filter(s => s.platform !== action.platform),
        },
        isDirty: true,
      };

    case 'SET_PENDING_UPLOAD':
      return {
        ...state,
        pendingUploads: { ...state.pendingUploads, [action.key]: action.file },
        isDirty: true,
      };

    case 'CLEAR_PENDING_UPLOAD': {
      const u = { ...state.pendingUploads };
      delete u[action.key];
      return { ...state, pendingUploads: u };
    }

    case 'CLEAR_ALL_PENDING_UPLOADS':
      return { ...state, pendingUploads: {} };

    case 'MARK_SAVING':
      return { ...state, isSaving: true };

    case 'MARK_SAVED':
      return { ...state, isSaving: false, isDirty: false, lastSaved: new Date() };

    case 'MARK_SAVE_ERROR':
      return { ...state, isSaving: false };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    case 'SET_LOAD_ERROR':
      return { ...state, loadError: action.error };

    case 'RESET_CARD':
      return {
        ...state,
        card: {
          ...state.card,
          full_name: '',
          title: '',
          bio: '',
          email: '',
          phone: '',
          website: '',
          website_label: '',
          city: '',
          address_1: '',
          address_2: '',
          zip_code: '',
          profile_photo_url: undefined,
          profile_photo_size: 'medium',
          banner_image_url: undefined,
          company_logo_url: undefined,
          gallery_images: [],
          videos: [],
          featured_socials: [],
          show_contact_info: true,
          show_social_icons: true,
        },
        links: [],
        pendingUploads: {},
        isDirty: true,
      };

    default:
      return state;
  }
}
