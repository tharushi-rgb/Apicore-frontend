import { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  Eye,
  Pencil,
  Search,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  AlertCircle,
  AlertTriangle,
  Hexagon as HiveIcon,
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { apiariesService, type Apiary } from '../services/apiaries';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateApiary: () => void; onViewHive?: () => void; onEditApiary?: (apiary: Apiary) => void;
  onAddHive?: (apiary: Apiary) => void; onViewApiary?: (id: number) => void; onLogout: () => void;
}

export function ApiariesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onEditApiary, onAddHive, onViewApiary, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'apiaries';

  useEffect(() => {
    apiariesService.getAll().then(a => { setApiaries(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalApiaries = apiaries.length;
  const apiariesWithHives = apiaries.filter(a => (a.hive_count || 0) > 0).length;
  const expiredApiaries = apiaries.filter(a => a.status === 'expired').length;

  const filtered = apiaries.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.district?.toLowerCase().includes(search.toLowerCase()) && !a.area?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'rainy': return <CloudRain className="w-5 h-5 text-blue-500" />;
      default: return <Cloud className="w-5 h-5 text-stone-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <MobileSidebar isOpen={isSidebarOpen} activeTab={activeTab} onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">Apiaries</h1>
            <p className="text-stone-500 text-sm mt-1">Manage all registered apiaries</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Summary Cards - Compact 3-column Grid */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard title="Total" value={totalApiaries.toString()} color="emerald" />
            <SummaryCard title="With Hives" value={apiariesWithHives.toString()} color="amber" />
            <SummaryCard title="Action Req." value={expiredApiaries.toString()} color="red" alert={expiredApiaries > 0} />
          </div>

          {apiaries.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <MapPin className="w-16 h-16 text-stone-300" />
                  <HiveIcon className="w-8 h-8 text-amber-400 absolute bottom-0 right-0" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">No apiaries created yet</h2>
              <p className="text-stone-600 mb-6">Add your first apiary to start managing hives</p>
              <button
                onClick={onCreateApiary}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Apiary
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search apiaries, districts, areas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-stone-800 mb-2">No apiaries found</h3>
                  <p className="text-stone-600">Try adjusting your search filters</p>
                </div>
              ) : (
                filtered.map((apiary) => (
                  <ApiaryCard
                    key={apiary.id}
                    apiary={apiary}
                    onView={() => onViewApiary?.(apiary.id)}
                    onEdit={() => onEditApiary?.(apiary)}
                    onAddHive={() => onAddHive?.(apiary)}
                    getWeatherIcon={getWeatherIcon}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      {apiaries.length > 0 && (
        <button
          onClick={onCreateApiary}
          className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryCard({ title, value, color, alert }: { title: string; value: string; color: 'emerald' | 'amber' | 'red'; alert?: boolean }) {
  const colorClasses = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div className="bg-white rounded-lg p-2.5 shadow-sm relative">
      <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-lg ${colorClasses[color]}`} />
      {alert && <AlertTriangle className="absolute top-1.5 right-1.5 w-3 h-3 text-red-500" />}
      <p className="text-stone-600 text-[10px] mb-0.5 leading-tight">{title}</p>
      <p className="text-xl font-bold text-stone-800 leading-none">{value}</p>
    </div>
  );
}

function ApiaryCard({ apiary, onView, onEdit, onAddHive, getWeatherIcon }: {
  apiary: Apiary; onView: () => void; onEdit: () => void; onAddHive: () => void;
  getWeatherIcon: (condition: string) => React.ReactNode;
}) {
  const statusConfig: Record<string, { label: string; textColor: string; bgColor: string }> = {
    active: { label: 'Active', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    empty: { label: 'Empty', textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
    expired: { label: 'Expired – Action Required', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  };
  const config = statusConfig[apiary.status] || statusConfig.active;

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${apiary.status === 'expired' ? 'border-l-4 border-red-500' : ''} ${apiary.status === 'empty' ? 'bg-stone-50/50' : ''}`}>
      <div className="p-5 space-y-4">
        {/* Top Row - Name and Status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-stone-800 flex-1">{apiary.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} whitespace-nowrap`}>
            {config.label}
          </span>
        </div>

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{apiary.district}{apiary.area ? ` / ${apiary.area}` : ''}</span>
          </div>
          {apiary.established_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Est. {apiary.established_date}</span>
            </div>
          )}
        </div>

        {/* Weather Preview */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getWeatherIcon('sunny')}
              <div>
                <p className="text-xl font-bold text-stone-800">28°C</p>
                <p className="text-xs text-stone-600">Sunny</p>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" title="sunny" />
              <div className="w-2 h-2 rounded-full bg-stone-400" title="cloudy" />
            </div>
          </div>
        </div>

        {/* Hives Snapshot */}
        {apiary.status === 'empty' || (apiary.hive_count || 0) === 0 ? (
          <div className="p-3 bg-stone-100 rounded-lg">
            <p className="text-stone-600 text-sm font-medium">No hives added</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-1 p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700 mb-1">Total Hives</p>
              <p className="text-2xl font-bold text-amber-900">{apiary.hive_count || 0}</p>
            </div>
          </div>
        )}

        {/* Forage Snapshot */}
        {(apiary.forage_primary || apiary.blooming_window) && (
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 mb-1">Primary Forage</p>
                <p className="font-bold text-emerald-900">{apiary.forage_primary || 'Mixed'}</p>
              </div>
              {apiary.blooming_window && (
                <div className="text-right">
                  <p className="text-xs text-emerald-700 mb-1">Blooming</p>
                  <p className="text-sm font-medium text-emerald-800">{apiary.blooming_window}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning for Expired */}
        {apiary.status === 'expired' && (
          <div className="p-3 bg-red-100 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">Contract renewal required</p>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onView}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">View</span>
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
          <button
            onClick={onAddHive}
            className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <HiveIcon className="w-4 h-4" />
            <span className="text-sm">Add Hive</span>
          </button>
        </div>
      </div>
    </div>
  );
}
