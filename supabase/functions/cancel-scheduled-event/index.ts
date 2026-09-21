import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {onTheGoActor,onTheGoError,OnTheGoHttpError} from '../_shared/onthego-http.ts';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'private,no-store'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
 try{
  const {client,user}=await onTheGoActor(req);
  const body=await req.json().catch(()=>{throw new OnTheGoHttpError('Invalid cancel request');});
  if(!body||typeof body.event_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.event_id))throw new OnTheGoHttpError('Choose a valid scheduled stop');
  const {data:event,error:readError}=await client.from('scheduled_events').select('id,tavvy_place_id,created_by,status,tavvy_places!inner(id,created_by,place_type,is_deleted)').eq('id',body.event_id).maybeSingle();
  if(readError)throw new OnTheGoHttpError('The scheduled stop could not be checked.',503);
  if(!event)throw new OnTheGoHttpError('Scheduled stop not found.',404);
  const parent:any=event.tavvy_places;
  if(event.created_by!==user.id||parent?.created_by!==user.id||parent.place_type!=='on_the_go'||parent.is_deleted)throw new OnTheGoHttpError('You cannot cancel this scheduled stop.',403);
  if(!['scheduled','cancelled'].includes(event.status))throw new OnTheGoHttpError('This stop has already finished.',409);
  if(event.status==='scheduled'){
   // User JWT plus restrictive owner/active-account RLS is rechecked at mutation time.
   const {data:changed,error}=await client.from('scheduled_events').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',event.id).eq('tavvy_place_id',event.tavvy_place_id).eq('created_by',user.id).eq('status','scheduled').select('id,status').maybeSingle();
   if(error)throw new OnTheGoHttpError('The stop could not be cancelled. Refresh before retrying.',503);
   if(!changed||changed.status!=='cancelled')throw new OnTheGoHttpError('The stop changed. Refresh its status before retrying.',409);
  }
  // Advisory summaries are separate from the confirmed cancellation. Failure cannot falsely undo or acknowledge it.
  let summaryUpdated=false;
  try{
   const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!key)throw Error('Summary configuration unavailable');
   const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data:next,error}=await admin.from('scheduled_events').select('scheduled_start').eq('tavvy_place_id',event.tavvy_place_id).eq('status','scheduled').gt('scheduled_end',new Date().toISOString()).order('scheduled_start').limit(1);
   if(error||!Array.isArray(next))throw Error('Summary unavailable');
   const {data:updated,error:updateError}=await admin.from('tavvy_places').update({has_upcoming_events:next.length>0,next_event_at:next[0]?.scheduled_start||null}).eq('id',event.tavvy_place_id).eq('created_by',user.id).select('id').maybeSingle();
   summaryUpdated=!updateError&&updated?.id===event.tavvy_place_id;
  }catch{/* The published schedule row remains cancelled; return an explicit advisory warning. */}
  return new Response(JSON.stringify({success:true,message:'Scheduled stop cancelled.',event_id:event.id,summary_updated:summaryUpdated,...(!summaryUpdated?{warning:'The stop is cancelled. Some summary information could not be refreshed.'}:{})}),{headers});
 }catch(error){return new Response(JSON.stringify({error:error instanceof OnTheGoHttpError?error.message:'The stop could not be cancelled. Refresh before retrying.'}),{status:onTheGoError(error),headers});}
});
