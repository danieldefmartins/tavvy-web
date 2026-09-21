// Exact catalog identities only. Assets are sourced from each operator's official site.
// Unknown operators keep their full label and use initials; no fuzzy brand matching.
export const CRUISE_LINE_BRANDS: Record<string, {file: string; background: string}> = {
 'royal-caribbean-international': {file:'royal-caribbean-international.png',background:'#102953'},
 'carnival-cruise-line': {file:'carnival-cruise-line.png',background:'#ffffff'},
 'norwegian-cruise-line': {file:'norwegian-cruise-line.png',background:'#ffffff'},
 'princess-cruises': {file:'princess-cruises.png',background:'#ffffff'},
 'celebrity-cruises': {file:'celebrity-cruises.png',background:'#ffffff'},
 'holland-america-line': {file:'holland-america-line.png',background:'#102953'},
 'a-rosa': {file:'a-rosa.png',background:'#ffffff'},
 'amawaterways': {file:'amawaterways.png',background:'#ffffff'},
 'aurora-expeditions': {file:'aurora-expeditions.png',background:'#ffffff'},
 'avalon-waterways': {file:'avalon-waterways.png',background:'#ffffff'},
 'azamara': {file:'azamara.png',background:'#ffffff'},
 'costa-cruises': {file:'costa-cruises.png',background:'#ffffff'},
 'cunard': {file:'cunard.png',background:'#ffffff'},
 'disney-cruise-line': {file:'disney-cruise-line.png',background:'#ffffff'},
 'hx-expeditions': {file:'hx-expeditions.png',background:'#ffffff'},
 'msc-cruises': {file:'msc-cruises.png',background:'#102953'},
 'oceania-cruises': {file:'oceania-cruises.png',background:'#ffffff'},
 'ponant-explorations': {file:'ponant-explorations.png',background:'#ffffff'},
 'quark-expeditions': {file:'quark-expeditions.png',background:'#ffffff'},
 'regent-seven-seas-cruises': {file:'regent-seven-seas-cruises.png',background:'#ffffff'},
 'riverside-luxury-cruises': {file:'riverside-luxury-cruises.png',background:'#ffffff'},
 'seabourn': {file:'seabourn.png',background:'#ffffff'},
 'silversea-cruises': {file:'silversea-cruises.png',background:'#ffffff'},
 'swan-hellenic': {file:'swan-hellenic.png',background:'#102953'},
 'viking': {file:'viking.png',background:'#ffffff'},
 'virgin-voyages': {file:'virgin-voyages.png',background:'#ffffff'},
};
export function cruiseLineBrand(id:string) {
 return Object.prototype.hasOwnProperty.call(CRUISE_LINE_BRANDS,id)?CRUISE_LINE_BRANDS[id]:undefined;
}
export function cruiseLineInitials(name:string):string {
 return name.split(/[\s-]+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase();
}
export function orderedCruiseLines<T extends {id:string;name:string}>(operators:T[]):T[] {
 const featured=Object.keys(CRUISE_LINE_BRANDS);
 return [...operators].sort((a,b)=>{
  const ai=featured.indexOf(a.id),bi=featured.indexOf(b.id);
  return ai>=0&&bi>=0?ai-bi:ai>=0?-1:bi>=0?1:a.name.localeCompare(b.name);
 });
}
