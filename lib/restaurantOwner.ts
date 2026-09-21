/** Restaurant ownership is separate from a Pros profile or paid subscription. */
export const OWNER_CLAIM_COLUMNS = 'id,place_id,business_name,business_email,business_phone,claimant_name,claimant_role,status,created_at,ownership_verified_at,review_notes';
export const isPlaceId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export type RestaurantClaimInput = { placeId: string; name: string; role: string; email: string; phone: string; accepted: boolean };
export type OwnerClaim = { id: string; place_id: string; business_name: string; business_email: string; business_phone: string; claimant_name: string; claimant_role: string; status: string; created_at: string; ownership_verified_at: string | null; review_notes?: string | null };
export type OwnerPlace = { id: string; name: string; street?: string; city?: string; region?: string; phone?: string; website?: string; description?: string; hours?: unknown };
export type OwnerWorkspace = { place: OwnerPlace; claim: OwnerClaim | null; canManage: boolean; menu?: { id: string; is_active: boolean; view_count: number | null; share_count: number | null }; cards?: { id: string; full_name: string; slug: string; place_id: string | null; is_published: boolean }[]; storyCount?: number; links?: Record<string,string> };
export const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
export const RESTAURANT_LINKS = [{ key:'instagram',label:'Instagram',domain:'instagram.com' },{ key:'tiktok',label:'TikTok',domain:'tiktok.com' },{ key:'youtube',label:'YouTube',domain:'youtube.com' },{ key:'facebook',label:'Facebook',domain:'facebook.com' },{ key:'doordash',label:'DoorDash',domain:'doordash.com' },{ key:'uber_eats',label:'Uber Eats',domain:'ubereats.com' },{ key:'grubhub',label:'Grubhub',domain:'grubhub.com' }];

