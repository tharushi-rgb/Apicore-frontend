import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Users, Hexagon as HiveIcon, Copy, Check, Trash2, X, Loader2 } from 'lucide-react';
import { helpersService } from '../services/helpers';
import { hivesService, type Hive } from '../services/hives';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  onBack: () => void; onLogout: () => void;
}

interface HelperInvitation { id: number; token: string; status: string; created_at: string; expires_at: string; }
interface Helper { id: number; name: string; email: string; }
interface Assignment { id: number; hive_id: number; helper_id: number; hive_name?: string; helper_name?: string; }

export function ManageHelpersScreen({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'helpers' | 'invite' | 'assign'>('helpers');
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [invitations, setInvitations] = useState<HelperInvitation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite states
  const [inviting, setInviting] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Assign states
  const [selectedHelper, setSelectedHelper] = useState('');
  const [selectedHive, setSelectedHive] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchAll = async () => {
    try {
      const [h, inv, hv] = await Promise.all([
        helpersService.getHelpers(), helpersService.getInvitations(), hivesService.getAll()
      ]);
      setHelpers(h); setInvitations(inv); setHives(hv);
      // Fetch assignments for all helpers
      const allAssignments: Assignment[] = [];
      for (const helper of h) {
        try {
          const a = await helpersService.getAssignments(helper.id);
          allAssignments.push(...a.map((x: any) => ({ ...x, helper_name: helper.name })));
        } catch {}
      }
      setAssignments(allAssignments);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try { const res = await helpersService.invite(inviteEmail); setNewToken((res as any).data?.token || ''); setInviteEmail(''); fetchAll(); } catch {}
    setInviting(false);
  };

  const copyToken = () => { navigator.clipboard.writeText(newToken); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleAssign = async () => {
    if (!selectedHelper || !selectedHive) return;
    setAssigning(true);
    try { await helpersService.assignHive(parseInt(selectedHelper), parseInt(selectedHive)); setSelectedHelper(''); setSelectedHive(''); fetchAll(); } catch {}
    setAssigning(false);
  };

  const handleRevoke = async (assignmentId: number) => {
    if (!confirm('Revoke this assignment?')) return;
    await helpersService.revokeAssignment(assignmentId);
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-stone-700" /></button>
        <h1 className="text-lg font-bold text-stone-800">Manage Helpers</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button onClick={() => setActiveTab('helpers')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='helpers' ? 'bg-emerald-500 text-white' : 'text-stone-600'}`}>Helpers</button>
          <button onClick={() => setActiveTab('invite')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='invite' ? 'bg-emerald-500 text-white' : 'text-stone-600'}`}>Invite</button>
          <button onClick={() => setActiveTab('assign')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab==='assign' ? 'bg-emerald-500 text-white' : 'text-stone-600'}`}>Assign</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div> : (
          <>
            {/* Helpers Tab */}
            {activeTab === 'helpers' && (
              <div className="space-y-3">
                {helpers.length === 0 ? (
                  <div className="text-center py-8"><Users className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No helpers yet</p><p className="text-stone-400 text-sm">Invite helpers to get started</p></div>
                ) : helpers.map(h => (
                  <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-stone-800">{h.name}</h3>
                    <p className="text-sm text-stone-500">{h.email}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Invite Tab */}
            {activeTab === 'invite' && (
              <div className="space-y-4">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Helper's email address" type="email" className="w-full border rounded-xl px-3 py-2 text-sm" />
                <button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />} Generate Invitation Token
                </button>

                {newToken && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-700 mb-2">Share this token with your helper:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded-lg text-lg font-mono font-bold text-emerald-800 text-center tracking-widest">{newToken}</code>
                      <button onClick={copyToken} className="p-2 bg-emerald-500 text-white rounded-lg">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-bold text-stone-800">Invitations</h3>
                  {invitations.length === 0 ? <p className="text-stone-500 text-sm">No invitations</p> :
                    invitations.map(inv => (
                      <div key={inv.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                        <div><code className="text-sm font-mono">{inv.token}</code><p className="text-xs text-stone-500 capitalize">{inv.status}</p></div>
                        <span className="text-xs text-stone-400">{new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Assign Tab */}
            {activeTab === 'assign' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-stone-800">Assign Hive to Helper</h3>
                  <select value={selectedHelper} onChange={e => setSelectedHelper(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                    <option value="">Select Helper</option>{helpers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <select value={selectedHive} onChange={e => setSelectedHive(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                    <option value="">Select Hive</option>{hives.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  <button onClick={handleAssign} disabled={assigning || !selectedHelper || !selectedHive} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">
                    {assigning ? 'Assigning...' : 'Assign Hive'}
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-stone-800">Current Assignments</h3>
                  {assignments.length === 0 ? <p className="text-stone-500 text-sm">No assignments</p> :
                    assignments.map(a => (
                      <div key={a.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                        <div><p className="text-sm font-medium text-stone-800">{a.helper_name || `Helper #${a.helper_id}`}</p><p className="text-xs text-stone-500">→ {a.hive_name || `Hive #${a.hive_id}`}</p></div>
                        <button onClick={() => handleRevoke(a.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
