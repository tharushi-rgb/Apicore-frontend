import { Bell, MapPin, Menu, X } from 'lucide-react';

type Language = 'en' | 'si' | 'ta';

interface MobileHeaderProps {
  userName?: string;
  district?: string;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function MobileHeader({
  userName = 'Beekeeper',
  district = '',
  selectedLanguage,
  onLanguageChange,
  notificationCount = 0,
  onNotificationClick,
  isSidebarOpen,
  onToggleSidebar,
}: MobileHeaderProps) {
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-stone-100/50">
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all border border-amber-100/80 group flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-4 h-4 text-amber-700 transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-stone-800 truncate leading-tight">
                {getGreeting()}, <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{userName}</span>
              </h1>
              {district && (
                <p className="text-stone-500 text-[10px] uppercase tracking-wider font-medium flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-emerald-500" /> District: {district}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Language Pills */}
            <div className="flex items-center bg-stone-50 p-0.5 rounded-lg border border-stone-100">
              {(['en', 'si', 'ta'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-2 py-0.5 rounded-md transition-all text-[9px] font-bold uppercase tracking-wide ${
                    selectedLanguage === l
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'si' ? 'සි' : 'த'}
                </button>
              ))}
            </div>

            {onNotificationClick && (
              <button
                onClick={onNotificationClick}
                className="relative p-1.5 bg-white border border-stone-100 rounded-lg hover:bg-stone-50 transition-all group hover:border-amber-200"
              >
                <Bell className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors duration-300" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[8px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold shadow-sm border border-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
