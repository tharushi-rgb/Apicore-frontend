import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Hexagon as HiveIcon, ArrowLeft, Droplets, TrendingUp, DollarSign } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { supabase } from '../../services/supabaseClient';
import { expensesService, incomeService } from '../../services/finance';
import { t as tr } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void; onLogout: () => void; onBack: () => void;
}

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

export function AnalyticsScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'hives'>('overview');
  const user = authService.getLocalUser();

  // Data states
  const [hiveStats, setHiveStats] = useState<{ name: string; value: number }[]>([]);
  const [bestHives, setBestHives] = useState<any[]>([]);
  const [monthlyFinance, setMonthlyFinance] = useState<any[]>([]);
  const [harvestByType, setHarvestByType] = useState<{ name: string; value: number }[]>([]);
  const [overviewStats, setOverviewStats] = useState({ totalHarvest: 0, totalIncome: 0, totalExpenses: 0, netProfit: 0 });

  useEffect(() => {
    const load = async () => {
      const userId = user?.id;
      if (!userId) return;
      try {
        const [
          { data: hives },
          { data: harvests },
          incomeData,
          expenseData,
        ] = await Promise.all([
          supabase.from('hives').select('*').eq('user_id', userId),
          supabase.from('harvests').select('*').eq('user_id', userId),
          incomeService.getAll(),
          expensesService.getAll(),
        ]);

        // Hive status distribution
        const statusCounts: Record<string, number> = {};
        (hives ?? []).forEach((h: any) => { statusCounts[h.status] = (statusCounts[h.status] || 0) + 1; });
        setHiveStats(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

        // Best hives by harvest
        const hiveHarvest: Record<number, { name: string; total: number; count: number }> = {};
        (harvests ?? []).forEach((h: any) => {
          if (!h.hive_id) return;
          if (!hiveHarvest[h.hive_id]) {
            const hive = (hives ?? []).find((hv: any) => hv.id === h.hive_id);
            hiveHarvest[h.hive_id] = { name: hive?.name || `Hive #${h.hive_id}`, total: 0, count: 0 };
          }
          hiveHarvest[h.hive_id].total += Number(h.quantity) || 0;
          hiveHarvest[h.hive_id].count++;
        });
        setBestHives(Object.values(hiveHarvest).sort((a, b) => b.total - a.total).slice(0, 5));

        // Harvest by type
        const typeTotals: Record<string, number> = {};
        (harvests ?? []).forEach((h: any) => { typeTotals[h.harvest_type] = (typeTotals[h.harvest_type] || 0) + (Number(h.quantity) || 0); });
        setHarvestByType(Object.entries(typeTotals).map(([name, value]) => ({ name, value })));

        // Monthly income/expense (last 6 months)
        const months: Record<string, { month: string; income: number; expense: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('default', { month: 'short' });
          months[key] = { month: label, income: 0, expense: 0 };
        }
        incomeData.forEach((i: any) => {
          const key = i.income_date?.substring(0, 7);
          if (months[key]) months[key].income += Number(i.amount) || 0;
        });
        expenseData.forEach((e: any) => {
          const key = e.expense_date?.substring(0, 7);
          if (months[key]) months[key].expense += Number(e.amount) || 0;
        });
        setMonthlyFinance(Object.values(months));

        const totalIncome = incomeData.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
        const totalExpenses = expenseData.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const totalHarvest = (harvests ?? []).reduce((s: number, h: any) => s + (Number(h.quantity) || 0), 0);
        setOverviewStats({ totalHarvest, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses });
      } catch (e) {
        console.error('Analytics load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const tabs = [
    { key: 'overview', label: tr('overview', selectedLanguage) },
    { key: 'hives', label: tr('hives', selectedLanguage) },
  ] as const;

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <div className="h-full overflow-y-auto pb-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            activeTab="dashboard" onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
          <div className="px-2 pb-2 border-t border-stone-100 flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-4 h-4 text-stone-700" /></button>
            <div>
              <h1 className="text-[0.95rem] font-bold text-stone-800">{tr('analyticsReports', selectedLanguage)}</h1>
              <p className="text-stone-500 text-[0.72rem] mt-0.5">{tr('performanceInsights', selectedLanguage)}</p>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-t border-stone-100 px-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 px-3 py-2 text-[0.75rem] font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="px-2 py-3 space-y-4">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard label={tr('totalHarvest', selectedLanguage)} value={`${overviewStats.totalHarvest.toFixed(1)} kg`} color="amber" icon={<Droplets className="w-5 h-5" />} />
                  <KpiCard label={tr('totalIncome', selectedLanguage)} value={`LKR ${overviewStats.totalIncome.toLocaleString()}`} color="emerald" icon={<TrendingUp className="w-5 h-5" />} />
                  <KpiCard label={tr('totalExpenses', selectedLanguage)} value={`LKR ${overviewStats.totalExpenses.toLocaleString()}`} color="red" icon={<DollarSign className="w-5 h-5" />} />
                  <KpiCard label={tr('netProfit', selectedLanguage)} value={`LKR ${overviewStats.netProfit.toLocaleString()}`} color={overviewStats.netProfit >= 0 ? 'green' : 'red'} icon={<Award className="w-5 h-5" />} />
                </div>

                {/* Hive Status Donut */}
                {hiveStats.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-3">
                    <h3 className="font-semibold text-[0.85rem] text-stone-800 mb-3">{tr('hiveStatusDist', selectedLanguage)}</h3>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie data={hiveStats} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                            {hiveStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {hiveStats.map((s, i) => (
                          <div key={s.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-[0.75rem] capitalize text-stone-700">{s.name}</span>
                            </div>
                            <span className="text-[0.75rem] font-bold text-stone-800">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly Finance Chart */}
                {monthlyFinance.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-3">
                    <h3 className="font-semibold text-[0.85rem] text-stone-800 mb-3">Income vs Expenses (6 months)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyFinance} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => `LKR ${Number(v).toLocaleString()}`} />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[0.7rem] text-stone-600">Income</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[0.7rem] text-stone-600">Expenses</span></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Hives Tab */}
            {activeTab === 'hives' && (
              <>
                <div className="bg-white rounded-2xl shadow-sm p-3">
                  <h3 className="font-semibold text-[0.85rem] text-stone-800 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Best Performing Hives
                  </h3>
                  {bestHives.length === 0 ? (
                    <div className="text-center py-6"><HiveIcon className="w-9 h-9 text-stone-300 mx-auto mb-2" /><p className="text-stone-500 text-[0.75rem]">No harvest data yet</p></div>
                  ) : (
                    <div className="space-y-3">
                      {bestHives.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[0.75rem] ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-stone-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-stone-200 text-stone-600'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[0.8rem] text-stone-800">{h.name}</p>
                            <p className="text-[0.7rem] text-stone-500">{h.count} harvest{h.count !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="font-bold text-[0.8rem] text-amber-600">{h.total.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {hiveStats.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-3">
                    <h3 className="font-semibold text-[0.85rem] text-stone-800 mb-3">Hive Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={hiveStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Hives" radius={[4, 4, 0, 0]}>
                          {hiveStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  const c = colorMap[color] || 'bg-stone-50 text-stone-700';
  return (
    <div className={`${c.split(' ')[0]} rounded-xl p-3`}>
      <div className={`${c.split(' ')[1]} mb-1.5`}>{icon}</div>
      <p className="text-stone-600 text-[0.7rem] mb-1">{label}</p>
      <p className={`text-[1rem] font-bold ${c.split(' ')[1]} break-words`}>{value}</p>
    </div>
  );
}
