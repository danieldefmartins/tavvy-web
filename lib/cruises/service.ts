import {readCruiseGallery} from './gallery';
import { supabase } from '../supabaseClient';
import { CruiseKind, CruiseShipDetail, cruisePublicationProblems } from './catalog';
import { FEATURED_CRUISE_SHIP_IDS } from './featured';
type ReadClient = { rpc: (name: string, args: Record<string,unknown>) => PromiseLike<{data: any; error: any}> };
export type CruiseSearch = { query?: string; kind?: CruiseKind; status?: 'operating'|'announced'; operatorId?: string; length?: 'under150'|'150to250'|'over250'|''; year?: '2020plus'|'2010s'|'before2010'|''; audience?: 'family_activities'|'adults_only'|''; offset?: number; limit?: number; shipIds?: readonly string[] };
export class CruiseUnavailableError extends Error { constructor() { super('Cruise information is temporarily unavailable. Please try again.'); this.name='CruiseUnavailableError'; } }
function detail(value: any): CruiseShipDetail | null {
 if (!value || !value.ship || !Array.isArray(value.sources) || !Array.isArray(value.venues)) return null;
 const ship=value.ship;
 if (!Array.isArray(ship.facts) || !Array.isArray(ship.name_history) || !Array.isArray(ship.cabin_categories) || !Array.isArray(ship.status_source_ids)) return null;
 if (ship.publication_status!=='published' || cruisePublicationProblems(ship,value.sources).length) return null;
 return value as CruiseShipDetail;
}
/** Read-only RPC validates public identity and paginates before returning results. */
export async function searchCruiseShips(search: CruiseSearch = {}, client: ReadClient = supabase): Promise<{ships: CruiseShipDetail[]; hasMore: boolean}> {
 const limit=Math.max(1,Math.min(50,Math.trunc(search.limit||24))),offset=Math.max(0,Math.trunc(search.offset||0));
 const {data,error}=await client.rpc('search_cruise_ships_v3',{p_length:search.length||null,p_year:search.year||null,p_audience:search.audience||null,p_query:(search.query||'').trim().slice(0,160),p_kind:search.kind||null,p_status:search.status||'operating',p_operator_id:search.operatorId||null,p_ship_ids:search.shipIds ? [...search.shipIds] : null,p_offset:offset,p_limit:limit+1});
 if(error || !Array.isArray(data)) throw new CruiseUnavailableError();
 const rows=data.map(detail);if(rows.some(row=>!row))throw new CruiseUnavailableError();
 return {ships:rows.slice(0,limit) as CruiseShipDetail[],hasMore:rows.length>limit};
}
export async function getCruiseShip(identity: {slug:string}|{universeId:string}, client: ReadClient = supabase): Promise<CruiseShipDetail|null> {
 const {data,error}=await client.rpc('get_cruise_ship_v1',{p_slug:'slug' in identity?identity.slug:null,p_universe_id:'universeId' in identity?identity.universeId:null});
 if(error)throw new CruiseUnavailableError();
 if(data===null)return null;
 const ship=detail(data);if(!ship)throw new CruiseUnavailableError();return ship;
}

export type CruiseOperator = { id: string; name: string };
/** Facets include every operator with public ships, not just the loaded result page. */
export async function getCruiseOperators(client: ReadClient = supabase): Promise<CruiseOperator[]> {
 const {data,error}=await client.rpc('get_cruise_operators_v1',{});
 if(error || !Array.isArray(data) || data.some(row=>!row || typeof row.id!=='string' || !row.id.trim() || typeof row.name!=='string' || !row.name.trim()) || new Set(data.map(row=>row.id)).size!==data.length) throw new CruiseUnavailableError();
 return data.map(({id,name})=>({id,name}));
}
export async function getFeaturedCruiseShips(search: CruiseSearch = {}, client: ReadClient = supabase): Promise<CruiseShipDetail[]> {
 if(search.query?.trim()) return [];
 const result=await searchCruiseShips({...search,offset:0,limit:FEATURED_CRUISE_SHIP_IDS.length,shipIds:FEATURED_CRUISE_SHIP_IDS},client);
 return result.ships;
}

/** Optional editorial media: no change to the ship identity/detail RPC. */
export function getCruiseGallery(shipId:string,client:ReadClient=supabase){return readCruiseGallery(shipId,client);}
export async function getCruiseDescription(universeId:string,client:Pick<typeof supabase,'from'>=supabase):Promise<string|null>{
 const {data,error}=await client.from('atlas_universes').select('description').eq('id',universeId).eq('universe_kind','cruise_ship').eq('status','published').maybeSingle();
 if(error)throw new CruiseUnavailableError();
 return typeof data?.description==='string'&&data.description.trim()?data.description.trim():null;
}
