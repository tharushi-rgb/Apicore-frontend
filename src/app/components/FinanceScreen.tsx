import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, TrendingDown, List as ListIcon } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { expensesService, type Expense } from '../services/finance';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

export function FinanceScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpForm, setShowExpForm] = useState<Expense | true | false>(false);
  const user = authService.getLocalUser();

  const fetchAll = async () => { try { const e = await expensesService.getAll(); setExpenses(e); } catch {} setLoading(false); };
  useEffect(() => { fetchAll(); }, []);

  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const deleteExpense = async (id: number) => { if (!confirm('Delete?')) return; await expensesService.delete(id); fetchAll(); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="finance" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">Finance</h1>
          <p className="text-stone-500 text-sm mt-1">Track expenses</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" /><p className="text-lg font-bold text-red-600">Rs.{totalExp.toFixed(0)}</p><p className="text-xs text-stone-500">Total Expenses</p></div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><ListIcon className="w-4 h-4 text-amber-500 mx-auto mb-1" /><p className="text-lg font-bold text-amber-600">{expenses.length}</p><p className="text-xs text-stone-500">Entries</p></div>
        </div>

        <button onClick={() => setShowExpForm(true)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add Expense</button>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          expenses.length === 0 ? <p className="text-center text-stone-500 py-8">No expenses</p> :
          <div className="space-y-3">{expenses.map(e => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div><h3 className="font-bold text-stone-800 capitalize">{e.expense_type}</h3><p className="text-xs text-stone-500">{new Date(e.expense_date).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">Rs.{e.amount}</span>
                  <button onClick={() => setShowExpForm(e)} className="p-1"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                  <button onClick={() => deleteExpense(e.id)} className="p-1"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              {e.description && <p className="text-xs text-stone-500">{e.description}</p>}
            </div>
          ))}</div>
        }
      </div>

      {showExpForm && <ExpenseForm initial={showExpForm === true ? undefined : showExpForm} onClose={() => setShowExpForm(false)} onSaved={() => { setShowExpForm(false); fetchAll(); }} />}
    </div>
  );
}

function ExpenseForm({ initial, onClose, onSaved }: { initial?: Expense; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ expense_type: initial?.expense_type || 'equipment', amount: initial?.amount?.toString() || '', expense_date: initial?.expense_date || new Date().toISOString().split('T')[0], description: initial?.description || '' });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!f.amount) return; setSaving(true); try { const d = { ...f, amount: parseFloat(f.amount) }; if (initial) await expensesService.update(initial.id, d); else await expensesService.create(d); onSaved(); } catch { setSaving(false); } };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'Add'} Expense</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.expense_type} onChange={e=>setF(p=>({...p,expense_type:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="equipment">Equipment</option><option value="feed">Feed</option><option value="medicine">Medicine</option><option value="transport">Transport</option><option value="labor">Labor</option><option value="packaging">Packaging</option><option value="other">Other</option></select>
        <input value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="Amount (Rs.)" type="number" step="0.01" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input type="date" value={f.expense_date} onChange={e=>setF(p=>({...p,expense_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <textarea value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Description" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-red-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}
