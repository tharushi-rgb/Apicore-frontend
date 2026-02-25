import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Inspection {
  id: number;
  hive_id: number;
  apiary_id?: number;
  inspection_date: string;
  queen_present: number;
  colony_strength?: string;
  pest_detected: number;
  notes?: string;
  hive_name?: string;
  apiary_name?: string;
  created_at: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const inspectionsService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('inspections')
      .select('*, hives(name, apiaries(name))')
      .eq('user_id', userId)
      .order('inspection_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((i: any) => ({
      ...i,
      hive_name: i.hives?.name,
      apiary_name: i.hives?.apiaries?.name,
      hives: undefined,
    })) as Inspection[];
  },

  async getByHive(hiveId: number) {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('hive_id', hiveId)
      .order('inspection_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Inspection[];
  },

  async create(payload: Partial<Inspection>) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('inspections')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Inspection;
  },

  async update(id: number, payload: Partial<Inspection>) {
    const { data, error } = await supabase
      .from('inspections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Inspection;
  },

  async delete(id: number) {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
