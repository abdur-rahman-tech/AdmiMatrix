import React from 'react';
import {
  GraduationCap,
  TrendingUp,
  Users,
  Brain,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react';
import { UserRole, VerificationStatus, AdminUser } from '../../types';
import skylerOfficialLogo from '../../assets';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  datasetStatus: VerificationStatus;
  onResetDemo: () => void;
  onOpenDocs: () => void;
  onOpenApiKeyModal?: () => void;
  currentSessionUser?: AdminUser | null;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  datasetStatus,
  onResetDemo,
  onOpenDocs,
  onOpenApiKeyModal,
  currentSessionUser,
  darkMode = true,
  onToggleDarkMode
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'population', label: 'Population', icon: Users },
    { id: 'admissions', label: 'Admissions', icon: GraduationCap },
    { id: 'forecast', label: 'Forecast', icon: Brain },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'ai-assistant', label: 'Ask AI', icon: Sparkles },
    {
      id: 'admin',
      label: 'Admin',
      icon: currentSessionUser ? Unlock : Lock,
      adminOnly: false
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand: AdmiMatrix with Official Skyler Emblem */}
          <div
            id="brand-header-container"
            className="flex items-center space-x-3 select-none"
          >
            {/* Official Logo Emblem */}
            <button
              type="button"
              className="relative shrink-0 cursor-pointer focus:outline-none"
              onClick={() => setActiveTab('overview')}
              title="AdmiMatrix — Home"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 ring-2 ring-cyan-500/60 hover:ring-cyan-400 shadow-xs flex items-center justify-center transition-all duration-200">
                <img
                  src={skylerOfficialLogo}
                  alt="Official Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>
            </button>

            {/* Brand Text: AdmiMatrix */}
            <button
              type="button"
              className="cursor-pointer text-left flex flex-col justify-center focus:outline-none group"
              onClick={() => setActiveTab('overview')}
            >
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  AdmiMatrix
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                University of Chitral Analytics Platform
              </p>
            </button>
          </div>

          {/* Clean Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.adminOnly && userRole === 'VIEWER') {
                return null;
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ease-out cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls Area: Admin Session */}
          <div className="flex items-center space-x-2">
            {currentSessionUser && (
              <div className="flex items-center space-x-1 pl-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  title="Signed in to Admin Panel"
                >
                  <span className="hidden lg:inline mr-1 text-slate-500 dark:text-slate-400 font-normal">Active:</span>
                  {currentSessionUser.name.split(' ')[0]}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            if (item.adminOnly && userRole === 'VIEWER') return null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
