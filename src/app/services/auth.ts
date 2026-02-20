import { api } from './api';
import { APP_CONFIG } from '@/app/config/appConfig';

const EP = APP_CONFIG.API.AUTH;

interface AuthResponse {
  success: boolean;
  message: string;
  data: { user: User; token: string };
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  role: string;
  years_experience?: number;
}

export const authService = {
  async register(payload: { name: string; email: string; password: string; phone?: string; district?: string; role?: string }) {
    const res = await api.post<AuthResponse>(EP.REGISTER, payload);
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<AuthResponse>(EP.LOGIN, { email, password });
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: { user: User } }>(EP.ME);
    return res.data.user;
  },

  getLocalUser(): User | null {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!localStorage.getItem('auth_token');
  },
};
