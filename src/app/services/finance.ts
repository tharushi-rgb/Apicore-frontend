import { supabase } from './supabaseClient';
import { authService } from './auth';

export interface Expense {
  id: number;
  hive_id?: number;
  apiary_id?: number;
  expense_date: string;
  expense_type: string;
  amount: number;
  description?: string;
  notes?: string;
  created_at: string;
}

export interface Income {
  id: number;
  harvest_id?: number;
  income_date: string;
  income_type: string;
  amount: number;
  buyer_name?: string;
  description?: string;
  notes?: string;
  created_at: string;
}

function getUserId(): number {
  const user = authService.getLocalUser();
  if (!user) throw new Error('Not logged in');
  return user.id;
}

export const expensesService = {
  async getAll() {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Expense[];
  },

  async create(payload: Partial<Expense>) {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Expense;
  },

  async update(id: number, payload: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Expense;
  },

  async delete(id: number) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// Income service with Supabase CRUD
export const incomeService = {
  async getAll(): Promise<Income[]> {
    const userId = getUserId();
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userId)
        .order('income_date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Income[];
    } catch {
      return [];
    }
  },

  async create(payload: Partial<Income>): Promise<Income> {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('income')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Income;
  },

  async update(id: number, payload: Partial<Income>): Promise<Income> {
    const { data, error } = await supabase
      .from('income')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Income;
  },

  async delete(id: number) {
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
