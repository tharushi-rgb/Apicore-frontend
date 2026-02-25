// helpers.ts — helper feature removed. Kept to prevent build errors.

export interface HelperInvitation { id: number; email: string; token: string; status: string; invited_by_name?: string; created_at: string; expires_at: string; }
export interface HelperUser { id: number; name: string; email: string; phone?: string; district?: string; role: string; }
export interface HiveAssignment { id: number; hive_id: number; helper_id: number; status: string; hive_name?: string; apiary_name?: string; assigned_at: string; }

const stub = () => { throw new Error('Helper feature not available in Supabase-only mode'); };

export const helpersService = {
  async invite(_email: string) { stub(); },
  async getInvitations(): Promise<HelperInvitation[]> { return []; },
  async verifyToken(_token: string) { stub(); },
  async registerHelper(_payload: { token: string; name: string; password: string; phone?: string; district?: string }) { stub(); },
  async getHelpers(): Promise<HelperUser[]> { return []; },
  async assignHive(_helperId: number, _hiveId: number) { stub(); },
  async revokeAssignment(_assignmentId: number) { stub(); },
  async getAssignments(_helperId: number): Promise<HiveAssignment[]> { return []; },
  async getMyDashboard() { stub(); },
  async getMyAssignments(): Promise<HiveAssignment[]> { return []; },
};
