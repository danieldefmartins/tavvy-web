/** Public content only. Identity is resolved by the server; never sent by the viewer. */
export type PublicEndorsement = {id:string;endorserName:string;note:string;createdAt:string|null};
export type PublicCardSafety = {visible:boolean;endorsements:PublicEndorsement[]};
export async function fetchPublicCardSafety(client:{rpc:Function},cardId:string):Promise<PublicCardSafety>{
 const {data,error}=await client.rpc('get_public_ecard_safety_v1',{p_card_id:cardId});
 if(error||typeof data?.visible!=='boolean'||!Array.isArray(data.endorsements)||data.endorsements.some((row:any)=>!row||typeof row.id!=='string'||typeof row.note!=='string'||typeof row.endorserName!=='string'||(row.createdAt!==null&&typeof row.createdAt!=='string')))throw new Error('Public card content is temporarily unavailable.');
 return data.visible?data:{visible:false,endorsements:[]};
}
