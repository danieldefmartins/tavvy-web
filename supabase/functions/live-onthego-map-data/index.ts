import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {onTheGoReader,onTheGoError,OnTheGoHttpError} from "../_shared/onthego-http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "private, no-store",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MapDataRequest {
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  category?: string;
  center_lat?: number;
  center_lng?: number;
  radius_meters?: number;
  include_scheduled?: boolean; // Include offline places with scheduled events
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if(!["GET","POST"].includes(req.method))return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:corsHeaders});

  try {
    const supabase = await onTheGoReader(req);

    const params = await readParams(req);
    const now = new Date().toISOString();
    const placeFields = 'id,canonical_place_id,name,tavvy_category,tavvy_subcategory,cover_image_url,phone,place_type,service_area,has_upcoming_events,next_event_at';
    const sessions = await readAll(() => {
      let query = supabase.from('live_sessions').select(`id,tavvy_place_id,session_lat,session_lng,location_label,session_address,today_note,started_at,scheduled_end_at,tavvy_places!inner(${placeFields})`)
        .eq('status','active').eq('address_confirmed',true).gt('scheduled_end_at',now)
        .eq('tavvy_places.place_type','on_the_go').eq('tavvy_places.is_deleted',false);
      if(params.category)query=query.eq('tavvy_places.tavvy_category',params.category);
      return restrictLocation(query,'session_lat','session_lng',params);
    });
    const filteredSessions = sessions.filter(s => inScope(s.session_lat,s.session_lng,params));
    const livePlaceIds = new Set(filteredSessions.map(s => s.tavvy_place_id));
    let offlinePlacesWithSchedule:any[]=[];
    if(params.include_scheduled){
      // The scheduled row is authoritative; no stale business-summary flag or one-query-per-business dependency.
      const events = await readAll(() => {
        let query = supabase.from('scheduled_events').select(`id,tavvy_place_id,location_name,location_address,latitude,longitude,scheduled_start,scheduled_end,tavvy_places!inner(${placeFields})`)
          .eq('status','scheduled').gt('scheduled_end',now)
          .eq('tavvy_places.place_type','on_the_go').eq('tavvy_places.is_deleted',false);
        if(params.category)query=query.eq('tavvy_places.tavvy_category',params.category);
        return restrictLocation(query,'latitude','longitude',params);
      });
      const nextByBusiness = new Map<string,any>();
      for(const event of events){
        if(!inScope(event.latitude,event.longitude,params)||livePlaceIds.has(event.tavvy_place_id))continue;
        const current=nextByBusiness.get(event.tavvy_place_id);
        if(!current || event.scheduled_start<current.scheduled_start || event.scheduled_start===current.scheduled_start&&event.id<current.id)nextByBusiness.set(event.tavvy_place_id,event);
      }
      offlinePlacesWithSchedule=[...nextByBusiness.values()].sort((a,b)=>a.scheduled_start.localeCompare(b.scheduled_start)||a.id.localeCompare(b.id)).map(event=>({
        ...event.tavvy_places,next_event:event,
        next_event_label:new Date(event.scheduled_start).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' (UTC)',
      }));
    }

    // Get unique categories for filter UI (from both live and offline)
    const allCategories = new Set<string>();
    
    (sessions || [])
      .filter((s: any) => s.tavvy_places?.place_type === "on_the_go" && s.tavvy_places?.tavvy_category)
      .forEach((s: any) => allCategories.add(s.tavvy_places.tavvy_category));
    
    offlinePlacesWithSchedule
      .filter((p: any) => p.tavvy_category)
      .forEach((p: any) => allCategories.add(p.tavvy_category));

    const categories = [...allCategories].sort();

    // Format as GeoJSON for map consumption
    const liveFeatures = filteredSessions.map((s: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.session_lng, s.session_lat],
      },
      properties: {
        session_id: s.id,
        tavvy_place_id: s.tavvy_place_id,
        canonical_place_id: s.tavvy_places?.canonical_place_id || null,
        place_name: s.tavvy_places?.name,
        category: s.tavvy_places?.tavvy_category,
        subcategory: s.tavvy_places?.tavvy_subcategory,
        cover_image_url: s.tavvy_places?.cover_image_url,
        phone: s.tavvy_places?.phone,
        service_area: s.tavvy_places?.service_area,
        location_label: s.location_label,
        session_address: s.session_address,
        today_note: s.today_note,
        started_at: s.started_at,
        scheduled_end_at: s.scheduled_end_at,
        is_live: true,
        has_schedule: s.tavvy_places?.has_upcoming_events || false,
      },
    }));

    // Add offline places with schedule as separate features (using their next event location)
    const scheduledFeatures = offlinePlacesWithSchedule.map((p: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.next_event.longitude, p.next_event.latitude],
      },
      properties: {
        tavvy_place_id: p.id,
        canonical_place_id: p.canonical_place_id || null,
        place_name: p.name,
        category: p.tavvy_category,
        subcategory: p.tavvy_subcategory,
        cover_image_url: p.cover_image_url,
        phone: p.phone,
        service_area: p.service_area,
        is_live: false,
        has_schedule: true,
        next_event_label: p.next_event_label,
        next_event_location: p.next_event.location_name,
        next_event_address: p.next_event.location_address,
        next_event_start: p.next_event.scheduled_start,
      },
    }));

    const geojson = {
      type: "FeatureCollection",
      features: [...liveFeatures, ...scheduledFeatures],
    };

    return new Response(
      JSON.stringify({
        success: true,
        live_count: filteredSessions.length,
        scheduled_count: offlinePlacesWithSchedule.length,
        total_count: filteredSessions.length + offlinePlacesWithSchedule.length,
        available_categories: categories,
        geojson,
        // Live sessions
        sessions: filteredSessions.map((s: any) => ({
          session_id: s.id,
          tavvy_place_id: s.tavvy_place_id,
        canonical_place_id: s.tavvy_places?.canonical_place_id || null,
          session_lat: s.session_lat,
          session_lng: s.session_lng,
          place_name: s.tavvy_places?.name,
          category: s.tavvy_places?.tavvy_category,
          subcategory: s.tavvy_places?.tavvy_subcategory,
          cover_image_url: s.tavvy_places?.cover_image_url,
          phone: s.tavvy_places?.phone,
          service_area: s.tavvy_places?.service_area,
          location_label: s.location_label,
          session_address: s.session_address,
          today_note: s.today_note,
          started_at: s.started_at,
          scheduled_end_at: s.scheduled_end_at,
          is_live: true,
          has_schedule: s.tavvy_places?.has_upcoming_events || false,
        })),
        // Offline places with upcoming schedule
        scheduled_places: offlinePlacesWithSchedule.map((p: any) => ({
          tavvy_place_id: p.id,
        canonical_place_id: p.canonical_place_id || null,
          place_name: p.name,
          category: p.tavvy_category,
          subcategory: p.tavvy_subcategory,
          cover_image_url: p.cover_image_url,
          phone: p.phone,
          service_area: p.service_area,
          is_live: false,
          has_schedule: true,
          next_event_label: p.next_event_label,
          next_event: {
            location_name: p.next_event.location_name,
            location_address: p.next_event.location_address,
            latitude: p.next_event.latitude,
            longitude: p.next_event.longitude,
            scheduled_start: p.next_event.scheduled_start,
            scheduled_end: p.next_event.scheduled_end,
          },
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Map data error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

const MAX_ROWS=10000,PAGE_SIZE=500,EARTH_RADIUS=6371000;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
function point(lat:unknown,lng:unknown):boolean{return finite(lat)&&finite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;}
export async function readParams(req:Request):Promise<MapDataRequest>{
 let params:any;
 if(req.method==='GET'){
  const q=new URL(req.url).searchParams;
  const number=(key:string)=>q.has(key)?(q.get(key)?.trim()?Number(q.get(key)):NaN):undefined;
  params={category:q.get('category')||undefined,center_lat:number('center_lat'),center_lng:number('center_lng'),radius_meters:number('radius_meters'),include_scheduled:q.get('include_scheduled')!=='false'};
  if(['north','south','east','west'].some(k=>q.has(k)))params.bounds={north:number('north'),south:number('south'),east:number('east'),west:number('west')};
  if(q.has('include_scheduled')&&!['true','false'].includes(q.get('include_scheduled')!))throw new OnTheGoHttpError('Invalid schedule filter');
 }else{params=await req.json().catch(()=>{throw new OnTheGoHttpError('Invalid map request');});}
 if(!params||typeof params!=='object'||Array.isArray(params))throw new OnTheGoHttpError('Invalid map request');
 if(params.category!==undefined&&(typeof params.category!=='string'||params.category.length>200))throw new OnTheGoHttpError('Invalid category');
 if(params.include_scheduled===undefined)params.include_scheduled=true;
 if(typeof params.include_scheduled!=='boolean')throw new OnTheGoHttpError('Invalid schedule filter');
 if(params.bounds){const b=params.bounds;if(typeof b!=='object'||!point(b.north,b.east)||!point(b.south,b.west)||b.north<b.south)throw new OnTheGoHttpError('Invalid map bounds');}
 const hasCenter=params.center_lat!==undefined||params.center_lng!==undefined;
 if(hasCenter&&!point(params.center_lat,params.center_lng))throw new OnTheGoHttpError('Use a valid latitude and longitude');
 if(params.radius_meters!==undefined&&!hasCenter)throw new OnTheGoHttpError('A radius requires a center location');
 if(hasCenter&&params.radius_meters===undefined)params.radius_meters=10000;
 if(params.radius_meters!==undefined&&(!finite(params.radius_meters)||params.radius_meters<=0||params.radius_meters>500000))throw new OnTheGoHttpError('Use a radius up to 500 km');
 return params;
}
function inBounds(lat:number,lng:number,b:NonNullable<MapDataRequest['bounds']>){return lat>=b.south&&lat<=b.north&&(b.west<=b.east?lng>=b.west&&lng<=b.east:lng>=b.west||lng<=b.east);}
export function inScope(lat:number,lng:number,p:MapDataRequest){
 if(!point(lat,lng)||p.bounds&&!inBounds(lat,lng,p.bounds))return false;
 if(p.center_lat!==undefined&&p.center_lng!==undefined&&p.radius_meters!==undefined){const a=Math.sin((lat-p.center_lat)*Math.PI/360)**2+Math.cos(lat*Math.PI/180)*Math.cos(p.center_lat*Math.PI/180)*Math.sin((lng-p.center_lng)*Math.PI/360)**2;return 2*EARTH_RADIUS*Math.asin(Math.sqrt(Math.min(1,Math.max(0,a))))<=p.radius_meters;}
 return true;
}
function radiusBounds(p:MapDataRequest):MapDataRequest['bounds']{
 if(p.center_lat===undefined||p.center_lng===undefined||p.radius_meters===undefined)return;
 const delta=p.radius_meters/EARTH_RADIUS*180/Math.PI,north=Math.min(90,p.center_lat+delta),south=Math.max(-90,p.center_lat-delta);
 if(north===90||south===-90)return{north,south,west:-180,east:180};
 const dl=Math.asin(Math.min(1,Math.sin(delta*Math.PI/180)/Math.cos(p.center_lat*Math.PI/180)))*180/Math.PI;
 const wrap=(n:number)=>(n+540)%360-180;return{north,south,west:wrap(p.center_lng-dl),east:wrap(p.center_lng+dl)};
}
export function restrictLocation(query:any,lat:string,lng:string,p:MapDataRequest){
 // Apply one enclosing server box; exact bounds AND radius are reapplied to every returned point.
 const b=p.bounds||radiusBounds(p);if(!b)return query;
 query=query.gte(lat,b.south).lte(lat,b.north);
 return b.west<=b.east?query.gte(lng,b.west).lte(lng,b.east):query.or(`${lng}.gte.${b.west},${lng}.lte.${b.east}`);
}
export async function readAll(build:()=>any):Promise<any[]>{
 const rows:any[]=[];let cursor='';
 for(;;){
  let query=build().order('id',{ascending:true}).limit(Math.min(PAGE_SIZE,MAX_ROWS-rows.length+1));
  if(cursor)query=query.gt('id',cursor);
  const {data,error}=await query;
  if(error||!Array.isArray(data))throw new OnTheGoHttpError('Mobile businesses are unavailable. Please try again.',503);
  if(rows.length+data.length>MAX_ROWS)throw new OnTheGoHttpError('Too many mobile businesses in this area. Narrow the map area or category.',503);
  for(const row of data){if(typeof row.id!=='string'||row.id<=cursor)throw new OnTheGoHttpError('Mobile businesses changed while loading. Please refresh.',503);cursor=row.id;rows.push(row);}
  if(data.length<PAGE_SIZE)return rows;
 }
}
