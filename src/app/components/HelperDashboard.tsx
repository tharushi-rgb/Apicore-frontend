import { useState, useEffect } from 'react';
import { Hexagon as HiveIcon, MapPin, AlertTriangle, ClipboardList } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { HelperSidebar, type HelperNavTab } from './HelperSidebar';
import { authService } from '../services/auth';
import { helpersService } from '../services/helpers';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: HelperNavTab) => void;
  onViewHive: (id: number) => void; onLogout: () => void;
}

interface HelperDashboardData {
  assigned_hives?: any[];
  total_hives?: number;
  total_apiaries?: number;
  recent_inspections?: any[];
}

export function HelperDashboard({ selectedLanguage, onLanguageChange, onNavigate, onViewHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<HelperDashboardData>({});
  const [loading, setLoading] = useState(true);
  // ...existing code...
  const user = authService.getLocalUser();

  return (
    <div className="bg-gradient-to-b from-emerald-50 via-teal-50/30 to-emerald-50 text-stone-800 font-sans">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="dashboard" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-5 space-y-4">
          <h2 className="text-[15px] font-bold text-stone-800">👋 Welcome, {user?.name || 'Helper'}!</h2>
// ...existing code...

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 rounded-2xl p-4 text-center">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-1.5"><HiveIcon className="w-4 h-4 text-white" /></div>
                <p className="text-[15px] font-bold">{data.total_hives || data.assigned_hives?.length || 0}</p>
                <p className="text-[10px] text-emerald-100">Assigned Hives</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 rounded-2xl p-4 text-center">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-1.5"><MapPin className="w-4 h-4 text-white" /></div>
                <p className="text-[15px] font-bold">{data.total_apiaries || 0}</p>
                <p className="text-[10px] text-teal-100">Apiaries</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onNavigate('myHives')} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 rounded-2xl font-medium flex items-center justify-center gap-2 text-[12px] shadow-sm shadow-amber-500/20"><HiveIcon className="w-3.5 h-3.5" /> My Hives</button>
              <button onClick={() => onNavigate('myApiaries')} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-2xl font-medium flex items-center justify-center gap-2 text-[12px] shadow-sm shadow-emerald-500/20"><MapPin className="w-3.5 h-3.5" /> My Apiaries</button>
            </div>

            {/* Assigned hives */}
            {data.assigned_hives && data.assigned_hives.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
                <h3 className="text-[13px] font-bold text-stone-800 mb-3">Your Assigned Hives</h3>
                <div className="space-y-2">
                  {data.assigned_hives.slice(0, 5).map((h: any) => (
                    <button key={h.hive_id || h.id} onClick={() => onViewHive(h.hive_id || h.id)} className="w-full text-left p-2.5 bg-stone-50/80 rounded-xl hover:bg-stone-100/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><HiveIcon className="w-3.5 h-3.5 text-amber-600" /></div>
                          <div><p className="text-[12px] font-medium text-stone-800">{h.hive_name || h.name}</p><p className="text-[10px] text-stone-500">{h.apiary_name || ''}</p></div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{h.status || 'active'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!data.assigned_hives || data.assigned_hives.length === 0) && (
              <div className="text-center py-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><ClipboardList className="w-6 h-6 text-stone-400" /></div>
                <p className="text-[12px] text-stone-500">No hives assigned yet</p>
                <p className="text-[10px] text-stone-400">Your beekeeper will assign hives to you</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
