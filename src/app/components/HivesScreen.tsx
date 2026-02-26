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
} from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { hivesService, type Hive } from '../services/hives';
import { authService } from '../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onCreateHive: () => void; onViewHive: (id: number) => void; onEditHive?: (hive: Hive) => void; onLogout: () => void;
}

export function HivesScreen({ selectedLanguage, onLanguageChange, onNavigate, onCreateHive, onViewHive, onEditHive, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showHiveActions, setShowHiveActions] = useState(false);
  const [activeHiveId, setActiveHiveId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'hives';

  useEffect(() => {
    hivesService.getAll().then(h => { setHives(h); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Queenless', value: 'queenless' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Absconded', value: 'absconded' },
  ];

  const calculateDaysAgo = (dateStr?: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getTags = (h: Hive) => {
    const tags: string[] = [];
    if (h.pest_detected) tags.push('Pest Active');
    if (h.inspection_overdue) tags.push('Needs Inspection');
    if (h.queen_age_risk === 'high') tags.push('Queen Change Due');
    if (h.status === 'queenless') tags.push('Queenless');
    return tags;
  };

  // Summary stats
  const totalHives = hives.length;
  const activeHives = hives.filter(h => h.status === 'active').length;
  const queenlessHives = hives.filter(h => h.status === 'queenless').length;
  const apiaryLinkedHives = hives.filter(h => h.location_type === 'apiary-linked').length;
  const standaloneHives = hives.filter(h => h.location_type === 'standalone').length;
  const pestDetectedHives = hives.filter(h => h.pest_detected).length;

  const filtered = hives.filter(h => {
    if (activeFilter !== 'all' && h.status !== activeFilter) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.apiary_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDeleteHive = async () => {
    if (!activeHiveId) return;
    const confirmed = window.confirm('Delete this hive? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await hivesService.delete(activeHiveId);
      setHives(prev => prev.filter(h => h.id !== activeHiveId));
      setShowHiveActions(false);
      setActiveHiveId(null);
    } catch (error) {
      console.error('Failed to delete hive', error);
      alert('Failed to delete hive');
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
      <MobileSidebar isOpen={isSidebarOpen} activeTab={activeTab} onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      {/* Filter Overlay */}
      {showFilters && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)}>
          <div className="absolute top-20 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800">Filter Hives</h2>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {filterOptions.map((filter, index) => (
                <button
                  key={index}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeFilter === filter.value ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                  onClick={() => { setActiveFilter(filter.value); setShowFilters(false); }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Sheet Overlay */}
      {showHiveActions && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowHiveActions(false)}>
          <div className="absolute bottom-6 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (activeHiveId) {
                    const hive = hives.find(h => h.id === activeHiveId);
                    if (hive && onEditHive) onEditHive(hive);
                  }
                  setShowHiveActions(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
              >
                Edit Hive
              </button>
              <button onClick={handleDeleteHive} className="w-full text-left px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700">
                Delete Hive
              </button>
              <button onClick={() => setShowHiveActions(false)} className="w-full text-left px-4 py-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">Hives</h1>
            <p className="text-stone-500 text-sm mt-1">All registered hives</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Summary Cards - 6-card Grid */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard title="Total" value={totalHives.toString()} color="emerald" />
            <SummaryCard title="Active" value={activeHives.toString()} color="amber" />
            <SummaryCard title="Queenless" value={queenlessHives.toString()} color="red" alert />
            <SummaryCard title="In Apiaries" value={apiaryLinkedHives.toString()} color="blue" />
            <SummaryCard title="Standalone" value={standaloneHives.toString()} color="stone" />
            <SummaryCard title="Pests" value={pestDetectedHives.toString()} color="orange" alert={pestDetectedHives > 0} />
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Hive ID or Apiary"
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <button onClick={() => setShowFilters(true)} className="bg-white border-2 border-stone-200 hover:border-amber-500 p-3 rounded-xl transition-colors">
              <Filter className="w-5 h-5 text-stone-700" />
            </button>
          </div>

          {/* Hives List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <HiveIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-stone-800 mb-2">No hives added yet</h2>
              <p className="text-stone-600 mb-6">Add your first hive to start tracking inspections, queen health, pest activity, and harvests</p>
              <button onClick={onCreateHive} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-colors">
                <Plus className="w-5 h-5" /> Add Hive
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
                  active: { label: 'Active', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
                  queenless: { label: 'Queenless', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
                  inactive: { label: 'Inactive', textColor: 'text-stone-700', bgColor: 'bg-stone-50' },
                  absconded: { label: 'Absconded', textColor: 'text-red-700', bgColor: 'bg-red-50' },
                };
                const config = statusConfig[hive.status] || statusConfig.active;

                const queenAgeRiskConfig: Record<string, { label: string; color: string }> = {
                  low: { label: 'Healthy', color: 'bg-emerald-100 text-emerald-700' },
                  medium: { label: 'Monitor', color: 'bg-amber-100 text-amber-700' },
                  high: { label: 'Critical', color: 'bg-red-100 text-red-700' },
                };

                const hiveTypeLabels: Record<string, string> = { box: 'Standard Box Hive', pot: 'Pot Hive', log: 'Log Hive', stingless: 'Stingless Hive' };
                const colonyStrengthLabels: Record<string, string> = { weak: 'Weak', normal: 'Normal', strong: 'Strong' };

                return (
                  <div key={hive.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${hasWarning ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="p-5 space-y-4">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-stone-800 flex-1">{hive.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} whitespace-nowrap`}>
                          {config.label}
                        </span>
                      </div>

                      {/* Location Type */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${hive.location_type === 'apiary-linked' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-700'}`}>
                          {hive.location_type === 'apiary-linked' ? 'Apiary-Linked' : 'Standalone'}
                        </span>
                        <span className="text-stone-600">•</span>
                        <span className="text-stone-700 font-medium">{hive.apiary_name || 'Standalone Hive'}</span>
                        <span className="text-stone-600">•</span>
                        <span className="text-stone-600">{hiveTypeLabels[hive.hive_type] || hive.hive_type}</span>
                      </div>

                      {/* Queen Status */}
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-700 mb-1">Queen Status</p>
                            <p className="font-bold text-purple-900">{hive.queen_present ? 'Present' : 'Queenless'}</p>
                          </div>
                          {hive.queen_present && hive.queen_age != null && (
                            <div className="text-right">
                              <p className="text-xs text-purple-700 mb-1">Queen Age</p>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-700 mb-1">Colony Strength</p>
                          <p className="font-bold text-amber-900 capitalize">{colonyStrengthLabels[hive.colony_strength || 'normal'] || hive.colony_strength || 'Normal'}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-emerald-50'}`}>
                          <p className={`text-xs mb-1 ${isOverdue ? 'text-red-700' : 'text-emerald-700'}`}>Last Inspection</p>
                          <div className="flex items-center gap-1">
                            <p className={`font-bold ${isOverdue ? 'text-red-900' : 'text-emerald-900'}`}>
                              {hive.last_inspection_date ? `${daysAgo} days ago` : 'N/A'}
                            </p>
                            {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          </div>
                        </div>
                      </div>

                      {/* Pest Alert */}
                      {!!hive.pest_detected && (
                        <div className="p-3 bg-red-100 rounded-lg flex items-start gap-3">
                          <Bug className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-red-800 mb-1">Pest detected</p>
                            {hive.pest_reported_date && (
                              <p className="text-xs text-red-700">Reported on: {hive.pest_reported_date}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button onClick={() => onViewHive(hive.id)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" /><span className="text-sm">View</span>
                        </button>
                        <button
                          onClick={() => onEditHive?.(hive)}
                          className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /><span className="text-sm">Edit</span>
                        </button>
                        <button
                          onClick={() => { setActiveHiveId(hive.id); setShowHiveActions(true); }}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-3 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
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

      {/* Floating Add Button */}
      {filtered.length > 0 && (
        <button onClick={onCreateHive} className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-20">
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryCard({ title, value, color, alert }: { title: string; value: string; color: 'emerald' | 'amber' | 'red' | 'blue' | 'stone' | 'orange'; alert?: boolean }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500',
    blue: 'bg-blue-500', stone: 'bg-stone-400', orange: 'bg-orange-500',
  };
  return (
    <div className="bg-white rounded-lg p-2.5 shadow-sm relative">
      <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-lg ${colorClasses[color]}`} />
      {alert && <AlertTriangle className="absolute top-1.5 right-1.5 w-3 h-3 text-red-500" />}
      <p className="text-stone-600 text-[10px] mb-0.5 leading-tight">{title}</p>
      <p className="text-xl font-bold text-stone-800 leading-none">{value}</p>
    </div>
  );
}
