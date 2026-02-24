import { Home, Hexagon as HiveIcon, MapPin, User, LogOut } from 'lucide-react';

export type HelperNavTab = 'dashboard' | 'myHives' | 'myApiaries' | 'profile';

interface HelperSidebarProps {
  isOpen: boolean;
  activeTab: HelperNavTab;
  onNavigate: (tab: HelperNavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-600' : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-800'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function HelperSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: HelperSidebarProps) {
  const nav = (tab: HelperNavTab) => { onNavigate(tab); onClose(); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out w-72 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg"><HiveIcon className="w-8 h-8 text-white" /></div>
            <div><h2 className="font-bold text-white text-xl">ApiCore</h2><p className="text-emerald-100 text-sm">Helper View</p></div>
          </div>
        </div>
        <nav className="py-4">
          <NavItem icon={<Home className="w-5 h-5" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem icon={<HiveIcon className="w-5 h-5" />} label="My Hives" active={activeTab === 'myHives'} onClick={() => nav('myHives')} />
          <NavItem icon={<MapPin className="w-5 h-5" />} label="My Apiaries" active={activeTab === 'myApiaries'} onClick={() => nav('myApiaries')} />
          <NavItem icon={<User className="w-5 h-5" />} label="Profile" active={activeTab === 'profile'} onClick={() => nav('profile')} />
        </nav>
        {onLogout && (
          <div className="absolute bottom-12 left-0 right-0 px-4">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl transition-colors font-medium">
              <LogOut className="w-5 h-5" /><span>Logout</span>
            </button>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-600 text-center">ApiCore v1.0.0 - Helper</p>
        </div>
      </div>
    </>
  );
}
