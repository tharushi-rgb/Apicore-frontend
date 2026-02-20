import { api } from './api';

export interface ClientService {
  id: number; user_id: number; client_name: string; client_contact?: string; client_email?: string;
  service_type: string; description?: string; location?: string; gps_latitude?: number; gps_longitude?: number;
  assigned_to?: number; status: string; priority: string; scheduled_date?: string; completed_date?: string;
  payment_amount?: number; payment_status?: string; expense_proof_required?: number; notes?: string;
  created_at: string; updated_at: string; assigned_to_name?: string;
}

export const clientsService = {
  async getAll() { return (await api.get<{ success: boolean; data: { services: ClientService[] } }>('/clients')).data.services; },
  async getById(id: number) { return (await api.get<{ success: boolean; data: { service: ClientService } }>(`/clients/${id}`)).data.service; },
  async create(p: Partial<ClientService>) { return (await api.post<{ success: boolean; data: { service: ClientService } }>('/clients', p)).data.service; },
  async update(id: number, p: Partial<ClientService>) { return (await api.put<{ success: boolean; data: { service: ClientService } }>(`/clients/${id}`, p)).data.service; },
  async updateStatus(id: number, status: string) { return api.patch(`/clients/${id}/status`, { status }); },
  async delete(id: number) { return api.delete(`/clients/${id}`); },
};
