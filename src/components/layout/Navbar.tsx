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

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

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

          {/* Desktop Right Controls: User Profile / Auth State & Theme Toggle */}
          <div className="hidden md:flex items-center gap-2.5">
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

          {/* Mobile Header Controls: Theme Toggle & Hamburger Button (< md) */}
          <div className="flex md:hidden items-center gap-1 sm:gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-start">
          {/* Backdrop (tap to close) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />

          {/* Drawer Menu Panel */}
          <div className="relative z-10 w-full bg-white dark:bg-[#0A0A0C] border-b border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto px-5 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            {/* Header inside drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <Logo size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logged in User Profile Info or Public Badge */}
            {currentUser ? (
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 truncate max-w-[200px]">
                    {currentUser.email}
                  </div>
                </div>
                <RoleBadge role={currentUser.role} size="sm" />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Viewing Public Transparency Portal</span>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-1">
              {visibleLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[44px] px-3.5 py-2.5 text-sm font-medium rounded-xl flex items-center transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Login / Logout Button Full-Width */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors border border-rose-200/60 dark:border-rose-900/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({currentUser.name})</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Member Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
