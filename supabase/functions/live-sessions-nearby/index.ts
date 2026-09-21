import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {onTheGoReader,onTheGoError,OnTheGoHttpError} from '../_shared/onthego-http.ts';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json','Cache-Control':'private,no-store'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(!['GET','POST'].includes(req.method))return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
 try{
  const client=await onTheGoReader(req);const q=new URL(req.url).searchParams;
  const params=req.method==='GET'?{lat:q.has('lat')?Number(q.get('lat')):NaN,lng:q.has('lng')?Number(q.get('lng')):NaN,radius_meters:q.has('radius_meters')?Number(q.get('radius_meters')):10000,limit:q.has('limit')?Number(q.get('limit')):50,category:q.get('category')||undefined}:await req.json();
  const {lat,lng,radius_meters=10000,limit=50,category}=params;
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!Number.isFinite(radius_meters)||radius_meters<=0||radius_meters>500000||!Number.isInteger(limit)||limit<1||limit>200||category!==undefined&&(typeof category!=='string'||category.length>200))throw new OnTheGoHttpError('Invalid location, radius or result limit');
  const found:any[]=[];let offset=0;const now=new Date().toISOString();
  // Parameterized reads obey confirmation/account RLS; no generic SQL executor.
  for(;;){
   const {data,error}=await client.from('live_sessions').select('id,place_id,tavvy_place_id,session_lat,session_lng,location_label,session_address,today_note,started_at,scheduled_end_at,places(name,tavvy_category,tavvy_subcategory,cover_image_url,phone,place_type),tavvy_places(name,tavvy_category,tavvy_subcategory,cover_image_url,phone,place_type)').eq('status','active').gt('scheduled_end_at',now).order('id').range(offset,offset+499);
   if(error)throw new Error('Sessions unavailable');
   for(const s of data||[]){
    const place:any=s.tavvy_place_id?s.tavvy_places:s.places;if(!place||place.place_type!=='on_the_go'||category&&place.tavvy_category!==category)continue;
    const a=Math.sin((s.session_lat-lat)*Math.PI/360)**2+Math.cos(lat*Math.PI/180)*Math.cos(s.session_lat*Math.PI/180)*Math.sin((s.session_lng-lng)*Math.PI/360)**2;
    const distance_meters=2*6371000*Math.asin(Math.sqrt(Math.min(1,Math.max(0,a))));if(distance_meters>radius_meters)continue;
    found.push({session_id:s.id,place_id:s.place_id,tavvy_place_id:s.tavvy_place_id,session_lat:s.session_lat,session_lng:s.session_lng,session_address:s.session_address,location_label:s.location_label,today_note:s.today_note,started_at:s.started_at,scheduled_end_at:s.scheduled_end_at,place_name:place.name,tavvy_category:place.tavvy_category,tavvy_subcategory:place.tavvy_subcategory,cover_image_url:place.cover_image_url,phone:place.phone,distance_meters});
   }
   if((data?.length||0)<500)break;offset+=500;if(offset>=10000)throw new OnTheGoHttpError('Too many sessions for this search. Try a smaller area.',503);
  }
  found.sort((a,b)=>a.distance_meters-b.distance_meters||a.session_id.localeCompare(b.session_id));const sessions=found.slice(0,limit);
  return new Response(JSON.stringify({success:true,count:sessions.length,sessions}),{headers});
 }catch(error){return new Response(JSON.stringify({error:error instanceof OnTheGoHttpError?error.message:'Live sessions could not be loaded.'}),{status:onTheGoError(error),headers});}
});
