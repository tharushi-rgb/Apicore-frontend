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

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isLikelyNetworkFetchError(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return false;
  const msg = error.message.toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function inspectionsLikelyMatch(candidate: Inspection, payload: Partial<Inspection>) {
  const matchString = (field: keyof Inspection) => {
    const expected = normalizeString((payload as any)[field]);
    if (!expected) return true;
    return normalizeString((candidate as any)[field]) === expected;
  };

  const matchNumber = (field: keyof Inspection) => {
    const expected = (payload as any)[field];
    if (typeof expected !== 'number') return true;
    return (candidate as any)[field] === expected;
  };

  const matchArray = (field: keyof Inspection) => {
    const expected = (payload as any)[field];
    if (!Array.isArray(expected) || expected.length === 0) return true;
    const actual = (candidate as any)[field];
    if (!Array.isArray(actual)) return false;
    if (actual.length !== expected.length) return false;
    return actual.every((value: any, idx: number) => value === expected[idx]);
  };

  return (
    matchString('inspection_date') &&
    matchString('queen_presence') &&
    matchString('honey_pollen_stores') &&
    matchString('pest_treatment_status') &&
    matchString('pest_name') &&
    matchString('treatment_used') &&
    matchString('general_remarks') &&
    matchNumber('active_frame_count') &&
    matchArray('pest_disease_presence')
  );
}

async function findRecentlyCreatedInspectionForPayload(
  payload: Partial<Inspection> & { hive_id: number; user_id: number; inspection_date: string }
): Promise<{ status: 'found'; inspection: Inspection } | { status: 'none' } | { status: 'ambiguous' }> {
  const createdSince = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('hive_id', payload.hive_id)
    .eq('user_id', payload.user_id)
    .eq('inspection_date', payload.inspection_date)
    .gte('created_at', createdSince)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);

  const rows = (data || []) as Inspection[];
  if (rows.length === 0) return { status: 'none' };

  for (const row of rows) {
    if (inspectionsLikelyMatch(row, payload)) return { status: 'found', inspection: row };
  }

  if (rows.length === 1) return { status: 'found', inspection: rows[0] };

  return { status: 'ambiguous' };
}

export const inspectionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('inspection_date', { ascending: false });

    if (error) throw new Error(error.message);

    return data as Inspection[];
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
    const insertPayload = { ...payload, user_id: userId } as Partial<Inspection> & { user_id: number };

    const attemptInsert = async () => {
      const { data, error } = await supabase
        .from('inspections')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Inspection;
    };

    try {
      const created = await attemptInsert();
      notificationsService.createActionNotification({
        entity: 'Inspection',
        event: 'created',
        details: 'Inspection record was added.',
        severity: 'low',
      });
      return created;
    } catch (error) {
      if (!isLikelyNetworkFetchError(error)) throw error;

      // Network errors can happen after the insert was committed but before the response returned.
      // Try to detect a recently created matching row to avoid duplicates.
      const hiveId = insertPayload.hive_id;
      const inspectionDate = normalizeString(insertPayload.inspection_date);

      if (typeof hiveId === 'number' && Number.isFinite(hiveId) && inspectionDate) {
        await sleep(450);

        let lookup:
          | { status: 'found'; inspection: Inspection }
          | { status: 'none' }
          | { status: 'ambiguous' };

        try {
          lookup = await findRecentlyCreatedInspectionForPayload({
            ...(insertPayload as any),
            hive_id: hiveId,
            user_id: userId,
            inspection_date: inspectionDate,
          });
        } catch (verifyError) {
          console.warn('Unable to verify inspection creation after network failure:', verifyError);
          throw new Error(
            'Network issue while saving inspection. Please refresh and check if the inspection was saved before trying again.'
          );
        }

        if (lookup.status === 'found') {
          notificationsService.createActionNotification({
            entity: 'Inspection',
            event: 'created',
            details: 'Inspection record was added.',
            severity: 'low',
          });
          return lookup.inspection;
        }

        if (lookup.status === 'ambiguous') {
          throw new Error(
            'Network issue while saving inspection. Please refresh and check if the inspection was saved before trying again.'
          );
        }

        // Verified: no recently created row. Safe to retry once.
        try {
          const created = await attemptInsert();
          notificationsService.createActionNotification({
            entity: 'Inspection',
            event: 'created',
            details: 'Inspection record was added.',
            severity: 'low',
          });
          return created;
        } catch (retryError) {
          if (isLikelyNetworkFetchError(retryError)) {
            throw new Error(
              'Network issue while saving inspection. Please refresh and check if the inspection was saved before trying again.'
            );
          }
          throw retryError;
        }
      }

      throw new Error(
        'Network issue while saving inspection. Please refresh and check if the inspection was saved before trying again.'
      );
    }
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
