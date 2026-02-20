import { api } from './api';

export interface Feeding { id: number; hive_id: number; feeding_date: string; feed_type: string; quantity?: number; unit?: string; concentration?: string; notes?: string; created_at: string; }
export const feedingsService = {
  async getByHive(hiveId: number) { return (await api.get<{ success: boolean; data: { feedings: Feeding[] } }>(`/feedings?hiveId=${hiveId}`)).data.feedings; },
  async create(p: Partial<Feeding>) { return (await api.post<{ success: boolean; data: { feeding: Feeding } }>('/feedings', p)).data.feeding; },
  async update(id: number, p: Partial<Feeding>) { return (await api.put<{ success: boolean; data: { feeding: Feeding } }>(`/feedings/${id}`, p)).data.feeding; },
  async delete(id: number) { return api.delete(`/feedings/${id}`); },
};

export interface HiveComponent { id: number; hive_id: number; component_type: string; quantity: number; condition: string; installed_date?: string; notes?: string; created_at: string; }
export const componentsService = {
  async getByHive(hiveId: number) { return (await api.get<{ success: boolean; data: { components: HiveComponent[] } }>(`/components?hiveId=${hiveId}`)).data.components; },
  async create(p: Partial<HiveComponent>) { return (await api.post<{ success: boolean; data: { component: HiveComponent } }>('/components', p)).data.component; },
  async update(id: number, p: Partial<HiveComponent>) { return (await api.put<{ success: boolean; data: { component: HiveComponent } }>(`/components/${id}`, p)).data.component; },
  async delete(id: number) { return api.delete(`/components/${id}`); },
};

export interface Queen { id: number; hive_id: number; marking_color?: string; source?: string; introduction_date?: string; status: string; species?: string; notes?: string; created_at: string; }
export const queensService = {
  async getByHive(hiveId: number) { return (await api.get<{ success: boolean; data: { queens: Queen[] } }>(`/queens?hiveId=${hiveId}`)).data.queens; },
  async create(p: Partial<Queen>) { return (await api.post<{ success: boolean; data: { queen: Queen } }>('/queens', p)).data.queen; },
  async update(id: number, p: Partial<Queen>) { return (await api.put<{ success: boolean; data: { queen: Queen } }>(`/queens/${id}`, p)).data.queen; },
  async delete(id: number) { return api.delete(`/queens/${id}`); },
};

export interface Treatment { id: number; hive_id: number; treatment_date: string; treatment_type: string; product_name?: string; dosage?: string; application_method?: string; duration_days?: number; end_date?: string; outcome?: string; notes?: string; created_at: string; }
export const treatmentsService = {
  async getByHive(hiveId: number) { return (await api.get<{ success: boolean; data: { treatments: Treatment[] } }>(`/treatments?hiveId=${hiveId}`)).data.treatments; },
  async create(p: Partial<Treatment>) { return (await api.post<{ success: boolean; data: { treatment: Treatment } }>('/treatments', p)).data.treatment; },
  async update(id: number, p: Partial<Treatment>) { return (await api.put<{ success: boolean; data: { treatment: Treatment } }>(`/treatments/${id}`, p)).data.treatment; },
  async delete(id: number) { return api.delete(`/treatments/${id}`); },
};
