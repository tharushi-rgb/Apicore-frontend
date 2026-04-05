import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { LocationSelectorField } from '../shared/LocationSelectorField';
import { AdministrativeLocationFields } from '../shared/AdministrativeLocationFields';
import { authService } from '../../services/auth';
import { hivesService, type Hive } from '../../services/hives';
import { apiariesService, type Apiary } from '../../services/apiaries';
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
  onClose: () => void; contextApiary?: Apiary; initialHive?: Hive; onLogout: () => void;
}

interface HiveMetadata {
  province?: string;
  district?: string;
  ds_division?: string;
  hive_variant?: HiveVariant;
  ant_protection?: 'yes' | 'no';
  entrance_guard?: 'yes' | 'no' | '';
  bee_species?: string;
  colony_origin?: string;
  queen_status?: string;
  queen_acceptance_date?: string;
  colony_strength_percent?: string;
  photos?: string[];
  entrance_positions?: string[];
  pot_wall_thickness_cm?: string;
  pot_shape?: string;
  pot_entrance_hole_diameter_cm?: string;
  pot_ventilation_holes?: 'yes' | 'no' | '';
  pot_shade_level?: string;
  pot_rain_protection?: 'yes' | 'no' | '';
  pot_stand_type?: string;
  log_entrance_orientation?: string;
  log_placement_height?: string;
  log_shade?: string;
}

interface HiveFormState {
  hive_names: string[];
  apiary_selection: string;
  province: string;
  district: string;
  ds_division: string;
  gps_latitude: string;
  gps_longitude: string;
  established_date: string;
  status: string;
  hive_variant: HiveVariant;
  material: string;
  num_frames: string;
  pot_wall_thickness_cm: string;
  pot_shape: string;
  pot_internal_volume_liters: string;
  pot_entrance_hole_diameter_cm: string;
  pot_ventilation_holes: string;
  pot_shade_level: string;
  pot_rain_protection: string;
  pot_stand_type: string;
  log_wood_type: string;
  log_length_cm: string;
  log_cavity_diameter_cm: string;
  log_entrance_size: string;
  log_entrance_orientation: string;
  log_placement_height: string;
  log_shade: string;
  entrance_guard: string;
  ant_protection: string;
  bee_species: string;
  colony_origin: string;
  queen_status: string;
  colony_strength_percent: string;
  queen_acceptance_date: string;
  bottom_text: string;
  entrance_positions: string[];
  num_entrances: string;
  notes: string;
  photos: string[];
}

type HiveVariant = 'standard_box' | 'ulukata_pettiya' | 'meti_kalaya' | 'kitul_kota';

const HIVE_METADATA_MARKER = '[HIVE_METADATA]';

function parseHiveNotes(notes?: string): { plainNotes: string; metadata: HiveMetadata } {
  if (!notes) return { plainNotes: '', metadata: {} };
  const markerIndex = notes.indexOf(HIVE_METADATA_MARKER);
  if (markerIndex === -1) return { plainNotes: notes, metadata: {} };

  const plainNotes = notes.slice(0, markerIndex).trim();
  const jsonValue = notes.slice(markerIndex + HIVE_METADATA_MARKER.length).trim();
  if (!jsonValue) return { plainNotes, metadata: {} };

  try {
    return { plainNotes, metadata: JSON.parse(jsonValue) as HiveMetadata };
  } catch {
    return { plainNotes: notes, metadata: {} };
  }
}

