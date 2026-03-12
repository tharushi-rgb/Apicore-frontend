import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { dashboardService, type DashboardData } from '../services/dashboard';
import { planningService } from '../services/planning';
import { expensesService } from '../services/finance';
import { authService } from '../services/auth';
import { Leaf, Home, Hexagon as HiveIcon, MapPin, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { t } from '../i18n';

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
      { title: t('totalApiaries', selectedLanguage), value: data.stats.totalApiaries.toString(), color: 'emerald' as const, alert: false },
      { title: t('totalHives', selectedLanguage), value: data.stats.totalHives.toString(), color: 'amber' as const, alert: false },
      { title: t('activeHives', selectedLanguage), value: data.stats.activeHives.toString(), color: 'blue' as const, alert: false },
      { title: t('notInspected', selectedLanguage), value: notInspected14d.toString(), color: 'red' as const, alert: notInspected14d > 0 },
      { title: t('expenses', selectedLanguage), value: `Rs.${expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0).toFixed(0)}`, color: 'red' as const, alert: false },
      { title: t('activeApiaries', selectedLanguage), value: String(data.stats.activeApiaries || 0), color: 'emerald' as const, alert: false },
    ];
  }, [data, notInspected14d, expenses, selectedLanguage]);

  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
  };

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        activeTab="dashboard"
        onNavigate={handleNavigate}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        lang={selectedLanguage}
      />

      <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
      <MobileHeader
        userName={user?.name}
        district={user?.district}
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onViewAllNotifications={() => onNavigate('notifications')}
      />
      </div>

      {/* Main Content */}
      <div className="px-3 py-3 space-y-3">
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
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <h2 className="text-[0.875rem] font-bold text-stone-800 mb-3">{t('queenAgeRisk', selectedLanguage)}</h2>

              {/* Risk Tabs */}
              <div className="flex gap-1.5 mb-3">
                <button onClick={() => setQueenRiskView('low')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[0.75rem] font-medium transition-colors ${queenRiskView === 'low' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  {t('lowRisk', selectedLanguage)}
                </button>
                <button onClick={() => setQueenRiskView('medium')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[0.75rem] font-medium transition-colors ${queenRiskView === 'medium' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                  {t('mediumRisk', selectedLanguage)}
                </button>
                <button onClick={() => setQueenRiskView('high')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[0.75rem] font-medium transition-colors ${queenRiskView === 'high' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                  {t('highRisk', selectedLanguage)}
                </button>
              </div>

              {/* Risk Info */}
              <div className={`p-3 rounded-lg mb-3 ${queenRiskView === 'low' ? 'bg-emerald-50 border border-emerald-200' : queenRiskView === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                {queenRiskView === 'low' && <><p className="text-emerald-900 font-medium mb-0.5 text-[0.8rem]">{t('queenLowDesc', selectedLanguage)}</p><p className="text-emerald-700 text-[0.75rem]">{t('queenLowAction', selectedLanguage)}</p></>}
                {queenRiskView === 'medium' && <><p className="text-amber-900 font-medium mb-0.5 text-[0.8rem]">{t('queenMedDesc', selectedLanguage)}</p><p className="text-amber-700 text-[0.75rem]">{t('queenMedAction', selectedLanguage)}</p></>}
                {queenRiskView === 'high' && <><p className="text-red-900 font-medium mb-0.5 text-[0.8rem]">{t('queenHighDesc', selectedLanguage)}</p><p className="text-red-700 text-[0.75rem]">{t('queenHighAction', selectedLanguage)}</p></>}
              </div>

              {/* Hive Records */}
              <div className="space-y-2">
                {queenAgeData[queenRiskView].length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">{t('noHivesInCategory', selectedLanguage)}</p>
                ) : (
                  queenAgeData[queenRiskView].map((hive) => (
                    <div key={hive.hiveId} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg">
                      <div><p className="font-medium text-stone-800 text-[0.8rem]">{hive.hiveId}</p><p className="text-[0.7rem] text-stone-600">{hive.apiaryName}</p></div>
                      <div className="text-right">
                        <p className="font-medium text-stone-800 text-[0.8rem]">{hive.queenAge} years</p>
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
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h2 className="text-[0.875rem] font-bold text-stone-800 mb-2">{t('hiveOverview', selectedLanguage)}</h2>
                <p className="text-[0.75rem] text-stone-600 mb-3">{t('registeredHives', selectedLanguage)}</p>
                <ResponsiveContainer width="100%" height={200}>
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
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <h2 className="text-[0.875rem] font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" /> {t('forageCalendar', selectedLanguage)}
              </h2>

              {/* Forage Tabs */}
              <div className="flex gap-1.5 mb-3">
                <button onClick={() => setForageTab('current')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[0.75rem] font-medium transition-colors ${forageTab === 'current' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                  {t('currentBlooming', selectedLanguage)}
                </button>
                <button onClick={() => setForageTab('upcoming')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[0.75rem] font-medium transition-colors ${forageTab === 'upcoming' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                  {t('upcoming', selectedLanguage)}
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
                  <p className="text-center text-stone-500 text-sm py-4">{t('noForageBlooming', selectedLanguage)}</p>
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
                  <p className="text-center text-stone-500 text-sm py-4">{t('noForageBlooming', selectedLanguage)}</p>
                )
              )}

              <button onClick={() => onNavigate('planning')} className="w-full mt-4 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm">
                {t('viewFullForage', selectedLanguage)}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <h2 className="text-[0.875rem] font-bold text-stone-800 mb-3">{t('quickActions', selectedLanguage)}</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onNavigate('apiaries')} className="bg-emerald-50 text-emerald-700 py-2.5 rounded-xl text-[0.8rem] font-medium hover:bg-emerald-100 transition-colors">{t('viewApiaries', selectedLanguage)}</button>
                <button onClick={() => onNavigate('hives')} className="bg-amber-50 text-amber-700 py-2.5 rounded-xl text-[0.8rem] font-medium hover:bg-amber-100 transition-colors">{t('viewHives', selectedLanguage)}</button>
                <button onClick={() => onNavigate('planning')} className="bg-blue-50 text-blue-700 py-2.5 rounded-xl text-[0.8rem] font-medium hover:bg-blue-100 transition-colors">{t('planning', selectedLanguage)}</button>
                <button onClick={() => onNavigate('finance')} className="bg-purple-50 text-purple-700 py-2.5 rounded-xl text-[0.8rem] font-medium hover:bg-purple-100 transition-colors">{t('finance', selectedLanguage)}</button>
              </div>
            </div>

            {/* Recent Apiaries */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <h2 className="text-[0.875rem] font-bold text-stone-800 mb-3">{t('recentApiaries', selectedLanguage)}</h2>
              {apiaries.length === 0 ? (
                <p className="text-stone-500 text-center py-4">{t('noApiaries', selectedLanguage)}</p>
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
      <p className="text-stone-600 text-[9px] mb-0.5 leading-tight">{title}</p>
      <p className="text-[0.875rem] font-bold text-stone-800 leading-none">{value}</p>
    </div>
  );
}
