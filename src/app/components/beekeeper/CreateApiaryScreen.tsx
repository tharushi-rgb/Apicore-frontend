import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { LocationSelectorField } from '../shared/LocationSelectorField';
import { AdministrativeLocationFields } from '../shared/AdministrativeLocationFields';
import { authService } from '../../services/auth';
import { apiariesService, type Apiary, type ApiaryForageEntry } from '../../services/apiaries';
import { hivesService } from '../../services/hives';
import { haversineKm } from '../../services/planning';
import { t } from '../../i18n';
import {
  getDistrictsByProvince,
  getDsDivisionsByDistrict,
} from '../../constants/sriLankaLocations';

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

function buildApiaryFormState(initialApiary?: Apiary, user?: { district?: string; province?: string } | null): ApiaryFormState {
  return {
    name: initialApiary?.name || '',
    province: initialApiary?.province || user?.province || '',
    district: initialApiary?.district || user?.district || '',
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
  };
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

function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
}

function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  // Accept 9-12 digits for Sri Lankan format (+94 XXXXXXXXX)
  return cleaned.length >= 9 && cleaned.length <= 12;
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
  const location = useLocation();
  const proposalPrefill = (location.state as any)?.prefillApiary as {
    plotName?: string;
    district?: string;
    dsDivision?: string;
    moveInDate?: string;
    moveOutDate?: string;
    hiveCount?: number;
  } | undefined;
  const user = authService.getLocalUser();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allApiaries, setAllApiaries] = useState<Apiary[]>([]);
  const [nearbyWarning, setNearbyWarning] = useState('');
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [form, setForm] = useState<ApiaryFormState>(() => {
    const base = buildApiaryFormState(initialApiary, user);
    if (!proposalPrefill || isEdit) return base;
    return {
      ...base,
      name: proposalPrefill.plotName || base.name,
      district: proposalPrefill.district || base.district,
      ds_division: proposalPrefill.dsDivision || base.ds_division,
      contract_start: proposalPrefill.moveInDate || base.contract_start,
      contract_end: proposalPrefill.moveOutDate || base.contract_end,
      max_hive_capacity: proposalPrefill.hiveCount != null ? String(proposalPrefill.hiveCount) : base.max_hive_capacity,
      land_ownership: 'not_owned',
    };
  });

  useEffect(() => {
    if (!initialApiary?.id) return;
    let active = true;
    apiariesService.getById(initialApiary.id)
      .then((apiary) => {
        if (active) setForm(buildApiaryFormState(apiary, user));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialApiary?.id, user?.district, user?.province]);

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

  useEffect(() => { apiariesService.getAll().then(setAllApiaries).catch(() => {}); }, []);

  useEffect(() => {
    const lat = parseFloat(form.gps_latitude);
    const lng = parseFloat(form.gps_longitude);
    if (isNaN(lat) || isNaN(lng)) { setNearbyWarning(''); return; }
    const NEARBY_KM = 0.5;
    const nearby = allApiaries.find((a) => {
      if (a.gps_latitude == null || a.gps_longitude == null) return false;
      if (isEdit && a.id === initialApiary?.id) return false;
      return haversineKm(lat, lng, a.gps_latitude, a.gps_longitude) <= NEARBY_KM;
    });
    setNearbyWarning(nearby ? t('nearbyApiaryWarning', selectedLanguage) : '');
  }, [form.gps_latitude, form.gps_longitude, allApiaries, isEdit, initialApiary, selectedLanguage]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const hasValidForage = form.forage_entries.some((entry) => entry.forageType.trim());
    const hasAdministrativeLocation = Boolean(form.province && form.district && form.ds_division);
    const hasPinnedLocation = Boolean(form.gps_latitude && form.gps_longitude);
    if (!form.name.trim()) {
      setError('Apiary name is required');
      return;
    }
    if (!hasAdministrativeLocation && !hasPinnedLocation) {
      setError('Provide province, district, and DS division or pin the location on the map');
      return;
    }
    if (!hasValidForage) {
      setError('Add at least one primary forage type');
      return;
    }
    
    // Validate status change to 'inactive'
    if (isEdit && initialApiary && form.status === 'inactive' && initialApiary.status !== 'inactive') {
      // Check if there are active hives linked to this apiary
      try {
        const allHives = await hivesService.getAll();
        const activeHives = allHives.filter((h: any) => h.apiary_id === initialApiary.id && h.status === 'active');
        
        if (activeHives.length > 0) {
          setError(`Cannot mark apiary as inactive. There are ${activeHives.length} active hive(s) linked to this apiary. Please move or deactivate the hives first.`);
          setSaving(false);
          return;
        }
      } catch (err) {
        setError('Failed to verify hives for this apiary');
        setSaving(false);
        return;
      }
    }
    
    if (form.land_ownership === 'not_owned') {
      if (!form.landlord_name.trim() || !form.landlord_contact.trim() || !form.contract_start || !form.contract_end) {
        setError('Landowner details and contract dates are required for non-owned land');
        return;
      }
      if (!isValidPhoneNumber(form.landlord_contact)) {
        setError('Enter a valid phone number (+94 format, 9-12 digits)');
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

          <AdministrativeLocationFields
            province={form.province}
            district={form.district}
            dsDivision={form.ds_division}
            onProvinceChange={(value) => setField('province', value)}
            onDistrictChange={(value) => setField('district', value)}
            onDsDivisionChange={(value) => setField('ds_division', value)}
          />

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
              {form.status === 'inactive' && (
                <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 px-2 py-1.5 rounded">⚠️ Marking as inactive will hide all linked hives. Ensure all hives are moved or deactivated first.</p>
              )}
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
                  <input 
                    value={form.landlord_contact} 
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setField('landlord_contact', formatted);
                      if (formatted) {
                        const cleaned = formatted.replace(/\D/g, '');
                        setPhoneValidationError(cleaned.length === 12 && isValidPhoneNumber(formatted) ? '' : '');
                      }
                    }} 
                    placeholder="94 77 456 7890"
                    maxLength={15}
                    className={`${inputClass} ${phoneValidationError ? 'border-red-500 bg-red-50/30' : ''}`}
                  />
                  {phoneValidationError && (
                    <p className="text-xs text-red-600 mt-1">{phoneValidationError}</p>
                  )}
                  {!phoneValidationError && form.landlord_contact && (
                    <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
                  )}
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

          {nearbyWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{nearbyWarning}</span>
            </div>
          )}
          <LocationSelectorField
            label="Location / GPS"
            district={form.district || user?.district}
            latitude={form.gps_latitude}
            longitude={form.gps_longitude}
            onChange={(latitude, longitude) => {
              setField('gps_latitude', latitude);
              setField('gps_longitude', longitude);
            }}
            helperText="Pin the location on the map, or use province, district, and DS division above."
          />

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
