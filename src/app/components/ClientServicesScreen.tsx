import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Phone, MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { PageTitleBar } from './PageTitleBar';
import { authService } from '../services/auth';
import { t } from '../i18n';
import { clientsService, type ClientService } from '../services/clients';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void; onLogout: () => void;
}

export function ClientServicesScreen({ selectedLanguage, onLanguageChange, onNavigate, onLogout }: Props) {
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

  const handleDelete = async (id: number) => { if (!confirm(t('deleteQ', selectedLanguage))) return; await clientsService.delete(id); fetchServices(); };

  const handleStatusChange = async (id: number, status: string) => {
    await clientsService.updateStatus(id, status);
    fetchServices();
  };

  const statusIcons: Record<string, any> = { pending: <Clock className="w-4 h-4 text-amber-500" />, in_progress: <Clock className="w-4 h-4 text-blue-500" />, completed: <CheckCircle className="w-4 h-4 text-emerald-500" />, cancelled: <XCircle className="w-4 h-4 text-red-500" /> };
  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24 relative overflow-hidden">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        activeTab="clients" onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} />
        <PageTitleBar title={t('clients', selectedLanguage)} subtitle={t('manageClientRequests', selectedLanguage)} />
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-center"><p className="text-[0.98rem] font-bold text-stone-900">{services.length}</p><p className="text-[0.64rem] font-medium text-stone-600">{t('total', selectedLanguage)}</p></div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-center"><p className="text-[0.98rem] font-bold text-amber-900">{services.filter(s=>s.status==='pending').length}</p><p className="text-[0.64rem] font-medium text-amber-700">{t('pending', selectedLanguage)}</p></div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-center"><p className="text-[0.98rem] font-bold text-blue-900">{services.filter(s=>s.status==='in_progress').length}</p><p className="text-[0.64rem] font-medium text-blue-700">{t('active', selectedLanguage)}</p></div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-center"><p className="text-[0.98rem] font-bold text-emerald-900">{services.filter(s=>s.status==='completed').length}</p><p className="text-[0.64rem] font-medium text-emerald-700">{t('done', selectedLanguage)}</p></div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none" placeholder={t('search', selectedLanguage)} /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm">
            <option value="all">{t('all', selectedLanguage)}</option><option value="pending">{t('pending', selectedLanguage)}</option><option value="in_progress">{t('active', selectedLanguage)}</option><option value="completed">{t('done', selectedLanguage)}</option><option value="cancelled">{t('cancelled', selectedLanguage)}</option>
          </select>
        </div>

        <button onClick={() => setShowForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-[0.86rem] font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> {t('newClientService', selectedLanguage)}</button>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          filtered.length === 0 ? <p className="text-center text-stone-500 py-8">{t('noClientServices', selectedLanguage)}</p> :
          <div className="space-y-3">{filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-3 border border-stone-200 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-[0.88rem] text-stone-800">{s.client_name}</h3>
                  <p className="text-[0.75rem] text-stone-600 capitalize">{s.service_type.replace('_',' ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded text-[0.68rem] font-medium ${statusColors[s.status] || ''}`}>{s.status.replace('_',' ')}</span>
                  <button onClick={() => setShowForm(s)} className="p-1"><Edit2 className="w-3.5 h-3.5 text-stone-500" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              {s.client_contact && <div className="flex items-center gap-1 text-xs text-stone-500"><Phone className="w-3 h-3" /> {s.client_contact}</div>}
              {s.location && <div className="flex items-center gap-1 text-xs text-stone-500"><MapPin className="w-3 h-3" /> {s.location}</div>}
              {s.scheduled_date && <div className="flex items-center gap-1 text-xs text-stone-500"><Calendar className="w-3 h-3" /> {new Date(s.scheduled_date).toLocaleDateString()}</div>}
              {s.notes && <p className="text-xs text-stone-500 mt-1">{s.notes}</p>}
              {s.status !== 'completed' && s.status !== 'cancelled' && (
                <div className="flex gap-2 mt-2">
                  {s.status === 'pending' && <button onClick={() => handleStatusChange(s.id, 'in_progress')} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{t('start', selectedLanguage)}</button>}
                  {s.status === 'in_progress' && <button onClick={() => handleStatusChange(s.id, 'completed')} className="text-[0.68rem] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">{t('complete', selectedLanguage)}</button>}
                  <button onClick={() => handleStatusChange(s.id, 'cancelled')} className="text-[0.68rem] bg-red-50 text-red-600 px-2 py-1 rounded-lg">{t('cancel', selectedLanguage)}</button>
                </div>
              )}
            </div>
          ))}</div>
        }
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl flex flex-col max-h-[88vh]">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-bold text-sm text-stone-800">{initial ? t('editClientService', 'en') : t('newClientService', 'en')}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          <form onSubmit={submit} className="space-y-2.5">
            <input value={f.client_name} onChange={e=>setF(p=>({...p,client_name:e.target.value}))} placeholder={`${t('clientName', 'en')} *`} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={f.client_contact} onChange={e=>setF(p=>({...p,client_contact:e.target.value}))} placeholder={t('phone', 'en')} className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              <input value={f.client_email} onChange={e=>setF(p=>({...p,client_email:e.target.value}))} placeholder={t('email', 'en')} type="email" className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <select value={f.service_type} onChange={e=>setF(p=>({...p,service_type:e.target.value}))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
              <option value="hive_inspection">{t('hiveInspection', 'en')}</option><option value="swarm_removal">{t('swarmRemoval', 'en')}</option><option value="colony_relocation">{t('colonyRelocation', 'en')}</option>
              <option value="honey_extraction">{t('honeyExtraction', 'en')}</option><option value="consultation">{t('consultation', 'en')}</option><option value="training">{t('training', 'en')}</option><option value="other">{t('other', 'en')}</option>
            </select>
            <input value={f.location} onChange={e=>setF(p=>({...p,location:e.target.value}))} placeholder={t('locationLabel', 'en')} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={f.scheduled_date} onChange={e=>setF(p=>({...p,scheduled_date:e.target.value}))} className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              <input value={f.payment_amount} onChange={e=>setF(p=>({...p,payment_amount:e.target.value}))} placeholder={t('amountRs', 'en')} type="number" className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder={t('notes', 'en')} rows={2} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <button type="submit" disabled={saving} className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? t('saving', 'en') : t('save', 'en')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
