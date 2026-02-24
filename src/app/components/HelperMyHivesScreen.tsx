import { useState, useEffect } from 'react';
import { Hexagon as HiveIcon, Star, Flag } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { HelperSidebar, type HelperNavTab } from './HelperSidebar';
import { authService } from '../services/auth';
import { helpersService } from '../services/helpers';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: HelperNavTab) => void;
  onViewHive: (id: number) => void; onLogout: () => void;
}

export function HelperMyHivesScreen({ selectedLanguage, onLanguageChange, onNavigate, onViewHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hives, setHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => { helpersService.getMyAssignments().then(setHives).catch(()=>{}).finally(() => setLoading(false)); }, []);

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };
  // ...existing code...
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', queenless: 'bg-red-100 text-red-700', inactive: 'bg-stone-100 text-stone-600', absconded: 'bg-purple-100 text-purple-700' };

  return (
    <div className="bg-gradient-to-b from-emerald-50 via-teal-50/30 to-emerald-50 text-stone-800 font-sans">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="myHives" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-4 space-y-3">
          <h2 className="text-[15px] font-bold text-stone-800">🐝 My Assigned Hives</h2>

          <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold">{hives.length}</p><p className="text-[10px] text-stone-500">Total</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold text-emerald-600">{hives.filter((h:any)=>h.status==='active').length}</p><p className="text-[10px] text-stone-500">Active</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold text-red-600">{hives.filter((h:any)=>h.status==='queenless').length}</p><p className="text-[10px] text-stone-500">Queenless</p></div>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> :
          hives.length === 0 ? (
            <div className="text-center py-12"><HiveIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" /><p className="text-[12px] text-stone-500">No hives assigned to you</p></div>
          ) : (
            <div className="space-y-2.5">{hives.map((h: any) => (
              <button key={h.hive_id || h.id} onClick={() => onViewHive(h.hive_id || h.id)} className="w-full text-left bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><HiveIcon className="w-4 h-4 text-amber-600" /></div>
                    <div>
                      <div className="flex items-center gap-1">
                        {h.is_starred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        {h.is_flagged && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
                        <h3 className="text-[13px] font-bold text-stone-800">{h.hive_name || h.name}</h3>
                      </div>
                      <p className="text-[11px] text-stone-500">{h.apiary_name || 'Standalone'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeColors[h.hive_type] || ''}`}>{h.hive_type || 'box'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[h.status] || ''}`}>{h.status || 'active'}</span>
                  </div>
                </div>
              </button>
            ))}</div>
          )
        }
      </div>
    </div>
    </div>
  );
}
