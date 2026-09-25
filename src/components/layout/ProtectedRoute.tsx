import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserTier } from '../../types';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTiers?: UserTier[];
  requireTreasurerOrCoordinator?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedTiers = ['core_member'],
  requireTreasurerOrCoordinator = false
}) => {
  const { currentUser, tier, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isTierAllowed = allowedTiers.includes(tier);
  const isAdminAllowed = !requireTreasurerOrCoordinator || (currentUser?.isTreasurer || currentUser?.isCoordinator);

  if (!isTierAllowed || !isAdminAllowed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
          {requireTreasurerOrCoordinator ? 'Coordinator / Treasurer Access Only' : 'Core Member Access Required'}
        </h2>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
          {requireTreasurerOrCoordinator
            ? 'This section is restricted to the Treasurer and Coordinator/Secretary to administer member rosters and governance.'
            : 'To uphold our beneficiary dignity covenant and protect sensitive family details, this section is accessible only to verified Core Members.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" size="sm" icon={<LogIn className="w-3.5 h-3.5" />}>
              Sign In with Credentials
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
