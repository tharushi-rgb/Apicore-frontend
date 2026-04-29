import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ChevronRight, MapPin, Plus, ShieldCheck, User, Edit, Eye, Trash2, X, Save, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { profileService, type Profile } from '../../services/profile';
import { landownerMarketplaceService, type LandPlot } from '../../services/landownerMarketplace';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';
import { t } from '../../i18n';
import { formatSriLankanPhoneNumber, PHONE_NUMBER_MAX_LENGTH } from '../../utils/phone';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

interface PlotEditorState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  plotId?: number;
  name: string;
  province: string;
  district: string;
  dsDivision: string;
  gpsLatitude: string;
  gpsLongitude: string;
  totalAcreage: string;
  waterAvailability: string;
  shadeProfile: string;
  vehicleAccess: string;
  nightAccess: boolean | null;
  forageEntries: Array<{ forage: string; bloomStartMonth: string; bloomEndMonth: string }>;
}

export function LandownerProfileScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [plotsVersion, setPlotsVersion] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [plots, setPlots] = useState<LandPlot[]>([]);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editDsDivision, setEditDsDivision] = useState('');
  const [editBusinessRegNo, setEditBusinessRegNo] = useState('');

  // Plot editor state
  const [plotEditor, setPlotEditor] = useState<PlotEditorState>({
    isOpen: false,
    mode: 'create',
    name: '',
    province: '',
    district: '',
    dsDivision: '',
    gpsLatitude: '',
    gpsLongitude: '',
    totalAcreage: '',
    waterAvailability: 'On-site',
    shadeProfile: 'Partial Shade',
    vehicleAccess: 'Lorry',
    nightAccess: false,
    forageEntries: [],
  });
  const [plotEditorMessage, setPlotEditorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPlot, setIsSavingPlot] = useState(false);
  const [plotSearch, setPlotSearch] = useState('');
  // Forage editor state for edit mode
  const [newForageInput, setNewForageInput] = useState({
    forage: '',
    bloomStartMonth: '',
    bloomEndMonth: '',
  });

  useEffect(() => {
    profileService.get()
      .then((result) => {
        const p = result.user;
        setProfile(p);
        setEditName(p.name || '');
        setEditEmail(p.email || '');
        setEditPhone(formatSriLankanPhoneNumber(p.phone || ''));
        setEditProvince((p as any).province || '');
        setEditDistrict(p.district || '');
        setEditDsDivision((p as any).ds_division || '');
        setEditBusinessRegNo(p.business_reg_no || '');
      })
      .catch((error) => {
        console.error('Failed to load profile:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPlotsVersion((value) => value + 1);
  }, [loading]);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const loadedPlots = await landownerMarketplaceService.getPlots();
        setPlots(loadedPlots);
      } catch (error) {
        console.error('Failed to get plots:', error);
        setPlots([]);
      }
    };
    loadPlots();
  }, [plotsVersion]);

  const districts = useMemo(() => getDistrictsByProvince(editProvince), [editProvince]);
  const dsDivisions = useMemo(() => getDsDivisionsByDistrict(editDistrict), [editDistrict]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'Member';
    const dt = new Date(profile.created_at);
    if (Number.isNaN(dt.getTime())) return 'Member';
    return `Member since ${dt.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
  }, [profile?.created_at]);

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setSaveMessage('');

    try {
      const imageUrl = await fileToDataUrl(file);
      const updated = await profileService.update({ avatar_url: imageUrl });

      // Force reload the complete profile to ensure image shows
      const refreshedProfile = await profileService.get();
      setProfile(refreshedProfile.user);

      setSaveMessage('Profile photo updated successfully');
    } catch (error) {
      console.error('Failed to update profile photo:', error);
      setSaveMessage('Failed to update profile photo');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditEmail(profile.email || '');
    setEditPhone(formatSriLankanPhoneNumber(profile.phone || ''));
    setEditProvince((profile as any).province || '');
    setEditDistrict(profile.district || '');
    setEditDsDivision((profile as any).ds_division || '');
    setEditBusinessRegNo(profile.business_reg_no || '');
    setIsEditingProfile(true);
    setSaveMessage('');
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditEmail(profile.email || '');
    setEditPhone(profile.phone || '');
    setEditProvince((profile as any).province || '');
    setEditDistrict(profile.district || '');
    setEditDsDivision((profile as any).ds_division || '');
    setEditBusinessRegNo(profile.business_reg_no || '');
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const updated = await profileService.update({
        name: editName.trim(),
        // email: editEmail.trim(),
        phone: formatSriLankanPhoneNumber(editPhone),
        district: editDistrict.trim(),
        province: editProvince.trim(),
        ds_division: editDsDivision.trim(),
        business_reg_no: editBusinessRegNo.trim(),
      });
      setProfile(updated);
      setIsEditingProfile(false);
      setSaveMessage('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const openPlotCreate = () => {
    setPlotEditor({
      isOpen: true,
      mode: 'create',
      name: '',
      province: '',
      district: '',
      dsDivision: '',
      gpsLatitude: '',
      gpsLongitude: '',
      totalAcreage: '',
      waterAvailability: 'On-site',
      shadeProfile: 'Partial Shade',
      vehicleAccess: 'Lorry',
      nightAccess: false,
      forageEntries: [],
    });
    setPlotEditorMessage(null);
    setNewForageInput({ forage: '', bloomStartMonth: '', bloomEndMonth: '' });
  };

  const openPlotEdit = (plot: LandPlot) => {
    setPlotEditor({
      isOpen: true,
      mode: 'edit',
      plotId: plot.id,
      name: plot.name,
      province: plot.province,
      district: plot.district,
      dsDivision: plot.dsDivision,
      gpsLatitude: String(plot.gpsLatitude ?? ''),
      gpsLongitude: String(plot.gpsLongitude ?? ''),
      totalAcreage: String(plot.totalAcreage || ''),
      waterAvailability: plot.waterAvailability,
      shadeProfile: plot.shadeProfile,
      vehicleAccess: plot.vehicleAccess,
      nightAccess: plot.nightAccess ?? false,
      forageEntries: (plot.forageEntries || []).map(entry => ({
        forage: (entry as any).name ?? (entry as any).forage ?? '',
        bloomStartMonth: entry.bloomStartMonth,
        bloomEndMonth: entry.bloomEndMonth,
      })),
    });
    setPlotEditorMessage(null);
    setNewForageInput({ forage: '', bloomStartMonth: '', bloomEndMonth: '' });
  };

  const openPlotView = (plot: LandPlot) => {
    setPlotEditor({
      isOpen: true,
      mode: 'view',
      plotId: plot.id,
      name: plot.name,
      province: plot.province,
      district: plot.district,
      dsDivision: plot.dsDivision,
      gpsLatitude: String(plot.gpsLatitude ?? ''),
      gpsLongitude: String(plot.gpsLongitude ?? ''),
      totalAcreage: String(plot.totalAcreage || ''),
      waterAvailability: plot.waterAvailability,
      shadeProfile: plot.shadeProfile,
      vehicleAccess: plot.vehicleAccess,
      nightAccess: plot.nightAccess ?? false,
      forageEntries: (plot.forageEntries || []).map(entry => ({
        forage: (entry as any).name ?? (entry as any).forage ?? '',
        bloomStartMonth: entry.bloomStartMonth,
        bloomEndMonth: entry.bloomEndMonth,
      })),
    });
    setPlotEditorMessage(null);
    setNewForageInput({ forage: '', bloomStartMonth: '', bloomEndMonth: '' });
  };

  const closePlotEditor = () => {
    setPlotEditor((prev) => ({ ...prev, isOpen: false }));
    setPlotEditorMessage(null);
  };

  const savePlot = async () => {
    // Validation
    if (!plotEditor.name.trim()) {
      setPlotEditorMessage({ type: 'error', text: 'Plot name is required' });
      return;
    }

    if (!plotEditor.province || !plotEditor.district || !plotEditor.dsDivision) {
      setPlotEditorMessage({ type: 'error', text: 'Location fields are required' });
      return;
    }

    if (!plotEditor.totalAcreage || Number(plotEditor.totalAcreage) <= 0) {
      setPlotEditorMessage({ type: 'error', text: 'Total acreage must be greater than 0' });
      return;
    }

    setIsSavingPlot(true);
    setPlotEditorMessage(null);

    try {
      const forageEntries = plotEditor.forageEntries
        .map((entry) => ({
          name: entry.forage.trim(),
          bloomStartMonth: entry.bloomStartMonth,
          bloomEndMonth: entry.bloomEndMonth,
        }))
        .filter((entry) => Boolean(entry.name && entry.bloomStartMonth && entry.bloomEndMonth));

      if (forageEntries.length === 0) {
        setPlotEditorMessage({ type: 'error', text: 'Add at least one forage entry with bloom start and end month' });
        return;
      }

      const gpsLatitudeRaw = plotEditor.gpsLatitude.trim();
      const gpsLongitudeRaw = plotEditor.gpsLongitude.trim();
      const gpsLatitude = gpsLatitudeRaw ? Number(gpsLatitudeRaw) : undefined;
      const gpsLongitude = gpsLongitudeRaw ? Number(gpsLongitudeRaw) : undefined;
      if (gpsLatitudeRaw && !Number.isFinite(gpsLatitude)) {
        setPlotEditorMessage({ type: 'error', text: 'GPS latitude must be a valid number' });
        return;
      }
      if (gpsLongitudeRaw && !Number.isFinite(gpsLongitude)) {
        setPlotEditorMessage({ type: 'error', text: 'GPS longitude must be a valid number' });
        return;
      }

      const payload = {
        name: plotEditor.name.trim(),
        province: plotEditor.province,
        district: plotEditor.district,
        dsDivision: plotEditor.dsDivision,
        gpsLatitude,
        gpsLongitude,
        totalAcreage: Number(plotEditor.totalAcreage),
        waterAvailability: plotEditor.waterAvailability,
        shadeProfile: plotEditor.shadeProfile,
        vehicleAccess: plotEditor.vehicleAccess,
        nightAccess: plotEditor.nightAccess ?? false,
        forageEntries,
      };

      if (plotEditor.mode === 'edit' && plotEditor.plotId) {
        await landownerMarketplaceService.updatePlot(plotEditor.plotId, payload as any);
        setPlotEditorMessage({ type: 'success', text: 'Plot updated successfully' });
      } else {
        await landownerMarketplaceService.createPlot(payload as any);
        setPlotEditorMessage({ type: 'success', text: 'Plot created successfully' });
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for save
      setPlotsVersion((v) => v + 1);
      closePlotEditor();
    } catch (error: any) {
      setPlotEditorMessage({ type: 'error', text: error?.message || 'Failed to save plot' });
    } finally {
      setIsSavingPlot(false);
    }
  };

  const deletePlot = async (plotId: number) => {
    if (!window.confirm('Delete this plot? This cannot be undone.')) return;

    try {
      await landownerMarketplaceService.deletePlot(plotId);
      setPlotEditorMessage({ type: 'success', text: 'Plot deleted successfully' });
      setPlotsVersion((v) => v + 1);
      closePlotEditor();
    } catch (error: any) {
      setPlotEditorMessage({ type: 'error', text: error?.message || 'Failed to delete plot' });
    }
  };

  const trustScore = 92;
  const isPlotViewMode = plotEditor.mode === 'view';

  if (loading) {
    return (
      <div className="h-[100dvh] bg-gradient-to-b from-emerald-50 via-green-50 to-lime-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-stone-50 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm">
        <MobileHeader
          userName={profile?.name || authService.getLocalUser()?.name}
          roleLabel="landowner"
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab="profile"
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
          role="landowner"
          theme="green"
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <section className="relative">
          <div
            className="h-20 bg-emerald-900"
            style={{
              backgroundImage: 'radial-gradient(circle at 10px 10px, rgba(255,255,255,0.18) 2px, transparent 2px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="px-4 py-4">
            <div className="-mt-12 rounded-xl border border-stone-200 bg-white p-4 shadow-sm relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-lime-50" />
              
              {/* Mode Toggle: View/Edit */}
              <div className="relative mb-4 flex gap-2">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${!isEditingProfile ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {t('viewProfile', selectedLanguage)}
                </button>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${isEditingProfile ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {t('editProfile', selectedLanguage)}
                </button>
              </div>
              
              {/* <div className="relative flex items-center justify-end">
                {!isEditingProfile && (
                  <button
                    onClick={handleOpenEdit}
                    className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    {t('edit', selectedLanguage)}
                  </button>
                )}
              </div> */}

              <div className="relative rounded-2xl bg-white p-4 shadow-sm border border-stone-200 flex items-center gap-4">

            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-amber-400 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="h-full w-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>

              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-emerald-600 p-1.5 rounded-full border-2 border-white"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="font-bold text-stone-900 text-base">
                {profile?.name || 'User'}
              </h2>

              <p className="text-amber-600 text-sm font-medium">
                Landowner
              </p>

              <div className="mt-1 space-y-1 text-sm text-stone-600">

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {profile?.district || 'Not set'}
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {profile?.phone || '-'}
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile?.email || '-'}
                </div>

              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={handleOpenEdit}
              className="absolute top-3 right-3 bg-orange-100 hover:bg-orange-200 p-2 rounded-lg"
            >
              <Edit className="w-4 h-4 text-orange-600" />
            </button>

          </div>


              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                {!isEditingProfile ? (
                  <div className="space-y-2">
                    <ProfileInfoTile label={t('name', selectedLanguage)} value={profile?.name || '-'} />
                    <ProfileInfoTile label={t('email', selectedLanguage)} value={profile?.email || '-'} />
                    <ProfileInfoTile label={t('phone', selectedLanguage)} value={profile?.phone || '-'} />
                    <ProfileInfoTile label={t('province', selectedLanguage)} value={(profile as any)?.province || '-'} />
                    <ProfileInfoTile label={t('district', selectedLanguage)} value={profile?.district || '-'} />
                    <ProfileInfoTile label={t('dsDivision', selectedLanguage)} value={(profile as any)?.ds_division || '-'} />
                    <ProfileInfoTile label={t('bRegistration', selectedLanguage)} value={profile?.business_reg_no || '-'} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ProfileEditInputTile label={t('name', selectedLanguage)} value={editName} onChange={setEditName} placeholder={t('enterName', selectedLanguage)} />
                    {/* <ProfileEditInputTile label={t('email', selectedLanguage)} value={editEmail} onChange={setEditEmail} placeholder={t('enterEmail', selectedLanguage)} type="email" /> */}
                    <ProfileEditInputTile label={t('phone', selectedLanguage)} value={editPhone} onChange={setEditPhone} placeholder={t('enterPhone', selectedLanguage)} type="tel" />
                    <ProfileEditSelectTile
                      label={t('province', selectedLanguage)}
                      value={editProvince}
                      onChange={(value) => {
                        setEditProvince(value);
                        setEditDistrict('');
                        setEditDsDivision('');
                      }}
                      options={PROVINCES as unknown as string[]}
                      placeholder={t('selectProvince', selectedLanguage)}
                    />
                    <ProfileEditSelectTile
                      label={t('district', selectedLanguage)}
                      value={editDistrict}
                      onChange={(value) => {
                        setEditDistrict(value);
                        setEditDsDivision('');
                      }}
                      options={districts}
                      placeholder={t('selectDistrict', selectedLanguage)}
                      disabled={!editProvince}
                    />
                    <ProfileEditSelectTile
                      label={t('dsDivision', selectedLanguage)}
                      value={editDsDivision}
                      onChange={setEditDsDivision}
                      options={dsDivisions}
                      placeholder={t('selectDsDivision', selectedLanguage)}
                      disabled={!editDistrict}
                    />
                    <ProfileEditInputTile label={t('bRegistration', selectedLanguage)} value={editBusinessRegNo} onChange={setEditBusinessRegNo} placeholder="Enter business registration" />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-3">
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 rounded-full border border-stone-300 bg-white px-2.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                      >
                        {t('cancel', selectedLanguage)}
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={isSaving}
                        className="flex-1 rounded-full bg-emerald-700 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-60"
                      >
                        {isSaving ? t('saving', selectedLanguage) : t('saveChanges', selectedLanguage)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4 px-4 pb-6">
          {saveMessage && (
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${saveMessage.includes('Failed') ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {saveMessage}
            </p>
          )}

          {/* Land Plots Card */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">{t('landPlots', selectedLanguage)}</p>
                <p className="mt-1 text-sm text-stone-600">{plots.length} {t('plotsLinked', selectedLanguage)}</p>
                <p className="mt-1 text-xs text-stone-500">Manage your land plots to create listings and partnerships with local beekeepers</p>
              </div>
              <button
                onClick={() => navigate('/land-plots/new')}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {t('add', selectedLanguage)}
              </button>
            </div>

            <div className="mt-3">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  value={plotSearch}
                  onChange={(event) => setPlotSearch(event.target.value)}
                  placeholder={t('searchPlots', selectedLanguage)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-[0.78rem] text-stone-700 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {plotEditorMessage && !plotEditor.isOpen && (
                <p className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  plotEditorMessage.type === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {plotEditorMessage.text}
                </p>
              )}
              {plots.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-2 py-2 text-center">
                  <p className="text-sm font-semibold text-stone-700">{t('noPlotsAdded', selectedLanguage)}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{t('addFirstPlot', selectedLanguage)}</p>
                </div>
              )}

              {plots
                .filter((plot) => {
                  const query = plotSearch.trim().toLowerCase();
                  if (!query) return true;
                  const forageText = plot.forageEntries.map((entry) => entry.name).join(' ').toLowerCase();
                  return (
                    plot.name.toLowerCase().includes(query) ||
                    plot.district.toLowerCase().includes(query) ||
                    plot.province.toLowerCase().includes(query) ||
                    forageText.includes(query)
                  );
                })
                .map((plot) => (
                <div
                  key={plot.id}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 hover:border-emerald-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-stone-900">{plot.name}</p>
                      </div>
                      <p className="mt-0.5 inline-flex items-center gap-0.5 text-sm text-stone-600">
                        <MapPin className="h-3 w-3" />
                        {plot.district}, {plot.province}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openPlotView(plot)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                        title="View plot"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openPlotEdit(plot)}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="Edit plot"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePlot(plot.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                        title="Delete plot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {plot.forageEntries.slice(0, 3).map((forageLabel) => (
                      <span key={`${plot.id}-${forageLabel.name}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {forageLabel.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-700">
                    <span className="font-semibold text-stone-900">{plot.totalAcreage} acres</span>
                    <span>{plot.waterAvailability}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plot Editor Modal */}
      {plotEditor.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closePlotEditor}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
              <h2 className="text-base font-bold text-stone-900">
                {plotEditor.mode === 'create' ? t('addNewPlot', selectedLanguage) : plotEditor.mode === 'edit' ? t('editPlot', selectedLanguage) : t('viewPlot', selectedLanguage)}
              </h2>
              <button onClick={closePlotEditor} className="rounded-lg p-1 hover:bg-stone-100">
                <X className="h-4 w-4 text-stone-500" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              {plotEditorMessage && (
                <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  plotEditorMessage.type === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {plotEditorMessage.text}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">{t('plotNameRequired', selectedLanguage)}</label>
                <input
                  type="text"
                  value={plotEditor.name}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., South Mango Orchard"
                  disabled={isPlotViewMode}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Province *</label>
                <select
                  value={plotEditor.province}
                  onChange={(e) => {
                    setPlotEditor((prev) => ({ ...prev, province: e.target.value, district: '', dsDivision: '' }));
                  }}
                  disabled={isPlotViewMode}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="">Select Province</option>
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">District *</label>
                <select
                  value={plotEditor.district}
                  onChange={(e) => {
                    setPlotEditor((prev) => ({ ...prev, district: e.target.value, dsDivision: '' }));
                  }}
                  disabled={isPlotViewMode || !plotEditor.province}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="">Select District</option>
                  {getDistrictsByProvince(plotEditor.province).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">DS Division *</label>
                <select
                  value={plotEditor.dsDivision}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, dsDivision: e.target.value }))}
                  disabled={isPlotViewMode || !plotEditor.district}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="">Select DS Division</option>
                  {getDsDivisionsByDistrict(plotEditor.district).map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">{t('totalAcreageRequired', selectedLanguage)}</label>
                <input
                  type="number"
                  step="0.1"
                  value={plotEditor.totalAcreage}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, totalAcreage: e.target.value }))}
                  placeholder="5.3"
                  disabled={isPlotViewMode}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">{t('waterAvailability', selectedLanguage)}</label>
                <select
                  value={plotEditor.waterAvailability}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, waterAvailability: e.target.value }))}
                  disabled={isPlotViewMode}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option>{t('onSite', selectedLanguage)}</option>
                  <option>{t('within500m', selectedLanguage)}</option>
                  <option>{t('requiresManualWater', selectedLanguage)}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">{t('vehicleAccess', selectedLanguage)}</label>
                <select
                  value={plotEditor.vehicleAccess}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, vehicleAccess: e.target.value }))}
                  disabled={isPlotViewMode}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option>{t('lorry', selectedLanguage)}</option>
                  <option>{t('tukTuk', selectedLanguage)}</option>
                  <option>{t('footpath', selectedLanguage)}</option>
                </select>
              </div>

              {/* Forage Sources Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-2">Primary Forage Sources</label>
                
                {plotEditor.forageEntries.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">No forage sources added</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {plotEditor.forageEntries.map((entry, index) => (
                      entry.forage ? (
                        <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">{entry.forage}</p>
                            <p className="text-xs text-emerald-700">{entry.bloomStartMonth} - {entry.bloomEndMonth}</p>
                          </div>
                          {!isPlotViewMode && (
                            <button
                              onClick={() => setPlotEditor(prev => ({
                                ...prev,
                                forageEntries: prev.forageEntries.filter((_, i) => i !== index)
                              }))}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {!isPlotViewMode && (
                  <>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newForageInput.forage}
                        onChange={(e) => setNewForageInput(prev => ({ ...prev, forage: e.target.value }))}
                        placeholder="Forage name (e.g., Coconut Palm)"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newForageInput.bloomStartMonth}
                          onChange={(e) => setNewForageInput(prev => ({ ...prev, bloomStartMonth: e.target.value }))}
                          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        >
                          <option value="">Start Month</option>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                        <select
                          value={newForageInput.bloomEndMonth}
                          onChange={(e) => setNewForageInput(prev => ({ ...prev, bloomEndMonth: e.target.value }))}
                          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        >
                          <option value="">End Month</option>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (newForageInput.forage && newForageInput.bloomStartMonth && newForageInput.bloomEndMonth) {
                          setPlotEditor(prev => ({
                            ...prev,
                            forageEntries: [...prev.forageEntries, newForageInput]
                          }));
                          setNewForageInput({ forage: '', bloomStartMonth: '', bloomEndMonth: '' });
                        }
                      }}
                      className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Forage
                    </button>
                  </>
                )}
              </div>

              {!isPlotViewMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={savePlot}
                    disabled={isSavingPlot}
                    className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingPlot ? t('saving', selectedLanguage) : t('savePlot', selectedLanguage)}
                  </button>
                  <button
                    onClick={closePlotEditor}
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    {t('cancel', selectedLanguage)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={closePlotEditor}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  {t('close', selectedLanguage)}
                </button>
              )}

              {plotEditor.mode === 'edit' && plotEditor.plotId && (
                <button
                  onClick={() => deletePlot(plotEditor.plotId!)}
                  className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('deletePlot', selectedLanguage)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
    </div>
  );
}

function ProfileInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 shrink-0">{label}</span>
        <span className="min-w-0 max-w-[65%] text-sm font-semibold text-stone-900 text-right break-all">
          {value}
        </span>
      </div>

    </div>
  );
}

function ProfileEditInputTile({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</span>
        <input
          value={value}
          type={type}
          onChange={(event) => {
            let newValue = event.target.value;
            if (type === 'tel') {
              newValue = formatSriLankanPhoneNumber(newValue);
            }
            onChange(newValue);
          }}
          placeholder={placeholder}
          inputMode={type === 'tel' ? 'numeric' : undefined}
          maxLength={type === 'tel' ? PHONE_NUMBER_MAX_LENGTH : undefined}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

function ProfileEditSelectTile({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-stone-900 focus:outline-none disabled:text-stone-400"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
