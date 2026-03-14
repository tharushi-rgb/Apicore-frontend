import { useEffect, useState } from 'react';
import { Loader2, MapPin, Plus, Save, Trash2, X } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { PageTitleBar } from './PageTitleBar';
import { MapViewer } from './MapViewer';
import { authService } from '../services/auth';
import { apiariesService, type Apiary, type ApiaryForageEntry } from '../services/apiaries';
import {
  PROVINCES,
  getDistrictsByProvince,
  getDsDivisionsByDistrict,
  getDistrictCenter,
} from '../constants/sriLankaLocations';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onClose: () => void; initialApiary?: Apiary; onLogout: () => void;
}

interface ApiaryFormState {
  name: string;
  province: string;
  district: string;
  ds_division: string;
  established_date: string;
  status: string;
  land_ownership: 'owned' | 'not_owned';
  landlord_name: string;
  landlord_contact: string;
  contract_start: string;
  contract_end: string;
  payment_terms: 'cash' | 'honey_share' | 'pollination_service';
  payment_amount_lkr: string;
  honey_share_kgs: string;
  forage_entries: ApiaryForageEntry[];
  gps_latitude: string;
  gps_longitude: string;
  max_hive_capacity: string;
  water_availability: '' | 'On-site' | '<500m' | '>500m (Requires Manual Water)';
  vehicle_accessibility: '' | 'Lorry' | 'Tuk-tuk' | 'Footpath';
  notes: string;
  images: string[];
}

