import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  BookOpen,
  Smartphone,
  Activity,
  Compass,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/register', label: 'Register & Consent', icon: UserPlus },
  { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
  { to: '/simulator', label: 'Simulated Phone', icon: Smartphone },
  { to: '/library', label: 'Message Library', icon: BookOpen },
  { to: '/logs', label: 'Provider & Cron Logs', icon: Activity },
  { to: '/roadmap', label: 'Scope & Roadmap', icon: Compass },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navContent = (
    <>
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center font-bold text-xs text-white tracking-tight">
              DL
            </div>
            <span className="font-semibold text-base tracking-tight text-white whitespace-nowrap">
              DignityLink
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          SMS &amp; WhatsApp MHM Prototype · Mock Providers Active
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-rose-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div>
          <div className="text-xs text-slate-400">
            {user?.role === 'coordinator' ? 'Program Coordinator' : 'Community Volunteer'}
          </div>
          <div className="text-sm font-medium text-white mt-0.5 truncate">{user?.name}</div>
          <div className="text-xs text-slate-400 truncate">
            Scope: {user?.role === 'coordinator' ? 'All Communities' : user?.community}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-rose-700 flex items-center justify-center font-bold text-xs">
            DL
          </div>
          <span className="font-semibold text-sm">DignityLink</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full">
            {navContent}
          </aside>
          <div
            className="flex-1 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0">
        {navContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
