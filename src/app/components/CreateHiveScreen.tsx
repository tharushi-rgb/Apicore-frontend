import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';
import { hivesService, type Hive } from '../services/hives';
import { apiariesService, type Apiary } from '../services/apiaries';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onClose: () => void; contextApiary?: Apiary; initialHive?: Hive; onLogout: () => void;
}

export function CreateHiveScreen({ onClose, contextApiary, initialHive }: Props) {
  const isEdit = !!initialHive;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [form, setForm] = useState({
    name: initialHive?.name || '', hive_type: (initialHive?.hive_type || 'box') as string,
    apiary_id: initialHive?.apiary_id?.toString() || contextApiary?.id?.toString() || '',
    status: (initialHive?.status || 'active') as string,
    queen_present: initialHive?.queen_present ?? 1, colony_strength: initialHive?.colony_strength || '',
    gps_latitude: initialHive?.gps_latitude?.toString() || '', gps_longitude: initialHive?.gps_longitude?.toString() || '',
    notes: initialHive?.notes || '',
    // Dynamic fields per hive type (R5.2)
    num_frames: initialHive?.num_frames?.toString() || '',
    num_supers: initialHive?.num_supers?.toString() || '',
    brood_box_type: initialHive?.brood_box_type || '',
    pot_material: initialHive?.pot_material || '',
    pot_volume_liters: initialHive?.pot_volume_liters?.toString() || '',
    entrance_size: initialHive?.entrance_size || '',
    log_length_cm: initialHive?.log_length_cm?.toString() || '',
    log_diameter_cm: initialHive?.log_diameter_cm?.toString() || '',
    wood_type: initialHive?.wood_type || '',
    stingless_species: initialHive?.stingless_species || '',
    colony_size: initialHive?.colony_size || '',
    propolis_type: initialHive?.propolis_type || '',
  });

  useEffect(() => { apiariesService.getAll().then(setApiaries).catch(()=>{}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.hive_type) { setError('Name and type are required'); return; }
    setSaving(true); setError('');
    try {
      const data: any = { ...form, apiary_id: form.apiary_id ? parseInt(form.apiary_id) : null,
        location_type: form.apiary_id ? 'apiary-linked' : 'standalone',
        queen_present: form.queen_present ? 1 : 0,
        gps_latitude: form.gps_latitude ? parseFloat(form.gps_latitude) : null, gps_longitude: form.gps_longitude ? parseFloat(form.gps_longitude) : null };
      if (isEdit && initialHive) { await hivesService.update(initialHive.id, data); }
      else { await hivesService.create(data); }
      onClose();
    } catch (e: any) { setError(e.message || 'Failed to save'); setSaving(false); }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { setError('GPS not supported'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      setForm(prev => ({ ...prev, gps_latitude: p.coords.latitude.toString(), gps_longitude: p.coords.longitude.toString() }));
    }, () => setError('Location access denied'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-stone-700" /></button>
        <h1 className="text-lg font-bold text-stone-800">{isEdit ? 'Edit Hive' : 'Create Hive'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Hive Name *</label>
          <input value={form.name} onChange={e => setForm(p=>({...p, name: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Hive Type *</label>
          <select value={form.hive_type} onChange={e => setForm(p=>({...p, hive_type: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="box">Box</option><option value="pot">Pot</option><option value="log">Log</option><option value="stingless">Stingless</option>
          </select></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Apiary</label>
          <select value={form.apiary_id} onChange={e => setForm(p=>({...p, apiary_id: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Standalone (no apiary)</option>
            {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Colony Strength</label>
          <select value={form.colony_strength} onChange={e => setForm(p=>({...p, colony_strength: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Select strength</option><option value="weak">Weak</option><option value="normal">Normal</option><option value="strong">Strong</option>
          </select></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(p=>({...p, status: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="active">Active</option><option value="queenless">Queenless</option><option value="inactive">Inactive</option><option value="absconded">Absconded</option>
          </select></div>

        {/* Dynamic fields per hive type (R5.2) */}
        {form.hive_type === 'box' && (
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 space-y-3">
            <h3 className="text-sm font-semibold text-amber-700">📦 Box Hive Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Number of Frames</label>
                <input type="number" value={form.num_frames} onChange={e => setForm(p=>({...p, num_frames: e.target.value}))} placeholder="e.g. 10" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Number of Supers</label>
                <input type="number" value={form.num_supers} onChange={e => setForm(p=>({...p, num_supers: e.target.value}))} placeholder="e.g. 2" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Brood Box Type</label>
              <select value={form.brood_box_type} onChange={e => setForm(p=>({...p, brood_box_type: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                <option value="">Select type</option><option value="langstroth">Langstroth</option><option value="top-bar">Top Bar</option><option value="warre">Warré</option><option value="national">National</option><option value="commercial">Commercial</option>
              </select></div>
          </div>
        )}

        {form.hive_type === 'pot' && (
          <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 space-y-3">
            <h3 className="text-sm font-semibold text-orange-700">🏺 Pot Hive Details</h3>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Pot Material</label>
              <select value={form.pot_material} onChange={e => setForm(p=>({...p, pot_material: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                <option value="">Select material</option><option value="clay">Clay</option><option value="terracotta">Terracotta</option><option value="ceramic">Ceramic</option><option value="coconut_shell">Coconut Shell</option>
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Volume (liters)</label>
                <input type="number" value={form.pot_volume_liters} onChange={e => setForm(p=>({...p, pot_volume_liters: e.target.value}))} placeholder="e.g. 5" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Entrance Size</label>
                <select value={form.entrance_size} onChange={e => setForm(p=>({...p, entrance_size: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                  <option value="">Select</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
                </select></div>
            </div>
          </div>
        )}

        {form.hive_type === 'log' && (
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">🪵 Log Hive Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Length (cm)</label>
                <input type="number" value={form.log_length_cm} onChange={e => setForm(p=>({...p, log_length_cm: e.target.value}))} placeholder="e.g. 60" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Diameter (cm)</label>
                <input type="number" value={form.log_diameter_cm} onChange={e => setForm(p=>({...p, log_diameter_cm: e.target.value}))} placeholder="e.g. 25" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Wood Type</label>
              <select value={form.wood_type} onChange={e => setForm(p=>({...p, wood_type: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                <option value="">Select wood</option><option value="kithul">Kithul</option><option value="coconut">Coconut</option><option value="jak">Jak</option><option value="mango">Mango</option><option value="other">Other</option>
              </select></div>
          </div>
        )}

        {form.hive_type === 'stingless' && (
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-700">🐝 Stingless Bee Details</h3>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Stingless Bee Species</label>
              <select value={form.stingless_species} onChange={e => setForm(p=>({...p, stingless_species: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                <option value="">Select species</option><option value="tetragonula_iridipennis">Tetragonula iridipennis</option><option value="lisotrigona_cacciae">Lisotrigona cacciae</option><option value="other">Other</option>
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Colony Size</label>
                <select value={form.colony_size} onChange={e => setForm(p=>({...p, colony_size: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                  <option value="">Select</option><option value="small">Small (&lt;500)</option><option value="medium">Medium (500-2000)</option><option value="large">Large (2000+)</option>
                </select></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Propolis Type</label>
                <select value={form.propolis_type} onChange={e => setForm(p=>({...p, propolis_type: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                  <option value="">Select</option><option value="cerumen">Cerumen</option><option value="batumen">Batumen</option><option value="mixed">Mixed</option>
                </select></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <label className="text-sm font-medium text-stone-700">Queen Status</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.queen_present} onChange={e => setForm(p=>({...p, queen_present: e.target.checked ? 1 : 0}))} className="accent-amber-500" /> Queen Present</label>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">GPS Coordinates</label>
            <button type="button" onClick={handleGPS} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
              <MapPin className="w-4 h-4" /> Capture GPS
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.gps_latitude} onChange={e => setForm(p=>({...p, gps_latitude: e.target.value}))} placeholder="Latitude" className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
            <input value={form.gps_longitude} onChange={e => setForm(p=>({...p, gps_longitude: e.target.value}))} placeholder="Longitude" className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" />
          </div>
        </div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p=>({...p, notes: e.target.value}))} rows={3} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>

        <button type="submit" disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {isEdit ? 'Update Hive' : 'Create Hive'}</>}
        </button>
      </form>
    </div>
  );
}
