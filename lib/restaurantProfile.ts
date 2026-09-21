export interface RestaurantProfile { name:string; street:string; city:string; region:string; postcode:string; country:string; cuisine:string; latitude:number|null; longitude:number|null; confirmLocation?:boolean }
export function validateRestaurantProfile(value:RestaurantProfile):RestaurantProfile {
 const output={...value};
 for(const key of ['name','street','city','region','postcode','country','cuisine'] as const){const v=value[key]; if(typeof v!=='string'||/[\u0000-\u001f]/.test(v)||v.length>(key==='street'?300:key==='postcode'?20:120))throw new Error(`Check your ${key}.`);output[key]=v.trim();}
 if(output.name.length<2)throw new Error('Enter your restaurant name.');
 const {latitude:lat,longitude:lng}=output;
 if((lat===null)!==(lng===null)||(lat!==null&&(!Number.isFinite(lat)||Math.abs(lat)>90))||(lng!==null&&(!Number.isFinite(lng)||Math.abs(lng)>180)))throw new Error('Choose a valid map location.');
 return output;
}
export async function getRestaurantProfile(db:any,placeId:string):Promise<RestaurantProfile>{const {data,error}=await db.rpc('get_restaurant_owner_profile',{p_place_id:placeId});if(error||!data)throw new Error('Your restaurant profile could not be loaded.');return data;}
export async function saveRestaurantProfile(db:any,placeId:string,value:RestaurantProfile):Promise<void>{const {data,error}=await db.rpc('save_restaurant_owner_profile',{p_place_id:placeId,p_profile:validateRestaurantProfile(value)});if(error||data!==placeId)throw new Error(error?.code==='42501'?'Verified ownership is required.':'Your profile could not be saved. Please try again.');}
