import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Harvest {
  id: number;
  user_id?: number;
  hive_id?: number;
  apiary_id?: number;
  harvest_date: string;
  harvest_type: string;
  quantity: number;
  unit: string;
  quality?: string;
  harvest_method?: string;
  surplus_listed?: number;
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

export const harvestsService = {
  async getAll(): Promise<Harvest[]> {
    const userId = getUserId();
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*, hives(name), apiaries(name)')
        .eq('user_id', userId)
        .order('harvest_date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((h: any) => ({
        ...h,
        hive_name: h.hives?.name,
        apiary_name: h.apiaries?.name,
        hives: undefined,
        apiaries: undefined,
      })) as Harvest[];
    } catch {
      // Table may not exist yet, return empty
      return [];
    }
  },

  async create(payload: Partial<Harvest>): Promise<Harvest> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('harvests')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Harvest;
  },

  async update(id: number, payload: Partial<Harvest>): Promise<Harvest> {
    const { data, error } = await supabase
      .from('harvests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Harvest;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('harvests').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
