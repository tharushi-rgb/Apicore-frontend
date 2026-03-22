import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

export interface PotHiveInspection {
  id: number;
  hive_id: number;
  user_id?: number;
  apiary_id?: number;
  inspection_date: string;
  entrance_activity: 'low' | 'medium' | 'high';
  queen_presence: 'seen' | 'fresh_eggs' | 'not_seen';
  honey_pollen_stores: 'low' | 'sufficient' | 'high';
  pest_disease_presence?: string[];
  pest_names?: string;
  treatment_status?: 'clear' | 'pest_detected' | 'under_treatment';
  treatment_used?: string;
  general_remarks?: string;
  // Relations
  hive_name?: string;
  apiary_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PotHiveInspectionPayload {
  hive_id: number;
  apiary_id?: number;
  inspection_date: string;
  entrance_activity: 'low' | 'medium' | 'high';
  queen_presence: 'seen' | 'fresh_eggs' | 'not_seen';
  honey_pollen_stores: 'low' | 'sufficient' | 'high';
  pest_disease_presence?: string[];
  pest_names?: string;
  treatment_status?: 'clear' | 'pest_detected' | 'under_treatment';
  treatment_used?: string;
  general_remarks?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const potHiveInspectionsService = {
  /**
   * Get all pot hive inspections for the current user
   */
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .select('*, hives(name, apiaries(name))')
      .eq('user_id', userId)
      .order('inspection_date', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((inspection: any) => ({
      ...inspection,
      hive_name: inspection.hives?.name,
      apiary_name: inspection.hives?.apiaries?.name,
      hives: undefined,
    })) as PotHiveInspection[];
  },

  /**
   * Get all pot hive inspections for a specific hive
   */
  async getByHive(hiveId: number) {
    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .select('*')
      .eq('hive_id', hiveId)
      .order('inspection_date', { ascending: false });

    if (error) throw new Error(error.message);

    return data as PotHiveInspection[];
  },

  /**
   * Get a specific pot hive inspection by ID
   */
  async getById(id: number) {
    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .select('*, hives(name, apiaries(name))')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      hive_name: (data as any).hives?.name,
      apiary_name: (data as any).hives?.apiaries?.name,
      hives: undefined,
    } as PotHiveInspection;
  },

  /**
   * Create a new pot hive inspection
   */
  async create(payload: PotHiveInspectionPayload) {
    const userId = getUserId();

    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .insert({
        ...payload,
        user_id: userId,
        pest_disease_presence: payload.pest_disease_presence || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const created = data as PotHiveInspection;

    notificationsService.createActionNotification({
      entity: 'Pot Hive Inspection',
      event: 'created',
      details: `Pot hive inspection recorded for hive ID ${payload.hive_id}.`,
      severity: 'low',
    });

    return created;
  },

  /**
   * Update an existing pot hive inspection
   */
  async update(id: number, payload: Partial<PotHiveInspectionPayload>) {
    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const updated = data as PotHiveInspection;

    notificationsService.createActionNotification({
      entity: 'Pot Hive Inspection',
      event: 'updated',
      details: `Pot hive inspection (ID: ${id}) was updated.`,
      severity: 'low',
    });

    return updated;
  },

  /**
   * Delete a pot hive inspection
   */
  async delete(id: number) {
    const { error } = await supabase
      .from('pot_hive_inspections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    notificationsService.createActionNotification({
      entity: 'Pot Hive Inspection',
      event: 'deleted',
      details: `Pot hive inspection (ID: ${id}) was deleted.`,
      severity: 'low',
    });
  },

  /**
   * Get the latest pot hive inspection for a specific hive
   */
  async getLatestForHive(hiveId: number) {
    const { data, error } = await supabase
      .from('pot_hive_inspections')
      .select('*')
      .eq('hive_id', hiveId)
      .order('inspection_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" error
      throw new Error(error.message);
    }

    return (data ?? null) as PotHiveInspection | null;
  },

  /**
   * Get inspection statistics for a hive
   */
  async getStatisticsForHive(hiveId: number) {
    const inspections = await this.getByHive(hiveId);

    const stats = {
      totalInspections: inspections.length,
      lastInspectionDate: inspections[0]?.inspection_date ?? null,
      healthTrend: [] as { date: string; status: string }[],
      pestOccurrences: 0,
    };

    inspections.forEach((insp) => {
      const status = insp.queen_presence === 'seen' ? 'healthy' : 'warning';
      stats.healthTrend.push({ date: insp.inspection_date, status });

      if (insp.pest_disease_presence && insp.pest_disease_presence.length > 0) {
        stats.pestOccurrences++;
      }
    });

    return stats;
  },
};
