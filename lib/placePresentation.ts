/** Display a reported visit date without shifting its calendar day across timezones. */
export function reviewDateLabel(value?: string | null, dateSource?: string): string {
  if (!value) return 'Date unavailable';
  const isCalendarDate = dateSource === 'reported' || /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isCalendarDate ? `${value.slice(0,10)}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric', ...(isCalendarDate ? {timeZone:'UTC'} : {}) });
}

export const DIETARY_FILTERS = [{key:'nut_free',label:'Nut-free'},{key:'gluten_free',label:'Gluten-free'},{key:'dairy_free',label:'Dairy-free'},{key:'vegan',label:'Vegan'},{key:'vegetarian',label:'Vegetarian'}] as const;
export type DietaryFilter = typeof DIETARY_FILTERS[number]['key'];
export function dietaryMatch(tags: string[] | null | undefined, filters: readonly string[]): 'match' | 'unknown' | 'different' {
  if (!filters.length) return 'match';
  const known = (tags||[]).map(t=>t.toLowerCase().replace(/-/g,'_'));
  const opposites:Record<string,string[]>={nut_free:['contains_nuts'],gluten_free:['contains_gluten'],dairy_free:['contains_dairy'],vegan:['contains_dairy','contains_egg','contains_meat','contains_fish'],vegetarian:['contains_meat','contains_fish']};
  if(filters.some(f=>(opposites[f]||[]).some(tag=>known.includes(tag))))return 'different';
  return filters.every(f=>known.includes(f)||(f==='gluten_free'&&known.includes('gf'))||(f==='vegetarian'&&known.includes('vegan'))) ? 'match' : 'unknown';
}
