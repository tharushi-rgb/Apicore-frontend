import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

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
    const created = data as ClientService;
    notificationsService.createActionNotification({
      entity: 'Client service',
      event: 'created',
      details: `${created.client_name || 'Client service'} was added.`,
      severity: 'low',
    });
    return created;
  },

  async update(id: number, p: Partial<ClientService>) {
    const { data, error } = await supabase
      .from('client_services')
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const updated = data as ClientService;
    notificationsService.createActionNotification({
      entity: 'Client service',
      event: 'updated',
      details: `${updated.client_name || 'Client service'} was updated.`,
      severity: 'low',
    });
    return updated;
  },

  async updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from('client_services')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Client service',
      event: 'updated',
      details: `Service #${id} status changed to ${status}.`,
      severity: 'low',
    });
  },

  async delete(id: number) {
    const { data: existing } = await supabase.from('client_services').select('client_name').eq('id', id).single();
    const { error } = await supabase.from('client_services').delete().eq('id', id);
    if (error) throw new Error(error.message);
    notificationsService.createActionNotification({
      entity: 'Client service',
      event: 'deleted',
      details: `${existing?.client_name || 'Client service'} was deleted.`,
      severity: 'medium',
    });
  },
};
