import { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';
import { Calendar, MapPin, Hexagon as HiveIcon, Plus, AlertTriangle } from 'lucide-react';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateApiary: () => void; onCreateHive: () => void; onLogout: () => void;
}

export function HivePlanningScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onCreateHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    Promise.all([apiariesService.getAll(), hivesService.getAll()]).then(([a, h]) => { setApiaries(a); setHives(h); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const queenlessHives = hives.filter(h => !h.queen_present || h.status === 'queenless');
  const inactiveHives = hives.filter(h => h.status === 'inactive' || h.status === 'absconded');
  const activeApiaries = apiaries.filter(a => a.status === 'active');
  const activeHives = hives.filter(h => h.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="planning" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="px-4 py-6 space-y-4">
        <h2 className="text-xl font-bold text-stone-800">🗓 Hive Planning</h2>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm"><MapPin className="w-5 h-5 text-emerald-500 mb-1" /><p className="text-2xl font-bold">{activeApiaries.length}</p><p className="text-xs text-stone-500">Active Apiaries</p></div>
              <div className="bg-white rounded-xl p-4 shadow-sm"><HiveIcon className="w-5 h-5 text-amber-500 mb-1" /><p className="text-2xl font-bold">{activeHives.length}</p><p className="text-xs text-stone-500">Active Hives</p></div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onCreateApiary} className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" /> New Apiary</button>
              <button onClick={onCreateHive} className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" /> New Hive</button>
            </div>

            {/* Queenless Alert */}
            {queenlessHives.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><h3 className="font-bold text-red-700">Queenless Hives ({queenlessHives.length})</h3></div>
                <div className="space-y-1">{queenlessHives.map(h => (
                  <div key={h.id} className="flex items-center justify-between text-sm"><span className="text-red-800">{h.name}</span><span className="text-red-600 text-xs">{h.apiary_name || 'Standalone'}</span></div>
                ))}</div>
              </div>
            )}

            {/* Inactive/Absconded */}
            {inactiveHives.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-orange-700">Inactive / Absconded ({inactiveHives.length})</h3></div>
                <div className="space-y-1">{inactiveHives.map(h => (
                  <div key={h.id} className="flex items-center justify-between text-sm"><span className="text-orange-800">{h.name}</span><span className="text-orange-600 text-xs capitalize">{h.status}</span></div>
                ))}</div>
              </div>
            )}

            {/* Apiaries Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-3">Apiaries Overview</h3>
              {apiaries.length === 0 ? <p className="text-stone-500 text-sm">No apiaries yet</p> :
                <div className="space-y-2">{apiaries.map(a => {
                  const aHives = hives.filter(h => h.apiary_id === a.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                      <div><p className="text-sm font-medium text-stone-800">{a.name}</p><p className="text-xs text-stone-500">{a.district}</p></div>
                      <div className="text-right"><p className="text-sm font-bold">{aHives.length} hives</p><p className="text-xs text-stone-500">{aHives.filter(h=>h.status==='active').length} active</p></div>
                    </div>
                  );
                })}</div>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
