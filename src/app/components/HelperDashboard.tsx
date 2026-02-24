import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon as HiveIcon, MapPin, ClipboardList } from 'lucide-react';
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
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<HelperDashboardData>({});
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    helpersService.getMyAssignments()
      .then(assignments => {
        const apiaryNames = new Set(assignments.map((a: any) => a.apiary_name).filter(Boolean));
        setData({ assigned_hives: assignments, total_hives: assignments.length, total_apiaries: apiaryNames.size });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="dashboard" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => navigate('/helper/notifications')} />
        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">Welcome, {user?.name || 'Helper'}</h1>
          <p className="text-stone-500 text-sm mt-1">Helper Dashboard</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <HiveIcon className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-600">{data.total_hives || data.assigned_hives?.length || 0}</p>
                <p className="text-xs text-stone-500">Assigned Hives</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <MapPin className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{data.total_apiaries || 0}</p>
                <p className="text-xs text-stone-500">Apiaries</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onNavigate('myHives')} className="bg-amber-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"><HiveIcon className="w-4 h-4" /> My Hives</button>
              <button onClick={() => onNavigate('myApiaries')} className="bg-emerald-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"><MapPin className="w-4 h-4" /> My Apiaries</button>
            </div>

            {data.assigned_hives && data.assigned_hives.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-stone-800 mb-3">Your Assigned Hives</h3>
                <div className="space-y-2">
                  {data.assigned_hives.slice(0, 5).map((h: any) => (
                    <button key={h.hive_id || h.id} onClick={() => onViewHive(h.hive_id || h.id)} className="w-full text-left p-2 bg-stone-50 rounded-lg hover:bg-stone-100">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm font-medium text-stone-800">{h.hive_name || h.name}</p><p className="text-xs text-stone-500">{h.apiary_name || ''}</p></div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{h.status || 'active'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!data.assigned_hives || data.assigned_hives.length === 0) && (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No hives assigned yet</p>
                <p className="text-stone-400 text-sm">Your beekeeper will assign hives to you</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
