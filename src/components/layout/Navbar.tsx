import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { RoleBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { currentUser, tier, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCoreMember = tier === 'core_member';
  const canViewMembers = Boolean(currentUser?.isAdmin || currentUser?.isTreasurer || currentUser?.isCoordinator || isCoreMember);

  const navLinks = [
    { name: 'Dashboard', path: '/', public: true },
    { name: 'Public Withdrawals', path: '/withdrawals', public: true },
    { name: 'Cases', path: '/cases', coreOnly: true },
    { name: 'Ledger', path: '/ledger', coreOnly: true },
    { name: 'Contributions', path: '/contributions', coreOnly: true },
    { name: 'Members', path: '/members', coreOnly: true },
    { name: 'About & Principles', path: '/about', public: true },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.coreOnly) return isCoreMember;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0A0A0C]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {visibleLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: User Profile / Auth State & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Logged in User Profile Info */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/90 dark:bg-[#121215] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-neutral-900 dark:text-white max-w-[140px] truncate">
                  {currentUser.name}
                </span>
                <RoleBadge role={currentUser.role} size="sm" />
              </div>
            ) : null}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Login / Logout Button */}
            {currentUser ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200/80 dark:border-neutral-800"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Member Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg text-neutral-500"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] px-4 pt-2 pb-5 space-y-3">
          {/* User state badge in mobile */}
          {currentUser ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {currentUser.email}
                </div>
              </div>
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 text-xs text-neutral-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Viewing Public Transparency Portal</span>
            </div>
          )}

          {/* Nav items */}
          <div className="flex flex-col space-y-1">
            {visibleLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Login/Logout CTA */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-lg bg-rose-50 dark:bg-rose-950/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out ({currentUser.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Member Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
