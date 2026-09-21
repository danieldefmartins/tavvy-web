/** Restaurant menu presentation is independent of whether its photo gallery is enabled. */
export type MenuStyle = 'elegant_ivory' | 'clean_white' | 'visual';
export const MENU_STYLES: { value: MenuStyle; label: string; description: string }[] = [
  { value: 'elegant_ivory', label: 'Elegant Ivory', description: 'Warm ivory, serif type and a text-only menu.' },
  { value: 'clean_white', label: 'Clean White', description: 'White, simple type and a text-only menu.' },
  { value: 'visual', label: 'Visual', description: 'A photo-led menu with dish and cover images.' },
];
export function menuAppearance(menu?: { style?: string | null; photo_gallery_enabled?: boolean | null } | null) {
  const style: MenuStyle = menu?.style === 'elegant_ivory' || menu?.style === 'clean_white' ? menu.style : 'visual';
  return { style, inlinePhotos: style === 'visual', galleryEnabled: menu?.photo_gallery_enabled !== false,
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
