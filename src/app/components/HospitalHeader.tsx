import { useState } from 'react';
import { UserProfile } from '../lib/api';
import { Search, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react';

interface HospitalHeaderProps {
  currentUser: UserProfile;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  onSearchPatient?: (query: string) => void;
  onLogout: () => void;
}

export function HospitalHeader({
  currentUser,
  isSidebarVisible = true,
  onToggleSidebar,
  onSearchPatient,
  onLogout,
}: HospitalHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchPatient && searchQuery.trim()) {
      onSearchPatient(searchQuery.trim());
    }
  };

  const userInitial = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="w-full">
      <div className="rounded-3xl bg-gradient-to-r from-sidebar via-sidebar to-sidebar-accent border border-sidebar-border/30 shadow-xl px-5 py-3 flex items-center justify-between gap-4 backdrop-blur-md">
        
        {/* Left: Hide/Unhide Sidebar Button & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarVisible ? "Hide Navigation Bar" : "Unhide Navigation Bar"}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-sidebar-accent/70 hover:bg-sidebar-accent border border-sidebar-border/40 text-sidebar-foreground text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-xs cursor-pointer flex-shrink-0"
            >
              {isSidebarVisible ? (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Hide Nav</span>
                </>
              ) : (
                <>
                  <PanelLeft className="w-4 h-4 text-sidebar-primary" />
                  <span className="text-[11px] font-bold text-sidebar-primary">Unhide Nav</span>
                </>
              )}
            </button>
          )}

          {/* Quick Patient Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 text-sidebar-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search MRN, Name, National ID, Phone..."
              className="w-full bg-sidebar-accent/50 hover:bg-sidebar-accent/80 focus:bg-background border border-sidebar-border/30 rounded-full pl-10 pr-4 py-2 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 outline-none focus:ring-2 focus:ring-sidebar-primary/30 transition-all shadow-inner"
            />
          </form>
        </div>

        {/* Right: Active Staff Badge & Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-sidebar-accent/60 border border-sidebar-border/30 shadow-xs">
            <div className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground rounded-full flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0">
              {userInitial}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-sidebar-foreground leading-none">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-sidebar-primary/10 text-sidebar-foreground border border-sidebar-border/40">
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[10px] text-sidebar-foreground/70 font-medium block leading-none mt-1">
                {currentUser.department || 'Hospital Operations'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/20 text-xs font-semibold transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
