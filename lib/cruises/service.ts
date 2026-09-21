import { supabase } from '../supabaseClient';
import { CruiseKind, CruiseShipDetail, cruisePublicationProblems } from './catalog';
type ReadClient = { rpc: (name: string, args: Record<string,unknown>) => PromiseLike<{data: any; error: any}> };
export type CruiseSearch = { query?: string; kind?: CruiseKind; status?: 'operating'|'announced'; offset?: number; limit?: number };
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
 const {data,error}=await client.rpc('search_cruise_ships_v1',{p_query:(search.query||'').trim().slice(0,160),p_kind:search.kind||null,p_status:search.status||'operating',p_offset:offset,p_limit:limit+1});
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
