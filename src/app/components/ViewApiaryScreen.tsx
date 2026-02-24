import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Hexagon as HiveIcon, MapPin, Calendar, Clock, Trash2, CloudRain, Sun, Cloud, Wind, Droplets, Thermometer } from 'lucide-react';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';
import { planningService, type ApiaryWeather } from '../services/planning';

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
  const [activeTab, setActiveTab] = useState<'hives' | 'weather' | 'history'>('hives');
  const [deleting, setDeleting] = useState(false);
  const [weather, setWeather] = useState<ApiaryWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

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

  // Load weather when weather tab is activated
  useEffect(() => {
    if (activeTab === 'weather' && !weather && !weatherLoading && apiary?.gps_latitude && apiary?.gps_longitude) {
      setWeatherLoading(true);
      planningService.getApiaryWeather(apiaryId)
        .then(w => setWeather(w))
        .catch(() => {})
        .finally(() => setWeatherLoading(false));
    }
  }, [activeTab, apiary, apiaryId, weather, weatherLoading]);

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', queenless: 'bg-red-100 text-red-700', inactive: 'bg-stone-100 text-stone-600', absconded: 'bg-purple-100 text-purple-700' };

// ...existing code...
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!apiary) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50"><p className="text-[13px] text-stone-500">Apiary not found</p></div>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-100 sticky top-0 z-20 px-4 py-2.5 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-xl transition-colors"><ArrowLeft className="w-4 h-4 text-stone-600" /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[15px] font-bold text-stone-800 truncate">{apiary.name}</h1><p className="text-[10px] text-stone-500 truncate">{apiary.district} {apiary.area ? `• ${apiary.area}` : ''}</p></div>
        <button onClick={handleDelete} disabled={deleting} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
        <button onClick={() => onEditApiary(apiary)} className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-2xl shadow-md shadow-amber-500/20 hover:shadow-lg transition-all uppercase tracking-wide">Edit</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
      <div className="px-4 py-4 space-y-3">
        {/* Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-3"><p className="text-[15px] font-bold text-white">{hives.length}</p><p className="text-[10px] text-white/80 font-medium">Hives</p></div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-3"><p className="text-[15px] font-bold text-white">{hives.filter(h=>h.status==='active').length}</p><p className="text-[10px] text-white/80 font-medium">Active</p></div>
            <div className="bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl p-3"><p className="text-[15px] font-bold text-white">{hives.filter(h=>h.status==='queenless').length}</p><p className="text-[10px] text-white/80 font-medium">Queenless</p></div>
          </div>
          {apiary.terrain && <div className="flex gap-2 text-[12px]"><span className="text-stone-500">Terrain:</span><span className="text-stone-700">{apiary.terrain}</span></div>}
          {apiary.forage_primary && <div className="flex gap-2 text-[12px]"><span className="text-stone-500">Forage:</span><span className="text-stone-700">{apiary.forage_primary}</span></div>}
          {apiary.gps_latitude && apiary.gps_longitude && (
            <div className="flex items-center gap-1 text-[12px] text-emerald-600"><MapPin className="w-3 h-3" /> {apiary.gps_latitude}, {apiary.gps_longitude}</div>
          )}
          {apiary.notes && <p className="text-[12px] text-stone-600 bg-stone-50 p-2 rounded-xl">{apiary.notes}</p>}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          <button onClick={() => setActiveTab('hives')} className={`flex-1 py-2 rounded-xl text-[12px] font-medium ${activeTab==='hives' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'text-stone-600'}`}>Hives ({hives.length})</button>
          {apiary.gps_latitude && apiary.gps_longitude && (
            <button onClick={() => setActiveTab('weather')} className={`flex-1 py-2 rounded-xl text-[12px] font-medium ${activeTab==='weather' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'text-stone-600'}`}>Weather</button>
          )}
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-xl text-[12px] font-medium ${activeTab==='history' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'text-stone-600'}`}>History</button>
        </div>

        {activeTab === 'hives' && (
          <>
            <button onClick={() => onAddHive(apiaryId)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-2xl text-[13px] font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> Add Hive
            </button>
            {hives.length === 0 ? (
              <div className="text-center py-8"><HiveIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" /><p className="text-[12px] text-stone-500">No hives in this apiary</p></div>
            ) : (
              <div className="space-y-2">
                {hives.map(h => (
                  <button key={h.id} onClick={() => onViewHive(h.id)} className="w-full text-left bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0"><HiveIcon className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-[13px] font-bold text-stone-800 truncate">{h.name}</h3>
                          <div className="flex gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeColors[h.hive_type] || ''}`}>{h.hive_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[h.status] || ''}`}>{h.status}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-500">{h.queen_present ? '♛ Queen present' : '⚠ Queenless'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'weather' && (
          weatherLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
          ) : weather ? (
            <div className="space-y-3">
              {/* Current Weather */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-[13px] font-bold text-stone-800 mb-3 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center"><Thermometer className="w-3.5 h-3.5 text-white" /></div> Current Weather</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {weather.current.wcode === 0 ? <Sun className="w-9 h-9 text-amber-500" /> : weather.current.wcode <= 3 ? <Cloud className="w-9 h-9 text-stone-400" /> : <CloudRain className="w-9 h-9 text-blue-500" />}
                    <div>
                      <p className="text-2xl font-bold text-stone-800">{weather.current.temp}°C</p>
                      <p className="text-[12px] text-stone-500">{weather.current.description}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1 text-[12px]">
                    <p className="flex items-center gap-1 justify-end"><Droplets className="w-3 h-3 text-blue-400" /> {weather.current.humidity}%</p>
                    <p className="flex items-center gap-1 justify-end"><Wind className="w-3 h-3 text-stone-400" /> {weather.current.wind} km/h</p>
                  </div>
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-[13px] font-bold text-stone-800 mb-3 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-white" /></div> 5-Day Forecast</h3>
                <div className="space-y-1.5">
                  {weather.forecast.map(day => (
                    <div key={day.date} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl text-[12px]">
                      <div className="w-10 text-center flex-shrink-0">
                        <p className="font-bold text-[10px]">{day.dayName}</p>
                        <p className="text-[10px] text-stone-500">{day.dayNum}</p>
                      </div>
                      {day.wcode === 0 ? <Sun className="w-5 h-5 text-amber-500 flex-shrink-0" /> : day.wcode <= 3 ? <Cloud className="w-5 h-5 text-stone-400 flex-shrink-0" /> : <CloudRain className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] font-bold">{day.maxTemp}°</span>
                          <span className="text-stone-400 text-[11px]">/</span>
                          <span className="text-stone-500 text-[12px]">{day.minTemp}°</span>
                        </div>
                        <p className="text-[10px] text-stone-500">{day.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        {day.precipMm > 0 && <p className="text-[10px] text-blue-600">💧{day.precipMm}mm</p>}
                        {day.windspeed !== null && <p className="text-[10px]"><Wind className="w-3 h-3 inline text-stone-400" /> {day.windspeed}</p>}
                        {day.humidityMax !== null && <p className="text-[10px]"><Droplets className="w-3 h-3 inline text-blue-400" /> {day.humidityMin}–{day.humidityMax}%</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-stone-400 text-center">Data from {weather.source}</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Cloud className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-[12px] text-stone-500">Weather data unavailable. Make sure the apiary has GPS coordinates.</p>
            </div>
          )
        )}

        {activeTab === 'history' && (
          history.length === 0 ? (
            <div className="text-center py-8"><Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" /><p className="text-[12px] text-stone-500">No history records</p></div>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] font-medium text-stone-800">{h.action}</span>
                    <span className="text-[10px] text-stone-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  {h.details && <p className="text-[12px] text-stone-600">{h.details}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
}
