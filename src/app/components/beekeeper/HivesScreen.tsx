import { useState, useEffect } from 'react';
import {
  Plus,
  Hexagon as HiveIcon,
  Search,
  Filter,
  Eye,
  Pencil,
  MoreVertical,
  AlertTriangle,
  Bug,
  X,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { hivesService, type Hive } from '../../services/hives';
import { apiariesService, type Apiary } from '../../services/apiaries';
import { authService } from '../../services/auth';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateHive: () => void; onViewHive: (id: number) => void; onEditHive?: (hive: Hive) => void; onLogout: () => void;
}

export function HivesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateHive, onViewHive, onEditHive, onLogout }: Props) {
  const [hives, setHives] = useState<Hive[]>([]);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showHiveActions, setShowHiveActions] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [activeHiveId, setActiveHiveId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedApiaryFilter, setSelectedApiaryFilter] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'hives';

  useEffect(() => {
    hivesService.getAll()
      .then(h => { setHives(h); setLoading(false); })
      .catch((error) => {
        console.error('Failed to load hives:', error);
        setLoading(false);
      });
    apiariesService.getAll()
      .then(setApiaries)
      .catch((error) => {
        console.error('Failed to load apiaries:', error);
      });
  }, []);

  const filterOptions = [
    { label: t('all', selectedLanguage), value: 'all' },
    { label: t('active', selectedLanguage), value: 'active' },
    { label: t('queenless', selectedLanguage), value: 'queenless' },
    { label: t('inactive', selectedLanguage), value: 'inactive' },
    { label: t('absconded', selectedLanguage), value: 'absconded' },
  ];

  const calculateDaysAgo = (dateStr?: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getTags = (h: Hive) => {
    const tags: string[] = [];
    if (h.pest_detected) tags.push(t('pestActive', selectedLanguage));
    if (h.inspection_overdue) tags.push(t('needsInspection', selectedLanguage));
    if (h.queen_age_risk === 'high') tags.push(t('queenChangeDue', selectedLanguage));
    if (h.status === 'queenless') tags.push(t('queenless', selectedLanguage));
    return tags;
  };

  // Summary stats
  const totalHives = hives.length;
  const activeHives = hives.filter(h => h.status === 'active').length;
  const queenlessHives = hives.filter(h => h.status === 'queenless').length;
  const apiaryLinkedHives = hives.filter(h => h.location_type === 'apiary-linked').length;
  const pestDetectedHives = hives.filter(h => h.pest_detected).length;

  const filtered = hives.filter(h => {
    if (activeFilter !== 'all' && h.status !== activeFilter) return false;
    if (selectedApiaryFilter !== null && h.apiary_id !== selectedApiaryFilter) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.apiary_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDeleteHive = async () => {
    if (!confirmDelete) return;
    try {
      await hivesService.delete(confirmDelete);
      setHives(prev => prev.filter(h => h.id !== confirmDelete));
      setShowHiveActions(false);
      setActiveHiveId(null);
      setConfirmDelete(null);
      setMessage({ type: 'success', text: 'Hive deleted successfully' });
    } catch (error) {
      console.error('Failed to delete hive', error);
      setMessage({ type: 'error', text: 'Failed to delete hive' });
      setConfirmDelete(null);
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
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative overflow-hidden">
      {/* Message Display */}
      {message && (
        <div className={`absolute top-20 left-4 right-4 z-50 rounded-lg px-3 py-2 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete !== null && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-4 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900">{t('deleteConfirm', selectedLanguage)}</h3>
            <p className="mt-2 text-sm text-stone-600">{t('actionCannotBeUndone', selectedLanguage)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-stone-300 bg-white py-2 text-sm font-semibold text-stone-700">{t('cancel', selectedLanguage)}</button>
              <button onClick={handleDeleteHive} className="rounded-lg bg-red-600 py-2 text-sm font-semibold text-white">{t('delete', selectedLanguage)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Overlay */}
      {showFilters && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)}>
          <div className="absolute top-20 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-stone-800">{t('filterHives', selectedLanguage)}</h2>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Status Filters */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-stone-600 uppercase mb-2">{t('status', selectedLanguage)}</h3>
              <div className="space-y-1">
                {filterOptions.map((filter, index) => (
                  <button
                    key={index}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${activeFilter === filter.value ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apiary Filter */}
            <div>
              <h3 className="text-xs font-semibold text-stone-600 uppercase mb-2">{t('apiaryLocation', selectedLanguage)}</h3>
              <div className="space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedApiaryFilter === null ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                  onClick={() => setSelectedApiaryFilter(null)}
                >
                  {t('allApiaries', selectedLanguage)}
                </button>
                {apiaries.map((apiary) => (
                  <button
                    key={apiary.id}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedApiaryFilter === apiary.id ? 'bg-emerald-100 text-emerald-800 font-medium' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                    onClick={() => setSelectedApiaryFilter(apiary.id)}
                  >
                    {apiary.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Sheet Overlay */}
      {showHiveActions && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowHiveActions(false)}>
          <div className="absolute bottom-6 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (activeHiveId) {
                    const hive = hives.find(h => h.id === activeHiveId);
                    if (hive && onEditHive) onEditHive(hive);
                  }
                  setShowHiveActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm"
              >
                {t('editHive', selectedLanguage)}
              </button>
              <button
                onClick={() => {
                  setShowMoveForm(true);
                  setShowHiveActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm flex items-center gap-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> {t('moveHive', selectedLanguage)}
              </button>
              <button onClick={() => { setConfirmDelete(activeHiveId); setShowHiveActions(false); }} className="w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm">
                {t('deleteHive', selectedLanguage)}
              </button>
              <button onClick={() => setShowHiveActions(false)} className="w-full text-left px-3 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 text-sm">
                {t('cancel', selectedLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            activeTab={activeTab} onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
          <PageTitleBar title={t('hives', selectedLanguage)} subtitle={t('allRegisteredHives', selectedLanguage)} />
        </div>

        <div className="px-2 py-2 space-y-2">
          {/* Summary Cards - 5-card Grid */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard title={t('total', selectedLanguage)} value={totalHives.toString()} color="emerald" />
            <SummaryCard title={t('active', selectedLanguage)} value={activeHives.toString()} color="amber" />
            <SummaryCard title={t('queenless', selectedLanguage)} value={queenlessHives.toString()} color="red" alert />
            <SummaryCard title={t('inApiaries', selectedLanguage)} value={apiaryLinkedHives.toString()} color="blue" />
            <SummaryCard title={t('pests', selectedLanguage)} value={pestDetectedHives.toString()} color="orange" alert={pestDetectedHives > 0} />
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchHives', selectedLanguage)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-[0.875rem]"
              />
            </div>
            <button onClick={() => setShowFilters(true)} className="bg-white border border-stone-200 hover:border-amber-500 p-2 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-stone-700" />
            </button>
          </div>

          {/* Hives List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center">
              <HiveIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-stone-800 mb-1">{t('noHivesAdded2', selectedLanguage)}</h2>
              <p className="text-sm text-stone-600 mb-4">{selectedLanguage === 'en' ? 'Add your first hive to start tracking inspections, queen health, pest activity, and harvests' : t('addHive', selectedLanguage)}</p>
              <button onClick={onCreateHive} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors text-sm">
                <Plus className="w-4 h-4" /> {t('addHive', selectedLanguage)}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((hive) => {
                const daysAgo = calculateDaysAgo(hive.last_inspection_date);
                const isOverdue = !!hive.inspection_overdue;
                const tags = getTags(hive);
                const hasWarning = hive.status === 'queenless' || hive.queen_age_risk === 'high' || !!hive.pest_detected || isOverdue;

                const statusConfig: Record<string, { label: string; textColor: string; bgColor: string }> = {
                  active: { label: t('active', selectedLanguage), textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
                  queenless: { label: t('queenless', selectedLanguage), textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
                  inactive: { label: t('inactive', selectedLanguage), textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
                  absconded: { label: t('absconded', selectedLanguage), textColor: 'text-red-700', bgColor: 'bg-red-50' },
                };
                const config = statusConfig[hive.status] || statusConfig.active;

                const queenAgeRiskConfig: Record<string, { label: string; color: string }> = {
                  low: { label: t('healthy', selectedLanguage), color: 'bg-emerald-100 text-emerald-700' },
                  medium: { label: t('monitor', selectedLanguage), color: 'bg-amber-100 text-amber-700' },
                  high: { label: t('critical', selectedLanguage), color: 'bg-red-100 text-red-700' },
                };

                const hiveTypeLabels: Record<string, string> = { box: t('standardBoxHive', selectedLanguage), pot: t('potHive', selectedLanguage), log: t('logHive', selectedLanguage), stingless: t('stinglessHive', selectedLanguage) };
                const colonyStrengthLabels: Record<string, string> = { weak: t('weak', selectedLanguage), normal: t('normal', selectedLanguage), strong: t('strong', selectedLanguage) };

                return (
                  <div key={hive.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${hasWarning ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="p-3 space-y-2.5">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-stone-800 flex-1">{hive.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} whitespace-nowrap`}>
                          {config.label}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-stone-700 font-medium">{hive.apiary_name || '-'}</span>
                        <span className="text-stone-600">•</span>
                        <span className="text-stone-600">{hiveTypeLabels[hive.hive_type] || hive.hive_type}</span>
                      </div>

                      {/* Queen Status */}
                      <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-700 mb-1">{t('queenStatus', selectedLanguage)}</p>
                            <p className="font-bold text-purple-900">{hive.queen_present ? t('queenPresent', selectedLanguage) : t('queenless', selectedLanguage)}</p>
                          </div>
                          {hive.queen_present && hive.queen_age != null && (
                            <div className="text-right">
                              <p className="text-xs text-purple-700 mb-1">{t('queenAge', selectedLanguage)}</p>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-purple-900">{hive.queen_age} yrs</p>
                                {hive.queen_age_risk && queenAgeRiskConfig[hive.queen_age_risk] && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${queenAgeRiskConfig[hive.queen_age_risk].color}`}>
                                    {queenAgeRiskConfig[hive.queen_age_risk].label}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Colony & Inspection */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-700 mb-0.5">{t('colonyStrength', selectedLanguage)}</p>
                          <p className="font-bold text-sm text-amber-900 capitalize">{colonyStrengthLabels[hive.colony_strength || 'normal'] || hive.colony_strength || 'Normal'}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-emerald-50'}`}>
                          <p className={`text-xs mb-0.5 ${isOverdue ? 'text-red-700' : 'text-emerald-700'}`}>{t('lastInspection', selectedLanguage)}</p>
                          <div className="flex items-center gap-1">
                            <p className={`font-bold text-sm ${isOverdue ? 'text-red-900' : 'text-emerald-900'}`}>
                              {hive.last_inspection_date ? `${daysAgo} ${t('daysAgo', selectedLanguage)}` : t('noData', selectedLanguage)}
                            </p>
                            {isOverdue && <AlertTriangle className="w-3 h-3 text-red-600" />}
                          </div>
                        </div>
                      </div>

                      {/* Pest Alert */}
                      {!!hive.pest_detected && (
                        <div className="p-2 bg-red-100 rounded-lg flex items-start gap-2">
                          <Bug className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-red-800 mb-0.5">{t('pestDetected', selectedLanguage)}</p>
                            {hive.pest_reported_date && (
                              <p className="text-xs text-red-700">{t('reportedOn', selectedLanguage)} {hive.pest_reported_date}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1.5">
                        <button onClick={() => onViewHive(hive.id)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-1 text-xs min-h-9">
                          <Eye className="w-3.5 h-3.5" /><span>{t('view', selectedLanguage)}</span>
                        </button>
                        <button
                          onClick={() => onEditHive?.(hive)}
                          className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-1 text-xs min-h-9"
                        >
                          <Pencil className="w-3.5 h-3.5" /><span>{t('edit', selectedLanguage)}</span>
                        </button>
                        <button
                          onClick={() => { setActiveHiveId(hive.id); setShowHiveActions(true); }}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-full transition-colors min-h-9 flex items-center justify-center"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Move Hive Form Modal */}
      {showMoveForm && activeHiveId && (
        <MoveHiveFormModal
          hiveId={activeHiveId}
          selectedLanguage={selectedLanguage}
          onClose={() => setShowMoveForm(false)}
          onSaved={() => {
            setShowMoveForm(false);
            hivesService.getAll()
              .then(h => setHives(h))
              .catch((error) => {
                console.error('Failed to refresh hives:', error);
              });
          }}
        />
      )}

      {/* Floating Add Button */}
      {filtered.length > 0 && (
        <button onClick={onCreateHive} className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-20">
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// ---- Move Hive Form Modal ----
function MoveHiveFormModal({ hiveId, selectedLanguage, onClose, onSaved }: { hiveId: number; selectedLanguage: Language; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [targetApiaryId, setTargetApiaryId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiariesService.getAll().then(setApiaries).catch(() => setApiaries([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApiaryId) return;
    setSaving(true);
    setError('');
    try {
      await hivesService.moveToApiary(hiveId, parseInt(targetApiaryId, 10));
      onSaved();
    } catch (err) {
      console.error('Failed to move hive:', err);
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to move hive');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-stone-800">{t('moveHive', selectedLanguage)}</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">Select the destination apiary and confirm. This moves the current hive without splitting.</p>
        </div>
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-2">
          <select
            required
            value={targetApiaryId}
            onChange={(event) => setTargetApiaryId(event.target.value)}
            className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="">{t('selectTargetApiary', selectedLanguage)}</option>
            {apiaries.map((apiary) => (
              <option key={apiary.id} value={apiary.id}>{apiary.name}</option>
            ))}
          </select>
          <button type="submit" disabled={saving || !targetApiaryId} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t('moving', selectedLanguage) : t('moveHive', selectedLanguage)}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryCard({ title, value, color, alert }: { title: string; value: string; color: 'emerald' | 'amber' | 'red' | 'blue' | 'stone' | 'orange'; alert?: boolean }) {
  const toneClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
    red: 'bg-red-50 border-red-100 text-red-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
    stone: 'bg-stone-50 border-stone-200 text-stone-900',
    orange: 'bg-orange-50 border-orange-100 text-orange-900',
  };
  return (
    <div className={`rounded-lg p-2.5 border relative ${toneClasses[color]}`}>
      {alert && <AlertTriangle className="absolute top-1.5 right-1.5 w-3 h-3 text-red-500" />}
      <p className="text-[0.64rem] font-medium opacity-80 leading-tight">{title}</p>
      <p className="text-[0.98rem] font-bold leading-none mt-0.5">{value}</p>
    </div>
  );
}
