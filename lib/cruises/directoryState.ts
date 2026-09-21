import { CruiseKind } from './catalog';
export type CruiseLength = '' | 'under150' | '150to250' | 'over250';
export type CruiseYear = '' | '2020plus' | '2010s' | 'before2010';
export type CruiseAudience = '' | 'family_activities' | 'adults_only';
export type CruiseDirectoryFilters = { query: string; kind: '' | CruiseKind; status: 'operating' | 'announced'; operatorId: string; length: CruiseLength; year: CruiseYear; audience: CruiseAudience };
export const EMPTY_CRUISE_FILTERS: CruiseDirectoryFilters = { query:'',kind:'',status:'operating',operatorId:'',length:'',year:'',audience:'' };
const one=(value:unknown)=>typeof value==='string'?value:'';
export function readCruiseDirectoryQuery(query:Record<string,unknown>):CruiseDirectoryFilters {
 const kind=one(query.kind),operatorId=one(query.company),length=one(query.length),year=one(query.year),audience=one(query.audience);
 return {query:one(query.q).slice(0,160),kind:['ocean','river','expedition'].includes(kind)?kind as CruiseKind:'',status:query.status==='announced'?'announced':'operating',operatorId:/^[a-z0-9_-]{1,100}$/i.test(operatorId)?operatorId:'',length:['under150','150to250','over250'].includes(length)?length as CruiseLength:'',year:['2020plus','2010s','before2010'].includes(year)?year as CruiseYear:'',audience:['family_activities','adults_only'].includes(audience)?audience as CruiseAudience:''};
}
export function cruiseDirectoryQuery(filters:CruiseDirectoryFilters):Record<string,string> {
 return {...(filters.query?{q:filters.query}:{}),...(filters.kind?{kind:filters.kind}:{}),...(filters.status==='announced'?{status:filters.status}:{}),...(filters.operatorId?{company:filters.operatorId}:{}),...(filters.length?{length:filters.length}:{}),...(filters.year?{year:filters.year}:{}),...(filters.audience?{audience:filters.audience}:{})};
}
