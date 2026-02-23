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
    <div className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-stone-100/50">
      <div className="px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all shadow-sm border border-amber-100 group"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-amber-700 transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-stone-800 truncate leading-tight tracking-tight">
                {getGreeting()}, <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{userName}</span>
              </h1>
              {district && (
                <p className="text-stone-500 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-500" /> {district}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
             {/* Desktop Language Switcher */}
             <div className="hidden sm:flex items-center bg-stone-100/50 p-1 rounded-lg border border-stone-100">
              {(['en', 'si', 'ta'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-2.5 py-1 rounded-md transition-all text-[11px] font-bold uppercase tracking-wider ${
                    selectedLanguage === l
                      ? 'bg-white text-amber-600 shadow-sm border border-stone-100'
                      : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'si' ? 'SI' : 'TA'}
                </button>
              ))}
            </div>

            {onNotificationClick && (
              <button
                onClick={onNotificationClick}
                className="relative p-2 bg-white border border-stone-100 rounded-xl hover:bg-stone-50 transition-all shadow-sm group hover:border-amber-200"
              >
                <Bell className="w-5 h-5 text-stone-400 group-hover:text-amber-600 transition-colors duration-300" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white ring-1 ring-red-100">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Language Switcher */}
        <div className="flex sm:hidden items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed border-stone-100">
           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Language</span>
           <div className="flex gap-1.5">
            {(['en', 'si', 'ta'] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLanguageChange(l)}
                className={`px-3 py-1 rounded-md transition-all text-[10px] font-bold uppercase tracking-wide border ${
                  selectedLanguage === l
                    ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                    : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-50'
                }`}
              >
                {l === 'en' ? 'Eng' : l === 'si' ? 'Sin' : 'Tam'}
              </button>
            ))}
           </div>
        </div>
      </div>
    </div>
  );
}
