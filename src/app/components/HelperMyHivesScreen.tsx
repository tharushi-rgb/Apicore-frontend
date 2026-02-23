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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-8">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="myHives" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-4 py-6 space-y-4 flex-1 overflow-y-auto pb-20">
          <h2 className="text-xl font-bold text-stone-800">🐝 My Assigned Hives</h2>

          <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold">{hives.length}</p><p className="text-xs text-stone-500">Total</p></div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold text-emerald-600">{hives.filter((h:any)=>h.status==='active').length}</p><p className="text-xs text-stone-500">Active</p></div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold text-red-600">{hives.filter((h:any)=>h.status==='queenless').length}</p><p className="text-xs text-stone-500">Queenless</p></div>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> :
          hives.length === 0 ? (
            <div className="text-center py-12"><HiveIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No hives assigned to you</p></div>
          ) : (
            <div className="space-y-3">{hives.map((h: any) => (
              <button key={h.hive_id || h.id} onClick={() => onViewHive(h.hive_id || h.id)} className="w-full text-left bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {h.is_starred && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    {h.is_flagged && <Flag className="w-4 h-4 text-red-500 fill-red-500" />}
                    <h3 className="font-bold text-stone-800">{h.hive_name || h.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[h.hive_type] || ''}`}>{h.hive_type || 'box'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[h.status] || ''}`}>{h.status || 'active'}</span>
                  </div>
                </div>
                <p className="text-sm text-stone-500">{h.apiary_name || 'Standalone'}</p>
              </button>
            ))}</div>
          )
        }
      </div>
    </div>
    </div>
  );
}
