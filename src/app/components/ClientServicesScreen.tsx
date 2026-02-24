import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Phone, MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { clientsService, type ClientService } from '../services/clients';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

export function ClientServicesScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<ClientService | true | false>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const user = authService.getLocalUser();

  const fetchServices = async () => { try { setServices(await clientsService.getAll()); } catch {} setLoading(false); };
  useEffect(() => { fetchServices(); }, []);

  const filtered = services.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search && !s.client_name.toLowerCase().includes(search.toLowerCase()) && !s.service_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: number) => { if (!confirm('Delete?')) return; await clientsService.delete(id); fetchServices(); };

  const handleStatusChange = async (id: number, status: string) => {
    await clientsService.updateStatus(id, status);
    fetchServices();
  };

  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-amber-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="clients" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className="flex flex-col h-screen">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold">{services.length}</p><p className="text-[10px] text-stone-500">Total</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold text-amber-600">{services.filter(s=>s.status==='pending').length}</p><p className="text-[10px] text-stone-500">Pending</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold text-blue-600">{services.filter(s=>s.status==='in_progress').length}</p><p className="text-[10px] text-stone-500">Active</p></div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center"><p className="text-[15px] font-bold text-emerald-600">{services.filter(s=>s.status==='completed').length}</p><p className="text-[10px] text-stone-500">Done</p></div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" placeholder="Search..." /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors">
            <option value="all">All</option><option value="pending">Pending</option><option value="in_progress">Active</option><option value="completed">Done</option><option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button onClick={() => setShowForm(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> New Client Service</button>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          filtered.length === 0 ? <p className="text-center text-stone-500 py-8">No client services found</p> :
          <div className="space-y-3">{filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-[13px] font-bold text-stone-800">{s.client_name}</h3>
                  <p className="text-[12px] text-stone-600 capitalize">{s.service_type.replace('_',' ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusColors[s.status] || ''}`}>{s.status.replace('_',' ')}</span>
                  <button onClick={() => setShowForm(s)} className="p-1"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              {s.client_contact && <div className="flex items-center gap-1.5 text-[11px] text-stone-500"><span className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center"><Phone className="w-2.5 h-2.5 text-amber-500" /></span> {s.client_contact}</div>}
              {s.location && <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5"><span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center"><MapPin className="w-2.5 h-2.5 text-emerald-500" /></span> {s.location}</div>}
              {s.scheduled_date && <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5"><span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center"><Calendar className="w-2.5 h-2.5 text-blue-500" /></span> {new Date(s.scheduled_date).toLocaleDateString()}</div>}
              {s.notes && <p className="text-[11px] text-stone-500 mt-1">{s.notes}</p>}
              {s.status !== 'completed' && s.status !== 'cancelled' && (
                <div className="flex gap-2 mt-2">
                  {s.status === 'pending' && <button onClick={() => handleStatusChange(s.id, 'in_progress')} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Start</button>}
                  {s.status === 'in_progress' && <button onClick={() => handleStatusChange(s.id, 'completed')} className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">Complete</button>}
                  <button onClick={() => handleStatusChange(s.id, 'cancelled')} className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-lg">Cancel</button>
                </div>
              )}
            </div>
          ))}</div>
        }
      </div>
    </div>

      {showForm && <ClientServiceForm initial={showForm === true ? undefined : showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchServices(); }} />}
    </div>
  );
}

function ClientServiceForm({ initial, onClose, onSaved }: { initial?: ClientService; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    client_name: initial?.client_name || '', client_contact: initial?.client_contact || '', client_email: initial?.client_email || '',
    service_type: initial?.service_type || 'hive_inspection', location: initial?.location || '',
    scheduled_date: initial?.scheduled_date || '', payment_amount: initial?.payment_amount?.toString() || '',
    status: initial?.status || 'pending', notes: initial?.notes || ''
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!f.client_name) return; setSaving(true);
    try { const d: any = { ...f, payment_amount: f.payment_amount ? parseFloat(f.payment_amount) : null };
      if (initial) await clientsService.update(initial.id, d); else await clientsService.create(d); onSaved();
    } catch { setSaving(false); }
  };
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"><div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="text-[13px] font-bold text-stone-800">{initial ? 'Edit' : 'New'} Client Service</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <form onSubmit={submit} className="space-y-3">
        <input value={f.client_name} onChange={e=>setF(p=>({...p,client_name:e.target.value}))} placeholder="Client Name *" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <div className="grid grid-cols-2 gap-2">
          <input value={f.client_contact} onChange={e=>setF(p=>({...p,client_contact:e.target.value}))} placeholder="Phone" className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
          <input value={f.client_email} onChange={e=>setF(p=>({...p,client_email:e.target.value}))} placeholder="Email" type="email" className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        </div>
        <select value={f.service_type} onChange={e=>setF(p=>({...p,service_type:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors">
          <option value="hive_inspection">Hive Inspection</option><option value="swarm_removal">Swarm Removal</option><option value="colony_relocation">Colony Relocation</option>
          <option value="honey_extraction">Honey Extraction</option><option value="consultation">Consultation</option><option value="training">Training</option><option value="other">Other</option>
        </select>
        <input value={f.location} onChange={e=>setF(p=>({...p,location:e.target.value}))} placeholder="Location" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={f.scheduled_date} onChange={e=>setF(p=>({...p,scheduled_date:e.target.value}))} className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
          <input value={f.payment_amount} onChange={e=>setF(p=>({...p,payment_amount:e.target.value}))} placeholder="Amount (Rs.)" type="number" className="border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        </div>
        <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Notes" rows={2} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] bg-stone-50 focus:border-amber-400 focus:bg-white focus:outline-none transition-colors" />
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 py-2.5 rounded-2xl text-[13px] font-bold disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div></div>
  );
}
