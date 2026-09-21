/** Complete snapshot reads and atomic writes; no subscription-based link count. */
export const ECARD_LINK_PAYLOAD_BYTES = 1024 * 1024;
export const ECARD_LINK_RESOURCE_ERROR = 'This link update is too large to save at once. Shorten long link text or addresses and retry. Your saved links are unchanged.';
type Client = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data?: any; error?: { message?: string } | null }> };
export function ecardLinkPayload(links: readonly any[]) {
 return links.map((link, index) => ({ id: link.id, platform: link.platform || link.icon || 'other', title: link.title ?? '', url: link.url ?? link.value ?? '', value: link.value ?? link.url ?? '', icon: link.icon || link.platform || 'other', sort_order: index, is_active: link.is_active === undefined ? true : link.is_active === true }));
}
function utf8Length(value: string): number { let length=0; for (const c of value) { const n=c.codePointAt(0)!;length+=n<=0x7f?1:n<=0x7ff?2:n<=0xffff?3:4; } return length; }
export function assertECardLinkPayload(payload: unknown) {
 if (!Array.isArray(payload)) throw new Error('Links must be an array.');
 if (utf8Length(JSON.stringify(payload)) > ECARD_LINK_PAYLOAD_BYTES) throw new Error(ECARD_LINK_RESOURCE_ERROR);
}
export async function readECardLinks(client: Client, cardId: string, includeInactive = false): Promise<any[]> {
 const { data, error } = await client.rpc('get_ecard_links_v1', { p_card_id: cardId, p_include_inactive: includeInactive });
 if (error || !Array.isArray(data)) throw new Error('Your links could not be loaded. Retry before editing this card.');
 return data;
}
export async function replaceECardLinks(client: Client, cardId: string, links: readonly any[]): Promise<void> {
 const payload = ecardLinkPayload(links); assertECardLinkPayload(payload);
 const { error } = await client.rpc('replace_ecard_links', { p_card_id: cardId, p_links: payload });
 if (error) throw new Error(error.message || 'Links could not be saved. Your saved links are unchanged.');
}
