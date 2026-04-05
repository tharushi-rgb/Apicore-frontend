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
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { apiariesService, type Apiary } from '../../services/apiaries';
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
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'empty' | 'expired',
    queenlessOnly: false,
    pestOnly: false,
    healthyOnly: false,
    dateFrom: '',
    dateTo: '',
  });
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'apiaries';

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
      const apiaryId = inspection.apiary_id || hiveById[inspection.hive_id]?.apiary_id;
      if (!apiaryId) return;
      const current = latest[apiaryId];
      if (!current || new Date(inspection.inspection_date) > new Date(current.inspection_date)) {
        latest[apiaryId] = inspection;
      }
    });
    return new Set<number>(Object.entries(latest).filter(([, insp]) => insp.pest_detected).map(([apiaryId]) => Number(apiaryId)));
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
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
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
              <h2 className="text-xl font-bold text-stone-800 mb-2">{t('noApiariesCreated', selectedLanguage)}</h2>
              <p className="text-stone-600 mb-6">{t('addFirstApiary', selectedLanguage)}</p>
              <button
                onClick={onCreateApiary}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('addApiary', selectedLanguage)}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder={t('searchApiaries', selectedLanguage)}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-[0.875rem]"
                />
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:grid md:[grid-template-columns:minmax(9rem,max-content)_minmax(13rem,1fr)_minmax(11rem,max-content)] md:gap-4 md:items-start">
                  <div className="flex flex-col min-w-0">
                    <p className="text-[0.75rem] font-bold text-stone-800 mb-0.5">Status</p>
                    <select
                      value={filters.status}
                      onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value as typeof filters.status }))}
                      className="w-full sm:w-auto md:w-auto rounded-lg border border-stone-300 px-1.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white hover:border-stone-400 transition-colors"
                    >
                      <option value="all">Any</option>
                      <option value="active">Active</option>
                      <option value="empty">Empty</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <p className="text-[0.75rem] font-bold text-stone-800 mb-1">Established Between</p>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(event) => setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))}
                        className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white hover:border-stone-400 transition-colors"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(event) => setFilters((previous) => ({ ...previous, dateTo: event.target.value }))}
                        className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white hover:border-stone-400 transition-colors"
                        placeholder="To"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <p className="text-[0.75rem] font-bold text-stone-800 mb-1">Health Filters</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <button
                        onClick={() => toggleHealthFilter('queenlessOnly')}
                        className={`px-2.5 py-1.5 rounded-full text-[0.75rem] font-semibold transition-all whitespace-nowrap ${filters.queenlessOnly ? 'bg-red-100 text-red-900 border-2 border-red-400 shadow-sm' : 'bg-stone-100 text-stone-700 border-2 border-stone-300 hover:bg-stone-150 hover:border-stone-400'}`}
                      >
                        Queenless Hives
                      </button>
                      <button
                        onClick={() => toggleHealthFilter('pestOnly')}
                        className={`px-2.5 py-1.5 rounded-full text-[0.75rem] font-semibold transition-all whitespace-nowrap ${filters.pestOnly ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-sm' : 'bg-stone-100 text-stone-700 border-2 border-stone-300 hover:bg-stone-150 hover:border-stone-400'}`}
                      >
                        Pest Alerts
                      </button>
                      <button
                        onClick={() => toggleHealthFilter('healthyOnly')}
                        className={`px-2.5 py-1.5 rounded-full text-[0.75rem] font-semibold transition-all whitespace-nowrap ${filters.healthyOnly ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 shadow-sm' : 'bg-stone-100 text-stone-700 border-2 border-stone-300 hover:bg-stone-150 hover:border-stone-400'}`}
                      >
                        Healthy Only
                      </button>
                    </div>
                  </div>
                </div>
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

function ApiaryCard({ apiary, lang, onView, onEdit, onAddHive, getWeatherIcon, hasQueenless, hasPestAlert }: {
  apiary: Apiary; lang: Language; onView: () => void; onEdit: () => void; onAddHive: () => void;
  getWeatherIcon: (condition: string) => React.ReactNode; hasQueenless: boolean; hasPestAlert: boolean;
}) {
  const statusConfig: Record<string, { label: string; textColor: string; bgColor: string }> = {
    active: { label: t('active', lang), textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    empty: { label: t('empty', lang), textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
    expired: { label: t('expired', lang), textColor: 'text-red-700', bgColor: 'bg-red-50' },
  };
  const config = statusConfig[apiary.status] || statusConfig.active;

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${apiary.status === 'expired' ? 'border-l-4 border-red-400' : ''}`}>
      <div className="p-2.5 space-y-1.5">
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
            {(apiary.hive_count || 0) > 0 ? `${apiary.hive_count} hives` : t('noHivesAdded', lang)}
          </span>
        </div>

        {/* Row 3: Compact weather + forage strip */}
        <div className="flex items-center gap-1.5 bg-stone-50 rounded-lg px-2 py-1 text-[0.7rem]">
          <span className="flex items-center gap-1">
            {getWeatherIcon('sunny')}
            <span className="font-medium text-stone-700">28°C · Sunny</span>
          </span>
          {(apiary.forage_primary || apiary.blooming_window) && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-emerald-700 truncate">{apiary.forage_primary || 'Mixed'}</span>
              {apiary.blooming_window && (
                <span className="text-stone-400 hidden sm:inline truncate"> · {apiary.blooming_window}</span>
              )}
            </>
          )}
        </div>

        {(hasQueenless || hasPestAlert) ? (
          <div className="flex flex-wrap gap-1">
            {hasQueenless && <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 text-red-700 text-[0.65rem] font-semibold px-1.5 py-0.5"><AlertTriangle className="w-3 h-3" />Queenless hive</span>}
            {hasPestAlert && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 text-amber-700 text-[0.65rem] font-semibold px-1.5 py-0.5"><AlertCircle className="w-3 h-3" />Pest alert</span>}
          </div>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[0.65rem] font-semibold px-1.5 py-0.5">
            <BadgeCheck className="w-3 h-3" />Healthy
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
