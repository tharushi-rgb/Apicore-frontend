import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { hivesService, type Hive } from '../services/hives';
import { harvestsService, type Harvest } from '../services/harvests';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

export function HarvestScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<Harvest | true | false>(false);
  const [search, setSearch] = useState('');
  const user = authService.getLocalUser();

  const fetchData = async () => { try { const [h, hv] = await Promise.all([harvestsService.getAll(), hivesService.getAll()]); setHarvests(h); setHives(hv); } catch {} setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = harvests.filter(h => !search || h.hive_name?.toLowerCase().includes(search.toLowerCase()) || h.harvest_type?.toLowerCase().includes(search.toLowerCase()));
  const totalQuantity = harvests.reduce((s, h) => s + (h.quantity || 0), 0);
  const honeyCount = harvests.filter(h => h.harvest_type === 'honey').length;

  const handleDelete = async (id: number) => { if (!confirm('Delete this harvest?')) return; await harvestsService.delete(id); fetchData(); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="harvest" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">Harvest Records</h1>
          <p className="text-stone-500 text-sm mt-1">Track and manage harvests</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold text-amber-600">{harvests.length}</p><p className="text-xs text-stone-500">Records</p></div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold text-amber-600">{totalQuantity.toFixed(1)}</p><p className="text-xs text-stone-500">Total (kg)</p></div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-xl font-bold text-amber-600">{honeyCount}</p><p className="text-xs text-stone-500">Honey</p></div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none" placeholder="Search harvests..." />
        </div>

        <button onClick={() => setShowForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Record Harvest
        </button>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          filtered.length === 0 ? <p className="text-center text-stone-500 py-8">No harvests recorded</p> :
          <div className="space-y-3">
            {filtered.map(h => (
              <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div><h3 className="font-bold text-stone-800">{h.hive_name || `Hive #${h.hive_id}`}</h3><p className="text-xs text-stone-500">{new Date(h.harvest_date).toLocaleDateString()}</p></div>
                  <div className="flex gap-1">
                    <button onClick={() => setShowForm(h)} className="p-1.5 hover:bg-stone-100 rounded"><Edit2 className="w-4 h-4 text-stone-500" /></button>
                    <button onClick={() => handleDelete(h.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-stone-600">
                  <span>{h.harvest_type}</span>
                  <span>{h.quantity} {h.unit}</span>
                  {h.quality && <span> {h.quality}</span>}
                </div>
                {h.apiary_name && <p className="text-xs text-stone-400 mt-1"> {h.apiary_name}</p>}
                {h.notes && <p className="text-xs text-stone-500 mt-1">{h.notes}</p>}
              </div>
            ))}
          </div>
        }
      </div>

      {showForm && <HarvestForm initial={showForm === true ? undefined : showForm} hives={hives} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />}
    </div>
  );
}

function HarvestForm({ initial, hives, onClose, onSaved }: { initial?: Harvest; hives: Hive[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    hive_id: initial?.hive_id?.toString() || '',
    harvest_date: initial?.harvest_date || new Date().toISOString().split('T')[0],
    harvest_type: initial?.harvest_type || 'honey',
    quantity: initial?.quantity?.toString() || '',
    unit: initial?.unit || 'kg',
    quality: initial?.quality || '',
    notes: initial?.notes || '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!f.hive_id || !f.quantity) return; setSaving(true);
    try {
      const d: any = { hive_id: parseInt(f.hive_id), harvest_date: f.harvest_date, harvest_type: f.harvest_type, quantity: parseFloat(f.quantity), unit: f.unit, quality: f.quality || null, notes: f.notes || null };
      if (initial) await harvestsService.update(initial.id, d); else await harvestsService.create(d); onSaved();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'Record'} Harvest</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.hive_id} onChange={e => setF(p => ({ ...p, hive_id: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Select Hive *</option>{hives.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <input type="date" value={f.harvest_date} onChange={e => setF(p => ({ ...p, harvest_date: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.harvest_type} onChange={e => setF(p => ({ ...p, harvest_type: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="honey">Honey</option><option value="beeswax">Beeswax</option><option value="propolis">Propolis</option>
          <option value="royal_jelly">Royal Jelly</option><option value="pollen">Pollen</option><option value="other">Other</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input value={f.quantity} onChange={e => setF(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity *" type="number" step="0.1" className="border rounded-xl px-3 py-2 text-sm" />
          <select value={f.unit} onChange={e => setF(p => ({ ...p, unit: e.target.value }))} className="border rounded-xl px-3 py-2 text-sm">
            <option value="kg">kg</option><option value="g">g</option><option value="l">Liters</option><option value="ml">ml</option>
          </select>
        </div>
        <select value={f.quality} onChange={e => setF(p => ({ ...p, quality: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Quality (optional)</option><option value="premium">Premium</option><option value="standard">Standard</option><option value="organic">Organic</option>
        </select>
        <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}
