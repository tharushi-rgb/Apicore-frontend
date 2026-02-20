import { api } from './api';

export interface Profile { id: number; name: string; email: string; phone?: string; district?: string; role: string; years_experience?: number; }

export const profileService = {
  async get() { return (await api.get<{ success: boolean; data: { user: Profile; stats: any } }>('/profile')).data; },
  async update(p: Partial<Profile>) { return (await api.put<{ success: boolean; data: { user: Profile } }>('/profile', p)).data.user; },
  async changePassword(currentPassword: string, newPassword: string) { return api.put('/profile/password', { currentPassword, newPassword }); },
};
