import { Home, Hexagon as HiveIcon, MapPin, User, LogOut } from 'lucide-react';

export type HelperNavTab = 'dashboard' | 'myHives' | 'myApiaries' | 'profile';

interface HelperSidebarProps {
  isOpen: boolean;
  activeTab: HelperNavTab;
  onNavigate: (tab: HelperNavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
}

// ...existing code...
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 border-l-4 ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-600 shadow-sm' : 'border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
      <div className={`p-1.5 rounded-md ${active ? 'bg-emerald-100' : 'bg-stone-100'}`}>{icon}</div>
      <span className="font-semibold tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />}
    </button>
  );
}

export function HelperSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: HelperSidebarProps) {
  const nav = (tab: HelperNavTab) => { onNavigate(tab); onClose(); };

  return (
    <>
      {isOpen && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity" onClick={onClose} />}
      <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-out border-r border-stone-100 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 px-5 py-6 shadow-md">
           <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-20 h-20 bg-black/5 rounded-full blur-xl"></div>
           <div className="relative flex items-center gap-3 z-10">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/20 shadow-inner">
              <HiveIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-tight leading-tight">ApiCore</h2>
              <p className="text-emerald-50 text-[10px] uppercase font-bold tracking-wider opacity-90">Helper View</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-hide">
          <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Menu</div>
          <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />
          <NavItem icon={<HiveIcon className="w-4 h-4" />} label="My Hives" active={activeTab === 'myHives'} onClick={() => nav('myHives')} />
          <NavItem icon={<MapPin className="w-4 h-4" />} label="My Apiaries" active={activeTab === 'myApiaries'} onClick={() => nav('myApiaries')} />
          <NavItem icon={<User className="w-4 h-4" />} label="Profile" active={activeTab === 'profile'} onClick={() => nav('profile')} />
        </nav>

        {onLogout && (
          <div className="p-4 bg-stone-50 border-t border-stone-200">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm text-sm font-semibold">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
             <p className="mt-3 text-[10px] text-stone-400 text-center font-medium">ApiCore v1.0.0 — Helper</p>
          </div>
        )}
      </div>
    </>
  );
}
// ...existing code...export function HelperSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: HelperSidebarProps) {
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
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" /><span className="font-medium">Logout</span>
            </button>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-600 text-center">ApiCore v1.0.0 — Helper</p>
        </div>
      </div>
    </>
  );
}
