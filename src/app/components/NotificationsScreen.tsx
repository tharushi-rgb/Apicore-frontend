import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Filter } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { authService } from '../services/auth';
import { notificationsService, type Notification } from '../services/notifications';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

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

  // ...existing code...
  const typeIcons: Record<string, string> = { alert: '⚠️', info: 'ℹ️', success: '✅', warning: '🔔', error: '❌' };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 text-stone-800 font-sans">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="notifications" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      
      <div className={`flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'ml-72' : ''} h-screen`}>
        <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
          isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="px-4 py-6 space-y-4 flex-1 overflow-y-auto pb-20">
          <div className="flex items-center justify-between">
// ...existing code...

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100">
      <MobileSidebar isOpen={isSidebarOpen} activeTab="notifications" onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} />
      <MobileHeader userName={user?.name} district={user?.district} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-800">Notifications {unreadCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}</h2>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-amber-600 font-medium flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Read All</button>
          )}
        </div>

        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${filter==='all' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>All ({notifications.length})</button>
          <button onClick={() => setFilter('unread')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${filter==='unread' ? 'bg-amber-500 text-white' : 'text-stone-600'}`}>Unread ({unreadCount})</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          filtered.length === 0 ? (
            <div className="text-center py-12"><Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No notifications</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(n => (
                <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm ${!n.is_read ? 'border-l-4 border-amber-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{typeIcons[n.notification_type] || '🔔'}</span>
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
