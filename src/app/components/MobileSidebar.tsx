import React from 'react';
import { Home, MapPin, Hexagon as HiveIcon, Calendar, DollarSign, Users, User, LogOut, Package } from 'lucide-react';

type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface MobileSidebarProps {
  isOpen: boolean;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
        active
          ? 'bg-amber-100 text-amber-700 border-l-4 border-amber-500'
          : 'text-stone-700 hover:bg-stone-100'
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function MobileSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: MobileSidebarProps) {
  const nav = (tab: NavTab) => { onNavigate(tab); onClose(); };

  // Lock body scroll when open so the page behind doesn't scroll
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // fixed inset-0 = always viewport-sized, never scrolls with page content.
    // Inner max-w-[430px] matches the App container so the sidebar stays visually
    // inside the mobile frame on desktop browsers.
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="w-full max-w-[430px] h-full flex">

        {/* Sidebar panel */}
        <div className="w-72 max-w-[85%] h-full bg-white shadow-2xl flex flex-col">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <HiveIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-xl">ApiCore</h2>
                <p className="text-amber-100 text-sm">Beekeeping Manager</p>
              </div>
            </div>
          </div>

          <nav className="py-4 flex-1 overflow-y-auto">
            <NavItem icon={<Home className="w-5 h-5" />}       label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />
            <NavItem icon={<MapPin className="w-5 h-5" />}     label="Apiaries"  active={activeTab === 'apiaries'}  onClick={() => nav('apiaries')}  />
            <NavItem icon={<HiveIcon className="w-5 h-5" />}   label="Hives"     active={activeTab === 'hives'}     onClick={() => nav('hives')}     />
            <NavItem icon={<Package className="w-5 h-5" />}    label="Harvest"   active={activeTab === 'harvest'}   onClick={() => nav('harvest')}   />
            <NavItem icon={<Calendar className="w-5 h-5" />}   label="Planning"  active={activeTab === 'planning'}  onClick={() => nav('planning')}  />
            <NavItem icon={<DollarSign className="w-5 h-5" />} label="Finance"   active={activeTab === 'finance'}   onClick={() => nav('finance')}   />
            <NavItem icon={<Users className="w-5 h-5" />}      label="Clients"   active={activeTab === 'clients'}   onClick={() => nav('clients')}   />
            <NavItem icon={<User className="w-5 h-5" />}       label="Profile"   active={activeTab === 'profile'}   onClick={() => nav('profile')}   />
          </nav>

          <div className="p-4 border-t border-stone-200 bg-stone-50 flex-shrink-0">
            {onLogout && (
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            )}
            <p className="text-xs text-stone-600 text-center">ApiCore v1.0.0</p>
          </div>
        </div>

        {/* Backdrop — click outside to close */}
        <div className="flex-1 bg-black/50" onClick={onClose} aria-hidden="true" />
      </div>
    </div>
  );
}