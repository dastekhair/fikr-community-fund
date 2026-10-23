import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0b0e0c]/90 backdrop-blur-md border-b border-[#e0e4dd] dark:border-[#1f261f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {visibleLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-colors ${
                    isActive
                      ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] font-semibold shadow-xs'
                      : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c] dark:hover:text-white hover:bg-[#e8ebe6] dark:hover:bg-[#181d18]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Controls: User Profile / Auth State & Theme Toggle */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Logged in User Profile Info (linked to Account Settings) */}
            {currentUser ? (
              <Link
                to="/account"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e0e4dd] dark:border-[#1f261f] bg-white dark:bg-[#131713] text-xs hover:border-emerald-500/60 transition-colors cursor-pointer"
                title="Account Settings"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3] max-w-[140px] truncate">
                  {currentUser.name}
                </span>
                <RoleBadge role={currentUser.role} size="sm" />
              </Link>
            ) : null}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-full text-neutral-500 hover:text-[#0e0f0c] dark:text-neutral-400 dark:hover:text-[#f4f6f3] hover:bg-[#e8ebe6] dark:hover:bg-[#181d18] transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Login / Logout Button */}
            {currentUser ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-[#e8ebe6]/60 dark:hover:bg-[#181d18] transition-colors border border-[#e0e4dd] dark:border-[#1f261f]"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Member Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Header Controls: Theme Toggle & Hamburger Button (< md) */}
          <div className="flex md:hidden items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer touch-manipulation"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 pointer-events-none" /> : <Moon className="w-5 h-5 pointer-events-none" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer touch-manipulation"
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 pointer-events-none" /> : <Menu className="w-6 h-6 pointer-events-none" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay rendered via Portal to escape header backdrop-filter / sticky stacking context */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-start">
          {/* Backdrop (tap to close) */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity touch-none overscroll-contain"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />

          {/* Drawer Menu Panel */}
          <div
            className="relative z-10 w-full bg-white dark:bg-[#0b0e0c] border-b border-[#e0e4dd] dark:border-[#1f261f] shadow-2xl max-h-[85vh] overflow-y-auto px-5 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header inside drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-neutral-500 hover:bg-[#e8ebe6] dark:hover:bg-[#181d18] cursor-pointer touch-manipulation"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Logged in User Profile Info or Public Badge */}
            {currentUser ? (
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-[#e8ebe6]/60 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] flex items-center justify-between hover:border-emerald-500/50 transition-colors cursor-pointer touch-manipulation"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-[#0e0f0c] dark:text-[#f4f6f3]">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 truncate max-w-[200px]">
                    {currentUser.email}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                    Account & Security Settings →
                  </div>
                </div>
                <RoleBadge role={currentUser.role} size="sm" />
              </Link>
            ) : (
              <div className="p-3 rounded-2xl bg-[#e8ebe6]/60 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] text-xs text-neutral-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 pointer-events-none" />
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
                    `min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-full flex items-center transition-colors cursor-pointer touch-manipulation ${
                      isActive
                        ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] font-semibold'
                        : 'text-[#454745] dark:text-[#a3aba1] hover:bg-[#e8ebe6] dark:hover:bg-[#181d18]'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Login / Logout Button Full-Width */}
            <div className="pt-3 border-t border-[#e0e4dd]/70 dark:border-[#1f261f] space-y-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors border border-rose-200/60 dark:border-rose-900/40 cursor-pointer touch-manipulation"
                >
                  <LogOut className="w-4 h-4 pointer-events-none" />
                  <span>Sign Out ({currentUser.name})</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0e0f0c] dark:bg-white dark:text-[#0e0f0c] rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer touch-manipulation"
                >
                  <LogIn className="w-4 h-4 pointer-events-none" />
                  <span>Member Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
