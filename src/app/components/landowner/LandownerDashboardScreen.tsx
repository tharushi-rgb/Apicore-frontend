import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BadgeIndianRupee, GanttChartSquare, Hexagon, Leaf, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { landownerMarketplaceService } from '../../services/landownerMarketplace';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';
type RevenueTab = 'rupees' | 'honey_share';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

interface DashboardStats {
  hiveCount: number;
  pendingBids: number;
  rupeesReceived: number;
  honeyShareKg: number;
}

const INITIAL_STATS: DashboardStats = {
  hiveCount: 0,
  pendingBids: 0,
  rupeesReceived: 0,
  honeyShareKg: 0,
};

function formatRupees(value: number) {
  return `Rs. ${value.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

function formatHoneyKg(value: number) {
  return `${value.toLocaleString('en-LK', { maximumFractionDigits: 1 })} kg`;
}

export function LandownerDashboardScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [revenueTab, setRevenueTab] = useState<RevenueTab>('rupees');
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();

  useEffect(() => {
    const loadStats = () => {
      try {
        setStats(landownerMarketplaceService.getDashboardStats());
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  const displayName = useMemo(() => user?.name || 'Landowner', [user?.name]);
  const revenueValue = revenueTab === 'rupees' ? formatRupees(stats.rupeesReceived) : formatHoneyKg(stats.honeyShareKg);
  const revenueNote = revenueTab === 'rupees' ? 'Total cash rent received to date' : 'Total honey yield share received to date';

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-emerald-50 via-green-50 to-white flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm">
        <MobileHeader
          userName={displayName}
          roleLabel="Landowner"
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="dashboard"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
          role="landowner"
          theme="green"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
          <h1 className="text-base font-extrabold leading-5 text-stone-900">{displayName}</h1>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">Landowner</p>
          <p className="mt-1 text-sm text-stone-600">Summary of activity and pending actions.</p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Hive Count</p>
                  <p className="mt-1 text-lg font-extrabold leading-none text-stone-900">{stats.hiveCount}</p>
                  <p className="mt-0.5 text-sm text-stone-600">Across active listings</p>
                </div>
                <div className="rounded-xl bg-emerald-100 p-2.5">
                  <Hexagon className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Revenue</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-emerald-50 p-1.5">
                <button
                  onClick={() => setRevenueTab('rupees')}
                  className={`rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
                    revenueTab === 'rupees' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <BadgeIndianRupee className="h-3.5 w-3.5" />
                    Rupees
                  </span>
                </button>
                <button
                  onClick={() => setRevenueTab('honey_share')}
                  className={`rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
                    revenueTab === 'honey_share' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5" />
                    Honey Share
                  </span>
                </button>
              </div>

              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[1.25rem] font-extrabold leading-none text-stone-900">{revenueValue}</p>
                  <p className="mt-1 text-sm text-stone-600">{revenueNote}</p>
                </div>
                <div className="rounded-xl bg-emerald-100 p-2.5">
                  <GanttChartSquare className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </section>

            <button
              onClick={() => navigate('/listings?filter=pending-bids')}
              className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left shadow-sm transition hover:bg-amber-100/70"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending Bids</p>
                  <p className="mt-1 text-lg font-extrabold leading-none text-stone-900">{stats.pendingBids}</p>
                  <p className="mt-0.5 text-sm text-stone-600">Tap to review pending listings</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-700" />
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
