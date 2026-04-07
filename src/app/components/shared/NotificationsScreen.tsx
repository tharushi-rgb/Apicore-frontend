import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { MobileHeader } from './MobileHeader';
import { authService } from '../../services/auth';
import { notificationsService, type Notification } from '../../services/notifications';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language; onLanguageChange: (lang: Language) => void; onNavigate: (tab: NavTab) => void;
  isHelper?: boolean; onLogout: () => void;
}

export function NotificationsScreen({ selectedLanguage, onLanguageChange, onNavigate, isHelper, onLogout }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getLocalUser();
  const isLandowner = user?.role === 'landowner';
  const pageGradient = isLandowner
    ? 'bg-gradient-to-b from-emerald-50 via-green-50 to-lime-100'
    : 'bg-gradient-to-b from-amber-50 via-emerald-50 to-amber-100';
  const accentText = isLandowner ? 'text-emerald-700' : 'text-amber-600';
  const accentBg = isLandowner ? 'bg-emerald-600' : 'bg-amber-500';
  const accentBorder = isLandowner ? 'border-emerald-500' : 'border-amber-500';

  const fetchNotifications = async () => {
    try {
      setNotifications(await notificationsService.getAll());
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: number) => { await notificationsService.markAsRead(id); fetchNotifications(); };
  const handleDismiss = async (id: number) => { await notificationsService.dismiss(id); fetchNotifications(); };
  const handleMarkAllRead = async () => { await notificationsService.markAllRead(); fetchNotifications(); };



  return (
    <div className={`h-screen overflow-y-auto ${pageGradient}`}>
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <MobileHeader userName={user?.name} roleLabel={user?.role} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange}
        activeTab="notifications" onNavigate={onNavigate} onLogout={onLogout} onViewAllNotifications={() => onNavigate('notifications')} role={isLandowner ? 'landowner' : 'beekeeper'} theme={isLandowner ? 'green' : 'amber'} />
        <div className="px-2 pb-2 border-t border-stone-100">
          <h1 className="text-[0.95rem] font-bold text-stone-800">{t('notifications', selectedLanguage)}</h1>
          <p className="text-stone-500 text-[0.72rem] mt-0.5">{t('stayUpdated', selectedLanguage)}</p>
        </div>
      </div>

      <div className="px-2 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.9rem] font-bold text-stone-800">{t('notifications', selectedLanguage)} {unreadCount > 0 && <span className="text-[0.7rem] bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}</h2>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className={`text-[0.75rem] font-medium flex items-center gap-1 ${accentText}`}><CheckCheck className="w-4 h-4" /> {t('readAll', selectedLanguage)}</button>
          )}
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div> :
          notifications.length === 0 ? (
            <div className="text-center py-12"><Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">{t('noNotifications', selectedLanguage)}</p></div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`bg-white rounded-xl p-3 shadow-sm ${!n.is_read ? `border-l-4 ${accentBorder}` : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-[0.8rem] ${!n.is_read ? 'font-bold text-stone-800' : 'text-stone-700'}`}>{n.title}</h3>
                      </div>
                      {n.message && <p className="text-[0.7rem] text-stone-500 ml-6">{n.message}</p>}
                      <p className="text-[0.7rem] text-stone-400 ml-6 mt-1">{new Date(n.created_at).toLocaleString()}</p>
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
