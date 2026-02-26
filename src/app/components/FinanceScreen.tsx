import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  ArrowUp,
  ArrowDown,
  Upload,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Edit,
  Eye,
  Wallet,
  Calendar,
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { expensesService, incomeService, type Expense, type Income } from '../services/finance';
import { harvestsService } from '../services/harvests';
import { hivesService } from '../services/hives';
import { apiariesService } from '../services/apiaries';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

interface IncomeFormData {
  date: string;
  incomeType: string;
  amount: number;
  linkType: 'harvest' | 'hive' | 'apiary' | 'none';
  harvestId?: string;
  hiveId?: string;
  apiaryId?: string;
  notes: string;
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
  type: 'income' | 'expense';
  date: string;
  category: string;
  amount: number;
  linkedTo?: { type: string; name: string };
  notes: string;
}

export function FinanceScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'income' | 'expense' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [incomeLinkType, setIncomeLinkType] = useState<'harvest' | 'hive' | 'apiary' | 'none'>('harvest');
  const [expenseLinkType, setExpenseLinkType] = useState<'hive' | 'apiary' | 'general'>('hive');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [incomeData, setIncomeData] = useState<Income[]>([]);
  const [expenseData, setExpenseData] = useState<Expense[]>([]);
  const [harvests, setHarvests] = useState<{ id: number; name: string }[]>([]);
  const [hives, setHives] = useState<{ id: number; name: string; apiary?: string }[]>([]);
  const [apiaries, setApiaries] = useState<{ id: number; name: string }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'finance';

  const incomeForm = useForm<IncomeFormData>({ defaultValues: { linkType: 'harvest' } });
  const expenseForm = useForm<ExpenseFormData>({ defaultValues: { linkType: 'hive' } });

  const loadData = async () => {
    try {
      const [inc, exp, harv, hiv, api] = await Promise.all([
        incomeService.getAll(),
        expensesService.getAll(),
        harvestsService.getAll(),
        hivesService.getAll(),
        apiariesService.getAll(),
      ]);
      setIncomeData(inc);
      setExpenseData(exp);
      setHarvests(harv.map(h => ({ id: h.id, name: `${h.harvest_type} ${h.quantity}${h.unit} - ${h.harvest_date}` })));
      setHives(hiv.map((h: any) => ({ id: h.id, name: h.name, apiary: h.apiary_name || 'Standalone' })));
      setApiaries(api.map((a: any) => ({ id: a.id, name: a.name })));

      const mappedInc: Transaction[] = inc.map(i => ({
        id: i.id, type: 'income', date: i.income_date, category: i.income_type,
        amount: i.amount, linkedTo: i.harvest_id ? { type: 'Harvest', name: `Harvest #${i.harvest_id}` } : undefined,
        notes: i.notes || i.description || '',
      }));
      const mappedExp: Transaction[] = exp.map(e => ({
        id: e.id, type: 'expense', date: e.expense_date, category: e.expense_type,
        amount: e.amount, notes: e.notes || e.description || '',
      }));
      setTransactions([...mappedInc, ...mappedExp].sort((a, b) => (a.date < b.date ? 1 : -1)));
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onSubmitIncome = async (data: IncomeFormData) => {
    try {
      await incomeService.create({
        income_date: data.date,
        income_type: data.incomeType,
        amount: data.amount,
        harvest_id: incomeLinkType === 'harvest' && data.harvestId ? Number(data.harvestId) : undefined,
        notes: data.notes || undefined,
      });
      setActiveForm(null);
      incomeForm.reset();
      setUploadedImages([]);
      loadData();
    } catch (error) {
      console.error('Failed to record income:', error);
      alert('Failed to record income');
    }
  };

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
      setUploadedImages([]);
      loadData();
    } catch (error) {
      console.error('Failed to record expense:', error);
      alert('Failed to record expense');
    }
  };

  const handleImageUpload = () => {
    setUploadedImages([...uploadedImages, `image-${Date.now()}.jpg`]);
  };

  const totalIncome = incomeData.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenseData.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const filteredTransactions = transactions.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (searchText && !t.category.toLowerCase().includes(searchText.toLowerCase()) && !t.notes.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <MobileSidebar isOpen={isSidebarOpen} activeTab={activeTab} onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="h-full overflow-y-auto pb-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">Finance</h1>
            <p className="text-stone-500 text-sm mt-1">Track income, expenses, and profitability</p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Financial Overview */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Total Income" value={`LKR ${totalIncome.toFixed(2)}`} bgColor="bg-emerald-50" textColor="text-emerald-700" />
            <SummaryCard label="Total Expenses" value={`LKR ${totalExpenses.toFixed(2)}`} bgColor="bg-red-50" textColor="text-red-700" />
            <SummaryCard label="Net Balance" value={`LKR ${netBalance.toFixed(2)}`} bgColor={netBalance >= 0 ? 'bg-green-50' : 'bg-red-50'} textColor={netBalance >= 0 ? 'text-green-700' : 'text-red-700'} />
            <SummaryCard label="Transactions" value={transactions.length.toString()} bgColor="bg-blue-50" textColor="text-blue-700" />
          </div>

          {/* Action Buttons */}
          {activeForm === null && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveForm('income')} className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-2 shadow-sm">
                <ArrowUp className="w-6 h-6" /><span>Record Income</span>
              </button>
              <button onClick={() => setActiveForm('expense')} className="bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-2 shadow-sm">
                <ArrowDown className="w-6 h-6" /><span>Record Expense</span>
              </button>
            </div>
          )}

          {/* Income Form */}
          {activeForm === 'income' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-800">Record Income</h2>
                <button onClick={() => { setActiveForm(null); incomeForm.reset(); }} className="p-2 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-600" /></button>
              </div>
              <form onSubmit={incomeForm.handleSubmit(onSubmitIncome)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-emerald-200">Income Details</h3>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Date <span className="text-red-500">*</span></label>
                    <input type="date" {...incomeForm.register('date', { required: 'Date is required' })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" />
                    {incomeForm.formState.errors.date && <p className="text-red-500 text-sm mt-1">{incomeForm.formState.errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Income Type <span className="text-red-500">*</span></label>
                    <select {...incomeForm.register('incomeType', { required: 'Type is required' })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none">
                      <option value="">Select type</option>
                      <option value="harvest">Harvest Sale</option>
                      <option value="client">Client Service</option>
                      <option value="colony">Colony / Hive Sale</option>
                      <option value="other">Other</option>
                    </select>
                    {incomeForm.formState.errors.incomeType && <p className="text-red-500 text-sm mt-1">{incomeForm.formState.errors.incomeType.message}</p>}
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Amount (LKR) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" {...incomeForm.register('amount', { required: 'Amount is required', min: 0 })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" placeholder="0.00" />
                    {incomeForm.formState.errors.amount && <p className="text-red-500 text-sm mt-1">{incomeForm.formState.errors.amount.message}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-emerald-200">Income Source Linking</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['harvest', 'hive', 'apiary', 'none'] as const).map(t => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" value={t} checked={incomeLinkType === t} onChange={() => setIncomeLinkType(t)} className="sr-only peer" />
                        <div className="p-2 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all text-center text-xs capitalize">{t === 'none' ? 'Not Linked' : t}</div>
                      </label>
                    ))}
                  </div>
                  {incomeLinkType === 'harvest' && (
                    <select {...incomeForm.register('harvestId')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none">
                      <option value="">Select harvest</option>
                      {harvests.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  )}
                  {incomeLinkType === 'hive' && (
                    <select {...incomeForm.register('hiveId')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none">
                      <option value="">Select hive</option>
                      {hives.map(h => <option key={h.id} value={h.id}>{h.name} ({h.apiary})</option>)}
                    </select>
                  )}
                  {incomeLinkType === 'apiary' && (
                    <select {...incomeForm.register('apiaryId')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none">
                      <option value="">Select apiary</option>
                      {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-emerald-200">Notes</h3>
                  <textarea {...incomeForm.register('notes')} rows={3} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none" placeholder="Buyer name, payment method, remarks…" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setActiveForm(null); incomeForm.reset(); }} className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium">Save Income</button>
                </div>
              </form>
            </div>
          )}

          {/* Expense Form */}
          {activeForm === 'expense' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-800">Record Expense</h2>
                <button onClick={() => { setActiveForm(null); expenseForm.reset(); }} className="p-2 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-600" /></button>
              </div>
              <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-red-200">Expense Details</h3>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Date <span className="text-red-500">*</span></label>
                    <input type="date" {...expenseForm.register('date', { required: 'Date is required' })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none" />
                    {expenseForm.formState.errors.date && <p className="text-red-500 text-sm mt-1">{expenseForm.formState.errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Expense Type <span className="text-red-500">*</span></label>
                    <select {...expenseForm.register('expenseType', { required: 'Type is required' })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none">
                      <option value="">Select type</option>
                      <option value="feeding">Feeding</option>
                      <option value="medicine">Medicine / Treatment</option>
                      <option value="equipment">Equipment</option>
                      <option value="transport">Transport</option>
                      <option value="labor">Labor</option>
                      <option value="rent">Apiary Rent</option>
                      <option value="other">Other</option>
                    </select>
                    {expenseForm.formState.errors.expenseType && <p className="text-red-500 text-sm mt-1">{expenseForm.formState.errors.expenseType.message}</p>}
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-2">Amount (LKR) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" {...expenseForm.register('amount', { required: 'Amount is required', min: 0 })} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none" placeholder="0.00" />
                    {expenseForm.formState.errors.amount && <p className="text-red-500 text-sm mt-1">{expenseForm.formState.errors.amount.message}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-red-200">Expense Source Linking</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(['hive', 'apiary', 'general'] as const).map(t => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" value={t} checked={expenseLinkType === t} onChange={() => setExpenseLinkType(t)} className="sr-only peer" />
                        <div className="p-3 bg-white border-2 border-stone-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 transition-all text-center text-sm capitalize">{t}</div>
                      </label>
                    ))}
                  </div>
                  {expenseLinkType === 'hive' && (
                    <select {...expenseForm.register('hiveId')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none">
                      <option value="">Select hive</option>
                      {hives.map(h => <option key={h.id} value={h.id}>{h.name} ({h.apiary})</option>)}
                    </select>
                  )}
                  {expenseLinkType === 'apiary' && (
                    <select {...expenseForm.register('apiaryId')} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none">
                      <option value="">Select apiary</option>
                      {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 pb-2 border-b-2 border-red-200">Notes</h3>
                  <textarea {...expenseForm.register('notes')} rows={3} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-red-500 focus:outline-none resize-none" placeholder="Medicine name, trip purpose, labor details…" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setActiveForm(null); expenseForm.reset(); }} className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 rounded-xl font-medium">Cancel</button>
                  <button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium">Save Expense</button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Search */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-stone-600" />
                <span className="font-medium text-stone-800">Filter & Search</span>
              </div>
              {showFilters ? <ChevronUp className="w-5 h-5 text-stone-600" /> : <ChevronDown className="w-5 h-5 text-stone-600" />}
            </button>
            {showFilters && (
              <div className="p-4 border-t border-stone-200 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search transactions..." className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500">
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-800">Transaction History</h2>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map(t => (
                  <div key={`${t.type}-${t.id}`} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${t.type === 'income' ? 'border-emerald-400' : 'border-red-400'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {t.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                        <p className="text-2xl font-bold text-stone-800">LKR {t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-stone-600 mb-2">
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{t.date}</span></div>
                      <span className="font-medium">{t.category}</span>
                    </div>
                    {t.linkedTo && <div className="text-sm text-stone-600 mb-3"><span className="font-medium">{t.linkedTo.type}:</span> {t.linkedTo.name}</div>}
                    {t.notes && <p className="text-sm text-stone-600 mb-3 truncate">{t.notes}</p>}
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm font-medium text-stone-700">
                        <Eye className="w-4 h-4" /><span>View Details</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-sm font-medium text-amber-700">
                        <Edit className="w-4 h-4" /><span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-amber-600" />
                </div>
                <p className="text-lg font-bold text-stone-800 mb-2">No financial records yet</p>
                <p className="text-stone-600 mb-6">Record income and expenses to track profitability</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setActiveForm('income')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium">Record Income</button>
                  <button onClick={() => setActiveForm('expense')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium">Record Expense</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, bgColor, textColor }: { label: string; value: string; bgColor: string; textColor: string }) {
  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <p className="text-stone-600 text-xs mb-1.5">{label}</p>
      <p className={`text-xl font-bold ${textColor} break-words`}>{value}</p>
    </div>
  );
}
