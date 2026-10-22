import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Layers,
  FolderHeart,
  Info,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomTabBar: React.FC = () => {
  const { currentUser, tier } = useAuth();
  const isCoreMember = tier === 'core_member';

  const tabs = isCoreMember
    ? [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
        { name: 'Contributions', path: '/contributions', icon: CreditCard },
        { name: 'Ledger', path: '/ledger', icon: Layers },
        { name: 'Cases', path: '/cases', icon: FolderHeart },
      ]
    : [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
        { name: 'Withdrawals', path: '/withdrawals', icon: ReceiptText },
        { name: 'About', path: '/about', icon: Info },
        { name: 'Login', path: '/login', icon: LogIn },
      ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 dark:bg-[#0b0e0c]/95 backdrop-blur-md border-t border-[#e0e4dd] dark:border-[#1f261f] px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors select-none touch-manipulation ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-[#737672] dark:text-[#a3aba1] hover:text-[#0e0f0c] dark:hover:text-[#f4f6f3]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 shrink-0 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  <span className="text-[10px] leading-tight tracking-tight">
                    {tab.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
