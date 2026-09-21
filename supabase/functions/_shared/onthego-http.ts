import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
export class OnTheGoHttpError extends Error {constructor(message:string,public status=400){super(message)}}
/** Public reads never bypass RLS. Optional valid identity applies personal content blocks. */
export async function onTheGoReader(req:Request){
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key)throw new OnTheGoHttpError('Service unavailable',503);
 const supplied=req.headers.get('Authorization');
 const authorization=supplied===`Bearer ${key}`?null:supplied;
 if(authorization&&!/^Bearer \S+$/.test(authorization))throw new OnTheGoHttpError('Sign in again',401);
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:authorization?{Authorization:authorization}:{}}});
 if(authorization){const {data,error}=await client.auth.getUser();if(error||!data.user)throw new OnTheGoHttpError('Sign in again',401);}
 return client;
}
export async function onTheGoActor(req:Request){
 if(!req.headers.get('Authorization'))throw new OnTheGoHttpError('Sign in required',401);
 const client=await onTheGoReader(req);const {data,error}=await client.rpc('onthego_actor_active');
 if(error||typeof data!=='string')throw new OnTheGoHttpError('Sign in with an active account',403);
 return{client,user:{id:data}};
}
export function onTheGoError(error:unknown){return error instanceof OnTheGoHttpError?error.status:500;}
