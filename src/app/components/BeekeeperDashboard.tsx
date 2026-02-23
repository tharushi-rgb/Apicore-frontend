import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, TrendingUp, MapPin, Hexagon, Package, Droplets, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

  const pieData = [
    { name: 'Active', value: stats?.activeHives || 0, color: '#10b981' },
    { name: 'Inactive', value: (stats?.totalHives || 0) - (stats?.activeHives || 0), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/30 to-emerald-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="dashboard" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-full">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          notificationCount={alerts.filter(a => !a.is_read).length} onNotificationClick={() => setShowNotifications(!showNotifications)}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {showNotifications && (
          <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowNotifications(false)}>
            <div className="absolute top-14 right-3 left-3 bg-white rounded-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-stone-800">⚠️ Recent Alerts</h2>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {alerts.length === 0 && <p className="text-stone-400 text-center py-3 text-xs">No alerts — all good! 🎉</p>}
                {alerts.map(a => (
                  <div key={a.id} className={`p-3 rounded-xl border-l-3 text-xs ${a.type === 'critical' ? 'bg-red-50 border-l-red-500' : a.type === 'warning' ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-50 border-l-blue-500'}`}>
                    <div className="flex items-start gap-2">
                      {a.type === 'critical' ? <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" /> : a.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />}
                      <p className="text-stone-700">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-3 py-4 space-y-3 flex-1 overflow-y-auto pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full" />
              <p className="text-xs text-stone-400 mt-3">Loading your apiary data...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards — colorful gradient cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 text-white shadow-lg shadow-emerald-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-emerald-100 text-[10px] font-medium uppercase tracking-wider">Apiaries</span>
                    <span className="text-lg">📍</span>
                  </div>
                  <p className="text-2xl font-black">{stats?.totalApiaries || 0}</p>
                  <p className="text-emerald-200 text-[10px]">{stats?.activeApiaries || 0} active</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-3 text-white shadow-lg shadow-amber-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-amber-100 text-[10px] font-medium uppercase tracking-wider">Hives</span>
                    <span className="text-lg">🐝</span>
                  </div>
                  <p className="text-2xl font-black">{stats?.totalHives || 0}</p>
                  <p className="text-amber-200 text-[10px]">{stats?.activeHives || 0} active</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-3 text-white shadow-lg shadow-yellow-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-yellow-100 text-[10px] font-medium uppercase tracking-wider">Honey</span>
                    <span className="text-lg">🍯</span>
                  </div>
                  <p className="text-2xl font-black">{stats?.totalHoneyKg || 0}<span className="text-sm font-bold"> kg</span></p>
                  <p className="text-yellow-200 text-[10px]">Total harvested</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 text-white shadow-lg shadow-blue-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-blue-100 text-[10px] font-medium uppercase tracking-wider">Harvests</span>
                    <span className="text-lg">📦</span>
                  </div>
                  <p className="text-2xl font-black">{stats?.totalHarvests || 0}</p>
                  <p className="text-blue-200 text-[10px]">Total records</p>
                </div>
              </div>

              {/* Quick Actions — colorful buttons */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-stone-100">
                <h2 className="text-xs font-bold text-stone-700 mb-2">⚡ Quick Actions</h2>
                <div className="grid grid-cols-4 gap-1.5">
                  <button onClick={() => onNavigate('apiaries')} className="flex flex-col items-center gap-1 p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                    <span className="text-lg">📍</span>
                    <span className="text-[9px] font-semibold text-emerald-700">Apiaries</span>
                  </button>
                  <button onClick={() => onNavigate('hives')} className="flex flex-col items-center gap-1 p-2 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors">
                    <span className="text-lg">🐝</span>
                    <span className="text-[9px] font-semibold text-amber-700">Hives</span>
                  </button>
                  <button onClick={() => onNavigate('harvest')} className="flex flex-col items-center gap-1 p-2 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors">
                    <span className="text-lg">🍯</span>
                    <span className="text-[9px] font-semibold text-orange-700">Harvest</span>
                  </button>
                  <button onClick={() => onNavigate('planning')} className="flex flex-col items-center gap-1 p-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                    <span className="text-lg">📋</span>
                    <span className="text-[9px] font-semibold text-blue-700">Plan</span>
                  </button>
                  <button onClick={() => onNavigate('finance')} className="flex flex-col items-center gap-1 p-2 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                    <span className="text-lg">💰</span>
                    <span className="text-[9px] font-semibold text-green-700">Finance</span>
                  </button>
                  <button onClick={() => onNavigate('clients')} className="flex flex-col items-center gap-1 p-2 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
                    <span className="text-lg">🤝</span>
                    <span className="text-[9px] font-semibold text-purple-700">Clients</span>
                  </button>
                  <button onClick={() => onNavigate('notifications')} className="flex flex-col items-center gap-1 p-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                    <span className="text-lg">🔔</span>
                    <span className="text-[9px] font-semibold text-rose-700">Alerts</span>
                  </button>
                  <button onClick={() => onNavigate('profile')} className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                    <span className="text-lg">👤</span>
                    <span className="text-[9px] font-semibold text-slate-700">Profile</span>
                  </button>
                </div>
              </div>

              {/* Alerts Banner */}
              {alerts.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100/50">
                  <h3 className="text-xs font-bold text-red-700 mb-2">🚨 Attention Required ({alerts.filter(a => !a.is_read).length})</h3>
                  <div className="space-y-1.5">
                    {alerts.slice(0, 3).map(a => (
                      <div key={a.id} className={`flex items-center gap-2 text-[11px] p-2 rounded-lg ${a.type === 'critical' ? 'bg-red-100/50 text-red-700' : a.type === 'warning' ? 'bg-amber-100/50 text-amber-700' : 'bg-blue-100/50 text-blue-700'}`}>
                        {a.type === 'critical' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                        <span className="flex-1 line-clamp-1">{a.message}</span>
                      </div>
                    ))}
                    {alerts.length > 3 && (
                      <button onClick={() => onNavigate('notifications')} className="text-[10px] text-amber-600 font-semibold hover:underline">
                        View all {alerts.length} alerts →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Hives Chart */}
              {hiveChartData.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-stone-100">
                  <h2 className="text-xs font-bold text-stone-700 mb-2">📊 Hive Overview</h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={hiveChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-stone-700">📍 Recent Apiaries</h2>
                  <button onClick={() => onNavigate('apiaries')} className="text-[10px] text-amber-600 font-semibold hover:underline">View all →</button>
                </div>
                {(data?.apiaries || []).length === 0 ? (
                  <div className="text-center py-6">
                    <span className="text-3xl">🏕️</span>
                    <p className="text-stone-400 text-xs mt-2">No apiaries yet</p>
                    <button onClick={() => onNavigate('apiaries')} className="mt-2 text-[10px] bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-medium">Create First Apiary</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(data?.apiaries || []).slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center gap-2.5 p-2 bg-stone-50/80 rounded-lg hover:bg-stone-100/80 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${a.status === 'active' ? 'bg-emerald-100' : 'bg-stone-100'}`}>
                          {a.status === 'active' ? '🟢' : '⚪'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800 text-xs truncate">{a.name}</p>
                          <p className="text-[10px] text-stone-500">{a.district} • {a.hive_count} hives</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{a.status}</span>
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
