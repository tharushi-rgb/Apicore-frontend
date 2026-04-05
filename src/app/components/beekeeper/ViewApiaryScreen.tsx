import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Hexagon as HiveIcon, MapPin, Clock, Trash2, Eye, Pencil, Leaf, Sprout, AlertTriangle } from 'lucide-react';
import { apiariesService, type Apiary } from '../../services/apiaries';
import { hivesService, type Hive } from '../../services/hives';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onBack: () => void; onAddHive: (apiaryId: number) => void; onEditApiary: (apiary: Apiary) => void;
  onViewHive: (id: number) => void; onEditHive?: (hive: Hive) => void; apiaryId: number; onLogout: () => void;
}

function riskBg(color: 'red' | 'amber' | 'green' | 'blue' | 'stone') {
  if (color === 'red') return 'bg-red-100 text-red-700 border-red-200';
  if (color === 'amber') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (color === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (color === 'blue') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

export function ViewApiaryScreen({ onBack, onAddHive, onEditApiary, onViewHive, onEditHive, apiaryId, selectedLanguage }: Props) {
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [hives, setHives] = useState<Hive[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hives' | 'history'>('hives');
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const hist = await apiariesService.getHistory(apiaryId);
      setHistory(hist);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    }
  };

  const handleDelete = async () => {
    if (!apiary) return;
    if (hives.length > 0) { alert('Cannot delete apiary with hives. Remove or move all hives first.'); return; }
    if (!confirm(`Delete apiary "${apiary.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { 
      await apiariesService.delete(apiary.id); 
      onBack(); 
    } catch (error) {
      console.error('Failed to delete apiary:', error);
      alert(`Failed to delete apiary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [a, h] = await Promise.all([
          apiariesService.getById(apiaryId), hivesService.getAll()
        ]);
        setApiary(a);
        // Only show hives if apiary is active
        const filteredHives = a.status === 'active' 
          ? h.filter((hv: Hive) => hv.apiary_id === apiaryId)
          : [];
        setHives(filteredHives);
        await loadHistory();
      } catch (error) {
        console.error('Failed to load apiary:', error);
      }
      setLoading(false);
    };
    fetch();
  }, [apiaryId]);

  useEffect(() => {
    if (activeTab !== 'history') return;
    loadHistory();
    const interval = window.setInterval(() => {
      loadHistory();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [activeTab, apiaryId]);

  // Weather tab removed per UI request.

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };
  const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', queenless: 'bg-red-100 text-red-700', inactive: 'bg-stone-100 text-stone-600', absconded: 'bg-purple-100 text-purple-700' };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!apiary) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><p>Apiary not found</p></div>;

  const totalHives = apiary.status === 'active' ? hives.length : 0;
  const activeHives = apiary.status === 'active' ? hives.filter((h) => h.status === 'active').length : 0;
  const maxCapacity = apiary.status === 'active' ? (apiary.max_hive_capacity ?? null) : 0;
  const hivesAvailable = apiary.status === 'active' && maxCapacity != null ? Math.max(maxCapacity - totalHives, 0) : 0;
  const availability = maxCapacity == null
    ? 'Not specified'
    : (hivesAvailable ?? 0) > 0
      ? 'Available'
      : 'Full';
  const forageDisplay = apiary.forage_entries && apiary.forage_entries.length > 0
    ? apiary.forage_entries
      .filter((entry) => entry.forageType || entry.bloomingPeriod)
      .map((entry) => `${entry.forageType || 'Unknown forage'}${entry.bloomingPeriod ? ` (${entry.bloomingPeriod})` : ''}`)
    : apiary.forage_primary
      ? [`${apiary.forage_primary}${apiary.blooming_window ? ` (${apiary.blooming_window})` : ''}`]
      : [];

  const paymentTermsLabel = apiary.payment_terms === 'cash'
    ? 'Cash'
    : apiary.payment_terms === 'honey_share'
      ? 'Honey share'
      : apiary.payment_terms === 'pollination_service'
        ? 'Pollination service'
        : '-';

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm px-3 py-2 flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-4 h-4 text-stone-700" /></button>
        <div className="flex-1"><h1 className="text-base font-bold text-stone-800">{apiary.name}</h1><p className="text-xs text-stone-500">{apiary.district} {apiary.area ? `• ${apiary.area}` : ''}</p></div>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
        <button onClick={() => onEditApiary(apiary)} className="text-xs text-amber-600 font-medium hover:text-amber-700">Edit</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2 pb-24">
        {/* Status Warning */}
        {apiary.status === 'inactive' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Apiary Inactive</p>
                <p className="text-xs text-red-700 mt-0.5">This apiary is marked as inactive. No hives can be managed until it is reactivated.</p>
              </div>
            </div>
          </div>
        )}

        {/* Overview */}
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-stone-800">Apiary Overview</h2>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-stone-500"><HiveIcon className="w-3 h-3" /> Total hives</div>
              <p className="text-lg font-bold text-amber-600">{totalHives}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-stone-500"><Sprout className="w-3 h-3" /> Active hives</div>
              <p className="text-lg font-bold text-emerald-600">{activeHives}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-stone-500"><Leaf className="w-3 h-3" /> Hives available</div>
              <p className="text-lg font-bold text-blue-600">{apiary.status === 'active' ? (hivesAvailable ?? '-') : '0'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Name:</span> <span className="text-stone-800 font-medium">{apiary.name}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Status:</span> <span className="text-stone-800 font-medium capitalize">{apiary.status || '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Location:</span> <span className="text-stone-800 font-medium">{[apiary.province, apiary.district, apiary.ds_division || apiary.area].filter(Boolean).join(' • ') || '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Est. date:</span> <span className="text-stone-800 font-medium">{apiary.established_date || '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5 sm:col-span-2"><span className="text-stone-500">GPS:</span> <span className="text-stone-800 font-medium">{apiary.gps_latitude != null && apiary.gps_longitude != null ? `${apiary.gps_latitude}, ${apiary.gps_longitude}` : '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5 sm:col-span-2">
              <span className="text-stone-500">Forage:</span>{' '}
              <span className="text-stone-800 font-medium">{forageDisplay.length > 0 ? forageDisplay.join(', ') : '-'}</span>
            </div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Capacity:</span> <span className="text-stone-800 font-medium">{maxCapacity ?? '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Availability:</span> <span className="text-stone-800 font-medium">{availability}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Vehicle:</span> <span className="text-stone-800 font-medium">{apiary.vehicle_accessibility || '-'}</span></div>
            <div className="rounded-lg bg-stone-50 px-2 py-1.5"><span className="text-stone-500">Water:</span> <span className="text-stone-800 font-medium">{apiary.water_availability || '-'}</span></div>
          </div>

          <div className="rounded-lg border border-stone-200 p-2 space-y-1">
            <p className="text-xs uppercase tracking-[0.08em] text-stone-500 font-semibold">Ownership & Payment</p>
            <p className="text-xs text-stone-700"><span className="text-stone-500">Ownership:</span> {apiary.land_ownership === 'not_owned' ? 'Not owned' : 'Owned'}</p>
            {apiary.land_ownership === 'not_owned' && (
              <>
                <p className="text-xs text-stone-700"><span className="text-stone-500">Landowner:</span> {apiary.landlord_name || '-'}</p>
                <p className="text-xs text-stone-700"><span className="text-stone-500">Contact:</span> {apiary.landlord_contact || '-'}</p>
                <p className="text-xs text-stone-700"><span className="text-stone-500">Contract:</span> {apiary.contract_start || '-'} to {apiary.contract_end || '-'}</p>
                <p className="text-xs text-stone-700"><span className="text-stone-500">Payment terms:</span> {paymentTermsLabel}</p>
                {apiary.payment_terms === 'cash' && <p className="text-xs text-stone-700"><span className="text-stone-500">Amount:</span> LKR {apiary.payment_amount_lkr ?? apiary.rental_fee ?? 0}</p>}
                {apiary.payment_terms === 'honey_share' && <p className="text-xs text-stone-700"><span className="text-stone-500">Honey share:</span> {apiary.honey_share_kgs ?? 0} kg</p>}
              </>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 p-2">
            <p className="text-xs uppercase tracking-[0.08em] text-stone-500 font-semibold mb-0.5">Notes</p>
            <p className="text-xs text-stone-700">{apiary.notes || '-'}</p>
          </div>

          <div className="rounded-lg border border-stone-200 p-2">
            <p className="text-xs uppercase tracking-[0.08em] text-stone-500 font-semibold mb-1">Images</p>
            {apiary.images && apiary.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {apiary.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    className="aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                  >
                    <img src={image} alt={`Apiary ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-700">No images added</p>
            )}
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
              <div className="max-w-4xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold text-2xl"
                >
                  ✕
                </button>
                <img src={selectedImage} alt="Full view" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              </div>
            </div>
          )}

          {apiary.gps_latitude != null && apiary.gps_longitude != null && (
            <div className="flex items-center gap-1 text-sm text-emerald-600"><MapPin className="w-3.5 h-3.5" /> {apiary.gps_latitude}, {apiary.gps_longitude}</div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button onClick={() => setActiveTab('hives')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='hives' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Hives ({hives.length})</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='history' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>History</button>
        </div>

        {activeTab === 'hives' && (
          <>
            <button onClick={() => onAddHive(apiaryId)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add Hive
            </button>
            {hives.length === 0 ? (
              <div className="text-center py-8"><HiveIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No hives in this apiary</p></div>
            ) : (
              <div className="space-y-3">
                {hives.map(h => (
                  <div key={h.id} className="w-full text-left bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-stone-800">{h.name}</h3>
                      <div className="flex gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[h.hive_type] || ''}`}>{h.hive_type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[h.status] || ''}`}>{h.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-stone-500">{h.queen_present ? 'Queen present' : 'Queenless'}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => onViewHive(h.id)} className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 min-h-9">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => onEditHive?.(h)}
                        disabled={!onEditHive}
                        className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-9"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          history.length === 0 ? (
            <div className="text-center py-8"><Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No history records</p></div>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-800">{h.action}</span>
                    <span className="text-xs text-stone-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  {h.details && <p className="text-sm text-stone-600">{h.details}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
