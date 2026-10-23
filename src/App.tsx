import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';

import { LandingPage } from './pages/LandingPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { NewCasePage } from './pages/NewCasePage';
import { PublicWithdrawalsPage } from './pages/PublicWithdrawalsPage';
import { NewWithdrawalPage } from './pages/NewWithdrawalPage';
import { LedgerPage } from './pages/LedgerPage';
import { ContributionsPage } from './pages/ContributionsPage';
import { MembersPage } from './pages/MembersPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import { RecoveryEmailBanner } from './components/common/RecoveryEmailBanner';

import { isFirebaseConfigured } from './lib/firebase';
import { AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-[#f0f3ee] dark:bg-[#0b0e0c] text-[#0e0f0c] dark:text-[#f4f6f3] selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
              {!isFirebaseConfigured && (
                <div role="alert" className="sticky top-0 z-50 bg-red-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                  <span>
                    CRITICAL ERROR: Cloud database (Firebase) is not configured. Live synchronization and persistence are disabled.
                  </span>
                </div>
              )}
              <Navbar />
              <RecoveryEmailBanner />
              <main className="flex-grow">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/withdrawals" element={<PublicWithdrawalsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Core Member Protected Routes */}
                  <Route
                    path="/cases"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <CasesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cases/new"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <NewCasePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cases/:id"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <CaseDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/withdrawals/new"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <NewWithdrawalPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ledger"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <LedgerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contributions"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <ContributionsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Members Directory & Governance Route */}
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute allowedTiers={['core_member']}>
                        <MembersPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Account Settings Route */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute allowedTiers={['core_member', 'supporter']}>
                        <AccountPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <BottomTabBar />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
