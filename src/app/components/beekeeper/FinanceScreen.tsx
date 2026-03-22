import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Edit,
  Eye,
  Wallet,
  Calendar,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { t as tr } from '../../i18n';
import { expensesService, type Expense } from '../../services/finance';
import { hivesService } from '../../services/hives';
import { apiariesService } from '../../services/apiaries';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

interface ExpenseFormData {
  date: string;
  expenseType: string;
  amount: number;
  linkType: 'hive' | 'apiary' | 'general';
  hiveId?: string;
  apiaryId?: string;
  notes: string;
}

interface Transaction {
  id: number;
  type: 'expense';
  date: string;
  category: string;
  amount: number;
  linkedTo?: { type: string; name: string };
  notes: string;
}

export function FinanceScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [activeForm, setActiveForm] = useState<'expense' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expenseLinkType, setExpenseLinkType] = useState<'hive' | 'apiary' | 'general'>('hive');
  const [expenseData, setExpenseData] = useState<Expense[]>([]);
  const [hives, setHives] = useState<{ id: number; name: string; apiary?: string }[]>([]);
  const [apiaries, setApiaries] = useState<{ id: number; name: string }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'finance';

  const expenseForm = useForm<ExpenseFormData>({ defaultValues: { linkType: 'hive' } });

  const loadData = async () => {
    try {
      const [exp, hiv, api] = await Promise.all([
        expensesService.getAll(),
        hivesService.getAll(),
        apiariesService.getAll(),
      ]);
      setExpenseData(exp);
      setHives(hiv.map((h: any) => ({ id: h.id, name: h.name, apiary: h.apiary_name || '-' })));
      setApiaries(api.map((a: any) => ({ id: a.id, name: a.name })));

      const mappedExp: Transaction[] = exp.map(e => ({
        id: e.id, type: 'expense', date: e.expense_date, category: e.expense_type,
        amount: e.amount, notes: e.notes || e.description || '',
      }));
      setTransactions(mappedExp.sort((a, b) => (a.date < b.date ? 1 : -1)));
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onSubmitExpense = async (data: ExpenseFormData) => {
    try {
      await expensesService.create({
        expense_date: data.date,
        expense_type: data.expenseType,
        amount: data.amount,
        hive_id: expenseLinkType === 'hive' && data.hiveId ? Number(data.hiveId) : undefined,
        apiary_id: expenseLinkType === 'apiary' && data.apiaryId ? Number(data.apiaryId) : undefined,
        notes: data.notes || undefined,
      });
      setActiveForm(null);
      expenseForm.reset();
      loadData();
    } catch (error) {
      console.error('Failed to record expense:', error);
      alert('Failed to record expense');
    }
  };

  const totalExpenses = expenseData.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryTotals = expenseData.reduce<Record<string, number>>((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const filteredTransactions = transactions.filter(t => {
    if (searchText && !t.category.toLowerCase().includes(searchText.toLowerCase()) && !t.notes.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-amber-50 to-stone-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-red-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-red-50 via-amber-50 to-stone-50 relative">
      <div className="h-full overflow-y-auto pb-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            activeTab={activeTab} onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">{tr('finance', selectedLanguage)}</h1>
            <p className="text-stone-500 text-sm mt-1">{tr('trackExpenses', selectedLanguage)}</p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-5">

          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-90 font-medium">{tr('totalExpenses', selectedLanguage)}</span>
              </div>
              <span className="text-xs opacity-70 bg-white/20 rounded-full px-2 py-0.5">{transactions.length} {tr('records', selectedLanguage)}</span>
            </div>
            <p className="text-3xl font-bold mt-1">LKR {totalExpenses.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>

            {topCategories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs opacity-70 mb-2 font-medium">{tr('topSpending', selectedLanguage)}</p>
                <div className="space-y-1.5">
                  {topCategories.map(([cat, amount]) => {
                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="capitalize opacity-90">{cat}</span>
                            <span className="opacity-80">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/70 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs opacity-80 w-24 text-right">LKR {amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs text-stone-500 mb-1">{tr('thisMonth', selectedLanguage)}</p>
              <p className="text-lg font-bold text-stone-800">
                LKR {expenseData
                  .filter(e => e.expense_date?.startsWith(new Date().toISOString().slice(0, 7)))
                  .reduce((s, e) => s + (e.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs text-stone-500 mb-1">{tr('categoriesUsed', selectedLanguage)}</p>
              <p className="text-lg font-bold text-stone-800">{Object.keys(categoryTotals).length}</p>
            </div>
          </div>

          {/* Record Expense Button / Form */}
          {activeForm === null ? (
            <button
              onClick={() => setActiveForm('expense')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-3 shadow-sm"
            >
              <ArrowDown className="w-5 h-5" />
              {tr('recordExpense', selectedLanguage)}
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-stone-800">{tr('recordExpense', selectedLanguage)}</h2>
                </div>
                <button onClick={() => { setActiveForm(null); expenseForm.reset(); }} className="p-2 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>
              <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 text-sm font-medium mb-1.5">{tr('date', selectedLanguage)} <span className="text-red-500">*</span></label>
                    <input type="date" {...expenseForm.register('date', { required: 'Required' })} className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none text-sm" />
                    {expenseForm.formState.errors.date && <p className="text-red-500 text-xs mt-1">{expenseForm.formState.errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-stone-700 text-sm font-medium mb-1.5">{tr('amount', selectedLanguage)} <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" {...expenseForm.register('amount', { required: 'Required', min: 0 })} className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none text-sm" placeholder="0.00" />
                    {expenseForm.formState.errors.amount && <p className="text-red-500 text-xs mt-1">{expenseForm.formState.errors.amount.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 text-sm font-medium mb-1.5">{tr('expenseType', selectedLanguage)} <span className="text-red-500">*</span></label>
                  <select {...expenseForm.register('expenseType', { required: 'Required' })} className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none text-sm">
                    <option value="">{tr('selectType', selectedLanguage)}</option>
                    <option value="feeding">{tr('feeding', selectedLanguage)}</option>
                    <option value="medicine">{tr('medicine', selectedLanguage)}</option>
                    <option value="equipment">{tr('equipment', selectedLanguage)}</option>
                    <option value="transport">{tr('transport', selectedLanguage)}</option>
                    <option value="labor">{tr('labor', selectedLanguage)}</option>
                    <option value="rent">{tr('rent', selectedLanguage)}</option>
                    <option value="other">{tr('other', selectedLanguage)}</option>
                  </select>
                  {expenseForm.formState.errors.expenseType && <p className="text-red-500 text-xs mt-1">{expenseForm.formState.errors.expenseType.message}</p>}
                </div>

                <div>
                  <label className="block text-stone-700 text-sm font-medium mb-1.5">{tr('linkTo', selectedLanguage)}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['hive', 'apiary', 'general'] as const).map(t => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" value={t} checked={expenseLinkType === t} onChange={() => setExpenseLinkType(t)} className="sr-only peer" />
                        <div className="p-2.5 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-red-400 peer-checked:bg-red-50 transition-all text-center text-xs font-medium capitalize">{t}</div>
                      </label>
                    ))}
                  </div>
                  {expenseLinkType === 'hive' && (
                    <select {...expenseForm.register('hiveId')} className="mt-2 w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none text-sm">
                      <option value="">{tr('selectHive', selectedLanguage)}</option>
                      {hives.map(h => <option key={h.id} value={h.id}>{h.name} ({h.apiary})</option>)}
                    </select>
                  )}
                  {expenseLinkType === 'apiary' && (
                    <select {...expenseForm.register('apiaryId')} className="mt-2 w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none text-sm">
                      <option value="">{tr('selectApiary', selectedLanguage)}</option>
                      {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 text-sm font-medium mb-1.5">{tr('notes', selectedLanguage)}</label>
                  <textarea {...expenseForm.register('notes')} rows={2} className="w-full px-3 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:border-red-400 focus:outline-none resize-none text-sm" placeholder="Medicine name, trip purpose, details…" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setActiveForm(null); expenseForm.reset(); }} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-medium text-sm">{tr('cancel', selectedLanguage)}</button>
                  <button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium text-sm">{tr('saveExpense', selectedLanguage)}</button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Search */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-500" />
                <span className="font-medium text-stone-700 text-sm">{tr('searchTransactions', selectedLanguage)}</span>
              </div>
              {showFilters ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
            </button>
            {showFilters && (
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search by category or notes…" className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-400 text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-stone-500" />
                Expense History
              </h2>
              {filteredTransactions.length > 0 && (
                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{filteredTransactions.length} records</span>
              )}
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTransactions.map(t => (
                  <div key={`expense-${t.id}`} className="bg-white rounded-xl shadow-sm p-4 border border-stone-100 border-l-4 border-l-red-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 capitalize">
                            {t.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-stone-400">
                            <Calendar className="w-3 h-3" />
                            <span>{t.date}</span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-stone-800">LKR {t.amount.toLocaleString()}</p>
                        {t.notes && <p className="text-xs text-stone-500 mt-1 truncate">{t.notes}</p>}
                      </div>
                      <div className="flex gap-1.5 ml-3 flex-shrink-0">
                        <button className="p-2 bg-stone-100 hover:bg-stone-200 rounded-lg">
                          <Eye className="w-3.5 h-3.5 text-stone-600" />
                        </button>
                        <button className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg">
                          <Edit className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-stone-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-base font-bold text-stone-800 mb-1">No expenses recorded yet</p>
                <p className="text-stone-500 text-sm mb-5">Track your apiary costs to understand spending</p>
                <button onClick={() => setActiveForm('expense')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm">
                  Record First Expense
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
