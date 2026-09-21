// Source of truth: deployed pro_messages.match_id FK -> pro_request_matches.
// Never interpret conversations/pro_threads IDs as message match IDs.
import { supabase } from './supabaseClient';
export type Conversation = { id: string; pro_id: string; customer_id: string; status?: string; updated_at?: string; last_message?: string; project_request_id: string; customer_name?: string; provider_name?: string; project_description?: string };
export type Message = { id: string; conversation_id: string; sender_id: string; sender_type: string; content: string; created_at: string };
export const MESSAGE_TABLE = 'pro_messages';
export const MESSAGE_SCOPE_COLUMN = 'match_id';
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
async function readConversationPage(id: string | null, offset: number): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_my_pro_match_summaries_v1', { p_match_id: id, p_offset: offset, p_limit: 100 });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Conversations are unavailable. Please try again.');
  return data;
}
export async function listConversations(uid: string): Promise<Conversation[]> {
  const rows: any[] = [];
  for (let offset = 0; offset <= 10000; offset += 100) {
    const page = await readConversationPage(null, offset);
    rows.push(...page);
    if (page.length < 100) return rows.map(normalizeMatch).filter(c => c.pro_id === uid || c.customer_id === uid);
  }
  throw new Error('Too many conversations to load. Please contact support.');
}
export async function getConversation(id: string, uid: string): Promise<Conversation> {
  const rows = await readConversationPage(id, 0);
  if (rows.length !== 1) throw new Error('Conversation unavailable for this account.');
  const match = normalizeMatch(rows[0]);
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
