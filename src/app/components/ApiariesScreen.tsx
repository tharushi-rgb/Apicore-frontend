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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/30 to-emerald-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="apiaries" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-3 py-3 space-y-3 flex-1 overflow-y-auto pb-16">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-2.5 text-center text-white shadow-md">
              <p className="text-lg font-black">{apiaries.length}</p>
              <p className="text-[9px] font-medium text-emerald-100 uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2.5 text-center text-white shadow-md">
              <p className="text-lg font-black">{apiaries.filter(a=>a.status==='active').length}</p>
              <p className="text-[9px] font-medium text-amber-100 uppercase tracking-wider">Active</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2.5 text-center text-white shadow-md">
              <p className="text-lg font-black">{apiaries.reduce((s, a) => s + (a.hive_count || 0), 0)}</p>
              <p className="text-[9px] font-medium text-blue-100 uppercase tracking-wider">Hives</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white/80 border border-stone-200 rounded-xl text-xs focus:border-amber-500 focus:outline-none" placeholder="Search apiaries..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/80 border border-stone-200 rounded-xl px-2 py-2 text-xs focus:border-amber-500 focus:outline-none">
              <option value="all">All</option><option value="active">Active</option><option value="empty">Empty</option><option value="expired">Expired</option>
            </select>
          </div>

          {/* Create Button */}
          <button onClick={onCreateApiary} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-amber-200/40 text-xs">
            <Plus className="w-4 h-4" /> Create New Apiary
          </button>

          {/* Apiary List */}
          {loading ? (
            <div className="flex flex-col items-center py-12"><div className="animate-spin h-7 w-7 border-3 border-amber-500 border-t-transparent rounded-full" /><p className="text-[10px] text-stone-400 mt-2">Loading apiaries...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><span className="text-4xl">🏕️</span><p className="text-stone-400 text-xs mt-2">No apiaries found</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(a => (
                <div key={a.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-800 text-xs truncate">{a.name}</h3>
                      <p className="text-[10px] text-stone-500 flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{a.district}{a.area ? `, ${a.area}` : ''}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.status==='active'?'bg-emerald-100 text-emerald-700':a.status==='expired'?'bg-red-100 text-red-700':'bg-stone-100 text-stone-600'}`}>{a.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-stone-500">
                      <span>🐝 {a.hive_count || 0} hives</span>
                      {a.forage_primary && <span>🌿 {a.forage_primary}</span>}
                    </div>
                    <div className="flex gap-1">
                      {onViewApiary && <button onClick={() => onViewApiary(a.id)} className="p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye className="w-3.5 h-3.5 text-blue-600" /></button>}
                      {onAddHive && <button onClick={() => onAddHive(a)} className="p-1.5 bg-amber-50 rounded-lg hover:bg-amber-100"><Plus className="w-3.5 h-3.5 text-amber-600" /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
