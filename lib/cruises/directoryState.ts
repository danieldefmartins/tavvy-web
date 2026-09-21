import { CruiseKind } from './catalog';
export type CruiseDirectoryFilters = { query: string; kind: '' | CruiseKind; status: 'operating' | 'announced'; operatorId: string };
export const EMPTY_CRUISE_FILTERS: CruiseDirectoryFilters = { query:'',kind:'',status:'operating',operatorId:'' };
const one=(value:unknown)=>typeof value==='string'?value:'';
export function readCruiseDirectoryQuery(query:Record<string,unknown>):CruiseDirectoryFilters {
 const kind=one(query.kind),operatorId=one(query.company);
 return {query:one(query.q).slice(0,160),kind:['ocean','river','expedition'].includes(kind)?kind as CruiseKind:'',status:query.status==='announced'?'announced':'operating',operatorId:/^[a-z0-9_-]{1,100}$/i.test(operatorId)?operatorId:''};
}
export function cruiseDirectoryQuery(filters:CruiseDirectoryFilters):Record<string,string> {
 return {...(filters.query?{q:filters.query}:{}),...(filters.kind?{kind:filters.kind}:{}),...(filters.status==='announced'?{status:filters.status}:{}),...(filters.operatorId?{company:filters.operatorId}:{})};
}
