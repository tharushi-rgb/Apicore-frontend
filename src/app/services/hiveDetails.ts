import { supabase } from './supabaseClient';

export interface Feeding { id: number; hive_id: number; feeding_date: string; feed_type: string; quantity?: number; unit?: string; concentration?: string; notes?: string; created_at: string; }
export const feedingsService = {
  async getByHive(hiveId: number) {
    const { data, error } = await supabase.from('feedings').select('*').eq('hive_id', hiveId).order('feeding_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Feeding[];
  },
  async create(p: Partial<Feeding>) {
    const { data, error } = await supabase.from('feedings').insert(p).select().single();
    if (error) throw new Error(error.message);
    return data as Feeding;
  },
  async update(id: number, p: Partial<Feeding>) {
    const { data, error } = await supabase.from('feedings').update(p).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Feeding;
  },
  async delete(id: number) {
    const { error } = await supabase.from('feedings').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export interface HiveComponent { id: number; hive_id: number; component_type: string; quantity: number; condition: string; installed_date?: string; notes?: string; created_at: string; }
export const componentsService = {
  async getByHive(hiveId: number) {
    const { data, error } = await supabase.from('hive_components').select('*').eq('hive_id', hiveId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as HiveComponent[];
  },
  async create(p: Partial<HiveComponent>) {
    const { data, error } = await supabase.from('hive_components').insert(p).select().single();
    if (error) throw new Error(error.message);
    return data as HiveComponent;
  },
  async update(id: number, p: Partial<HiveComponent>) {
    const { data, error } = await supabase.from('hive_components').update(p).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as HiveComponent;
  },
  async delete(id: number) {
    const { error } = await supabase.from('hive_components').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export interface Queen { id: number; hive_id: number; marking_color?: string; source?: string; introduction_date?: string; status: string; species?: string; notes?: string; created_at: string; }
export const queensService = {
  async getByHive(hiveId: number) {
    const { data, error } = await supabase.from('queens').select('*').eq('hive_id', hiveId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Queen[];
  },
  async create(p: Partial<Queen>) {
    const { data, error } = await supabase.from('queens').insert(p).select().single();
    if (error) throw new Error(error.message);
    return data as Queen;
  },
  async update(id: number, p: Partial<Queen>) {
    const { data, error } = await supabase.from('queens').update(p).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Queen;
  },
  async delete(id: number) {
    const { error } = await supabase.from('queens').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export interface Treatment { id: number; hive_id: number; treatment_date: string; treatment_type: string; product_name?: string; dosage?: string; application_method?: string; duration_days?: number; end_date?: string; outcome?: string; notes?: string; created_at: string; }
export const treatmentsService = {
  async getByHive(hiveId: number) {
    const { data, error } = await supabase.from('treatments').select('*').eq('hive_id', hiveId).order('treatment_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Treatment[];
  },
  async create(p: Partial<Treatment>) {
    const { data, error } = await supabase.from('treatments').insert(p).select().single();
    if (error) throw new Error(error.message);
    return data as Treatment;
  },
  async update(id: number, p: Partial<Treatment>) {
    const { data, error } = await supabase.from('treatments').update(p).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Treatment;
  },
  async delete(id: number) {
    const { error } = await supabase.from('treatments').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
