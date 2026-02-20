import { api } from './api';

export interface HelperInvitation { id: number; email: string; token: string; status: string; invited_by_name?: string; created_at: string; expires_at: string; }
export interface HelperUser { id: number; name: string; email: string; phone?: string; district?: string; role: string; }
export interface HiveAssignment { id: number; hive_id: number; helper_id: number; status: string; hive_name?: string; apiary_name?: string; assigned_at: string; }

export const helpersService = {
  async invite(email: string) { return api.post<{ success: boolean; data: { token: string; email: string } }>('/helpers/invite', { email }); },
  async getInvitations() { return (await api.get<{ success: boolean; data: { invitations: HelperInvitation[] } }>('/helpers/invitations')).data.invitations; },
  async verifyToken(token: string) { return api.post<{ success: boolean; data: { invitation: HelperInvitation } }>('/helpers/verify-token', { token }); },
  async registerHelper(payload: { token: string; name: string; password: string; phone?: string; district?: string }) {
    return api.post<{ success: boolean; data: { user: HelperUser; token: string } }>('/helpers/register', payload);
  },
  async getHelpers() { return (await api.get<{ success: boolean; data: { helpers: HelperUser[] } }>('/helpers/list')).data.helpers; },
  async assignHive(helperId: number, hiveId: number) { return api.post('/helpers/assign', { helper_id: helperId, hive_id: hiveId }); },
  async revokeAssignment(assignmentId: number) { return api.patch(`/helpers/assignments/${assignmentId}/revoke`, {}); },
  async getAssignments(helperId: number) { return (await api.get<{ success: boolean; data: { assignments: HiveAssignment[] } }>(`/helpers/${helperId}/assignments`)).data.assignments; },
  // Helper's own endpoints
  async getMyDashboard() { return (await api.get<{ success: boolean; data: any }>('/helpers/my-dashboard')).data; },
  async getMyAssignments() { return (await api.get<{ success: boolean; data: { assignments: HiveAssignment[] } }>('/helpers/my-assignments')).data.assignments; },
};
