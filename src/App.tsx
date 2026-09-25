import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0A0A0C] text-neutral-900 dark:text-neutral-100 selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
              <Navbar />
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

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
