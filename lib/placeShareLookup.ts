import { createClient } from '@supabase/supabase-js';
import { normalizePlaceShareId } from './placeShare';
import { buildPlaceShareMetadata, DEMO_PLACE_SHARE, placeSharePhotoUrl, PlaceShareMetadata } from './placeShareMetadata';

export type PlaceShareLookup = { status:'ready'|'missing'|'unavailable'; metadata:PlaceShareMetadata | null };
const PLACE_COLUMNS = 'id,name,tavvy_category,tavvy_subcategory,city,region,country,cover_image_url,photos,status,is_active';
/** Anonymous, lean lookup for crawler HTML. No review aggregates or private customer data. */
export async function fetchPlaceShareMetadata(identifier: unknown, options: { client?: any; timeoutMs?: number } = {}): Promise<PlaceShareLookup> {
  const id = normalizePlaceShareId(identifier);
  if (!id) return {status:'missing',metadata:null};
  if (id === 'demo-trattoria') return {status:'ready',metadata:DEMO_PLACE_SHARE};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!options.client && (!url || !key)) return {status:'unavailable',metadata:null};
  const client=options.client || createClient(url!,key!,{auth:{persistSession:false,autoRefreshToken:false}});
  const signal=AbortSignal.timeout(options.timeoutMs || 4000);
  const execute=async(query:any) => { const result=await query.abortSignal(signal);if(result.error)throw result.error;return result.data || []; };
  try {
    const isFsq=id.startsWith('fsq:'), raw=isFsq?id.slice(4):id;
    const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raw);
    let query=client.from('places').select(PLACE_COLUMNS).eq(isFsq?'source_id':uuid?'id':'slug',raw);
    if(isFsq)query=query.eq('source_type','fsq');
    let rows=await execute(query.limit(2));
    if (!rows.length && !isFsq) rows=await execute(client.from('places').select(PLACE_COLUMNS).eq('source_id',raw).limit(2));
    if (rows.length>1) return {status:'missing',metadata:null};
    if (rows[0]) {
      const row=rows[0];
      if (row.is_active===false || (row.status && row.status!=='active')) return {status:'missing',metadata:null};
      let metadata=buildPlaceShareMetadata(row);
      if (!metadata.photoUrl) {
        // A genuine public place photo can fill a missing cover; failure leaves the text fallback.
        try {
          const photos=await execute(client.from('place_photos').select('url').eq('place_id',row.id).eq('status','live').order('created_at',{ascending:false}).limit(1));
          const photo=placeSharePhotoUrl(photos[0]?.url);
          if(photo)metadata=buildPlaceShareMetadata({...row,cover_image_url:photo});
        } catch {}
      }
      return {status:'ready',metadata};
    }
    if (isFsq || /^[a-f0-9]{24}$/i.test(raw)) {
      const provider=await execute(client.from('fsq_places_raw').select('fsq_place_id,name,locality,region,country,fsq_category_labels').eq('fsq_place_id',raw).limit(1));
      if(provider[0]) {
        const row=provider[0], labels=row.fsq_category_labels;
        const category=Array.isArray(labels)?labels[0]:typeof labels==='string'?labels:'';
        const hierarchy=(typeof category==='string'?category:'').split('>').map(part=>part.trim()).filter(Boolean);
        // Preserve the provider’s explicit parent/child labels; do not infer a cuisine.
        return {status:'ready',metadata:buildPlaceShareMetadata({id:`fsq:${row.fsq_place_id}`,name:row.name,city:row.locality,region:row.region,country:row.country,category:hierarchy.length>1?hierarchy[hierarchy.length-2]:hierarchy[0],tavvy_subcategory:hierarchy.length>1?hierarchy[hierarchy.length-1]:undefined})};
      }
    }
    return {status:'missing',metadata:null};
  } catch { return {status:'unavailable',metadata:null}; }
}
