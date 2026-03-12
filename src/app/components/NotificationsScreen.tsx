import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { notificationsService, type Notification } from '../services/notifications';
import { t } from '../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  isHelper?: boolean; onLogout: () => void;
}

export function NotificationsScreen({ selectedLanguage, onLanguageChange, onNavigate, isHelper, onLogout }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const user = authService.getLocalUser();

  const fetchNotifications = async () => { try { setNotifications(await notificationsService.getAll()); } catch {} setLoading(false); };
  useEffect(() => { fetchNotifications(); }, []);

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: number) => { await notificationsService.markAsRead(id); fetchNotifications(); };
  const handleDismiss = async (id: number) => { await notificationsService.dismiss(id); fetchNotifications(); };
  const handleMarkAllRead = async () => { await notificationsService.markAllRead(); fetchNotifications(); };



  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100 pb-24">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="notifications" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} lang={selectedLanguage} />

      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onViewAllNotifications={() => onNavigate('notifications')} />
        <div className="px-6 pb-4 border-t border-stone-100">
          <h1 className="text-2xl font-bold text-stone-800">{t('notifications', selectedLanguage)}</h1>
          <p className="text-stone-500 text-sm mt-1">{t('stayUpdated', selectedLanguage)}</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-800">{t('notifications', selectedLanguage)} {unreadCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}</h2>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-amber-600 font-medium flex items-center gap-1"><CheckCheck className="w-4 h-4" /> {t('readAll', selectedLanguage)}</button>
          )}
        </div>

        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${filter==='all' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>{t('all', selectedLanguage)} ({notifications.length})</button>
          <button onClick={() => setFilter('unread')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${filter==='unread' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>{t('unread', selectedLanguage)} ({unreadCount})</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          filtered.length === 0 ? (
            <div className="text-center py-12"><Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">{t('noNotifications', selectedLanguage)}</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(n => (
                <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm ${!n.is_read ? 'border-l-4 border-amber-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`text-sm ${!n.is_read ? 'font-bold text-stone-800' : 'text-stone-700'}`}>{n.title}</h3>
                      </div>
                      {n.message && <p className="text-xs text-stone-500 ml-6">{n.message}</p>}
                      <p className="text-xs text-stone-400 ml-6 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                      {!n.is_read && <button onClick={() => handleMarkRead(n.id)} className="p-1 hover:bg-stone-100 rounded" title="Mark read"><Check className="w-4 h-4 text-emerald-500" /></button>}
                      <button onClick={() => handleDismiss(n.id)} className="p-1 hover:bg-red-50 rounded" title="Dismiss"><X className="w-4 h-4 text-stone-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
