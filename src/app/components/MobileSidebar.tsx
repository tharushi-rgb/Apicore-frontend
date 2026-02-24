import { Home, MapPin, Hexagon as HiveIcon, Package, Calendar, DollarSign, Users, User, Bell, LogOut, ChevronRight } from 'lucide-react';

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
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-all duration-200 rounded-xl mx-auto ${
        active
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/50'
          : 'text-stone-600 hover:bg-amber-50/80 hover:text-amber-700'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20' : 'bg-stone-100/80'}`}>{icon}</div>
      <span className="font-semibold flex-1 text-left">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
    </button>
  );
}

export function MobileSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: MobileSidebarProps) {
  const nav = (tab: NavTab) => { onNavigate(tab); onClose(); };

  return (
    <>
      {isOpen && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300" onClick={onClose} />}
      <div className={`absolute top-0 left-0 h-full w-[78%] max-w-[280px] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-4 py-5">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-4 -mb-6 w-20 h-20 bg-black/5 rounded-full blur-xl" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/20 shadow-lg">
              <HiveIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight">ApiCore</h2>
              <p className="text-amber-100 text-[10px] font-semibold uppercase tracking-widest">Beekeeping Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 hide-scrollbar">
          <div className="px-5 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Main</div>
          <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem icon={<MapPin className="w-4 h-4" />} label="Apiaries" active={activeTab === 'apiaries'} onClick={() => nav('apiaries')} />
          <NavItem icon={<HiveIcon className="w-4 h-4" />} label="Hives" active={activeTab === 'hives'} onClick={() => nav('hives')} />
          <NavItem icon={<Package className="w-4 h-4" />} label="Harvest" active={activeTab === 'harvest'} onClick={() => nav('harvest')} />
          
          <div className="px-5 pt-2.5 pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Management</div>
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Planning" active={activeTab === 'planning'} onClick={() => nav('planning')} />
          <NavItem icon={<DollarSign className="w-4 h-4" />} label="Finance" active={activeTab === 'finance'} onClick={() => nav('finance')} />
          <NavItem icon={<Users className="w-4 h-4" />} label="Clients" active={activeTab === 'clients'} onClick={() => nav('clients')} />
          
          <div className="px-5 pt-2.5 pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Account</div>
          <NavItem icon={<Bell className="w-4 h-4" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => nav('notifications')} />
          <NavItem icon={<User className="w-4 h-4" />} label="Profile" active={activeTab === 'profile'} onClick={() => nav('profile')} />
        </nav>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-stone-50 to-white border-t border-stone-100">
          {onLogout && (
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-xl transition-all text-[12px] font-bold">
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          )}
          <p className="mt-2 text-[9px] text-stone-400 text-center font-medium tracking-wide">ApiCore v1.0.0</p>
        </div>
      </div>
    </>
  );
}