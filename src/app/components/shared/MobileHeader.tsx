import { useState, useEffect } from 'react';
import { Bell, Menu, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationsService, type Notification } from '../../services/notifications';
import { MobileSidebar } from './MobileSidebar';
import { t } from '../../i18n';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface MobileHeaderProps {
  userName?: string;
  district?: string;
  roleLabel?: string;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  /** When provided, Navbar manages MobileSidebar internally */
  activeTab?: NavTab;
  onNavigate?: (tab: NavTab) => void;
  onLogout?: () => void;
  onViewAllNotifications?: () => void;
  role?: 'beekeeper' | 'landowner';
  theme?: 'amber' | 'green';
}

export function MobileHeader({
  userName = 'Beekeeper',
  roleLabel,
  selectedLanguage,
  onLanguageChange,
  activeTab,
  onNavigate,
  onLogout,
  onViewAllNotifications,
  role = 'beekeeper',
  theme = 'amber',
}: MobileHeaderProps) {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isSidebarOpen = internalSidebarOpen;
  const toggleSidebar = () => setInternalSidebarOpen(v => !v);

  const fetchNotifications = async () => {
    try {
      const all = await notificationsService.getAll();
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
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
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsService.dismiss(id);
    fetchNotifications();
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <>
      {activeTab && onNavigate && (
        <MobileSidebar
          isOpen={internalSidebarOpen}
          activeTab={activeTab}
          onNavigate={(tab) => { onNavigate(tab); setInternalSidebarOpen(false); }}
          onClose={() => setInternalSidebarOpen(false)}
          onLogout={onLogout}
          lang={selectedLanguage}
          role={role}
          theme={theme}
        />
      )}

      {(() => {
        const isGreen = theme === 'green';
        const menuBg = isGreen ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-amber-50 hover:bg-amber-100';
        const iconColor = isGreen ? 'text-emerald-700' : 'text-amber-700';
        const langActive = isGreen ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm';

        return (
          <div className="bg-white shadow-sm sticky top-0 z-30">
            {/* Single-row navbar */}
            <div className="px-3 py-2.5 flex items-center gap-2">
              {/* Menu / hamburger */}
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg transition-colors shrink-0 ${menuBg}`}
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? (
                  <X className={`w-5 h-5 ${iconColor}`} />
                ) : (
                  <Menu className={`w-5 h-5 ${iconColor}`} />
                )}
              </button>

              {/* Name + role — takes remaining space */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.9rem] font-semibold text-stone-800 leading-tight truncate">{userName}</p>
                {roleLabel && (
                  <p className="text-[0.68rem] text-stone-500 capitalize leading-none">{roleLabel}</p>
                )}
              </div>

              {/* Language slider pill */}
              <div className="bg-stone-100 rounded-full flex p-0.5 shrink-0">
                {(['en', 'si', 'ta'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`px-2 py-1 rounded-full text-[0.68rem] font-medium transition-all leading-none ${
                      selectedLanguage === lang
                        ? langActive
                        : 'text-stone-600 hover:text-stone-800'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'த'}
                  </button>
                ))}
              </div>

              {/* Notification bell */}
              <button
                onClick={handleOpenNotifications}
                className={`relative p-2 rounded-lg transition-colors shrink-0 ${menuBg}`}
              >
                <Bell className={`w-5 h-5 ${iconColor}`} />
              </button>
            </div>

            {/* Notification Dropdown Overlay */}
            {showNotifications && (
              <div className="absolute inset-x-0 top-full z-50">
                <div className="absolute inset-0 top-0 h-screen" onClick={() => setShowNotifications(false)} />
                <div
                  className="relative mx-3 bg-white rounded-2xl shadow-2xl border border-stone-200 max-h-[70vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white rounded-t-2xl px-5 pt-4 pb-3 border-b border-stone-100 z-10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-stone-800">{t('notifications', selectedLanguage)}</h2>
                      <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                        <X className="w-5 h-5 text-stone-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {recentNotifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <p className="text-stone-500 text-sm">{t('noNotifications', selectedLanguage)}</p>
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
                        onClick={() => { setShowNotifications(false); onViewAllNotifications?.(); }}
                        className={`w-full text-center text-sm font-medium py-2 ${isGreen ? 'text-emerald-700 hover:text-emerald-800' : 'text-amber-600 hover:text-amber-700'}`}
                      >
                        {t('viewAllNotifications', selectedLanguage)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
