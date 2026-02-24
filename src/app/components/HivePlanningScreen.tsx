import { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';
import { planningService, type PlanningAnalysis, type District, type WeatherDay, type WeatherHourly } from '../services/planning';
import { Calendar, MapPin, Hexagon as HiveIcon, Plus, AlertTriangle, CloudRain, Sun, Cloud, Wind, Droplets, Thermometer, Search, Leaf, ChevronDown, ChevronUp } from 'lucide-react';

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

    if (selectedDistrict && (!customLat || !customLng)) {
      const d = districts.find(dd => dd.name === selectedDistrict);
      if (d) { lat = d.lat; lng = d.lng; }
    }

    if (isNaN(lat) || isNaN(lng)) return;

    setAnalyzing(true);
    try {
      const result = await planningService.analyze(lat, lng, district);
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="planning" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-4 space-y-4">
// ...existing code...
        <h2 className="text-[15px] font-bold text-stone-800">🗓 Hive Planning</h2>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm">
              <button onClick={() => setActiveView('overview')} className={`flex-1 py-2 rounded-xl text-[12px] font-medium transition-all ${activeView === 'overview' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Overview</button>
              <button onClick={() => setActiveView('analyze')} className={`flex-1 py-2 rounded-xl text-[12px] font-medium transition-all ${activeView === 'analyze' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>
                <span className="flex items-center justify-center gap-1"><Search className="w-3.5 h-3.5" /> Analyze Location</span>
              </button>
            </div>

            {activeView === 'overview' && (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-1"><MapPin className="w-4 h-4 text-emerald-500" /></div><p className="text-[15px] font-bold">{activeApiaries.length}</p><p className="text-[10px] text-stone-500">Active Apiaries</p></div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm"><div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-1"><HiveIcon className="w-4 h-4 text-amber-500" /></div><p className="text-[15px] font-bold">{activeHives.length}</p><p className="text-[10px] text-stone-500">Active Hives</p></div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={onCreateApiary} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-[13px]"><Plus className="w-4 h-4" /> New Apiary</button>
                  <button onClick={onCreateHive} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-[13px]"><Plus className="w-4 h-4" /> New Hive</button>
                </div>

                {/* Queenless Alert */}
                {queenlessHives.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-500" /></div><h3 className="text-[13px] font-bold text-red-700">Queenless Hives ({queenlessHives.length})</h3></div>
                    <div className="space-y-1">{queenlessHives.map(h => (
                      <div key={h.id} className="flex items-center justify-between text-[12px]"><span className="text-red-800">{h.name}</span><span className="text-red-600 text-[10px]">{h.apiary_name || 'Standalone'}</span></div>
                    ))}</div>
                  </div>
                )}

                {/* Inactive/Absconded */}
                {inactiveHives.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-orange-500" /></div><h3 className="text-[13px] font-bold text-orange-700">Inactive / Absconded ({inactiveHives.length})</h3></div>
                    <div className="space-y-1">{inactiveHives.map(h => (
                      <div key={h.id} className="flex items-center justify-between text-[12px]"><span className="text-orange-800">{h.name}</span><span className="text-orange-600 text-[10px] capitalize">{h.status}</span></div>
                    ))}</div>
                  </div>
                )}

                {/* Apiaries Summary */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="text-[13px] font-bold text-stone-800 mb-3">Apiaries Overview</h3>
                  {apiaries.length === 0 ? <p className="text-stone-500 text-[12px]">No apiaries yet</p> :
                    <div className="space-y-2">{apiaries.map(a => {
                      const aHives = hives.filter(h => h.apiary_id === a.id);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-emerald-500" /></div><div><p className="text-[12px] font-medium text-stone-800">{a.name}</p><p className="text-[10px] text-stone-500">{a.district}</p></div></div>
                          <div className="text-right"><p className="text-[12px] font-bold">{aHives.length} hives</p><p className="text-[10px] text-stone-500">{aHives.filter(h=>h.status==='active').length} active</p></div>
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
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="text-[13px] font-bold text-stone-800 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-emerald-500" /></div> Select Location</h3>
                  
                  <select value={selectedDistrict} onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors">
                    <option value="">— Select a district —</option>
                    {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Latitude" value={customLat} onChange={e => setCustomLat(e.target.value)}
                      className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
                    <input type="text" placeholder="Longitude" value={customLng} onChange={e => setCustomLng(e.target.value)}
                      className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
                  </div>

                  <button onClick={handleAnalyze} disabled={analyzing || (!customLat && !selectedDistrict)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-[13px] disabled:opacity-50">
                    {analyzing ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Analyzing...</> : <><Search className="w-4 h-4" /> Analyze Location</>}
                  </button>
                </div>

                {/* Analysis Results */}
                {analysis && (
                  <>
                    {/* Suitability Score */}
                    <div className={`rounded-2xl p-4 shadow-sm border ${
                      analysis.suitability.color === 'green' || analysis.suitability.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.suitability.color === 'amber' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[13px] font-bold text-stone-800">{analysis.suitability.label}</h3>
                          <p className="text-[12px] opacity-75">Location: {analysis.location.district}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-bold">{analysis.suitability.score}</p>
                          <p className="text-[10px] opacity-75">/ 100</p>
                        </div>
                      </div>
                    </div>

                    {/* Zone Saturation */}
                    <div className={`rounded-2xl p-4 shadow-sm border ${
                      analysis.saturation.level === 'low' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.saturation.level === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><HiveIcon className="w-4 h-4 text-amber-600" /></div>
                        <h3 className="text-[13px] font-bold text-stone-800">Zone Saturation ({analysis.saturation.radiusKm}km)</h3>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px]">{analysis.saturation.count} hives nearby</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          analysis.saturation.level === 'low' ? 'bg-emerald-200 text-emerald-800' :
                          analysis.saturation.level === 'medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-red-200 text-red-800'
                        }`}>{analysis.saturation.level}</span>
                      </div>
                      <p className="text-[12px] opacity-75">{analysis.saturation.message}</p>
                    </div>

                    {/* Current Weather */}
                    {analysis.weather.current && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-[13px] font-bold text-stone-800 mb-3 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Thermometer className="w-3.5 h-3.5 text-amber-500" /></div> Current Weather</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <WeatherIcon code={analysis.weather.current.wcode} className="w-8 h-8" />
                            <div>
                              <p className="text-[15px] font-bold text-stone-800">{analysis.weather.current.temp}°C</p>
                              <p className={`text-[10px] px-2 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.tempRisk.color)}`}>{analysis.weather.current.tempRisk.label}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1 text-[12px]">
                            <p className="flex items-center gap-1 justify-end"><Droplets className="w-3 h-3 text-blue-400" /> {analysis.weather.current.humidity}%</p>
                            <p className="flex items-center gap-1 justify-end"><Wind className="w-3 h-3 text-stone-400" /> {analysis.weather.current.wind} km/h</p>
                            <p className={`text-[10px] px-2 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.humidityStatus.color)}`}>{analysis.weather.current.humidityStatus.label}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 14-Day Forecast */}
                    {analysis.weather.days.length > 0 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-[13px] font-bold text-stone-800 mb-3 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-blue-500" /></div> 14-Day Forecast</h3>
                        <div className="space-y-2">
                          {analysis.weather.days.map((day: WeatherDay) => (
                            <div key={day.date} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl text-[12px]">
                              <div className="w-10 text-center flex-shrink-0">
                                <p className="font-bold text-[10px]">{day.dayName}</p>
                                <p className="text-[10px] text-stone-500">{day.dayNum}</p>
                              </div>
                              <WeatherIcon code={day.icon} className="w-5 h-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-[12px]">{day.maxTemp}°</span>
                                  <span className="text-stone-400">/</span>
                                  <span className="text-stone-500 text-[12px]">{day.minTemp}°</span>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${riskBg(day.tempRisk.color)}`}>{day.tempRisk.label}</span>
                                  {day.precipMm > 0 && <span className="text-[10px] text-blue-600">💧{day.precipMm}mm</span>}
                                  {day.precipHours !== null && day.precipHours >= 2 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">⛔ {day.precipHours}h rain</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-0.5">
                                {day.humidityAvg !== null && <p className="text-[10px]"><Droplets className="w-3 h-3 inline text-blue-400" /> {day.humidityAvg}%</p>}
                                {day.windspeed !== null && <p className="text-[10px]"><Wind className="w-3 h-3 inline text-stone-400" /> {day.windspeed}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hourly Forecast (Today + Tomorrow) */}
                    {analysis.weather.hourly.length > 0 && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <button onClick={() => setShowHourly(!showHourly)} className="w-full flex items-center justify-between">
                          <h3 className="text-[13px] font-bold text-stone-800 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><ClockIcon className="w-3.5 h-3.5 text-emerald-500" /></div> Hourly Forecast</h3>
                          {showHourly ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                        </button>
                        {showHourly && (
                          <div className="mt-3 space-y-1">
                            {analysis.weather.hourly.map((h: WeatherHourly, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl text-[12px]">
                                <span className="w-12 text-[10px] font-medium text-stone-600">{h.date?.split('-').slice(1).join('/') || ''} {h.time}</span>
                                <WeatherIcon code={h.wcode} className="w-4 h-4" />
                                <span className="font-bold w-10 text-[12px]">{h.temp}°C</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${riskBg(h.tempRisk.color)}`}>{h.tempRisk.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${riskBg(h.humidityStatus.color)}`}>{h.humidity}%</span>
                                <span className="text-[10px] text-stone-500 ml-auto"><Wind className="w-3 h-3 inline" /> {h.wind}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Forage Information */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <h3 className="text-[13px] font-bold text-stone-800 mb-3 flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Leaf className="w-3.5 h-3.5 text-emerald-500" /></div> Forage Availability</h3>
                      
                      {analysis.forage.current.length > 0 ? (
                        <>
                          <p className="text-[10px] text-stone-500 mb-2">Currently blooming (Month {analysis.forage.month})</p>
                          <div className="space-y-2">
                            {analysis.forage.current.map((p, i) => (
                              <div key={i} className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-medium text-stone-800">🌸 {p.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    p.availability === 'high' ? 'bg-emerald-200 text-emerald-800' :
                                    p.availability === 'medium' ? 'bg-amber-200 text-amber-800' :
                                    'bg-stone-200 text-stone-600'
                                  }`}>{p.availability}</span>
                                </div>
                                <p className="text-[10px] text-stone-500 italic">{p.scientific} • {p.resourceType}</p>
                                <p className="text-[10px] text-stone-600">{p.zone}</p>
                                {p.note && <p className="text-[10px] text-stone-500 mt-1">{p.note}</p>}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-[12px] text-stone-500">No major forage plants currently blooming for this region.</p>
                      )}

                      {analysis.forage.upcoming.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-stone-500 mb-2">Upcoming blooms</p>
                          <div className="space-y-1">
                            {analysis.forage.upcoming.map((p, i) => (
                              <div key={i} className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                                <div>
                                  <span className="text-[12px] text-stone-700">🌱 {p.name}</span>
                                  <span className="text-[10px] text-stone-500 ml-1">({p.zone})</span>
                                </div>
                                <span className="text-[10px] text-amber-700">Month {p.bloomStart}–{p.bloomEnd}</span>
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
    </div>
  );
}
