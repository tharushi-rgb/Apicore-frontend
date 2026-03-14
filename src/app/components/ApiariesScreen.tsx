import { useState, useEffect } from 'react';
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
  Hexagon as HiveIcon,
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { PageTitleBar } from './PageTitleBar';
import { apiariesService, type Apiary } from '../services/apiaries';
import { authService } from '../services/auth';
import { t } from '../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateApiary: () => void; onViewHive?: () => void; onEditApiary?: (apiary: Apiary) => void;
  onAddHive?: (apiary: Apiary) => void; onViewApiary?: (id: number) => void; onLogout: () => void;
}

export function ApiariesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateApiary, onEditApiary, onAddHive, onViewApiary, onLogout }: Props) {
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'apiaries';

  useEffect(() => {
    apiariesService.getAll().then(a => { setApiaries(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalApiaries = apiaries.length;
  const apiariesWithHives = apiaries.filter(a => (a.hive_count || 0) > 0).length;
  const expiredApiaries = apiaries.filter(a => a.status === 'expired').length;

  const filtered = apiaries.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.district?.toLowerCase().includes(search.toLowerCase()) && !a.area?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

        <div className="px-4 py-4 space-y-4">
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
                    apiary={apiary}                    lang={selectedLanguage}                    onView={() => onViewApiary?.(apiary.id)}
                    onEdit={() => onEditApiary?.(apiary)}
                    onAddHive={() => onAddHive?.(apiary)}
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
  const colorClasses = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div className="bg-white rounded-lg p-2.5 shadow-sm relative">
      <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-lg ${colorClasses[color]}`} />
      {alert && <AlertTriangle className="absolute top-1.5 right-1.5 w-3 h-3 text-red-500" />}
      <p className="text-stone-600 text-[10px] mb-0.5 leading-tight">{title}</p>
      <p className="text-xl font-bold text-stone-800 leading-none">{value}</p>
    </div>
  );
}

function ApiaryCard({ apiary, lang, onView, onEdit, onAddHive, getWeatherIcon }: {
  apiary: Apiary; lang: Language; onView: () => void; onEdit: () => void; onAddHive: () => void;
  getWeatherIcon: (condition: string) => React.ReactNode;
}) {
  const statusConfig: Record<string, { label: string; textColor: string; bgColor: string }> = {
    active: { label: t('active', lang), textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    empty: { label: t('empty', lang), textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
    expired: { label: t('expired', lang), textColor: 'text-red-700', bgColor: 'bg-red-50' },
  };
  const config = statusConfig[apiary.status] || statusConfig.active;

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${apiary.status === 'expired' ? 'border-l-4 border-red-400' : ''}`}>
      <div className="p-3 space-y-2">
        {/* Row 1: Name + Status */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[0.875rem] font-bold text-stone-800 flex-1 truncate">{apiary.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${config.bgColor} ${config.textColor} whitespace-nowrap`}>
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
        <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2.5 py-1.5 text-[0.72rem]">
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

        {/* Expired warning */}
        {apiary.status === 'expired' && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg">
            <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
            <p className="text-[0.7rem] text-red-700 font-medium">{t('contractRenewal', lang)}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-0.5">
          <button onClick={onView}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 rounded-lg text-[0.75rem] font-medium transition-colors flex items-center justify-center gap-1">
            <Eye className="w-3.5 h-3.5" />{t('view', lang)}
          </button>
          <button onClick={onEdit}
            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-1.5 rounded-lg text-[0.75rem] font-medium transition-colors flex items-center justify-center gap-1">
            <Pencil className="w-3.5 h-3.5" />{t('edit', lang)}
          </button>
          <button onClick={onAddHive}
            className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1.5 rounded-lg text-[0.75rem] font-medium transition-colors flex items-center justify-center gap-1">
            <HiveIcon className="w-3.5 h-3.5" />{t('addHive', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
