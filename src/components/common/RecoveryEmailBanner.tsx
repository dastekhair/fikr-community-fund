import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ENABLE_EMAIL_CHANGE } from '../../lib/constants';
import { ShieldAlert, X } from 'lucide-react';

export const RecoveryEmailBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('fikr_dismiss_recovery_banner') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const isFikrOrg = Boolean(currentUser?.email?.toLowerCase().endsWith('@fikr.org'));

  // If email change is disabled in config, or user is not @fikr.org, or dismissed, hide banner
  if (!ENABLE_EMAIL_CHANGE || !isFikrOrg || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('fikr_dismiss_recovery_banner', 'true');
  };

  return (
    <aside
      aria-label="Account Recovery Notice"
      className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Add a real email so you can recover your account.
          </span>
          <Link
            to="/account"
            className="font-semibold underline underline-offset-2 text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 touch-manipulation inline-flex items-center min-h-[32px]"
          >
            Go to Account Settings →
          </Link>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-100 rounded-full transition-colors cursor-pointer touch-manipulation"
          aria-label="Dismiss recovery banner"
        >
          <X className="w-4 h-4 pointer-events-none" />
        </button>
      </div>
    </aside>
  );
};
