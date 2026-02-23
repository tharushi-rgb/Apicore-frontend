import { Home, MapPin, Hexagon as HiveIcon, Package, Calendar, DollarSign, Users, User, Bell, LogOut } from 'lucide-react';

type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface MobileSidebarProps {
  isOpen: boolean;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
}

// ...existing code...
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 border-l-4 ${active ? 'bg-amber-50 text-amber-700 border-amber-600 shadow-sm' : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
      <div className={`p-1.5 rounded-md ${active ? 'bg-amber-100' : 'bg-stone-100'}`}>{icon}</div>
      <span className="font-semibold tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-600" />}
    </button>
  );
}

export function MobileSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: MobileSidebarProps) {
  const nav = (tab: NavTab) => { onNavigate(tab); onClose(); };

  return (
    <>
      {isOpen && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity" onClick={onClose} />}
      <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-out border-r border-stone-100 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-5 py-6 shadow-md">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-20 h-20 bg-black/5 rounded-full blur-xl"></div>
          <div className="relative flex items-center gap-3 z-10">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/20 shadow-inner">
              <HiveIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-tight leading-tight">ApiCore</h2>
              <p className="text-amber-50 text-xs font-medium opacity-90">Beekeeping Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-hide">
          <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Menu</div>
          <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem icon={<MapPin className="w-4 h-4" />} label="Apiaries" active={activeTab === 'apiaries'} onClick={() => nav('apiaries')} />
          <NavItem icon={<HiveIcon className="w-4 h-4" />} label="Hives" active={activeTab === 'hives'} onClick={() => nav('hives')} />
          <NavItem icon={<Package className="w-4 h-4" />} label="Harvest" active={activeTab === 'harvest'} onClick={() => nav('harvest')} />
          
          <div className="mt-4 px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Management</div>
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Planning" active={activeTab === 'planning'} onClick={() => nav('planning')} />
          <NavItem icon={<DollarSign className="w-4 h-4" />} label="Finance" active={activeTab === 'finance'} onClick={() => nav('finance')} />
          <NavItem icon={<Users className="w-4 h-4" />} label="Clients" active={activeTab === 'clients'} onClick={() => nav('clients')} />
          <NavItem icon={<Bell className="w-4 h-4" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => nav('notifications')} />
          <NavItem icon={<User className="w-4 h-4" />} label="Profile" active={activeTab === 'profile'} onClick={() => nav('profile')} />
        </nav>

        {onLogout && (
          <div className="p-4 bg-stone-50 border-t border-stone-200">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm text-sm font-semibold">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <p className="mt-3 text-[10px] text-stone-400 text-center font-medium">ApiCore v1.0.0</p>
          </div>
        )}
      </div>
    </>
  );
}
// ...existing code...