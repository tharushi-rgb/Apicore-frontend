import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="dashboard" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        notificationCount={alerts.filter(a => !a.is_read).length} onNotificationClick={() => setShowNotifications(!showNotifications)}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNotifications(false)}>
          <div className="absolute top-20 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800">Recent Alerts</h2>
              <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-stone-500 text-center py-4">No alerts</p>}
              {alerts.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border-l-4 ${a.type === 'critical' ? 'bg-red-50 border-red-500' : a.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'}`}>
                  <div className="flex items-start gap-3">
                    {a.type === 'critical' ? <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> : a.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                    <p className="text-stone-700 text-sm">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <KPICard title="Total Apiaries" value={String(stats?.totalApiaries || 0)} color="emerald" />
              <KPICard title="Total Hives" value={String(stats?.totalHives || 0)} color="amber" />
              <KPICard title="Active Hives" value={String(stats?.activeHives || 0)} color="blue" />
              <KPICard title="Total Harvests" value={String(stats?.totalHarvests || 0)} color="amber" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-stone-600 text-sm mb-1">Honey Harvested</p>
                <p className="text-2xl font-bold text-stone-800">{stats?.totalHoneyKg || 0} kg</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-stone-600 text-sm mb-1">Active Apiaries</p>
                <p className="text-2xl font-bold text-stone-800">{stats?.activeApiaries || 0}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onNavigate('apiaries')} className="bg-emerald-50 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-100 transition-colors">View Apiaries</button>
                <button onClick={() => onNavigate('hives')} className="bg-amber-50 text-amber-700 py-3 rounded-xl font-medium hover:bg-amber-100 transition-colors">View Hives</button>
                <button onClick={() => onNavigate('harvest')} className="bg-blue-50 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors">Record Harvest</button>
                <button onClick={() => onNavigate('finance')} className="bg-purple-50 text-purple-700 py-3 rounded-xl font-medium hover:bg-purple-100 transition-colors">Finance</button>
              </div>
            </div>

            {/* Hives Chart */}
            {hiveChartData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-bold text-stone-800 mb-4">Hive Overview</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hiveChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Apiaries */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Recent Apiaries</h2>
              {(data?.apiaries || []).length === 0 ? (
                <p className="text-stone-500 text-center py-4">No apiaries yet. Create your first apiary!</p>
              ) : (
                <div className="space-y-3">
                  {(data?.apiaries || []).slice(0, 5).map(a => (
                    <div key={a.id} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-800">{a.name}</p>
                        <p className="text-sm text-stone-600">{a.district} • {a.hive_count} hives</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{a.status}</span>
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

function KPICard({ title, value, color }: { title: string; value: string; color: 'emerald' | 'amber' | 'red' | 'blue' }) {
  const bg = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500' }[color];
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm relative">
      <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl-lg ${bg}`} />
      <p className="text-stone-600 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-stone-800">{value}</p>
    </div>
  );
}
