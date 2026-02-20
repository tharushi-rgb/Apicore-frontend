import { api } from './api';

export interface Apiary {
  id: number;
  user_id: number;
  name: string;
  district: string;
  area?: string;
  established_date?: string;
  status: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
  hive_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ApiaryPayload {
  name: string;
  district: string;
  area?: string;
  established_date?: string;
  status?: string;
  apiary_type?: string;
  terrain?: string;
  forage_primary?: string;
  blooming_window?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  notes?: string;
}

export const apiariesService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { apiaries: Apiary[] } }>('/apiaries');
    return res.data.apiaries;
  },
  async getById(id: number) {
    const res = await api.get<{ success: boolean; data: { apiary: Apiary } }>(`/apiaries/${id}`);
    return res.data.apiary;
  },
  async create(payload: ApiaryPayload) {
    const res = await api.post<{ success: boolean; data: { apiary: Apiary } }>('/apiaries', payload);
    return res.data.apiary;
  },
  async update(id: number, payload: Partial<ApiaryPayload>) {
    const res = await api.put<{ success: boolean; data: { apiary: Apiary } }>(`/apiaries/${id}`, payload);
    return res.data.apiary;
  },
  async delete(id: number) {
    return api.delete(`/apiaries/${id}`);
  },
  async getHistory(id: number) {
    const res = await api.get<{ success: boolean; data: { history: any[] } }>(`/apiaries/${id}/history`);
    return res.data.history;
  },
};
