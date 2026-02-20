import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { SplashScreen } from '@/app/components/SplashScreen';
import { RoleSelectionScreen } from '@/app/components/RoleSelectionScreen';
import { BeekeeperRegistration } from '@/app/components/BeekeeperRegistration';
import { HelperInvitationScreen } from '@/app/components/HelperInvitationScreen';
import { HelperRegistrationScreen } from '@/app/components/HelperRegistrationScreen';
import { LoginScreen } from '@/app/components/LoginScreen';
import { BeekeeperDashboard } from '@/app/components/BeekeeperDashboard';
import { HelperDashboard } from '@/app/components/HelperDashboard';
import { HelperMyHivesScreen } from '@/app/components/HelperMyHivesScreen';
import { HelperMyApiariesScreen } from '@/app/components/HelperMyApiariesScreen';
import { ManageHelpersScreen } from '@/app/components/ManageHelpersScreen';
import { ApiariesScreen } from '@/app/components/ApiariesScreen';
import { HivesScreen } from '@/app/components/HivesScreen';
import { CreateApiaryScreen } from '@/app/components/CreateApiaryScreen';
import { CreateHiveScreen } from '@/app/components/CreateHiveScreen';
import { HivePlanningScreen } from '@/app/components/HivePlanningScreen';
import { HarvestScreen } from '@/app/components/HarvestScreen';
import { FinanceScreen } from '@/app/components/FinanceScreen';
import { ProfileScreen } from '@/app/components/ProfileScreen';
import { ViewHiveScreen } from '@/app/components/ViewHiveScreen';
import { ViewApiaryScreen } from '@/app/components/ViewApiaryScreen';
import { ClientServicesScreen } from '@/app/components/ClientServicesScreen';
import { NotificationsScreen } from '@/app/components/NotificationsScreen';
import { authService } from './services/auth';
import type { Apiary as ApiaryModel } from './services/apiaries';
import type { Hive as HiveModel } from './services/hives';
import type { HelperNavTab } from '@/app/components/HelperSidebar';

type Language = 'en' | 'si' | 'ta';
type UserType = 'beekeeper' | 'helper' | null;
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'harvest' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

// Route maps for navigation tab → URL
const ADMIN_NAV_ROUTES: Record<NavTab, string> = {
  dashboard: '/admin/dashboard',
  apiaries: '/admin/apiaries',
  hives: '/admin/hives',
  harvest: '/admin/harvest',
  planning: '/admin/planning',
  finance: '/admin/finance',
  clients: '/admin/clients',
  notifications: '/admin/notifications',
  profile: '/admin/profile',
};

const HELPER_NAV_ROUTES: Record<HelperNavTab, string> = {
  dashboard: '/helper/dashboard',
  myHives: '/helper/hives',
  myApiaries: '/helper/apiaries',
  profile: '/helper/profile',
};

// ─── Auth guard components ─────────────────────────────────────────────────────

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'beekeeper' | 'helper' }) {
  const token = localStorage.getItem('auth_token');
  const user = authService.getLocalUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toLowerCase().includes('helper') ? 'helper' : 'beekeeper';
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'helper' ? '/helper/dashboard' : '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  const user = authService.getLocalUser();

  if (token && user) {
    const userRole = user.role?.toLowerCase().includes('helper') ? 'helper' : 'beekeeper';
    return <Navigate to={userRole === 'helper' ? '/helper/dashboard' : '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
}

// ─── Public page wrappers ──────────────────────────────────────────────────────

function SplashPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <SplashScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onGetStarted={() => navigate('/register')}
      onLogin={() => navigate('/login')}
    />
  );
}

function RoleSelectionPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <RoleSelectionScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBack={() => navigate('/')}
      onContinue={(role) => {
        if (role === 'beekeeper') navigate('/register/admin');
        else navigate('/register/helper');
      }}
    />
  );
}

function BeekeeperRegPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <BeekeeperRegistration
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBack={() => navigate('/register')}
      onSuccess={() => navigate('/login')}
    />
  );
}

function HelperInvitePage({ lang, onLangChange, setInvitationData }: {
  lang: Language;
  onLangChange: (l: Language) => void;
  setInvitationData: (d: { token: string; email: string; invitedBy: string }) => void;
}) {
  const navigate = useNavigate();
  return (
    <HelperInvitationScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBackToHome={() => navigate('/')}
      onValidToken={(token, email, invitedBy) => {
        setInvitationData({ token, email, invitedBy });
        navigate('/register/helper/complete');
      }}
    />
  );
}

function HelperRegPage({ lang, onLangChange, invitationData }: {
  lang: Language;
  onLangChange: (l: Language) => void;
  invitationData: { token: string; email: string; invitedBy: string } | null;
}) {
  const navigate = useNavigate();
  if (!invitationData) return <Navigate to="/register/helper" replace />;
  return (
    <HelperRegistrationScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBack={() => navigate('/register/helper')}
      onSuccess={() => navigate('/login')}
      token={invitationData.token}
      email={invitationData.email}
      invitedBy={invitationData.invitedBy}
    />
  );
}

