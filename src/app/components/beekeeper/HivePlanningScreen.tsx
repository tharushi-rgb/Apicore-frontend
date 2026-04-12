import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { apiariesService, type Apiary } from '../../services/apiaries';
import { hivesService, type Hive } from '../../services/hives';
import { planningService, type PlanningAnalysis, type District, type GBIFForageSpecies } from '../../services/planning';
import { ecologicalZonesService } from '../../services/ecologicalZones';
import { MapPin, Hexagon as HiveIcon, CloudRain, Sun, Cloud, Wind, Droplets, Thermometer, Search, Leaf, ChevronDown, ChevronUp, Navigation, X } from 'lucide-react';
import { ForecastDays14 } from './ForecastDays14';
import { MapViewer } from '../shared/MapViewer';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict, getDistrictCenter } from '../../constants/sriLankaLocations';
import { t } from '../../i18n';

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

const MONTH_ABBR = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function GBIFForageCard({ plants, currentMonth }: { plants: GBIFNearbyEntry[]; currentMonth: number }) {
  const [expanded, setExpanded] = useState(false);
  const blooming = plants.filter((p) => p.observedMonths.includes(currentMonth));
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
            <p className="text-xs text-stone-500">CSV records near this location only</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-lg font-bold text-blue-700">{plants.length}</p>
          <p className="text-xs text-stone-500">species</p>
        </div>
      </div>

      {/* Currently blooming callout */}
      {blooming.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs font-semibold text-emerald-700 mb-1">🌸 Blooming Now ({blooming.length})</p>
          <p className="text-xs text-emerald-600">{blooming.slice(0, 8).map((p) => p.common).join(' · ')}</p>
        </div>
      )}

      {/* Species list */}
      <div className="space-y-2">
        {visible.map((p) => {
          const isNow = p.observedMonths.includes(currentMonth);
          const firstMonth = p.observedMonths.length ? Math.min(...p.observedMonths) : currentMonth;
          const lastMonth = p.observedMonths.length ? Math.max(...p.observedMonths) : currentMonth;
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
                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 bg-blue-100 text-blue-700 border border-blue-200">
                  {p.nearbyCount} obs.
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 flex-wrap">
                <span>Observed months: {MONTH_ABBR[firstMonth]}{firstMonth !== lastMonth ? `–${MONTH_ABBR[lastMonth]}` : ''}</span>
                <span className="ml-auto text-blue-600 font-medium">Sri Lanka total: {p.gbifCount}</span>
              </div>
              {p.sinhalaName && <p className="text-xs text-stone-500 mt-1 leading-relaxed">Sinhala: {p.sinhalaName}</p>}
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
        Source CSV: 0017890-260108223611665.csv · {plants.reduce((s, p) => s + p.nearbyCount, 0).toLocaleString()} nearby records
      </p>
    </div>
  );
}

export function HivePlanningScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onCreateHive, onLogout }: Props) {
  const location = useLocation();
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  // Planning analysis state
  const [districts, setDistricts] = useState<District[]>([]);
  const [searchMode, setSearchMode] = useState<'admin' | 'gps'>('admin');
  const [selectedProvince, setSelectedProvince] = useState(user?.province ?? '');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district ?? '');
  const [selectedDsDivision, setSelectedDsDivision] = useState(user?.ds_division ?? '');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d.toISOString().split('T')[0];
  });
  const [analysis, setAnalysis] = useState<PlanningAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showNearbyHivesOverlay, setShowNearbyHivesOverlay] = useState(false);
  const [prefillHandled, setPrefillHandled] = useState(false);

  const availableDistricts = getDistrictsByProvince(selectedProvince);
  const availableDsDivisions = getDsDivisionsByDistrict(selectedDistrict);

  useEffect(() => {
    const nextEndDate = new Date(`${startDate}T00:00:00`);
    nextEndDate.setDate(nextEndDate.getDate() + 13);
    setEndDate(nextEndDate.toISOString().split('T')[0]);
  }, [startDate]);

  useEffect(() => {
    if (selectedProvince && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict('');
      setSelectedDsDivision('');
    }
  }, [availableDistricts, selectedDistrict, selectedProvince]);

  useEffect(() => {
    if (selectedDistrict && selectedDsDivision && !availableDsDivisions.includes(selectedDsDivision)) {
      setSelectedDsDivision('');
    }
  }, [availableDsDivisions, selectedDistrict, selectedDsDivision]);

  useEffect(() => {
    if (searchMode === 'gps' && !customLat && !customLng) {
      const center = getDistrictCenter(user?.district);
      setCustomLat(String(center.lat));
      setCustomLng(String(center.lng));
    }
  }, [customLat, customLng, searchMode, user?.district]);

  useEffect(() => {
    Promise.all([apiariesService.getAll(), hivesService.getAll(), planningService.getDistricts()])
      .then(([a, h, d]) => { setApiaries(a); setHives(h); setDistricts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAnalyze = async () => {
    let lat = parseFloat(customLat);
    let lng = parseFloat(customLng);
    const districtLabel = searchMode === 'admin'
      ? [selectedDsDivision, selectedDistrict].filter(Boolean).join(', ') || selectedDistrict
      : (selectedDistrict || 'GPS search');

    if (startDate && endDate && startDate > endDate) {
      return;
    }

    if (searchMode === 'admin') {
      if (!selectedProvince || !selectedDistrict || !selectedDsDivision) return;
      const d = getDistrictCenter(selectedDistrict);
      lat = d.lat;
      lng = d.lng;
      setCustomLat(String(d.lat));
      setCustomLng(String(d.lng));
    } else if (selectedDistrict && (!customLat || !customLng)) {
      const d = districts.find(dd => dd.name === selectedDistrict);
      if (d) { lat = d.lat; lng = d.lng; }
    }

    if (isNaN(lat) || isNaN(lng)) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const result = await planningService.analyze(lat, lng, districtLabel, {
        startDate,
        endDate,
        apiaries: apiaries.map(a => ({
          id: a.id,
          name: a.name,
          gps_latitude: a.gps_latitude,
          gps_longitude: a.gps_longitude,
          district: a.district
        })),
        hives: hives.map(h => ({
          id: h.id,
          name: h.name,
          apiary_id: h.apiary_id,
          gps_latitude: h.gps_latitude,
          gps_longitude: h.gps_longitude
        })),
      });
      setAnalysis(result);
    } catch (e) {
      console.error('Analysis failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred during analysis';
      setAnalysisError(`Analysis failed: ${errorMessage}`);
    }
    setAnalyzing(false);
  };

  useEffect(() => {
    const prefill = (location.state as any)?.prefillCoordinates;
    if (!prefill || prefillHandled) return;
    if (typeof prefill.lat !== 'number' || typeof prefill.lng !== 'number') return;

    setSearchMode('gps');
    setCustomLat(String(prefill.lat));
    setCustomLng(String(prefill.lng));
    if (prefill.district) setSelectedDistrict(String(prefill.district));
    if (prefill.dsDivision) setSelectedDsDivision(String(prefill.dsDivision));
    setPrefillHandled(true);
  }, [location.state, prefillHandled]);

  useEffect(() => {
    if (!prefillHandled || analyzing) return;
    if (!customLat || !customLng) return;
    handleAnalyze();
  }, [prefillHandled, customLat, customLng]);

  const handleDistrictChange = (name: string) => {
    setSelectedDistrict(name);
    setSelectedDsDivision('');
    const d = districts.find(dd => dd.name === name);
    if (d) { setCustomLat(String(d.lat)); setCustomLng(String(d.lng)); }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm shrink-0 z-30">
        <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          activeTab="planning" onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-4 pb-3 border-t border-stone-100">
          <h1 className="text-[1.1rem] font-bold text-stone-800">{t('hivePlanning', selectedLanguage)}</h1>
          <p className="text-stone-500 text-[0.75rem] mt-0.5">{t('planAndAnalyze', selectedLanguage)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 pb-24 space-y-2">

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : (
          <>
            <>
                {/* Search Mode Selector */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2"><Search className="w-4 h-4 text-emerald-500" /> Search Location</h3>

                  <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
                    <button
                      onClick={() => setSearchMode('admin')}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${searchMode === 'admin' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                    >
                      Province / District / DS
                    </button>
                    <button
                      onClick={() => setSearchMode('gps')}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${searchMode === 'gps' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                    >
                      GPS Coordinates
                    </button>
                  </div>

                  {searchMode === 'admin' ? (
                    <div className="space-y-2">
                      <select
                        value={selectedProvince}
                        onChange={e => setSelectedProvince(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Select province</option>
                        {PROVINCES.map(province => <option key={province} value={province}>{province}</option>)}
                      </select>

                      <select value={selectedDistrict} onChange={e => handleDistrictChange(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
                        <option value="">— Select a district —</option>
                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>

                      <select
                        value={selectedDsDivision}
                        onChange={e => setSelectedDsDivision(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Select DS division</option>
                        {availableDsDivisions.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Latitude" value={customLat} onChange={e => setCustomLat(e.target.value)}
                          className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
                        <input type="text" placeholder="Longitude" value={customLng} onChange={e => setCustomLng(e.target.value)}
                          className="border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
                      </div>

                      <MapViewer
                        lat={customLat ? parseFloat(customLat) : undefined}
                        lng={customLng ? parseFloat(customLng) : undefined}
                        district={searchMode === 'gps' ? '' : (selectedDistrict || user?.district)}
                        editable={true}
                        onLocationSelect={(lat, lng) => {
                          setCustomLat(String(lat));
                          setCustomLng(String(lng));
                        }}
                      />
                    </>
                  )}

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

                  {/* Error Display */}
                  {analysisError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-700">{analysisError}</p>
                      <p className="text-xs text-red-500 mt-1">Check console for more details or try different coordinates.</p>
                    </div>
                  )}
                </div>

                {/* Analysis Results */}
                {analysis && (
                  <>
                    {/* Zone Saturation */}
                    <div className={`rounded-xl p-3 shadow-sm border ${
                      analysis.saturation.level === 'low' ? 'bg-emerald-50 border-emerald-200' :
                      analysis.saturation.level === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <HiveIcon className="w-4 h-4" />
                        <h3 className="font-bold text-[0.8rem]">{t('zoneSaturation', selectedLanguage)} ({analysis.saturation.radiusKm}km)</h3>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.75rem]">{analysis.saturation.count} hives nearby</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          analysis.saturation.level === 'low' ? 'bg-emerald-200 text-emerald-800' :
                          analysis.saturation.level === 'medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-red-200 text-red-800'
                        }`}>{analysis.saturation.level}</span>
                      </div>
                      <p className="text-[0.7rem] opacity-75 mb-2">{analysis.saturation.message}</p>
                      {/* {(analysis.saturation.nearbyApiaries.length > 0 || analysis.saturation.nearbyStandaloneHives.length > 0) && (
                        // <button
                        //   onClick={() => setShowNearbyHivesOverlay(true)}
                        //   className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        // >
                        //   See Info ({analysis.saturation.nearbyApiaries.length} apiaries, {analysis.saturation.nearbyStandaloneHives.length} standalone hives)
                        // </button>
                      )} */}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-stone-200">
                        <h3 className="font-bold text-stone-800 text-[0.8rem] mb-2 flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-amber-500" /> {t('beeTemperatureGuide', selectedLanguage)}</h3>
                        <div className="space-y-2">
                          {[
                            { label: t('optimalForaging', selectedLanguage), value: '26-33°C', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                            { label: t('stress', selectedLanguage), value: '34-35°C', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
                            { label: t('risk', selectedLanguage), value: '>35°C', tone: 'bg-red-50 border-red-200 text-red-800' },
                          ].map((item) => (
                            <div key={item.label} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.tone}`}>
                              <span className="text-[0.75rem] font-medium">{item.label}</span>
                              <span className="text-[0.75rem] font-bold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm border border-stone-200">
                        <h3 className="font-bold text-stone-800 text-[0.8rem] mb-2 flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-blue-500" /> {t('beeHumidityGuide', selectedLanguage)}</h3>
                        <div className="space-y-2">
                          {[
                            { label: 'Optimal', value: '60-95%', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                            { label: 'Best for foraging', value: '70-79%', tone: 'bg-blue-50 border-blue-200 text-blue-800' },
                            { label: 'Risky', value: '>95%', tone: 'bg-red-50 border-red-200 text-red-800' },
                          ].map((item) => (
                            <div key={item.label} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.tone}`}>
                              <span className="text-[0.75rem] font-medium">{item.label}</span>
                              <span className="text-[0.75rem] font-bold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Current Weather */}
                    {analysis.weather.current && (
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <h3 className="font-bold text-stone-800 mb-2 text-[0.875rem] flex items-center gap-2"><Thermometer className="w-3.5 h-3.5 text-amber-500" /> Current Weather</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <WeatherIcon code={analysis.weather.current.wcode} className="w-8 h-8" />
                            <div>
                              <p className="text-[1.35rem] font-bold leading-none text-stone-800">{analysis.weather.current.temp.toFixed(1)}°C</p>
                              <p className={`text-[0.7rem] px-1.5 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.tempRisk.color)}`}>{analysis.weather.current.tempRisk.label}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="flex items-center gap-1 justify-end text-[0.8rem]"><Droplets className="w-3 h-3 text-blue-400" /> {analysis.weather.current.humidity.toFixed(1)}%</p>
                            <p className="flex items-center gap-1 justify-end text-[0.8rem]"><Wind className="w-3 h-3 text-stone-400" /> {analysis.weather.current.wind.toFixed(1)} km/h</p>
                            <p className={`text-[0.7rem] px-1.5 py-0.5 rounded inline-block border ${riskBg(analysis.weather.current.humidityStatus.color)}`}>{analysis.weather.current.humidityStatus.label}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 14-Day Forecast */}
                    {analysis.weather.days.length > 0 && (
                      <ForecastDays14 days={analysis.weather.days} hourly={analysis.weather.hourly} lang={selectedLanguage} />
                    )}

                    {/* Ecological Zone Reference - Based on Selected District */}
                    {selectedDistrict && (
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-emerald-100">
                        <h3 className="font-bold text-stone-800 text-[0.82rem] mb-2 flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-emerald-500" /> Ecological Zone</h3>
                        {(() => {
                          const zone = ecologicalZonesService.getZoneByDistrict(selectedDistrict);
                          const honeyFlow = ecologicalZonesService.getHoneyFlowByDistrict(selectedDistrict);
                          const foragePlants = ecologicalZonesService.getForagePlantsByDistrict(selectedDistrict);
                          
                          if (zone) {
                            return (
                              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                <p className="text-xs font-semibold text-emerald-900">{zone.zone}</p>
                                <p className="text-[0.72rem] text-emerald-800 mt-0.5"><span className="font-medium">Key Regions:</span> {zone.keyRegions.join(', ')}</p>
                                <p className="text-[0.72rem] text-emerald-800"><span className="font-medium">Primary Forage Plants:</span> {foragePlants || 'N/A'}</p>
                                <p className="text-[0.72rem] text-emerald-800"><span className="font-medium">Honey-Flow Period:</span> {honeyFlow || 'N/A'}</p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
                                <p className="text-[0.72rem] text-stone-600">No ecological zone data available for {selectedDistrict}.</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* GBIF Verified Nearby Plants */}
                    {analysis.forage.gbifNearby.length > 0 && (
                      <GBIFForageCard
                        plants={analysis.forage.gbifNearby}
                        currentMonth={analysis.forage.month}
                      />
                    )}
                  </>
                )}
              </>
          </>
        )}

        {/* Nearby Hives Overlay */}
        {showNearbyHivesOverlay && analysis && (
          <NearbyHivesOverlay
            nearbyApiaries={analysis.saturation.nearbyApiaries}
            nearbyStandaloneHives={analysis.saturation.nearbyStandaloneHives}
            radiusKm={analysis.saturation.radiusKm}
            selectedLanguage={selectedLanguage}
            onClose={() => setShowNearbyHivesOverlay(false)}
          />
        )}
      </div>
    </div>
  );
}

// ---- Nearby Hives Overlay Component ----
function NearbyHivesOverlay({
  nearbyApiaries,
  nearbyStandaloneHives,
  radiusKm,
  selectedLanguage,
  onClose
}: {
  nearbyApiaries: Array<{
    id: number;
    name: string;
    district: string;
    distance: number;
    hiveCount: number;
    hives: Array<{ id: number; name: string; distance: number; }>;
  }>;
  nearbyStandaloneHives: Array<{
    id: number;
    name: string;
    distance: number;
    apiary?: string;
  }>;
  radiusKm: number;
  selectedLanguage: Language;
  onClose: () => void;
}) {
  const totalHives = nearbyApiaries.reduce((sum, apiary) => sum + apiary.hiveCount, 0) + nearbyStandaloneHives.length;

  return (
    <div className="absolute inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[22rem] rounded-t-2xl p-4 pb-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-[0.95rem] text-stone-800">Nearby Hives & Apiaries</h3>
            <p className="text-[0.7rem] text-stone-500">
              Within {radiusKm}km • {totalHives} total hives
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-stone-100 hover:bg-stone-200">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">

          {/* Nearby Apiaries */}
          {nearbyApiaries.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <HiveIcon className="w-4 h-4 text-amber-500" />
                Apiaries ({nearbyApiaries.length})
              </h3>
              <div className="space-y-3">
                {nearbyApiaries.map((apiary) => (
                  <div key={apiary.id} className="bg-stone-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-stone-800">{apiary.name}</h4>
                      <div className="text-right">
                        <p className="text-xs text-stone-500">{apiary.district}</p>
                        <p className="text-xs font-medium text-amber-600">
                          {apiary.distance === 0 ? 'Same District' : `${apiary.distance.toFixed(1)}km away`}
                        </p>
                      </div>
                    </div>

                    {/* Always show hive count, including 0 hives */}
                    <div>
                      <p className="text-xs text-stone-600 mb-1">
                        {apiary.hiveCount === 0 ? '0 hives' : `${apiary.hiveCount} hives:`}
                      </p>
                      {apiary.hives.length > 0 && (
                        <div className="grid grid-cols-2 gap-1">
                          {apiary.hives.map((hive) => (
                            <div key={hive.id} className="text-xs text-stone-700 bg-white px-2 py-1 rounded">
                              {hive.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standalone Hives */}
          {nearbyStandaloneHives.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <HiveIcon className="w-4 h-4 text-blue-500" />
                Standalone Hives ({nearbyStandaloneHives.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearbyStandaloneHives.map((hive) => (
                  <div key={hive.id} className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-stone-800">{hive.name}</h4>
                      <p className="text-xs font-medium text-blue-600">
                        {hive.distance.toFixed(1)}km away
                      </p>
                    </div>
                    {hive.apiary && (
                      <p className="text-xs text-stone-600 mt-1">{hive.apiary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No nearby hives */}
          {nearbyApiaries.length === 0 && nearbyStandaloneHives.length === 0 && (
            <div className="text-center py-8">
              <HiveIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500">No hives found within {radiusKm}km</p>
              <p className="text-xs text-stone-400 mt-2">
                Distance based on GPS coordinates where available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