export function validateRestaurantClaim(value: unknown): RestaurantClaimInput {
  const input = value as Partial<RestaurantClaimInput> | null;
  if (!input || !isPlaceId(input.placeId)) throw new Error('Choose an existing Tavvy place first.');
  const field = (key: 'name' | 'role' | 'email' | 'phone', max: number) => {
    const v = input[key];
    if (typeof v !== 'string' || !v.trim() || v.trim().length > max || /[\u0000-\u001f]/.test(v)) throw new Error(`Enter a valid ${key}.`);
    return v.trim();
  };
  const name = field('name', 120), role = field('role', 80), email = field('email', 254).toLowerCase(), phone = field('phone', 32);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid business email.');
  if (!/^\+?[0-9 ().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) throw new Error('Enter a valid contact phone number.');
  if (input.accepted !== true) throw new Error('Confirm that you are authorized to represent this restaurant.');
  return { placeId: input.placeId, name, role, email, phone, accepted: true };
}

export function canManageRestaurant(claim: Pick<OwnerClaim, 'status' | 'ownership_verified_at'> | null | undefined): boolean {
  return claim?.status === 'verified' && !!claim.ownership_verified_at && Number.isFinite(Date.parse(claim.ownership_verified_at));
}

export function claimStatusLabel(claim: OwnerClaim | null): string {
  if (!claim) return 'Not claimed';
  if (canManageRestaurant(claim)) return 'Ownership verified';
  if (claim.status === 'rejected') return 'More verification needed';
  return 'Awaiting ownership verification';
}

export async function submitRestaurantClaim(db: any, value: unknown): Promise<OwnerClaim> {
  const input = validateRestaurantClaim(value);
  const { data, error } = await db.rpc('submit_restaurant_claim', { p_place_id: input.placeId, p_claimant_name: input.name, p_claimant_role: input.role, p_email: input.email, p_phone: input.phone, p_authorized: input.accepted });
  if (error) throw new Error(error.code === '42501' ? 'Sign in again to submit your claim.' : 'Your claim could not be saved. Please try again.');
  if (!data || !isPlaceId(data.id) || data.place_id !== input.placeId || typeof data.status !== 'string') throw new Error('The server did not confirm your claim. Please refresh before trying again.');
  return data;
}

export async function getRestaurantWorkspace(db: any, placeId: string): Promise<OwnerWorkspace> {
  if (!isPlaceId(placeId)) throw new Error('Choose an existing Tavvy place first.');
  const { data, error } = await db.rpc('get_restaurant_owner_workspace', { p_place_id: placeId });
  if (error || !data || data.place?.id !== placeId) throw new Error('Your restaurant workspace could not be loaded. Please try again.');
  // Fail closed if server and claim proof disagree. Pending never exposes management.
  const canManage = data.canManage === true && canManageRestaurant(data.claim);
  return canManage ? { ...data, canManage } : { place: data.place, claim: data.claim || null, canManage: false };
}

export function validateRestaurantDetails(value: unknown) {
  const input = value as Record<string, unknown> | null;
  if (!input) throw new Error('Restaurant details are required.');
  const take = (key: string, max: number) => { if (typeof input[key] !== 'string' || (input[key] as string).length > max) throw new Error(`Enter a valid ${key}.`); return (input[key] as string).trim(); };
  const phone = take('phone', 32), website = take('website', 2048), description = take('description', 2000);
  if (phone && (!/^\+?[0-9 ().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) throw new Error('Enter a valid phone number.');
  if (website) { try { const url = new URL(website); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); } catch { throw new Error('Website must be a full HTTPS address.'); } }
  let hours: Record<string,string> | undefined, links: Record<string,string> | undefined;
  if (input.hours !== undefined) {
    if (!input.hours || typeof input.hours !== 'object' || Array.isArray(input.hours)) throw new Error('Enter weekly hours.');
    hours = {};
    for (const day of WEEK_DAYS) {
      const value = (input.hours as Record<string,unknown>)[day];
      if (typeof value !== 'string' || !/^(|Closed|Open 24 hours|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d(?:,(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d)*)$/.test(value.trim()) || value.length>120) throw new Error(`${day}: use 09:00-17:00, Closed, or Open 24 hours. Separate split hours with a comma.`);
      hours[day]=value.trim();
    }
  }
  if (input.links !== undefined) {
    if (!input.links || typeof input.links !== 'object' || Array.isArray(input.links)) throw new Error('Enter valid restaurant links.');
    links={};
    for (const item of RESTAURANT_LINKS) {
      const value=(input.links as Record<string,unknown>)[item.key];
      if (typeof value !== 'string' || value.length>2048) throw new Error(`Enter a valid ${item.label} link.`);
      const href=value.trim();
      if(href) { try {const url=new URL(href); if(url.protocol!=='https:'||url.username||url.password||!(url.hostname===item.domain||url.hostname.endsWith('.'+item.domain)))throw new Error();}catch{throw new Error(`Use a full HTTPS ${item.label} listing or profile URL.`);} }
      links[item.key]=href;
    }
  }
  return { phone, website, description, ...(hours ? { hours } : {}), ...(links ? { links } : {}) };
}

export async function saveRestaurantDetails(db: any, placeId: string, value: unknown): Promise<void> {
  if (!isPlaceId(placeId)) throw new Error('Choose a restaurant first.');
  const details = validateRestaurantDetails(value);
  const { data, error } = await db.rpc('save_restaurant_owner_details', { p_place_id: placeId, p_details: details });
  if (error || data !== placeId) throw new Error(error?.code === '42501' ? 'Verified ownership is required to edit this restaurant.' : 'The server did not confirm your changes. Please try again.');
}

export async function linkRestaurantCard(db: any, placeId: string, cardId: string): Promise<void> {
  if (!isPlaceId(placeId) || !isPlaceId(cardId)) throw new Error('Choose a restaurant and one of your eCards.');
  const { data, error } = await db.rpc('link_restaurant_owner_card', { p_place_id: placeId, p_card_id: cardId });
  if (error || data !== cardId) throw new Error('Your eCard could not be linked. Verified ownership and a card you own are required.');
}

export const RESTAURANT_KINDS = ['Restaurant','Cafe','Bakery','Bar'] as const;
export type RestaurantDraft = { requestId:string; restaurantName:string; kind:string; street:string; city:string; region:string; postcode:string; country:string; name:string; role:string; email:string; phone:string; accepted:boolean };
export type RestaurantDuplicate = OwnerPlace & { exactAddress:boolean };
export const RESTAURANT_DRAFT_KEY='tavvy:restaurant-onboarding:draft:v1';
export function newRestaurantDraft(restaurantName=''):RestaurantDraft {
  // This is a request identifier, never an authentication credential.
  const requestId='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return (c==='x'?r:(r&3)|8).toString(16)});
  return {requestId,restaurantName,kind:'Restaurant',street:'',city:'',region:'',postcode:'',country:'US',name:'',role:'',email:'',phone:'',accepted:false};
}
export function validateNewRestaurant(value:unknown):RestaurantDraft {
  const input=value as RestaurantDraft|null;
  if(!input||!isPlaceId(input.requestId))throw new Error('Reload the restaurant form and try again.');
  const read=(key:keyof RestaurantDraft,max:number,required=true)=>{const raw=input[key];if(typeof raw!=='string'||raw.trim().length>max||(required&&!raw.trim())||/[\u0000-\u001f]/.test(raw))throw new Error(`Enter a valid ${key==='restaurantName'?'restaurant name':key}.`);return raw.trim();};
  const restaurantName=read('restaurantName',160),street=read('street',200),city=read('city',100),region=read('region',100,false),postcode=read('postcode',20,false),country=read('country',2).toUpperCase(),kind=read('kind',40);
  if(!/^[A-Z]{2}$/.test(country))throw new Error('Choose a country.');
  if(!RESTAURANT_KINDS.includes(kind as any))throw new Error('Choose a restaurant type.');
  const claim=validateRestaurantClaim({...input,placeId:input.requestId});
  return {requestId:input.requestId,restaurantName,street,city,region,postcode,country,kind,name:claim.name,role:claim.role,email:claim.email,phone:claim.phone,accepted:true};
}
function onboardingDetails(draft:RestaurantDraft){return {name:draft.restaurantName,kind:draft.kind,street:draft.street,city:draft.city,region:draft.region,postcode:draft.postcode,country:draft.country};}
export async function findRestaurantDuplicates(db:any,value:unknown):Promise<RestaurantDuplicate[]> {
  const input=validateNewRestaurant(value);const {data,error}=await db.rpc('find_restaurant_onboarding_duplicates',{p_details:onboardingDetails(input)});
  if(error||!Array.isArray(data)||data.some(p=>!isPlaceId(p.id)))throw new Error('We could not check for existing restaurants. Please try again before adding this place.');return data;
}
export async function createRestaurantAndClaim(db:any,value:unknown,confirmedDistinct:boolean):Promise<{placeId:string;claim:OwnerClaim}|{duplicates:RestaurantDuplicate[]}> {
  const input=validateNewRestaurant(value);
  const {data,error}=await db.rpc('create_restaurant_with_pending_claim',{p_request_id:input.requestId,p_details:onboardingDetails(input),p_claim:{name:input.name,role:input.role,email:input.email,phone:input.phone,accepted:input.accepted},p_confirm_distinct:confirmedDistinct===true});
  if(error)throw new Error(error.code==='42501'?'Sign in again to add your restaurant.':error.code==='22023'?'Your details changed or are incomplete. Review the form before trying again.':'Your restaurant could not be saved. Your draft is kept so you can try again.');
  if(data?.outcome==='choose_existing'&&Array.isArray(data.places))return {duplicates:data.places};
  if(data?.outcome!=='created'||!isPlaceId(data.placeId)||!isPlaceId(data.claim?.id)||data.claim.place_id!==data.placeId||data.claim.status!=='pending'||data.claim.ownership_verified_at)throw new Error('The server did not confirm a pending request. Your draft is kept; please try again.');
  return {placeId:data.placeId,claim:data.claim};
}