function buildHiveNotes(notes: string, metadata: HiveMetadata): string {
  const hasMetadata = Object.values(metadata).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== undefined && value !== null;
  });

  const cleanNotes = notes.trim();
  if (!hasMetadata) return cleanNotes;
  const compactMetadata = JSON.stringify(metadata);
  return cleanNotes
    ? `${cleanNotes}\n\n${HIVE_METADATA_MARKER}\n${compactMetadata}`
    : `${HIVE_METADATA_MARKER}\n${compactMetadata}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function normalizeHiveVariant(initialHive?: Hive, metadata?: HiveMetadata): HiveVariant {
  if (metadata?.hive_variant) return metadata.hive_variant;
  if (initialHive?.hive_type === 'pot') return 'meti_kalaya';
  if (initialHive?.hive_type === 'log') return 'kitul_kota';
  return 'standard_box';
}

function toNumberString(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

function buildHiveFormState(initialHive?: Hive, contextApiary?: Apiary, user?: { district?: string; province?: string } | null): HiveFormState {
  const parsedInitial = parseHiveNotes(initialHive?.notes);
  const initialMetadata = parsedInitial.metadata;
  const initialVariant = normalizeHiveVariant(initialHive, initialMetadata);
  const initialHiveName = initialHive?.name ?? '';

  return {
    hive_names: initialHive ? [initialHiveName] : [initialHiveName || 'Hive 1'],
    apiary_selection: initialHive?.apiary_id != null
      ? String(initialHive.apiary_id)
      : contextApiary?.id != null
        ? String(contextApiary.id)
        : '',
    province: initialMetadata.province || contextApiary?.province || user?.province || '',
    district: initialMetadata.district || contextApiary?.district || user?.district || '',
    ds_division: initialMetadata.ds_division || contextApiary?.ds_division || '',
    gps_latitude: toNumberString(initialHive?.gps_latitude),
    gps_longitude: toNumberString(initialHive?.gps_longitude),
    established_date: (initialHive as any)?.established_date || '',
    status: (initialHive?.status || 'active') as string,
    hive_variant: initialVariant,
    material: (initialHive as any)?.material || '',
    num_frames: toNumberString((initialHive as any)?.num_frames),
    pot_wall_thickness_cm: initialMetadata.pot_wall_thickness_cm || '',
    pot_shape: initialMetadata.pot_shape || '',
    pot_internal_volume_liters: toNumberString((initialHive as any)?.pot_volume_liters),
    pot_entrance_hole_diameter_cm: initialMetadata.pot_entrance_hole_diameter_cm || '',
    pot_ventilation_holes: initialMetadata.pot_ventilation_holes || '',
    pot_shade_level: initialMetadata.pot_shade_level || '',
    pot_rain_protection: initialMetadata.pot_rain_protection || '',
    pot_stand_type: initialMetadata.pot_stand_type || '',
    log_wood_type: (initialHive as any)?.wood_type || '',
    log_length_cm: toNumberString((initialHive as any)?.log_length_cm),
    log_cavity_diameter_cm: toNumberString((initialHive as any)?.log_diameter_cm),
    log_entrance_size: (initialHive as any)?.entrance_size || '',
    log_entrance_orientation: initialMetadata.log_entrance_orientation || '',
    log_placement_height: initialMetadata.log_placement_height || '',
    log_shade: initialMetadata.log_shade || '',
    entrance_guard: initialMetadata.entrance_guard || '',
    ant_protection: initialMetadata.ant_protection || '',
    bee_species: initialMetadata.bee_species || (initialHive as any)?.stingless_species || '',
    colony_origin: initialMetadata.colony_origin || (initialHive as any)?.origin || '',
    queen_status: initialMetadata.queen_status || '',
    colony_strength_percent: initialMetadata.colony_strength_percent || toNumberString(initialHive?.colony_strength),
    queen_acceptance_date: initialMetadata.queen_acceptance_date || '',
    bottom_text: (initialHive as any)?.bottom_type || '',
    entrance_positions: initialMetadata.entrance_positions || (((initialHive as any)?.entrance_position || '')
      .split(',')
      .map((value: string) => value.trim())
      .filter(Boolean)),
    num_entrances: toNumberString((initialHive as any)?.num_entrances),
    notes: parsedInitial.plainNotes,
    photos: initialMetadata.photos || [],
  };
}

export function CreateHiveScreen({ selectedLanguage, onLanguageChange, onNavigate, onClose, contextApiary, initialHive, onLogout }: Props) {
  const isEdit = !!initialHive;
  const location = useLocation();
  const prefillApiaryId = (location.state as { apiaryId?: number } | null)?.apiaryId;
  const user = authService.getLocalUser();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [allHives, setAllHives] = useState<Hive[]>([]);

  const [form, setForm] = useState<HiveFormState>(() => buildHiveFormState(initialHive, contextApiary, user));
  const initialCoordinates = useRef<{ lat: string; lng: string }>({ lat: '', lng: '' });
  useEffect(() => {
    initialCoordinates.current = {
      lat: form.gps_latitude,
      lng: form.gps_longitude,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialHive?.id) return;
    let active = true;
    hivesService.getById(initialHive.id)
      .then((hive) => {
        if (!active) return;
        const rebuilt = buildHiveFormState(hive, contextApiary, user);
        initialCoordinates.current = {
          lat: rebuilt.gps_latitude,
          lng: rebuilt.gps_longitude,
        };
        setForm(rebuilt);
      })
      .catch((error) => {
        console.error('Failed to load location context:', error);
      });
    return () => {
      active = false;
    };
  }, [initialHive?.id, contextApiary?.id, user?.district, user?.province]);

  useEffect(() => {
    apiariesService.getAll()
      .then(setApiaries)
      .catch((error) => {
        console.error('Failed to load apiaries:', error);
      });
  }, []);

  useEffect(() => {
    if (isEdit || !prefillApiaryId) return;
    setForm((previous) => (
      previous.apiary_selection
        ? previous
        : { ...previous, apiary_selection: String(prefillApiaryId) }
    ));
  }, [isEdit, prefillApiaryId]);

  const availableDistricts = getDistrictsByProvince(form.province);
  const availableDivisions = getDsDivisionsByDistrict(form.district);

  useEffect(() => {
    if (!form.province || availableDistricts.includes(form.district)) return;
    setForm((previous) => ({ ...previous, district: '', ds_division: '' }));
  }, [form.province, form.district, availableDistricts]);

  useEffect(() => {
    if (!form.district || !form.ds_division || availableDivisions.includes(form.ds_division)) return;
    setForm((previous) => ({ ...previous, ds_division: '' }));
  }, [form.district, form.ds_division, availableDivisions]);

  useEffect(() => {
    if (isEdit) return;
    if (!form.apiary_selection) return;
    const selectedApiary = apiaries.find((apiary) => String(apiary.id) === form.apiary_selection);
    if (!selectedApiary) return;
    setForm((previous) => ({
      ...previous,
      province: selectedApiary.province || previous.province,
      district: selectedApiary.district || previous.district,
      ds_division: selectedApiary.ds_division || previous.ds_division,
      // Do NOT auto-fill GPS - only use what the user explicitly sets
    }));
  }, [apiaries, form.apiary_selection, isEdit]);

  const isBoxLike = form.hive_variant === 'standard_box' || form.hive_variant === 'ulukata_pettiya';
  const isPot = form.hive_variant === 'meti_kalaya';
  const isLog = form.hive_variant === 'kitul_kota';

  const updateField = (key: string, value: string | string[]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const [nearbyWarning, setNearbyWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hivesService.getAll()
      .then(setAllHives)
      .catch((error) => {
        console.error('Failed to load hives:', error);
      });
  }, []);

  useEffect(() => {
    const lat = parseFloat(form.gps_latitude);
    const lng = parseFloat(form.gps_longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setNearbyWarning('');
      return;
    }
    const NEARBY_KM = 0.5;
    const nearby = allHives.find((hive) => {
      if (hive.gps_latitude == null || hive.gps_longitude == null) return false;
      if (isEdit && hive.id === initialHive?.id) return false;
      return haversineKm(lat, lng, hive.gps_latitude, hive.gps_longitude) <= NEARBY_KM;
    });
    setNearbyWarning(nearby ? t('nearbyHiveWarning', selectedLanguage) : '');
  }, [form.gps_latitude, form.gps_longitude, allHives, isEdit, initialHive, selectedLanguage]);

  const addHiveNameRow = () => {
    setForm((previous) => {
      const nextIndex = previous.hive_names.length + 1;
      return { ...previous, hive_names: [...previous.hive_names, `Hive ${nextIndex}`] };
    });
  };

  const removeHiveNameRow = (index: number) => {
    setForm((previous) => {
      if (previous.hive_names.length === 1) return previous;
      return { ...previous, hive_names: previous.hive_names.filter((_, i) => i !== index) };
    });
  };

  const updateHiveName = (index: number, value: string) => {
    setForm((previous) => ({
      ...previous,
      hive_names: previous.hive_names.map((name, i) => (i === index ? value : name)),
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      const imageUrls = await Promise.all(files.map(fileToDataUrl));
      setForm((previous) => ({
        ...previous,
        photos: [...previous.photos, ...imageUrls],
      }));
      event.target.value = '';
    } catch (uploadError: any) {
      setError(uploadError.message || 'Failed to add photo');
    }
  };

  const removePhoto = (index: number) => {
    setForm((previous) => ({
      ...previous,
      photos: previous.photos.filter((_, i) => i !== index),
    }));
  };

  const toggleEntrancePosition = (position: string) => {
    setForm((previous) => {
      const exists = previous.entrance_positions.includes(position);
      const entrance_positions = exists
        ? previous.entrance_positions.filter((value) => value !== position)
        : [...previous.entrance_positions, position];
      return { ...previous, entrance_positions };
    });
  };

  const getDbHiveType = (variant: HiveVariant): 'box' | 'pot' | 'log' => {
    if (variant === 'meti_kalaya') return 'pot';
    if (variant === 'kitul_kota') return 'log';
    return 'box';
  };

  const getMaterialOptions = (variant: HiveVariant) => {
    if (variant === 'standard_box') return ['Rubber Wood (Standard)', 'Teak / Mahogany'];
    if (variant === 'ulukata_pettiya') return ['Clay Tiles (Ulu)'];
    if (variant === 'meti_kalaya') return ['Terracotta (Meti)'];
    return ['Kitul Palm'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNames = form.hive_names.map((name) => name.trim()).filter(Boolean);
    const gpsLat = form.gps_latitude || initialCoordinates.current.lat;
    const gpsLng = form.gps_longitude || initialCoordinates.current.lng;
    if (trimmedNames.length === 0) {
      setError('Add at least one hive name or number');
      return;
    }
    if (!form.apiary_selection) {
      setError('Apiary selection is required');
      return;
    }
    if (!gpsLat || !gpsLng) {
      setError('Location is required. Select the exact location on the map.');
      return;
    }
    if (!form.established_date) {
      setError('Date established is required');
      return;
    }
    if (!form.status) {
      setError('Status is required');
      return;
    }
    if (!form.hive_variant || !form.material) {
      setError('Hive type and material are required');
      return;
    }
    if (isBoxLike && !form.num_frames) {
      setError('Frame count is required for box/ulukata hives');
      return;
    }
    if (!isEdit && isBoxLike && form.entrance_positions.length === 0) {
      setError('Select at least one entrance position for box hives');
      return;
    }
    if (!isEdit && isPot) {
      if (!form.pot_wall_thickness_cm || !form.pot_shape || !form.pot_internal_volume_liters || !form.pot_entrance_hole_diameter_cm || !form.pot_ventilation_holes || !form.pot_shade_level || !form.pot_rain_protection || !form.pot_stand_type) {
        setError('Complete all clay pot logic details');
        return;
      }
    }
    if (!isEdit && isLog) {
      if (!form.log_wood_type || !form.log_length_cm || !form.log_cavity_diameter_cm || !form.log_entrance_size || !form.log_entrance_orientation || !form.log_placement_height || !form.log_shade) {
        setError('Complete all log hive logic details');
        return;
      }
    }
    if (!form.ant_protection) {
      setError('Ant protection is mandatory');
      return;
    }
    if (!form.bee_species) {
      setError('Bee species is required');
      return;
    }
    if (!form.colony_origin) {
      setError('Colony origin is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const metadata: HiveMetadata = {
        province: form.province,
        district: form.district,
        ds_division: form.ds_division,
        hive_variant: form.hive_variant as HiveVariant,
        ant_protection: form.ant_protection as 'yes' | 'no',
        entrance_guard: form.entrance_guard as 'yes' | 'no' | '',
        bee_species: form.bee_species,
        colony_origin: form.colony_origin,
        queen_status: form.queen_status,
        queen_acceptance_date: form.queen_acceptance_date,
        colony_strength_percent: form.colony_strength_percent,
        photos: form.photos,
        entrance_positions: form.entrance_positions,
        pot_wall_thickness_cm: form.pot_wall_thickness_cm,
        pot_shape: form.pot_shape,
        pot_entrance_hole_diameter_cm: form.pot_entrance_hole_diameter_cm,
        pot_ventilation_holes: form.pot_ventilation_holes as 'yes' | 'no' | '',
        pot_shade_level: form.pot_shade_level,
        pot_rain_protection: form.pot_rain_protection as 'yes' | 'no' | '',
        pot_stand_type: form.pot_stand_type,
        log_entrance_orientation: form.log_entrance_orientation,
        log_placement_height: form.log_placement_height,
        log_shade: form.log_shade,
      };

      const sharedData: any = {
        hive_type: getDbHiveType(form.hive_variant as HiveVariant),
        apiary_id: parseInt(form.apiary_selection, 10),
        location_type: 'apiary-linked',
        status: form.status,
        queen_present: (form.queen_status && form.queen_status !== 'virgin' && form.queen_status !== '') ? 1 : 0,
        colony_strength: form.colony_strength_percent ? String(form.colony_strength_percent) : null,
        gps_latitude: parseFloat(gpsLat),
        gps_longitude: parseFloat(gpsLng),
        notes: buildHiveNotes(form.notes, metadata),
        material: form.material,
        num_frames: isBoxLike && form.num_frames ? parseInt(form.num_frames, 10) : null,
        bottom_type: isBoxLike ? form.bottom_text || null : null,
        entrance_position: isBoxLike && form.entrance_positions.length > 0 ? form.entrance_positions.join(',') : null,
        num_entrances: isBoxLike && form.num_entrances ? parseInt(form.num_entrances, 10) : null,
        pot_volume_liters: isPot && form.pot_internal_volume_liters ? parseFloat(form.pot_internal_volume_liters) : null,
        pot_material: isPot ? form.material : null,
        log_length_cm: isLog && form.log_length_cm ? parseFloat(form.log_length_cm) : null,
        log_diameter_cm: isLog && form.log_cavity_diameter_cm ? parseFloat(form.log_cavity_diameter_cm) : null,
        wood_type: isLog ? form.log_wood_type || null : null,
        entrance_size: isPot ? form.pot_entrance_hole_diameter_cm : isLog ? form.log_entrance_size : null,
        bee_source: form.colony_origin,
        origin: form.colony_origin,
        stingless_species: form.bee_species,
        established_date: form.established_date,
      };

      if (isEdit && initialHive) {
        await hivesService.update(initialHive.id, {
          ...sharedData,
          name: trimmedNames[0],
        });
      } else {
        await Promise.all(trimmedNames.map((name) => hivesService.create({
          ...sharedData,
          name,
        })));
      }

      onClose();
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to save hive');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const inputCls = 'w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none bg-white';
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1 leading-tight';
  const sLabelCls = 'block text-xs font-medium text-stone-600 mb-1.5';

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm sticky top-0 z-30 shrink-0">
        <MobileHeader
          userName={user?.name}
          roleLabel={user?.role}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="hives"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
        />
        <PageTitleBar
          title={isEdit ? 'Edit Hive' : 'Create Hive'}
          subtitle="Basic details, hive configuration, and colony setup"
          size="sm"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto relative">
      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 pb-24">
        {error && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
            <div className="bg-white border border-red-200 shadow-xl rounded-2xl p-4 w-full max-w-sm space-y-3">
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <div className="text-xs text-stone-600">Fix the highlighted issue and try again.</div>
              <button type="button" onClick={() => setError('')} className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold text-sm">OK</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-800">1. Basic Information</h3>
            {!isEdit && (
              <button type="button" onClick={addHiveNameRow} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                <Plus className="w-4 h-4" /> Add hive
              </button>
            )}
          </div>

          <div className="space-y-2">
            {form.hive_names.map((hiveName, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className={sLabelCls}>{`Hive Number/Name ${index + 1} *`}</label>
                  <input value={hiveName} onChange={(e) => updateHiveName(index, e.target.value)} placeholder={`Hive ${index + 1}`} className={inputCls} />
                </div>
                {!isEdit && form.hive_names.length > 1 && (
                  <button type="button" onClick={() => removeHiveNameRow(index)} className="mt-5 p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>Apiary *</label>
            <select value={form.apiary_selection} onChange={(e) => updateField('apiary_selection', e.target.value)} className={inputCls}>
              <option value="">Select an apiary</option>
              {apiaries.map((apiary) => <option key={apiary.id} value={apiary.id}>{apiary.name}</option>)}
            </select>
          </div>

          <AdministrativeLocationFields
            province={form.province}
            district={form.district}
            dsDivision={form.ds_division}
            onProvinceChange={(value) => updateField('province', value)}
            onDistrictChange={(value) => updateField('district', value)}
            onDsDivisionChange={(value) => updateField('ds_division', value)}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Date Established *</label>
              <input type="date" value={form.established_date} onChange={(e) => updateField('established_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status *</label>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {nearbyWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.82rem] text-amber-900 flex items-start gap-2 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-700" />
                <div className="leading-snug">
                  <p className="font-semibold text-[0.84rem]">Another hive is within 500 m</p>
                  <p className="text-[0.8rem]">Pick a different spot or confirm placement.</p>
                </div>
              </div>
            )}
            <LocationSelectorField
              label="Location / GPS *"
              district={form.district || user?.district}
              latitude={form.gps_latitude}
              longitude={form.gps_longitude}
              onChange={(latitude, longitude) => {
                updateField('gps_latitude', latitude);
                updateField('gps_longitude', longitude);
              }}
              helperText="Pin exact location for forage-distance accuracy. Administrative location fields above are optional."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-stone-800">2. Hive Configuration</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.hive_variant} onChange={(e) => updateField('hive_variant', e.target.value)} className={inputCls}>
                <option value="standard_box">Standard Box (Mee Pettiya)</option>
                <option value="ulukata_pettiya">Ulukata Pettiya (Roof Tile Box)</option>
                <option value="meti_kalaya">Meti Kalaya (Clay Pot)</option>
                <option value="kitul_kota">Kitul Kota (Log)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Material *</label>
              <select value={form.material} onChange={(e) => updateField('material', e.target.value)} className={inputCls}>
                <option value="">Select material</option>
                {getMaterialOptions(form.hive_variant as HiveVariant).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {isBoxLike && (
            <div className="space-y-3 rounded-xl bg-amber-50/50 border border-amber-100 p-3">
              <div>
                <label className={sLabelCls}>Frames *</label>
                <input type="number" min="1" value={form.num_frames} onChange={(e) => updateField('num_frames', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={sLabelCls}>Entrance Position * (choose one or more)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['top', 'bottom', 'side'].map((position) => (
                    <label key={position} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-700">
                      <input type="checkbox" checked={form.entrance_positions.includes(position)} onChange={() => toggleEntrancePosition(position)} className="accent-amber-500" />
                      {position[0].toUpperCase() + position.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

          {isPot && (
            <div className="space-y-3 rounded-xl bg-orange-50/50 border border-orange-100 p-3">
              <p className="text-xs font-medium text-orange-700">Logic details for pot (all required)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Wall Thickness (cm) *</label>
                  <input type="number" min="0" step="0.1" value={form.pot_wall_thickness_cm} onChange={(e) => updateField('pot_wall_thickness_cm', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={sLabelCls}>Pot Shape *</label>
                  <select value={form.pot_shape} onChange={(e) => updateField('pot_shape', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="round">Round</option>
                    <option value="oval">Oval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Internal Volume (liters) *</label>
                  <input type="number" min="0" step="0.1" value={form.pot_internal_volume_liters} onChange={(e) => updateField('pot_internal_volume_liters', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={sLabelCls}>Entrance Hole Diameter (cm) *</label>
                  <input type="number" min="0" step="0.1" value={form.pot_entrance_hole_diameter_cm} onChange={(e) => updateField('pot_entrance_hole_diameter_cm', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Ventilation Holes *</label>
                  <select value={form.pot_ventilation_holes} onChange={(e) => updateField('pot_ventilation_holes', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className={sLabelCls}>Shade Level *</label>
                  <select value={form.pot_shade_level} onChange={(e) => updateField('pot_shade_level', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="full_shade">Full shade</option>
                    <option value="partial_shade">Partial shade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Rain Protection *</label>
                  <select value={form.pot_rain_protection} onChange={(e) => updateField('pot_rain_protection', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className={sLabelCls}>Stand Type *</label>
                  <select value={form.pot_stand_type} onChange={(e) => updateField('pot_stand_type', e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    <option value="single_pillar">Single Pillar</option>
                    <option value="four_leg_stand">Four-leg Stand</option>
                    <option value="hanging">Hanging</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {isLog && (
            <div className="space-y-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
              <p className="text-xs font-medium text-emerald-700">Logic details for log (all required)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Wood Type (Tree Species) *</label>
                  <input value={form.log_wood_type} onChange={(e) => updateField('log_wood_type', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={sLabelCls}>Log Length (cm) *</label>
                  <input type="number" min="0" step="0.1" value={form.log_length_cm} onChange={(e) => updateField('log_length_cm', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Cavity Diameter (cm) *</label>
                  <input type="number" min="0" step="0.1" value={form.log_cavity_diameter_cm} onChange={(e) => updateField('log_cavity_diameter_cm', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={sLabelCls}>Entrance Size *</label>
                  <input value={form.log_entrance_size} onChange={(e) => updateField('log_entrance_size', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={sLabelCls}>Entrance Orientation *</label>
                  <input value={form.log_entrance_orientation} onChange={(e) => updateField('log_entrance_orientation', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={sLabelCls}>Placement Height *</label>
                  <input value={form.log_placement_height} onChange={(e) => updateField('log_placement_height', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={sLabelCls}>Shade *</label>
                <input value={form.log_shade} onChange={(e) => updateField('log_shade', e.target.value)} placeholder="e.g., partial shade" className={inputCls} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`${labelCls} min-h-[3rem]`}>Entrance Guard (Optional)</label>
              <div className="flex gap-2">
                {['yes', 'no'].map((value) => (
                  <button key={value} type="button" onClick={() => updateField('entrance_guard', value)} className={`flex-1 py-1.5 rounded-xl text-sm border ${form.entrance_guard === value ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-700 border-stone-200'}`}>
                    {value === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:border-l sm:border-stone-200 sm:pl-4">
              <label className={`${labelCls} min-h-[3rem]`}>Ant Protection *</label>
              <div className="flex gap-2">
                {['yes', 'no'].map((value) => (
                  <button key={value} type="button" onClick={() => updateField('ant_protection', value)} className={`flex-1 py-1.5 rounded-xl text-sm border ${form.ant_protection === value ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-700 border-stone-200'}`}>
                    {value === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-stone-800">3. Colony & Biological Details</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Bee Species *</label>
              <select value={form.bee_species} onChange={(e) => updateField('bee_species', e.target.value)} className={inputCls}>
                <option value="">Select species</option>
                <option value="apis_cerana">Mee Massa (Apis cerana)</option>
                <option value="tetragonula">Kaneyiya (Tetragonula)</option>
                <option value="apis_florea">Danduwal Massa (Apis florea)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Colony Origin *</label>
              <select value={form.colony_origin} onChange={(e) => updateField('colony_origin', e.target.value)} className={inputCls}>
                <option value="">Select origin</option>
                <option value="rukula_capture">Rukula Capture (Trap)</option>
                <option value="wild_transfer">Wild Transfer (Bambara/Wall)</option>
                <option value="division">Division (Beduma)</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 items-start">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Queen Status (Optional)</label>
              <select value={form.queen_status} onChange={(e) => updateField('queen_status', e.target.value)} className={inputCls}>
                <option value="">Not specified</option>
                <option value="marked">Marked</option>
                <option value="unmarked">Unmarked</option>
                <option value="virgin">Virgin (Kumari)</option>
                <option value="mated">Mated (Rajina)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Queen Acceptance Date</label>
              <input type="date" value={form.queen_acceptance_date} onChange={(e) => updateField('queen_acceptance_date', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Colony Strength (0-100%)</label>
              <span className="text-sm text-stone-600">{form.colony_strength_percent ? `${form.colony_strength_percent}%` : 'Not set'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={form.colony_strength_percent || '0'}
              onChange={(e) => updateField('colony_strength_percent', e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-stone-800">5. Maintenance</h3>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Photos</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Choose Photos
              </button>
              <span className="text-xs text-stone-500">JPEG/PNG, multiple files allowed</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                    <img src={photo} alt={`Hive ${index + 1}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60">
          {saving
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            : <><Save className="w-5 h-5" /> {isEdit ? 'Update Hive' : 'Create Hive'}</>}
        </button>
      </form>
      </div>
    </div>
  );
}
