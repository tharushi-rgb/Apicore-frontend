import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

export interface Hive {
  id: number;
  user_id: number;
  apiary_id?: number;
  name: string;
  hive_type: 'box' | 'pot' | 'log' | 'stingless';
  location_type: string;
  status: 'active' | 'queenless' | 'inactive' | 'absconded';
  queen_present: number;
  queen_age?: number;
  queen_age_risk?: string;
  colony_strength?: string;
  last_inspection_date?: string;
  inspection_overdue?: number;
  pest_detected?: number;
  pest_reported_date?: string;
  is_starred?: number;
  is_flagged?: number;
  flag_reason?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
  apiary_name?: string;
  apiary_district?: string;
  created_at: string;
  updated_at: string;
  // Dynamic fields per hive type
  num_frames?: number;
  num_supers?: number;
  brood_box_type?: string;
  pot_material?: string;
  pot_volume_liters?: number;
  entrance_size?: string;
  log_length_cm?: number;
  log_diameter_cm?: number;
  wood_type?: string;
  stingless_species?: string;
  colony_size?: string;
  propolis_type?: string;
}

export interface HivePayload {
  name: string;
  hive_type: string;
  apiary_id?: number;
  location_type?: string;
  status?: string;
  queen_present?: number;
  pest_detected?: number;
  colony_strength?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const hivesService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('hives')
      .select('*, apiaries(name, district)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    // Flatten join
    return (data ?? []).map((h: any) => ({
      ...h,
      apiary_name: h.apiaries?.name,
      apiary_district: h.apiaries?.district,
      apiaries: undefined,
    })) as Hive[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('hives')
      .select('*, apiaries(name, district)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return {
      ...data,
      apiary_name: (data as any).apiaries?.name,
      apiary_district: (data as any).apiaries?.district,
      apiaries: undefined,
    } as Hive;
  },

  async create(payload: HivePayload) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('hives')
      .insert({ ...payload, user_id: userId, status: payload.status ?? 'active' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const created = data as Hive;
    notificationsService.createActionNotification({
      entity: 'Hive',
      event: 'created',
      details: `${created.name || 'Hive'} was added.`,
      severity: 'low',
    });
    return created;
  },

  async update(id: number, payload: Partial<HivePayload>) {
    const { data, error } = await supabase
      .from('hives')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const updated = data as Hive;
    notificationsService.createActionNotification({
      entity: 'Hive',
      event: 'updated',
      details: `${updated.name || 'Hive'} was updated.`,
      severity: 'low',
    });
    return updated;
  },

  async delete(id: number) {
    const { data: existing } = await supabase.from('hives').select('name').eq('id', id).single();
    const { error } = await supabase.from('hives').delete().eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Hive',
      event: 'deleted',
      details: `${existing?.name || 'Hive'} was deleted.`,
      severity: 'medium',
    });
  },

  async moveToApiary(id: number, targetApiaryId: number) {
    const { error } = await supabase
      .from('hives')
      .update({ apiary_id: targetApiaryId, location_type: 'ground', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Hive',
      event: 'moved',
      details: `Hive moved to apiary #${targetApiaryId}.`,
      severity: 'low',
    });
  },

  async toggleStar(id: number) {
    const { data: hive } = await supabase.from('hives').select('is_starred').eq('id', id).single();
    const { error } = await supabase
      .from('hives')
      .update({ is_starred: hive?.is_starred ? 0 : 1, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async toggleFlag(id: number, reason?: string) {
    const { data: hive } = await supabase.from('hives').select('is_flagged').eq('id', id).single();
    const { error } = await supabase
      .from('hives')
      .update({ is_flagged: hive?.is_flagged ? 0 : 1, flag_reason: reason ?? null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Lock operations are no-ops in the Supabase-only version (no concurrent multi-user editing)
  async acquireLock(_id: number) { return { locked: false, lockedBy: 0 }; },
  async releaseLock(_id: number) { return; },
  async checkLock(_id: number) { return { locked: false }; },
};
