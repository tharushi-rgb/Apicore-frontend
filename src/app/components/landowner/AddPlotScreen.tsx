import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { LocationSelectorField } from '../shared/LocationSelectorField';
import { landownerPlotsService, type LandPlot, type ForageEntry, type WaterAvailability, type ShadeProfile, type VehicleAccess } from '../../services/landownerPlotsService';
import { getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'plots' | 'listings' | 'bids' | 'contracts' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onSave: () => void;
  existingPlot?: LandPlot;
  onLogout: () => void;
}

interface FormState {
  name: string;
  province: string;
  district: string;
  ds_division: string;
  gps_latitude: string;
  gps_longitude: string;
  total_acreage: string;
  forageEntries: ForageEntry[];
  water_availability: WaterAvailability;
  shade_profile: ShadeProfile;
  vehicle_access: VehicleAccess;
  night_access: boolean;
  images: string[];
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function AddPlotScreen({
  selectedLanguage,
  onLanguageChange,
  onNavigate,
  onBack,
  onSave,
  existingPlot,
  onLogout,
}: Props) {
  const [form, setForm] = useState<FormState>({
    name: existingPlot?.name || '',
    province: existingPlot?.province || '',
    district: existingPlot?.district || '',
    ds_division: existingPlot?.ds_division || '',
    gps_latitude: existingPlot?.gps_latitude?.toString() || '',
    gps_longitude: existingPlot?.gps_longitude?.toString() || '',
    total_acreage: existingPlot?.total_acreage?.toString() || '',
    forageEntries: existingPlot?.forage_entries || [],
    water_availability: existingPlot?.water_availability || 'On-site',
    shade_profile: existingPlot?.shade_profile || 'Partial Shade',
    vehicle_access: existingPlot?.vehicle_access || 'Lorry',
    night_access: existingPlot?.night_access || false,
    images: existingPlot?.images || [],
  });

  const [forageInput, setForageInput] = useState({
    name: '',
    bloomStartMonth: '',
    bloomEndMonth: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const districts = form.province ? getDistrictsByProvince(form.province) : [];
  const dsDivisions = form.district ? getDsDivisionsByDistrict(form.district) : [];

  const handleInputChange = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'province') {
      setForm(prev => ({ ...prev, district: '', ds_division: '' }));
    }
    if (field === 'district') {
      setForm(prev => ({ ...prev, ds_division: '' }));
    }
  };

  const handleAddForage = () => {
    if (!forageInput.name || !forageInput.bloomStartMonth || !forageInput.bloomEndMonth) {
      setError('Please fill in forage name and blooming period');
      return;
    }

    setForm(prev => ({
      ...prev,
      forageEntries: [...prev.forageEntries, forageInput]
    }));

    setForageInput({ name: '', bloomStartMonth: '', bloomEndMonth: '' });
    setError(null);
  };

  const handleRemoveForage = (index: number) => {
    setForm(prev => ({
      ...prev,
      forageEntries: prev.forageEntries.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setImageError(null);
      // For now, just create data URLs for images
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setImageError('Image must be less than 5MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setForm(prev => ({
            ...prev,
            images: [...prev.images, dataUrl]
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Plot name is required';
    if (!form.province) return 'Province is required';
    if (!form.district) return 'District is required';
    if (!form.ds_division) return 'DS Division is required';
    if (!form.gps_latitude || !form.gps_longitude) return 'GPS coordinates are required';
    if (!form.total_acreage || parseFloat(form.total_acreage) <= 0) return 'Total acreage must be greater than 0';
    if (form.forageEntries.length === 0) return 'At least one forage entry is required';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        province: form.province,
        district: form.district,
        ds_division: form.ds_division,
        gps_latitude: parseFloat(form.gps_latitude),
        gps_longitude: parseFloat(form.gps_longitude),
        total_acreage: parseFloat(form.total_acreage),
        forage_entries: form.forageEntries,
        water_availability: form.water_availability,
        shade_profile: form.shade_profile,
        vehicle_access: form.vehicle_access,
        night_access: form.night_access,
        images: form.images,
      };

      if (existingPlot) {
        await landownerPlotsService.updatePlot(existingPlot.id, payload);
      } else {
        await landownerPlotsService.createPlot(payload);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm px-3 py-2 flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 hover:bg-stone-100 rounded-lg">
          <ArrowLeft className="w-4 h-4 text-stone-700" />
        </button>
        <h1 className="text-base font-bold text-stone-800 flex-1">
          {existingPlot ? 'Edit Plot' : 'Add New Plot'}
        </h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 pb-24">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Plot Name */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block mb-2">
            Plot Name
          </label>
          <input
            type="text"
            placeholder="e.g., North Coconut Grove"
            value={form.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Location Selection */}
        <LocationSelectorField
          province={form.province}
          district={form.district}
          dsDivision={form.ds_division}
          onProvinceChange={val => handleInputChange('province', val)}
          onDistrictChange={val => handleInputChange('district', val)}
          onDsDivisionChange={val => handleInputChange('ds_division', val)}
          selectedLanguage={selectedLanguage}
        />

        {/* GPS Coordinates */}
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block">
            GPS Coordinates
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.0001"
              placeholder="Latitude"
              value={form.gps_latitude}
              onChange={e => handleInputChange('gps_latitude', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Longitude"
              value={form.gps_longitude}
              onChange={e => handleInputChange('gps_longitude', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Total Acreage */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block mb-2">
            Total Acreage
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g., 8.5"
            value={form.total_acreage}
            onChange={e => handleInputChange('total_acreage', e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Primary Forage Sources */}
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block">
            Primary Forage Sources
          </label>

          {form.forageEntries.length > 0 && (
            <div className="space-y-2">
              {form.forageEntries.map((forage, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-900">{forage.name}</p>
                    <p className="text-xs text-emerald-700">
                      {forage.bloomStartMonth} - {forage.bloomEndMonth}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveForage(idx)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-stone-200">
            <input
              type="text"
              placeholder="Forage name (e.g., Coconut Palm)"
              value={forageInput.name}
              onChange={e => setForageInput(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={forageInput.bloomStartMonth}
                onChange={e => setForageInput(prev => ({ ...prev, bloomStartMonth: e.target.value }))}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Start Month</option>
                {MONTHS.map(month => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={forageInput.bloomEndMonth}
                onChange={e => setForageInput(prev => ({ ...prev, bloomEndMonth: e.target.value }))}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">End Month</option>
                {MONTHS.map(month => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddForage}
              className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Forage
            </button>
          </div>
        </div>

        {/* Water Availability */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block mb-2">
            Water Availability
          </label>
          <select
            value={form.water_availability}
            onChange={e => handleInputChange('water_availability', e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="On-site">On-site</option>
            <option value="Within 500m">Within 500m</option>
            <option value="Requires Manual Water">Requires Manual Water</option>
          </select>
        </div>

        {/* Shade Profile */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block mb-2">
            Shade Profile
          </label>
          <select
            value={form.shade_profile}
            onChange={e => handleInputChange('shade_profile', e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Full Shade">Full Shade</option>
            <option value="Partial Shade">Partial Shade</option>
            <option value="Full Sun">Full Sun</option>
          </select>
        </div>

        {/* Vehicle Access */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block mb-2">
            Vehicle Access
          </label>
          <select
            value={form.vehicle_access}
            onChange={e => handleInputChange('vehicle_access', e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Lorry">Lorry</option>
            <option value="Tuk-tuk">Tuk-tuk</option>
            <option value="Footpath">Footpath</option>
          </select>
        </div>

        {/* Night Access */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.night_access}
              onChange={e => handleInputChange('night_access', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <span className="text-sm font-semibold text-stone-700">
              Can beekeeper access the land at night?
            </span>
          </label>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-widest block">
            Images
          </label>

          {imageError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
              {imageError}
            </div>
          )}

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((image, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border-2 border-stone-200">
                  <img src={image} alt={`Plot ${idx + 1}`} className="w-full h-24 object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block">
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center cursor-pointer hover:bg-amber-50 transition-colors">
              <p className="text-sm text-stone-600 font-medium">Click to upload images</p>
              <p className="text-xs text-stone-500">Max 5MB each</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white border-t border-stone-200 px-3 py-3 flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Plot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
