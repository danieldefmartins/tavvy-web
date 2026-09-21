import {adminCruiseUploadUrl} from './catalog';
export type CruiseGalleryPhoto={id:string;url:string;alt:string;caption:string|null;source_id:string|null;origin?:'admin_upload';width:number;height:number};
type GalleryClient={rpc:(name:string,args:Record<string,unknown>)=>PromiseLike<{data:any;error:any}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** This RPC already enforces current publication and registered admin upload provenance. Legacy rows remain supported. */
export async function readCruiseGallery(shipId:string,client:GalleryClient):Promise<CruiseGalleryPhoto[]>{
 if(!uuid.test(shipId))throw new Error('Invalid ship identity');
 const {data,error}=await client.rpc('get_cruise_ship_gallery_v1',{p_ship_id:shipId});
 if(error||!Array.isArray(data)||data.length>100)throw new Error('Ship photos are temporarily unavailable.');
 const ids=new Set<string>();
 for(const item of data){
  let url:URL;try{url=new URL(item?.url);}catch{throw new Error('Invalid ship photo');}
  if(!item||!uuid.test(item.id)||ids.has(item.id)||typeof item.alt!=='string'||item.alt.length>500||(item.caption!==null&&typeof item.caption!=='string')||(item.origin==='admin_upload'?(item.source_id!==null&&typeof item.source_id!=='string'):(item.origin!==undefined||typeof item.source_id!=='string'||!item.source_id))||(item.origin==='admin_upload'&&!adminCruiseUploadUrl(item.url,shipId,item.id))||!Number.isInteger(item.width)||item.width<1||item.width>2400||!Number.isInteger(item.height)||item.height<1||item.height>2400||url.protocol!=='https:'||!(/^[a-z0-9]+\.supabase\.co$/).test(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!==`/storage/v1/object/public/universe-images/cruise-ships/${shipId}/${item.id}.webp`)throw new Error('Invalid ship photo');
  ids.add(item.id);
 }
 return data.map(({id,url,alt,caption,source_id,origin,width,height})=>({id,url,alt,caption,source_id,...(origin?{origin}:{}),width,height}));
}
export function galleryWithCover(photos:CruiseGalleryPhoto[],cover:{url:string;alt:string}|null):Array<{id:string;url:string;alt:string;caption:string|null}>{
 if(!cover||photos.some(photo=>photo.url===cover.url))return photos;
 return[{id:'cover',url:cover.url,alt:cover.alt,caption:null},...photos];
}
