import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Save, Loader2 } from 'lucide-react';
import { apiariesService, type Apiary } from '../services/apiaries';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onClose: () => void; initialApiary?: Apiary; onLogout: () => void;
}

const SRI_LANKA_DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Mullaitivu','Vavuniya','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];

export function CreateApiaryScreen({ onClose, initialApiary, onLogout }: Props) {
  const isEdit = !!initialApiary;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initialApiary?.name || '', district: initialApiary?.district || '', area: initialApiary?.area || '',
    established_date: initialApiary?.established_date || '', status: initialApiary?.status || 'active',
    terrain: initialApiary?.terrain || '', forage_primary: initialApiary?.forage_primary || '',
    gps_latitude: initialApiary?.gps_latitude?.toString() || '', gps_longitude: initialApiary?.gps_longitude?.toString() || '', notes: initialApiary?.notes || '',
    // Client/Personal toggle (R5.4/R5.5)
    apiary_type: (initialApiary as any)?.apiary_type || 'personal',
    client_name: (initialApiary as any)?.client_name || '',
    client_contact: (initialApiary as any)?.client_contact || '',
    contract_start: (initialApiary as any)?.contract_start || '',
    contract_end: (initialApiary as any)?.contract_end || '',
    landlord_name: (initialApiary as any)?.landlord_name || '',
    landlord_contact: (initialApiary as any)?.landlord_contact || '',
    rental_fee: (initialApiary as any)?.rental_fee?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.district) { setError('Name and District are required'); return; }
    setSaving(true); setError('');
    try {
      const data: any = { ...form, gps_latitude: form.gps_latitude ? parseFloat(form.gps_latitude) : null, gps_longitude: form.gps_longitude ? parseFloat(form.gps_longitude) : null };
      if (isEdit && initialApiary) { await apiariesService.update(initialApiary.id, data); }
      else { await apiariesService.create(data); }
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
        <h1 className="text-lg font-bold text-stone-800">{isEdit ? 'Edit Apiary' : 'Create Apiary'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(p=>({...p, name: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>

        {/* Client / Personal Toggle (R5.4/R5.5/R5.6) */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
          <label className="text-sm font-medium text-stone-700">Apiary Type</label>
          <div className="flex rounded-xl overflow-hidden border border-stone-200">
            <button type="button" onClick={() => setForm(p=>({...p, apiary_type: 'personal'}))} className={`flex-1 py-2.5 text-sm font-medium ${form.apiary_type === 'personal' ? 'bg-amber-500 text-white' : 'bg-stone-50 text-stone-600'}`}>🏠 Personal</button>
            <button type="button" onClick={() => setForm(p=>({...p, apiary_type: 'client'}))} className={`flex-1 py-2.5 text-sm font-medium ${form.apiary_type === 'client' ? 'bg-blue-500 text-white' : 'bg-stone-50 text-stone-600'}`}>🤝 Client</button>
          </div>
        </div>

        {form.apiary_type === 'client' && (
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
            <h3 className="text-sm font-semibold text-blue-700">Client & Contract Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Client Name</label>
                <input value={form.client_name} onChange={e => setForm(p=>({...p, client_name: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Client Contact</label>
                <input value={form.client_contact} onChange={e => setForm(p=>({...p, client_contact: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Landlord Name</label>
              <input value={form.landlord_name} onChange={e => setForm(p=>({...p, landlord_name: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Landlord Contact</label>
              <input value={form.landlord_contact} onChange={e => setForm(p=>({...p, landlord_contact: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Contract Start</label>
                <input type="date" value={form.contract_start} onChange={e => setForm(p=>({...p, contract_start: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-stone-600 mb-1">Contract End</label>
                <input type="date" value={form.contract_end} onChange={e => setForm(p=>({...p, contract_end: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
            </div>
            <div><label className="block text-xs font-medium text-stone-600 mb-1">Monthly Rental Fee (LKR)</label>
              <input type="number" value={form.rental_fee} onChange={e => setForm(p=>({...p, rental_fee: e.target.value}))} placeholder="0.00" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" /></div>
          </div>
        )}

        <div><label className="block text-sm font-medium text-stone-700 mb-1">District *</label>
          <select value={form.district} onChange={e => setForm(p=>({...p, district: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Select district</option>{SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Area / Village</label>
          <input value={form.area} onChange={e => setForm(p=>({...p, area: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Established Date</label>
          <input type="date" value={form.established_date} onChange={e => setForm(p=>({...p, established_date: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>

        <div><label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(p=>({...p, status: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-stone-700 mb-1">Terrain</label>
            <input value={form.terrain} onChange={e => setForm(p=>({...p, terrain: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-stone-700 mb-1">Primary Forage</label>
            <input value={form.forage_primary} onChange={e => setForm(p=>({...p, forage_primary: e.target.value}))} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none" /></div>
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
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {isEdit ? 'Update Apiary' : 'Create Apiary'}</>}
        </button>
      </form>
    </div>
  );
}
