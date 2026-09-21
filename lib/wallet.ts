// Account wallets use the server as source of truth. Legacy unscoped caches are
// deliberately never imported: their owner cannot be established safely.
export const GUEST_WALLET_KEY = '@tavvy_wallet_cards:guest:v2';
export interface WalletCard {
  id: string; slug: string; companyName: string; category: string;
  city: string; state: string; phone: string; email: string;
  gradientColors: [string, string]; profilePhoto?: string;
  verified: boolean; savedAt: string;
}
export function walletCard(row: any, savedAt = new Date().toISOString()): WalletCard {
  return { id: row.id, slug: row.slug || '', companyName: row.company_name || 'Pro card',
    category: row.category || '', city: row.city || '', state: row.state || '',
    phone: row.phone || '', email: row.email || '',
    gradientColors: [row.gradient_color_1 || '#8A05BE', row.gradient_color_2 || '#6366F1'],
    profilePhoto: row.profile_photo_url, verified: !!row.verified, savedAt };
}
export async function assertWalletAccount(client: any, userId: string | null) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if ((data.session?.user.id || null) !== userId) throw new Error('Account changed. Please retry.');
}
export async function readWallet(client: any, userId: string | null, storage?: any): Promise<WalletCard[]> {
  await assertWalletAccount(client, userId);
  if (!userId) {
    if (!storage) return [];
    const raw = await storage.getItem(GUEST_WALLET_KEY);
    const cards = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cards)) throw new Error('Unable to read this device wallet.');
    return cards.filter((c: any) => c && typeof c.id === 'string' && typeof c.companyName === 'string' && Array.isArray(c.gradientColors));
  }
  const { data, error } = await client.from('user_wallet').select('saved_at, pro_cards(id, slug, company_name, category, city, state, phone, email, gradient_color_1, gradient_color_2, profile_photo_url, verified)').eq('user_id', userId).order('saved_at', { ascending: false });
  if (error) throw error;
  return (data || []).filter((row: any) => row.pro_cards).map((row: any) => walletCard(Array.isArray(row.pro_cards) ? row.pro_cards[0] : row.pro_cards, row.saved_at));
}
export async function saveWalletCard(client: any, userId: string | null, card: WalletCard, storage?: any) {
  await assertWalletAccount(client, userId);
  if (!userId) {
    if (!storage) throw new Error('Sign in to save cards.');
    const cards = await readWallet(client, null, storage);
    await storage.setItem(GUEST_WALLET_KEY, JSON.stringify([card, ...cards.filter(c => c.id !== card.id)]));
    return;
  }
  const existing = await client.from('user_wallet').select('pro_card_id').eq('user_id', userId).eq('pro_card_id', card.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return;
  const { data, error } = await client.from('user_wallet').insert({ user_id: userId, pro_card_id: card.id }).select('pro_card_id');
  if (error) throw error;
  if (!data?.length) throw new Error('The card could not be saved. Please retry.');
}
export async function removeWalletCard(client: any, userId: string | null, cardId: string, storage?: any) {
  await assertWalletAccount(client, userId);
  if (!userId) {
    if (!storage) throw new Error('Sign in to manage cards.');
    const cards = await readWallet(client, null, storage);
    await storage.setItem(GUEST_WALLET_KEY, JSON.stringify(cards.filter(c => c.id !== cardId)));
    return;
  }
  const { data, error } = await client.from('user_wallet').delete().eq('user_id', userId).eq('pro_card_id', cardId).select('pro_card_id');
  if (error) throw error;
  if (!data?.length) throw new Error('The card was not removed. Refresh your wallet and retry.');
}
export function filterWallet(cards: WalletCard[], query: string) {
  const term = query.trim().toLowerCase();
  return cards.filter(c => [c.companyName, c.category, c.city, c.state].join(' ').toLowerCase().includes(term));
}
