/**
 * Restaurant menu presentation. The owner's design (menu editor → Menu design) also decides which
 * view opens first when a guest taps Menu: the text designs open the list, Visual (the default when
 * nothing is chosen) opens the full-screen photo menu. A small icon switches between the two.
 * The photo gallery can be turned off independently, which forces the list.
 */
export type MenuStyle = 'elegant_ivory' | 'clean_white' | 'visual';
export type MenuEntryView = 'list' | 'photos';
export const MENU_STYLES: { value: MenuStyle; label: string; description: string }[] = [
  { value: 'elegant_ivory', label: 'Elegant Ivory', description: 'Warm ivory and serif type. Opens as a text menu.' },
  { value: 'clean_white', label: 'Clean White', description: 'White and simple type. Opens as a text menu.' },
  { value: 'visual', label: 'Visual', description: 'Opens as the full-screen photo menu, with dish and cover images.' },
];
export function menuAppearance(menu?: { style?: string | null; photo_gallery_enabled?: boolean | null } | null) {
  const style: MenuStyle = menu?.style === 'elegant_ivory' || menu?.style === 'clean_white' ? menu.style : 'visual';
  const galleryEnabled = menu?.photo_gallery_enabled !== false;
  const entryView: MenuEntryView = style === 'visual' && galleryEnabled ? 'photos' : 'list';
  return { style, inlinePhotos: style === 'visual', galleryEnabled, entryView,
    serif: style === 'elegant_ivory', background: style === 'elegant_ivory' ? '#F7F3EA' : '#FFFFFF',
    text: '#28251F', secondary: '#635D53', border: '#DED7CA' };
}
export const DEMO_APPEARANCE_KEY = 'tavvy:restaurant-demo:appearance:v1';
export function readDemoMenuAppearance() {
  try { const value = JSON.parse(localStorage.getItem(DEMO_APPEARANCE_KEY) || '{}');
    const appearance = menuAppearance(value);
    return { style: appearance.style, photo_gallery_enabled: appearance.galleryEnabled };
  } catch { return { style: 'visual' as MenuStyle, photo_gallery_enabled: true }; }
}
