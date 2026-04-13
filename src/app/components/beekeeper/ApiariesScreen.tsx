import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  MapPin,
  Eye,
  Pencil,
  Search,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Hexagon as HiveIcon,
  Filter,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { apiariesService, type Apiary } from '../../services/apiaries';
import { planningService } from '../../services/planning';
import { hivesService, type Hive } from '../../services/hives';
import { inspectionsService, type Inspection } from '../../services/inspections';
import { authService } from '../../services/auth';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateApiary: () => void; onViewHive?: () => void; onEditApiary?: (apiary: Apiary) => void;
  onAddHive?: (apiary: Apiary) => void; onViewApiary?: (id: number) => void; onLogout: () => void;
}

export function ApiariesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onEditApiary, onAddHive, onViewApiary, onLogout }: Props) {
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const initialFilters = {
    status: 'all' as 'all' | 'active' | 'inactive' | 'empty' | 'expired',
    queenlessOnly: false,
    pestOnly: false,
    healthyOnly: false,
    dateFrom: '',
    dateTo: '',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'apiaries';
  const [weatherData, setWeatherData] = useState<Record<number, any>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiariesService.getAll(),
      hivesService.getAll().catch(() => []),
      inspectionsService.getAll().catch(() => []),
    ])
      .then(([apiaryData, hiveData, inspectionData]) => {
        if (!mounted) return;
        setApiaries(apiaryData);
        setHives(hiveData);
        setInspections(inspectionData);
        setLoading(false);
      })
      .catch(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      const weatherMap: Record<number, any> = {};

      for (const apiary of apiaries) {
        if (!apiary.gps_latitude || !apiary.gps_longitude) continue;

        try {
          const result = await planningService.analyze(
            Number(apiary.gps_latitude),
            Number(apiary.gps_longitude),
            apiary.district || apiary.name
          );

          weatherMap[apiary.id] = result.weather.current;
        } catch (err) {
          console.error("Weather fetch failed for apiary", apiary.id);
        }
      }

      setWeatherData(weatherMap);
    };

    if (apiaries.length > 0) {
      fetchWeather();
    }
  }, [apiaries]);

  const totalApiaries = apiaries.length;
  const apiariesWithHives = apiaries.filter(a => (a.hive_count || 0) > 0).length;
  const expiredApiaries = apiaries.filter(a => a.status === 'expired').length;

  const hiveById = useMemo(() => {
    const map: Record<number, Hive> = {};
    hives.forEach((hive) => { map[hive.id] = hive; });
    return map;
  }, [hives]);

  const queenlessApiaryIds = useMemo(() => {
    const set = new Set<number>();
    hives.forEach((hive) => {
      if (!hive.apiary_id) return;
      if (hive.status === 'queenless' || hive.queen_present === 0) set.add(hive.apiary_id);
    });
    return set;
  }, [hives]);

  const pestAlertApiaryIds = useMemo(() => {
    const latest: Record<number, Inspection> = {};

    inspections.forEach((inspection) => {
      const apiaryId =
        inspection.apiary_id ||
        hiveById[Number(inspection.hive_id)]?.apiary_id;

      if (!apiaryId) return;

      const current = latest[apiaryId];

      if (
        !current ||
        new Date(inspection.inspection_date) >
          new Date(current.inspection_date)
      ) {
        latest[apiaryId] = inspection;
      }
    });

  return new Set<number>(
    Object.entries(latest)
      .filter(([, insp]) => {
        const pestValues = Array.isArray(insp.pest_disease_presence)
          ? insp.pest_disease_presence
          : String(insp.pest_disease_presence || '')
              .replace(/[\[\]"]/g, '')
              .split(',');

        return (
          pestValues.includes('pest_detected') ||
          pestValues.includes('under_treatment')
        );
      })
      .map(([apiaryId]) => Number(apiaryId))
  );
}, [hiveById, inspections]);

  const filtered = apiaries.filter((apiary) => {
    if (search && !apiary.name.toLowerCase().includes(search.toLowerCase()) && !apiary.district?.toLowerCase().includes(search.toLowerCase()) && !apiary.area?.toLowerCase().includes(search.toLowerCase())) return false;

    if (filters.status !== 'all' && apiary.status !== filters.status) return false;

    const queenlessFlag = queenlessApiaryIds.has(apiary.id);
    const pestFlag = pestAlertApiaryIds.has(apiary.id);
    if (filters.queenlessOnly && !queenlessFlag) return false;
    if (filters.pestOnly && !pestFlag) return false;
    if (filters.healthyOnly && (queenlessFlag || pestFlag)) return false;

    if (filters.dateFrom) {
      const established = apiary.established_date ? new Date(apiary.established_date) : null;
      if (!established || established < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const established = apiary.established_date ? new Date(apiary.established_date) : null;
      if (!established || established > new Date(filters.dateTo)) return false;
    }

    return true;
  });

  const toggleHealthFilter = (key: 'queenlessOnly' | 'pestOnly' | 'healthyOnly') => {
    setFilters((previous) => {
      const nextValue = !previous[key];
      if (key === 'healthyOnly') {
        return {
          ...previous,
          healthyOnly: nextValue,
          queenlessOnly: nextValue ? false : previous.queenlessOnly,
          pestOnly: nextValue ? false : previous.pestOnly,
        };
      }
      return {
        ...previous,
        [key]: nextValue,
        healthyOnly: nextValue ? false : previous.healthyOnly,
      };
    });
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'rainy': return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Cloud className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    // <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
    <div className="h-full bg-white relative">
      <div className="h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            activeTab={activeTab} onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
          <PageTitleBar title={t('apiaries', selectedLanguage)} subtitle={t('manageApiaries', selectedLanguage)} size="sm" />
        </div>

        <div className="px-2 py-2 space-y-2">
          {/* Summary Cards - Compact 3-column Grid */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard title={t('total', selectedLanguage)} value={totalApiaries.toString()} color="emerald" />
            <SummaryCard title={t('withHives', selectedLanguage)} value={apiariesWithHives.toString()} color="amber" />
            <SummaryCard title={t('actionReq', selectedLanguage)} value={expiredApiaries.toString()} color="red" alert={expiredApiaries > 0} />
          </div>

          {apiaries.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <MapPin className="w-16 h-16 text-stone-300" />
                  <HiveIcon className="w-8 h-8 text-amber-400 absolute bottom-0 right-0" />
                </div>
              </div>
              <h2 className="text-[0.95rem] font-bold text-stone-800 mb-2">{t('noApiariesCreated', selectedLanguage)}</h2>
              <p className="text-stone-600 text-[0.75rem] mb-5">{t('addFirstApiary', selectedLanguage)}</p>
              <button
                onClick={onCreateApiary}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium text-[0.8rem] inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('addApiary', selectedLanguage)}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder={t('searchApiaries', selectedLanguage)}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-[0.875rem]"
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

            
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-stone-800 mb-2">{t('noApiariesFound', selectedLanguage)}</h3>
                  <p className="text-stone-600">{t('tryAdjusting', selectedLanguage)}</p>
                </div>
              ) : (
                filtered.map((apiary) => (
                  <ApiaryCard
                    key={apiary.id}
                    apiary={apiary}
                    lang={selectedLanguage}
                    onView={() => onViewApiary?.(apiary.id)}
                    onEdit={() => onEditApiary?.(apiary)}
                    onAddHive={() => onAddHive?.(apiary)}
                    hasQueenless={queenlessApiaryIds.has(apiary.id)}
                    hasPestAlert={pestAlertApiaryIds.has(apiary.id)}
                    getWeatherIcon={getWeatherIcon}
                    weatherData={weatherData}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      {apiaries.length > 0 && (
        <button
          onClick={onCreateApiary}
          className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      {showFilters && (
        <FilterModal
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => setShowFilters(false)}
          selectedLanguage={selectedLanguage}
          toggleHealthFilter={toggleHealthFilter}
          initialFilters={initialFilters}
        />
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryCard({ title, value, color, alert }: { title: string; value: string; color: 'emerald' | 'amber' | 'red'; alert?: boolean }) {
  const toneClasses = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
    red: 'bg-red-50 border-red-100 text-red-900',
  };
  return (
    <div className={`rounded-lg border p-2 relative ${toneClasses[color]}`}>
      {alert && <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-red-500" />}
      <p className="text-caption font-medium opacity-80 leading-tight">{title}</p>
      <p className="text-body font-bold leading-none mt-0.5">{value}</p>
    </div>
  );
}

function ApiaryCard({ apiary, lang, onView, onEdit, onAddHive, getWeatherIcon, hasQueenless, hasPestAlert,  weatherData }: {
  apiary: Apiary; lang: Language; onView: () => void; onEdit: () => void; onAddHive: () => void;
  getWeatherIcon: (condition: string) => React.ReactNode; hasQueenless: boolean; hasPestAlert: boolean;
  weatherData: Record<number, any>;
}) {
  const statusConfig: Record<string, { label: string; textColor: string; bgColor: string }> = {
    active: { label: t('active', lang), textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    empty: { label: t('empty', lang), textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
    expired: { label: t('expired', lang), textColor: 'text-red-700', bgColor: 'bg-red-50' },
  };
  const config = statusConfig[apiary.status] || statusConfig.active;

  return (
    // <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${apiary.status === 'expired' ? 'border-l-4 border-red-400' : ''}`}>
    <div className={`bg-white rounded-xl shadow-md border border-stone-100 overflow-hidden hover:shadow-lg transition-all duration-200 ${apiary.status === 'expired' ? 'border-l-4 border-red-400' : ''}`}>      <div className="p-2.5 space-y-1.5">
        {/* Row 1: Name + Status */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[0.875rem] font-bold text-stone-800 flex-1 truncate">{apiary.name}</h3>
          <span className={`px-1.5 py-0.5 rounded-full text-[0.6rem] font-medium ${config.bgColor} ${config.textColor} whitespace-nowrap`}>
            {config.label}
          </span>
        </div>

        {/* Row 2: Location + Date + Hive count */}
        <div className="flex items-center gap-3 text-[0.72rem] text-stone-500 flex-wrap">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />{apiary.district}{apiary.area ? ` / ${apiary.area}` : ''}
          </span>
          {apiary.established_date && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />Est. {apiary.established_date}
            </span>
          )}
          <span className="flex items-center gap-0.5 ml-auto text-amber-700 font-medium">
            <HiveIcon className="w-3 h-3" />
            {(apiary.hive_count || 0) > 0 ? `${apiary.hive_count} ${t('hives', lang)}` : t('noHivesAdded', lang)}
          </span>
        </div>

        {/* Row 3: Compact weather + forage strip */}
        <div className="flex items-center gap-1.5 bg-stone-50 rounded-lg px-2 py-1 text-[0.7rem]">
          <span className="flex items-center gap-1">
            {getWeatherIcon('sunny')}
            <span className="font-medium text-stone-700">
              {weatherData[apiary.id]
                ? `${weatherData[apiary.id].temp.toFixed(1)}°C`
                : 'Loading...'}
            </span>
          </span>
          {(apiary.forage_primary || apiary.blooming_window) && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-emerald-700 truncate">{apiary.forage_primary || t('mixed', lang)}</span>
              {apiary.blooming_window && (
                <span className="text-stone-400 hidden sm:inline truncate"> · {apiary.blooming_window}</span>
              )}
            </>
          )}
        </div>

        {(hasQueenless || hasPestAlert) ? (
          <div className="flex flex-wrap gap-1">
            {hasQueenless && <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 text-red-700 text-[0.65rem] font-semibold px-1.5 py-0.5"><AlertTriangle className="w-3 h-3" />{t('queenlessHive', lang)}</span>}
            {hasPestAlert && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 text-amber-700 text-[0.65rem] font-semibold px-1.5 py-0.5"><AlertCircle className="w-3 h-3" />{t('pestAlert', lang)}</span>}
          </div>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[0.65rem] font-semibold px-1.5 py-0.5">
            <BadgeCheck className="w-3 h-3" />{t('healthy', lang)}
          </span>
        )}

        {/* Contract renewal warning */}
        {apiary.land_ownership === 'not_owned' && apiary.contract_end && new Date(apiary.contract_end) < new Date() && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded-lg">
            <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
            <p className="text-[0.65rem] text-red-700 font-medium">{t('contractRenewal', lang)}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5 pt-0 mt-1">
          <button onClick={onView}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-1 rounded-full text-[0.7rem] font-medium transition-colors flex items-center justify-center gap-0.5 min-h-8">
            <Eye className="w-3 h-3" />{t('view', lang)}
          </button>
          <button onClick={onEdit}
            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-1 rounded-full text-[0.7rem] font-medium transition-colors flex items-center justify-center gap-0.5 min-h-8">
            <Pencil className="w-3 h-3" />{t('edit', lang)}
          </button>
          <button onClick={onAddHive}
            className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1 rounded-full text-[0.7rem] font-medium transition-colors flex items-center justify-center gap-0.5 min-h-8">
            <HiveIcon className="w-3 h-3" />{t('addHive', lang)}
          </button>
        </div>
      </div>
      
    </div>
  );
}

function FilterModal({
  filters,
  setFilters,
  onClose,
  onApply,
  selectedLanguage,
  toggleHealthFilter,
  initialFilters,
}: any) {
  return (
    <div
      className="absolute inset-0 bg-black/50 z-50 px-3 py-6 flex items-start justify-center"
      onClick={onClose}
    >
      
      {/* Modal */}
      <div
        className="w-full max-w-sm bg-white rounded-2xl max-h-full overflow-y-auto p-3"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex justify-end">
          <button onClick={onClose} className="text-xl">✕</button>
        </div>

        {/* FILTER CONTENT */}
        <div className="bg-white rounded-xl border border-stone-200 p-3 mb-2 shadow-sm w-full">

          {/* Title */}
          <h3 className="text-[0.8rem] font-bold text-stone-800 mb-2 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-stone-600" />
            {t('filtersAndSearch', selectedLanguage)}
          </h3>

          <div className="flex flex-col gap-3">

            {/* Status */}
            <div>
              <p className="text-[0.7rem] font-bold text-stone-800 mb-1">
                {t('status', selectedLanguage)}
              </p>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-stone-300 px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">{t('any', selectedLanguage)}</option>
                <option value="active">{t('active', selectedLanguage)}</option>
                <option value="inactive">{t('inactive', selectedLanguage)}</option>
                <option value="empty">{t('empty', selectedLanguage)}</option>
                <option value="expired">{t('expired', selectedLanguage)}</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <p className="text-[0.7rem] font-bold text-stone-800 mb-1">
                {t('establishedBetween', selectedLanguage)}
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      dateTo: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Health Filters */}
            <div>
              <p className="text-[0.7rem] font-bold text-stone-800 mb-1">
                {t('healthFilters', selectedLanguage)}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleHealthFilter('queenlessOnly')}
                  className={`px-3 py-1 rounded-full text-[0.7rem] font-semibold ${
                    filters.queenlessOnly
                      ? 'bg-red-100 text-red-900 border border-red-400'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {t('queenlessHives', selectedLanguage)}
                </button>

                <button
                  onClick={() => toggleHealthFilter('pestOnly')}
                  className={`px-3 py-1 rounded-full text-[0.7rem] font-semibold ${
                    filters.pestOnly
                      ? 'bg-amber-100 text-amber-900 border border-amber-400'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {t('pestAlerts', selectedLanguage)}
                </button>

                <button
                  onClick={() => toggleHealthFilter('healthyOnly')}
                  className={`px-3 py-1 rounded-full text-[0.7rem] font-semibold ${
                    filters.healthyOnly
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {t('healthyOnly', selectedLanguage)}
                </button>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => setFilters(initialFilters)}
              className="w-full rounded-lg border border-stone-300 py-2 text-[0.75rem] font-semibold text-stone-700 hover:bg-stone-50"
            >
              {t('resetFilters', selectedLanguage)}
            </button>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-2 text-sm"
          >
            Close
          </button>

          <button
            onClick={onApply}
            className="flex-1 bg-amber-500 text-white rounded-xl py-2 text-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}