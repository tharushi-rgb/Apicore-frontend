import { useState, useEffect } from 'react';
import { Plus, MapPin, AlertTriangle, Loader2, ChevronRight, Eye, Zap, Search } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { t } from '../../i18n';
import { landownerPlotsService, type LandPlot } from '../../services/landownerPlotsService';
import { landownerMarketplaceService, type Contract } from '../../services/landownerMarketplace';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'plots' | 'listings' | 'bids' | 'contracts' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onAddPlot: () => void;
  onEditPlot: (plot: LandPlot) => void;
  onLogout: () => void;
}

interface PlotWithStats {
  plot: LandPlot;
  hiveCount: number;
  maxCapacity: number;
  occupancyPercent: number;
  activeContracts: number;
  revenue: number;
}

export function LandownerPlotsScreen({
  selectedLanguage,
  onLanguageChange,
  onNavigate,
  onAddPlot,
  onEditPlot,
  onLogout,
}: Props) {
  const [plots, setPlots] = useState<PlotWithStats[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotSearch, setPlotSearch] = useState('');
  const [plotStatus, setPlotStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load plots
      const plotData = await landownerPlotsService.getPlots();

      // Load contracts
      const contractData = await landownerMarketplaceService.getContracts();
      setContracts(contractData.filter(c => c.status === 'active'));

      // Build plot stats
      const plotsWithStats: PlotWithStats[] = await Promise.all(
        plotData.map(async (plot) => {
          const hiveCount = await landownerPlotsService.getPlotHiveCount(plot.id);
          const maxCapacity = Math.floor(plot.total_acreage * 8); // ~8 hives per acre
          const plotContracts = contractData.filter(c => c.plot_id === plot.id && c.status === 'active');

          return {
            plot,
            hiveCount,
            maxCapacity,
            occupancyPercent: maxCapacity > 0 ? (hiveCount / maxCapacity) * 100 : 0,
            activeContracts: plotContracts.length,
            revenue: plotContracts.reduce((sum, c) => sum + (c.cash_rent_lkr || 0), 0),
          };
        })
      );

      setPlots(plotsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPlots = plots.length;
  const totalActiveContracts = contracts.length;
  const totalHives = plots.reduce((sum, p) => sum + p.hiveCount, 0);
  const totalRevenue = plots.reduce((sum, p) => sum + p.revenue, 0);

  const filteredPlots = plots.filter(({ plot, activeContracts }) => {
    if (plotStatus === 'active' && activeContracts === 0) return false;
    if (plotStatus === 'inactive' && activeContracts > 0) return false;
    const query = plotSearch.trim().toLowerCase();
    if (!query) return true;
    const forageText = (plot.forage_entries || []).map((entry) => entry.name).join(' ').toLowerCase();
    return (
      plot.name.toLowerCase().includes(query) ||
      plot.district?.toLowerCase().includes(query) ||
      forageText.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      <MobileHeader
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
        onLogout={onLogout}
        role="landowner"
        theme="green"
        userName="Landowner"
        roleLabel={t('plotManager', selectedLanguage)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Your Plots Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">Your Plots</h2>
              <p className="text-xs text-stone-600">{totalPlots} registered plots • {totalActiveContracts} active contracts</p>
            </div>
            <button
              onClick={onAddPlot}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Plot
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={plotSearch}
                onChange={(event) => setPlotSearch(event.target.value)}
                placeholder="Search plots by name, district, or forage"
                className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <select
              value={plotStatus}
              onChange={(event) => setPlotStatus(event.target.value as typeof plotStatus)}
              className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[0.75rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filteredPlots.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-stone-100">
              <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-600 font-medium mb-2">
                {totalPlots === 0 ? t('noPlotsYet', selectedLanguage) : t('noPlotsMatchFilters', selectedLanguage)}
              </p>
              <p className="text-xs text-stone-500 mb-4">
                {totalPlots === 0 ? t('createFirstPlotMessage', selectedLanguage) : t('tryAdjustingFilters', selectedLanguage)}
              </p>
              <button
                onClick={onAddPlot}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm mx-auto transition-colors"
              >
                {t('createFirstPlotBtn', selectedLanguage)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlots.map(({ plot, hiveCount, maxCapacity, occupancyPercent, activeContracts, revenue }) => (
                <div
                  key={plot.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Image Section */}
                  <div className="relative h-40 bg-gradient-to-br from-amber-200 to-emerald-200 overflow-hidden">
                    {plot.images && plot.images.length > 0 ? (
                      <img src={plot.images[0]} alt={plot.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <MapPin className="w-12 h-12" />
                      </div>
                    )}

                    {/* Status Badge */}
                    {activeContracts > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col gap-3">
                    {/* Title and Location */}
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 mb-0.5">{plot.name}</h3>
                      <p className="text-xs text-stone-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {plot.district} District
                      </p>
                    </div>

                    {/* Hive Occupancy */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-stone-700">Hive occupancy</span>
                        <span className="text-xs font-bold text-stone-800">
                          {hiveCount}/{maxCapacity} hives
                        </span>
                      </div>
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyPercent >= 100
                              ? 'bg-red-500'
                              : occupancyPercent >= 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Forage Tags (max 2) */}
                    {plot.forage_entries && plot.forage_entries.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {plot.forage_entries.slice(0, 2).map((forage, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                            {forage.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Revenue Display (if applicable) */}
                    {revenue > 0 && (
                      <div className="text-xs text-amber-700 font-medium pt-1">
                        Revenue <span className="text-sm">Rs. {revenue.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => onNavigate('contracts')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Contract
                      </button>
                      <button
                        onClick={() => onNavigate('listings')}
                        className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" /> Create Listing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Contracts Section */}
        {contracts.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-stone-900 mb-3">
              Active Contracts <span className="text-xs font-normal text-stone-600 ml-1.5">{contracts.length}</span>
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-3 text-left font-semibold text-stone-700 text-xs uppercase tracking-wide">Beekeeper</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700 text-xs uppercase tracking-wide">Plot</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700 text-xs uppercase tracking-wide">Expiry</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-700 text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-stone-900">{contract.beekeeperName}</p>
                            <p className="text-xs text-stone-500">{contract.hiveCount} hives</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-700">{contract.plotName}</td>
                        <td className="px-4 py-3 text-stone-700">{contract.expiryLabel}</td>
                        <td className="px-4 py-3">
                          {contract.status === 'active' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                          {contract.status === 'moving_out_requested' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Moving Out
                            </span>
                          )}
                          {contract.status === 'completed' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between">
                <p className="text-xs text-stone-600">
                  Showing {contracts.length} active contract{contracts.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => onNavigate('contracts')}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
