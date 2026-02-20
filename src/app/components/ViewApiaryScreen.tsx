import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Hexagon as HiveIcon, MapPin, Calendar, Clock, Trash2 } from 'lucide-react';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onBack: () => void; onAddHive: (apiaryId: number) => void; onEditApiary: (apiary: Apiary) => void;
  onViewHive: (id: number) => void; apiaryId: number; onLogout: () => void;
}

export function ViewApiaryScreen({ onBack, onAddHive, onEditApiary, onViewHive, apiaryId }: Props) {
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [hives, setHives] = useState<Hive[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hives' | 'history'>('hives');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!apiary) return;
    if (hives.length > 0) { alert('Cannot delete apiary with hives. Remove or move all hives first.'); return; }
    if (!confirm(`Delete apiary "${apiary.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await apiariesService.delete(apiary.id); onBack(); } catch { setDeleting(false); }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [a, h, hist] = await Promise.all([
          apiariesService.getById(apiaryId), hivesService.getAll(), apiariesService.getHistory(apiaryId)
        ]);
        setApiary(a);
        setHives(h.filter((hv: Hive) => hv.apiary_id === apiaryId));
        setHistory(hist);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [apiaryId]);

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', queenless: 'bg-red-100 text-red-700', inactive: 'bg-stone-100 text-stone-600', absconded: 'bg-purple-100 text-purple-700' };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!apiary) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><p>Apiary not found</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-stone-700" /></button>
        <div className="flex-1"><h1 className="text-lg font-bold text-stone-800">{apiary.name}</h1><p className="text-xs text-stone-500">{apiary.district} {apiary.area ? `• ${apiary.area}` : ''}</p></div>
        <button onClick={handleDelete} disabled={deleting} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
        <button onClick={() => onEditApiary(apiary)} className="text-sm text-amber-600 font-medium hover:text-amber-700">Edit</button>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Info Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-bold text-amber-600">{hives.length}</p><p className="text-xs text-stone-500">Hives</p></div>
            <div><p className="text-xl font-bold text-emerald-600">{hives.filter(h=>h.status==='active').length}</p><p className="text-xs text-stone-500">Active</p></div>
            <div><p className="text-xl font-bold text-red-600">{hives.filter(h=>h.status==='queenless').length}</p><p className="text-xs text-stone-500">Queenless</p></div>
          </div>
          {apiary.terrain && <div className="flex gap-2 text-sm"><span className="text-stone-500">Terrain:</span><span className="text-stone-700">{apiary.terrain}</span></div>}
          {apiary.forage_primary && <div className="flex gap-2 text-sm"><span className="text-stone-500">Forage:</span><span className="text-stone-700">{apiary.forage_primary}</span></div>}
          {apiary.gps_latitude && apiary.gps_longitude && (
            <div className="flex items-center gap-1 text-sm text-emerald-600"><MapPin className="w-3.5 h-3.5" /> {apiary.gps_latitude}, {apiary.gps_longitude}</div>
          )}
          {apiary.notes && <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded-lg">{apiary.notes}</p>}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button onClick={() => setActiveTab('hives')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='hives' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Hives ({hives.length})</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='history' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>History ({history.length})</button>
        </div>

        {activeTab === 'hives' && (
          <>
            <button onClick={() => onAddHive(apiaryId)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Hive
            </button>
            {hives.length === 0 ? (
              <div className="text-center py-8"><HiveIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No hives in this apiary</p></div>
            ) : (
              <div className="space-y-3">
                {hives.map(h => (
                  <button key={h.id} onClick={() => onViewHive(h.id)} className="w-full text-left bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-stone-800">{h.name}</h3>
                      <div className="flex gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[h.hive_type] || ''}`}>{h.hive_type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[h.status] || ''}`}>{h.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-stone-500">{h.queen_present ? '♛ Queen present' : '⚠ Queenless'}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          history.length === 0 ? (
            <div className="text-center py-8"><Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No history records</p></div>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-800">{h.action}</span>
                    <span className="text-xs text-stone-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  {h.details && <p className="text-sm text-stone-600">{h.details}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
