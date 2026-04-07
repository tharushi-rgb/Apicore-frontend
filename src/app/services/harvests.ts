import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

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
      // Use proper JOIN queries now that foreign keys are set up
      const { data, error } = await supabase
        .from('harvests')
        .select('*, hives(name, apiary_id, apiaries(name))')
        .eq('user_id', userId)
        .order('harvest_date', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((h: any) => ({
        ...h,
        hive_name: h.hives?.name,
        apiary_name: h.hives?.apiaries?.name || (h.apiary_id ? 'Unknown Apiary' : undefined),
        hives: undefined,
        apiaries: undefined,
      })) as Harvest[];
    } catch (err) {
      console.error('Harvests getAll error:', err);
      // Fallback to manual queries if JOINs fail
      return this.getAllFallback();
    }
  },

  // Fallback method using separate queries for compatibility
  async getAllFallback(): Promise<Harvest[]> {
    const userId = getUserId();
    try {
      // Use separate queries since foreign key relationships might be broken
      const [
        { data: harvestData, error: harvestError },
        { data: hivesData, error: hivesError },
        { data: apiariesData, error: apiariesError },
      ] = await Promise.all([
        supabase
          .from('harvests')
          .select('*')
          .eq('user_id', userId)
          .order('harvest_date', { ascending: false }),
        supabase
          .from('hives')
          .select('id, name, apiary_id')
          .eq('user_id', userId),
        supabase
          .from('apiaries')
          .select('id, name')
          .eq('user_id', userId),
      ]);

      if (harvestError) throw new Error(harvestError.message);

      // Create lookup maps for manual joins
      const hiveLookup = new Map<number, { name: string; apiary_id?: number }>();
      (hivesData || []).forEach((hive: any) => {
        hiveLookup.set(hive.id, { name: hive.name, apiary_id: hive.apiary_id });
      });

      const apiaryLookup = new Map<number, string>();
      (apiariesData || []).forEach((apiary: any) => {
        apiaryLookup.set(apiary.id, apiary.name);
      });

      return (harvestData ?? []).map((h: any) => {
        let hive_name = undefined;
        let apiary_name = undefined;

        // Get hive name if hive_id exists
        if (h.hive_id) {
          const hiveInfo = hiveLookup.get(h.hive_id);
          hive_name = hiveInfo?.name;

          // Get apiary name through hive's apiary_id if no direct apiary_id
          if (!h.apiary_id && hiveInfo?.apiary_id) {
            apiary_name = apiaryLookup.get(hiveInfo.apiary_id);
          }
        }

        // Get apiary name directly if apiary_id exists
        if (h.apiary_id) {
          apiary_name = apiaryLookup.get(h.apiary_id);
        }

        return {
          ...h,
          hive_name,
          apiary_name,
        } as Harvest;
      });
    } catch (err) {
      console.error('Harvests getAllFallback error:', err);
      return [];
    }
  },

  async getByHive(hiveId: number): Promise<Harvest[]> {
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .eq('hive_id', hiveId)
        .order('harvest_date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Harvest[];
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
    const created = data as Harvest;
    notificationsService.createActionNotification({
      entity: 'Harvest',
      event: 'created',
      details: 'Harvest entry was recorded.',
      severity: 'low',
    });
    return created;
  },

  async update(id: number, payload: Partial<Harvest>): Promise<Harvest> {
    const { data, error } = await supabase
      .from('harvests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const updated = data as Harvest;
    notificationsService.createActionNotification({
      entity: 'Harvest',
      event: 'updated',
      details: 'Harvest entry was updated.',
      severity: 'low',
    });
    return updated;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('harvests').delete().eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Harvest',
      event: 'deleted',
      details: `Harvest #${id} was removed.`,
      severity: 'medium',
    });
  },
};
