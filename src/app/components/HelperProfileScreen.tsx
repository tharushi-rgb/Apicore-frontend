import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Key, LogOut, X, Camera } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { HelperSidebar, type HelperNavTab } from './HelperSidebar';
import { authService } from '../services/auth';
import { profileService, type Profile } from '../services/profile';

type Language = 'en' | 'si' | 'ta';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: HelperNavTab) => void; onLogout: () => void;
}

export function HelperProfileScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const user = authService.getLocalUser();

  useEffect(() => {
    profileService.get().then(p => setProfile(p.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditPhone(profile.phone || '');
    setEditDistrict(profile.district || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileService.update({ name: editName.trim(), phone: editPhone.trim(), district: editDistrict.trim() });
      setProfile(updated);
      setShowEditModal(false);
    } catch { alert('Failed to update profile'); }
    setSaving(false);
  };

  return (
    <div className="h-full bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 relative">
      <HelperSidebar isOpen={isSidebarOpen} activeTab="profile" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowEditModal(false)}>
          <div className="absolute top-20 right-4 left-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">District</label>
                <input type="text" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}

      <div className="h-full overflow-y-auto pb-8">
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
            isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => navigate('/helper/notifications')} />
          <div className="px-6 pb-4 border-t border-stone-100">
            <h1 className="text-2xl font-bold text-stone-800">My Profile</h1>
            <p className="text-stone-500 text-sm mt-1">Helper Account</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="px-4 py-6 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-stone-800">{profile?.name || 'Helper'}</h2>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full capitalize">{profile?.role || 'helper'}</span>
                </div>
                <button onClick={handleOpenEdit} className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  <Key className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700">{profile?.email || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700">{profile?.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700">{profile?.district || 'Not set'}</span>
                </div>
              </div>
              <button onClick={handleOpenEdit} className="w-full mt-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-stone-800">Account</h3>
              <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Key className="w-5 h-5 text-blue-600" /></div>
                  <p className="font-medium text-stone-800">Change Password</p>
                </div>
                <span className="text-stone-400">›</span>
              </button>
              <button onClick={onLogout} className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border-2 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><LogOut className="w-5 h-5 text-red-600" /></div>
                  <p className="font-medium text-red-700">Sign Out</p>
                </div>
                <span className="text-red-400">›</span>
              </button>
            </div>

            <div className="text-center py-2">
              <p className="text-sm text-stone-500">ApiCore v1.0.0 — Helper</p>
            </div>
          </div>
        )}
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
    try { await profileService.changePassword(f.currentPassword, f.newPassword); setSuccess(true); setTimeout(onClose, 1500); }
    catch (e: any) { setError(e.message || 'Failed'); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">Change Password</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        {success ? <p className="text-emerald-600 text-center py-4">Password changed!</p> :
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="password" value={f.currentPassword} onChange={e => setF(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Current Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input type="password" value={f.newPassword} onChange={e => setF(p => ({ ...p, newPassword: e.target.value }))} placeholder="New Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input type="password" value={f.confirmPassword} onChange={e => setF(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm New Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button type="submit" disabled={saving} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Change Password'}</button>
          </form>}
      </div>
    </div>
  );
}
