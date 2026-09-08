import { useState } from 'react';
import { authApi, UserProfile } from '../lib/api';
import { Badge } from './ui/badge';
import {
  Cross,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Stethoscope,
  Users,
  Activity,
  TestTube,
  Pill,
  CreditCard,
  Truck,
  Calculator,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Check,
  Building2,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

type DepartmentFilter = 'ALL' | 'FRONT_OFFICE' | 'CLINICAL' | 'INPATIENT' | 'BACK_OFFICE' | 'EXECUTIVE';

interface DemoRoleInfo {
  username: string;
  roleName: string;
  staffName: string;
  category: 'Front Office' | 'Clinical' | 'Inpatient' | 'Back Office' | 'Executive';
  filterCategory: DepartmentFilter;
  icon: any;
  description: string;
  accessScope: string;
}

const DEMO_ACCOUNTS: DemoRoleInfo[] = [
  {
    username: 'admin',
    roleName: 'Administrator',
    staffName: 'Dr. Arthur Pendelton',
    category: 'Executive',
    filterCategory: 'EXECUTIVE',
    icon: Shield,
    description: 'System Administration, RBAC & Audit',
    accessScope: 'Entire hospital governance',
  },
  {
    username: 'reception',
    roleName: 'Receptionist',
    staffName: 'Faith Wanjiku',
    category: 'Front Office',
    filterCategory: 'FRONT_OFFICE',
    icon: Users,
    description: 'Registration, MRN & Queue',
    accessScope: 'Front Office & Reception',
  },
  {
    username: 'triage',
    roleName: 'Triage Nurse',
    staffName: 'Sarah Cherono',
    category: 'Clinical',
    filterCategory: 'CLINICAL',
    icon: Activity,
    description: 'Vital Signs, BMI & Routing',
    accessScope: 'Triage & Clinical Queue',
  },
  {
    username: 'doctor',
    roleName: 'Doctor / Clinician',
    staffName: 'Dr. Jane Doe',
    category: 'Clinical',
    filterCategory: 'CLINICAL',
    icon: Stethoscope,
    description: 'Consultations, ICD-10 & Rx',
    accessScope: 'Consultations & Clinical Orders',
  },
  {
    username: 'laboratory',
    roleName: 'Laboratory Staff',
    staffName: 'Daniel Kiprotich',
    category: 'Clinical',
    filterCategory: 'CLINICAL',
    icon: TestTube,
    description: 'Specimens & Lab Results',
    accessScope: 'Laboratory Queue & Tests',
  },
  {
    username: 'pharmacy',
    roleName: 'Pharmacist',
    staffName: 'Brian Otieno',
    category: 'Clinical',
    filterCategory: 'CLINICAL',
    icon: Pill,
    description: 'Rx Verification & Dispensing',
    accessScope: 'Dispensary & Inventory',
  },
  {
    username: 'billing',
    roleName: 'Billing / Cashier',
    staffName: 'Kevin Mutua',
    category: 'Front Office',
    filterCategory: 'FRONT_OFFICE',
    icon: CreditCard,
    description: 'Invoicing & Payments',
    accessScope: 'Billing Ledger & Cash Office',
  },
  {
    username: 'nurse',
    roleName: 'Nurse / Inpatient',
    staffName: 'Grace Achieng',
    category: 'Inpatient',
    filterCategory: 'INPATIENT',
    icon: Activity,
    description: 'Ward Beds & MAR Charting',
    accessScope: 'Inpatient Wards & Beds',
  },
  {
    username: 'procurement',
    roleName: 'Procurement Officer',
    staffName: 'Patrick Mwangi',
    category: 'Back Office',
    filterCategory: 'BACK_OFFICE',
    icon: Truck,
    description: 'Requisitions & Stores',
    accessScope: 'Procurement & Supply Chain',
  },
  {
    username: 'accounts',
    roleName: 'Accounts Officer',
    staffName: 'David Kariuki',
    category: 'Back Office',
    filterCategory: 'BACK_OFFICE',
    icon: Calculator,
    description: 'General Ledger & Accounts',
    accessScope: 'Accounts & Statements',
  },
  {
    username: 'hr',
    roleName: 'HR Officer',
    staffName: 'Mercy Nyaboke',
    category: 'Back Office',
    filterCategory: 'BACK_OFFICE',
    icon: UserCheck,
    description: 'Staff Records & Payroll',
    accessScope: 'HR Directory & Payroll',
  },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('doctor');
  const [password, setPassword] = useState('Hospital2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<DemoRoleInfo>(DEMO_ACCOUNTS[3]);
  const [categoryFilter, setCategoryFilter] = useState<DepartmentFilter>('ALL');

  const handleSelectDemo = (demo: DemoRoleInfo) => {
    setSelectedDemoRole(demo);
    setIdentifier(demo.username);
    setPassword('Hospital2026!');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Please enter both your username/email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(identifier, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = categoryFilter === 'ALL'
    ? DEMO_ACCOUNTS
    : DEMO_ACCOUNTS.filter((r) => r.filterCategory === categoryFilter);

  return (
    <div className="h-screen w-screen bg-background bg-gradient-to-br from-sidebar/60 via-background to-sidebar-accent/50 flex items-center justify-center p-3 sm:p-5 overflow-hidden no-scrollbar select-none">
      
      {/* Soft ambient lighting matching nav bar theme */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sidebar-primary/15 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* Main Container: Single cohesive luxury card matching the nav bar */}
      <div className="w-full max-w-5xl rounded-3xl bg-gradient-to-b from-sidebar via-sidebar to-sidebar-accent border border-sidebar-border/30 shadow-2xl backdrop-blur-xl p-5 sm:p-7 relative z-10 flex flex-col justify-between max-h-[calc(100vh-2rem)] overflow-hidden">
        
        {/* Top Header Row inside the card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-sidebar-border/25 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-sidebar-primary/30 flex-shrink-0 transition-transform hover:scale-105 cursor-pointer">
              <Cross className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-sidebar-foreground leading-tight truncate">
                Puche Medical Clinic
              </h1>
              <p className="text-[11px] text-sidebar-foreground/70 font-medium truncate mt-0.5">
                Clinical Management Platform • Facility: SHA-FAC-7890-KEN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] gap-1.5 py-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DB: SQLite Connected
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] gap-1.5 py-1 px-2.5 rounded-full bg-sidebar-primary/10 text-sidebar-foreground border-sidebar-border/50 font-semibold shadow-xs"
            >
              <Shield className="w-3 h-3 text-sidebar-primary" />
              RBAC Enforced
            </Badge>
          </div>
        </div>

        {/* Content Body: Side-by-side balanced columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 items-stretch flex-1 min-h-0 overflow-hidden">
          
          {/* Left Column: Sign In Form */}
          <div className="lg:col-span-5 flex flex-col justify-between pr-0 lg:pr-3 border-b lg:border-b-0 lg:border-r border-sidebar-border/20 pb-4 lg:pb-0">
            <div>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-sidebar-foreground">
                    Station Sign In
                  </h2>
                  {selectedDemoRole && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-foreground border border-sidebar-border/40">
                      {selectedDemoRole.roleName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-sidebar-foreground/70 mt-0.5 leading-relaxed">
                  Enter authorized credentials or pick a workstation on the right.
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-[11px]">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-sidebar-foreground block">
                    Workstation Username / Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-sidebar-foreground/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. doctor, reception, or admin"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      className="w-full bg-sidebar-accent/50 hover:bg-sidebar-accent/80 focus:bg-background border border-sidebar-border/40 rounded-2xl pl-10 pr-3 py-2 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 outline-none focus:ring-2 focus:ring-sidebar-primary/30 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-sidebar-foreground block">
                      Password
                    </label>
                    <span className="text-[10px] text-sidebar-foreground/70 font-mono">
                      Demo: <code className="font-bold text-sidebar-foreground">Hospital2026!</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sidebar-foreground/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      className="w-full bg-sidebar-accent/50 hover:bg-sidebar-accent/80 focus:bg-background border border-sidebar-border/40 rounded-2xl pl-10 pr-9 py-2 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 outline-none focus:ring-2 focus:ring-sidebar-primary/30 transition-all shadow-inner font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 text-sidebar-foreground/70 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-sidebar-border text-sidebar-primary focus:ring-sidebar-primary h-3.5 w-3.5"
                    />
                    <span className="text-[11px]">Remember station</span>
                  </label>
                  <span className="text-[11px] text-sidebar-primary hover:underline cursor-pointer font-medium">
                    IT Helpdesk
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-2xl font-semibold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 hover:scale-[1.01] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Enter Workstation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-2 text-[10px] text-sidebar-foreground/60 flex items-center justify-between">
              <span>Bcrypt hash authenticated</span>
              <span className="font-mono">SHA Interoperable</span>
            </div>
          </div>

          {/* Right Column: Workstations Switcher (11 Roles) */}
          <div className="lg:col-span-7 flex flex-col justify-between pl-0 lg:pl-3 min-h-0 overflow-hidden">
            <div>
              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-sidebar-foreground">
                  Quick Role Switcher
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 font-medium">
                  Click card to auto-fill
                </span>
              </div>

              <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: 'ALL', label: 'All (11)' },
                  { id: 'FRONT_OFFICE', label: 'Front Office' },
                  { id: 'CLINICAL', label: 'Clinical' },
                  { id: 'INPATIENT', label: 'Inpatient' },
                  { id: 'BACK_OFFICE', label: 'Back Office' },
                  { id: 'EXECUTIVE', label: 'Executive' },
                ].map((filter) => {
                  const isActive = categoryFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setCategoryFilter(filter.id as DepartmentFilter)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-sm scale-105'
                          : 'bg-sidebar-accent/60 hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground border border-sidebar-border/30'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {/* Roles Grid - NO SCROLLBARS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[260px] pr-0.5">
                {filteredRoles.map((demo) => {
                  const Icon = demo.icon;
                  const isSelected = selectedDemoRole?.username === demo.username;

                  return (
                    <button
                      key={demo.username}
                      type="button"
                      onClick={() => handleSelectDemo(demo)}
                      className={`p-2.5 rounded-2xl transition-all duration-200 text-left relative flex flex-col justify-between cursor-pointer overflow-hidden border ${
                        isSelected
                          ? 'bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/30 border-sidebar-primary scale-[1.02]'
                          : 'bg-gradient-to-br from-sidebar-accent/70 to-sidebar-accent/50 hover:from-sidebar-accent hover:to-sidebar-accent/90 border-sidebar-border/30 text-sidebar-foreground hover:scale-[1.02]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                          <Check className="w-3 h-3 text-sidebar-primary-foreground" />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-sidebar-primary/15 text-sidebar-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <p className="text-[11px] font-bold leading-tight truncate">
                            {demo.roleName}
                          </p>
                          <p
                            className={`text-[9px] font-mono mt-0.5 truncate ${
                              isSelected ? 'text-sidebar-primary-foreground/80' : 'text-sidebar-foreground/60'
                            }`}
                          >
                            @{demo.username}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-sidebar-border/20 flex items-center justify-between text-[9px]">
                        <span className="truncate max-w-[90px] font-medium opacity-80">
                          {demo.staffName.split(' ')[0]}
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-[8px] opacity-90">
                          {demo.filterCategory === 'FRONT_OFFICE' ? 'Front' : demo.filterCategory === 'BACK_OFFICE' ? 'Back' : demo.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-sidebar-foreground/70 flex items-center justify-between border-t border-sidebar-border/20 mt-2">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-sidebar-primary" />
                <span>
                  Universal password: <code className="bg-sidebar-accent px-1.5 py-0.5 rounded font-mono font-bold text-sidebar-foreground">Hospital2026!</code>
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live SQLite Database
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
