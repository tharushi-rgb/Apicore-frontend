import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Flag, Plus, Edit2, Trash2, ArrowRightLeft, ClipboardList, Droplets, Wrench, Crown, Pill, X } from 'lucide-react';
import { hivesService, type Hive } from '../services/hives';
import { inspectionsService, type Inspection } from '../services/inspections';
import { feedingsService, type Feeding, componentsService, type HiveComponent, queensService, type Queen, treatmentsService, type Treatment } from '../services/hiveDetails';
import { transfersService, type ColonyTransfer } from '../services/transfers';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';
type HiveTab = 'overview' | 'inspections' | 'feedings' | 'components' | 'queens' | 'treatments' | 'transfers';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onBack: () => void; onEditHive?: (hive: Hive) => void; hiveId: number; onLogout: () => void;
}

// ---- Small form modals ----
function InspectionForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: Inspection; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    inspection_date: initial?.inspection_date || new Date().toISOString().split('T')[0],
    colony_strength: initial?.colony_strength || '',
    queen_present: initial?.queen_present ?? 1,
    pest_detected: initial?.pest_detected ?? 0,
    notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const d: any = { hive_id: hiveId, inspection_date: f.inspection_date, colony_strength: f.colony_strength || null, queen_present: f.queen_present ? 1 : 0, pest_detected: f.pest_detected ? 1 : 0, notes: f.notes || null };
      if (initial) await inspectionsService.update(initial.id, d); else await inspectionsService.create(d);
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'New'} Inspection</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <input type="date" value={f.inspection_date} onChange={e=>setF(p=>({...p,inspection_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.colony_strength} onChange={e=>setF(p=>({...p,colony_strength:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Colony Strength</option><option value="weak">Weak</option><option value="normal">Normal</option><option value="strong">Strong</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.queen_present} onChange={e=>setF(p=>({...p,queen_present:e.target.checked?1:0}))} className="accent-amber-500" /> Queen Present</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.pest_detected} onChange={e=>setF(p=>({...p,pest_detected:e.target.checked?1:0}))} className="accent-red-500" /> Pest Detected</label>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function FeedingForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: Feeding; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    feeding_date: initial?.feeding_date || new Date().toISOString().split('T')[0],
    feed_type: initial?.feed_type || 'sugar_syrup',
    quantity: initial?.quantity?.toString() || '',
    unit: initial?.unit || 'ml',
    concentration: initial?.concentration || '',
    notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const d: any = { hive_id: hiveId, feeding_date: f.feeding_date, feed_type: f.feed_type, quantity: f.quantity ? parseFloat(f.quantity) : null, unit: f.unit, concentration: f.concentration || null, notes: f.notes || null };
      if (initial) await feedingsService.update(initial.id, d); else await feedingsService.create(d);
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'New'} Feeding</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <input type="date" value={f.feeding_date} onChange={e=>setF(p=>({...p,feeding_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.feed_type} onChange={e=>setF(p=>({...p,feed_type:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="sugar_syrup">Sugar Syrup</option><option value="pollen_patty">Pollen Patty</option><option value="fondant">Fondant</option><option value="honey">Honey</option><option value="other">Other</option></select>
        <div className="grid grid-cols-2 gap-2">
          <input value={f.quantity} onChange={e=>setF(p=>({...p,quantity:e.target.value}))} placeholder="Quantity" type="number" className="border rounded-xl px-3 py-2 text-sm" />
          <select value={f.unit} onChange={e=>setF(p=>({...p,unit:e.target.value}))} className="border rounded-xl px-3 py-2 text-sm"><option value="ml">ml</option><option value="l">L</option><option value="g">g</option><option value="kg">kg</option></select>
        </div>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function ComponentForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: HiveComponent; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    component_type: initial?.component_type || 'frame',
    quantity: initial?.quantity?.toString() || '1',
    condition: initial?.condition || 'good',
    installed_date: initial?.installed_date || new Date().toISOString().split('T')[0],
    notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const d: any = { hive_id: hiveId, component_type: f.component_type, quantity: parseInt(f.quantity) || 1, condition: f.condition, installed_date: f.installed_date, notes: f.notes || null };
      if (initial) await componentsService.update(initial.id, d); else await componentsService.create(d);
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'New'} Component</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.component_type} onChange={e=>setF(p=>({...p,component_type:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="frame">Frame</option><option value="super">Super</option><option value="feeder">Feeder</option><option value="queen_excluder">Queen Excluder</option><option value="entrance_reducer">Entrance Reducer</option><option value="bottom_board">Bottom Board</option><option value="inner_cover">Inner Cover</option><option value="outer_cover">Outer Cover</option><option value="other">Other</option>
        </select>
        <input value={f.quantity} onChange={e=>setF(p=>({...p,quantity:e.target.value}))} placeholder="Quantity" type="number" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input type="date" value={f.installed_date} onChange={e=>setF(p=>({...p,installed_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.condition} onChange={e=>setF(p=>({...p,condition:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="replaced">Replaced</option></select>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function QueenForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: Queen; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    marking_color: initial?.marking_color || '',
    source: initial?.source || '',
    introduction_date: initial?.introduction_date || new Date().toISOString().split('T')[0],
    status: initial?.status || 'active',
    species: initial?.species || '',
    notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const d: any = { hive_id: hiveId, marking_color: f.marking_color || null, source: f.source || null, introduction_date: f.introduction_date, status: f.status, species: f.species || null, notes: f.notes || null };
      if (initial) await queensService.update(initial.id, d); else await queensService.create(d);
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'New'} Queen</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.species} onChange={e=>setF(p=>({...p,species:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Species</option><option value="apis_cerana">Apis Cerana</option><option value="apis_mellifera">Apis Mellifera</option><option value="apis_dorsata">Apis Dorsata</option><option value="other">Other</option>
        </select>
        <select value={f.marking_color} onChange={e=>setF(p=>({...p,marking_color:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Marking Color</option><option value="white">White</option><option value="yellow">Yellow</option><option value="red">Red</option><option value="green">Green</option><option value="blue">Blue</option><option value="unmarked">Unmarked</option>
        </select>
        <select value={f.source} onChange={e=>setF(p=>({...p,source:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="">Source</option><option value="purchased">Purchased</option><option value="swarm">Swarm</option><option value="reared">Reared</option><option value="split">Split</option><option value="unknown">Unknown</option></select>
        <input type="date" value={f.introduction_date} onChange={e=>setF(p=>({...p,introduction_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="active">Active</option><option value="superseded">Superseded</option><option value="dead">Dead</option><option value="missing">Missing</option><option value="removed">Removed</option></select>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function TreatmentForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: Treatment; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    treatment_type: initial?.treatment_type || '',
    treatment_date: initial?.treatment_date || new Date().toISOString().split('T')[0],
    product_name: initial?.product_name || '',
    dosage: initial?.dosage || '',
    application_method: initial?.application_method || '',
    end_date: initial?.end_date || '',
    outcome: initial?.outcome || '',
    notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const d: any = { hive_id: hiveId, treatment_type: f.treatment_type, treatment_date: f.treatment_date, product_name: f.product_name || null, dosage: f.dosage || null, application_method: f.application_method || null, end_date: f.end_date || null, outcome: f.outcome || null, notes: f.notes || null };
      if (initial) await treatmentsService.update(initial.id, d); else await treatmentsService.create(d);
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{initial ? 'Edit' : 'New'} Treatment</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.treatment_type} onChange={e=>setF(p=>({...p,treatment_type:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="">Treatment Type *</option><option value="varroa">Varroa</option><option value="nosema">Nosema</option><option value="foulbrood">Foulbrood</option><option value="wax_moth">Wax Moth</option><option value="small_hive_beetle">Small Hive Beetle</option><option value="other">Other</option>
        </select>
        <input value={f.product_name} onChange={e=>setF(p=>({...p,product_name:e.target.value}))} placeholder="Product Name" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input value={f.dosage} onChange={e=>setF(p=>({...p,dosage:e.target.value}))} placeholder="Dosage" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-stone-500">Treatment Date</label><input type="date" value={f.treatment_date} onChange={e=>setF(p=>({...p,treatment_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-stone-500">End Date</label><input type="date" value={f.end_date} onChange={e=>setF(p=>({...p,end_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" /></div>
        </div>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}

function TransferForm({ hiveId, onClose, onSaved }: { hiveId: number; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [hives, setHives] = useState<Hive[]>([]);
  const [f, setF] = useState({ target_hive_id: '', transfer_date: new Date().toISOString().split('T')[0], transfer_type: 'pot_to_box', queen_moved: true, brood_frames_moved: '0', notes: '' });
  useEffect(() => { hivesService.getAll().then(h => setHives(h.filter((x: Hive)=>x.id!==hiveId))).catch(()=>{}); }, [hiveId]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if(!f.target_hive_id) return; setSaving(true);
    try {
      await transfersService.create({ source_hive_id: hiveId, target_hive_id: parseInt(f.target_hive_id), transfer_date: f.transfer_date, transferType: f.transfer_type, queenMoved: f.queen_moved, broodFramesMoved: parseInt(f.brood_frames_moved) || 0, notes: f.notes || undefined });
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">Colony Transfer</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <select value={f.target_hive_id} onChange={e=>setF(p=>({...p,target_hive_id:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm"><option value="">Select target hive *</option>{hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select>
        <input type="date" value={f.transfer_date} onChange={e=>setF(p=>({...p,transfer_date:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <select value={f.transfer_type} onChange={e=>setF(p=>({...p,transfer_type:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm">
          <option value="pot_to_box">Pot to Box</option><option value="split">Split</option><option value="merge">Merge</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.queen_moved} onChange={e=>setF(p=>({...p,queen_moved:e.target.checked}))} className="accent-amber-500" /> Queen Moved</label>
        <input value={f.brood_frames_moved} onChange={e=>setF(p=>({...p,brood_frames_moved:e.target.value}))} placeholder="Brood Frames Moved" type="number" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Transfer'}</button>
      </form>
    </div></div>
  );
}

// ---- Main Screen ----
export function ViewHiveScreen({ onBack, onEditHive, hiveId }: Props) {
  const [hive, setHive] = useState<Hive | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HiveTab>('overview');

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [components, setComponents] = useState<HiveComponent[]>([]);
  const [queens, setQueens] = useState<Queen[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [transfers, setTransfers] = useState<ColonyTransfer[]>([]);

  const [showInspForm, setShowInspForm] = useState<Inspection | true | false>(false);
  const [showFeedForm, setShowFeedForm] = useState<Feeding | true | false>(false);
  const [showCompForm, setShowCompForm] = useState<HiveComponent | true | false>(false);
  const [showQueenForm, setShowQueenForm] = useState<Queen | true | false>(false);
  const [showTreatForm, setShowTreatForm] = useState<Treatment | true | false>(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const fetchHive = async () => { try { const h = await hivesService.getById(hiveId); setHive(h); } catch {} };
  const fetchInspections = async () => { try { setInspections(await inspectionsService.getByHive(hiveId)); } catch {} };
  const fetchFeedings = async () => { try { setFeedings(await feedingsService.getByHive(hiveId)); } catch {} };
  const fetchComponents = async () => { try { setComponents(await componentsService.getByHive(hiveId)); } catch {} };
  const fetchQueens = async () => { try { setQueens(await queensService.getByHive(hiveId)); } catch {} };
  const fetchTreatments = async () => { try { setTreatments(await treatmentsService.getByHive(hiveId)); } catch {} };
  const fetchTransfers = async () => { try { setTransfers(await transfersService.getAll(hiveId)); } catch {} };

  useEffect(() => {
    Promise.all([fetchHive(), fetchInspections(), fetchFeedings(), fetchComponents(), fetchQueens(), fetchTreatments(), fetchTransfers()])
      .finally(() => setLoading(false));
  }, [hiveId]);

  const toggleStar = async () => { if (!hive) return; await hivesService.toggleStar(hive.id); fetchHive(); };
  const toggleFlag = async () => { if (!hive) return; await hivesService.toggleFlag(hive.id); fetchHive(); };
  const handleDeleteHive = async () => {
    if (!hive) return;
    if (!confirm(`Delete hive "${hive.name}"? All inspections, feedings, treatments and other records will also be deleted. This cannot be undone.`)) return;
    try { await hivesService.delete(hive.id); onBack(); } catch {}
  };
  const deleteInspection = async (id: number) => { if (!confirm('Delete this inspection?')) return; await inspectionsService.delete(id); fetchInspections(); };
  const deleteFeeding = async (id: number) => { if (!confirm('Delete?')) return; await feedingsService.delete(id); fetchFeedings(); };
  const deleteComponent = async (id: number) => { if (!confirm('Delete?')) return; await componentsService.delete(id); fetchComponents(); };
  const deleteQueen = async (id: number) => { if (!confirm('Delete?')) return; await queensService.delete(id); fetchQueens(); };
  const deleteTreatment = async (id: number) => { if (!confirm('Delete?')) return; await treatmentsService.delete(id); fetchTreatments(); };

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!hive) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><p>Hive not found</p></div>;

  const tabs: { key: HiveTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: ClipboardList },
    { key: 'inspections', label: 'Inspections', icon: ClipboardList },
    { key: 'feedings', label: 'Feedings', icon: Droplets },
    { key: 'components', label: 'Parts', icon: Wrench },
    { key: 'queens', label: 'Queens', icon: Crown },
    { key: 'treatments', label: 'Treatments', icon: Pill },
    { key: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-stone-700" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-stone-800">{hive.name}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[hive.hive_type] || ''}`}>{hive.hive_type}</span>
          </div>
          <p className="text-xs text-stone-500">{hive.apiary_name || 'Standalone'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleStar} className="p-2 hover:bg-stone-100 rounded-lg"><Star className={`w-5 h-5 ${hive.is_starred ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} /></button>
          <button onClick={toggleFlag} className="p-2 hover:bg-stone-100 rounded-lg"><Flag className={`w-5 h-5 ${hive.is_flagged ? 'text-red-500 fill-red-500' : 'text-stone-400'}`} /></button>
          {onEditHive && <button onClick={() => onEditHive(hive)} className="p-2 hover:bg-stone-100 rounded-lg"><Edit2 className="w-5 h-5 text-stone-600" /></button>}
        </div>
      </div>

      <div className="bg-white border-b overflow-x-auto hide-scrollbar">
        <div className="flex px-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 ${activeTab===t.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {activeTab === 'overview' && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-stone-500">Status</p><p className="font-medium text-stone-800 capitalize">{hive.status}</p></div>
                <div><p className="text-xs text-stone-500">Type</p><p className="font-medium text-stone-800 capitalize">{hive.hive_type}</p></div>
                <div><p className="text-xs text-stone-500">Queen</p><p className="font-medium">{hive.queen_present ? '♛ Present' : '⚠ Absent'}</p></div>
                <div><p className="text-xs text-stone-500">Colony Strength</p><p className="font-medium capitalize">{hive.colony_strength || 'N/A'}</p></div>
              </div>
              {hive.notes && <div><p className="text-xs text-stone-500">Notes</p><p className="text-sm text-stone-600 bg-stone-50 p-2 rounded-lg">{hive.notes}</p></div>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-lg font-bold text-amber-600">{inspections.length}</p><p className="text-xs text-stone-500">Inspections</p></div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-lg font-bold text-emerald-600">{feedings.length}</p><p className="text-xs text-stone-500">Feedings</p></div>
              <div className="bg-white rounded-xl p-3 shadow-sm text-center"><p className="text-lg font-bold text-blue-600">{treatments.length}</p><p className="text-xs text-stone-500">Treatments</p></div>
            </div>
            <button onClick={handleDeleteHive} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm border border-red-200">
              <Trash2 className="w-4 h-4" /> Delete Hive
            </button>
          </>
        )}

        {activeTab === 'inspections' && (
          <>
            <button onClick={() => setShowInspForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Inspection</button>
            {inspections.length === 0 ? <p className="text-center text-stone-500 py-8">No inspections recorded</p> : inspections.map(i => (
              <div key={i.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-800">{new Date(i.inspection_date).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowInspForm(i)} className="p-1 hover:bg-stone-100 rounded"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                    <button onClick={() => deleteInspection(i.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {i.colony_strength && <span className="bg-stone-100 px-2 py-0.5 rounded capitalize">Strength: {i.colony_strength}</span>}
                  {i.queen_present ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">♛ Queen present</span> : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠ Queen absent</span>}
                  {i.pest_detected ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">🐛 Pest detected</span> : null}
                </div>
                {i.notes && <p className="text-xs text-stone-500 mt-1">{i.notes}</p>}
              </div>
            ))}
            {showInspForm && <InspectionForm hiveId={hiveId} initial={showInspForm === true ? undefined : showInspForm} onClose={() => setShowInspForm(false)} onSaved={() => { setShowInspForm(false); fetchInspections(); }} />}
          </>
        )}

        {activeTab === 'feedings' && (
          <>
            <button onClick={() => setShowFeedForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Feeding</button>
            {feedings.length === 0 ? <p className="text-center text-stone-500 py-8">No feedings recorded</p> : feedings.map(f => (
              <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-800">{new Date(f.feeding_date).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowFeedForm(f)} className="p-1 hover:bg-stone-100 rounded"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                    <button onClick={() => deleteFeeding(f.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="text-xs text-stone-600"><span className="capitalize">{f.feed_type.replace('_',' ')}</span> {f.quantity && ` • ${f.quantity} ${f.unit}`}</div>
                {f.notes && <p className="text-xs text-stone-500 mt-1">{f.notes}</p>}
              </div>
            ))}
            {showFeedForm && <FeedingForm hiveId={hiveId} initial={showFeedForm === true ? undefined : showFeedForm} onClose={() => setShowFeedForm(false)} onSaved={() => { setShowFeedForm(false); fetchFeedings(); }} />}
          </>
        )}

        {activeTab === 'components' && (
          <>
            <button onClick={() => setShowCompForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Component</button>
            {components.length === 0 ? <p className="text-center text-stone-500 py-8">No components recorded</p> : components.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-800 capitalize">{c.component_type.replace('_',' ')} (x{c.quantity})</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowCompForm(c)} className="p-1 hover:bg-stone-100 rounded"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                    <button onClick={() => deleteComponent(c.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="text-xs text-stone-600">
                  {c.installed_date && <>Installed: {new Date(c.installed_date).toLocaleDateString()} • </>}
                  <span className="capitalize">Condition: {c.condition}</span>
                </div>
              </div>
            ))}
            {showCompForm && <ComponentForm hiveId={hiveId} initial={showCompForm === true ? undefined : showCompForm} onClose={() => setShowCompForm(false)} onSaved={() => { setShowCompForm(false); fetchComponents(); }} />}
          </>
        )}

        {activeTab === 'queens' && (
          <>
            <button onClick={() => setShowQueenForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Queen Record</button>
            {queens.length === 0 ? <p className="text-center text-stone-500 py-8">No queen records</p> : queens.map(q => (
              <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-800">{q.species || 'Unknown species'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowQueenForm(q)} className="p-1 hover:bg-stone-100 rounded"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                    <button onClick={() => deleteQueen(q.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="text-xs text-stone-600">
                  {q.marking_color && <span>Color: {q.marking_color} • </span>}
                  {q.source && <span className="capitalize">Source: {q.source} • </span>}
                  <span className="capitalize">Status: {q.status}</span>
                </div>
                {q.introduction_date && <div className="text-xs text-stone-500 mt-1">Introduced: {new Date(q.introduction_date).toLocaleDateString()}</div>}
              </div>
            ))}
            {showQueenForm && <QueenForm hiveId={hiveId} initial={showQueenForm === true ? undefined : showQueenForm} onClose={() => setShowQueenForm(false)} onSaved={() => { setShowQueenForm(false); fetchQueens(); }} />}
          </>
        )}

        {activeTab === 'treatments' && (
          <>
            <button onClick={() => setShowTreatForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Treatment</button>
            {treatments.length === 0 ? <p className="text-center text-stone-500 py-8">No treatments recorded</p> : treatments.map(t => (
              <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-800 capitalize">{t.treatment_type || t.product_name || 'Treatment'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowTreatForm(t)} className="p-1 hover:bg-stone-100 rounded"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                    <button onClick={() => deleteTreatment(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <div className="text-xs text-stone-600">
                  {t.product_name && <span>{t.product_name} • </span>}
                  {t.dosage && <span>Dose: {t.dosage} • </span>}
                  Applied: {new Date(t.treatment_date).toLocaleDateString()}
                  {t.end_date && <span> • End: {new Date(t.end_date).toLocaleDateString()}</span>}
                </div>
                {t.notes && <p className="text-xs text-stone-500 mt-1">{t.notes}</p>}
              </div>
            ))}
            {showTreatForm && <TreatmentForm hiveId={hiveId} initial={showTreatForm === true ? undefined : showTreatForm} onClose={() => setShowTreatForm(false)} onSaved={() => { setShowTreatForm(false); fetchTreatments(); }} />}
          </>
        )}

        {activeTab === 'transfers' && (
          <>
            <button onClick={() => setShowTransferForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> New Transfer</button>
            {transfers.length === 0 ? <p className="text-center text-stone-500 py-8">No colony transfers</p> : transfers.map(t => (
              <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-800">{new Date(t.transfer_date).toLocaleDateString()}</span>
                  <span className="text-xs bg-stone-100 px-2 py-0.5 rounded capitalize">{t.transfer_type?.replace('_',' ')}</span>
                </div>
                <div className="text-xs text-stone-600">
                  <span>From: {t.source_hive_name || `#${t.source_hive_id}`}</span> → <span>To: {t.target_hive_name || `#${t.target_hive_id}`}</span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {t.queen_moved ? '♛ Queen moved' : ''} {t.brood_frames_moved ? ` • ${t.brood_frames_moved} brood frames` : ''}
                </div>
                {t.notes && <p className="text-xs text-stone-500 mt-1">{t.notes}</p>}
              </div>
            ))}
            {showTransferForm && <TransferForm hiveId={hiveId} onClose={() => setShowTransferForm(false)} onSaved={() => { setShowTransferForm(false); fetchTransfers(); }} />}
          </>
        )}
      </div>
    </div>
  );
}
