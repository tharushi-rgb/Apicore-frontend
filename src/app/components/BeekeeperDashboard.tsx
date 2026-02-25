import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { dashboardService, type DashboardData } from '../services/dashboard';
import { planningService } from '../services/planning';
import { authService } from '../services/auth';
import { Leaf, AlertCircle, Home, Hexagon as HiveIcon, MapPin, TrendingUp } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    Promise.all([
      dashboardService.get(),
      planningService.getForageByMonth(new Date().getMonth() + 1)
    ])
      .then(([dashData, forage]) => {
        setData(dashData);
        setForageData(forage || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const hives = data?.hives || [];
  
  // Chart data
  const hiveChartData = hives.slice(0, 5).map(h => ({ name: h.name, value: 1 }));
  
  // Hive health distribution
  const activeCount = hives.filter(h => h.status === 'active').length;
  const queenlessCount = hives.filter(h => h.status === 'queenless').length;
  const inactiveCount = hives.filter(h => h.status === 'inactive').length;
  const abscondedCount = hives.filter(h => h.status === 'absconded').length;

  const healthData = [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Queenless', value: queenlessCount, color: '#f59e0b' },
    { name: 'Absconded', value: abscondedCount, color: '#ef4444' },
    { name: 'Inactive', value: inactiveCount, color: '#9ca3af' },
  ].filter(item => item.value > 0);

  // Inspection status
  const today = new Date();
  const inspected30days = hives.filter(h => {
    if (!h.last_inspection_date) return false;
    try {
      const inspectDate = new Date(h.last_inspection_date);
      const diff = (today.getTime() - inspectDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    } catch {
      return false;
    }
  }).length;
  
  const inspectionData = [
    { name: 'Inspected (30d)', value: inspected30days, color: '#10b981' },
    { name: 'Overdue', value: (hives.length - inspected30days), color: '#ef4444' }
  ];

  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
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
      <div className="px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* KPI Cards - Compact Row */}
            <div className="grid grid-cols-2 gap-2">
              <KPICard title="Total Apiaries" value={String(stats?.totalApiaries || 0)} icon={<MapPin className="w-4 h-4" />} color="emerald" />
              <KPICard title="Total Hives" value={String(stats?.totalHives || 0)} icon={<HiveIcon className="w-4 h-4" />} color="amber" />
              <KPICard title="Active Hives" value={String(stats?.activeHives || 0)} icon={<TrendingUp className="w-4 h-4" />} color="blue" />
              <KPICard title="Active Apiaries" value={String(stats?.activeApiaries || 0)} icon={<Home className="w-4 h-4" />} color="emerald" />
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

            {/* Forage Information */}
            {forageData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-600" /> Currently Blooming Forage
                </h2>
                <div className="space-y-2">
                  {forageData.map((plant: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-800">{plant.name}</span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          plant.availability === 'abundant' ? 'bg-emerald-200 text-emerald-800' :
                          plant.availability === 'moderate' ? 'bg-amber-200 text-amber-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                          {plant.availability}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600"><em>{plant.scientific}</em> • {plant.resourceType}</p>
                      {plant.note && <p className="text-xs text-stone-500 mt-1">{plant.note}</p>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onNavigate('planning')}
                  className="w-full mt-4 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
                >
                  View Full Forage Analysis
                </button>
              </div>
            )}

            {/* Recent Apiaries */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Recent Apiaries</h2>
              {(data?.apiaries || []).length === 0 ? (
                <p className="text-stone-500 text-center py-4">No apiaries yet. Create your first apiary!</p>
              ) : (
                <div className="space-y-3">
                  {(data?.apiaries || []).slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-800">{a.name}</p>
                        <p className="text-sm text-stone-600">{a.district} -- {a.hive_count} hives</p>
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

function KPICard({ title, value, icon, color }: { title: string; value: string; icon?: React.ReactNode; color: 'emerald' | 'amber' | 'red' | 'blue' }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} rounded-lg p-3 shadow-sm border ${c.border}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-stone-600 text-xs font-medium">{title}</p>
        {icon && <div className={`${c.icon} opacity-70`}>{icon}</div>}
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}
