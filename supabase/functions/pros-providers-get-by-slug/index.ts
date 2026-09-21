import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {createProviderPublicHandler} from "../_shared/providerPublicHandler.ts";
serve(async(req)=>{const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!key)return new Response(JSON.stringify({error:'Profiles unavailable.'}),{status:503,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});const authorization=req.headers.get('Authorization');const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:authorization?{Authorization:authorization}:{}}});return createProviderPublicHandler('profile',client)(req);});
