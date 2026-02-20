import { api } from './api';

export interface Harvest {
  id: number;
  hive_id?: number;
  apiary_id?: number;
  harvest_date: string;
  harvest_type: string;
  quantity: number;
  unit: string;
  quality?: string;
  notes?: string;
  hive_name?: string;
  apiary_name?: string;
  created_at: string;
}

export const harvestsService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { harvests: Harvest[] } }>('/harvests');
    return res.data.harvests;
  },
  async create(payload: Partial<Harvest>) {
    const res = await api.post<{ success: boolean; data: { harvest: Harvest } }>('/harvests', payload);
    return res.data.harvest;
  },
  async update(id: number, payload: Partial<Harvest>) {
    const res = await api.put<{ success: boolean; data: { harvest: Harvest } }>(`/harvests/${id}`, payload);
    return res.data.harvest;
  },
  async delete(id: number) {
    return api.delete(`/harvests/${id}`);
  },
};
