import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {onTheGoActor,onTheGoError,OnTheGoHttpError} from '../_shared/onthego-http.ts';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'GET,OPTIONS','Content-Type':'application/json','Cache-Control':'private,no-store'};
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='GET')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
 try{
  const {client,user}=await onTheGoActor(req);const q=new URL(req.url).searchParams,placeId=q.get('tavvy_place_id');
  const integer=(key:string,fallback:number,max:number)=>{const raw=q.get(key);const n=raw===null?fallback:/^\d+$/.test(raw)?Number(raw):NaN;if(!Number.isInteger(n)||n<0||n>max)throw new OnTheGoHttpError('Invalid schedule page');return n;};
  const offset=integer('offset',0,10000),historyOffset=integer('history_offset',0,10000),limit=integer('limit',20,100),includeHistory=q.get('include_history')==='true';
  if(!limit||placeId!==null&&!uuid(placeId)||q.has('include_history')&&!['true','false'].includes(q.get('include_history')!))throw new OnTheGoHttpError('Invalid business or schedule filter');
  let own=client.from('tavvy_places').select('id,name,tavvy_category,cover_image_url').eq('created_by',user.id).eq('place_type','on_the_go').eq('is_deleted',false).order('id').limit(201);
  if(placeId)own=own.eq('id',placeId);
  const {data:places,error:placeError}=await own;if(placeError||!Array.isArray(places))throw new OnTheGoHttpError('Your businesses could not be loaded.',503);
  if(placeId&&!places.some(p=>p.id===placeId))throw new OnTheGoHttpError('You cannot manage this business.',403);
  if(places.length>200)throw new OnTheGoHttpError('Choose one business to view its schedule.',400);
  const ids=places.map(p=>p.id),now=new Date().toISOString();
  const read=async(history:boolean)=>{
   if(!ids.length)return {rows:[],hasMore:false};
   // Independently constrain the joined parent author, even after requested-ID membership validation.
   let query=client.from('scheduled_events').select('id,tavvy_place_id,event_title,event_description,location_name,location_address,latitude,longitude,scheduled_start,scheduled_end,is_recurring,recurrence_rule,status,tavvy_places!inner(id,name,tavvy_category)')
    .in('tavvy_place_id',ids).eq('tavvy_places.created_by',user.id).eq('tavvy_places.place_type','on_the_go').eq('tavvy_places.is_deleted',false);
   query=history?query.or(`status.eq.completed,status.eq.cancelled,scheduled_end.lte.${now}`):query.eq('status','scheduled').gt('scheduled_end',now);
   const page=history?historyOffset:offset;const {data,error}=await query.order('scheduled_start',{ascending:!history}).order('id',{ascending:!history}).range(page,page+limit);
   if(error||!Array.isArray(data))throw new OnTheGoHttpError('Your schedule could not be loaded. Please retry.',503);
   return{rows:data.slice(0,limit),hasMore:data.length>limit};
  };
  const upcoming=await read(false),past=includeHistory?await read(true):{rows:[],hasMore:false};
  const format=(rows:any[])=>rows.map(event=>({...event,place_name:event.tavvy_places?.name,formatted_date:new Date(event.scheduled_start).toLocaleDateString('en-US',{timeZone:'UTC'}),formatted_time:new Date(event.scheduled_start).toLocaleTimeString('en-US',{timeZone:'UTC',hour:'numeric',minute:'2-digit'})+' – '+new Date(event.scheduled_end).toLocaleTimeString('en-US',{timeZone:'UTC',hour:'numeric',minute:'2-digit'})+' UTC'}));
  return new Response(JSON.stringify({success:true,has_on_the_go_places:places.length>0,places,upcoming_count:upcoming.rows.length,upcoming_events:format(upcoming.rows),past_events:format(past.rows),has_more:upcoming.hasMore,next_offset:upcoming.hasMore?offset+limit:null,history_has_more:past.hasMore,history_next_offset:past.hasMore?historyOffset+limit:null}),{headers});
 }catch(error){return new Response(JSON.stringify({error:error instanceof OnTheGoHttpError?error.message:'Your schedule could not be loaded.'}),{status:onTheGoError(error),headers});}
});
