import { supabase } from './supabaseClient';

export type ContentKind = 'place_review' | 'story' | 'universe_review' | 'event_review' | 'civic_question' | 'cruise_visit' | 'place_photo' | 'ecard_endorsement' | 'ecard';
export type ContentReportReason = 'spam' | 'fake' | 'offensive' | 'harassment' | 'wrong_place' | 'conflict_of_interest' | 'sexual' | 'violent' | 'other';
export type BlockedAuthor = { id: string; displayName: string; createdAt: string };
type SafetyClient = { rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: any; error: any }> };
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const kinds: ContentKind[] = ['place_review','story','universe_review','event_review','civic_question','cruise_visit','place_photo','ecard_endorsement','ecard'];
const reasons: ContentReportReason[] = ['spam','fake','offensive','harassment','wrong_place','conflict_of_interest','sexual','violent','other'];
export const CONTENT_BLOCK_SCOPE = 'Blocked authors are hidden from your reviews, stories, photos, eCards and community comments. Place summaries still include all eligible public experiences.';
function target(kind: ContentKind, id: string) { if (!kinds.includes(kind) || !uuid(id)) throw new Error('This content could not be identified. Refresh and try again.'); }
function failure(error: any, action: 'report'|'block'|'unblock'|'list'): Error {
 const message = String(error?.message || '');
 if (message.includes('SAFETY_AUTH_REQUIRED')) return new Error('Sign in to manage content and blocked authors.');
 if (message.includes('SAFETY_SELF_BLOCK')) return new Error('You cannot block yourself.');
 if (message.includes('SAFETY_AUTHOR_UNAVAILABLE')) return new Error('This older content has no account to block. You can still report it.');
 if (message.includes('SAFETY_CONTENT_UNAVAILABLE')) return new Error('This content is no longer available.');
 return new Error(action==='report' ? 'Your report was not saved. Please try again or contact support@tavvy.com.' : action==='list' ? 'Blocked authors could not be loaded. Please try again.' : `The author could not be ${action==='block'?'blocked':'unblocked'}. Please try again.`);
}
export async function reportContent(kind: ContentKind, id: string, reason: ContentReportReason, client: SafetyClient = supabase): Promise<string> {
 target(kind,id); if (!reasons.includes(reason)) throw new Error('Choose a reason for this report.');
 const { data,error } = await client.rpc('report_content_v1',{ p_kind:kind,p_content_id:id,p_reason:reason });
 if (error) throw failure(error,'report');
 if (data?.submitted!==true || !uuid(data.reportId)) throw failure(null,'report');
 return data.reportId;
}
export async function blockContentAuthor(kind: ContentKind, id: string, client: SafetyClient = supabase): Promise<string> {
 target(kind,id); const {data,error}=await client.rpc('block_content_author_v1',{p_kind:kind,p_content_id:id});
 if(error)throw failure(error,'block');if(data?.blocked!==true||!uuid(data.blockId))throw failure(null,'block');return data.blockId;
}
export async function listBlockedAuthors(client: SafetyClient = supabase): Promise<BlockedAuthor[]> {
 const {data,error}=await client.rpc('get_my_content_blocks_v1');
 if(error||!Array.isArray(data)||data.some(row=>!uuid(row.id)||typeof row.displayName!=='string'||typeof row.createdAt!=='string'))throw failure(error,'list');
 return data;
}
export async function unblockAuthor(blockId:string,client:SafetyClient=supabase):Promise<void>{
 if(!uuid(blockId))throw failure(null,'unblock');const {data,error}=await client.rpc('unblock_content_author_v1',{p_block_id:blockId});if(error||data!==true)throw failure(error,'unblock');
}
/** Carry the viewer to our read-only API; never put an access token in a URL. */
export async function contentSafetyHeaders():Promise<Record<string,string>>{
 const {data:{session},error}=await supabase.auth.getSession();if(error)throw new Error('Your session could not be checked. Please sign in again.');
 return session?.access_token?{Authorization:`Bearer ${session.access_token}`} : {};
}
