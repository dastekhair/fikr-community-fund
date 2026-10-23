import React, { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ENABLE_EMAIL_CHANGE } from '../lib/constants';
import { RoleBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Shield,
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Info,
  UserCheck
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email Update State
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const isFikrAddress = Boolean(currentUser?.email?.toLowerCase().endsWith('@fikr.org'));

  // Handler: Change Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 10) {
      setPasswordError('New password must be at least 10 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    const user = auth?.currentUser;
    if (!user || !user.email) {
      setPasswordError('You must be signed in to perform this action.');
      return;
    }

    try {
      setPasswordLoading(true);

      // 1. Re-authenticate with current credentials
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      const code = err.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect. Please verify and try again.');
      } else if (code === 'auth/weak-password') {
        setPasswordError('Password is too weak. Please use at least 10 characters with numbers or symbols.');
      } else if (code === 'auth/requires-recent-login') {
        setPasswordError('Security check: This action requires a recent sign-in. Please log out and log back in, then try again.');
      } else if (code === 'auth/too-many-requests') {
        setPasswordError('Too many failed attempts. Please try again later.');
      } else {
        setPasswordError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handler: Request Email Change Verification
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const targetEmail = newEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (targetEmail === currentUser?.email?.toLowerCase()) {
      setEmailError('The new email must be different from your current email.');
      return;
    }

    const user = auth?.currentUser;
    if (!user) {
      setEmailError('You must be signed in to perform this action.');
      return;
    }

    try {
      setEmailLoading(true);

      // Dispatches verification email to the new address
      await verifyBeforeUpdateEmail(user, targetEmail);

      setEmailSuccess(
        `Verification email dispatched to ${targetEmail}. Please check your inbox and click the verification link. Your login email will update automatically once verified.`
      );
      setNewEmail('');
    } catch (err: any) {
      console.error('Email update error:', err);
      const code = err.code || '';
      if (code === 'auth/invalid-email') {
        setEmailError('Invalid email format. Please verify the address.');
      } else if (code === 'auth/email-already-in-use') {
        setEmailError('This email is already associated with another account.');
      } else if (code === 'auth/requires-recent-login') {
        setEmailError('Security check: This action requires a recent sign-in. Please log out, log back in, and try again.');
      } else if (code === 'auth/too-many-requests') {
        setEmailError('Too many attempts. Please try again later.');
      } else {
        setEmailError(err.message || 'Failed to send verification email. Please try again.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
          Account Settings
        </h1>
        <p className="text-sm text-[#454745] dark:text-[#a3aba1] mt-1 font-normal">
          Manage your personal credentials, login email, and security settings.
        </p>
      </div>

      {/* Profile Overview Card */}
      <section className="bg-white dark:bg-[#121513] rounded-2xl border border-[#e0e4dd] dark:border-[#1f261f] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
          <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
              Profile Overview
            </h2>
            <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
              Your registered identity in the Fikr Community Fund
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <span className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider block">
              Full Name
            </span>
            <span className="text-sm font-medium text-[#0e0f0c] dark:text-[#f4f6f3] mt-0.5 block">
              {currentUser?.name || 'Member'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider block">
              Current Login
            </span>
            <span className="text-sm font-medium text-[#0e0f0c] dark:text-[#f4f6f3] mt-0.5 block break-all">
              {currentUser?.email || '—'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider block">
              Governance Role
            </span>
            <div className="mt-1">
              <RoleBadge role={currentUser?.role || 'Core Member'} size="sm" />
            </div>
          </div>
        </div>

        {ENABLE_EMAIL_CHANGE && isFikrAddress && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold block">Recovery Notice:</span>
              Your account currently uses a synthetic <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded font-mono">@fikr.org</code> username that cannot receive external emails. We strongly recommend linking a real personal email below so you can recover your password if forgotten.
            </div>
          </div>
        )}
      </section>

      {/* Security Credentials Section */}
      <div className={ENABLE_EMAIL_CHANGE ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "max-w-xl"}>
        {/* Card 1: Change Password */}
        <section className="bg-white dark:bg-[#121513] rounded-2xl border border-[#e0e4dd] dark:border-[#1f261f] p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
              <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#0e0f0c] dark:text-[#f4f6f3]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                  Change Password
                </h2>
                <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
                  Set a unique personal password (minimum 10 characters)
                </p>
              </div>
            </div>

            {passwordError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form id="password-form" onSubmit={handlePasswordChange} className="space-y-3.5">
              <div className="space-y-1">
                <label
                  htmlFor="account-current-password"
                  className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]"
                >
                  Current Password
                </label>
                <input
                  id="account-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl fikr-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="account-new-password"
                  className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]"
                >
                  New Password (min 10 characters)
                </label>
                <input
                  id="account-new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 10 characters"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl fikr-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="account-confirm-password"
                  className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]"
                >
                  Confirm New Password
                </label>
                <input
                  id="account-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl fikr-input"
                  required
                />
              </div>
            </form>
          </div>

          <Button
            type="submit"
            form="password-form"
            variant="primary"
            size="md"
            className="w-full min-h-[44px] font-medium"
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </section>

        {/* Card 2: Link Real Email Inbox (Hidden when ENABLE_EMAIL_CHANGE is false) */}
        {ENABLE_EMAIL_CHANGE && (
          <section className="bg-white dark:bg-[#121513] rounded-2xl border border-[#e0e4dd] dark:border-[#1f261f] p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
                <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#0e0f0c] dark:text-[#f4f6f3]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                    Update Recovery Email
                  </h2>
                  <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
                    Link a real inbox for password reset & account recovery
                  </p>
                </div>
              </div>

              {emailError && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              {emailSuccess && (
                <div role="status" className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{emailSuccess}</span>
                </div>
              )}

              <div className="text-xs text-[#737672] dark:text-[#a3aba1] space-y-2">
                <p>
                  To protect against account takeovers, your login email will <strong>not</strong> change immediately.
                </p>
                <p>
                  Firebase will send an official verification email to your new address. Once you click the link inside that email, your login address will update, and you can sign in with the new email.
                </p>
              </div>

              <form id="email-form" onSubmit={handleEmailUpdate} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label
                    htmlFor="account-new-email"
                    className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]"
                  >
                    New Email Address
                  </label>
                  <input
                    id="account-new-email"
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl fikr-input"
                    required
                  />
                </div>
              </form>
            </div>

            <Button
              type="submit"
              form="email-form"
              variant="outline"
              size="md"
              className="w-full min-h-[44px] font-medium"
              disabled={emailLoading}
            >
              {emailLoading ? 'Sending Verification...' : 'Send Verification Link'}
            </Button>
          </section>
        )}
      </div>

      {/* Security Guidance Note */}
      <div className="p-4 rounded-2xl bg-[#e8ebe6]/60 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] text-xs text-[#454745] dark:text-[#a3aba1] flex items-start gap-3">
        <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3] block">
            End-to-End Account Privacy
          </span>
          <p>
            Passwords and credentials are encrypted securely in Firebase Authentication and are never visible to the Treasurer, Administrator, or other members. Never share your password with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};
