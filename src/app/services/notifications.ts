import { api } from './api';

export interface Notification {
  id: number; user_id: number; target_role: string; notification_type: string; severity: string;
  title: string; message: string; related_type?: string; related_id?: number;
  is_read: number; is_dismissed: number; created_at: string;
}

export const notificationsService = {
  async getAll(unreadOnly = false) { return (await api.get<{ success: boolean; data: { notifications: Notification[] } }>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`)).data.notifications; },
  async markAsRead(id: number) { return api.patch(`/notifications/${id}/read`, {}); },
  async markAllRead() { return api.patch('/notifications/read-all', {}); },
  async dismiss(id: number) { return api.patch(`/notifications/${id}/dismiss`, {}); },
  async clearOld() { return api.delete('/notifications/clear'); },
};
