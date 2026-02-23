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
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="bg-white shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            {/* Hamburger Menu */}
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
              <h1 className="text-xl font-bold text-stone-800">
                {getGreeting()}, {userName}
              </h1>
              {district && (
                <p className="text-stone-600 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  District: {district}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {onNotificationClick && (
              <button
                onClick={onNotificationClick}
                className="relative p-2 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-amber-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            )}
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
    </div>
  );
}
