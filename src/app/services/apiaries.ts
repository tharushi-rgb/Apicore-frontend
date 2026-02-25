import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Apiary {
  id: number;
  user_id: number;
  name: string;
  district: string;
  area?: string;
  established_date?: string;
  status: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
  hive_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ApiaryPayload {
  name: string;
  district: string;
  area?: string;
  established_date?: string;
  status?: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const apiariesService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    // Attach hive counts
    const apiaries = data as Apiary[];
    const { data: hiveCounts } = await supabase
      .from('hives')
      .select('apiary_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (hiveCounts) {
      const countMap: Record<number, number> = {};
      hiveCounts.forEach((h: { apiary_id: number | null }) => {
        if (h.apiary_id) countMap[h.apiary_id] = (countMap[h.apiary_id] ?? 0) + 1;
      });
      apiaries.forEach(a => { a.hive_count = countMap[a.id] ?? 0; });
    }
    return apiaries;
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Apiary;
  },

  async create(payload: ApiaryPayload) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('apiaries')
      .insert({ ...payload, user_id: userId, status: payload.status ?? 'active' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Apiary;
  },

  async update(id: number, payload: Partial<ApiaryPayload>) {
    const { data, error } = await supabase
      .from('apiaries')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Apiary;
  },

  async delete(id: number) {
    const { error } = await supabase.from('apiaries').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getHistory(id: number) {
    const { data, error } = await supabase
      .from('apiary_history')
      .select('*')
      .eq('apiary_id', id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
