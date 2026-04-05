import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Plus, ShieldCheck, User, Edit, Trash2, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { profileService, type Profile } from '../../services/profile';
import { landownerMarketplaceService, type LandPlot } from '../../services/landownerMarketplace';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
};

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

interface PlotEditorState {
  isOpen: boolean;
  mode: 'create' | 'edit';
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
    nightAccess: null,
    forageEntries: [{ forage: '', bloomStartMonth: '', bloomEndMonth: '' }],
  });
  const [plotEditorMessage, setPlotEditorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPlot, setIsSavingPlot] = useState(false);

  useEffect(() => {
    profileService.get()
      .then((result) => {
        const p = result.user;
        setProfile(p);
        setEditName(p.name || '');
        setEditEmail(p.email || '');
        setEditPhone(p.phone || '');
        setEditProvince((p as any).province || '');
        setEditDistrict(p.district || '');
        setEditDsDivision((p as any).ds_division || '');
        setEditBusinessRegNo(p.business_reg_no || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPlotsVersion((value) => value + 1);
  }, [loading]);

  const plots = useMemo(() => {
    try {
      return landownerMarketplaceService.getPlots();
    } catch {
      return [];
    }
  }, [plotsVersion]);

  const districts = useMemo(() => getDistrictsByProvince(editProvince), [editProvince]);
  const dsDivisions = useMemo(() => getDsDivisionsByDistrict(editDistrict), [editDistrict]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'Member';
    const dt = new Date(profile.created_at);
    if (Number.isNaN(dt.getTime())) return 'Member';
    return `Member since ${dt.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
  }, [profile?.created_at]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditEmail(profile.email || '');
    setEditPhone(profile.phone || '');
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
        email: editEmail.trim(),
        phone: editPhone.trim(),
        district: editDistrict.trim(),
        province: editProvince.trim(),
        ds_division: editDsDivision.trim(),
        business_reg_no: editBusinessRegNo.trim(),
      });
      setProfile(updated);
      setIsEditingProfile(false);
      setSaveMessage('Profile updated successfully');
    } catch {
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
      nightAccess: null,
      forageEntries: [{ forage: '', bloomStartMonth: '', bloomEndMonth: '' }],
    });
    setPlotEditorMessage(null);
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
      gpsLatitude: String(plot.gpsLatitude || ''),
      gpsLongitude: String(plot.gpsLongitude || ''),
      totalAcreage: String(plot.totalAcreage || ''),
      waterAvailability: plot.waterAvailability,
      shadeProfile: plot.shadeProfile,
      vehicleAccess: plot.vehicleAccess,
      nightAccess: plot.nightAccess || null,
      forageEntries: (plot.forageEntries || []).map(entry => ({
        forage: entry.name,
        bloomStartMonth: entry.bloomStartMonth,
        bloomEndMonth: entry.bloomEndMonth,
      })),
    });
    setPlotEditorMessage(null);
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
      const payload = {
        name: plotEditor.name.trim(),
        province: plotEditor.province,
        district: plotEditor.district,
        dsDivision: plotEditor.dsDivision,
        gpsLatitude: plotEditor.gpsLatitude || undefined,
        gpsLongitude: plotEditor.gpsLongitude || undefined,
        totalAcreage: Number(plotEditor.totalAcreage),
        waterAvailability: plotEditor.waterAvailability,
        shadeProfile: plotEditor.shadeProfile,
        vehicleAccess: plotEditor.vehicleAccess,
        nightAccess: plotEditor.nightAccess,
        forageEntries: plotEditor.forageEntries.filter((entry) => entry.forage && entry.bloomStartMonth && entry.bloomEndMonth),
      };

      if (plotEditor.mode === 'edit' && plotEditor.plotId) {
        landownerMarketplaceService.updatePlot(plotEditor.plotId, payload as any);
        setPlotEditorMessage({ type: 'success', text: 'Plot updated successfully' });
      } else {
        landownerMarketplaceService.createPlot(payload as any);
        setPlotEditorMessage({ type: 'success', text: 'Plot created successfully' });
      }

      setPlotsVersion((v) => v + 1);
      setTimeout(() => closePlotEditor(), 1000);
    } catch (error: any) {
      setPlotEditorMessage({ type: 'error', text: error?.message || 'Failed to save plot' });
    } finally {
      setIsSavingPlot(false);
    }
  };

  const deletePlot = async (plotId: number) => {
    if (!window.confirm('Delete this plot? This cannot be undone.')) return;

    try {
      landownerMarketplaceService.deletePlot(plotId);
      setPlotEditorMessage({ type: 'success', text: 'Plot deleted successfully' });
      setPlotsVersion((v) => v + 1);
      closePlotEditor();
    } catch (error: any) {
      setPlotEditorMessage({ type: 'error', text: error?.message || 'Failed to delete plot' });
    }
  };

  const trustScore = 92;

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
              <div className="relative flex items-center justify-end">
                {!isEditingProfile ? (
                  <button
                    onClick={handleOpenEdit}
                    className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={isSaving}
                      className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-100">
                      <User className="h-6 w-6 text-stone-500" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h1 className="text-base font-bold leading-5 text-stone-900 break-words">{profile?.name || 'Landowner'}</h1>
                  <div className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Landowner
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{profile?.district || 'District not set'} · {memberSince}</p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                {!isEditingProfile ? (
                  <div className="space-y-2">
                    <ProfileInfoTile label="Name" value={profile?.name || '-'} />
                    <ProfileInfoTile label="Email" value={profile?.email || '-'} />
                    <ProfileInfoTile label="Phone" value={profile?.phone || '-'} />
                    <ProfileInfoTile label="Province" value={(profile as any)?.province || '-'} />
                    <ProfileInfoTile label="District" value={profile?.district || '-'} />
                    <ProfileInfoTile label="DS Division" value={(profile as any)?.ds_division || '-'} />
                    <ProfileInfoTile label="B. Registration" value={profile?.business_reg_no || '-'} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ProfileEditInputTile label="Name" value={editName} onChange={setEditName} placeholder="Enter name" />
                    <ProfileEditInputTile label="Email" value={editEmail} onChange={setEditEmail} placeholder="Enter email" type="email" />
                    <ProfileEditInputTile label="Phone" value={editPhone} onChange={setEditPhone} placeholder="Enter phone" type="tel" />
                    <ProfileEditSelectTile
                      label="Province"
                      value={editProvince}
                      onChange={(value) => {
                        setEditProvince(value);
                        setEditDistrict('');
                        setEditDsDivision('');
                      }}
                      options={PROVINCES as unknown as string[]}
                      placeholder="Select province"
                    />
                    <ProfileEditSelectTile
                      label="District"
                      value={editDistrict}
                      onChange={(value) => {
                        setEditDistrict(value);
                        setEditDsDivision('');
                      }}
                      options={districts}
                      placeholder="Select district"
                      disabled={!editProvince}
                    />
                    <ProfileEditSelectTile
                      label="DS Division"
                      value={editDsDivision}
                      onChange={setEditDsDivision}
                      options={dsDivisions}
                      placeholder="Select DS division"
                      disabled={!editDistrict}
                    />
                    <ProfileEditInputTile label="B. Registration" value={editBusinessRegNo} onChange={setEditBusinessRegNo} placeholder="Enter business registration" />
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

          {/* Trust Score Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Trust Score</p>
              <p className="text-lg font-bold text-emerald-900">{trustScore} / 100</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-emerald-100">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${trustScore}%` }} />
            </div>
            <p className="mt-2 text-sm text-emerald-900">3 KYC verified · 100% fulfilment rate</p>
          </div>

          {/* Land Plots Card */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">My Land Plots</p>
                <p className="mt-1 text-sm text-stone-600">{plots.length} plots linked</p>
              </div>
              <button
                onClick={() => navigate('/land-plots/new')}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {plots.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-2 py-2 text-center">
                  <p className="text-sm font-semibold text-stone-700">No plots added</p>
                  <p className="text-xs text-stone-500 mt-0.5">Add your first plot to attach to listings.</p>
                </div>
              )}

              {plots.map((plot) => (
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
                    <span>{plot.shadeProfile}</span>
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
                {plotEditor.mode === 'create' ? 'Add New Plot' : 'Edit Plot'}
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
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Plot Name *</label>
                <input
                  type="text"
                  value={plotEditor.name}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., South Mango Orchard"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Province *</label>
                <select
                  value={plotEditor.province}
                  onChange={(e) => {
                    setPlotEditor((prev) => ({ ...prev, province: e.target.value, district: '', dsDivision: '' }));
                  }}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
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
                  disabled={!plotEditor.province}
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
                  disabled={!plotEditor.district}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm disabled:bg-stone-100"
                >
                  <option value="">Select DS Division</option>
                  {getDsDivisionsByDistrict(plotEditor.district).map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Total Acreage *</label>
                <input
                  type="number"
                  step="0.1"
                  value={plotEditor.totalAcreage}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, totalAcreage: e.target.value }))}
                  placeholder="5.3"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Sun Exposure</label>
                <select
                  value={plotEditor.shadeProfile}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, shadeProfile: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                >
                  <option>Full Shade</option>
                  <option>Partial Shade</option>
                  <option>Full Sun</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Water Availability</label>
                <select
                  value={plotEditor.waterAvailability}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, waterAvailability: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                >
                  <option>On-site</option>
                  <option>Within 500m</option>
                  <option>Requires Manual Water</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600 mb-1">Vehicle Access</label>
                <select
                  value={plotEditor.vehicleAccess}
                  onChange={(e) => setPlotEditor((prev) => ({ ...prev, vehicleAccess: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                >
                  <option>Lorry</option>
                  <option>Tuk-tuk</option>
                  <option>Footpath</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={savePlot}
                  disabled={isSavingPlot}
                  className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSavingPlot ? 'Saving...' : 'Save Plot'}
                </button>
                <button
                  onClick={closePlotEditor}
                  className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>

              {plotEditor.mode === 'edit' && plotEditor.plotId && (
                <button
                  onClick={() => deletePlot(plotEditor.plotId!)}
                  className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Plot
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</span>
        <span className="text-sm font-semibold text-stone-900 text-right">{value}</span>
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
              newValue = formatPhoneNumber(newValue);
            }
            onChange(newValue);
          }}
          placeholder={placeholder}
          maxLength={type === 'tel' ? 15 : undefined}
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
