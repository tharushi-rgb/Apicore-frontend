import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { HelperSidebar, type HelperNavTab } from './HelperSidebar';
import { authService } from '../services/auth';
import { helpersService } from '../services/helpers';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: HelperNavTab) => void;
  onViewHive: (id: number) => void; onLogout: () => void;
}

export function HelperMyApiariesScreen({ selectedLanguage, onLanguageChange, onNavigate, onViewHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiaries, setApiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    helpersService.getMyAssignments().then(assignments => {
      // Group by apiary
      const apiaryMap: Record<string, { name: string; district?: string; hives: any[] }> = {};
      assignments.forEach((a: any) => {
        const key = a.apiary_name || 'Standalone';
        if (!apiaryMap[key]) apiaryMap[key] = { name: key, district: a.district, hives: [] };
        apiaryMap[key].hives.push(a);
      });
      setApiaries(Object.values(apiaryMap));
    // ...existing code...
    }).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gradient-to-b from-emerald-50 via-teal-50/30 to-emerald-50 text-stone-800 font-sans">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="myApiaries" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-4 space-y-3">
          <h2 className="text-[15px] font-bold text-stone-800">📍 My Apiaries</h2>
// ...existing code...

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> :
          apiaries.length === 0 ? (
            <div className="text-center py-12"><MapPin className="w-10 h-10 text-stone-300 mx-auto mb-3" /><p className="text-[12px] text-stone-500">No apiaries with your hives</p></div>
          ) : (
            <div className="space-y-3">{apiaries.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-emerald-600" /></div>
                  <div><h3 className="text-[13px] font-bold text-stone-800">{a.name}</h3>{a.district && <p className="text-[10px] text-stone-500">{a.district}</p>}</div>
                </div>
                <div className="space-y-1.5">
                  {a.hives.map((h: any) => (
                    <button key={h.hive_id || h.id} onClick={() => onViewHive(h.hive_id || h.id)} className="w-full text-left p-2 bg-stone-50 rounded-xl hover:bg-stone-100 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-stone-800">{h.hive_name || h.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{h.status || 'active'}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-2">{a.hives.length} hive{a.hives.length !== 1 ? 's' : ''} assigned</p>
              </div>
            ))}</div>
          )
        }
      </div>
    </div>
    </div>
  );
}
