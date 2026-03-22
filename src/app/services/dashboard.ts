import { supabase } from './supabaseClient';
import { authService } from './auth';

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

interface Apiary { id: number; name: string; district?: string; area?: string; status: string; hive_count: number; }
interface Hive { 
  id: number; 
  name: string; 
  hive_type: string; 
  status: string; 
  apiary_name?: string; 
  last_inspection_date?: string; 
  queen_present?: number;
  queen_age?: number;
  queen_age_risk?: 'low' | 'medium' | 'high';
  apiary_id?: number;
}

export const dashboardService = {
  async get(): Promise<DashboardData> {
    const user = authService.getLocalUser();
    if (!user) throw new Error('Not logged in');
    const userId = user.id;

    const [
      { data: apiaryRows },
      { data: hiveRows },
      { data: alertRows },
    ] = await Promise.all([
      supabase.from('apiaries').select('*').eq('user_id', userId),
      supabase.from('hives').select('id, name, hive_type, status, queen_age, queen_age_risk, last_inspection_date, apiary_id, apiaries(name)').eq('user_id', userId),
      supabase.from('alerts').select('*').eq('user_id', userId).eq('is_read', 0).order('created_at', { ascending: false }).limit(10),
    ]);

    const apiaries: Apiary[] = (apiaryRows ?? []).map((a: any) => ({
      id: a.id, name: a.name, district: a.district, area: a.area, status: a.status, hive_count: 0,
    }));

    const hiveCountMap: Record<number, number> = {};
    (hiveRows ?? []).forEach((h: any) => {
      if (h.apiary_id) hiveCountMap[h.apiary_id] = (hiveCountMap[h.apiary_id] ?? 0) + 1;
    });
    apiaries.forEach(a => { a.hive_count = hiveCountMap[a.id] ?? 0; });

    const hives: Hive[] = (hiveRows ?? []).map((h: any) => ({
      id: h.id, 
      name: h.name, 
      hive_type: h.hive_type, 
      status: h.status,
      apiary_name: h.apiaries?.name,
      apiary_id: h.apiary_id,
      queen_age: h.queen_age,
      queen_age_risk: h.queen_age_risk,
      last_inspection_date: h.last_inspection_date,
    }));

    const activeApiaries = (apiaryRows ?? []).filter((a: any) => a.status === 'active').length;
    const activeHives = (hiveRows ?? []).filter((h: any) => h.status === 'active').length;

    const alerts = (alertRows ?? []).map((a: any) => ({
      id: a.id, type: a.alert_type ?? 'info', message: a.message, is_read: a.is_read ?? 0, created_at: a.created_at,
    }));

    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, district: user.district, role: user.role },
      stats: {
        totalApiaries: (apiaryRows ?? []).length,
        activeApiaries,
        totalHives: (hiveRows ?? []).length,
        activeHives,
        totalHarvests: 0,
        totalHoneyKg: 0,
      },
      alerts,
      apiaries,
      hives,
    };
  },
};
