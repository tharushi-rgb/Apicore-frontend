import { supabase } from './supabaseClient';
import { authService } from './auth';
import { notificationsService } from './notifications';

export interface Profile {
  id: number; name: string; email: string; phone?: string; district?: string; role: string;
  province?: string;
  ds_division?: string;
  years_experience?: number; nic_number?: string; age_group?: string; blood_group?: string;
  beekeeping_nature?: string; primary_bee_species?: string; nvq_level?: string;
  business_reg_no?: string;
  created_at?: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const profileService = {
  async get() {
    const userId = getUserId();
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return { user: data as Profile, stats: {} };
  },

  async update(p: Partial<Profile>) {
    const userId = getUserId();
    const nextPayload = { ...p };
    const current = authService.getLocalUser();

    // Email updates are handled via Supabase Auth. Keep users-table update independent.
    if (typeof nextPayload.email === 'string' && nextPayload.email.trim() && current?.email !== nextPayload.email.trim()) {
      const { error: emailError } = await supabase.auth.updateUser({ email: nextPayload.email.trim() });
      if (emailError) throw new Error(emailError.message);
    }

    delete (nextPayload as any).email;

    const { data, error } = await supabase
      .from('users')
      .update({ ...nextPayload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Refresh local storage
    if (current) {
      const merged = {
        ...current,
        ...data,
        email: (typeof p.email === 'string' && p.email.trim()) ? p.email.trim() : (data as any).email ?? current.email,
      };
      localStorage.setItem('user', JSON.stringify(merged));
    }

    notificationsService.createActionNotification({
      entity: 'Profile',
      event: 'updated',
      details: 'Your profile details were saved successfully.',
      severity: 'low',
    });

    return data as Profile;
  },

  async changePassword(_currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
};
