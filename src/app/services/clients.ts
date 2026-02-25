import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface ClientService {
  id: number; user_id: number; client_name: string; client_contact?: string; client_email?: string;
  service_type: string; description?: string; location?: string; gps_latitude?: number; gps_longitude?: number;
  assigned_to?: number; status: string; priority: string; scheduled_date?: string; completed_date?: string;
  payment_amount?: number; payment_status?: string; expense_proof_required?: number; notes?: string;
  created_at: string; updated_at: string; assigned_to_name?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const clientsService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('client_services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as ClientService[];
  },

  async getById(id: number) {
    const { data, error } = await supabase.from('client_services').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as ClientService;
  },

  async create(p: Partial<ClientService>) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('client_services')
      .insert({ ...p, user_id: userId, status: p.status ?? 'pending', priority: p.priority ?? 'medium' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ClientService;
  },

  async update(id: number, p: Partial<ClientService>) {
    const { data, error } = await supabase
      .from('client_services')
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ClientService;
  },

  async updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from('client_services')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: number) {
    const { error } = await supabase.from('client_services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
