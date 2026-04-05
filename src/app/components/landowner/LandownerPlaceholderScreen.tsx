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

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="rounded-[24px] border border-emerald-200 bg-white p-3 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <Icon className="h-6 w-6 text-emerald-800" />
          </div>
          <h1 className="mt-3 text-center text-[0.95rem] font-bold text-stone-900">{title}</h1>
          <p className="mx-auto mt-2 max-w-[16rem] text-center text-[0.75rem] leading-5 text-stone-600">{subtitle}</p>
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2.5 text-center text-[0.72rem] font-medium text-emerald-900">
            UI shell is ready. Feature content can be added next.
          </div>
        </div>
      </div>
    </div>
  );
}
