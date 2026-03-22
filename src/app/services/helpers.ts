import { api } from './api';

export interface HelperInvitation {
  id: number;
  email: string;
  token: string;
  status: string;
  invited_by_name?: string;
  created_at: string;
  expires_at: string;
}

export const helpersService = {
  async verifyToken(token: string) {
    // Uses the legacy REST layer when available.
    return api.post<{ success: boolean; data: { invitation: HelperInvitation } }>(
      '/helpers/verify-token',
      { token },
    );
  },
};
