import { Home, Bell, BriefcaseBusiness } from 'lucide-react';
import { MobileHeader } from '../shared/MobileHeader';
import { authService } from '../../services/auth';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface Props {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  activeTab: 'dashboard' | 'clients' | 'notifications';
  title: string;
  subtitle: string;
}

const ICONS = {
  dashboard: Home,
  clients: BriefcaseBusiness,
  notifications: Bell,
} as const;

export function LandownerPlaceholderScreen({
  selectedLanguage,
  onLanguageChange,
  onNavigate,
  onLogout,
  activeTab,
  title,
  subtitle,
}: Props) {
  const user = authService.getLocalUser();
  const Icon = ICONS[activeTab];

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-emerald-50 via-green-50 to-white flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm">
        <MobileHeader
          userName={user?.name}
          roleLabel="landowner"
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          activeTab={activeTab}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onViewAllNotifications={() => onNavigate('notifications')}
          role="landowner"
          theme="green"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <Icon className="h-7 w-7 text-emerald-800" />
          </div>
          <h1 className="mt-4 text-center text-xl font-extrabold text-stone-900">{title}</h1>
          <p className="mx-auto mt-2 max-w-[16rem] text-center text-sm leading-6 text-stone-600">{subtitle}</p>
          <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-medium text-emerald-900">
            UI shell is ready. Feature content can be added next.
          </div>
        </div>
      </div>
    </div>
  );
}
