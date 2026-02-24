import { useState, useEffect } from 'react';
import { Plus, MapPin, Eye, Search } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { apiariesService, type Apiary } from '../services/apiaries';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const user = authService.getLocalUser();

  useEffect(() => { apiariesService.getAll().then(a => { setApiaries(a); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = apiaries.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.district?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="apiaries" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">Apiaries</h1>
          <p className="text-stone-500 text-sm mt-1">Manage all registered apiaries</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-stone-600 text-xs">Total</p>
            <p className="text-2xl font-bold text-stone-800">{apiaries.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-stone-600 text-xs">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{apiaries.filter(a => a.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-stone-600 text-xs">Empty</p>
            <p className="text-2xl font-bold text-amber-600">{apiaries.filter(a => a.status === 'empty').length}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none" placeholder="Search apiaries..." />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="empty">Empty</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Create Button */}
        <button onClick={onCreateApiary} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" /> Create New Apiary
        </button>

        {/* Apiary List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No apiaries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-800">{a.name}</h3>
                    <p className="text-sm text-stone-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {a.district}{a.area ? `, ${a.area}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    a.status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-stone-100 text-stone-600'
                  }`}>{a.status}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-sm text-stone-600">
                    <span>{a.hive_count || 0} hives</span>
                    {a.forage_primary && <span>{a.forage_primary}</span>}
                  </div>
                  <div className="flex gap-2">
                    {onViewApiary && (
                      <button onClick={() => onViewApiary(a.id)} className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    {onAddHive && (
                      <button onClick={() => onAddHive(a)} className="p-2 bg-amber-50 rounded-lg hover:bg-amber-100">
                        <Plus className="w-4 h-4 text-amber-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
