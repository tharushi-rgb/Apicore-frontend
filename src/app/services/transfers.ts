import { api } from './api';

export interface ColonyTransfer {
  id: number; source_hive_id: number; target_hive_id: number; transfer_date: string;
  transfer_type: string; queen_moved: number; brood_frames_moved: number; notes?: string; created_at: string;
  source_hive_name?: string; target_hive_name?: string;
}

export const transfersService = {
  async getAll(hiveId?: number) { return (await api.get<{ success: boolean; data: { transfers: ColonyTransfer[] } }>(`/transfers${hiveId ? `?hiveId=${hiveId}` : ''}`)).data.transfers; },
  async create(p: { source_hive_id: number; target_hive_id: number; transfer_date: string; transferType?: string; queenMoved?: boolean; broodFramesMoved?: number; notes?: string }) {
    return api.post('/transfers', p);
  },
};
