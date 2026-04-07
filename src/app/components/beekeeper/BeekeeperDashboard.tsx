import { useState, useEffect, useRef } from 'react';
import { MobileHeader } from '../shared/MobileHeader';
import { dashboardService, type DashboardData } from '../../services/dashboard';
import { planningService } from '../../services/planning';
import { GBIF_FORAGE_SPECIES } from '../../services/gbifForage';
import { expensesService } from '../../services/finance';
import { apiariesService } from '../../services/apiaries';
import { authService } from '../../services/auth';
import { supabase } from '../../services/supabaseClient';
import { AlertTriangle, ClipboardList, Hexagon as HiveIcon, Leaf, Sprout, Wallet, Wheat, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';
type RankTab = 'harvest' | 'expenses' | 'pest';

interface RankEntry { id: number; name: string; secondary: string; value: number; label: string; }
interface ForageAreaEntry {
  id: number;
  district: string;
  area: string;
  display: string;
  totalYield: number;
  records: number;
  forageRecords: string[];
}

const SRI_LANKA_DISTRICTS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Ampara', lat: 7.2833, lng: 81.6667 },
  { name: 'Anuradhapura', lat: 8.3356, lng: 80.4067 },
  { name: 'Badulla', lat: 6.9898, lng: 81.0556 },
  { name: 'Batticaloa', lat: 7.717, lng: 81.7 },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Galle', lat: 6.0535, lng: 80.221 },
  { name: 'Gampaha', lat: 7.0917, lng: 80.0 },
  { name: 'Hambantota', lat: 6.1241, lng: 81.1185 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Kalutara', lat: 6.5854, lng: 79.9607 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Kegalle', lat: 7.2513, lng: 80.3464 },
  { name: 'Kilinochchi', lat: 9.3803, lng: 80.377 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3624 },
  { name: 'Mannar', lat: 8.978, lng: 79.9044 },
  { name: 'Matale', lat: 7.4675, lng: 80.6234 },
  { name: 'Matara', lat: 5.9549, lng: 80.555 },
  { name: 'Monaragala', lat: 6.8727, lng: 81.3506 },
  { name: 'Mullaitivu', lat: 9.2671, lng: 80.812 },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { name: 'Polonnaruwa', lat: 7.9403, lng: 81.0188 },
  { name: 'Puttalam', lat: 8.0362, lng: 79.8283 },
  { name: 'Ratnapura', lat: 6.6828, lng: 80.3992 },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { name: 'Vavuniya', lat: 8.7514, lng: 80.4997 },
];

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

