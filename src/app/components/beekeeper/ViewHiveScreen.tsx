import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Flag, Plus, Edit2, Trash2, ArrowRightLeft, ClipboardList, Droplets, Wrench, Crown, Pill, X, MapPin, AlertTriangle, Lock } from 'lucide-react';
import { hivesService, type Hive } from '../../services/hives';
import { apiariesService, type Apiary } from '../../services/apiaries';
import { inspectionsService, type Inspection } from '../../services/inspections';
import { feedingsService, type Feeding, componentsService, type HiveComponent, queensService, type Queen, treatmentsService, type Treatment } from '../../services/hiveDetails';
import { transfersService, type ColonyTransfer } from '../../services/transfers';
import { notificationsService } from '../../services/notifications';
import { harvestsService, type Harvest } from '../../services/harvests';
import { expensesService, type Expense } from '../../services/finance';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onBack: () => void; onEditHive?: (hive: Hive) => void; hiveId: number; onLogout: () => void;
}

type QueenPresence = 'seen' | 'fresh_eggs' | 'not_seen';
type HoneyPollenStores = 'low' | 'sufficient' | 'high';
type PestStatus = 'clear' | 'pest_detected' | 'under_treatment';
type OptionalYesNo = 'yes' | 'no' | '';

interface InspectionMetadata {
  queen_presence: QueenPresence;
  honey_pollen_stores: HoneyPollenStores;
  pest_statuses: PestStatus[];
  pest_name?: string;
  treatment_used?: string;
  active_frame_count: number;
  queen_cell_presence?: OptionalYesNo;
  bottom_board_cleaned?: OptionalYesNo;
  general_remarks?: string;
  inspection_time?: string;
}



function normalizeColonyStrength(value?: string): 'weak' | 'normal' | 'strong' {
  if (value === 'weak' || value === 'normal' || value === 'strong') return value;
  return 'normal';
}

