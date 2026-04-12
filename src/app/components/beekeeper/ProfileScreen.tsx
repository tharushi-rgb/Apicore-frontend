import { useRef, useState, useEffect, useMemo, type ChangeEvent } from 'react';
import {
  User,
  X,
  Edit,
  Camera,
  MapPinned,
  Phone,
  Mail,
  Key,
  LogOut,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';
import { profileService, type Profile } from '../../services/profile';
import { apiariesService } from '../../services/apiaries';
import { hivesService } from '../../services/hives';
import { PROVINCES, getDistrictsByProvince, getDsDivisionsByDistrict } from '../../constants/sriLankaLocations';
import { t } from '../../i18n';

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

export function ProfileScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editDsDivision, setEditDsDivision] = useState('');
  const [stats, setStats] = useState({ apiaries: 0, hives: 0, clients: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'profile';
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const districts = useMemo(() => getDistrictsByProvince(editProvince), [editProvince]);
  const dsDivisions = useMemo(() => getDsDivisionsByDistrict(editDistrict), [editDistrict]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'Member';
    const dt = new Date(profile.created_at);
    if (Number.isNaN(dt.getTime())) return 'Member';
    return `Member since ${dt.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
  }, [profile?.created_at]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, apis, hivs] = await Promise.all([
          profileService.get(),
          apiariesService.getAll(),
          hivesService.getAll(),
        ]);
        const profile = p.user;
        setProfile(profile);
        setEditName(profile.name || '');
        setEditEmail(profile.email || '');
        setEditPhone(profile.phone || '');
        setEditProvince((profile as any).province || '');
        setEditDistrict(profile.district || '');
        setEditDsDivision((profile as any).ds_division || '');
        setStats({ apiaries: apis.length, hives: hivs.length, clients: 0 });
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      setProfile(updated);
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
    setEditPhone(profile.phone || '');
    setEditProvince((profile as any).province || '');
    setEditDistrict(profile.district || '');
    setEditDsDivision((profile as any).ds_division || '');
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
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const updated = await profileService.update({
        name: editName.trim(),
        phone: editPhone.trim(),
        district: editDistrict.trim(),
        province: editProvince.trim(),
        ds_division: editDsDivision.trim(),
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

  const handleSignOut = () => {
    authService.logout();
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-stone-50 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={profile?.name || user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          activeTab={activeTab} onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
      </div>

      {showPasswordForm && <PasswordModal onClose={() => setShowPasswordForm(false)} />}

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto">
        <section className="px-4 pt-4">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {/* Tab Toggle */}
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-1">
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
                    {t('editt', selectedLanguage)}
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

                {/* Camera icon */}
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
                  Beekeeper
                </p>

                <div className="mt-1 space-y-1 text-sm text-stone-600">

                  <div className="flex items-center gap-2">
                    <MapPinned className="w-4 h-4" />
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

              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  {t('verified', selectedLanguage)}
                </div>
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ProfileEditInputTile label={t('name', selectedLanguage)} value={editName} onChange={setEditName} placeholder={t('enterName', selectedLanguage)} />
                    {/* <ProfileEditInputTile
                      label={t('email', selectedLanguage)}
                      value={editEmail}
                      onChange={setEditEmail}
                      placeholder={t('enterEmail', selectedLanguage)}
                      type="email"
                      disabled={true}
                    /> */}
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

        <div className="space-y-4 px-4 pb-6 mt-4">
          {saveMessage && (
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${saveMessage.includes('Failed') ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {saveMessage}
            </p>
          )}

          {/* Beekeeping Stats Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">{t('beekeepingOverview', selectedLanguage)}</p>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">{t('apiaries', selectedLanguage)}</span>
                <span className="font-semibold text-amber-900">{stats.apiaries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">{t('hives', selectedLanguage)}</span>
                <span className="font-semibold text-amber-900">{stats.hives}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">{t('planning', selectedLanguage)}</span>
                <span className="font-semibold text-amber-900">0</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-amber-100/50 p-2">
              <p className="text-xs text-amber-800">
                Your beekeeping overview shows your current apiaries, hives, and planning activities.
                Add more apiaries to expand your beekeeping operations.
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-3">{t('accountActions', selectedLanguage)}</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-stone-800">{t('changePassword', selectedLanguage)}</p>
                </div>
                <span className="text-sm text-stone-400">›</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700">{t('signOut', selectedLanguage)}</p>
                </div>
                <span className="text-sm text-red-400">›</span>
              </button>
            </div>
          </div>

          {/* App Version */}
          <div className="text-center py-4">
            <p className="text-[0.75rem] text-stone-500">ApiCore v1.0.0</p>
            <p className="text-[0.7rem] text-stone-400 mt-1">{t('beekeepingMgmtSystem', selectedLanguage)}</p>
          </div>
        </div>
      </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
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
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'tel') {
      onChange(formatPhoneNumber(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</span>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={type === 'tel' ? 15 : undefined}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

function ProfileEditSelectTile({ label, value, onChange, options, placeholder, disabled = false }: {
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
          onChange={(e) => onChange(e.target.value)}
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

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.newPassword !== f.confirmPassword) { setError('Passwords do not match'); return; }
    if (f.newPassword.length < 6) { setError('Min 6 characters'); return; }
    setSaving(true); setError('');
    try { await profileService.changePassword(f.currentPassword, f.newPassword); setSuccess(true); setTimeout(onClose, 1500); } catch (e: any) { setError(e.message || 'Failed'); setSaving(false); }
  };
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">{t('changePassword', 'en')}</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        {success ? <p className="text-emerald-600 text-center py-4">{t('passwordChangedSuccess', 'en')}</p> :
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input type="password" value={f.currentPassword} onChange={e => setF(p => ({ ...p, currentPassword: e.target.value }))} placeholder={t('currentPasswordLabel', 'en')} className="w-full border rounded-xl px-3 py-2 text-sm" />
          <input type="password" value={f.newPassword} onChange={e => setF(p => ({ ...p, newPassword: e.target.value }))} placeholder={t('newPasswordLabel', 'en')} className="w-full border rounded-xl px-3 py-2 text-sm" />
          <input type="password" value={f.confirmPassword} onChange={e => setF(p => ({ ...p, confirmPassword: e.target.value }))} placeholder={t('confirmNewPassword', 'en')} className="w-full border rounded-xl px-3 py-2 text-sm" />
          <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Change Password'}</button>
        </form>}
      </div>
    </div>
  );
}
