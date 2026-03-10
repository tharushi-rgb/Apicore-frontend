import { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, Menu, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationsService, type Notification } from '../services/notifications';

type Language = 'en' | 'si' | 'ta';

interface MobileHeaderProps {
  userName?: string;
  district?: string;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onViewAllNotifications?: () => void;
}

export function MobileHeader({
  userName = 'Beekeeper',
  district = '',
  selectedLanguage,
  onLanguageChange,
  isSidebarOpen,
  onToggleSidebar,
  onViewAllNotifications,
}: MobileHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchNotifications = async () => {
    try {
      const all = await notificationsService.getAll();
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNotifications = async () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    if (opening && unreadCount > 0) {
      try {
        await notificationsService.markAllRead();
        setTimeout(fetchNotifications, 500);
      } catch {}
    }
  };

  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsService.dismiss(id);
    fetchNotifications();
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="bg-white shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onToggleSidebar}
              className="p-2 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors -ml-2"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-amber-700" />
              ) : (
                <Menu className="w-5 h-5 text-amber-700" />
              )}
            </button>

            <div className="flex-1">
              <h1 className="text-[1.25rem] font-bold text-stone-800">
                {getGreeting()}, {userName}
              </h1>
              {district && (
                <p className="text-stone-600 text-[0.875rem] flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  District: {district}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNotifications}
              className="relative p-2 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-amber-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
              selectedLanguage === 'en'
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('si')}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
              selectedLanguage === 'si'
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            සිං
          </button>
          <button
            onClick={() => onLanguageChange('ta')}
            className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
              selectedLanguage === 'ta'
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            த
          </button>
        </div>
      </div>

      {/* Notification Dropdown Overlay */}
      {showNotifications && (
        <div className="absolute inset-x-0 top-full z-50">
          <div className="fixed inset-0 top-0 h-screen" onClick={() => setShowNotifications(false)} />
          <div
            className="relative mx-3 bg-white rounded-2xl shadow-2xl border border-stone-200 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-2xl px-5 pt-4 pb-3 border-b border-stone-100 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-800">Notifications</h2>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No notifications</p>
                </div>
              ) : (
                recentNotifications.map(n => {
                  const severityType = n.severity || n.notification_type;
                  const isCritical = severityType === 'critical' || n.notification_type === 'pest_alert';
                  const isWarning = severityType === 'warning' || n.notification_type === 'inspection_overdue' || n.notification_type === 'feeding_due';

                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border-l-4 ${
                        isCritical ? 'bg-red-50 border-red-500' :
                        isWarning ? 'bg-amber-50 border-amber-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isCritical ? (
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800">{n.title}</p>
                          {n.message && <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-xs text-stone-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        <button onClick={(e) => handleDismiss(n.id, e)} className="p-1 hover:bg-white/50 rounded flex-shrink-0" title="Dismiss">
                          <X className="w-3.5 h-3.5 text-stone-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {onViewAllNotifications && notifications.length > 0 && (
              <div className="sticky bottom-0 bg-white rounded-b-2xl px-5 py-3 border-t border-stone-100">
                <button
                  onClick={() => { setShowNotifications(false); onViewAllNotifications(); }}
                  className="w-full text-center text-sm font-medium text-amber-600 hover:text-amber-700 py-2"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
