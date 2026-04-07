import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Notification {
  id: number; user_id: number; target_role: string; notification_type: string; severity: string;
  title: string; message: string; related_type?: string; related_id?: number;
  is_read: number; is_dismissed: number; created_at: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const notificationsService = {
  async getAll(unreadOnly = false) {
    const userId = getUserId();
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', 0)
      .order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('is_read', 0);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Notification[];
  },

  async markAsRead(id: number) {
    const userId = getUserId();
    const { error } = await supabase.from('notifications').update({ is_read: 1 }).eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  async markAllRead() {
    const userId = getUserId();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: 1 })
      .eq('user_id', userId)
      .eq('is_read', 0);
    if (error) throw new Error(error.message);
  },

  async dismiss(id: number) {
    const userId = getUserId();
    const { error } = await supabase.from('notifications').update({ is_dismissed: 1 }).eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  async clearOld() {
    const userId = getUserId();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoff.toISOString());
    if (error) throw new Error(error.message);
  },

  async create(notification: {
    title: string;
    message: string;
    notification_type?: string;
    severity?: 'low' | 'medium' | 'high';
    related_type?: string;
    related_id?: number;
  }) {
    const userId = getUserId();
    const user = authService.getLocalUser();
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      target_role: user?.role || 'beekeeper',
      notification_type: notification.notification_type || 'general',
      severity: notification.severity || 'medium',
      title: notification.title,
      message: notification.message,
      related_type: notification.related_type || null,
      related_id: notification.related_id || null,
      is_read: 0,
      is_dismissed: 0,
    });
    if (error) throw new Error(error.message);
  },

  async createActionNotification(action: {
    entity: string;
    event: 'created' | 'updated' | 'deleted' | 'completed' | 'moved' | 'rejected' | 'accepted';
    details?: string;
    severity?: 'low' | 'medium' | 'high';
  }) {
    try {
      await this.create({
        title: `${action.entity} ${action.event}`,
        message: action.details || `${action.entity} was ${action.event} successfully.`,
        notification_type: 'general',
        severity: action.severity || 'low',
      });
    } catch {
      // Notifications should never block core CRUD flows.
    }
  },
};
