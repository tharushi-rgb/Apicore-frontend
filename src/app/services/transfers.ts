import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

export interface ColonyTransfer {
  id: number; source_hive_id: number; target_hive_id: number; transfer_date: string;
  transfer_type: string; queen_moved: number; brood_frames_moved: number; notes?: string; created_at: string;
  source_hive_name?: string; target_hive_name?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const transfersService = {
  async getAll(hiveId?: number) {
    const userId = getUserId();
    let query = supabase
      .from('colony_transfers')
      .select('*')
      .eq('user_id', userId)
      .order('transfer_date', { ascending: false });
    if (hiveId) query = query.or(`source_hive_id.eq.${hiveId},target_hive_id.eq.${hiveId}`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as ColonyTransfer[];
  },

  async create(p: {
    source_hive_id: number; target_hive_id: number; transfer_date: string;
    transferType?: string; queenMoved?: boolean; broodFramesMoved?: number; notes?: string;
  }) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('colony_transfers')
      .insert({
        user_id: userId,
        source_hive_id: p.source_hive_id,
        target_hive_id: p.target_hive_id,
        transfer_date: p.transfer_date,
        transfer_type: p.transferType ?? 'split',
        queen_moved: p.queenMoved ? 1 : 0,
        brood_frames_moved: p.broodFramesMoved ?? 0,
        notes: p.notes,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Colony transfer',
      event: 'completed',
      details: `Transfer from hive #${p.source_hive_id} to hive #${p.target_hive_id} was recorded.`,
      severity: 'low',
    });
    return data as ColonyTransfer;
  },
};
