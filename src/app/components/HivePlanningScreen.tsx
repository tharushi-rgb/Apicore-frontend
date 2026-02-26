import { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';
import { planningService, type PlanningAnalysis, type District, type WeatherDay, type WeatherHourly } from '../services/planning';
import { Calendar, MapPin, Hexagon as HiveIcon, Plus, AlertTriangle, CloudRain, Sun, Cloud, Wind, Droplets, Thermometer, Search, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { ForecastDays14 } from './ForecastDays14';
import { ForecastHourly } from './ForecastHourly';
import { MapViewer } from './MapViewer';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateApiary: () => void; onCreateHive: () => void; onLogout: () => void;
}

// Weather icon by WMO code
function WeatherIcon({ code, className = 'w-5 h-5' }: { code: number | string; className?: string }) {
  if (code === 0 || code === 'sun') return <Sun className={`${className} text-amber-500`} />;
  if (code === 1 || code === 2 || code === 3 || code === 'cloud') return <Cloud className={`${className} text-stone-400`} />;
  return <CloudRain className={`${className} text-blue-500`} />;
}

// Color helpers
function riskBg(color: string) {
  if (color === 'red') return 'bg-red-100 text-red-700 border-red-200';
  if (color === 'amber') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (color === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (color === 'blue') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

// Clock icon inline component
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function HivePlanningScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onCreateHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  // Planning analysis state
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [analysis, setAnalysis] = useState<PlanningAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showHourly, setShowHourly] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'analyze'>('overview');

  useEffect(() => {
    Promise.all([apiariesService.getAll(), hivesService.getAll(), planningService.getDistricts()])
      .then(([a, h, d]) => { setApiaries(a); setHives(h); setDistricts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const queenlessHives = hives.filter(h => !h.queen_present || h.status === 'queenless');
  const inactiveHives = hives.filter(h => h.status === 'inactive' || h.status === 'absconded');
  const activeApiaries = apiaries.filter(a => a.status === 'active');
  const activeHives = hives.filter(h => h.status === 'active');

  const handleAnalyze = async () => {
    let lat = parseFloat(customLat);
    let lng = parseFloat(customLng);
    const district = selectedDistrict;

    if (startDate && endDate && startDate > endDate) {
      return;
    }

    if (selectedDistrict && (!customLat || !customLng)) {
      const d = districts.find(dd => dd.name === selectedDistrict);
      if (d) { lat = d.lat; lng = d.lng; }
    }

    if (isNaN(lat) || isNaN(lng)) return;

    setAnalyzing(true);
    try {
      const result = await planningService.analyze(lat, lng, district, { startDate, endDate });
      setAnalysis(result);
    } catch (e) {
      console.error('Analysis failed:', e);
    }
    setAnalyzing(false);
  };

  const handleDistrictChange = (name: string) => {
    setSelectedDistrict(name);
    const d = districts.find(dd => dd.name === name);
    if (d) { setCustomLat(String(d.lat)); setCustomLng(String(d.lng)); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24 relative overflow-hidden">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="planning" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">Hive Planning</h1>
          <p className="text-stone-500 text-sm mt-1">Plan and analyze locations</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm">
              <button onClick={() => setActiveView('overview')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'overview' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Overview</button>
              <button onClick={() => setActiveView('analyze')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'analyze' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>
                <span className="flex items-center justify-center gap-1"><Search className="w-3.5 h-3.5" /> Analyze Location</span>
              </button>
            </div>

            {activeView === 'overview' && (
              <>
                {/* Overview Stats */}
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

            {activeView === 'analyze' && (
              <>
                {/* Location Selector */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Select Location</h3>
                  
                  <select value={selectedDistrict} onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
                    <option value="">— Select a district —</option>
                    {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Latitude" value={customLat} onChange={e => setCustomLat(e.target.value)}
                      className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
                    <input type="text" placeholder="Longitude" value={customLng} onChange={e => setCustomLng(e.target.value)}
                      className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-stone-500">Start date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-stone-500">End date</label>
                      <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                        className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none w-full" />
                    </div>
                  </div>

                  <button onClick={handleAnalyze} disabled={analyzing || (!customLat && !selectedDistrict)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {analyzing ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Analyzing...</> : <><Search className="w-4 h-4" /> Analyze Location</>}
                  </button>
                </div>

                {/* Interactive Map */}
                {(customLat && customLng) && (
                  <MapViewer
                    lat={parseFloat(customLat)}
                    lng={parseFloat(customLng)}
                    district={selectedDistrict}
                    editable={true}
                    onLocationSelect={(lat, lng) => {
                      setCustomLat(String(lat));
                      setCustomLng(String(lng));
                    }}
                  />
                )}

                {/* Analysis Results */}
                {analysis && (
                  <>
                    {/* Suitability Score */}
                    <div className={`rounded-xl p-4 shadow-sm border ${
                      analysis.suitability.color === 'green' || analysis.suitability.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.suitability.color === 'amber' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{analysis.suitability.label}</h3>
                          <p className="text-sm opacity-75">Location: {analysis.location.district}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{analysis.suitability.score}</p>
                          <p className="text-xs opacity-75">/ 100</p>
                        </div>
                      </div>
                    </div>

                    {/* Zone Saturation */}
                    <div className={`rounded-xl p-4 shadow-sm border ${
                      analysis.saturation.level === 'low' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.saturation.level === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <HiveIcon className="w-5 h-5" />
                        <h3 className="font-bold">Zone Saturation ({analysis.saturation.radiusKm}km)</h3>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{analysis.saturation.count} hives nearby</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          analysis.saturation.level === 'low' ? 'bg-emerald-200 text-emerald-800' :
                          analysis.saturation.level === 'medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-red-200 text-red-800'
                        }`}>{analysis.saturation.level}</span>
                      </div>
                      <p className="text-sm opacity-75">{analysis.saturation.message}</p>
                    </div>

                    {/* Current Weather */}
                    {analysis.weather.current && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Thermometer className="w-4 h-4 text-amber-500" /> Current Weather</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <WeatherIcon code={analysis.weather.current.wcode} className="w-10 h-10" />
                            <div>
                              <p className="text-3xl font-bold text-stone-800">{analysis.weather.current.temp}°C</p>
                              <p className={`text-xs px-2 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.tempRisk.color)}`}>{analysis.weather.current.tempRisk.label}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1 text-sm">
                            <p className="flex items-center gap-1 justify-end"><Droplets className="w-3.5 h-3.5 text-blue-400" /> {analysis.weather.current.humidity}%</p>
                            <p className="flex items-center gap-1 justify-end"><Wind className="w-3.5 h-3.5 text-stone-400" /> {analysis.weather.current.wind} km/h</p>
                            <p className={`text-xs px-2 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.humidityStatus.color)}`}>{analysis.weather.current.humidityStatus.label}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 14-Day Forecast */}
                    {analysis.weather.days.length > 0 && (
                      <ForecastDays14 days={analysis.weather.days} />
                    )}

                    {/* Hourly Forecast (Today + Tomorrow) */}
                    {analysis.weather.hourly.length > 0 && (
                      <ForecastHourly hourly={analysis.weather.hourly} initialShowCount={6} />
                    )}

                    {/* Forage Information */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Forage Availability</h3>
                      
                      {analysis.forage.current.length > 0 ? (
                        <>
                          <p className="text-xs text-stone-500 mb-2">Currently blooming (Month {analysis.forage.month})</p>
                          <div className="space-y-2">
                            {analysis.forage.current.map((p, i) => (
                              <div key={i} className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-stone-800"> {p.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    p.availability === 'high' ? 'bg-emerald-200 text-emerald-800' :
                                    p.availability === 'medium' ? 'bg-amber-200 text-amber-800' :
                                    'bg-stone-200 text-stone-600'
                                  }`}>{p.availability}</span>
                                </div>
                                <p className="text-xs text-stone-500 italic">{p.scientific} • {p.resourceType}</p>
                                <p className="text-xs text-stone-600">{p.zone}</p>
                                {p.note && <p className="text-xs text-stone-500 mt-1">{p.note}</p>}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-stone-500">No major forage plants currently blooming for this region.</p>
                      )}

                      {analysis.forage.upcoming.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-stone-500 mb-2">Upcoming blooms</p>
                          <div className="space-y-1">
                            {analysis.forage.upcoming.map((p, i) => (
                              <div key={i} className="p-2 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between">
                                <div>
                                  <span className="text-sm text-stone-700"> {p.name}</span>
                                  <span className="text-xs text-stone-500 ml-1">({p.zone})</span>
                                </div>
                                <span className="text-xs text-amber-700">Month {p.bloomStart}–{p.bloomEnd}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
