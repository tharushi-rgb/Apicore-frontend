import { Home, MapPin, Hexagon as HiveIcon, Package, Calendar, DollarSign, Users, User, Bell, LogOut, ChevronRight } from 'lucide-react';

type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

interface MobileSidebarProps {
  isOpen: boolean;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onClose: () => void;
  onLogout?: () => void;
}

const navItems: { tab: NavTab; label: string; emoji: string; gradient: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', emoji: '🏠', gradient: 'from-amber-400 to-orange-500' },
  { tab: 'apiaries', label: 'Apiaries', emoji: '📍', gradient: 'from-emerald-400 to-teal-500' },
  { tab: 'hives', label: 'Hives', emoji: '🐝', gradient: 'from-yellow-400 to-amber-500' },
  { tab: 'harvest', label: 'Harvest', emoji: '🍯', gradient: 'from-orange-400 to-red-500' },
];

const mgmtItems: { tab: NavTab; label: string; emoji: string; gradient: string }[] = [
  { tab: 'planning', label: 'Planning', emoji: '📋', gradient: 'from-blue-400 to-indigo-500' },
  { tab: 'finance', label: 'Finance', emoji: '💰', gradient: 'from-green-400 to-emerald-500' },
  { tab: 'clients', label: 'Clients', emoji: '🤝', gradient: 'from-purple-400 to-violet-500' },
  { tab: 'notifications', label: 'Alerts', emoji: '🔔', gradient: 'from-rose-400 to-pink-500' },
  { tab: 'profile', label: 'Profile', emoji: '👤', gradient: 'from-slate-400 to-gray-500' },
];

function NavItem({ emoji, label, active, gradient, onClick }: { emoji: string; label: string; active: boolean; gradient: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all duration-200 ${
        active
          ? `bg-gradient-to-r ${gradient} text-white shadow-md scale-[1.02]`
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
      }`}>
      <span className="text-sm">{emoji}</span>
      <span className="font-semibold tracking-wide flex-1 text-left">{label}</span>
      {active && <ChevronRight className="w-3 h-3 opacity-70" />}
    </button>
  );
}

export function MobileSidebar({ isOpen, activeTab, onNavigate, onClose, onLogout }: MobileSidebarProps) {
  const nav = (tab: NavTab) => { onNavigate(tab); onClose(); };

  return (
    <>
      {isOpen && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300" onClick={onClose} />}
      <div className={`absolute top-0 left-0 bottom-0 w-[72%] max-w-[280px] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-4 py-4">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-black/5 rounded-full blur-xl" />
          <div className="relative flex items-center gap-2.5 z-10">
            <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
              <span className="text-xl">🐝</span>
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight leading-tight">ApiCore</h2>
              <p className="text-amber-100 text-[9px] font-bold uppercase tracking-widest">Beekeeping Manager</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-0.5 hide-scrollbar">
          <div className="px-2 py-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest">Main</div>
          {navItems.map(item => (
            <NavItem key={item.tab} emoji={item.emoji} label={item.label} active={activeTab === item.tab} gradient={item.gradient} onClick={() => nav(item.tab)} />
          ))}
          
          <div className="mt-2 px-2 py-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-widest">Management</div>
          {mgmtItems.map(item => (
            <NavItem key={item.tab} emoji={item.emoji} label={item.label} active={activeTab === item.tab} gradient={item.gradient} onClick={() => nav(item.tab)} />
          ))}
        </nav>

        {/* Footer */}
        {onLogout && (
          <div className="p-3 bg-gradient-to-t from-stone-50 to-white border-t border-stone-100">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-xl transition-all text-xs font-semibold">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <p className="mt-2 text-[9px] text-stone-400 text-center font-medium">ApiCore v1.0.0</p>
          </div>
        )}
      </div>
    </>
  );
}