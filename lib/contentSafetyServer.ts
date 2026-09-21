import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest } from 'next';
/** Isolated per-request identity; never mutate a shared anonymous Supabase client. */
export async function contentViewer(req: Pick<NextApiRequest,'headers'>) {
 const authorization=req.headers.authorization;
 const validHeader=typeof authorization==='string'&&/^Bearer \S+$/.test(authorization);
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'',process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'',{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{headers:validHeader?{Authorization:authorization}:{}},
 });
 if(authorization&&!validHeader)return{client,error:true};
 if(validHeader){try{const {data,error}=await client.auth.getUser();if(error||!data.user)return{client,error:true};}catch{return{client,error:true};}}
 return{client,error:false};
}
