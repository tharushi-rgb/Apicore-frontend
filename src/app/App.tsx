import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { SplashScreen } from '@/app/components/SplashScreen';
import { BeekeeperRegistration } from '@/app/components/BeekeeperRegistration';
import { LoginScreen } from '@/app/components/LoginScreen';
import { ForgotPasswordScreen } from '@/app/components/ForgotPasswordScreen';
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
import { AnalyticsScreen } from '@/app/components/AnalyticsScreen';
import { ManageHelpersScreen } from '@/app/components/ManageHelpersScreen';
import { authService } from './services/auth';
import type { Apiary as ApiaryModel } from './services/apiaries';
import type { Hive as HiveModel } from './services/hives';

type Language = 'en' | 'si' | 'ta';
type NavTab = 'dashboard' | 'apiaries' | 'hives' | 'planning' | 'finance' | 'clients' | 'notifications' | 'profile' | 'analytics';

const ADMIN_NAV_ROUTES: Record<NavTab, string> = {
  dashboard: '/dashboard',
  apiaries: '/apiaries',
  hives: '/hives',
  planning: '/planning',
  finance: '/finance',
  clients: '/clients',
  notifications: '/notifications',
  profile: '/profile',
  analytics: '/analytics',
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
  if (token && user) return <Navigate to="/dashboard" replace />;
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
      onLoginSuccess={() => navigate('/dashboard')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

function ForgotPasswordPage({ lang, onLangChange }: { lang: Language; onLangChange: (l: Language) => void }) {
  const navigate = useNavigate();
  return (
    <ForgotPasswordScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onBackToLogin={() => navigate('/login')}
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
      onCreateApiary={() => navigate('/apiaries/new')}
      onViewApiary={(id) => navigate(`/apiaries/${id}`)}
      onAddHive={(apiary) => navigate('/hives/new', { state: { apiaryId: apiary.id } })}
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
      onClose={() => navigate('/apiaries')}
      initialApiary={editApiary}
    />
  );
}

function AdminViewApiaryPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const apiaryId = parseInt(id || '0', 10);
  if (!apiaryId) return <Navigate to="/apiaries" replace />;
  return (
    <ViewApiaryScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/apiaries')}
      onEditApiary={(apiary: ApiaryModel) => navigate('/apiaries/edit', { state: { apiary } })}
      onAddHive={(id) => navigate('/hives/new', { state: { apiaryId: id } })}
      onViewHive={(hiveId) => navigate(`/hives/${hiveId}`)}
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
      onCreateHive={() => navigate('/hives/new')}
      onViewHive={(id) => navigate(`/hives/${id}`)}
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
      onClose={() => navigate('/hives')}
      initialHive={editHive}
    />
  );
}

function AdminViewHivePage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const hiveId = parseInt(id || '0', 10);
  if (!hiveId) return <Navigate to="/hives" replace />;
  return (
    <ViewHiveScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onLogout={onLogout}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onBack={() => navigate('/hives')}
      onEditHive={(hive: HiveModel) => navigate('/hives/edit', { state: { hive } })}
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
      onCreateApiary={() => navigate('/apiaries/new')}
      onCreateHive={() => navigate('/hives/new')}
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

// ─── Main App ──────────────────────────────────────────────────────────────────

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

function AdminAnalyticsPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <AnalyticsScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onBack={() => navigate('/dashboard')}
    />
  );
}

function ManageHelpersPage({ lang, onLangChange, onLogout }: { lang: Language; onLangChange: (l: Language) => void; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <ManageHelpersScreen
      selectedLanguage={lang}
      onLanguageChange={onLangChange}
      onNavigate={(tab) => navigate(ADMIN_NAV_ROUTES[tab])}
      onLogout={onLogout}
      onBack={() => navigate('/profile')}
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
    window.location.replace('/login');
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-stone-900 flex justify-center overflow-hidden">
        <div className="w-full max-w-[390px] h-full bg-white shadow-2xl relative">
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
      <div className="w-full max-w-[390px] h-full bg-white shadow-2xl relative z-0">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RedirectIfAuth><SplashPage {...lp} /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><BeekeeperRegPage {...lp} /></RedirectIfAuth>} />
          <Route path="/login" element={<RedirectIfAuth><LoginPage {...lp} /></RedirectIfAuth>} />
          <Route path="/forgot-password" element={<RedirectIfAuth><ForgotPasswordPage {...lp} /></RedirectIfAuth>} />

          {/* Beekeeper routes */}
          <Route path="/dashboard" element={<RequireAuth><AdminDashboardPage {...ap} /></RequireAuth>} />
          <Route path="/apiaries" element={<RequireAuth><AdminApiariesPage {...ap} /></RequireAuth>} />
          <Route path="/apiaries/new" element={<RequireAuth><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/apiaries/edit" element={<RequireAuth><AdminCreateApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/apiaries/:id" element={<RequireAuth><AdminViewApiaryPage {...ap} /></RequireAuth>} />
          <Route path="/hives" element={<RequireAuth><AdminHivesPage {...ap} /></RequireAuth>} />
          <Route path="/hives/new" element={<RequireAuth><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/hives/edit" element={<RequireAuth><AdminCreateHivePage {...ap} /></RequireAuth>} />
          <Route path="/hives/:id" element={<RequireAuth><AdminViewHivePage {...ap} /></RequireAuth>} />
          <Route path="/planning" element={<RequireAuth><AdminPlanningPage {...ap} /></RequireAuth>} />
          <Route path="/finance" element={<RequireAuth><AdminFinancePage {...ap} /></RequireAuth>} />
          <Route path="/clients" element={<RequireAuth><AdminClientsPage {...ap} /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><AdminNotificationsPage {...ap} /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><AdminProfilePage {...ap} /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><AdminAnalyticsPage {...ap} /></RequireAuth>} />
          <Route path="/helpers" element={<RequireAuth><ManageHelpersPage {...ap} /></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

