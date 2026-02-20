import { api } from './api';

export interface Inspection {
  id: number;
  hive_id: number;
  apiary_id?: number;
  inspection_date: string;
  queen_present: number;
  colony_strength?: string;
  pest_detected: number;
  notes?: string;
  hive_name?: string;
  apiary_name?: string;
  created_at: string;
}

export const inspectionsService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { inspections: Inspection[] } }>('/inspections');
    return res.data.inspections;
  },
  async getByHive(hiveId: number) {
    const res = await api.get<{ success: boolean; data: { inspections: Inspection[] } }>(`/inspections?hiveId=${hiveId}`);
    return res.data.inspections;
  },
  async create(payload: Partial<Inspection>) {
    const res = await api.post<{ success: boolean; data: { inspection: Inspection } }>('/inspections', payload);
    return res.data.inspection;
  },
  async update(id: number, payload: Partial<Inspection>) {
    const res = await api.put<{ success: boolean; data: { inspection: Inspection } }>(`/inspections/${id}`, payload);
    return res.data.inspection;
  },
  async delete(id: number) {
    return api.delete(`/inspections/${id}`);
  },
};
