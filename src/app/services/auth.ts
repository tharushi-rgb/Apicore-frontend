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

    // 2. Insert profile row in custom users table
    const profileData = {
      name: payload.name as string,
      email,
      phone: payload.phone as string | undefined,
      nic_number: payload.nic_number as string | undefined,
      district: payload.district as string | undefined,
      preferred_language: payload.preferred_language as string | undefined,
      age_group: payload.age_group as string | undefined,
      known_bee_allergy: payload.known_bee_allergy as string | undefined,
      blood_group: payload.blood_group as string | undefined,
      beekeeping_nature: payload.beekeeping_nature as string | undefined,
      business_reg_no: payload.business_reg_no as string | undefined,
      primary_bee_species: payload.primary_bee_species as string | undefined,
      nvq_level: payload.nvq_level as string | undefined,
      role: 'beekeeper',
      years_experience: payload.years_experience as number | undefined,
      password: 'supabase_auth', // placeholder – real auth is via Supabase Auth
    };

    const { data: userRow, error: insertError } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    // Store session token from supabase auth
    const token = authData.session?.access_token ?? '';
    localStorage.setItem('auth_token', token);
    storeUser(userRow as User);
    return { user: userRow as User, token };
  },

  async login(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw new Error(authError.message);

    // Fetch profile from custom users table
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userRow) throw new Error('User profile not found. Please register first.');

    const token = authData.session?.access_token ?? '';
    localStorage.setItem('auth_token', token);
    storeUser(userRow as User);
    return { user: userRow as User, token };
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
};
