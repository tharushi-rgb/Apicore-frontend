import { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { apiariesService, type Apiary } from '../services/apiaries';
import { hivesService, type Hive } from '../services/hives';
import { planningService, type PlanningAnalysis, type District, type GBIFForageSpecies } from '../services/planning';
import { MapPin, Hexagon as HiveIcon, CloudRain, Sun, Cloud, Wind, Droplets, Thermometer, Search, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { ForecastDays14 } from './ForecastDays14';
import { ForecastHourly } from './ForecastHourly';
import { MapViewer } from './MapViewer';
import { t } from '../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

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

// ── GBIF Forage Card ──────────────────────────────────────────────────────────
type GBIFNearbyEntry = GBIFForageSpecies & { scientific: string; nearbyCount: number };

function gbifGradeBadge(grade: GBIFForageSpecies['grade']) {
  if (grade === 'excellent') return 'bg-amber-100 text-amber-800 border border-amber-300';
  if (grade === 'high')      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (grade === 'medium')    return 'bg-blue-100 text-blue-700 border border-blue-300';
  return 'bg-stone-100 text-stone-600 border border-stone-200';
}

const MONTH_ABBR = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function GBIFForageCard({ plants, score, currentMonth }: { plants: GBIFNearbyEntry[]; score: number; currentMonth: number }) {
  const [expanded, setExpanded] = useState(false);
  const blooming = plants.filter(p => currentMonth >= p.bloomStart && currentMonth <= p.bloomEnd);
  const other    = plants.filter(p => !(currentMonth >= p.bloomStart && currentMonth <= p.bloomEnd));
  const visible  = expanded ? plants : plants.slice(0, 6);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm">GBIF Verified Forage Plants</h3>
            <p className="text-xs text-stone-500">Real field observations near this location</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-lg font-bold text-blue-700">{plants.length}</p>
          <p className="text-xs text-stone-500">species</p>
        </div>
      </div>

      {/* Biodiversity score bar */}
      <div className="mb-3 bg-stone-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-500 transition-all"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
        <span>Forage Biodiversity</span>
        <span className="font-medium text-blue-700">{score}/100</span>
      </div>

      {/* Currently blooming callout */}
      {blooming.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs font-semibold text-emerald-700 mb-1">🌸 Blooming Now ({blooming.length})</p>
          <p className="text-xs text-emerald-600">{blooming.map(p => p.common).join(' · ')}</p>
        </div>
      )}

      {/* Species list */}
      <div className="space-y-2">
        {visible.map((p) => {
          const isNow = currentMonth >= p.bloomStart && currentMonth <= p.bloomEnd;
          return (
            <div key={p.scientific} className={`p-2.5 rounded-lg border ${isNow ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-100'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-stone-800 truncate">{p.common}</span>
                    {isNow && <span className="text-xs px-1 py-0.5 rounded bg-emerald-200 text-emerald-800 flex-shrink-0">Now</span>}
                  </div>
                  <p className="text-xs text-stone-400 italic truncate">{p.scientific}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize ${gbifGradeBadge(p.grade)}`}>{p.grade}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 flex-wrap">
                <span>{p.resources.join(' & ')}</span>
                <span>Blooms: {MONTH_ABBR[p.bloomStart]}{p.bloomStart !== p.bloomEnd ? `–${MONTH_ABBR[p.bloomEnd]}` : ''}</span>
                <span className="ml-auto text-blue-600 font-medium">{p.nearbyCount} obs.</span>
              </div>
              {p.note && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{p.note}</p>}
            </div>
          );
        })}
      </div>

      {plants.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 font-medium py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {plants.length} species</>}
        </button>
      )}

      <p className="text-xs text-stone-400 mt-3 text-center">
        Source: GBIF · {plants.reduce((s, p) => s + p.nearbyCount, 0).toLocaleString()} field records
      </p>
    </div>
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

  useEffect(() => {
    Promise.all([apiariesService.getAll(), hivesService.getAll(), planningService.getDistricts()])
      .then(([a, h, d]) => { setApiaries(a); setHives(h); setDistricts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="planning" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} lang={selectedLanguage} />

      <div className="bg-white shadow-sm shrink-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-4 pb-3 border-t border-stone-100">
          <h1 className="text-[1.1rem] font-bold text-stone-800">{t('hivePlanning', selectedLanguage)}</h1>
          <p className="text-stone-500 text-[0.75rem] mt-0.5">{t('planAndAnalyze', selectedLanguage)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : (
          <>
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

                {/* Interactive Map — always visible, defaults to Sri Lanka */}
                <MapViewer
                  lat={customLat ? parseFloat(customLat) : undefined}
                  lng={customLng ? parseFloat(customLng) : undefined}
                  district={selectedDistrict}
                  editable={true}
                  onLocationSelect={(lat, lng) => {
                    setCustomLat(String(lat));
                    setCustomLng(String(lng));
                  }}
                />

                {/* Analysis Results */}
                {analysis && (
                  <>
                    {/* Suitability Score */}
                    <div className={`rounded-xl p-3 shadow-sm border ${
                      analysis.suitability.color === 'green' || analysis.suitability.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.suitability.color === 'amber' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[0.875rem]">{analysis.suitability.label}</h3>
                          <p className="text-[0.7rem] opacity-75">Location: {analysis.location.district}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[1.5rem] font-bold leading-none">{analysis.suitability.score}</p>
                          <p className="text-[0.65rem] opacity-75">/ 100</p>
                        </div>
                      </div>
                    </div>

                    {/* Zone Saturation */}
                    <div className={`rounded-xl p-3 shadow-sm border ${
                      analysis.saturation.level === 'low' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.saturation.level === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <HiveIcon className="w-4 h-4" />
                        <h3 className="font-bold text-[0.8rem]">Zone Saturation ({analysis.saturation.radiusKm}km)</h3>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.75rem]">{analysis.saturation.count} hives nearby</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          analysis.saturation.level === 'low' ? 'bg-emerald-200 text-emerald-800' :
                          analysis.saturation.level === 'medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-red-200 text-red-800'
                        }`}>{analysis.saturation.level}</span>
                      </div>
                      <p className="text-[0.7rem] opacity-75">{analysis.saturation.message}</p>
                    </div>

                    {/* Current Weather */}
                    {analysis.weather.current && (
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <h3 className="font-bold text-stone-800 mb-2 text-[0.875rem] flex items-center gap-2"><Thermometer className="w-3.5 h-3.5 text-amber-500" /> Current Weather</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <WeatherIcon code={analysis.weather.current.wcode} className="w-8 h-8" />
                            <div>
                              <p className="text-[1.35rem] font-bold leading-none text-stone-800">{analysis.weather.current.temp}°C</p>
                              <p className={`text-[0.7rem] px-1.5 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.tempRisk.color)}`}>{analysis.weather.current.tempRisk.label}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="flex items-center gap-1 justify-end text-[0.8rem]"><Droplets className="w-3 h-3 text-blue-400" /> {analysis.weather.current.humidity}%</p>
                            <p className="flex items-center gap-1 justify-end text-[0.8rem]"><Wind className="w-3 h-3 text-stone-400" /> {analysis.weather.current.wind} km/h</p>
                            <p className={`text-[0.7rem] px-1.5 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.humidityStatus.color)}`}>{analysis.weather.current.humidityStatus.label}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 14-Day Forecast */}
                    {analysis.weather.days.length > 0 && (
                      <ForecastDays14 days={analysis.weather.days} lang={selectedLanguage} />
                    )}

                    {/* Hourly Forecast (Today + Tomorrow) */}
                    {analysis.weather.hourly.length > 0 && (
                      <ForecastHourly hourly={analysis.weather.hourly} initialShowCount={6} lang={selectedLanguage} />
                    )}

                    {/* Forage Information */}
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <h3 className="font-bold text-stone-800 text-[0.8rem] mb-2 flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-emerald-500" /> Forage Availability</h3>
                      
                      {analysis.forage.current.length > 0 ? (
                        <>
                          <p className="text-xs text-stone-500 mb-2">Currently blooming (Month {analysis.forage.month})</p>
                          <div className="space-y-2">
                            {analysis.forage.current.map((p, i) => (
                              <div key={i} className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-stone-800">{p.name}</span>
                                  <div className="flex items-center gap-1">
                                    {p.confirmed && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200" title="Verified in GBIF field data">✓ GBIF</span>
                                    )}
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      p.availability === 'abundant' ? 'bg-emerald-200 text-emerald-800' :
                                      p.availability === 'moderate' ? 'bg-amber-200 text-amber-800' :
                                      'bg-stone-200 text-stone-600'
                                    }`}>{p.availability}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-stone-500 italic">{p.scientific} • {p.resourceType}</p>
                                {p.gbifCount && <p className="text-xs text-blue-600">{p.gbifCount} field records in Sri Lanka</p>}
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
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm text-stone-700">{p.name}</span>
                                  {p.confirmed && <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700">✓</span>}
                                </div>
                                <span className="text-xs text-amber-700">Month {p.bloomStart}–{p.bloomEnd}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* GBIF Verified Nearby Plants */}
                    {analysis.forage.gbifNearby.length > 0 && (
                      <GBIFForageCard
                        plants={analysis.forage.gbifNearby}
                        score={analysis.forage.gbifScore}
                        currentMonth={analysis.forage.month}
                      />
                    )}
                  </>
                )}
              </>
          </>
        )}
      </div>
    </div>
  );
}
