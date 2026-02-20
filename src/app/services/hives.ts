import { api } from './api';

export interface Hive {
  id: number;
  user_id: number;
  apiary_id?: number;
  name: string;
  hive_type: 'box' | 'pot' | 'log' | 'stingless';
  location_type: 'apiary-linked' | 'standalone';
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
}

export interface HivePayload {
  name: string;
  hive_type: string;
  apiary_id?: number;
  location_type?: string;
  status?: string;
  queen_present?: number;
  colony_strength?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
}

export const hivesService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { hives: Hive[] } }>('/hives');
    return res.data.hives;
  },
  async getById(id: number) {
    const res = await api.get<{ success: boolean; data: { hive: Hive } }>(`/hives/${id}`);
    return res.data.hive;
  },
  async create(payload: HivePayload) {
    const res = await api.post<{ success: boolean; data: { hive: Hive } }>('/hives', payload);
    return res.data.hive;
  },
  async update(id: number, payload: Partial<HivePayload>) {
    const res = await api.put<{ success: boolean; data: { hive: Hive } }>(`/hives/${id}`, payload);
    return res.data.hive;
  },
  async delete(id: number) {
    return api.delete(`/hives/${id}`);
  },
  async moveToApiary(id: number, targetApiaryId: number) {
    return api.patch(`/hives/${id}/move`, { target_apiary_id: targetApiaryId });
  },
  async toggleStar(id: number) {
    return api.patch(`/hives/${id}/star`, {});
  },
  async toggleFlag(id: number, reason?: string) {
    return api.patch(`/hives/${id}/flag`, { flag_reason: reason });
  },
};