function getInitialForageEntries(initialApiary?: Apiary): ApiaryForageEntry[] {
  if (initialApiary?.forage_entries && initialApiary.forage_entries.length > 0) {
    return initialApiary.forage_entries;
  }
  if (initialApiary?.forage_primary || initialApiary?.blooming_window) {
    return [{
      forageType: initialApiary.forage_primary || '',
      bloomingPeriod: initialApiary.blooming_window || '',
    }];
  }
  return [{ forageType: '', bloomingPeriod: '' }];
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function CreateApiaryScreen({ selectedLanguage, onLanguageChange, onNavigate, onClose, initialApiary, onLogout }: Props) {
  const isEdit = !!initialApiary;
  const user = authService.getLocalUser();
  const initialDistrict = initialApiary?.district || user?.district || '';
  const initialProvince = initialApiary?.province || user?.province || '';
  const initialLocation = initialApiary?.gps_latitude != null && initialApiary?.gps_longitude != null
    ? { lat: initialApiary.gps_latitude, lng: initialApiary.gps_longitude }
    : getDistrictCenter(initialDistrict || user?.district);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(initialLocation);
  const [form, setForm] = useState<ApiaryFormState>({
    name: initialApiary?.name || '',
    province: initialProvince,
    district: initialDistrict,
    ds_division: initialApiary?.ds_division || '',
    established_date: initialApiary?.established_date || '',
    status: initialApiary?.status || 'active',
    land_ownership: initialApiary?.land_ownership || 'owned',
    landlord_name: (initialApiary as any)?.landlord_name || '',
    landlord_contact: (initialApiary as any)?.landlord_contact || '',
    contract_start: (initialApiary as any)?.contract_start || '',
    contract_end: (initialApiary as any)?.contract_end || '',
    payment_terms: initialApiary?.payment_terms || 'cash',
    payment_amount_lkr: initialApiary?.payment_amount_lkr != null ? String(initialApiary.payment_amount_lkr) : '',
    honey_share_kgs: initialApiary?.honey_share_kgs != null ? String(initialApiary.honey_share_kgs) : '',
    forage_entries: getInitialForageEntries(initialApiary),
    gps_latitude: initialApiary?.gps_latitude != null ? String(initialApiary.gps_latitude) : '',
    gps_longitude: initialApiary?.gps_longitude != null ? String(initialApiary.gps_longitude) : '',
    max_hive_capacity: initialApiary?.max_hive_capacity != null ? String(initialApiary.max_hive_capacity) : '',
    water_availability: initialApiary?.water_availability || '',
    vehicle_accessibility: initialApiary?.vehicle_accessibility || '',
    notes: initialApiary?.notes || '',
    images: initialApiary?.images || [],
  });

  const districts = getDistrictsByProvince(form.province);
  const dsDivisions = getDsDivisionsByDistrict(form.district);

  useEffect(() => {
    if (form.province && !districts.includes(form.district)) {
      setForm((current) => ({ ...current, district: '', ds_division: '' }));
    }
  }, [districts, form.district, form.province]);

  useEffect(() => {
    if (form.district && form.ds_division && !dsDivisions.includes(form.ds_division)) {
      setForm((current) => ({ ...current, ds_division: '' }));
    }
  }, [dsDivisions, form.district, form.ds_division]);

  const setField = <K extends keyof ApiaryFormState>(key: K, value: ApiaryFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateForageEntry = (index: number, key: keyof ApiaryForageEntry, value: string) => {
    setForm((current) => ({
      ...current,
      forage_entries: current.forage_entries.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, [key]: value } : entry
      )),
    }));
  };

  const addForageEntry = () => {
    setForm((current) => ({
      ...current,
      forage_entries: [...current.forage_entries, { forageType: '', bloomingPeriod: '' }],
    }));
  };

  const removeForageEntry = (index: number) => {
    setForm((current) => ({
      ...current,
      forage_entries: current.forage_entries.length === 1
        ? [{ forageType: '', bloomingPeriod: '' }]
        : current.forage_entries.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      const imageUrls = await Promise.all(files.map(fileToDataUrl));
      setForm((current) => ({
        ...current,
        images: [...current.images, ...imageUrls],
      }));
      event.target.value = '';
    } catch (uploadError: any) {
      setError(uploadError.message || 'Failed to add image');
    }
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const openMapPicker = () => {
    const nextLocation = form.gps_latitude && form.gps_longitude
      ? { lat: parseFloat(form.gps_latitude), lng: parseFloat(form.gps_longitude) }
      : getDistrictCenter(form.district || user?.district);
    setPendingLocation(nextLocation);
    setShowMapPicker(true);
  };

  const applySelectedLocation = () => {
    setField('gps_latitude', pendingLocation.lat.toFixed(6));
    setField('gps_longitude', pendingLocation.lng.toFixed(6));
    setShowMapPicker(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const hasValidForage = form.forage_entries.some((entry) => entry.forageType.trim());
    if (!form.name.trim() || !form.province || !form.district || !form.ds_division) {
      setError('Apiary name, province, district, and DS division are required');
      return;
    }
    if (!hasValidForage) {
      setError('Add at least one primary forage type');
      return;
    }
    if (form.land_ownership === 'not_owned') {
      if (!form.landlord_name.trim() || !form.landlord_contact.trim() || !form.contract_start || !form.contract_end) {
        setError('Landowner details and contract dates are required for non-owned land');
        return;
      }
      if (form.payment_terms === 'cash' && !form.payment_amount_lkr) {
        setError('Enter the LKR amount for cash payment terms');
        return;
      }
      if (form.payment_terms === 'honey_share' && !form.honey_share_kgs) {
        setError('Enter the honey share yield in kilograms');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        province: form.province,
        district: form.district,
        ds_division: form.ds_division,
        area: form.ds_division,
        established_date: form.established_date,
        status: isEdit ? form.status : undefined,
        land_ownership: form.land_ownership,
        landlord_name: form.landlord_name,
        landlord_contact: form.landlord_contact,
        contract_start: form.contract_start,
        contract_end: form.contract_end,
        payment_terms: form.land_ownership === 'not_owned' ? form.payment_terms : undefined,
        payment_amount_lkr: form.payment_terms === 'cash' ? form.payment_amount_lkr : undefined,
        honey_share_kgs: form.payment_terms === 'honey_share' ? form.honey_share_kgs : undefined,
        forage_entries: form.forage_entries,
        gps_latitude: form.gps_latitude,
        gps_longitude: form.gps_longitude,
        max_hive_capacity: form.max_hive_capacity,
        water_availability: form.water_availability || undefined,
        vehicle_accessibility: form.vehicle_accessibility || undefined,
        notes: form.notes,
        images: form.images,
      };

      if (isEdit && initialApiary) {
        await apiariesService.update(initialApiary.id, payload);
      } else {
        await apiariesService.create(payload);
      }
      onClose();
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to save apiary');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1';
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none bg-white';

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      {showMapPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <div>
                <h2 className="text-base font-bold text-stone-800">Select apiary location</h2>
                <p className="text-xs text-stone-500 mt-0.5">Tap the map and then confirm the selected point.</p>
              </div>
              <button onClick={() => setShowMapPicker(false)} className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200">
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <MapViewer
                lat={pendingLocation.lat}
                lng={pendingLocation.lng}
                district={form.district || user?.district}
                editable
                onLocationSelect={(lat, lng) => setPendingLocation({ lat, lng })}
              />
            </div>
            <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <div className="text-xs text-stone-500">
                {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMapPicker(false)} className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium">
                  Cancel
                </button>
                <button type="button" onClick={applySelectedLocation} className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium">
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-0 z-30 shrink-0">
        <MobileHeader
          userName={user?.name}
          roleLabel={user?.role}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="apiaries"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
        />
        <PageTitleBar
          title={isEdit ? 'Edit Apiary' : 'Create Apiary'}
          subtitle="Apiary details, forage, and location"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit} className="px-4 py-6 pb-24 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className={labelClass}>Apiary Name *</label>
            <input value={form.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Province *</label>
              <select value={form.province} onChange={(event) => setField('province', event.target.value)} className={inputClass}>
                <option value="">Select province</option>
                {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>District *</label>
              <select value={form.district} onChange={(event) => setField('district', event.target.value)} className={inputClass}>
                <option value="">Select district</option>
                {districts.map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>DS Division *</label>
            <select value={form.ds_division} onChange={(event) => setField('ds_division', event.target.value)} className={inputClass}>
              <option value="">Select DS division</option>
              {dsDivisions.map((dsDivision) => <option key={dsDivision} value={dsDivision}>{dsDivision}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Established Date</label>
            <input type="date" value={form.established_date} onChange={(event) => setField('established_date', event.target.value)} className={inputClass} />
          </div>

          {isEdit && (
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
            <p className="text-sm font-semibold text-stone-800">Land ownership</p>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="land_ownership"
                  checked={form.land_ownership === 'owned'}
                  onChange={() => setField('land_ownership', 'owned')}
                  className="accent-amber-500"
                />
                Own land
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="land_ownership"
                  checked={form.land_ownership === 'not_owned'}
                  onChange={() => setField('land_ownership', 'not_owned')}
                  className="accent-amber-500"
                />
                Not owned
              </label>
            </div>
          </div>

          {form.land_ownership === 'not_owned' && (
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Landowner and contract details</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Landowner Name *</label>
                  <input value={form.landlord_name} onChange={(event) => setField('landlord_name', event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Number *</label>
                  <input value={form.landlord_contact} onChange={(event) => setField('landlord_contact', event.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Contract Start *</label>
                  <input type="date" value={form.contract_start} onChange={(event) => setField('contract_start', event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contract End *</label>
                  <input type="date" value={form.contract_end} onChange={(event) => setField('contract_end', event.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Payment Terms</label>
                <select value={form.payment_terms} onChange={(event) => setField('payment_terms', event.target.value as ApiaryFormState['payment_terms'])} className={inputClass}>
                  <option value="cash">Cash</option>
                  <option value="honey_share">Honey Share</option>
                  <option value="pollination_service">Pollination Service</option>
                </select>
              </div>
              {form.payment_terms === 'cash' && (
                <div>
                  <label className={labelClass}>LKR Amount</label>
                  <input type="number" min="0" value={form.payment_amount_lkr} onChange={(event) => setField('payment_amount_lkr', event.target.value)} className={inputClass} />
                </div>
              )}
              {form.payment_terms === 'honey_share' && (
                <div>
                  <label className={labelClass}>Yield (kg)</label>
                  <input type="number" min="0" step="0.1" value={form.honey_share_kgs} onChange={(event) => setField('honey_share_kgs', event.target.value)} className={inputClass} />
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">Primary forage type</p>
                <p className="text-xs text-stone-500 mt-0.5">Add one or more forage sources with their blooming period.</p>
              </div>
              <button type="button" onClick={addForageEntry} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
                <Plus className="w-4 h-4" /> Add option
              </button>
            </div>
            <div className="space-y-3">
              {form.forage_entries.map((entry, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input
                    value={entry.forageType}
                    onChange={(event) => updateForageEntry(index, 'forageType', event.target.value)}
                    placeholder="Forage type"
                    className={inputClass}
                  />
                  <input
                    value={entry.bloomingPeriod}
                    onChange={(event) => updateForageEntry(index, 'bloomingPeriod', event.target.value)}
                    placeholder="Blooming period"
                    className={inputClass}
                  />
                  <button type="button" onClick={() => removeForageEntry(index)} className="sm:self-center px-3 py-2.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Max Hive Capacity</label>
              <input type="number" min="0" value={form.max_hive_capacity} onChange={(event) => setField('max_hive_capacity', event.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Water Availability</label>
              <select value={form.water_availability} onChange={(event) => setField('water_availability', event.target.value as ApiaryFormState['water_availability'])} className={inputClass}>
                <option value="">Select water availability</option>
                <option value="On-site">On-site</option>
                <option value="<500m">&lt;500m</option>
                <option value=">500m (Requires Manual Water)">&gt;500m (Requires Manual Water)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Vehicle Accessibility</label>
            <select value={form.vehicle_accessibility} onChange={(event) => setField('vehicle_accessibility', event.target.value as ApiaryFormState['vehicle_accessibility'])} className={inputClass}>
              <option value="">Select accessibility</option>
              <option value="Lorry">Lorry</option>
              <option value="Tuk-tuk">Tuk-tuk</option>
              <option value="Footpath">Footpath</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-stone-800">Location</label>
              <button type="button" onClick={openMapPicker} className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                Select location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.gps_latitude} readOnly placeholder="Latitude" className={`${inputClass} bg-stone-50`} />
              <input value={form.gps_longitude} readOnly placeholder="Longitude" className={`${inputClass} bg-stone-50`} />
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Default map view opens around the registered district.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">Images</p>
                <p className="text-xs text-stone-500 mt-0.5">Add reference photos for the apiary.</p>
              </div>
              <label className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 cursor-pointer hover:text-emerald-800">
                <Plus className="w-4 h-4" /> Add
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 aspect-square">
                    <img src={image} alt={`Apiary ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-stone-700 shadow-sm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No images added yet.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} className={inputClass} />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {isEdit ? 'Update Apiary' : 'Create Apiary'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
