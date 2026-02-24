import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Hexagon, MapPin, TrendingUp, Droplets, Bug, Activity, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { dashboardService, type DashboardData } from '../services/dashboard';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

export function BeekeeperDashboard({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    dashboardService.get().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const alerts = data?.alerts || [];
  const hiveChartData = (data?.hives || []).slice(0, 5).map(h => ({ name: h.name, value: 1 }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="dashboard" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          notificationCount={alerts.filter(a => !a.is_read).length} onNotificationClick={() => setShowNotifications(!showNotifications)}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {showNotifications && (
          <div className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
            <div className="absolute top-16 right-3 left-3 bg-white rounded-2xl shadow-2xl p-4 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-stone-800">Recent Alerts</h2>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {alerts.length === 0 && <p className="text-stone-400 text-center py-6 text-[13px]">No alerts yet 🐝</p>}
                {alerts.map(a => (
                  <div key={a.id} className={`p-3 rounded-xl border-l-4 ${a.type === 'critical' ? 'bg-red-50 border-red-500' : a.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex items-start gap-2">
                      {a.type === 'critical' ? <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /> : a.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                      <p className="text-stone-700 text-[12px]">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="px-3 py-4 space-y-4">
              {/* KPI Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3 text-white shadow-md shadow-emerald-500/20">
                  <MapPin className="w-4 h-4 opacity-80 mb-1" />
                  <p className="text-xl font-bold">{stats?.totalApiaries || 0}</p>
                  <p className="text-[10px] opacity-80 font-medium">Apiaries</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-3 text-white shadow-md shadow-amber-500/20">
                  <Hexagon className="w-4 h-4 opacity-80 mb-1" />
                  <p className="text-xl font-bold">{stats?.totalHives || 0}</p>
                  <p className="text-[10px] opacity-80 font-medium">Hives</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white shadow-md shadow-blue-500/20">
                  <Activity className="w-4 h-4 opacity-80 mb-1" />
                  <p className="text-xl font-bold">{stats?.activeHives || 0}</p>
                  <p className="text-[10px] opacity-80 font-medium">Active</p>
                </div>
              </div>

              {/* Honey & Harvest Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-amber-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-amber-100 rounded-lg"><Droplets className="w-3.5 h-3.5 text-amber-600" /></div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Honey</p>
                  </div>
                  <p className="text-lg font-bold text-stone-800">{stats?.totalHoneyKg || 0} <span className="text-[11px] text-stone-400 font-medium">kg</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-emerald-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-emerald-100 rounded-lg"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /></div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Harvests</p>
                  </div>
                  <p className="text-lg font-bold text-stone-800">{stats?.totalHarvests || 0} <span className="text-[11px] text-stone-400 font-medium">total</span></p>
                </div>
              </div>

              {/* Active Alerts Banner */}
              {alerts.filter(a => !a.is_read).length > 0 && (
                <button onClick={() => setShowNotifications(true)} className="w-full bg-gradient-to-r from-red-50 to-orange-50 border border-red-100/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                  <div className="flex-1 text-left">
                    <p className="text-[12px] font-bold text-stone-800">{alerts.filter(a => !a.is_read).length} Active Alerts</p>
                    <p className="text-[10px] text-stone-400">Tap to review your notifications</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                </button>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-[13px] font-bold text-stone-800 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Apiaries', icon: <MapPin className="w-5 h-5" />, tab: 'apiaries' as NavTab, bg: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-500/20' },
                    { label: 'Hives', icon: <Hexagon className="w-5 h-5" />, tab: 'hives' as NavTab, bg: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
                    { label: 'Harvest', icon: <Droplets className="w-5 h-5" />, tab: 'harvest' as NavTab, bg: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-500/20' },
                    { label: 'Finance', icon: <TrendingUp className="w-5 h-5" />, tab: 'finance' as NavTab, bg: 'from-purple-400 to-purple-500', shadow: 'shadow-purple-500/20' },
                  ].map(a => (
                    <button key={a.label} onClick={() => onNavigate(a.tab)} className="flex flex-col items-center gap-1.5">
                      <div className={`w-12 h-12 bg-gradient-to-br ${a.bg} rounded-2xl flex items-center justify-center text-white shadow-md ${a.shadow} hover:scale-105 transition-transform`}>
                        {a.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-stone-600">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hive Chart */}
              {hiveChartData.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h2 className="text-[13px] font-bold text-stone-800 mb-3">Hive Overview</h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={hiveChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                      <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Apiaries */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-bold text-stone-800">Recent Apiaries</h2>
                  <button onClick={() => onNavigate('apiaries')} className="text-[11px] text-amber-600 font-semibold">View All →</button>
                </div>
                {(data?.apiaries || []).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[20px] mb-1">🐝</p>
                    <p className="text-stone-400 text-[12px]">No apiaries yet. Create your first!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(data?.apiaries || []).slice(0, 4).map(a => (
                      <div key={a.id} className="p-2.5 bg-stone-50/80 rounded-xl flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.status === 'active' ? 'bg-emerald-100' : 'bg-stone-100'}`}>
                          <MapPin className={`w-4 h-4 ${a.status === 'active' ? 'text-emerald-600' : 'text-stone-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-stone-800 truncate">{a.name}</p>
                          <p className="text-[10px] text-stone-400">{a.district} • {a.hive_count} hives</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