export function BeekeeperDashboard({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [forageData, setForageData] = useState<any[]>([]);
  const [upcomingForage, setUpcomingForage] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [harvestRows, setHarvestRows] = useState<any[]>([]);
  const [inspectionRows, setInspectionRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forageTab, setForageTab] = useState<'current' | 'upcoming'>('current');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Best performing tabs
  const [hiveRankTab, setHiveRankTab] = useState<RankTab>('harvest');
  const [apiaryRankTab, setApiaryRankTab] = useState<RankTab>('harvest');

  // Rankings data
  const [hiveHarvestRank, setHiveHarvestRank] = useState<RankEntry[]>([]);
  const [hiveExpenseRank, setHiveExpenseRank] = useState<RankEntry[]>([]);
  const [hivePestRank, setHivePestRank] = useState<RankEntry[]>([]);
  const [apiaryHarvestRank, setApiaryHarvestRank] = useState<RankEntry[]>([]);
  const [apiaryExpenseRank, setApiaryExpenseRank] = useState<RankEntry[]>([]);
  const [apiaryPestRank, setApiaryPestRank] = useState<RankEntry[]>([]);
  const [forageAreaRank, setForageAreaRank] = useState<ForageAreaEntry[]>([]);

  // Overlays
  const [showHiveOverlay, setShowHiveOverlay] = useState(false);
  const [showApiaryOverlay, setShowApiaryOverlay] = useState(false);
  const [showForageOverlay, setShowForageOverlay] = useState(false);
  const [showAreaPerformanceOverlay, setShowAreaPerformanceOverlay] = useState(false);
  const [overlayHiveTab, setOverlayHiveTab] = useState<RankTab>('harvest');
  const [overlayApiaryTab, setOverlayApiaryTab] = useState<RankTab>('harvest');
  const [selectedForagePlant, setSelectedForagePlant] = useState<any | null>(null);

  const user = authService.getLocalUser();

  const loadData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = (currentMonth % 12) + 1;
      const userId = user?.id;

      const [dashData, forage, upcoming, expenseData, harvestData, inspectionData] = await Promise.all([
        dashboardService.get(),
        planningService.getForageByMonth(currentMonth),
        planningService.getForageByMonth(nextMonth),
        expensesService.getAll().catch(() => []),
        supabase.from('harvests').select('quantity, harvest_date').eq('user_id', userId).then((r) => r.data ?? [], () => []),
        supabase.from('inspections').select('pest_detected, inspection_date').eq('user_id', userId).then((r) => r.data ?? [], () => []),
      ]);
      setData(dashData);
      setForageData(forage || []);
      setUpcomingForage(upcoming || []);
      setExpenses(expenseData || []);
      setHarvestRows(harvestData || []);
      setInspectionRows(inspectionData || []);

      if (userId) {
        await loadRankings(userId);
        // Check for contract expiry and create notifications
        await apiariesService.checkAndNotifyContractExpiry();
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when window gains focus (user comes back to dashboard)
  useEffect(() => {
    const handleFocus = () => {
      const userId = user?.id;
      if (userId) {
        console.log('Dashboard focused - refreshing rankings data');
        loadRankings(userId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  // Also refresh when component receives focus (for mobile navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('Dashboard visible - refreshing rankings data');
        loadRankings(user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  const loadRankings = async (userId: number) => {
    try {
      console.log('Loading rankings for user:', userId);
      const [
        { data: harvests, error: harvestError },
        { data: allExpenses, error: expenseError },
        { data: inspections, error: inspectionError },
        { data: apiaryRows, error: apiaryError },
        { data: hiveRows, error: hiveError },
      ] = await Promise.all([
        supabase
          .from('harvests')
          .select('hive_id, apiary_id, quantity, harvest_date')
          .eq('user_id', userId),
        supabase
          .from('expenses')
          .select('hive_id, apiary_id, amount')
          .eq('user_id', userId),
        supabase
          .from('inspections')
          .select('hive_id, apiary_id, pest_detected')
          .eq('user_id', userId),
        supabase
          .from('apiaries')
          .select('id, name, district, area, forage_primary')
          .eq('user_id', userId),
        supabase
          .from('hives')
          .select('id, name, apiary_id')
          .eq('user_id', userId),
      ]);

      if (harvestError) console.warn('Harvest error:', harvestError);
      if (expenseError) console.warn('Expense error:', expenseError);
      if (inspectionError) console.warn('Inspection error:', inspectionError);
      if (apiaryError) console.warn('Apiary error:', apiaryError);
      if (hiveError) console.warn('Hive error:', hiveError);

      console.log('Raw harvest data:', harvests);
      console.log('Raw hive data:', hiveRows);
      console.log('Raw apiary data:', apiaryRows);
      console.log('Total harvest records found:', harvests?.length || 0);

      // Create lookup maps
      const hiveLookup = new Map<number, { name: string; apiary_id?: number }>();
      (hiveRows || []).forEach((hive: any) => {
        hiveLookup.set(hive.id, { name: hive.name, apiary_id: hive.apiary_id });
      });

      const apiaryLookup = new Map<number, { name: string; district?: string; area?: string; forage_primary?: string }>();
      (apiaryRows || []).forEach((apiary: any) => {
        apiaryLookup.set(apiary.id, {
          name: apiary.name,
          district: apiary.district,
          area: apiary.area,
          forage_primary: apiary.forage_primary,
        });
      });

      // ── Hive rankings ──────────────────────────────────────────────
      // Harvest: highest total qty per hive
      const hiveHarvMap: Record<number, { name: string; apiary: string; qty: number }> = {};
      (harvests ?? []).forEach((h: any) => {
        if (!h.hive_id) return;
        const hiveInfo = hiveLookup.get(h.hive_id);
        const hiveName = hiveInfo?.name || `Hive ${h.hive_id}`;
        const apiaryInfo = hiveInfo?.apiary_id ? apiaryLookup.get(hiveInfo.apiary_id) : null;
        const apiaryName = apiaryInfo?.name || '—';
        if (!hiveHarvMap[h.hive_id]) hiveHarvMap[h.hive_id] = { name: hiveName, apiary: apiaryName, qty: 0 };
        hiveHarvMap[h.hive_id].qty += (h.quantity || 0);
        console.log(`Adding ${h.quantity}kg to hive ${h.hive_id} (${hiveName}). Total now: ${hiveHarvMap[h.hive_id].qty}kg`);
      });
      const hiveHarvRank = Object.entries(hiveHarvMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: v.apiary, value: v.qty, label: `${v.qty.toFixed(1)} kg` }))
        .sort((a, b) => b.value - a.value);
      setHiveHarvestRank(hiveHarvRank);
      console.log('Hive harvest rank set:', hiveHarvRank.length, 'entries', hiveHarvRank);

      // Expenses: lowest total per hive
      const hiveExpMap: Record<number, { name: string; apiary: string; amt: number }> = {};
      (allExpenses ?? []).forEach((e: any) => {
        if (!e.hive_id) return;
        const hiveInfo = hiveLookup.get(e.hive_id);
        const hiveName = hiveInfo?.name || `Hive ${e.hive_id}`;
        const apiaryInfo = hiveInfo?.apiary_id ? apiaryLookup.get(hiveInfo.apiary_id) : null;
        const apiaryName = apiaryInfo?.name || '—';
        if (!hiveExpMap[e.hive_id]) hiveExpMap[e.hive_id] = { name: hiveName, apiary: apiaryName, amt: 0 };
        hiveExpMap[e.hive_id].amt += e.amount || 0;
      });
      const hiveExpRank = Object.entries(hiveExpMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: v.apiary, value: v.amt, label: `Rs.${v.amt.toFixed(0)}` }))
        .sort((a, b) => a.value - b.value);
      setHiveExpenseRank(hiveExpRank);
      console.log('Hive expense rank set:', hiveExpRank.length, 'entries');

      // Pest: lowest detection count per hive
      const hivePestMap: Record<number, { name: string; apiary: string; count: number }> = {};
      (inspections ?? []).forEach((i: any) => {
        if (!i.hive_id) return;
        const hiveInfo = hiveLookup.get(i.hive_id);
        const hiveName = hiveInfo?.name || `Hive ${i.hive_id}`;
        const apiaryInfo = hiveInfo?.apiary_id ? apiaryLookup.get(hiveInfo.apiary_id) : null;
        const apiaryName = apiaryInfo?.name || '—';
        if (!hivePestMap[i.hive_id]) hivePestMap[i.hive_id] = { name: hiveName, apiary: apiaryName, count: 0 };
        if (i.pest_detected) hivePestMap[i.hive_id].count += 1;
      });
      const hivePestRank = Object.entries(hivePestMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: v.apiary, value: v.count, label: `${v.count} detected` }))
        .sort((a, b) => a.value - b.value);
      setHivePestRank(hivePestRank);
      console.log('Hive pest rank set:', hivePestRank.length, 'entries');

      // ── Apiary rankings ────────────────────────────────────────────
      const apiaryHarvMap: Record<number, { name: string; qty: number }> = {};
      (harvests ?? []).forEach((h: any) => {
        // Get apiary_id from harvest directly, or from hive's apiary_id
        let aid = h.apiary_id;
        if (!aid && h.hive_id) {
          const hiveInfo = hiveLookup.get(h.hive_id);
          aid = hiveInfo?.apiary_id;
        }
        if (!aid) return;
        const apiaryInfo = apiaryLookup.get(aid);
        const aname = apiaryInfo?.name || `Apiary ${aid}`;
        if (!apiaryHarvMap[aid]) apiaryHarvMap[aid] = { name: aname, qty: 0 };
        apiaryHarvMap[aid].qty += (h.quantity || 0);
        console.log(`Adding ${h.quantity}kg to apiary ${aid} (${aname}). Total now: ${apiaryHarvMap[aid].qty}kg`);
      });
      const apiaryHarvRank = Object.entries(apiaryHarvMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: '', value: v.qty, label: `${v.qty.toFixed(1)} kg` }))
        .sort((a, b) => b.value - a.value);
      setApiaryHarvestRank(apiaryHarvRank);
      console.log('Apiary harvest rank set:', apiaryHarvRank.length, 'entries', apiaryHarvRank);

      const apiaryExpMap: Record<number, { name: string; amt: number }> = {};
      (allExpenses ?? []).forEach((e: any) => {
        let aid = e.apiary_id;
        if (!aid && e.hive_id) {
          const hiveInfo = hiveLookup.get(e.hive_id);
          aid = hiveInfo?.apiary_id;
        }
        if (!aid) return;
        const apiaryInfo = apiaryLookup.get(aid);
        const aname = apiaryInfo?.name || `Apiary ${aid}`;
        if (!apiaryExpMap[aid]) apiaryExpMap[aid] = { name: aname, amt: 0 };
        apiaryExpMap[aid].amt += e.amount || 0;
      });
      const apiaryExpRank = Object.entries(apiaryExpMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: '', value: v.amt, label: `Rs.${v.amt.toFixed(0)}` }))
        .sort((a, b) => a.value - b.value);
      setApiaryExpenseRank(apiaryExpRank);
      console.log('Apiary expense rank set:', apiaryExpRank.length, 'entries');

      const apiaryPestMap: Record<number, { name: string; count: number }> = {};
      (inspections ?? []).forEach((i: any) => {
        let aid = i.apiary_id;
        if (!aid && i.hive_id) {
          const hiveInfo = hiveLookup.get(i.hive_id);
          aid = hiveInfo?.apiary_id;
        }
        if (!aid) return;
        const apiaryInfo = apiaryLookup.get(aid);
        const aname = apiaryInfo?.name || `Apiary ${aid}`;
        if (!apiaryPestMap[aid]) apiaryPestMap[aid] = { name: aname, count: 0 };
        if (i.pest_detected) apiaryPestMap[aid].count += 1;
      });
      const apiaryPestRank = Object.entries(apiaryPestMap)
        .map(([id, v]) => ({ id: +id, name: v.name, secondary: '', value: v.count, label: `${v.count} detected` }))
        .sort((a, b) => a.value - b.value);
      setApiaryPestRank(apiaryPestRank);
      console.log('Apiary pest rank set:', apiaryPestRank.length, 'entries');

      const forageAreaMap: Record<string, ForageAreaEntry> = {};
      (harvests ?? []).forEach((h: any) => {
        let aid = h.apiary_id;
        if (!aid && h.hive_id) {
          const hiveInfo = hiveLookup.get(h.hive_id);
          aid = hiveInfo?.apiary_id;
        }
        if (!aid) return;
        const apiaryInfo = apiaryLookup.get(aid);
        const district = (apiaryInfo?.district || 'Unknown').trim();
        const area = (apiaryInfo?.area || district || 'Unknown').trim();
        const key = `${district}|${area}`;
        if (!forageAreaMap[key]) {
          forageAreaMap[key] = {
            id: Object.keys(forageAreaMap).length + 1,
            district,
            area,
            display: area === district ? district : `${area}, ${district}`,
            totalYield: 0,
            records: 0,
            forageRecords: [],
          };
        }
        forageAreaMap[key].totalYield += h.quantity || 0;
        forageAreaMap[key].records += 1;
        const recordedForage = apiaryInfo?.forage_primary;
        if (recordedForage && !forageAreaMap[key].forageRecords.includes(recordedForage)) {
          forageAreaMap[key].forageRecords.push(recordedForage);
        }
      });

      (apiaryRows ?? []).forEach((apiary: any) => {
        const district = (apiary.district || 'Unknown').trim();
        const area = (apiary.area || district || 'Unknown').trim();
        const key = `${district}|${area}`;
        if (!forageAreaMap[key]) {
          forageAreaMap[key] = {
            id: Object.keys(forageAreaMap).length + 1,
            district,
            area,
            display: area === district ? district : `${area}, ${district}`,
            totalYield: 0,
            records: 0,
            forageRecords: [],
          };
        }
        forageAreaMap[key].records += 1;
        if (apiary.forage_primary && !forageAreaMap[key].forageRecords.includes(apiary.forage_primary)) {
          forageAreaMap[key].forageRecords.push(apiary.forage_primary);
        }
      });

      const forageAreaRankData = Object.values(forageAreaMap)
        .sort((a, b) => (b.totalYield - a.totalYield) || (b.records - a.records))
        .map((entry, index) => ({ ...entry, id: index + 1 }));
      setForageAreaRank(forageAreaRankData);
      console.log('Forage area rank set:', forageAreaRankData.length, 'entries');

      console.log('Rankings refresh completed at:', new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Rankings load error:', err);
    }
  };

  const hives = data?.hives || [];
  const apiaries = data?.apiaries || [];
  const forageAreaDisplay = (() => {
    if (forageAreaRank.length > 0) return forageAreaRank;
    const fallbackMap: Record<string, ForageAreaEntry> = {};
    apiaries.forEach((apiary: any) => {
      const district = (apiary.district || 'Unknown').trim();
      const area = (apiary.area || district || 'Unknown').trim();
      const key = `${district}|${area}`;
      if (!fallbackMap[key]) {
        fallbackMap[key] = {
          id: Object.keys(fallbackMap).length + 1,
          district,
          area,
          display: area === district ? district : `${area}, ${district}`,
          totalYield: 0,
          records: 0,
          forageRecords: [],
        };
      }
      fallbackMap[key].records += 1;
    });
    return Object.values(fallbackMap).sort((a, b) => b.records - a.records).map((entry, index) => ({ ...entry, id: index + 1 }));
  })();
  const isForageAreaFallback = forageAreaRank.length === 0 && forageAreaDisplay.length > 0;

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const rangeStart = Date.now() - (rangeDays * 24 * 60 * 60 * 1000);

  const activeHiveCount = hives.filter((h: any) => h.status === 'active').length;
  const queenlessHiveCount = hives.filter((h: any) => h.status === 'queenless').length;
  const pestAlertCount = inspectionRows
    .filter((inspection: any) => inspection.pest_detected)
    .length;
  const inactiveHiveCount = hives.filter((h: any) => h.status !== 'active' && h.status !== 'queenless').length;
  const totalApiaryCount = apiaries.length;
  const activeApiaryCount = apiaries.filter((a: any) => a.status === 'active').length;
  const inactiveApiaryCount = apiaries.filter((a: any) => a.status !== 'active').length;

  const rangeExpenses = expenses
    .filter((e: any) => { const dt = new Date(e.expense_date || e.created_at || '').getTime(); return !Number.isNaN(dt) && dt >= rangeStart; })
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const rangeNotInspected = hives.filter((h: any) => {
    if (!h.last_inspection_date) return true;
    const last = new Date(h.last_inspection_date).getTime();
    return Number.isNaN(last) || last < rangeStart;
  }).length;

  const rangeYield = harvestRows
    .filter((h: any) => {
      const dt = new Date(h.harvest_date || '').getTime();
      return !Number.isNaN(dt) && dt >= rangeStart;
    })
    .reduce((sum: number, harvest: any) => sum + (harvest.quantity || 0), 0);

  const hiveRankData: Record<RankTab, RankEntry[]> = { harvest: hiveHarvestRank, expenses: hiveExpenseRank, pest: hivePestRank };
  const apiaryRankData: Record<RankTab, RankEntry[]> = { harvest: apiaryHarvestRank, expenses: apiaryExpenseRank, pest: apiaryPestRank };

  const hiveTabColors: Record<RankTab, { bg: string; text: string; activeBg: string; activeText: string }> = {
    harvest: { bg: 'bg-amber-50', text: 'text-amber-700', activeBg: 'bg-amber-500', activeText: 'text-white' },
    expenses: { bg: 'bg-rose-50', text: 'text-rose-700', activeBg: 'bg-rose-500', activeText: 'text-white' },
    pest: { bg: 'bg-emerald-50', text: 'text-emerald-700', activeBg: 'bg-emerald-500', activeText: 'text-white' },
  };

  const findClosestDistrict = (lat: number, lng: number) => {
    let best = SRI_LANKA_DISTRICTS[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    SRI_LANKA_DISTRICTS.forEach((district) => {
      const dLat = district.lat - lat;
      const dLng = district.lng - lng;
      const dist = (dLat * dLat) + (dLng * dLng);
      if (dist < bestDistance) {
        bestDistance = dist;
        best = district;
      }
    });
    return best;
  };

  const getForageDistrictHotspots = (scientificName: string) => {
    const species = GBIF_FORAGE_SPECIES[scientificName as keyof typeof GBIF_FORAGE_SPECIES];
    if (!species?.hotspots?.length) return [] as Array<{ district: string; intensity: number; lat: number; lng: number }>;

    const districtCounts: Record<string, { intensity: number; lat: number; lng: number }> = {};
    species.hotspots.forEach(([lat, lng, count]) => {
      const district = findClosestDistrict(lat, lng);
      if (!districtCounts[district.name]) {
        districtCounts[district.name] = { intensity: 0, lat: district.lat, lng: district.lng };
      }
      districtCounts[district.name].intensity += count;
    });

    return Object.entries(districtCounts)
      .map(([district, data]) => ({ district, intensity: data.intensity, lat: data.lat, lng: data.lng }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 8);
  };

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <div className="h-full overflow-y-auto pb-24">
        {/* Navbar */}
        <MobileHeader
          userName={user?.name}
          roleLabel={user?.role || 'beekeeper'}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="dashboard"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
        />

        {/* Main Content */}
        <div className="px-2 py-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* ── Overview Stats ───────────────────────────────────────── */}
              <div className="space-y-2.5">
                <div>
                  <p className="text-[0.72rem] font-semibold text-stone-600 mb-1">{t('hives', selectedLanguage)}</p>
                  <div className="grid grid-cols-4 gap-1.5 bg-amber-50 rounded-xl p-1.5 border border-amber-100">
                    <StatBlock title={t('active', selectedLanguage)} value={activeHiveCount} tone="amber" icon={HiveIcon} />
                    <StatBlock title={t('inactive', selectedLanguage)} value={inactiveHiveCount} tone="stone" icon={ClipboardList} />
                    <StatBlock title={t('queenless', selectedLanguage)} value={queenlessHiveCount} tone="red" icon={AlertTriangle} />
                    <StatBlock title={t('pests', selectedLanguage)} value={pestAlertCount} tone="red" />
                  </div>
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold text-stone-600 mb-1">{t('apiaries', selectedLanguage)}</p>
                  <div className="grid grid-cols-3 gap-1.5 bg-emerald-50 rounded-xl p-1.5 border border-emerald-100">
                    <StatBlock title={t('active', selectedLanguage)} value={activeApiaryCount} tone="emerald" icon={Sprout} />
                    <StatBlock title={t('inactive', selectedLanguage)} value={inactiveApiaryCount} tone="stone" icon={ClipboardList} />
                    <StatBlock title={t('total', selectedLanguage)} value={totalApiaryCount} tone="blue" icon={Leaf} />
                  </div>
                </div>
                {/* Date range slider */}
                <div className="bg-stone-100 rounded-full flex p-0.5">
                  <RangeBtn active={dateRange === '7d'} onClick={() => setDateRange('7d')} label={t('oneWeek', selectedLanguage)} />
                  <RangeBtn active={dateRange === '30d'} onClick={() => setDateRange('30d')} label={t('oneMonth', selectedLanguage)} />
                  <RangeBtn active={dateRange === '90d'} onClick={() => setDateRange('90d')} label={t('threeMonths', selectedLanguage)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <InfoBox title={t('expenses', selectedLanguage)} value={`Rs.${rangeExpenses.toFixed(0)}`} tone="rose" icon={Wallet} />
                  <InfoBox title={t('notInspected', selectedLanguage)} value={String(rangeNotInspected)} tone="rose" icon={ClipboardList} />
                  <InfoBox title={t('totalYield', selectedLanguage)} value={`${rangeYield.toFixed(1)} kg`} tone="emerald" icon={Wheat} />
                </div>
              </div>

              {/* ── Best Performing Hives ────────────────────────────────── */}
              <PerformanceCard
                title={t('bestPerforming', selectedLanguage)}
                tab={hiveRankTab}
                onTabChange={setHiveRankTab}
                data={hiveRankData}
                tabColors={hiveTabColors}
                onSeeMore={() => { setOverlayHiveTab(hiveRankTab); setShowHiveOverlay(true); }}
                selectedLanguage={selectedLanguage}
              />

              {/* ── Best Performing Apiaries ─────────────────────────────── */}
              <PerformanceCard
                title={t('bestPerformingApiaries', selectedLanguage)}
                tab={apiaryRankTab}
                onTabChange={setApiaryRankTab}
                data={apiaryRankData}
                tabColors={hiveTabColors}
                onSeeMore={() => { setOverlayApiaryTab(apiaryRankTab); setShowApiaryOverlay(true); }}
                selectedLanguage={selectedLanguage}
              />

              {/* ── Forage Calendar ──────────────────────────────────────── */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h2 className="text-[0.875rem] font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" /> {t('forageCalendar', selectedLanguage)}
                </h2>
                <div className="flex gap-1.5 mb-3">
                  <button onClick={() => setForageTab('current')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[0.75rem] font-medium transition-colors ${forageTab === 'current' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                    {t('currentBlooming', selectedLanguage)}
                  </button>
                  <button onClick={() => setForageTab('upcoming')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[0.75rem] font-medium transition-colors ${forageTab === 'upcoming' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                    {t('upcoming', selectedLanguage)}
                  </button>
                </div>
                {forageTab === 'current' ? (
                  forageData.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {forageData.slice(0, 5).map((plant: any, idx: number) => (
                          <ForagePlantCard key={idx} plant={plant} type="current" onOpenArea={setSelectedForagePlant} selectedLanguage={selectedLanguage} />
                        ))}
                      </div>
                      {forageData.length > 5 && (
                        <button onClick={() => setShowForageOverlay(true)} className="mt-2 w-full text-center text-[0.75rem] font-semibold text-emerald-600 hover:text-emerald-700">
                          See more ({forageData.length - 5} more)
                        </button>
                      )}
                    </>
                  ) : <p className="text-center text-stone-500 text-sm py-4">{t('noForageBlooming', selectedLanguage)}</p>
                ) : (
                  upcomingForage.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {upcomingForage.slice(0, 5).map((plant: any, idx: number) => (
                          <ForagePlantCard key={idx} plant={plant} type="upcoming" onOpenArea={setSelectedForagePlant} selectedLanguage={selectedLanguage} />
                        ))}
                      </div>
                      {upcomingForage.length > 5 && (
                        <button onClick={() => setShowForageOverlay(true)} className="mt-2 w-full text-center text-[0.75rem] font-semibold text-emerald-600 hover:text-emerald-700">
                          See more ({upcomingForage.length - 5} more)
                        </button>
                      )}
                    </>
                  ) : <p className="text-center text-stone-500 text-sm py-4">{t('noForageBlooming', selectedLanguage)}</p>
                )}
              </div>

              {/* ── Best Performing Forage Areas ────────────────────────── */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[0.875rem] font-bold text-stone-800">{t('bestPerformingForageAreas', selectedLanguage)}</h2>
                  {forageAreaRank.length > 3 && (
                    <button
                      onClick={() => setShowAreaPerformanceOverlay(true)}
                      className="text-[0.72rem] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      See more
                    </button>
                  )}
                </div>
                {forageAreaDisplay.length === 0 ? (
                  <p className="text-center text-stone-400 text-[0.75rem] py-3">No area yield data available</p>
                ) : (
                  <div className="space-y-2">
                    {forageAreaDisplay.slice(0, 3).map((area, idx) => (
                      <button
                        key={`${area.district}-${area.area}-${idx}`}
                        onClick={() => setShowAreaPerformanceOverlay(true)}
                        className="w-full text-left rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[0.78rem] font-semibold text-stone-800 truncate">#{idx + 1} {area.display}</p>
                          <p className="text-[0.75rem] font-bold text-emerald-700">
                            {isForageAreaFallback ? `${area.records} apiaries` : `${area.totalYield.toFixed(1)} kg`}
                          </p>
                        </div>
                        <p className="text-[0.68rem] text-stone-600 mt-0.5 truncate">
                          {isForageAreaFallback
                            ? 'Based on registered apiaries'
                            : area.forageRecords.length > 0
                              ? `Recorded forage: ${area.forageRecords.join(', ')}`
                              : 'No forage names recorded yet'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Best Performing Hives Overlay ────────────────────────── */}
      {showHiveOverlay && (
        <RankingOverlay
          title={t('bestPerforming', selectedLanguage)}
          tab={overlayHiveTab}
          onTabChange={setOverlayHiveTab}
          data={hiveRankData}
          tabColors={hiveTabColors}
          onClose={() => setShowHiveOverlay(false)}
          selectedLanguage={selectedLanguage}
        />
      )}

      {/* ── Best Performing Apiaries Overlay ────────────────────── */}
      {showApiaryOverlay && (
        <RankingOverlay
          title={t('bestPerformingApiaries', selectedLanguage)}
          tab={overlayApiaryTab}
          onTabChange={setOverlayApiaryTab}
          data={apiaryRankData}
          tabColors={hiveTabColors}
          onClose={() => setShowApiaryOverlay(false)}
          selectedLanguage={selectedLanguage}
        />
      )}

      {/* ── Forage See All Overlay ───────────────────────────────── */}
      {showForageOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white sticky top-0 z-10">
            <h2 className="text-[0.95rem] font-bold text-stone-800 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" /> {t('forageCalendar', selectedLanguage)}
            </h2>
            <button onClick={() => setShowForageOverlay(false)} className="p-1.5 bg-stone-100 rounded-lg">
              <X className="w-4 h-4 text-stone-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-[0.72rem] font-semibold text-stone-500 mb-2">{t('currentBlooming', selectedLanguage)}</p>
            {forageData.map((plant: any, idx: number) => <ForagePlantCard key={idx} plant={plant} type="current" onOpenArea={setSelectedForagePlant} selectedLanguage={selectedLanguage} />)}
            {upcomingForage.length > 0 && (
              <>
                <p className="text-[0.72rem] font-semibold text-stone-500 mt-4 mb-2">{t('upcoming', selectedLanguage)}</p>
                {upcomingForage.map((plant: any, idx: number) => <ForagePlantCard key={idx} plant={plant} type="upcoming" onOpenArea={setSelectedForagePlant} selectedLanguage={selectedLanguage} />)}
              </>
            )}
          </div>
        </div>
      )}

      {selectedForagePlant && (
        <ForageAreaOverlay
          plant={selectedForagePlant}
          hotspots={getForageDistrictHotspots(selectedForagePlant.scientific)}
          onClose={() => setSelectedForagePlant(null)}
        />
      )}

      {showAreaPerformanceOverlay && (
        <ForageAreaPerformanceOverlay
          areas={forageAreaRank}
          onClose={() => setShowAreaPerformanceOverlay(false)}
          selectedLanguage={selectedLanguage}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBlock({
  title,
  value,
  tone,
  icon: Icon,
}: {
  title: string;
  value: number;
  tone: 'amber' | 'emerald' | 'red' | 'blue' | 'stone';
  icon?: any;
}) {
  const toneClass = { amber: 'bg-amber-100 text-amber-900', emerald: 'bg-emerald-100 text-emerald-900', red: 'bg-red-100 text-red-900', blue: 'bg-blue-100 text-blue-900', stone: 'bg-stone-100 text-stone-900' };
  return (
    <div className={`rounded-lg p-1.5 text-center ${toneClass[tone]}`}>
      <div className="flex items-center justify-center gap-0.5">
        {Icon && <Icon className="w-3 h-3 opacity-80" />}
        <p className="text-caption font-medium opacity-80">{title}</p>
      </div>
      <p className="text-button leading-none mt-0.5">{value}</p>
    </div>
  );
}

function InfoBox({
  title,
  value,
  tone,
  icon: Icon,
}: {
  title: string;
  value: string;
  tone: 'rose' | 'orange' | 'emerald';
  icon: any;
}) {
  const toneClass = tone === 'rose'
    ? 'bg-rose-50 border-rose-100 text-rose-900'
    : tone === 'orange'
      ? 'bg-orange-50 border-orange-100 text-orange-900'
      : 'bg-emerald-50 border-emerald-100 text-emerald-900';
  return (
    <div className={`rounded-xl border p-2 ${toneClass}`}>
      <div className="flex items-center gap-0.5">
        <Icon className="w-3 h-3 opacity-80" />
        <p className="text-caption font-medium opacity-80">{title}</p>
      </div>
      <p className="text-body font-bold leading-none mt-0.5">{value}</p>
    </div>
  );
}

function RangeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1 px-2 rounded-full text-caption font-semibold transition-all ${active ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'}`}>
      {label}
    </button>
  );
}

type TabColors = Record<RankTab, { bg: string; text: string; activeBg: string; activeText: string }>;

function PerformanceCard({
  title, tab, onTabChange, data, tabColors, onSeeMore, selectedLanguage = 'en',
}: {
  title: string; tab: RankTab; onTabChange: (t: RankTab) => void;
  data: Record<RankTab, RankEntry[]>; tabColors: TabColors; onSeeMore: () => void; selectedLanguage?: Language;
}) {
  const entries = data[tab].slice(0, 5);
  const tabMeta: { key: RankTab; label: string }[] = [
    { key: 'harvest', label: t('rankTabHarvest', selectedLanguage) },
    { key: 'expenses', label: t('rankTabExpenses', selectedLanguage) },
    { key: 'pest', label: t('rankTabPestDetection', selectedLanguage) },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-2 pt-2 pb-0">
        <p className="text-button text-stone-800 mb-1.5">{title}</p>
        {/* Real tab UI */}
        <div className="flex border-b border-stone-200">
          {tabMeta.map(({ key, label }) => {
            const { text, activeBg } = tabColors[key];
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex-1 py-1 text-caption font-semibold transition-colors relative ${isActive ? `${text} border-b-2` : 'text-stone-500 hover:text-stone-700'}`}
                style={isActive ? { borderBottomColor: activeBg.replace('bg-', '').includes('-') ? undefined : undefined } : {}}
              >
                <span className={isActive ? text : ''}>{label}</span>
                {isActive && (
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${activeBg}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-2 py-1.5 space-y-1">
        {entries.length === 0 ? (
          <p className="text-center text-stone-400 text-caption py-2">{t('noDataAvailableMessage', selectedLanguage)}</p>
        ) : entries.map((e, i) => (
          <RankRow key={e.id} rank={i + 1} entry={e} tone={tab === 'harvest' ? 'amber' : tab === 'expenses' ? 'rose' : 'emerald'} />
        ))}
        {data[tab].length > 5 && (
          <button onClick={onSeeMore} className={`w-full text-center font-semibold text-caption py-1 ${tabColors[tab].text} hover:opacity-80`}>
            {t('seeMoreButton', selectedLanguage)}
          </button>
        )}
      </div>
    </div>
  );
}

function RankRow({ rank, entry, tone }: { rank: number; entry: RankEntry; tone: 'amber' | 'rose' | 'emerald' }) {
  const numBg = tone === 'amber' ? 'bg-amber-100 text-amber-700' : tone === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
  const valColor = tone === 'amber' ? 'text-amber-700' : tone === 'rose' ? 'text-rose-700' : 'text-emerald-700';
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className={`w-4.5 h-4.5 rounded-full text-caption font-bold flex items-center justify-center shrink-0 ${numBg}`}>{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 truncate">{entry.name}</p>
        {entry.secondary && <p className="text-caption text-stone-500 truncate">{entry.secondary}</p>}
      </div>
      <span className={`text-caption font-bold shrink-0 ${valColor}`}>{entry.label}</span>
    </div>
  );
}

function RankingOverlay({
  title, tab, onTabChange, data, tabColors, onClose, selectedLanguage = 'en',
}: {
  title: string; tab: RankTab; onTabChange: (t: RankTab) => void;
  data: Record<RankTab, RankEntry[]>; tabColors: TabColors; onClose: () => void; selectedLanguage?: Language;
}) {
  const entries = data[tab].slice(0, 5);
  const tabMeta: { key: RankTab; label: string }[] = [
    { key: 'harvest', label: t('rankTabHarvest', selectedLanguage) },
    { key: 'expenses', label: t('rankTabExpenses', selectedLanguage) },
    { key: 'pest', label: t('rankTabPestShort', selectedLanguage) },
  ];
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 sticky top-0 bg-white z-10">
        <h2 className="text-[0.95rem] font-bold text-stone-800">{title}</h2>
        <button onClick={onClose} className="p-1.5 bg-stone-100 rounded-lg">
          <X className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <div className="flex border-b border-stone-200 px-4 sticky top-[52px] bg-white z-10">
        {tabMeta.map(({ key, label }) => {
          const { text, activeBg } = tabColors[key];
          const isActive = tab === key;
          return (
            <button key={key} onClick={() => onTabChange(key)}
              className={`flex-1 py-2 text-[0.75rem] font-semibold relative transition-colors ${isActive ? text : 'text-stone-500'}`}>
              {label}
              {isActive && <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${activeBg}`} />}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {entries.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-8">{t('noData', selectedLanguage)}</p>
        ) : entries.map((e, i) => (
          <RankRow key={e.id} rank={i + 1} entry={e} tone={tab === 'harvest' ? 'amber' : tab === 'expenses' ? 'rose' : 'emerald'} />
        ))}
      </div>
    </div>
  );
}

function ForagePlantCard({ plant, type, onOpenArea, selectedLanguage = 'en' }: { plant: any; type: 'current' | 'upcoming'; onOpenArea: (plant: any) => void; selectedLanguage?: Language }) {
  const baseClass = type === 'current'
    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
  const monthAbbr = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = plant.bloomStart && plant.bloomEnd ? `${monthAbbr[plant.bloomStart]}–${monthAbbr[plant.bloomEnd]}` : t('monthsNotListed', selectedLanguage);
  const csvLankaLabel = t('csvObsLanka', selectedLanguage);
  const sriLankaObs = typeof plant.gbifCount === 'number' ? `${plant.gbifCount} ${csvLankaLabel}` : '';
  const csvRecordsLabel = t('csvRecordsNearLocation', selectedLanguage);
  const nearbyRecords = typeof plant.note === 'string' && plant.note.includes('CSV records near location:')
    ? plant.note.replace('CSV records near location:', '').trim()
    : '';
  return (
    <div className={`p-3 rounded-lg border ${baseClass}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-stone-800 text-[0.82rem]">{plant.name}</span>
        {sriLankaObs && (
          <span className="text-[0.68rem] px-2 py-0.5 rounded-full font-semibold border border-blue-200 bg-blue-50 text-blue-700">
            {sriLankaObs}
          </span>
        )}
      </div>
      <p className="text-xs text-stone-600"><em>{plant.scientific}</em></p>
      <p className="text-[0.7rem] text-stone-600 mt-1">{t('observedMonths', selectedLanguage)}: {monthLabel}</p>
      {nearbyRecords && <p className="text-[0.7rem] text-stone-500">{csvRecordsLabel}: {nearbyRecords}</p>}
      <button
        onClick={() => onOpenArea(plant)}
        className="mt-2 text-[0.7rem] font-semibold text-emerald-700 hover:text-emerald-800"
      >
        View bloom areas in Sri Lanka
      </button>
    </div>
  );
}

function ForageAreaOverlay({
  plant,
  hotspots,
  onClose,
}: {
  plant: any;
  hotspots: Array<{ district: string; intensity: number; lat: number; lng: number }>;
  onClose: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const DEFAULT_LAT = 7.8731;
    const DEFAULT_LNG = 80.7718;
    const DEFAULT_ZOOM = 7;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add hotspot markers
      if (hotspots && hotspots.length > 0) {
        const maxIntensity = Math.max(...hotspots.map(h => h.intensity));
        
        hotspots.forEach((spot) => {
          const intensity = Math.max(0.3, spot.intensity / maxIntensity);
          const size = 12 + intensity * 20;
          
          // Create custom HTML icon with circle and intensity color
          const iconHtml = `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: rgba(16, 185, 129, ${0.5 + intensity * 0.5});
              border: 2px solid rgba(6, 78, 59, 0.8);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: white;
              font-weight: bold;
            ">
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
          });

          L.marker([spot.lat, spot.lng], { icon })
            .bindPopup(`<strong>${spot.district}</strong><br/>${spot.intensity} records`)
            .addTo(map.current!);
        });

        // Fit map bounds to all markers
        const group = new L.FeatureGroup(
          hotspots.map(spot => L.marker([spot.lat, spot.lng]))
        );
        map.current.fitBounds(group.getBounds().pad(0.1), { maxZoom: 9 });
      }
    }
  }, [hotspots]);

  const maxIntensity = hotspots.length > 0 ? Math.max(...hotspots.map((h) => h.intensity)) : 1;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <h2 className="text-[0.9rem] font-bold text-stone-800">{plant.name} bloom areas</h2>
        <button onClick={onClose} className="p-1.5 bg-stone-100 rounded-lg hover:bg-stone-200">
          <X className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-cyan-50 to-emerald-50 p-3">
          <p className="text-[0.72rem] text-stone-600 mb-2">Sri Lanka occurrence hotspots (CSV data: 0017890-260108223611665)</p>
          <div
            ref={mapContainer}
            className="w-full h-64 rounded-xl border border-stone-200 overflow-hidden"
            style={{ minHeight: '300px' }}
          />
        </div>

        <div className="bg-stone-50 rounded-xl p-3">
          <p className="text-[0.75rem] font-semibold text-stone-700 mb-2">Top recorded districts</p>
          {hotspots.length === 0 ? (
            <p className="text-[0.72rem] text-stone-500">No district hotspots were found for this forage in the CSV data.</p>
          ) : (
            <div className="space-y-1.5">
              {hotspots.map((spot, idx) => (
                <div key={`${spot.district}-${idx}`} className="flex items-center justify-between text-[0.73rem]">
                  <span className="font-medium text-stone-700">#{idx + 1} {spot.district}</span>
                  <span className="text-emerald-700 font-semibold">{spot.intensity} records</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ForageAreaPerformanceOverlay({
  areas,
  onClose,
  selectedLanguage = 'en',
}: {
  areas: ForageAreaEntry[];
  onClose: () => void;
  selectedLanguage?: Language;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <h2 className="text-[0.95rem] font-bold text-stone-800">{t('bestPerformingForageAreas', selectedLanguage)}</h2>
        <button onClick={onClose} className="p-1.5 bg-stone-100 rounded-lg">
          <X className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {areas.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-8">{t('noAreaYieldData', selectedLanguage)}</p>
        ) : (
          areas.map((area, idx) => (
            <div key={`${area.display}-${idx}`} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.8rem] font-semibold text-stone-800">#{idx + 1} {area.display}</p>
                <p className="text-[0.8rem] font-bold text-emerald-700">{area.totalYield.toFixed(1)} kg</p>
              </div>
              <p className="text-[0.68rem] text-stone-600 mt-0.5">{area.records} yield records from beekeepers</p>
              <p className="text-[0.68rem] text-stone-600 mt-1">
                {area.forageRecords.length > 0 ? `Recorded forage: ${area.forageRecords.join(', ')}` : 'No forage names recorded by beekeepers for this area yet'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
