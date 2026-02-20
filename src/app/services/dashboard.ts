import { api } from './api';

export interface DashboardData {
  user: { id: number; name: string; email: string; phone?: string; district?: string; role: string };
  stats: {
    totalApiaries: number;
    activeApiaries: number;
    totalHives: number;
    activeHives: number;
    totalHarvests: number;
    totalHoneyKg: number;
  };
  alerts: { id: number; type: string; message: string; is_read: number; created_at: string }[];
  apiaries: Apiary[];
  hives: Hive[];
}

interface Apiary { id: number; name: string; district?: string; status: string; hive_count: number; }
interface Hive { id: number; name: string; hive_type: string; status: string; apiary_name?: string; }

export const dashboardService = {
  async get() {
    const res = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return res.data;
  },
};
