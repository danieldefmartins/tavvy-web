/** Preserve an existing form's integrations and fields when its visibility changes. */
export function readFormBlock(value: unknown): Record<string, any> | null {
  if (typeof value === 'string') { try { return readFormBlock(JSON.parse(value)); } catch { return null; } }
  if (value === true) return { formType: 'native', title: 'Contact me', buttonText: 'Send message' };
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : null;
}
export function visibleFormBlock(value: unknown): Record<string, any> | null {
  const form = readFormBlock(value);
  return form?.enabled === false ? null : form;
}
export function setFormBlockEnabled(value: unknown, enabled: boolean): Record<string, any> {
  return { ...(readFormBlock(value) || { formType: 'native', title: 'Contact me', buttonText: 'Send message' }), enabled };
}
