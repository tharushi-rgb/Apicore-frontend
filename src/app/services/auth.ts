import { supabase } from './supabaseClient';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  nic_number?: string;
  district?: string;
  preferred_language?: string;
  age_group?: string;
  known_bee_allergy?: string;
  blood_group?: string;
  beekeeping_nature?: string;
  business_reg_no?: string;
  primary_bee_species?: string;
  nvq_level?: string;
  role: string;
  years_experience?: number;
}

function storeUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export const authService = {
  async register(payload: Record<string, unknown>) {
    const email = payload.email as string;
    const password = payload.password as string;

    // 1. Create Supabase Auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw new Error(authError.message);

    // 2. Insert profile row in custom users table.
    // We build the insert in two passes:
    //   - First with ALL fields (new schema has all columns)
    //   - If that fails due to missing column, retry with only the base columns
    //   This makes registration resilient to any schema version.
    const fullProfile: Record<string, unknown> = {
      name: payload.name as string,
      email,
      password: 'supabase_auth', // placeholder – real auth is via Supabase Auth
      phone: payload.phone ?? null,
      nic_number: payload.nic_number ?? null,
      district: payload.district ?? null,
      preferred_language: payload.preferred_language ?? 'en',
      age_group: payload.age_group ?? null,
      known_bee_allergy: payload.known_bee_allergy ?? 'no',
      blood_group: payload.blood_group ?? null,
      beekeeping_nature: payload.beekeeping_nature ?? null,
      business_reg_no: payload.business_reg_no ?? null,
      primary_bee_species: payload.primary_bee_species ?? null,
      nvq_level: payload.nvq_level ?? null,
      role: 'beekeeper',
      years_experience: (payload.years_experience as number) ?? 0,
    };

    let userRow: Record<string, unknown> | null = null;

    // Try full insert first
    const { data: fullData, error: fullError } = await supabase
      .from('users')
      .insert(fullProfile)
      .select()
      .single();

    if (!fullError) {
      userRow = fullData as Record<string, unknown>;
    } else if (fullError.message.includes('schema cache') || fullError.message.includes('Could not find')) {
      // Schema is stale / missing columns — fallback to base columns only
      const baseProfile = {
        name: fullProfile.name,
        email: fullProfile.email,
        password: fullProfile.password,
        phone: fullProfile.phone,
        district: fullProfile.district,
        role: fullProfile.role,
        years_experience: fullProfile.years_experience,
      };
      const { data: baseData, error: baseError } = await supabase
        .from('users')
        .insert(baseProfile)
        .select()
        .single();
      if (baseError) throw new Error(baseError.message);
      userRow = baseData as Record<string, unknown>;
    } else {
      throw new Error(fullError.message);
    }

    if (!userRow) throw new Error('Registration failed: could not create user profile.');

    // Store session token from supabase auth
    const token = authData.session?.access_token ?? '';
    localStorage.setItem('auth_token', token);
    storeUser(userRow as unknown as User);
    return { user: userRow as unknown as User, token };
  },

  async login(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error(authError.message);

    // Fetch profile from custom users table (case-insensitive match)
    // Try exact match first, then fallback to case-insensitive
    let userRow: Record<string, unknown> | null = null;
    let userError: any = null;

    const { data: exactMatch, error: exactError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!exactError && exactMatch) {
      userRow = exactMatch as Record<string, unknown>;
    } else {
      // Try case-insensitive match
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email);

      if (!allError && allUsers && allUsers.length > 0) {
        userRow = allUsers[0] as Record<string, unknown>;
      } else {
        userError = allError || new Error('User profile not found');
      }
    }

    if (userError || !userRow) throw new Error('User profile not found. Please register first.');

    const token = authData.session?.access_token ?? '';
    localStorage.setItem('auth_token', token);
    storeUser(userRow as unknown as User);
    return { user: userRow as unknown as User, token };
  },

  async getMe(): Promise<User> {
    const stored = this.getLocalUser();
    if (stored) return stored;
    throw new Error('Not logged in');
  },

  getLocalUser(): User | null {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!localStorage.getItem('auth_token');
  },

  async resetPasswordForEmail(email: string) {
    // Get the frontend URL dynamically
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw new Error(error.message);
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    // Use the OTP exchange endpoint to update the password
    const { error } = await supabase.auth.verifyOtp({
      email: '',
      token,
      type: 'recovery',
    });

    if (error) throw new Error('Invalid or expired recovery code');

    // After successful OTP verification, update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw new Error(updateError.message);
  },
};
