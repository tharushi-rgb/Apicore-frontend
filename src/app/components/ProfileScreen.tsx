import { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, Edit2, Save, Loader2, Lock, Users, X } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onManageHelpers?: () => void; onLogout: () => void;
}

export function ProfileScreen({ selectedLanguage, onLanguageChange, onNavigate, onManageHelpers, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', district: '' });
  const user = authService.getLocalUser();

  useEffect(() => {
    profileService.get().then(p => { setProfile(p.user); setForm({ name: p.user.name || '', email: p.user.email || '', phone: p.user.phone || '', district: p.user.district || '' }); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { const updated = await profileService.update(form); setProfile(updated); setEditing(false); } catch {}
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-8">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="profile" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-3 py-4 space-y-3 flex-1 overflow-y-auto pb-16">
          {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-7 w-7 border-3 border-amber-500 border-t-transparent rounded-full" /></div> : profile && (
            <>
            {/* Profile Avatar */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-200/40">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-base font-bold text-stone-800">{profile.name}</h2>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{profile.role}</span>
            </div>

            {/* Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-800 text-xs">📋 Profile Details</h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold"><Edit2 className="w-3 h-3" /> Edit</button>
                ) : (
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 bg-stone-50 rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-blue-600" /></div>
                  {editing ? <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className="flex-1 bg-transparent border-b border-stone-200 py-0.5 text-xs focus:border-amber-500 focus:outline-none" /> :
                    <span className="text-xs text-stone-700">{profile.name}</span>}
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-stone-50 rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-purple-600" /></div>
                  <span className="text-xs text-stone-700">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-stone-50 rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-emerald-600" /></div>
                  {editing ? <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} className="flex-1 bg-transparent border-b border-stone-200 py-0.5 text-xs focus:border-amber-500 focus:outline-none" placeholder="Phone" /> :
                    <span className="text-xs text-stone-700">{profile.phone || 'Not set'}</span>}
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-stone-50 rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-orange-600" /></div>
                  {editing ? <input value={form.district} onChange={e => setForm(p=>({...p,district:e.target.value}))} className="flex-1 bg-transparent border-b border-stone-200 py-0.5 text-xs focus:border-amber-500 focus:outline-none" placeholder="District" /> :
                    <span className="text-xs text-stone-700">{profile.district || 'Not set'}</span>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => setShowPasswordForm(true)} className="w-full bg-white/80 border border-stone-200 py-2.5 rounded-xl font-medium text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 text-xs">
                <Lock className="w-4 h-4 text-amber-500" /> Change Password
              </button>
              {onManageHelpers && profile.role === 'beekeeper' && (
                <button onClick={onManageHelpers} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-200/40">
                  <Users className="w-4 h-4" /> Manage Helpers
                </button>
              )}
              <button onClick={onLogout} className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-medium hover:bg-red-100 text-xs border border-red-100">Logout</button>
            </div>
          </>
        )}
      </div>

      {showPasswordForm && <PasswordModal onClose={() => setShowPasswordForm(false)} />}
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5">
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-stone-800">Change Password</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      {success ? <p className="text-emerald-600 text-center py-4">Password changed successfully!</p> :
      <form onSubmit={submit} className="space-y-3">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="password" value={f.currentPassword} onChange={e=>setF(p=>({...p,currentPassword:e.target.value}))} placeholder="Current Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input type="password" value={f.newPassword} onChange={e=>setF(p=>({...p,newPassword:e.target.value}))} placeholder="New Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input type="password" value={f.confirmPassword} onChange={e=>setF(p=>({...p,confirmPassword:e.target.value}))} placeholder="Confirm New Password" className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Change Password'}</button>
      </form>}
    </div></div>
  );
}
