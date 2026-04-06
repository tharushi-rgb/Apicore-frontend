import { useRef, useState, useEffect, type ChangeEvent } from 'react';
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
} from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { PageTitleBar } from '../shared/PageTitleBar';
import { authService } from '../../services/auth';
import { profileService, type Profile } from '../../services/profile';
import { apiariesService } from '../../services/apiaries';
import { hivesService } from '../../services/hives';
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
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
}

interface NotificationSettings {
  queenAge: boolean;
  pestDetection: boolean;
  inspectionReminders: boolean;
  contractExpiry: boolean;
}

export function ProfileScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [stats, setStats] = useState({ apiaries: 0, hives: 0, clients: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    queenAge: true, pestDetection: true, inspectionReminders: true, contractExpiry: true,
  });
  const user = authService.getLocalUser();
  const activeTab: NavTab = 'profile';
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, apis, hivs] = await Promise.all([
          profileService.get(),
          apiariesService.getAll(),
          hivesService.getAll(),
        ]);
        setProfile(p.user);
        setStats({ apiaries: apis.length, hives: hivs.length, clients: 0 });
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditEmail(profile.email || '');
    setEditPhone(profile.phone || '');
    setEditDistrict(profile.district || '');
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updated = await profileService.update({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        district: editDistrict.trim(),
      });
      setProfile(updated);
      setShowEditProfile(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSavingProfile(false);
    }
  };

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
    try {
      const imageUrl = await fileToDataUrl(file);
      const updated = await profileService.update({ avatar_url: imageUrl });
      setProfile(updated);
      setMessage({ type: 'success', text: 'Profile photo updated' });
    } catch (error) {
      console.error('Failed to update profile photo', error);
      setMessage({ type: 'error', text: 'Failed to update profile photo' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleToggleNotification = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
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
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50 relative">

      {/* Message Display */}
      {message && (
        <div className={`absolute top-2 left-4 right-4 z-50 rounded-lg px-3 py-2 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowEditProfile(false)}>
          <div className="absolute top-20 right-4 left-4 max-w-sm mx-auto bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.95rem] font-bold text-stone-800">{t('editProfile', selectedLanguage)}</h2>
              <button onClick={() => setShowEditProfile(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-medium text-stone-700 mb-1.5">{t('name', selectedLanguage)}</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-stone-700 mb-1.5">{t('email', selectedLanguage)}</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-stone-700 mb-1.5">{t('phone', selectedLanguage)}</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(formatPhoneNumber(e.target.value))} maxLength={15} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-stone-700 mb-1.5">{t('district', selectedLanguage)}</label>
                <input type="text" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-amber-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditProfile(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-medium">{t('cancel', selectedLanguage)}</button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium disabled:opacity-70">
                {isSavingProfile ? t('saving', selectedLanguage) : t('saveChanges', selectedLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordForm && <PasswordModal onClose={() => setShowPasswordForm(false)} />}

      <div className="h-full overflow-y-auto pb-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            activeTab={activeTab} onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
          <PageTitleBar title={t('profile', selectedLanguage)} subtitle={t('yourAccount', selectedLanguage)} />
        </div>

        <div className="px-2 py-2 space-y-2">
          {/* Compact Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-4 relative">
            <button onClick={handleOpenEdit} className="absolute top-3 right-3 p-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" aria-label="Edit profile">
              <Edit className="w-4 h-4 text-amber-700" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.name || 'Profile'} className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-70"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-stone-800">{profile?.name || 'User'}</h2>
                <p className="text-amber-600 text-xs font-medium capitalize">{profile?.role || 'beekeeper'}</p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 text-stone-600">
                  <div className="flex items-center gap-2"><MapPinned className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs">{profile?.district || t('notSet', selectedLanguage)}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs">{profile?.phone || t('notSet', selectedLanguage)}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs truncate">{profile?.email || t('notSet', selectedLanguage)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Beekeeping Overview */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-stone-800 px-1">{t('beekeepingOverview', selectedLanguage)}</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label={t('apiaries', selectedLanguage)} value={stats.apiaries.toString()} color="emerald" />
              <StatCard label={t('hives', selectedLanguage)} value={stats.hives.toString()} color="amber" />
              <StatCard label={t('findingLand', selectedLanguage)} value={stats.clients.toString()} color="purple" />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-1">{t('notificationSettings', selectedLanguage)}</h3>
            <p className="text-xs text-stone-600 mb-3">{t('chooseAlerts', selectedLanguage)}</p>
            <div className="space-y-3">
              <ToggleSetting label={t('queenAgeAlerts', selectedLanguage)} description={t('queenReplaceDesc', selectedLanguage)} checked={notificationSettings.queenAge} onChange={() => handleToggleNotification('queenAge')} />
              <ToggleSetting label={t('pestAlerts', selectedLanguage)} description={t('pestActivityDesc', selectedLanguage)} checked={notificationSettings.pestDetection} onChange={() => handleToggleNotification('pestDetection')} />
              <ToggleSetting label={t('inspectionReminders', selectedLanguage)} description={t('inspScheduleDesc', selectedLanguage)} checked={notificationSettings.inspectionReminders} onChange={() => handleToggleNotification('inspectionReminders')} />
              <ToggleSetting label={t('contractAlerts', selectedLanguage)} description={t('contractExpiryDesc', selectedLanguage)} checked={notificationSettings.contractExpiry} onChange={() => handleToggleNotification('contractExpiry')} />
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3">{t('accountActions', selectedLanguage)}</h3>
            <div className="space-y-2.5">
              <button onClick={() => setShowPasswordForm(true)} className="w-full flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Key className="w-4 h-4 text-blue-600" /></div>
                  <p className="text-sm font-medium text-stone-800">{t('changePassword', selectedLanguage)}</p>
                </div>
                <span className="text-sm text-stone-400">›</span>
              </button>
              <button onClick={handleSignOut} className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><LogOut className="w-4 h-4 text-red-600" /></div>
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

function StatCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'amber' | 'purple' }) {
  const colorClasses = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', accent: 'bg-purple-500' },
  };
  const c = colorClasses[color];
  return (
    <div className={`${c.bg} rounded-lg p-2.5 shadow-sm relative`}>
      <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-lg ${c.accent}`} />
      <p className="text-stone-600 text-[10px] mb-0.5 leading-tight">{label}</p>
      <p className={`text-[1rem] font-bold ${c.text} leading-none`}>{value}</p>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200 last:border-0 last:pb-0">
      <div className="flex-1">
        <p className="text-[0.8rem] font-medium text-stone-800 mb-0.5">{label}</p>
        <p className="text-[0.7rem] text-stone-500">{description}</p>
      </div>
      <button onClick={onChange} className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-stone-300'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
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
