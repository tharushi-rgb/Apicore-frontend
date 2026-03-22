import React from 'react';
import { createPortal } from 'react-dom';
import { Home, MapPin, Hexagon as HiveIcon, Calendar, Users, User, LogOut, Bell } from 'lucide-react';
import { t, type Language } from '../../i18n';

type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface MobileSidebarProps {
  isOpen: boolean;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
  lang?: Language;
  role?: 'beekeeper' | 'landowner';
  theme?: 'amber' | 'green';
}

function NavItem({ icon, label, active, onClick, theme = 'amber' }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; theme?: 'amber' | 'green' }) {
  const activeClass = theme === 'green'
    ? 'bg-emerald-100 text-emerald-800 border-l-[3px] border-emerald-600 font-semibold'
    : 'bg-amber-100 text-amber-700 border-l-[3px] border-amber-500 font-semibold';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors text-[0.82rem] ${
        active
          ? activeClass
          : 'text-stone-700 hover:bg-stone-100 font-medium'
      }`}
    >
      <div className="w-4.5 h-4.5">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function MobileSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout, lang = 'en', role = 'beekeeper', theme = 'amber' }: MobileSidebarProps) {
  const nav = (tab: NavTab) => { onNavigate(tab); onClose(); };
  const isLandowner = role === 'landowner';
  const gradientClass = theme === 'green' ? 'from-emerald-700 to-green-700' : 'from-amber-500 to-amber-600';
  const panelSubtitle = isLandowner ? 'Landowner' : 'Beekeeper';

  // Lock body scroll when open so the page behind doesn't scroll
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    // Use fixed + high z-index in a body portal to guarantee the sidebar sits
    // above all page-level stacking contexts (sticky headers, cards, modals).
    <div className="fixed inset-0 z-[120] flex justify-center">
      <div className="w-[min(92vw,22rem)] h-full flex">

        {/* Sidebar panel */}
        <div className="w-72 max-w-[85%] h-full bg-white shadow-2xl flex flex-col">
          <div className={`bg-gradient-to-r ${gradientClass} px-4 py-4 flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <HiveIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-[1rem] leading-tight">ApiCore</h2>
                <p className="text-white/80 text-[0.72rem] leading-tight">{panelSubtitle}</p>
              </div>
            </div>
          </div>

          <nav className="py-3 flex-1 overflow-y-auto space-y-0.5">
            <NavItem icon={<Home className="w-4.5 h-4.5" />} label={t('dashboard', lang)} active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} theme={theme} />
            {isLandowner ? (
              <>
                <NavItem icon={<Users className="w-4.5 h-4.5" />} label="Listings" active={activeTab === 'clients'} onClick={() => nav('clients')} theme={theme} />
                <NavItem icon={<User className="w-4.5 h-4.5" />} label={t('profile', lang)} active={activeTab === 'profile'} onClick={() => nav('profile')} theme={theme} />
              </>
            ) : (
              <>
                <NavItem icon={<MapPin className="w-4.5 h-4.5" />} label={t('apiaries', lang)} active={activeTab === 'apiaries'} onClick={() => nav('apiaries')} theme={theme} />
                <NavItem icon={<HiveIcon className="w-4.5 h-4.5" />} label={t('hives', lang)} active={activeTab === 'hives'} onClick={() => nav('hives')} theme={theme} />
                <NavItem icon={<Calendar className="w-4.5 h-4.5" />} label={t('planning', lang)} active={activeTab === 'planning'} onClick={() => nav('planning')} theme={theme} />
                <NavItem icon={<Users className="w-4.5 h-4.5" />} label={t('clients', lang)} active={activeTab === 'clients'} onClick={() => nav('clients')} theme={theme} />
                <NavItem icon={<User className="w-4.5 h-4.5" />} label={t('profile', lang)} active={activeTab === 'profile'} onClick={() => nav('profile')} theme={theme} />
              </>
            )}
          </nav>

          <div className="p-3 border-t border-stone-200 bg-stone-50 flex-shrink-0">
            {onLogout && (
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-lg bg-red-50 text-red-700 text-[0.82rem] font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout', lang)}</span>
              </button>
            )}
            <p className="text-[0.68rem] text-stone-600 text-center">ApiCore v1.0.0</p>
          </div>
        </div>

        {/* Backdrop — click outside to close */}
        <div className="flex-1 bg-black/50" onClick={onClose} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}