function LoginPage({ lang, onLangChange, setUserType }: {
  lang: Language;
  onLangChange: (l: Language) => void;
  setUserType: (t: UserType) => void;
}) {
  const navigate = useNavigate();
  return (
    <LoginScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBackToHome={() => navigate('/')}
      onLoginSuccess={(type) => {
        setUserType(type);
        navigate(type === 'beekeeper' ? '/admin/dashboard' : '/helper/dashboard');
      }}
      onForgotPassword={() => {}}
    />
  );
}

// ─── Admin (Beekeeper) page wrappers ──────────────────────────────────────────

function AdminDashboardPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <BeekeeperDashboard
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

function AdminApiariesPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ApiariesScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onCreateApiary={() => navigate('/admin/apiaries/new')}
      onViewHive={() => navigate('/admin/hives')}
      onEditApiary={(apiary) => navigate('/admin/apiaries/edit', { state: { apiary } })}
      onAddHive={(apiary) => navigate('/admin/hives/new', { state: { contextApiary: { id: apiary.id.toString(), name: apiary.name } } })}
      onViewApiary={(id) => navigate(`/admin/apiaries/${id}`)}
      onLogout={onLogout}
    />
  );
}

function AdminCreateApiaryPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editApiary = (location.state as any)?.apiary || null;
  return (
    <CreateApiaryScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onClose={() => navigate('/admin/apiaries')}
      initialApiary={editApiary}
      onLogout={onLogout}
    />
  );
}

function AdminViewApiaryPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const apiaryId = parseInt(id || '0', 10);
  if (!apiaryId) return <Navigate to="/admin/apiaries" replace />;
  return (
    <ViewApiaryScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/admin/apiaries')}
      onAddHive={(apiaryId) => navigate('/admin/hives/new', { state: { contextApiary: { id: apiaryId.toString(), name: '' } } })}
      onEditApiary={() => navigate('/admin/apiaries/edit')}
      onViewHive={(hiveId) => navigate(`/admin/hives/${hiveId}`)}
      onLogout={onLogout}
      apiaryId={apiaryId}
    />
  );
}

function AdminHivesPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HivesScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onCreateHive={() => navigate('/admin/hives/new')}
      onViewHive={(hiveId) => navigate(`/admin/hives/${hiveId}`)}
      onEditHive={(hive) => navigate('/admin/hives/edit', { state: { hive, returnTo: '/admin/hives' } })}
      onLogout={onLogout}
    />
  );
}

function AdminCreateHivePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const contextApiary = state?.contextApiary || null;
  const editHive = state?.hive || null;
  const returnTo = state?.returnTo || '/admin/hives';

  return (
    <CreateHiveScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onClose={() => {
        if (editHive && returnTo.includes('/')) {
          navigate(returnTo);
        } else {
          navigate('/admin/hives');
        }
      }}
      contextApiary={contextApiary}
      initialHive={editHive}
      onLogout={onLogout}
    />
  );
}

function AdminViewHivePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const hiveId = parseInt(id || '0', 10);
  if (!hiveId) return <Navigate to="/admin/hives" replace />;
  return (
    <ViewHiveScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/admin/hives')}
      onEditHive={(hive) => navigate('/admin/hives/edit', { state: { hive, returnTo: `/admin/hives/${hiveId}` } })}
      onLogout={onLogout}
      hiveId={hiveId}
    />
  );
}

function AdminPlanningPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HivePlanningScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onCreateApiary={() => navigate('/admin/apiaries/new')}
      onCreateHive={() => navigate('/admin/hives/new')}
      onLogout={onLogout}
    />
  );
}

function AdminHarvestPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HarvestScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

function AdminFinancePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <FinanceScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

function AdminClientsPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ClientServicesScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

function AdminNotificationsPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <NotificationsScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

function HelperNotificationsPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <NotificationsScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(HELPER_NAV_ROUTES[tab as HelperNavTab] || '/helper/dashboard')}
      onLogout={onLogout}
      isHelper={true}
    />
  );
}

function AdminProfilePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ProfileScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onManageHelpers={() => navigate('/admin/helpers')}
    />
  );
}

function AdminManageHelpersPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ManageHelpersScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onBack={() => navigate('/admin/profile')}
    />
  );
}

// ─── Helper page wrappers ─────────────────────────────────────────────────────

function HelperDashboardPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HelperDashboard
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(HELPER_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onViewHive={(hiveId) => navigate(`/helper/hives/${hiveId}`)}
    />
  );
}

function HelperHivesPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HelperMyHivesScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(HELPER_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onViewHive={(hiveId) => navigate(`/helper/hives/${hiveId}`)}
    />
  );
}

function HelperApiariesPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <HelperMyApiariesScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(HELPER_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onViewHive={(hiveId) => navigate(`/helper/hives/${hiveId}`)}
    />
  );
}

function HelperViewHivePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const hiveId = parseInt(id || '0', 10);
  if (!hiveId) return <Navigate to="/helper/hives" replace />;
  return (
    <ViewHiveScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(HELPER_NAV_ROUTES[tab as HelperNavTab] || '/helper/dashboard')}
      onBack={() => navigate('/helper/hives')}
      onLogout={onLogout}
      hiveId={hiveId}
    />
  );
}

function HelperProfilePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ProfileScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => {
        const helperTab = tab === 'dashboard' ? 'dashboard' : tab === 'profile' ? 'profile' : 'dashboard';
        navigate(HELPER_NAV_ROUTES[helperTab as HelperNavTab]);
      }}
      onLogout={onLogout}
    />
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [userType, setUserType] = useState<UserType>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [invitationData, setInvitationData] = useState<{ token: string; email: string; invitedBy: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const localUser = authService.getLocalUser();
    if (token && localUser) {
      const roleStr = localUser.role?.toLowerCase() || 'beekeeper';
      setUserType(roleStr.includes('helper') ? 'helper' : 'beekeeper');
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUserType(null);
    window.location.href = '/';
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
        <div className="w-full max-w-[430px] h-full bg-white shadow-2xl overflow-y-auto relative">
          <SplashScreen
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            onGetStarted={() => {}}
            onLogin={() => {}}
          />
        </div>
      </div>
    );
  }

  const lp = { lang: selectedLanguage, onLangChange: setSelectedLanguage };
  const ap = { ...lp, onLogout: handleLogout };

  return (
    <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
      <div className="w-full max-w-[430px] h-full bg-white shadow-2xl overflow-y-auto relative">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RedirectIfAuth><SplashPage {...lp} /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><RoleSelectionPage {...lp} /></RedirectIfAuth>} />
          <Route path="/register/admin" element={<RedirectIfAuth><BeekeeperRegPage {...lp} /></RedirectIfAuth>} />
          <Route path="/register/helper" element={<RedirectIfAuth><HelperInvitePage {...lp} setInvitationData={setInvitationData} /></RedirectIfAuth>} />
          <Route path="/register/helper/complete" element={<RedirectIfAuth><HelperRegPage {...lp} invitationData={invitationData} /></RedirectIfAuth>} />
          <Route path="/login" element={<RedirectIfAuth><LoginPage {...lp} setUserType={setUserType} /></RedirectIfAuth>} />

          {/* Admin (Beekeeper) routes */}
          <Route path="/admin/dashboard" element={<RequireAuth role="beekeeper"><AdminDashboardPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries" element={<RequireAuth role="beekeeper"><AdminApiariesPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/new" element={<RequireAuth role="beekeeper"><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/edit" element={<RequireAuth role="beekeeper"><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/:id" element={<RequireAuth role="beekeeper"><AdminViewApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives" element={<RequireAuth role="beekeeper"><AdminHivesPage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/new" element={<RequireAuth role="beekeeper"><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/edit" element={<RequireAuth role="beekeeper"><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/:id" element={<RequireAuth role="beekeeper"><AdminViewHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/planning" element={<RequireAuth role="beekeeper"><AdminPlanningPage {...ap} /></RequireAuth>} />
          <Route path="/admin/harvest" element={<RequireAuth role="beekeeper"><AdminHarvestPage {...ap} /></RequireAuth>} />
          <Route path="/admin/finance" element={<RequireAuth role="beekeeper"><AdminFinancePage {...ap} /></RequireAuth>} />
          <Route path="/admin/clients" element={<RequireAuth role="beekeeper"><AdminClientsPage {...ap} /></RequireAuth>} />
          <Route path="/admin/notifications" element={<RequireAuth role="beekeeper"><AdminNotificationsPage {...ap} /></RequireAuth>} />
          <Route path="/admin/profile" element={<RequireAuth role="beekeeper"><AdminProfilePage {...ap} /></RequireAuth>} />
          <Route path="/admin/helpers" element={<RequireAuth role="beekeeper"><AdminManageHelpersPage {...ap} /></RequireAuth>} />

          {/* Helper routes */}
          <Route path="/helper/dashboard" element={<RequireAuth role="helper"><HelperDashboardPage {...ap} /></RequireAuth>} />
          <Route path="/helper/hives" element={<RequireAuth role="helper"><HelperHivesPage {...ap} /></RequireAuth>} />
          <Route path="/helper/hives/:id" element={<RequireAuth role="helper"><HelperViewHivePage {...ap} /></RequireAuth>} />
          <Route path="/helper/apiaries" element={<RequireAuth role="helper"><HelperApiariesPage {...ap} /></RequireAuth>} />
          <Route path="/helper/notifications" element={<RequireAuth role="helper"><HelperNotificationsPage {...ap} /></RequireAuth>} />
          <Route path="/helper/profile" element={<RequireAuth role="helper"><HelperProfilePage {...ap} /></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
