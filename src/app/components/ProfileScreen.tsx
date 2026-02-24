import { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, Edit2, Save, Loader2, Lock, Users, X, Camera, Key, LogOut, Shield, FileText, Download, ChevronRight } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="profile" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
          {loading ? <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> : profile && (
            <div className="px-4 py-5 space-y-4">
              {/* Profile Hero Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 h-20 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                </div>
                <div className="flex flex-col items-center -mt-10 pb-5 px-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-md transition-colors">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-stone-800 mt-3">{profile.name}</h2>
                  <span className="px-3 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold uppercase tracking-wider mt-1">{profile.role}</span>
                  
                  <div className="flex items-center gap-4 mt-3 text-[12px] text-stone-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" />{profile.district || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-500" />{profile.phone || 'N/A'}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</p>
                </div>
              </div>

              {/* Edit Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-stone-800">Profile Details</h3>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[12px] text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  ) : (
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-[12px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {[
                    { icon: <User className="w-4 h-4 text-amber-500" />, label: 'Full Name', field: 'name' as const, value: profile.name, editable: true },
                    { icon: <Mail className="w-4 h-4 text-blue-500" />, label: 'Email', field: 'email' as const, value: profile.email, editable: false },
                    { icon: <Phone className="w-4 h-4 text-emerald-500" />, label: 'Phone', field: 'phone' as const, value: profile.phone || 'Not set', editable: true },
                    { icon: <MapPin className="w-4 h-4 text-purple-500" />, label: 'District', field: 'district' as const, value: profile.district || 'Not set', editable: true },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-3 p-2.5 bg-stone-50/80 rounded-xl">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">{item.label}</p>
                        {editing && item.editable ? (
                          <input value={form[item.field]} onChange={e => setForm(p => ({ ...p, [item.field]: e.target.value }))} className="w-full bg-transparent text-[13px] text-stone-800 font-medium border-b border-amber-300 py-0.5 focus:border-amber-500 focus:outline-none" />
                        ) : (
                          <p className="text-[13px] text-stone-700 font-medium truncate">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                <h3 className="text-[13px] font-bold text-stone-800 mb-2">Account Actions</h3>
                
                <button onClick={() => setShowPasswordForm(true)} className="w-full flex items-center gap-3 p-3 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg"><Key className="w-4 h-4 text-blue-600" /></div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-stone-800">Change Password</p>
                    <p className="text-[10px] text-stone-400">Update your account password</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </button>

                {onManageHelpers && profile.role === 'beekeeper' && (
                  <button onClick={onManageHelpers} className="w-full flex items-center gap-3 p-3 bg-emerald-50/80 hover:bg-emerald-100 rounded-xl transition-colors">
                    <div className="p-2 bg-emerald-100 rounded-lg"><Users className="w-4 h-4 text-emerald-600" /></div>
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-semibold text-stone-800">Manage Helpers</p>
                      <p className="text-[10px] text-stone-400">Invite and manage your team</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </button>
                )}

                <button className="w-full flex items-center gap-3 p-3 bg-purple-50/80 hover:bg-purple-100 rounded-xl transition-colors">
                  <div className="p-2 bg-purple-100 rounded-lg"><Download className="w-4 h-4 text-purple-600" /></div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-stone-800">Export My Data</p>
                    <p className="text-[10px] text-stone-400">Download your beekeeping records</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-amber-50/80 hover:bg-amber-100 rounded-xl transition-colors">
                  <div className="p-2 bg-amber-100 rounded-lg"><Shield className="w-4 h-4 text-amber-600" /></div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-stone-800">Privacy & Security</p>
                    <p className="text-[10px] text-stone-400">Manage your data privacy</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </button>
              </div>

              {/* Sign Out */}
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-2xl transition-colors text-[13px] font-bold">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              {/* App Info */}
              <div className="text-center py-2">
                <p className="text-[11px] text-stone-400">ApiCore v1.0.0</p>
                <p className="text-[9px] text-stone-300 mt-0.5">Beekeeping Management System</p>
              </div>
            </div>
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm">
      <div className="bg-white w-full rounded-t-2xl p-5 shadow-xl">
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Key className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-[15px] font-bold text-stone-800">Change Password</h3>
          </div>
          <button onClick={onClose} className="p-1.5 bg-stone-100 rounded-full hover:bg-stone-200"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-emerald-600 font-semibold text-[14px]">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-red-500 text-[12px] bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <input type="password" value={f.currentPassword} onChange={e => setF(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Current Password"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
            <input type="password" value={f.newPassword} onChange={e => setF(p => ({ ...p, newPassword: e.target.value }))} placeholder="New Password"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
            <input type="password" value={f.confirmPassword} onChange={e => setF(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm New Password"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
            <button type="submit" disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-[13px] disabled:opacity-60 shadow-md shadow-amber-500/20 hover:shadow-lg transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
