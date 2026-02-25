import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Profile {
  id: number; name: string; email: string; phone?: string; district?: string; role: string;
  years_experience?: number; nic_number?: string; age_group?: string; blood_group?: string;
  beekeeping_nature?: string; primary_bee_species?: string; nvq_level?: string;
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
    const { data, error } = await supabase
      .from('users')
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Refresh local storage
    const current = authService.getLocalUser();
    if (current) localStorage.setItem('user', JSON.stringify({ ...current, ...data }));
    return data as Profile;
  },

  async changePassword(_currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
};
