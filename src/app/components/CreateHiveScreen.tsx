import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { hivesService, type Hive } from '../services/hives';
import { apiariesService, type Apiary } from '../services/apiaries';
import { api } from '../services/api';

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
  const [saturation, setSaturation] = useState<{ hives_within_15km: number; saturation_risk: string } | null>(null);
  const [checkingSaturation, setCheckingSaturation] = useState(false);

  const [form, setForm] = useState({
    name: initialHive?.name || '',
    hive_type: (initialHive?.hive_type || 'box') as string,
    apiary_id: initialHive?.apiary_id?.toString() || contextApiary?.id?.toString() || '',
    status: (initialHive?.status || 'active') as string,
    queen_present: initialHive?.queen_present ?? 1,
    colony_strength: initialHive?.colony_strength || '',
    gps_latitude: initialHive?.gps_latitude?.toString() || '',
    gps_longitude: initialHive?.gps_longitude?.toString() || '',
    notes: initialHive?.notes || '',
    num_frames: (initialHive as any)?.num_frames?.toString() || '',
    num_supers: (initialHive as any)?.num_supers?.toString() || '',
    brood_box_type: (initialHive as any)?.brood_box_type || '',
    material: (initialHive as any)?.material || '',
    bottom_type: (initialHive as any)?.bottom_type || '',
    entrance_position: (initialHive as any)?.entrance_position || '',
    num_entrances: (initialHive as any)?.num_entrances?.toString() || '',
    queen_excluder: (initialHive as any)?.queen_excluder || 0,
    pot_volume_liters: (initialHive as any)?.pot_volume_liters?.toString() || '',
    pot_material: (initialHive as any)?.pot_material || '',
    entrance_size: (initialHive as any)?.entrance_size || '',
    log_length_cm: (initialHive as any)?.log_length_cm?.toString() || '',
    log_diameter_cm: (initialHive as any)?.log_diameter_cm?.toString() || '',
    wood_type: (initialHive as any)?.wood_type || '',
    stingless_species: (initialHive as any)?.stingless_species || '',
    colony_size: (initialHive as any)?.colony_size || '',
    bee_source: (initialHive as any)?.bee_source || '',
    origin: (initialHive as any)?.origin || '',
    established_date: (initialHive as any)?.established_date || '',
    ownership_type: (initialHive as any)?.ownership_type || 'internal',
    owner_name: (initialHive as any)?.owner_name || '',
    owner_contact: (initialHive as any)?.owner_contact || '',
    contract_terms: (initialHive as any)?.contract_terms || '',
  });

  useEffect(() => { apiariesService.getAll().then(setApiaries).catch(()=>{}); }, []);

  useEffect(() => {
    if (!form.apiary_id && form.gps_latitude && form.gps_longitude) {
      setCheckingSaturation(true);
      api.get<{ success: boolean; data: { hives_within_15km: number; saturation_risk: string } }>(
        `/hives/saturation-check?lat=${form.gps_latitude}&lng=${form.gps_longitude}`
      ).then(res => setSaturation(res.data)).catch(() => {}).finally(() => setCheckingSaturation(false));
    } else {
      setSaturation(null);
    }
  }, [form.apiary_id, form.gps_latitude, form.gps_longitude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.hive_type) { setError('Name and type are required'); return; }
    setSaving(true); setError('');
    try {
      const data: any = {
        ...form,
        apiary_id: form.apiary_id ? parseInt(form.apiary_id) : null,
        location_type: form.apiary_id ? 'apiary-linked' : 'standalone',
        queen_present: form.queen_present ? 1 : 0,
        gps_latitude: form.gps_latitude ? parseFloat(form.gps_latitude) : null,
        gps_longitude: form.gps_longitude ? parseFloat(form.gps_longitude) : null,
        num_frames: form.num_frames ? parseInt(form.num_frames) : null,
        num_supers: form.num_supers ? parseInt(form.num_supers) : null,
        num_entrances: form.num_entrances ? parseInt(form.num_entrances) : null,
        pot_volume_liters: form.pot_volume_liters ? parseFloat(form.pot_volume_liters) : null,
        log_length_cm: form.log_length_cm ? parseFloat(form.log_length_cm) : null,
        log_diameter_cm: form.log_diameter_cm ? parseFloat(form.log_diameter_cm) : null,
        queen_excluder: form.queen_excluder ? 1 : 0,
      };
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

  const inputCls = 'w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none';
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1';
  const sLabelCls = 'block text-xs font-medium text-stone-600 mb-1';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-stone-700" /></button>
        <h1 className="text-lg font-bold text-stone-800">{isEdit ? 'Edit Hive' : 'Create Hive'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4 pb-24">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

        <div><label className={labelCls}>Hive Name *</label>
          <input value={form.name} onChange={e => setForm(p=>({...p, name: e.target.value}))} className={inputCls} /></div>

        <div><label className={labelCls}>Hive Type *</label>
          <select value={form.hive_type} onChange={e => setForm(p=>({...p, hive_type: e.target.value}))} className={inputCls}>
            <option value="box">Box (Langstroth / Top-bar)</option>
            <option value="pot">Pot Hive</option>
            <option value="log">Log Hive</option>
            <option value="stingless">Stingless Bee Hive</option>
          </select></div>

        <div><label className={labelCls}>Apiary</label>
          <select value={form.apiary_id} onChange={e => setForm(p=>({...p, apiary_id: e.target.value}))} className={inputCls}>
            <option value="">Standalone (no apiary)</option>
            {apiaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select></div>

        {form.hive_type === 'box' && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">Box Hive Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Frames</label>
                <input type="number" value={form.num_frames} onChange={e => setForm(p=>({...p, num_frames: e.target.value}))} placeholder="10" className={inputCls} /></div>
              <div><label className={sLabelCls}>Supers</label>
                <input type="number" value={form.num_supers} onChange={e => setForm(p=>({...p, num_supers: e.target.value}))} placeholder="0" className={inputCls} /></div>
            </div>
            <div><label className={sLabelCls}>Brood Chamber</label>
              <select value={form.brood_box_type} onChange={e => setForm(p=>({...p, brood_box_type: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="single">Single</option><option value="double">Double</option>
              </select></div>
            <div><label className={sLabelCls}>Material</label>
              <select value={form.material} onChange={e => setForm(p=>({...p, material: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="wood">Wood</option><option value="polystyrene">Polystyrene</option><option value="plastic">Plastic</option><option value="composite">Composite</option><option value="mixed">Mixed</option>
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Bottom</label>
                <select value={form.bottom_type} onChange={e => setForm(p=>({...p, bottom_type: e.target.value}))} className={inputCls}>
                  <option value="">Select</option><option value="antivarroa">Anti-varroa</option><option value="solid">Solid</option>
                </select></div>
              <div><label className={sLabelCls}>Entrance</label>
                <select value={form.entrance_position} onChange={e => setForm(p=>({...p, entrance_position: e.target.value}))} className={inputCls}>
                  <option value="">Select</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="side">Side</option>
                </select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.queen_excluder} onChange={e => setForm(p=>({...p, queen_excluder: e.target.checked ? 1 : 0}))} className="accent-amber-500" /> Queen Excluder</label>
          </div>
        )}

        {form.hive_type === 'pot' && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">Pot Hive Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Volume (L)</label>
                <input type="number" value={form.pot_volume_liters} onChange={e => setForm(p=>({...p, pot_volume_liters: e.target.value}))} className={inputCls} /></div>
              <div><label className={sLabelCls}>Material</label>
                <select value={form.pot_material} onChange={e => setForm(p=>({...p, pot_material: e.target.value}))} className={inputCls}>
                  <option value="">Select</option><option value="clay">Clay</option><option value="ceramic">Ceramic</option><option value="gourd">Gourd</option>
                </select></div>
            </div>
            <div><label className={sLabelCls}>Entrance Size</label>
              <select value={form.entrance_size} onChange={e => setForm(p=>({...p, entrance_size: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
              </select></div>
          </div>
        )}

        {form.hive_type === 'log' && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">Log Hive Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Length (cm)</label>
                <input type="number" value={form.log_length_cm} onChange={e => setForm(p=>({...p, log_length_cm: e.target.value}))} className={inputCls} /></div>
              <div><label className={sLabelCls}>Diameter (cm)</label>
                <input type="number" value={form.log_diameter_cm} onChange={e => setForm(p=>({...p, log_diameter_cm: e.target.value}))} className={inputCls} /></div>
            </div>
            <div><label className={sLabelCls}>Wood Type</label>
              <input value={form.wood_type} onChange={e => setForm(p=>({...p, wood_type: e.target.value}))} placeholder="e.g., Hardwood" className={inputCls} /></div>
          </div>
        )}

        {form.hive_type === 'stingless' && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">Stingless Bee Details</h3>
            <div><label className={sLabelCls}>Species</label>
              <input value={form.stingless_species} onChange={e => setForm(p=>({...p, stingless_species: e.target.value}))} placeholder="e.g., Tetragonula" className={inputCls} /></div>
            <div><label className={sLabelCls}>Colony Size</label>
              <select value={form.colony_size} onChange={e => setForm(p=>({...p, colony_size: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
              </select></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Bee Source</label>
            <select value={form.bee_source} onChange={e => setForm(p=>({...p, bee_source: e.target.value}))} className={inputCls}>
              <option value="">Select</option><option value="swarm">Swarm</option><option value="nuc">Nucleus</option><option value="package">Package</option>
              <option value="split">Split</option><option value="acquired">Acquired</option><option value="purchase">Purchase</option>
              <option value="capture">Capture</option><option value="other">Other</option>
            </select></div>
          <div><label className={labelCls}>Origin</label>
            <select value={form.origin} onChange={e => setForm(p=>({...p, origin: e.target.value}))} className={inputCls}>
              <option value="">Select</option><option value="purchased">Purchased</option><option value="own_prod">Own Production</option><option value="other">Other</option>
            </select></div>
        </div>

        <div><label className={labelCls}>Colony Strength</label>
          <select value={form.colony_strength} onChange={e => setForm(p=>({...p, colony_strength: e.target.value}))} className={inputCls}>
            <option value="">Select strength</option><option value="weak">Weak (0-50)</option><option value="normal">Normal (51-75)</option><option value="strong">Strong (76-100)</option>
          </select></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => setForm(p=>({...p, status: e.target.value}))} className={inputCls}>
              <option value="active">Active</option><option value="queenless">Queenless</option><option value="inactive">Inactive</option>
              <option value="absconded">Absconded</option><option value="dead">Dead</option><option value="sold">Sold</option>
            </select></div>
          <div><label className={labelCls}>Established</label>
            <input type="date" value={form.established_date} onChange={e => setForm(p=>({...p, established_date: e.target.value}))} className={inputCls} /></div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <label className="text-sm font-medium text-stone-700">Queen Status</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.queen_present} onChange={e => setForm(p=>({...p, queen_present: e.target.checked ? 1 : 0}))} className="accent-amber-500" /> Queen Present</label>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <label className="text-sm font-medium text-stone-700">Ownership Context</label>
          <div className="flex rounded-xl overflow-hidden border border-stone-200">
            <button type="button" onClick={() => setForm(p=>({...p, ownership_type: 'internal'}))} className={`flex-1 py-2.5 text-sm font-medium ${form.ownership_type === 'internal' ? 'bg-amber-500 text-white' : 'bg-stone-50 text-stone-600'}`}>Internal</button>
            <button type="button" onClick={() => setForm(p=>({...p, ownership_type: 'client'}))} className={`flex-1 py-2.5 text-sm font-medium ${form.ownership_type === 'client' ? 'bg-blue-500 text-white' : 'bg-stone-50 text-stone-600'}`}>Client</button>
          </div>
        </div>

        {form.ownership_type === 'internal' && (
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 space-y-3">
            <h3 className="text-sm font-semibold text-amber-700">Landowner Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Name</label>
                <input value={form.owner_name} onChange={e => setForm(p=>({...p, owner_name: e.target.value}))} className={inputCls} /></div>
              <div><label className={sLabelCls}>Phone</label>
                <input value={form.owner_contact} onChange={e => setForm(p=>({...p, owner_contact: e.target.value}))} className={inputCls} /></div>
            </div>
            <div><label className={sLabelCls}>Terms</label>
              <select value={form.contract_terms} onChange={e => setForm(p=>({...p, contract_terms: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="rent_paid">Rent Paid</option><option value="yield_share">Yield Share</option>
              </select></div>
          </div>
        )}

        {form.ownership_type === 'client' && (
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
            <h3 className="text-sm font-semibold text-blue-700">Client Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={sLabelCls}>Client Name</label>
                <input value={form.owner_name} onChange={e => setForm(p=>({...p, owner_name: e.target.value}))} className={inputCls} /></div>
              <div><label className={sLabelCls}>Contact</label>
                <input value={form.owner_contact} onChange={e => setForm(p=>({...p, owner_contact: e.target.value}))} className={inputCls} /></div>
            </div>
            <div><label className={sLabelCls}>Terms</label>
              <select value={form.contract_terms} onChange={e => setForm(p=>({...p, contract_terms: e.target.value}))} className={inputCls}>
                <option value="">Select</option><option value="yield_share">Yield Share</option><option value="pollination_fee">Pollination / Service Fee</option>
              </select></div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">GPS Coordinates</label>
            <button type="button" onClick={handleGPS} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
              <MapPin className="w-4 h-4" /> Capture GPS
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.gps_latitude} onChange={e => setForm(p=>({...p, gps_latitude: e.target.value}))} placeholder="Latitude" className={inputCls} />
            <input value={form.gps_longitude} onChange={e => setForm(p=>({...p, gps_longitude: e.target.value}))} placeholder="Longitude" className={inputCls} />
          </div>
        </div>

        {!form.apiary_id && saturation && (
          <div className={`rounded-xl p-4 border space-y-1 ${
            saturation.saturation_risk === 'high' ? 'bg-red-50 border-red-200' :
            saturation.saturation_risk === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${saturation.saturation_risk === 'high' ? 'text-red-500' : saturation.saturation_risk === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
              <span className="text-sm font-medium text-stone-700">Zone Saturation: {saturation.saturation_risk.toUpperCase()}</span>
            </div>
            <p className="text-xs text-stone-600">{saturation.hives_within_15km} registered hives within 15km of this location</p>
          </div>
        )}
        {!form.apiary_id && checkingSaturation && (
          <div className="bg-stone-50 rounded-xl p-3 text-center text-xs text-stone-500">Checking zone saturation...</div>
        )}

        <div><label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p=>({...p, notes: e.target.value}))} rows={3} className={inputCls} /></div>

        <button type="submit" disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {isEdit ? 'Update Hive' : 'Create Hive'}</>}
        </button>
      </form>
    </div>
  );
}
