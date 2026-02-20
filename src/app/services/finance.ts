import { api } from './api';

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

export const expensesService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { expenses: Expense[] } }>('/expenses');
    return res.data.expenses;
  },
  async create(payload: Partial<Expense>) {
    const res = await api.post<{ success: boolean; data: { expense: Expense } }>('/expenses', payload);
    return res.data.expense;
  },
  async update(id: number, payload: Partial<Expense>) {
    const res = await api.put<{ success: boolean; data: { expense: Expense } }>(`/expenses/${id}`, payload);
    return res.data.expense;
  },
  async delete(id: number) {
    return api.delete(`/expenses/${id}`);
  },
};

export const incomeService = {
  async getAll() {
    const res = await api.get<{ success: boolean; data: { income: Income[] } }>('/income');
    return res.data.income;
  },
  async create(payload: Partial<Income>) {
    const res = await api.post<{ success: boolean; data: { income: Income } }>('/income', payload);
    return res.data.income;
  },
  async update(id: number, payload: Partial<Income>) {
    const res = await api.put<{ success: boolean; data: { income: Income } }>(`/income/${id}`, payload);
    return res.data.income;
  },
  async delete(id: number) {
    return api.delete(`/income/${id}`);
  },
};
