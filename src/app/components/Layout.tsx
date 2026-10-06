import { useState, useEffect } from 'react';
import { getCurrentUser, clearAuth, UserProfile } from '../lib/api';
import { LoginPage } from './LoginPage';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { HospitalPatients } from './HospitalPatients';
import { HospitalClinical } from './HospitalClinical';
import { HospitalInpatient } from './HospitalInpatient';
import { HospitalBilling } from './HospitalBilling';
import { HospitalSHA } from './HospitalSHA';
import { HospitalProcurement } from './HospitalProcurement';
import { HospitalAccounts } from './HospitalAccounts';
import { HospitalHR } from './HospitalHR';
import { HospitalAdmin } from './HospitalAdmin';
import { HospitalHeader } from './HospitalHeader';
import { Button } from './ui/button';
import { ShieldAlert } from 'lucide-react';

const ROLE_ALLOWED_PAGES: Record<string, string[]> = {
  ADMINISTRATOR: ['dashboard', 'patients', 'clinical', 'inpatient', 'billing', 'sha', 'procurement', 'accounts', 'hr', 'administration'],
  DOCTOR: ['patients', 'clinical', 'inpatient'],
  TRIAGE_NURSE: ['patients', 'clinical'],
  NURSE: ['patients', 'clinical', 'inpatient'],
  WARD_NURSE: ['patients', 'clinical', 'inpatient'],
  LABORATORY: ['clinical'],
  LAB_TECHNICIAN: ['clinical'],
  PHARMACIST: ['clinical'],
  RECEPTIONIST: ['patients', 'clinical'],
  BILLING: ['patients', 'billing', 'sha'],
  BILLING_OFFICER: ['patients', 'billing', 'sha'],
  PROCUREMENT: ['procurement'],
  PROCUREMENT_OFFICER: ['procurement'],
  ACCOUNTS: ['billing', 'accounts'],
  ACCOUNTS_OFFICER: ['billing', 'accounts'],
  HR: ['hr'],
  HR_OFFICER: ['hr'],
};

function getDefaultPageForRole(role: string): string {
  const r = role.toUpperCase();
  switch (r) {
    case 'RECEPTIONIST':
      return 'patients';
    case 'TRIAGE_NURSE':
    case 'DOCTOR':
    case 'LABORATORY':
    case 'LAB_TECHNICIAN':
    case 'PHARMACIST':
      return 'clinical';
    case 'NURSE':
    case 'WARD_NURSE':
      return 'inpatient';
    case 'BILLING':
    case 'BILLING_OFFICER':
      return 'billing';
    case 'PROCUREMENT':
    case 'PROCUREMENT_OFFICER':
      return 'procurement';
    case 'ACCOUNTS':
    case 'ACCOUNTS_OFFICER':
      return 'accounts';
    case 'HR':
    case 'HR_OFFICER':
      return 'hr';
    case 'ADMINISTRATOR':
    default:
      return 'dashboard';
  }
}

export function Layout() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentPage(getDefaultPageForRole(user.role));
    }
    setIsReady(true);
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentPage(getDefaultPageForRole(user.role));
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
  };

  if (!isReady) {
    return null;
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    const userRole = (currentUser.role || '').toUpperCase();
    const allowed = ROLE_ALLOWED_PAGES[userRole] || ['patients'];

    // Enforce Frontend RBAC Access Boundary
    if (userRole !== 'ADMINISTRATOR' && !allowed.includes(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Access Restricted (RBAC Policy)</h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Your assigned staff role (<span className="font-semibold text-foreground">{currentUser.role}</span>) does not have authorization to view the <span className="font-semibold text-foreground">{currentPage.toUpperCase()}</span> workstation.
            </p>
          </div>
          <Button size="sm" onClick={() => setCurrentPage(getDefaultPageForRole(currentUser.role))}>
            Return to Authorized Workstation
          </Button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <HospitalPatients />;
      case 'clinical':
        return <HospitalClinical />;
      case 'inpatient':
        return <HospitalInpatient />;
      case 'billing':
        return <HospitalBilling />;
      case 'sha':
        return <HospitalSHA />;
      case 'procurement':
        return <HospitalProcurement />;
      case 'accounts':
        return <HospitalAccounts />;
      case 'hr':
        return <HospitalHR />;
      case 'administration':
        return <HospitalAdmin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden p-4 sm:p-5 gap-4 sm:gap-5">
      {/* Left: Floating green rectangle Nav Bar */}
      {isSidebarVisible && (
        <aside className="flex-shrink-0 h-full animate-in fade-in slide-in-from-left duration-300">
          <Sidebar
            currentPage={currentPage}
            currentUser={currentUser}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
            onHideSidebar={() => setIsSidebarVisible(false)}
          />
        </aside>
      )}

      {/* Right Column: Floating green rectangle Header + Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full gap-4 overflow-hidden">
        <HospitalHeader
          currentUser={currentUser}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
          onSearchPatient={(_q) => {
            setCurrentPage('patients');
          }}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto rounded-3xl bg-muted/30 border border-border/40 shadow-xs">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}