// ---- Inspection Form: Modern Hive (Box Hive) Inspection Details (Table 1) ----
function InspectionForm({ hiveId, initial, onClose, onSaved }: { hiveId: number; initial?: Inspection; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    inspection_date: initial?.inspection_date || new Date().toISOString().split('T')[0],
    queen_presence: (initial?.queen_presence || 'seen') as 'seen' | 'fresh_eggs' | 'not_seen',
    honey_pollen_stores: (initial?.honey_pollen_stores || 'sufficient') as 'low' | 'sufficient' | 'high',
    pest_disease_presence: (initial?.pest_disease_presence || ['clear']) as string[],
    pest_name: initial?.pest_name || '',
    pest_treatment_status: (initial?.pest_treatment_status || 'clear') as 'clear' | 'pest_detected' | 'under_treatment',
    treatment_used: initial?.treatment_used || '',
    active_frame_count: (initial?.active_frame_count?.toString() || '') as string,
    queen_cell_presence: (initial?.queen_cell_presence || null) as 'yes' | 'no' | null,
    bottom_board_cleaned: (initial?.bottom_board_cleaned || null) as 'yes' | 'no' | null,
    general_remarks: initial?.general_remarks || '',
  });

  const togglePestStatus = (status: string) => {
    setF(p => ({
      ...p,
      pest_disease_presence: p.pest_disease_presence.includes(status)
        ? p.pest_disease_presence.filter(s => s !== status)
        : [...p.pest_disease_presence, status]
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.queen_presence || !f.honey_pollen_stores || f.pest_disease_presence.length === 0 || !f.active_frame_count) {
      alert('Please fill all mandatory fields');
      return;
    }
    setSaving(true);
    try {
      const d: any = {
        hive_id: hiveId,
        inspection_date: f.inspection_date,
        queen_presence: f.queen_presence,
        honey_pollen_stores: f.honey_pollen_stores,
        pest_disease_presence: f.pest_disease_presence,
        pest_name: f.pest_name || null,
        pest_treatment_status: f.pest_treatment_status,
        treatment_used: f.treatment_used || null,
        active_frame_count: f.active_frame_count ? parseInt(f.active_frame_count) : null,
        queen_cell_presence: f.queen_cell_presence || null,
        bottom_board_cleaned: f.bottom_board_cleaned || null,
        general_remarks: f.general_remarks || null,
      };

      if (initial) {
        await inspectionsService.update(initial.id, d);
      } else {
        await inspectionsService.create(d);
        if (f.pest_disease_presence.includes('pest_detected') || f.pest_disease_presence.includes('under_treatment')) {
          await notificationsService.create({
            title: 'Pest detected during inspection',
            message: `Hive #${hiveId} has pest detection.`,
            notification_type: 'pest',
            severity: 'high',
            related_type: 'hive',
            related_id: hiveId,
          });
        }
      }
      onSaved();
    } catch (error) {
      console.error('Inspection save failed:', error);
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-stone-800">Modern Hive Inspection</h3>
          <button onClick={onClose} className="p-1"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Inspection Date */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Inspection Date</label>
            <input
              type="date"
              value={f.inspection_date}
              onChange={e => setF(p => ({ ...p, inspection_date: e.target.value }))}
              required
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Queen Presence */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">1. Queen Presence * (Mandatory)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Confirm if the queen is seen or if there are fresh eggs (evidence of presence).</p>
            <select
              value={f.queen_presence}
              onChange={e => setF(p => ({ ...p, queen_presence: e.target.value as any }))}
              required
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
            >
              <option value="seen">Queen Seen</option>
              <option value="fresh_eggs">Fresh Eggs Present</option>
              <option value="not_seen">Queen Not Seen</option>
            </select>
          </div>

          {/* Honey/Pollen Stores */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">3. Honey/Pollen Stores * (Mandatory)</label>
            <select
              value={f.honey_pollen_stores}
              onChange={e => setF(p => ({ ...p, honey_pollen_stores: e.target.value as any }))}
              required
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="low">Low</option>
              <option value="sufficient">Sufficient</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Pest/Disease Presence */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-2">4. Pest/Disease Presence * (Mandatory)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Multi-select. Record pest detection that history is available. Then with next inspection when user changes to under treatment then status is changed, and finally when clear it is clear</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.pest_disease_presence.includes('clear')}
                  onChange={() => togglePestStatus('clear')}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-xs">Clear (No Pests)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.pest_disease_presence.includes('pest_detected')}
                  onChange={() => togglePestStatus('pest_detected')}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-xs">Pest Detected</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.pest_disease_presence.includes('under_treatment')}
                  onChange={() => togglePestStatus('under_treatment')}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-xs">Under Treatment</span>
              </label>
            </div>

            {(f.pest_disease_presence.includes('pest_detected') || f.pest_disease_presence.includes('under_treatment')) && (
              <div className="mt-2 pt-2 border-t border-red-200 space-y-1.5">
                <input
                  type="text"
                  value={f.pest_name}
                  onChange={e => setF(p => ({ ...p, pest_name: e.target.value }))}
                  placeholder="Pest name (Varroa, Wax Moth, Foulbrood, etc.)"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs"
                />
                {f.pest_disease_presence.includes('under_treatment') && (
                  <input
                    type="text"
                    value={f.treatment_used}
                    onChange={e => setF(p => ({ ...p, treatment_used: e.target.value }))}
                    placeholder="Treatment used (product name or method)"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs"
                  />
                )}
              </div>
            )}
          </div>

          {/* Active Frame Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">6. Active Frame Count * (Mandatory)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Number of frames covered by bees; validates if the 8mm bee space is maintained.</p>
            <input
              type="number"
              min="0"
              value={f.active_frame_count}
              onChange={e => setF(p => ({ ...p, active_frame_count: e.target.value }))}
              required
              placeholder="Enter number of active frames"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Queen Cell Presence */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">7. Queen Cell Presence (Optional)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Identification of vertical peanut-shaped cells on the bottom edge of frames.</p>
            <select
              value={f.queen_cell_presence || ''}
              onChange={e => setF(p => ({ ...p, queen_cell_presence: e.target.value as any }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs"
            >
              <option value="">Not recorded</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Bottom Board Cleaned */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">11. Bottom Board Cleaned (Optional)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Check if debris and waste were cleared from the floor board.</p>
            <select
              value={f.bottom_board_cleaned || ''}
              onChange={e => setF(p => ({ ...p, bottom_board_cleaned: e.target.value as any }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs"
            >
              <option value="">Not recorded</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* General Remarks */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">12. General Remarks (Optional)</label>
            <p className="text-[0.7rem] text-stone-600 mb-2">Notes on bee temperament or external environmental changes.</p>
            <textarea
              value={f.general_remarks}
              onChange={e => setF(p => ({ ...p, general_remarks: e.target.value }))}
              placeholder="Observations about colony, weather, or other comments"
              rows={3}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-xs disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : initial ? 'Update Inspection' : 'Record Inspection'}
          </button>
        </form>
      </div>
    </div>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">{initial ? 'Edit' : 'New'} Feeding</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <form onSubmit={submit} className="space-y-2">
        <input type="date" value={f.feeding_date} onChange={e=>setF(p=>({...p,feeding_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <select value={f.feed_type} onChange={e=>setF(p=>({...p,feed_type:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs"><option value="sugar_syrup">Sugar Syrup</option><option value="pollen_patty">Pollen Patty</option><option value="fondant">Fondant</option><option value="honey">Honey</option><option value="other">Other</option></select>
        <div className="grid grid-cols-2 gap-1.5">
          <input value={f.quantity} onChange={e=>setF(p=>({...p,quantity:e.target.value}))} placeholder="Qty" type="number" className="border rounded-lg px-2.5 py-1.5 text-xs" />
          <select value={f.unit} onChange={e=>setF(p=>({...p,unit:e.target.value}))} className="border rounded-lg px-2.5 py-1.5 text-xs"><option value="ml">ml</option><option value="l">L</option><option value="g">g</option><option value="kg">kg</option></select>
        </div>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={1} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-1.5 rounded-lg font-medium disabled:opacity-60 text-xs">{saving ? 'Saving...' : 'Save'}</button>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">{initial ? 'Edit' : 'New'} Component</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <form onSubmit={submit} className="space-y-2">
        <select value={f.component_type} onChange={e=>setF(p=>({...p,component_type:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
          <option value="frame">Frame</option><option value="super">Super</option><option value="feeder">Feeder</option><option value="queen_excluder">Queen Excluder</option><option value="entrance_reducer">Entrance Reducer</option><option value="bottom_board">Bottom Board</option><option value="inner_cover">Inner Cover</option><option value="outer_cover">Outer Cover</option><option value="other">Other</option>
        </select>
        <input value={f.quantity} onChange={e=>setF(p=>({...p,quantity:e.target.value}))} placeholder="Quantity" type="number" className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <input type="date" value={f.installed_date} onChange={e=>setF(p=>({...p,installed_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <select value={f.condition} onChange={e=>setF(p=>({...p,condition:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="replaced">Replaced</option></select>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={1} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-1.5 rounded-lg font-medium disabled:opacity-60 text-xs">{saving ? 'Saving...' : 'Save'}</button>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">{initial ? 'Edit' : 'New'} Queen</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <form onSubmit={submit} className="space-y-2">
        <select value={f.species} onChange={e=>setF(p=>({...p,species:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">Species</option><option value="apis_cerana">Apis Cerana</option><option value="apis_mellifera">Apis Mellifera</option><option value="apis_dorsata">Apis Dorsata</option><option value="other">Other</option>
        </select>
        <select value={f.marking_color} onChange={e=>setF(p=>({...p,marking_color:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">Marking Color</option><option value="white">White</option><option value="yellow">Yellow</option><option value="red">Red</option><option value="green">Green</option><option value="blue">Blue</option><option value="unmarked">Unmarked</option>
        </select>
        <select value={f.source} onChange={e=>setF(p=>({...p,source:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs"><option value="">Source</option><option value="purchased">Purchased</option><option value="swarm">Swarm</option><option value="reared">Reared</option><option value="split">Split</option><option value="unknown">Unknown</option></select>
        <input type="date" value={f.introduction_date} onChange={e=>setF(p=>({...p,introduction_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs"><option value="active">Active</option><option value="superseded">Superseded</option><option value="dead">Dead</option><option value="missing">Missing</option><option value="removed">Removed</option></select>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={1} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-1.5 rounded-lg font-medium disabled:opacity-60 text-xs">{saving ? 'Saving...' : 'Save'}</button>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">{initial ? 'Edit' : 'New'} Treatment</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <form onSubmit={submit} className="space-y-2">
        <select value={f.treatment_type} onChange={e=>setF(p=>({...p,treatment_type:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">Treatment Type *</option><option value="varroa">Varroa</option><option value="nosema">Nosema</option><option value="foulbrood">Foulbrood</option><option value="wax_moth">Wax Moth</option><option value="small_hive_beetle">Small Hive Beetle</option><option value="other">Other</option>
        </select>
        <input value={f.product_name} onChange={e=>setF(p=>({...p,product_name:e.target.value}))} placeholder="Product Name" className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <input value={f.dosage} onChange={e=>setF(p=>({...p,dosage:e.target.value}))} placeholder="Dosage" className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <div className="grid grid-cols-2 gap-1.5">
          <div><label className="text-xs text-stone-500">Treatment Date</label><input type="date" value={f.treatment_date} onChange={e=>setF(p=>({...p,treatment_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" /></div>
          <div><label className="text-xs text-stone-500">End Date</label><input type="date" value={f.end_date} onChange={e=>setF(p=>({...p,end_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" /></div>
        </div>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={1} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-1.5 rounded-lg font-medium disabled:opacity-60 text-xs">{saving ? 'Saving...' : 'Save'}</button>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">Colony Transfer</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <form onSubmit={submit} className="space-y-2">
        <select value={f.target_hive_id} onChange={e=>setF(p=>({...p,target_hive_id:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs"><option value="">Select target hive *</option>{hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select>
        <input type="date" value={f.transfer_date} onChange={e=>setF(p=>({...p,transfer_date:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <select value={f.transfer_type} onChange={e=>setF(p=>({...p,transfer_type:e.target.value}))} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
          <option value="pot_to_box">Pot to Box</option><option value="split">Split</option><option value="merge">Merge</option>
        </select>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.queen_moved} onChange={e=>setF(p=>({...p,queen_moved:e.target.checked}))} className="accent-amber-500" /> Queen Moved</label>
        <input value={f.brood_frames_moved} onChange={e=>setF(p=>({...p,brood_frames_moved:e.target.value}))} placeholder="Brood Frames" type="number" className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={1} className="w-full border rounded-lg px-2.5 py-1.5 text-xs" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-1.5 rounded-lg font-medium disabled:opacity-60 text-xs">{saving ? 'Saving...' : 'Transfer'}</button>
      </form>
    </div></div>
  );
}

function MoveHiveForm({ hiveId, onClose, onSaved }: { hiveId: number; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [targetApiaryId, setTargetApiaryId] = useState('');

  useEffect(() => {
    apiariesService.getAll().then(setApiaries).catch(() => setApiaries([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApiaryId) return;
    setSaving(true);
    try {
      await hivesService.moveToApiary(hiveId, parseInt(targetApiaryId, 10));
      onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-3 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm text-stone-800">Move Hive</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">Select the destination apiary and confirm. This moves the current hive without splitting.</p>
      </div>
      <form onSubmit={submit} className="space-y-2">
        <select
          required
          value={targetApiaryId}
          onChange={(event) => setTargetApiaryId(event.target.value)}
          className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
        >
          <option value="">Select target apiary</option>
          {apiaries.map((apiary) => (
            <option key={apiary.id} value={apiary.id}>{apiary.name}</option>
          ))}
        </select>
        <button type="submit" disabled={saving || !targetApiaryId} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">
          {saving ? 'Moving...' : 'Move Hive'}
        </button>
      </form>
    </div></div>
  );
}

// ---- Main Screen ----
export function ViewHiveScreen({ onBack, onEditHive, hiveId }: Props) {
  const [hive, setHive] = useState<Hive | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; lockedByName?: string; isOwner?: boolean } | null>(null);

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [components, setComponents] = useState<HiveComponent[]>([]);
  const [queens, setQueens] = useState<Queen[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [transfers, setTransfers] = useState<ColonyTransfer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [savingQuickInspection, setSavingQuickInspection] = useState(false);
  const [savingQuickExpense, setSavingQuickExpense] = useState(false);
  const [savingQuickHarvest, setSavingQuickHarvest] = useState(false);
  const [savingQuickQueen, setSavingQuickQueen] = useState(false);
  const [quickInspection, setQuickInspection] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: new Date().toTimeString().slice(0, 5),
    colony_strength: 'normal' as 'weak' | 'normal' | 'strong',
    queen_presence: 'seen' as QueenPresence,
    honey_pollen_stores: 'sufficient' as HoneyPollenStores,
    pest_statuses: ['clear'] as PestStatus[],
    pest_name: '',
    treatment_used: '',
    active_frame_count: '',
    queen_cell_presence: '' as OptionalYesNo,
    bottom_board_cleaned: '' as OptionalYesNo,
    general_remarks: '',
  });
  const [quickExpense, setQuickExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'fuel_transport',
    amount: '',
    description: '',
  });
  const [quickHarvest, setQuickHarvest] = useState({
    harvest_date: new Date().toISOString().split('T')[0],
    harvest_type: 'Honey',
    quantity: '',
    unit: 'kg',
    notes: '',
  });
  const [quickQueen, setQuickQueen] = useState({
    introduction_date: new Date().toISOString().split('T')[0],
    queen_type: 'local_wild',
    breed_color: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [showInspForm, setShowInspForm] = useState<Inspection | true | false>(false);
  const [showFeedForm, setShowFeedForm] = useState<Feeding | true | false>(false);
  const [showCompForm, setShowCompForm] = useState<HiveComponent | true | false>(false);
  const [showQueenForm, setShowQueenForm] = useState<Queen | true | false>(false);
  const [showTreatForm, setShowTreatForm] = useState<Treatment | true | false>(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);

  const fetchHive = async () => { try { const h = await hivesService.getById(hiveId); setHive(h); } catch {} };
  const fetchInspections = async () => { try { setInspections(await inspectionsService.getByHive(hiveId)); } catch {} };
  const fetchFeedings = async () => { try { setFeedings(await feedingsService.getByHive(hiveId)); } catch {} };
  const fetchComponents = async () => { try { setComponents(await componentsService.getByHive(hiveId)); } catch {} };
  const fetchQueens = async () => { try { setQueens(await queensService.getByHive(hiveId)); } catch {} };
  const fetchTreatments = async () => { try { setTreatments(await treatmentsService.getByHive(hiveId)); } catch {} };
  const fetchTransfers = async () => { try { setTransfers(await transfersService.getAll(hiveId)); } catch {} };
  const fetchExpenses = async () => {
    try {
      const allExpenses = await expensesService.getAll();
      setExpenses(allExpenses.filter((expense) => expense.hive_id === hiveId));
    } catch {
      setExpenses([]);
    }
  };
  const fetchHarvests = async () => {
    try {
      const allHarvests = await harvestsService.getAll();
      setHarvests(allHarvests.filter((harvest) => harvest.hive_id === hiveId));
    } catch {
      setHarvests([]);
    }
  };

  useEffect(() => {
    Promise.all([fetchHive(), fetchInspections(), fetchFeedings(), fetchComponents(), fetchQueens(), fetchTreatments(), fetchTransfers(), fetchExpenses(), fetchHarvests()])
      .finally(() => setLoading(false));
    // Check lock status
    hivesService.checkLock(hiveId).then(setLockInfo).catch(() => {});
  }, [hiveId]);

  useEffect(() => {
    if (!hive) return;
    setQuickInspection((current) => ({
      ...current,
      colony_strength: normalizeColonyStrength(hive.colony_strength),
      queen_presence: hive.queen_present ? 'seen' : 'not_seen',
    }));
  }, [hive]);

  // R9.4: Acquire lock before editing
  const handleEditHive = async () => {
    if (!hive || !onEditHive) return;
    try {
      await hivesService.acquireLock(hive.id);
      onEditHive(hive);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.data?.lockedByName;
      if (err?.response?.status === 409) {
        alert(msg || 'This hive is currently being edited by another user. Please try again later.');
      } else {
        // Lock table might not exist yet, proceed anyway
        onEditHive(hive);
      }
    }
  };

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

  const saveQuickInspection = async () => {
    if (!hive) return;
    if (!quickInspection.queen_presence) return;
    if (!quickInspection.honey_pollen_stores) return;
    if (quickInspection.pest_statuses.length === 0) return;
    if (!quickInspection.active_frame_count || Number(quickInspection.active_frame_count) <= 0) return;

    setSavingQuickInspection(true);
    try {
      const pestDetectedNow = quickInspection.pest_statuses.includes('pest_detected') || quickInspection.pest_statuses.includes('under_treatment');

      await inspectionsService.create({
        hive_id: hive.id,
        inspection_date: quickInspection.inspection_date,
        colony_strength: quickInspection.colony_strength,
        queen_present: quickInspection.queen_presence === 'not_seen' ? 0 : 1,
        pest_detected: pestDetectedNow ? 1 : 0,
        notes: quickInspection.general_remarks,
        queen_presence: quickInspection.queen_presence,
        honey_pollen_stores: quickInspection.honey_pollen_stores,
        pest_disease_presence: quickInspection.pest_statuses,
        pest_name: quickInspection.pest_name || undefined,
        pest_treatment_status: quickInspection.pest_statuses.includes('under_treatment') ? 'under_treatment' : (quickInspection.pest_statuses.includes('pest_detected') ? 'pest_detected' : 'clear'),
        treatment_used: quickInspection.treatment_used || undefined,
        active_frame_count: Number(quickInspection.active_frame_count),
        queen_cell_presence: quickInspection.queen_cell_presence || undefined,
        bottom_board_cleaned: quickInspection.bottom_board_cleaned || undefined,
        general_remarks: quickInspection.general_remarks || undefined,
      });

      // Keep pest detection meter sticky once detected at least once.
      if (pestDetectedNow || hive.pest_detected) {
        await hivesService.update(hive.id, {
          colony_strength: quickInspection.colony_strength,
          queen_present: quickInspection.queen_presence === 'not_seen' ? 0 : 1,
          pest_detected: 1,
        } as any);
      } else {
        await hivesService.update(hive.id, {
          colony_strength: quickInspection.colony_strength,
          queen_present: quickInspection.queen_presence === 'not_seen' ? 0 : 1,
        } as any);
      }

      await fetchInspections();
      await fetchHive();
      setQuickInspection((current) => ({
        ...current,
        pest_statuses: ['clear'],
        pest_name: '',
        treatment_used: '',
        general_remarks: '',
      }));
    } catch {
      // Keep lightweight behavior to match existing screen error handling.
    }
    setSavingQuickInspection(false);
  };

  const saveQuickExpense = async () => {
    if (!hive) return;
    const amount = Number(quickExpense.amount);
    if (!quickExpense.expense_type || !quickExpense.expense_date || !amount || amount <= 0) return;

    setSavingQuickExpense(true);
    try {
      await expensesService.create({
        hive_id: hive.id,
        expense_date: quickExpense.expense_date,
        expense_type: quickExpense.expense_type,
        amount,
        description: quickExpense.description || undefined,
      });
      await fetchExpenses();
      setQuickExpense((current) => ({
        ...current,
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
      }));
    } catch {
      // Keep behavior consistent with the rest of this screen.
    }
    setSavingQuickExpense(false);
  };

  const saveQuickHarvest = async () => {
    if (!hive) return;
    const quantity = Number(quickHarvest.quantity);
    if (!quickHarvest.harvest_type || !quickHarvest.harvest_date || !quantity || quantity <= 0) return;

    setSavingQuickHarvest(true);
    try {
      await harvestsService.create({
        hive_id: hive.id,
        harvest_date: quickHarvest.harvest_date,
        harvest_type: quickHarvest.harvest_type,
        quantity,
        unit: quickHarvest.unit,
        notes: quickHarvest.notes || undefined,
      });
      await fetchHarvests();
      setQuickHarvest((current) => ({
        ...current,
        quantity: '',
        notes: '',
        harvest_date: new Date().toISOString().split('T')[0],
      }));
    } catch {
      // Keep behavior consistent with the rest of this screen.
    }
    setSavingQuickHarvest(false);
  };

  const saveQuickQueen = async () => {
    if (!hive || !quickQueen.introduction_date || !quickQueen.queen_type) return;

    setSavingQuickQueen(true);
    try {
      const queenStatus = quickQueen.status === 'active' ? 'active' : 'missing';
      await queensService.create({
        hive_id: hive.id,
        introduction_date: quickQueen.introduction_date,
        source: quickQueen.queen_type,
        species: quickQueen.breed_color || undefined,
        status: queenStatus,
        notes: quickQueen.status === 'inactive' ? 'Hive marked queenless. Add replacement queen.' : undefined,
      });

      await hivesService.update(hive.id, {
        queen_present: quickQueen.status === 'active' ? 1 : 0,
      } as any);

      await fetchQueens();
      await fetchHive();

      if (quickQueen.status === 'inactive') {
        alert('Hive is now marked queenless. Please add a new active queen record when introduced.');
      }

      setQuickQueen((current) => ({
        ...current,
        introduction_date: new Date().toISOString().split('T')[0],
        queen_type: 'local_wild',
        breed_color: '',
        status: 'active',
      }));
    } catch {
      // Keep behavior consistent with the rest of this screen.
    }
    setSavingQuickQueen(false);
  };

  const deleteExpense = async (id: number) => { if (!confirm('Delete this expense?')) return; await expensesService.delete(id); fetchExpenses(); };
  const deleteHarvest = async (id: number) => { if (!confirm('Delete this harvest?')) return; await harvestsService.delete(id); fetchHarvests(); };

  const expenseCategoryOptions = [
    { value: 'fuel_transport', label: '⛽ Fuel & Transport' },
    { value: 'bee_feed', label: '🥣 Bee Feed' },
    { value: 'equipment_repair', label: '🛠️ Equipment/Repair' },
    { value: 'medicines_treatments', label: '💊 Medicines/Treatments' },
    { value: 'labor_salary', label: '💸 Labor/Salary' },
  ];

  const typeColors: Record<string, string> = { box: 'bg-amber-100 text-amber-700', pot: 'bg-emerald-100 text-emerald-700', log: 'bg-orange-100 text-orange-700', stingless: 'bg-blue-100 text-blue-700' };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
  if (!hive) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100"><p>Hive not found</p></div>;

  const cleanHiveNotes = (hive.notes || '').replace(/\[HIVE_METADATA\][\s\S]*$/, '').trim();

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm px-3 py-2 flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-4 h-4 text-stone-700" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-stone-800">{hive.name}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[hive.hive_type] || ''}`}>{hive.hive_type}</span>
          </div>
          <p className="text-xs text-stone-500">{hive.apiary_name || '-'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleStar} className="p-1.5 hover:bg-stone-100 rounded-lg"><Star className={`w-4 h-4 ${hive.is_starred ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} /></button>
          <button onClick={toggleFlag} className="p-1.5 hover:bg-stone-100 rounded-lg"><Flag className={`w-4 h-4 ${hive.is_flagged ? 'text-red-500 fill-red-500' : 'text-stone-400'}`} /></button>
          {onEditHive && (
            <button onClick={handleEditHive} className={`p-1.5 hover:bg-stone-100 rounded-lg relative ${lockInfo?.locked && !lockInfo?.isOwner ? 'opacity-50' : ''}`}
              title={lockInfo?.locked && !lockInfo?.isOwner ? `Being edited by ${lockInfo.lockedByName || 'another user'}` : 'Edit hive'}>
              <Edit2 className="w-4 h-4 text-stone-600" />
              {lockInfo?.locked && !lockInfo?.isOwner && <Lock className="w-2.5 h-2.5 text-red-500 absolute -top-0.5 -right-0.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1.5 pb-24">
        <div className="bg-white rounded-lg p-2.5 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-stone-800">Overview</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-xs text-stone-500">Status</p><p className="font-medium text-sm text-stone-800 capitalize">{hive.status}</p></div>
            <div><p className="text-xs text-stone-500">Type</p><p className="font-medium text-sm text-stone-800 capitalize">{hive.hive_type}</p></div>
            <div><p className="text-xs text-stone-500">Queen</p><p className="font-medium text-sm">{hive.queen_present ? 'Present' : 'Absent'}</p></div>
            <div><p className="text-xs text-stone-500">Strength</p><p className="font-medium text-sm capitalize">{hive.colony_strength || 'N/A'}</p></div>
          </div>
          {hive.gps_latitude && hive.gps_longitude && (
            <div className="pt-2 border-t border-stone-100 flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500">Location</p>
                <p className="font-medium text-sm text-stone-700 font-mono text-[0.7rem] break-all">{hive.gps_latitude.toFixed(6)}, {hive.gps_longitude.toFixed(6)}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-500">Notes</p>
            <p className="text-xs text-stone-600 bg-stone-50 p-1.5 rounded-lg">{cleanHiveNotes || 'No notes'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => document.getElementById('inspection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-white rounded-lg p-2 shadow-sm text-center border border-stone-200 hover:border-amber-300">
            <p className="text-lg font-bold text-amber-600">{inspections.length}</p>
            <p className="text-xs text-stone-500">Inspection</p>
          </button>
          <button type="button" onClick={() => document.getElementById('inspection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className={`rounded-lg p-2 shadow-sm text-center border ${
            inspections.some(i => i.pest_disease_presence?.includes('pest_detected') || i.pest_disease_presence?.includes('under_treatment'))
              ? 'bg-red-50 border-red-300'
              : 'bg-white border-stone-200'
          }`}>
            <p className="text-lg font-bold text-red-600">{inspections.filter(i => i.pest_disease_presence?.includes('pest_detected') || i.pest_disease_presence?.includes('under_treatment')).length}</p>
            <p className="text-xs text-stone-500">🐛 Pest</p>
          </button>
          <button type="button" onClick={() => document.getElementById('expense-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-white rounded-lg p-2 shadow-sm text-center border border-stone-200 hover:border-red-300">
            <p className="text-lg font-bold text-red-600">{expenses.length}</p>
            <p className="text-xs text-stone-500">Expense</p>
          </button>
          <button type="button" onClick={() => document.getElementById('harvest-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-white rounded-lg p-2 shadow-sm text-center border border-stone-200 hover:border-emerald-300">
            <p className="text-lg font-bold text-emerald-600">{harvests.length}</p>
            <p className="text-xs text-stone-500">Harvest</p>
          </button>
          <button type="button" onClick={() => document.getElementById('queen-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-white rounded-lg p-2 shadow-sm text-center border border-stone-200 hover:border-blue-300">
            <p className="text-lg font-bold text-blue-600">{queens.length}</p>
            <p className="text-xs text-stone-500">Queen</p>
          </button>
        </div>

        <div id="inspection-section" className="bg-white rounded-lg p-3 shadow-sm space-y-2.5">
          <h3 className="text-base font-bold text-stone-800 border-b border-amber-200 pb-1.5">Inspection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Date</label>
              <input
                type="date"
                value={quickInspection.inspection_date}
                onChange={(event) => setQuickInspection((current) => ({ ...current, inspection_date: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Time</label>
              <input
                type="time"
                value={quickInspection.inspection_time}
                onChange={(event) => setQuickInspection((current) => ({ ...current, inspection_time: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Queen Presence *</label>
            <select
              value={quickInspection.queen_presence}
              onChange={(event) => setQuickInspection((current) => ({ ...current, queen_presence: event.target.value as QueenPresence }))}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="seen">Seen</option>
              <option value="fresh_eggs">Fresh Eggs Seen</option>
              <option value="not_seen">Not Seen</option>
            </select>
            <p className="mt-0.5 text-xs text-stone-500">Confirm if queen is seen or fresh eggs are present.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Honey/Pollen Stores *</label>
            <select
              value={quickInspection.honey_pollen_stores}
              onChange={(event) => setQuickInspection((current) => ({ ...current, honey_pollen_stores: event.target.value as HoneyPollenStores }))}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="low">Low</option>
              <option value="sufficient">Sufficient</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <p className="block text-xs font-medium text-stone-700 mb-1">Pest/Disease Presence *</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {([
                { key: 'clear', label: 'Clear (No Pests)' },
                { key: 'pest_detected', label: 'Pest Detected' },
                { key: 'under_treatment', label: 'Under Treatment' },
              ] as { key: PestStatus; label: string }[]).map((option) => (
                <label key={option.key} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={quickInspection.pest_statuses.includes(option.key)}
                    onChange={(event) => {
                      setQuickInspection((current) => {
                        if (event.target.checked) {
                          if (option.key === 'clear') {
                            return { ...current, pest_statuses: ['clear'], pest_name: '', treatment_used: '' };
                          }
                          const withoutClear = current.pest_statuses.filter((status) => status !== 'clear');
                          return { ...current, pest_statuses: Array.from(new Set([...withoutClear, option.key])) };
                        }
                        const next = current.pest_statuses.filter((status) => status !== option.key);
                        return { ...current, pest_statuses: next.length > 0 ? next : ['clear'] };
                      });
                    }}
                    className="accent-amber-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {quickInspection.pest_statuses.includes('pest_detected') && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Pest Name</label>
              <input
                value={quickInspection.pest_name}
                onChange={(event) => setQuickInspection((current) => ({ ...current, pest_name: event.target.value }))}
                placeholder="e.g. Varroa, Wax Moth"
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          )}

          {quickInspection.pest_statuses.includes('under_treatment') && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Treatment Used</label>
              <input
                value={quickInspection.treatment_used}
                onChange={(event) => setQuickInspection((current) => ({ ...current, treatment_used: event.target.value }))}
                placeholder="Enter treatment used"
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          )}

          <div>
            <h4 className="text-base font-bold text-stone-900 border-b border-amber-200 pb-1.5">Quick Status Check</h4>
            <p className="text-xs text-stone-700 mt-2 mb-1.5">Colony Strength</p>
            <div className="grid grid-cols-3 gap-0 rounded-lg border border-stone-300 overflow-hidden">
              {(['weak', 'normal', 'strong'] as const).map((strength) => (
                <button
                  key={strength}
                  type="button"
                  onClick={() => setQuickInspection((current) => ({ ...current, colony_strength: strength }))}
                  className={`py-2 text-xs font-semibold capitalize ${quickInspection.colony_strength === strength ? 'bg-blue-500 text-white' : 'bg-white text-stone-700'}`}
                >
                  {strength}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Active Frame Count *</label>
            <input
              type="number"
              min="1"
              value={quickInspection.active_frame_count}
              onChange={(event) => setQuickInspection((current) => ({ ...current, active_frame_count: event.target.value }))}
              placeholder="Number of frames covered by bees"
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            />
            <p className="mt-0.5 text-xs text-stone-500">Use to validate effective bee space management.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Queen Cell Presence</label>
              <select
                value={quickInspection.queen_cell_presence}
                onChange={(event) => setQuickInspection((current) => ({ ...current, queen_cell_presence: event.target.value as OptionalYesNo }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Bottom Board Cleaned</label>
              <select
                value={quickInspection.bottom_board_cleaned}
                onChange={(event) => setQuickInspection((current) => ({ ...current, bottom_board_cleaned: event.target.value as OptionalYesNo }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs text-stone-700">
              <span className="font-semibold">Current pest status:</span>{' '}
              {quickInspection.pest_statuses.join(', ').replace(/_/g, ' ')}
            </div>
            <div className="rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs text-stone-700">
              <span className="font-semibold">Hive pest meter:</span> {hive.pest_detected ? '1' : '0'}
            </div>
          </div>

          <textarea
            value={quickInspection.general_remarks}
            onChange={(event) => setQuickInspection((current) => ({ ...current, general_remarks: event.target.value }))}
            placeholder="General Remarks"
            rows={2}
            className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
          />

          <button onClick={saveQuickInspection} disabled={savingQuickInspection} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-medium disabled:opacity-60 text-sm">
            {savingQuickInspection ? 'Saving...' : 'Save Inspection'}
          </button>
        </div>

        {inspections.length > 0 && (
          <div className="space-y-1.5">
            {inspections.slice(0, 3).map((inspection) => {
              const hasPestDetection = inspection.pest_disease_presence?.includes('pest_detected') || inspection.pest_disease_presence?.includes('under_treatment');
              const pestBgColor = 
                inspection.pest_disease_presence?.includes('under_treatment') ? 'bg-amber-50 border-amber-200' :
                hasPestDetection ? 'bg-red-50 border-red-200' :
                'bg-emerald-50 border-emerald-200';
              const pestTextColor = 
                inspection.pest_disease_presence?.includes('under_treatment') ? 'text-amber-700' :
                hasPestDetection ? 'text-red-700' :
                'text-emerald-700';
              const pestLabel = inspection.pest_disease_presence?.join(' • ') || 'Clear';
              
              return (
                <div key={inspection.id} className={`rounded-lg p-2.5 shadow-sm border ${pestBgColor}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-semibold text-stone-800">{new Date(inspection.inspection_date).toLocaleDateString()}</p>
                      {inspection.pest_name && <p className="text-[0.7rem] text-stone-600 font-medium">Pest: {inspection.pest_name}</p>}
                    </div>
                    <button onClick={() => setShowInspForm(inspection)} className="p-1 text-amber-600 hover:bg-white/50 rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteInspection(inspection.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[0.65rem]">
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700">👑 {inspection.queen_presence?.replace('_', ' ') || 'n/a'}</span>
                    <span className="rounded-full bg-yellow-50 px-1.5 py-0.5 text-yellow-700">🍯 {inspection.honey_pollen_stores || 'n/a'} stores</span>
                    <span className={`rounded-full px-1.5 py-0.5 ${pestTextColor}`}>🐛 {pestLabel.replace(/_/g, ' ')}</span>
                    <span className="rounded-full bg-stone-50 px-1.5 py-0.5 text-stone-700">#️⃣ {inspection.active_frame_count || '0'} frames</span>
                  </div>
                  {inspection.general_remarks && <p className="text-[0.7rem] text-stone-600 mt-1 italic">"{inspection.general_remarks}"</p>}
                </div>
              );
            })}
          </div>
        )}

        <div id="expense-section" className="bg-white rounded-lg p-3 shadow-sm space-y-2.5">
          <h3 className="text-base font-bold text-stone-800 border-b border-red-200 pb-1.5">Expense</h3>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Category</label>
            <select
              value={quickExpense.expense_type}
              onChange={(event) => setQuickExpense((current) => ({ ...current, expense_type: event.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            >
              {expenseCategoryOptions.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Amount</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={quickExpense.amount}
                onChange={(event) => setQuickExpense((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Date</label>
              <input
                type="date"
                value={quickExpense.expense_date}
                onChange={(event) => setQuickExpense((current) => ({ ...current, expense_date: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Note (Optional)</label>
            <input
              value={quickExpense.description}
              onChange={(event) => setQuickExpense((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short note"
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            />
          </div>
          <button onClick={saveQuickExpense} disabled={savingQuickExpense} className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-60 text-sm">
            {savingQuickExpense ? 'Saving...' : 'Save Expense'}
          </button>

          {expenses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="rounded-lg bg-stone-50 p-2 border border-stone-200">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-800">{new Date(expense.expense_date).toLocaleDateString()}</p>
                    <button onClick={() => deleteExpense(expense.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                  <p className="text-xs text-stone-700 capitalize">{expense.expense_type.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-bold text-red-700">LKR {Number(expense.amount).toLocaleString()}</p>
                  {expense.description && <p className="text-xs text-stone-500">{expense.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="harvest-section" className="bg-white rounded-lg p-3 shadow-sm space-y-2.5">
          <h3 className="text-base font-bold text-stone-800 border-b border-emerald-200 pb-1.5">Harvest</h3>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Honey Type</label>
            <input
              value={quickHarvest.harvest_type}
              onChange={(event) => setQuickHarvest((current) => ({ ...current, harvest_type: event.target.value }))}
              placeholder="e.g. Wild flower"
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={quickHarvest.quantity}
                onChange={(event) => setQuickHarvest((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="0.00"
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Unit</label>
              <select
                value={quickHarvest.unit}
                onChange={(event) => setQuickHarvest((current) => ({ ...current, unit: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Harvest Date</label>
            <input
              type="date"
              value={quickHarvest.harvest_date}
              onChange={(event) => setQuickHarvest((current) => ({ ...current, harvest_date: event.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            />
          </div>
          <button onClick={saveQuickHarvest} disabled={savingQuickHarvest} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium disabled:opacity-60 text-sm">
            {savingQuickHarvest ? 'Saving...' : 'Save Harvest'}
          </button>

          {harvests.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {harvests.slice(0, 5).map((harvest) => (
                <div key={harvest.id} className="rounded-lg bg-stone-50 p-2 border border-stone-200">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-800">{new Date(harvest.harvest_date).toLocaleDateString()}</p>
                    <button onClick={() => deleteHarvest(harvest.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                  <p className="text-xs text-stone-700">{harvest.harvest_type}</p>
                  <p className="text-sm font-bold text-emerald-700">{harvest.quantity} {harvest.unit}</p>
                  {harvest.notes && <p className="text-xs text-stone-500">{harvest.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="queen-section" className="bg-white rounded-lg p-3 shadow-sm space-y-2.5">
          <h3 className="text-base font-bold text-stone-800 border-b border-blue-200 pb-1.5">Queen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Introduction Date</label>
              <input
                type="date"
                value={quickQueen.introduction_date}
                onChange={(event) => setQuickQueen((current) => ({ ...current, introduction_date: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-0.5">Queen Type</label>
              <select
                value={quickQueen.queen_type}
                onChange={(event) => setQuickQueen((current) => ({ ...current, queen_type: event.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="local_wild">Local Wild</option>
                <option value="reared">Reared</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Breed and Color</label>
            <input
              value={quickQueen.breed_color}
              onChange={(event) => setQuickQueen((current) => ({ ...current, breed_color: event.target.value }))}
              placeholder="e.g. Apis Cerana - Yellow"
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-0.5">Status</label>
            <select
              value={quickQueen.status}
              onChange={(event) => setQuickQueen((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {quickQueen.status === 'inactive' && (
              <p className="mt-1 text-xs text-amber-700">This will mark the hive queenless. Add a new active queen when available.</p>
            )}
          </div>
          <button onClick={saveQuickQueen} disabled={savingQuickQueen} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-60 text-sm">
            {savingQuickQueen ? 'Saving...' : 'Save Queen'}
          </button>

          {queens.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {queens.slice(0, 5).map((queen) => (
                <div key={queen.id} className="rounded-lg bg-stone-50 p-2 border border-stone-200">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-800">{queen.introduction_date ? new Date(queen.introduction_date).toLocaleDateString() : 'No date'}</p>
                    <button onClick={() => deleteQueen(queen.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                  <p className="text-xs text-stone-700">Type: {queen.source || '-'}</p>
                  <p className="text-xs text-stone-700">Breed/Color: {queen.species || '-'}</p>
                  <p className="text-xs font-medium text-blue-700 capitalize">Status: {queen.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setShowMoveForm(true)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs border border-amber-200">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Move Hive
          </button>
          <button onClick={handleDeleteHive} className="bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs border border-red-200">
            <Trash2 className="w-3.5 h-3.5" /> Delete Hive
          </button>
        </div>

        {showMoveForm && <MoveHiveForm hiveId={hiveId} onClose={() => setShowMoveForm(false)} onSaved={() => { setShowMoveForm(false); fetchHive(); }} />}
        {showInspForm && <InspectionForm hiveId={hiveId} initial={showInspForm === true ? undefined : showInspForm} onClose={() => setShowInspForm(false)} onSaved={() => { setShowInspForm(false); fetchInspections(); }} />}
        {showTreatForm && <TreatmentForm hiveId={hiveId} initial={showTreatForm === true ? undefined : showTreatForm} onClose={() => setShowTreatForm(false)} onSaved={() => { setShowTreatForm(false); fetchTreatments(); fetchExpenses(); }} />}
        {showQueenForm && <QueenForm hiveId={hiveId} initial={showQueenForm === true ? undefined : showQueenForm} onClose={() => setShowQueenForm(false)} onSaved={() => { setShowQueenForm(false); fetchQueens(); }} />}
      </div>
    </div>
  );
}
