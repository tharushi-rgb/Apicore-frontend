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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="apiaries" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-4 space-y-3">
          {/* Stats */}
        <h2 className="text-[13px] font-bold text-stone-800">Overview</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-500 text-[10px] font-medium uppercase">Total</p><p className="text-[15px] font-bold text-stone-800">{apiaries.length}</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-500 text-[10px] font-medium uppercase">Active</p><p className="text-[15px] font-bold text-emerald-600">{apiaries.filter(a=>a.status==='active').length}</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-500 text-[10px] font-medium uppercase">Empty</p><p className="text-[15px] font-bold text-amber-600">{apiaries.filter(a=>a.status==='empty').length}</p></div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" placeholder="Search apiaries..." />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors">
            <option value="all">All</option><option value="active">Active</option><option value="empty">Empty</option><option value="expired">Expired</option>
          </select>
        </div>

        {/* Create Button */}
        <button onClick={onCreateApiary} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-2xl font-medium text-[13px] flex items-center justify-center gap-2 shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4" /> Add Apiary
        </button>

        {/* Apiary List */}
        <h2 className="text-[13px] font-bold text-stone-800">Your Apiaries</h2>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-7 w-7 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12"><MapPin className="w-10 h-10 text-stone-300 mx-auto mb-3" /><p className="text-stone-400 text-[12px]">No apiaries found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-stone-800 truncate">{a.name}</h3>
                    <p className="text-[12px] text-stone-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{a.district}{a.area ? `, ${a.area}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.status==='active'?'bg-emerald-100 text-emerald-700':a.status==='expired'?'bg-red-100 text-red-700':'bg-stone-100 text-stone-600'}`}>{a.status}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pl-12">
                  <div className="flex items-center gap-3 text-[12px] text-stone-500">
                    <span>{a.hive_count || 0} hives</span>
                    {a.forage_primary && <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 rounded-full text-amber-700">{a.forage_primary}</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {onViewApiary && <button onClick={() => onViewApiary(a.id)} className="p-1.5 bg-blue-50 rounded-xl hover:bg-blue-100"><Eye className="w-3.5 h-3.5 text-blue-600" /></button>}
                    {onAddHive && <button onClick={() => onAddHive(a)} className="p-1.5 bg-amber-50 rounded-xl hover:bg-amber-100"><Plus className="w-3.5 h-3.5 text-amber-600" /></button>}
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
