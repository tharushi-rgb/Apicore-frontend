import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

export interface Inspection {
  id: number;
  hive_id: number;
  apiary_id?: number;
  user_id?: number;
  inspection_date: string;
  // Modern Hive Inspection Fields (Table 1)
  queen_presence?: 'seen' | 'fresh_eggs' | 'not_seen';
  honey_pollen_stores?: 'low' | 'sufficient' | 'high';
  pest_disease_presence?: string[];
  pest_name?: string;
  pest_treatment_status?: 'clear' | 'pest_detected' | 'under_treatment';
  treatment_used?: string;
  active_frame_count?: number;
  queen_cell_presence?: 'yes' | 'no' | null;
  bottom_board_cleaned?: 'yes' | 'no' | null;
  general_remarks?: string;
  // Legacy fields
  queen_present?: number;
  colony_strength?: string;
  pest_detected?: number;
  notes?: string;
  // Relations
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
    const created = data as Inspection;
    notificationsService.createActionNotification({
      entity: 'Inspection',
      event: 'created',
      details: 'Inspection record was added.',
      severity: 'low',
    });
    return created;
  },

  async update(id: number, payload: Partial<Inspection>) {
    const { data, error } = await supabase
      .from('inspections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const updated = data as Inspection;
    notificationsService.createActionNotification({
      entity: 'Inspection',
      event: 'updated',
      details: 'Inspection record was updated.',
      severity: 'low',
    });
    return updated;
  },

  async delete(id: number) {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Inspection',
      event: 'deleted',
      details: `Inspection #${id} was deleted.`,
      severity: 'medium',
    });
  },
};
