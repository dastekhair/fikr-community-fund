import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LogIn,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  CheckCircle2,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';

export const LoginPage: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      if (mode === 'forgot') {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset instructions have been sent to your email.');
        return;
      }

      if (mode === 'register') {
        if (!password.trim()) {
          setError('Please enter a password.');
          return;
        }
        await registerWithEmail(name.trim() || 'Supporter', email.trim(), password);
        navigate(redirectTo);
        return;
      }

      // Login mode
      if (!password.trim()) {
        setError('Please enter your password.');
        return;
      }
      await loginWithEmail(email.trim(), password);
      navigate(redirectTo);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate(redirectTo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in was cancelled or encountered an issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {mode === 'forgot'
            ? 'Reset Your Password'
            : mode === 'register'
            ? 'Create Supporter Account'
            : 'Core Member & Supporter Login'}
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
          {mode === 'forgot'
            ? 'Enter your registered email address to receive a secure password reset link.'
            : 'Access official fund discussions, case voting, ledger records, and management tools.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Auth Card */}
      <div className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. yusuf@fikr.org or name@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full min-h-[44px]"
            loading={loading}
            icon={mode === 'forgot' ? <Mail className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          >
            {mode === 'forgot'
              ? 'Send Reset Link'
              : mode === 'register'
              ? 'Register Account'
              : 'Sign In to Fikr'}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Or Sign In With
              </span>
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full min-h-[44px]"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google Account
            </Button>
          </>
        )}

        <div className="text-center pt-2 space-y-1.5 text-xs">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setMode('login');
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Back to Sign In
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3 text-neutral-500">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode(mode === 'login' ? 'register' : 'login');
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                {mode === 'login' ? 'Register as Supporter / Donor' : 'Already registered? Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Privacy Notice */}
      <div className="p-4 rounded-xl bg-neutral-100/70 dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 text-[11px] text-neutral-500 space-y-1">
        <div className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Core Member Access Security</span>
        </div>
        <p className="leading-relaxed">
          Core Member role permissions are automatically mapped to verified emails registered in the Firestore members roster. If your email was recently added by the Coordinator or Treasurer, simply sign in with your email.
        </p>
      </div>
    </div>
  );
};
