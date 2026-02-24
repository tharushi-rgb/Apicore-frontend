import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { expensesService, incomeService, type Expense, type Income } from '../services/finance';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';
type FinanceTab = 'expenses' | 'income';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

export function FinanceScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<FinanceTab>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpForm, setShowExpForm] = useState<Expense | true | false>(false);
  const [showIncForm, setShowIncForm] = useState<Income | true | false>(false);
  const user = authService.getLocalUser();

  const fetchAll = async () => { try { const [e, i] = await Promise.all([expensesService.getAll(), incomeService.getAll()]); setExpenses(e); setIncome(i); } catch {} setLoading(false); };
  useEffect(() => { fetchAll(); }, []);

  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalInc = income.reduce((s, i) => s + (i.amount || 0), 0);

  const deleteExpense = async (id: number) => { if (!confirm('Delete?')) return; await expensesService.delete(id); fetchAll(); };
  // ...existing code...
  const deleteIncome = async (id: number) => { if (!confirm('Delete?')) return; await incomeService.delete(id); fetchAll(); };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="finance" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-4 py-6 space-y-4 flex-1 overflow-y-auto pb-8 hide-scrollbar">
          <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 rounded-2xl p-3 text-center"><TrendingDown className="w-4 h-4 text-white/80 mx-auto mb-1" /><p className="text-[15px] font-bold text-white">Rs.{totalExp.toFixed(0)}</p><p className="text-[10px] text-white/70">Expenses</p></div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 rounded-2xl p-3 text-center"><TrendingUp className="w-4 h-4 text-white/80 mx-auto mb-1" /><p className="text-[15px] font-bold text-white">Rs.{totalInc.toFixed(0)}</p><p className="text-[10px] text-white/70">Income</p></div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 rounded-2xl p-3 text-center"><DollarSign className="w-4 h-4 text-white/80 mx-auto mb-1" /><p className="text-[15px] font-bold text-white">Rs.{(totalInc - totalExp).toFixed(0)}</p><p className="text-[10px] text-white/70">Profit</p></div>
        </div>

        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          <button onClick={() => setTab('expenses')} className={`flex-1 py-1.5 rounded-xl text-[12px] font-medium ${tab==='expenses' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Expenses ({expenses.length})</button>
          <button onClick={() => setTab('income')} className={`flex-1 py-1.5 rounded-xl text-[12px] font-medium ${tab==='income' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Income ({income.length})</button>
        </div>

        {tab === 'expenses' && (
          <>
            <button onClick={() => setShowExpForm(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 rounded-2xl text-[13px] font-bold py-2.5 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Expense</button>
            {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
              expenses.length === 0 ? <p className="text-center text-stone-500 py-8">No expenses</p> :
              <div className="space-y-3">{expenses.map(e => (
                <div key={e.id} className="bg-white rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="w-3.5 h-3.5 text-red-500" /></div><div><h3 className="font-bold text-[13px] text-stone-800 capitalize">{e.expense_type}</h3><p className="text-[10px] text-stone-500">{new Date(e.expense_date).toLocaleDateString()}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-red-600">Rs.{e.amount}</span>
                      <button onClick={() => setShowExpForm(e)} className="p-1"><Edit2 className="w-3 h-3 text-stone-500" /></button>
                      <button onClick={() => deleteExpense(e.id)} className="p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                  {e.description && <p className="text-[11px] text-stone-500 ml-9">{e.description}</p>}
                </div>
              ))}</div>
            }
          </>
        )}

        {tab === 'income' && (
          <>
            <button onClick={() => setShowIncForm(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 rounded-2xl text-[13px] font-bold py-2.5 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Income</button>
            {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
              income.length === 0 ? <p className="text-center text-stone-500 py-8">No income</p> :
              <div className="space-y-3">{income.map(i => (
                <div key={i.id} className="bg-white rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /></div><div><h3 className="font-bold text-[13px] text-stone-800 capitalize">{i.income_type}</h3><p className="text-[10px] text-stone-500">{new Date(i.income_date).toLocaleDateString()}</p></div></div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-emerald-600">Rs.{i.amount}</span>
                      <button onClick={() => setShowIncForm(i)} className="p-1"><Edit2 className="w-3 h-3 text-stone-500" /></button>
                      <button onClick={() => deleteIncome(i.id)} className="p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                  {i.description && <p className="text-[11px] text-stone-500 ml-9">{i.description}</p>}
                </div>
              ))}
              </div>
            }
          </>
        )}
      </div>

      {showExpForm && <ExpenseForm initial={showExpForm === true ? undefined : showExpForm} onClose={() => setShowExpForm(false)} onSaved={() => { setShowExpForm(false); fetchAll(); }} />}
      {showIncForm && <IncomeForm initial={showIncForm === true ? undefined : showIncForm} onClose={() => setShowIncForm(false)} onSaved={() => { setShowIncForm(false); fetchAll(); }} />}
    </div>
    </div>
  );
}

function ExpenseForm({ initial, onClose, onSaved }: { initial?: Expense; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ expense_type: initial?.expense_type || 'equipment', amount: initial?.amount?.toString() || '', expense_date: initial?.expense_date || new Date().toISOString().split('T')[0], description: initial?.description || '' });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!f.amount) return; setSaving(true); try { const d = { ...f, amount: parseFloat(f.amount) }; if (initial) await expensesService.update(initial.id, d); else await expensesService.create(d); onSaved(); } catch { setSaving(false); } };
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-[15px] text-stone-800">{initial ? 'Edit' : 'Add'} Expense</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.expense_type} onChange={e=>setF(p=>({...p,expense_type:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors"><option value="equipment">Equipment</option><option value="feed">Feed</option><option value="medicine">Medicine</option><option value="transport">Transport</option><option value="labor">Labor</option><option value="packaging">Packaging</option><option value="other">Other</option></select>
        <input value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="Amount (Rs.)" type="number" step="0.01" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <input type="date" value={f.expense_date} onChange={e=>setF(p=>({...p,expense_date:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <textarea value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Description" rows={2} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 rounded-2xl text-[13px] font-bold py-2.5 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function IncomeForm({ initial, onClose, onSaved }: { initial?: Income; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ income_type: initial?.income_type || 'honey_sales', amount: initial?.amount?.toString() || '', income_date: initial?.income_date || new Date().toISOString().split('T')[0], description: initial?.description || '' });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!f.amount) return; setSaving(true); try { const d = { ...f, amount: parseFloat(f.amount) }; if (initial) await incomeService.update(initial.id, d); else await incomeService.create(d); onSaved(); } catch { setSaving(false); } };
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-[15px] text-stone-800">{initial ? 'Edit' : 'Add'} Income</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.income_type} onChange={e=>setF(p=>({...p,income_type:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors"><option value="honey_sales">Honey Sales</option><option value="wax_sales">Wax Sales</option><option value="colony_sales">Colony Sales</option><option value="pollination">Pollination Services</option><option value="queen_sales">Queen Sales</option><option value="other">Other</option></select>
        <input value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="Amount (Rs.)" type="number" step="0.01" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <input type="date" value={f.income_date} onChange={e=>setF(p=>({...p,income_date:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <textarea value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Description" rows={2} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 rounded-2xl text-[13px] font-bold py-2.5 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}
