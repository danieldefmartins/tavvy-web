// Source of truth: deployed pro_messages.match_id FK -> pro_request_matches.
// Never interpret conversations/pro_threads IDs as message match IDs.
import { supabase } from './supabaseClient';
export type Conversation = { id: string; pro_id: string; customer_id: string; status?: string; updated_at?: string; last_message?: string; project_request_id: string; customer_name?: string; provider_name?: string; project_description?: string };
export type Message = { id: string; conversation_id: string; sender_id: string; sender_type: string; content: string; created_at: string };
export const MESSAGE_TABLE = 'pro_messages';
export const MESSAGE_SCOPE_COLUMN = 'match_id';
const matchSelect = 'id,request_id,pro_id,pro_status,updated_at,project:project_requests!pro_request_matches_request_id_fkey(user_id,customer_name,description),provider:pro_providers!pro_request_matches_pro_id_fkey(user_id,business_name)';
export function participantRole(c: Conversation, uid: string): 'pro' | 'customer' {
  if (c.pro_id === uid) return 'pro';
  if (c.customer_id === uid) return 'customer';
  throw new Error('Conversation unavailable for this account.');
}
export function mergeMessages(a: Message[], b: Message[]) {
  return Array.from(new Map([...a, ...b].map(m => [m.id, m])).values()).sort((x, y) => x.created_at.localeCompare(y.created_at) || x.id.localeCompare(y.id));
}
function normalizeMatch(row: any): Conversation {
  const project = Array.isArray(row.project) ? row.project[0] : row.project;
  const provider = Array.isArray(row.provider) ? row.provider[0] : row.provider;
  return { id: row.id, pro_id: provider?.user_id, customer_id: project?.user_id, project_request_id: row.request_id, updated_at: row.updated_at, status: row.pro_status, customer_name: project?.customer_name, project_description: project?.description, provider_name: provider?.business_name };
}
function normalizeMessage(row: any): Message {
  return { id: row.id, conversation_id: row.match_id, sender_id: row.sender_id, sender_type: row.sender_type, content: row.content, created_at: row.created_at || '' };
}
export async function listConversations(uid: string): Promise<Conversation[]> {
  const [providers, requests] = await Promise.all([
    supabase.from('pro_providers').select('id').eq('user_id', uid),
    supabase.from('project_requests').select('id').eq('user_id', uid)
  ]);
  if (providers.error) throw providers.error;
  if (requests.error) throw requests.error;
  const filters: string[] = [];
  if (providers.data?.length) filters.push(`pro_id.in.(${providers.data.map(p => p.id).join(',')})`);
  if (requests.data?.length) filters.push(`request_id.in.(${requests.data.map(p => p.id).join(',')})`);
  if (!filters.length) return [];
  const { data, error } = await supabase.from('pro_request_matches').select(matchSelect).or(filters.join(',')).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeMatch).filter(c => c.pro_id === uid || c.customer_id === uid);
}
export async function getConversation(id: string, uid: string): Promise<Conversation> {
  const { data, error } = await supabase.from('pro_request_matches').select(matchSelect).eq('id', id).single();
  if (error) throw error;
  const match = normalizeMatch(data);
  const role = participantRole(match, uid);
  const { data: serverRole, error: roleError } = await supabase.rpc('tavvy_chat_role', { match_uuid: id });
  if (roleError) throw roleError;
  if (serverRole !== role) throw new Error('Conversation unavailable for this account.');
  return match;
}
export async function loadMessages(id: string, uid: string): Promise<Message[]> {
  await getConversation(id, uid);
  const { data, error } = await supabase.from(MESSAGE_TABLE).select('id,match_id,sender_id,sender_type,content,created_at').eq(MESSAGE_SCOPE_COLUMN, id).order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeMessage);
}
export async function insertMessage(id: string, uid: string, content: string): Promise<Message> {
  const text = content.trim();
  if (!text || text.length > 5000) throw new Error('Enter a message of 1–5,000 characters.');
  const c = await getConversation(id, uid);
  const { data: canSend, error: blockError } = await supabase.rpc('tavvy_chat_can_send', { match_uuid: id });
  if (blockError) throw blockError;
  if (!canSend) throw new Error('Messaging is blocked or an active professional subscription is required.');
  const { data, error } = await supabase.from(MESSAGE_TABLE).insert({ match_id: id, sender_id: uid, sender_type: participantRole(c, uid), message_type: 'text', content: text }).select().single();
  if (error) throw error;
  return normalizeMessage(data);
}

export async function blockConversation(id: string, uid: string): Promise<void> {
  const c = await getConversation(id, uid);
  const otherId = participantRole(c, uid) === 'pro' ? c.customer_id : c.pro_id;
  if (!otherId || otherId === uid) throw new Error('Cannot block this conversation.');
  // conversation_id references a DIFFERENT legacy table; do not populate it with a match ID.
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: uid, blocked_id: otherId });
  if (error && error.code !== '23505') throw error;
}
