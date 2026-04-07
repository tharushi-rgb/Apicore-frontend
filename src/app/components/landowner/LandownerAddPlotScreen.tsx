import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarRange, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { LocationSelectorField } from '../shared/LocationSelectorField';
import { authService } from '../../services/auth';
import { t } from '../../i18n';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';
import { landownerMarketplaceService } from '../../services/landownerMarketplace';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  onBack: () => void;
  onSaved: () => void;
}

interface ForageEntry {
  forage: string;
  bloomStartMonth: string;
  bloomEndMonth: string;
}

const WATER_OPTIONS = [
  'On-site',
  'Within 500m',
  'Requires Manual Water',
] as const;

const VEHICLE_OPTIONS = ['Lorry', 'Tuk-tuk', 'Footpath'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function LandownerAddPlotScreen({
  selectedLanguage,
  onLanguageChange,
  onNavigate,
  onLogout,
  onBack,
  onSaved,
}: Props) {
  const user = authService.getLocalUser();

  const [plotName, setPlotName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [dsDivision, setDsDivision] = useState('');
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [totalAcreage, setTotalAcreage] = useState('');
  const [waterAvailability, setWaterAvailability] = useState('On-site');
  const [shadeProfile] = useState('Partial Shade');
  const [vehicleAccess, setVehicleAccess] = useState('Lorry');
  const [nightAccess, setNightAccess] = useState<boolean | null>(null);
  const [forageEntries, setForageEntries] = useState<ForageEntry[]>([{ forage: '', bloomStartMonth: '', bloomEndMonth: '' }]);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const districts = useMemo(() => getDistrictsByProvince(province), [province]);
  const dsDivisions = useMemo(() => getDsDivisionsByDistrict(district), [district]);

  const setProvinceAndReset = (value: string) => {
    setProvince(value);
    setDistrict('');
    setDsDivision('');
  };

  const setDistrictAndReset = (value: string) => {
    setDistrict(value);
    setDsDivision('');
  };

  const updateForage = (index: number, key: keyof ForageEntry, value: string) => {
    setForageEntries((current) => (
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry))
    ));
  };

  const addForage = () => {
    setForageEntries((current) => [...current, { forage: '', bloomStartMonth: '', bloomEndMonth: '' }]);
  };

  const removeForage = (index: number) => {
    setForageEntries((current) => (
      current.length === 1 ? [{ forage: '', bloomStartMonth: '', bloomEndMonth: '' }] : current.filter((_, entryIndex) => entryIndex !== index)
    ));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setImages((current) => [...current, ...files.map((file) => file.name)]);
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!plotName.trim()) {
      setError('Land/Plot name is required');
      return;
    }

    if (!province || !district || !dsDivision) {
      setError('Select province, district, and DS division');
      return;
    }

    if (!gpsLatitude.trim() || !gpsLongitude.trim()) {
      setError(t('gpsCoordinatesRequired', selectedLanguage));
      return;
    }

    if (!totalAcreage.trim()) {
      setError('Total acreage is required');
      return;
    }

    const acreageNumber = Number(totalAcreage);
    if (!Number.isFinite(acreageNumber) || acreageNumber <= 0) {
      setError('Total acreage must be a valid positive number');
      return;
    }

    const validForageEntries = forageEntries.filter(
      (entry) => entry.forage.trim() && entry.bloomStartMonth && entry.bloomEndMonth,
    );
    if (validForageEntries.length === 0) {
      setError('Add at least one forage entry with bloom start and end month');
      return;
    }

    if (!waterAvailability || !vehicleAccess) {
      setError('Water availability and vehicle access selections are required');
      return;
    }

    if (nightAccess === null) {
      setError('Select Yes or No for night access');
      return;
    }

    try {
      landownerMarketplaceService.createPlot({
        name: plotName.trim(),
        province,
        district,
        dsDivision,
        gpsLatitude: Number(gpsLatitude),
        gpsLongitude: Number(gpsLongitude),
        totalAcreage: acreageNumber,
        forageEntries: validForageEntries.map((entry) => ({
          name: entry.forage.trim(),
          bloomStartMonth: entry.bloomStartMonth,
          bloomEndMonth: entry.bloomEndMonth,
        })),
        waterAvailability: waterAvailability as any,
        shadeProfile: shadeProfile as any,
        vehicleAccess: vehicleAccess as any,
        nightAccess,
        images,
      });
      setSuccess('Land plot saved successfully');
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to save land plot');
      return;
    }

    setTimeout(() => onSaved(), 450);
  };

  return (
    <div className="h-[100dvh] bg-stone-50 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm">
        <MobileHeader
          userName={user?.name}
          roleLabel="landowner"
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="clients"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
          role="landowner"
          theme="green"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-white px-3 py-2 text-[0.8rem] font-semibold text-emerald-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-1.5">
          <div className="rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm">
            <h1 className="text-[0.95rem] font-bold text-stone-900">{t('registerNewLandPlot', selectedLanguage)}</h1>
            <p className="mt-0.5 text-[0.75rem] text-stone-600">Provinces: 9 · Districts: 25 · DS Divisions: 331</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm space-y-1.5">
            <div>
              <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">{t('landPlotNameRequired', selectedLanguage)}</label>
              <input
                value={plotName}
                onChange={(event) => setPlotName(event.target.value)}
                placeholder="e.g. Hillside Rubber Block"
                className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <div>
                <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">Province *</label>
                <select
                  value={province}
                  onChange={(event) => setProvinceAndReset(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">District *</label>
                <select
                  value={district}
                  onChange={(event) => setDistrictAndReset(event.target.value)}
                  disabled={!province}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none disabled:bg-stone-100"
                >
                  <option value="">Select district</option>
                  {districts.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">DS Division *</label>
                <select
                  value={dsDivision}
                  onChange={(event) => setDsDivision(event.target.value)}
                  disabled={!district}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none disabled:bg-stone-100"
                >
                  <option value="">Select DS division</option>
                  {dsDivisions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <LocationSelectorField
              label={t('gpsCoordinates', selectedLanguage)}
              district={district}
              latitude={gpsLatitude}
              longitude={gpsLongitude}
              onChange={(latitude, longitude) => {
                setGpsLatitude(latitude);
                setGpsLongitude(longitude);
              }}
            />

            <div>
              <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">{t('totalAcreageRequired', selectedLanguage)}</label>
              <input
                value={totalAcreage}
                onChange={(event) => setTotalAcreage(event.target.value)}
                placeholder={t('acreageExample', selectedLanguage)}
                className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">{t('primaryForageSourcesLabel', selectedLanguage)} *</p>
              <button type="button" onClick={addForage} className="inline-flex items-center gap-1 rounded-full border border-emerald-700 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800">
                <Plus className="h-3 w-3" />
                {t('add', selectedLanguage)}
              </button>
            </div>

            {forageEntries.map((entry, index) => (
              <div key={`forage-${index}`} className="rounded-lg border border-stone-200 bg-stone-50 p-2 space-y-1.5">
                {/* Row 1: Forage name and Delete button */}
                <div className="grid grid-cols-[1fr_auto] gap-1.5">
                  <input
                    value={entry.forage}
                    onChange={(event) => updateForage(index, 'forage', event.target.value)}
                    placeholder="Forage name"
                    className="rounded-md border border-stone-300 px-2 py-2 text-[0.8rem] focus:border-emerald-600 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => removeForage(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                    aria-label="Remove forage"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Row 2: Start month and End month */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <CalendarRange className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
                    <select
                      value={entry.bloomStartMonth}
                      onChange={(event) => updateForage(index, 'bloomStartMonth', event.target.value)}
                      className="w-full rounded-md border border-stone-300 py-2 pl-6 pr-2 text-[0.8rem] focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="">Start month</option>
                      {MONTHS.map((month) => (
                        <option key={`start-${month}`} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={entry.bloomEndMonth}
                    onChange={(event) => updateForage(index, 'bloomEndMonth', event.target.value)}
                    className="rounded-md border border-stone-300 px-2 py-2 text-[0.8rem] focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">End month</option>
                    {MONTHS.map((month) => (
                      <option key={`end-${month}`} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm space-y-1.5">
            <div className="grid grid-cols-1 gap-1.5">
              <div>
                <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">Water Availability *</label>
                <select value={waterAvailability} onChange={(event) => setWaterAvailability(event.target.value)} className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none">
                  {WATER_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">Vehicle Access *</label>
                <select value={vehicleAccess} onChange={(event) => setVehicleAccess(event.target.value)} className="w-full rounded-lg border border-stone-300 px-2.5 py-2.5 text-[0.88rem] focus:border-emerald-600 focus:outline-none">
                  {VEHICLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2">
              <div>
                <p className="text-[0.78rem] font-semibold text-stone-800">Night Access</p>
                <p className="text-[0.7rem] text-stone-500">Can beekeeper access at night?</p>
              </div>
              <div className="inline-flex rounded-full border border-stone-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setNightAccess(true)}
                  className={`rounded-full px-2 py-1 text-[0.7rem] font-semibold ${nightAccess === true ? 'bg-emerald-600 text-white' : 'text-stone-600'}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setNightAccess(false)}
                  className={`rounded-full px-2 py-1 text-[0.7rem] font-semibold ${nightAccess === false ? 'bg-emerald-600 text-white' : 'text-stone-600'}`}
                >
                  No
                </button>
              </div>
            </label>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm">
            <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-stone-600">Add Images</label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-emerald-700 px-2.5 py-1.5 text-[0.75rem] font-semibold text-emerald-800">
              <ImagePlus className="h-3 w-3" />
              Choose Images
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>

            {images.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {images.map((imageName, index) => (
                  <div key={`${imageName}-${index}`} className="flex items-center justify-between rounded-md bg-stone-100 px-2 py-1.5">
                    <span className="truncate text-[0.75rem] text-stone-700">{imageName}</span>
                    <button type="button" onClick={() => removeImage(index)} className="rounded-md p-0.5 text-red-600 hover:bg-red-50" aria-label="Remove image">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[0.75rem] font-medium text-red-700">{error}</p>}
          {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[0.75rem] font-medium text-emerald-700">{success}</p>}

          <button type="submit" className="mb-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-2 text-body font-bold text-white hover:bg-emerald-800">
            <Save className="h-3.5 w-3.5" />
            {t('savePlot', selectedLanguage)}
          </button>
        </form>
      </div>
    </div>
  );
}
