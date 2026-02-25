import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { SplashScreen } from '@/app/components/SplashScreen';
import { BeekeeperRegistration } from '@/app/components/BeekeeperRegistration';
import { LoginScreen } from '@/app/components/LoginScreen';
import { BeekeeperDashboard } from '@/app/components/BeekeeperDashboard';
import { ApiariesScreen } from '@/app/components/ApiariesScreen';
import { HivesScreen } from '@/app/components/HivesScreen';
import { CreateApiaryScreen } from '@/app/components/CreateApiaryScreen';
import { CreateHiveScreen } from '@/app/components/CreateHiveScreen';
import { HivePlanningScreen } from '@/app/components/HivePlanningScreen';
import { FinanceScreen } from '@/app/components/FinanceScreen';
import { ProfileScreen } from '@/app/components/ProfileScreen';
import { ViewHiveScreen } from '@/app/components/ViewHiveScreen';
import { ViewApiaryScreen } from '@/app/components/ViewApiaryScreen';
import { ClientServicesScreen } from '@/app/components/ClientServicesScreen';
import { NotificationsScreen } from '@/app/components/NotificationsScreen';
import { authService } from './services/auth';
import type { Apiary as ApiaryModel } from './services/apiaries';
import type { Hive as HiveModel } from './services/hives';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile';

const ADMIN_NAV_ROUTES: Record<NavTab, string> = {
  dashboard: '/admin/dashboard',
  apiaries: '/admin/apiaries',
  hives: '/admin/hives',
  planning: '/admin/planning',
  finance: '/admin/finance',
  clients: '/admin/clients',
  notifications: '/admin/notifications',
  profile: '/admin/profile',
};

// ─── Auth guards ───────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  const user = authService.getLocalUser();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  const user = authService.getLocalUser();
  if (token && user) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}

// ─── Public pages ──────────────────────────────────────────────────────────────

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

function BeekeeperRegPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <BeekeeperRegistration
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBack={() => navigate('/')}
      onSuccess={() => navigate('/login')}
    />
  );
}

function LoginPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <LoginScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBackToHome={() => navigate('/')}
      onLoginSuccess={() => navigate('/admin/dashboard')}
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
      onLogout={onLogout}
      onCreateApiary={() => navigate('/admin/apiaries/new')}
      onViewApiary={(id) => navigate(`/admin/apiaries/${id}`)}
    />
  );
}

function AdminCreateApiaryPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editApiary = (location.state as { apiary?: ApiaryModel } | null)?.apiary ?? undefined;
  return (
    <CreateApiaryScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onClose={() => navigate('/admin/apiaries')}
      initialApiary={editApiary}
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
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/admin/apiaries')}
      onEditApiary={(apiary: ApiaryModel) => navigate('/admin/apiaries/edit', { state: { apiary } })}
      onAddHive={(id) => navigate('/admin/hives/new', { state: { apiaryId: id } })}
      onViewHive={(hiveId) => navigate(`/admin/hives/${hiveId}`)}
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
      onLogout={onLogout}
      onCreateHive={() => navigate('/admin/hives/new')}
      onViewHive={(id) => navigate(`/admin/hives/${id}`)}
    />
  );
}

function AdminCreateHivePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editHive = (location.state as { hive?: HiveModel } | null)?.hive ?? undefined;
  return (
    <CreateHiveScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onClose={() => navigate('/admin/hives')}
      initialHive={editHive}
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
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/admin/hives')}
      onEditHive={(hive: HiveModel) => navigate('/admin/hives/edit', { state: { hive } })}
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
      onLogout={onLogout}
      onCreateApiary={() => navigate('/admin/apiaries/new')}
      onCreateHive={() => navigate('/admin/hives/new')}
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

function AdminProfilePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ProfileScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
    />
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Brief check to restore auth state from localStorage
    setIsAuthChecking(false);
  }, []);

  const handleLogout = () => {
    authService.logout();
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
          <Route path="/register" element={<RedirectIfAuth><BeekeeperRegPage {...lp} /></RedirectIfAuth>} />
          <Route path="/login" element={<RedirectIfAuth><LoginPage {...lp} /></RedirectIfAuth>} />

          {/* Admin (Beekeeper) routes */}
          <Route path="/admin/dashboard" element={<RequireAuth><AdminDashboardPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries" element={<RequireAuth><AdminApiariesPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/new" element={<RequireAuth><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/edit" element={<RequireAuth><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/apiaries/:id" element={<RequireAuth><AdminViewApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives" element={<RequireAuth><AdminHivesPage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/new" element={<RequireAuth><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/edit" element={<RequireAuth><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/hives/:id" element={<RequireAuth><AdminViewHivePage {...ap} /></RequireAuth>} />
          <Route path="/admin/planning" element={<RequireAuth><AdminPlanningPage {...ap} /></RequireAuth>} />
          <Route path="/admin/finance" element={<RequireAuth><AdminFinancePage {...ap} /></RequireAuth>} />
          <Route path="/admin/clients" element={<RequireAuth><AdminClientsPage {...ap} /></RequireAuth>} />
          <Route path="/admin/notifications" element={<RequireAuth><AdminNotificationsPage {...ap} /></RequireAuth>} />
          <Route path="/admin/profile" element={<RequireAuth><AdminProfilePage {...ap} /></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

