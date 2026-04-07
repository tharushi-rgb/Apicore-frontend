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
  avatar_url?: string;
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
    const avatarKey = `profile_avatar_${userId}`;
    const avatarUrl = localStorage.getItem(avatarKey) || (data as Profile).avatar_url || undefined;
    if (avatarUrl) {
      localStorage.setItem(avatarKey, avatarUrl);
    }
    return { user: { ...(data as Profile), avatar_url: avatarUrl }, stats: {} };
  },

  async update(p: Partial<Profile>) {
    const userId = getUserId();
    const nextPayload = { ...p };
    const current = authService.getLocalUser();
    const avatarKey = `profile_avatar_${userId}`;
    const avatarUrl = (nextPayload as Profile).avatar_url;

    // Email updates are handled via Supabase Auth. Keep users-table update independent.
    if (typeof nextPayload.email === 'string' && nextPayload.email.trim() && current?.email !== nextPayload.email.trim()) {
      const { error: emailError } = await supabase.auth.updateUser({ email: nextPayload.email.trim() });
      if (emailError) throw new Error(emailError.message);
    }

    delete (nextPayload as any).email;

    // Remove fields that don't exist in the database schema
    delete (nextPayload as any).province;
    delete (nextPayload as any).ds_division;
    delete (nextPayload as any).avatar_url; // Handle avatar separately

    const { data, error } = await supabase
      .from('users')
      .update({ ...nextPayload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      if (
        avatarUrl &&
        (error.message.includes('avatar') || error.message.includes('schema cache') || error.message.includes('Could not find') || error.message.includes('column'))
      ) {
        localStorage.setItem(avatarKey, avatarUrl);
        return { ...(current as unknown as Profile), avatar_url: avatarUrl } as Profile;
      }
      throw new Error(error.message);
    }
    // Refresh local storage
    if (current) {
      const merged = {
        ...current,
        ...data,
        email: (typeof p.email === 'string' && p.email.trim()) ? p.email.trim() : (data as any).email ?? current.email,
        avatar_url: (data as any).avatar_url ?? avatarUrl ?? (current as any).avatar_url,
        // Keep non-db fields in local storage for display purposes
        province: p.province ?? (current as any).province,
        ds_division: p.ds_division ?? (current as any).ds_division,
      };
      localStorage.setItem('user', JSON.stringify(merged));
    }

    if (avatarUrl) {
      localStorage.setItem(avatarKey, avatarUrl);
    }

    notificationsService.createActionNotification({
      entity: 'Profile',
      event: 'updated',
      details: 'Your profile details were saved successfully.',
      severity: 'low',
    });

    // Return the merged data including non-db fields
    return {
      ...data,
      avatar_url: avatarUrl ?? (data as any)?.avatar_url ?? (current as any)?.avatar_url,
      province: p.province ?? (current as any)?.province,
      ds_division: p.ds_division ?? (current as any)?.ds_division,
    } as Profile;
  },

  async changePassword(_currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
};
