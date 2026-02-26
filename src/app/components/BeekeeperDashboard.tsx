import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { dashboardService, type DashboardData } from '../services/dashboard';
import { planningService } from '../services/planning';
import { expensesService } from '../services/finance';
import { authService } from '../services/auth';
import { Leaf, Home, Hexagon as HiveIcon, MapPin, TrendingUp, AlertTriangle, Package } from 'lucide-react';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

export function BeekeeperDashboard({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [forageData, setForageData] = useState<any[]>([]);
  const [upcomingForage, setUpcomingForage] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queenRiskView, setQueenRiskView] = useState<'low' | 'medium' | 'high'>('high');
  const [forageTab, setForageTab] = useState<'current' | 'upcoming'>('current');
  const user = authService.getLocalUser();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentMonth = new Date().getMonth() + 1;
        const nextMonth = (currentMonth % 12) + 1;
        const [dashData, forage, upcoming, expenseData] = await Promise.all([
          dashboardService.get(),
          planningService.getForageByMonth(currentMonth),
          planningService.getForageByMonth(nextMonth),
          expensesService.getAll().catch(() => []),
        ]);
        setData(dashData);
        setForageData(forage || []);
        setUpcomingForage(upcoming || []);
        setExpenses(expenseData || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hives = data?.hives || [];
  const apiaries = data?.apiaries || [];

  // Queen Age Risk Data
  const queenAgeData = {
    low: hives.filter((h: any) => h.queen_age_risk === 'low').map((h: any) => ({
      hiveId: h.name, apiaryName: h.apiary_name || 'Standalone', queenAge: h.queen_age || 0, riskLevel: 'low' as const,
    })),
    medium: hives.filter((h: any) => h.queen_age_risk === 'medium').map((h: any) => ({
      hiveId: h.name, apiaryName: h.apiary_name || 'Standalone', queenAge: h.queen_age || 0, riskLevel: 'medium' as const,
    })),
    high: hives.filter((h: any) => h.queen_age_risk === 'high').map((h: any) => ({
      hiveId: h.name, apiaryName: h.apiary_name || 'Standalone', queenAge: h.queen_age || 0, riskLevel: 'high' as const,
    })),
  };

  // Hive chart data
  const hiveChartData = hives.slice(0, 6).map((h: any) => ({ hiveId: h.name, performance: 1 }));

  // Not inspected in 14 days
  const notInspected14d = hives.filter((h: any) => {
    if (!h.last_inspection_date) return true;
    const last = new Date(h.last_inspection_date);
    if (Number.isNaN(last.getTime())) return true;
    return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)) > 14;
  }).length;

  // KPI Cards
  const kpiCards = useMemo(() => {
    if (!data) return [];
    return [
      { title: 'Apiaries', value: data.stats.totalApiaries.toString(), color: 'emerald' as const, alert: false },
      { title: 'Total Hives', value: data.stats.totalHives.toString(), color: 'amber' as const, alert: false },
      { title: 'Active', value: data.stats.activeHives.toString(), color: 'blue' as const, alert: false },
      { title: 'Not Insp.', value: notInspected14d.toString(), color: 'red' as const, alert: notInspected14d > 0 },
      { title: 'Expenses', value: `Rs.${expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0).toFixed(0)}`, color: 'red' as const, alert: false },
      { title: 'Active Api.', value: String(data.stats.activeApiaries || 0), color: 'emerald' as const, alert: false },
    ];
  }, [data, notInspected14d, expenses]);

  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative overflow-hidden">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        activeTab="dashboard"
        onNavigate={handleNavigate}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />

      {/* Header */}
      <MobileHeader
        userName={user?.name}
        district={user?.district}
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onViewAllNotifications={() => onNavigate('notifications')}
      />

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* KPI Cards - Compact 3-column grid */}
            <div className="grid grid-cols-3 gap-2">
              {kpiCards.map((card) => (
                <KPICard key={card.title} title={card.title} value={card.value} color={card.color} alert={card.alert} />
              ))}
            </div>

            {/* Queen Age Risk Section */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Queen Age Risk Status</h2>

              {/* Risk Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setQueenRiskView('low')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${queenRiskView === 'low' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  Low Risk
                </button>
                <button onClick={() => setQueenRiskView('medium')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${queenRiskView === 'medium' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                  Medium
                </button>
                <button onClick={() => setQueenRiskView('high')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${queenRiskView === 'high' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                  High Risk
                </button>
              </div>

              {/* Risk Info */}
              <div className={`p-4 rounded-lg mb-4 ${queenRiskView === 'low' ? 'bg-emerald-50 border border-emerald-200' : queenRiskView === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                {queenRiskView === 'low' && <><p className="text-emerald-900 font-medium mb-1">Age: &lt; 1.5 years • Healthy</p><p className="text-emerald-700 text-sm">No action required</p></>}
                {queenRiskView === 'medium' && <><p className="text-amber-900 font-medium mb-1">Age: 1.5 – 2.5 years • Monitor</p><p className="text-amber-700 text-sm">Plan queen replacement</p></>}
                {queenRiskView === 'high' && <><p className="text-red-900 font-medium mb-1">Age: &gt; 2.5 years • Critical</p><p className="text-red-700 text-sm">Change queen soon</p></>}
              </div>

              {/* Hive Records */}
              <div className="space-y-2">
                {queenAgeData[queenRiskView].length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">No hives in this category</p>
                ) : (
                  queenAgeData[queenRiskView].map((hive) => (
                    <div key={hive.hiveId} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div><p className="font-medium text-stone-800">{hive.hiveId}</p><p className="text-sm text-stone-600">{hive.apiaryName}</p></div>
                      <div className="text-right">
                        <p className="font-medium text-stone-800">{hive.queenAge} years</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${hive.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700' : hive.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {hive.riskLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Best Performing Hives */}
            {hiveChartData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-bold text-stone-800 mb-4">Hive Overview</h2>
                <p className="text-sm text-stone-600 mb-4">Your registered hives</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hiveChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hiveId" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="performance" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Forage Calendar */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" /> Forage Calendar
              </h2>

              {/* Forage Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setForageTab('current')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${forageTab === 'current' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                  Current Blooming
                </button>
                <button onClick={() => setForageTab('upcoming')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${forageTab === 'upcoming' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                  Upcoming
                </button>
              </div>

              {/* Forage List */}
              {forageTab === 'current' ? (
                forageData.length > 0 ? (
                  <div className="space-y-2">
                    {forageData.map((plant: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-800">{plant.name}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${plant.availability === 'abundant' ? 'bg-emerald-200 text-emerald-800' : plant.availability === 'moderate' ? 'bg-amber-200 text-amber-800' : 'bg-stone-200 text-stone-700'}`}>
                            {plant.availability}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600"><em>{plant.scientific}</em> • {plant.resourceType}</p>
                        {plant.note && <p className="text-xs text-stone-500 mt-1">{plant.note}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-stone-500 text-sm py-4">No major forage plants currently blooming</p>
                )
              ) : (
                upcomingForage.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingForage.map((plant: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-800">{plant.name}</span>
                          <span className="text-xs text-amber-700">Month {plant.bloomStart}–{plant.bloomEnd}</span>
                        </div>
                        <p className="text-xs text-stone-600"><em>{plant.scientific}</em> • {plant.resourceType}</p>
                        {plant.note && <p className="text-xs text-stone-500 mt-1">{plant.note}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-stone-500 text-sm py-4">No upcoming forage data</p>
                )
              )}

              <button onClick={() => onNavigate('planning')} className="w-full mt-4 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm">
                View Full Forage Analysis
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onNavigate('apiaries')} className="bg-emerald-50 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-100 transition-colors">View Apiaries</button>
                <button onClick={() => onNavigate('hives')} className="bg-amber-50 text-amber-700 py-3 rounded-xl font-medium hover:bg-amber-100 transition-colors">View Hives</button>
                <button onClick={() => onNavigate('planning')} className="bg-blue-50 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors">Planning</button>
                <button onClick={() => onNavigate('finance')} className="bg-purple-50 text-purple-700 py-3 rounded-xl font-medium hover:bg-purple-100 transition-colors">Finance</button>
              </div>
            </div>

            {/* Recent Apiaries */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Recent Apiaries</h2>
              {apiaries.length === 0 ? (
                <p className="text-stone-500 text-center py-4">No apiaries yet. Create your first apiary!</p>
              ) : (
                <div className="space-y-3">
                  {apiaries.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-800">{a.name}</p>
                        <p className="text-sm text-stone-600">{a.district} — {a.hive_count} hives</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── KPI Card (Compact design from GetUIfromThis) ──────────────────────── */

interface KPICardProps {
  title: string;
  value: string;
  color: 'emerald' | 'amber' | 'red' | 'blue';
  alert?: boolean;
}

function KPICard({ title, value, color, alert }: KPICardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };
  return (
    <div className="bg-white rounded-lg p-2.5 shadow-sm relative">
      <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-lg ${colorClasses[color]}`} />
      {alert && <AlertTriangle className="absolute top-1.5 right-1.5 w-3 h-3 text-red-500" />}
      <p className="text-stone-600 text-[10px] mb-0.5 leading-tight">{title}</p>
      <p className="text-xl font-bold text-stone-800 leading-none">{value}</p>
    </div>
  );
}
