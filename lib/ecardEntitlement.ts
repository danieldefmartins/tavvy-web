import { supabase } from './supabaseClient';
export interface ECardEntitlement { is_pro: boolean; is_super_admin: boolean; ecard_active: boolean; plan_type: string | null; status: string; current_period_end: string | null }
export async function fetchMyECardEntitlement(): Promise<ECardEntitlement> {
  const { data, error } = await supabase.rpc('get_my_ecard_entitlement');
  if (error || !data || typeof data.is_pro !== 'boolean') throw new Error('Your plan could not be verified. Please try again.');
  return data as ECardEntitlement;
}
