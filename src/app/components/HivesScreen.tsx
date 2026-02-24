import { useState, useEffect } from 'react';
import { Plus, Hexagon as HiveIcon, Search, Star, Flag } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { hivesService, type Hive } from '../services/hives';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateHive: () => void; onViewHive: (id: number) => void; onEditHive?: (hive: Hive) => void; onLogout: () => void;
}

export function HivesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateHive, onViewHive, onEditHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const user = authService.getLocalUser();

  useEffect(() => { hivesService.getAll().then(h => { setHives(h); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = hives.filter(h => {
    if (typeFilter !== 'all' && h.hive_type !== typeFilter) return false;
    if (statusFilter !== 'all' && h.status !== statusFilter) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.apiary_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };
  // ...existing code...
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', queenless: 'bg-red-100 text-red-700', inactive: 'bg-stone-100 text-stone-600', absconded: 'bg-purple-100 text-purple-700' };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="hives" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-600 text-[10px]">Total</p><p className="text-[15px] font-bold">{hives.length}</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-600 text-[10px]">Active</p><p className="text-[15px] font-bold text-emerald-600">{hives.filter(h=>h.status==='active').length}</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-600 text-[10px]">Queenless</p><p className="text-[15px] font-bold text-red-600">{hives.filter(h=>h.status==='queenless').length}</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-stone-600 text-[10px]">Starred</p><p className="text-[15px] font-bold text-amber-600">{hives.filter(h=>h.is_starred).length}</p></div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none" placeholder="Search hives..." />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50">
            <option value="all">All Types</option><option value="box">Box</option><option value="pot">Pot</option><option value="log">Log</option><option value="stingless">Stingless</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50">
            <option value="all">All Status</option><option value="active">Active</option><option value="queenless">Queenless</option><option value="inactive">Inactive</option><option value="absconded">Absconded</option>
          </select>
        </div>

        <button onClick={onCreateHive} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20">
          <Plus className="w-5 h-5" /> Create New Hive
        </button>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12"><HiveIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500 text-[12px]">No hives found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(h => (
              <button key={h.id} onClick={() => onViewHive(h.id)} className="w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><HiveIcon className="w-4 h-4 text-amber-600" /></div>
                    {h.is_starred ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : null}
                    {h.is_flagged ? <Flag className="w-4 h-4 text-red-500 fill-red-500" /> : null}
                    <h3 className="font-bold text-[13px] text-stone-800">{h.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeColors[h.hive_type] || ''}`}>{h.hive_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[h.status] || ''}`}>{h.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[12px] text-stone-600">
                  <span>{h.apiary_name || 'Standalone'}</span>
                  <span>{h.queen_present ? '♛ Queen present' : '⚠ Queenless'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
