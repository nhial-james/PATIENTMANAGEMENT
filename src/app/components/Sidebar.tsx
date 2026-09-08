import { useState } from 'react';
import { cn } from './ui/utils';
import { UserProfile } from '../lib/api';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  Settings2,
  Cross,
  X,
  CreditCard,
  Shield,
  Truck,
  Calculator,
  UserCheck,
  LogOut,
  PanelLeftClose,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  currentUser: UserProfile;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onHideSidebar?: () => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: any;
  description: string;
  allowedRoles: string[];
}

const ALL_NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Hospital overview',
    allowedRoles: ['ADMINISTRATOR'],
  },
  {
    id: 'patients',
    name: 'Patients',
    icon: Users,
    description: 'Reception & directory',
    allowedRoles: ['ADMINISTRATOR', 'RECEPTIONIST', 'TRIAGE_NURSE', 'DOCTOR', 'BILLING', 'BILLING_OFFICER'],
  },
  {
    id: 'clinical',
    name: 'Clinical',
    icon: Stethoscope,
    description: 'Triage, Doctor, Lab, Rx',
    allowedRoles: [
      'ADMINISTRATOR',
      'DOCTOR',
      'TRIAGE_NURSE',
      'LABORATORY',
      'LAB_TECHNICIAN',
      'PHARMACIST',
      'NURSE',
      'WARD_NURSE',
      'RECEPTIONIST',
    ],
  },
  {
    id: 'inpatient',
    name: 'Inpatient',
    icon: BedDouble,
    description: 'Wards & MAR charting',
    allowedRoles: ['ADMINISTRATOR', 'NURSE', 'WARD_NURSE', 'DOCTOR'],
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: CreditCard,
    description: 'Invoices & receipts',
    allowedRoles: ['ADMINISTRATOR', 'BILLING', 'BILLING_OFFICER', 'ACCOUNTS', 'ACCOUNTS_OFFICER'],
  },
  {
    id: 'sha',
    name: 'SHA Portal',
    icon: Shield,
    description: 'Universal healthcare claims',
    allowedRoles: ['ADMINISTRATOR', 'BILLING', 'BILLING_OFFICER'],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    icon: Truck,
    description: 'Requisitions & stores',
    allowedRoles: ['ADMINISTRATOR', 'PROCUREMENT', 'PROCUREMENT_OFFICER'],
  },
  {
    id: 'accounts',
    name: 'Accounts',
    icon: Calculator,
    description: 'General ledger & trial balance',
    allowedRoles: ['ADMINISTRATOR', 'ACCOUNTS', 'ACCOUNTS_OFFICER'],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    icon: UserCheck,
    description: 'Staff & payroll',
    allowedRoles: ['ADMINISTRATOR', 'HR', 'HR_OFFICER'],
  },
  {
    id: 'administration',
    name: 'Administration',
    icon: Settings2,
    description: 'Users, roles & audit',
    allowedRoles: ['ADMINISTRATOR'],
  },
];

export function Sidebar({
  currentPage,
  currentUser,
  onPageChange,
  onLogout,
  onHideSidebar,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavigationClick = (pageId: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => onPageChange(pageId), 150);
    } else {
      onPageChange(pageId);
    }
  };

  const userRole = currentUser.role.toUpperCase();
  const visibleItems = ALL_NAVIGATION_ITEMS.filter(
    (item) => item.allowedRoles.includes('ADMINISTRATOR') && userRole === 'ADMINISTRATOR'
      ? true
      : item.allowedRoles.includes(userRole)
  );

  return (
    <div className="h-full flex flex-col">
      <div 
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out rounded-3xl",
          "bg-gradient-to-b from-sidebar via-sidebar to-sidebar-accent shadow-2xl border border-sidebar-border/20 overflow-hidden",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        {/* Header with Logo and Hide Action */}
        <div className="p-4 sm:p-5 flex flex-col items-center relative flex-shrink-0">
          {/* Action buttons when expanded */}
          {isExpanded && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {onHideSidebar && (
                <button
                  onClick={onHideSidebar}
                  title="Hide Navigation Bar"
                  className="w-7 h-7 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer text-sidebar-foreground"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse to icons"
                className="w-7 h-7 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer text-sidebar-foreground"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action button when collapsed */}
          {!isExpanded && onHideSidebar && (
            <button
              onClick={onHideSidebar}
              title="Hide Navigation Bar"
              className="mb-2 p-1.5 rounded-full bg-sidebar-accent/40 hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all hover:scale-110 cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
          
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Click to collapse" : "Click to expand"}
            className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform text-sidebar-primary-foreground"
          >
            <Cross className="w-6 h-6" />
          </div>

          {isExpanded && (
            <div className="mt-2.5 text-center">
              <h2 className="text-sidebar-foreground font-semibold text-base whitespace-nowrap">
                HMIS
              </h2>
              <p className="text-sidebar-foreground/70 text-xs whitespace-nowrap mt-0.5">
                Hospital Management
              </p>
            </div>
          )}
        </div>

        {/* Navigation - NO SCROLLBARS in collapsed/hide mode or expanded */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNavigationClick(item.id)}
                  className={cn(
                    "transition-all duration-300 flex items-center relative overflow-hidden",
                    "hover:scale-105 hover:shadow-lg cursor-pointer",
                    isExpanded 
                      ? "w-full px-3.5 py-2.5 justify-start rounded-xl" 
                      : "w-11 h-11 justify-center mx-auto rounded-full",
                    isActive
                      ? "bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30 scale-105"
                      : "bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 hover:from-sidebar-primary/80 hover:to-sidebar-primary/60"
                  )}
                >
                  <Icon className={cn(
                    "transition-colors duration-300 flex-shrink-0",
                    "w-5 h-5",
                    isActive 
                      ? "text-sidebar-primary-foreground" 
                      : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                  )} />
                  
                  {isExpanded && (
                    <div className="ml-3 overflow-hidden text-left">
                      <div className={cn(
                        "font-medium text-xs whitespace-nowrap transition-colors duration-300",
                        isActive 
                          ? "text-sidebar-primary-foreground" 
                          : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                      )}>
                        {item.name}
                      </div>
                      <div className={cn(
                        "text-[10px] mt-0.5 whitespace-nowrap truncate",
                        isActive
                          ? "text-sidebar-primary-foreground/70"
                          : "text-sidebar-accent-foreground/60 group-hover:text-sidebar-primary-foreground/70"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && !isExpanded && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-sidebar-primary opacity-20 animate-pulse" />
                      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary rounded-l-full" />
                    </>
                  )}
                  
                  {/* Active indicator for expanded state */}
                  {isActive && isExpanded && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                    <div className="font-semibold text-xs">{item.name}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{item.description}</div>
                    {/* Tooltip arrow */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Section & Sign Out in Footer */}
        <div className="p-3 border-t border-sidebar-border/20 flex-shrink-0">
          <div className="relative group">
            {isExpanded ? (
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border/30">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-md text-sidebar-primary-foreground font-semibold text-xs flex-shrink-0">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-sidebar-foreground font-medium text-xs truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-sidebar-foreground/70 text-[10px] truncate">
                      {currentUser.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div 
                  className="w-11 h-11 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer"
                  onClick={() => setIsExpanded(true)}
                  title={currentUser.fullName}
                >
                  <span className="text-sidebar-primary-foreground font-semibold text-xs">
                    {currentUser.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </span>
                </div>
                
                {/* Profile tooltip for collapsed state */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                  <div className="font-semibold text-xs">{currentUser.fullName}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{currentUser.role} • {currentUser.department || 'Staff'}</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}