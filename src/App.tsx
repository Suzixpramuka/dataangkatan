/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CekDataModal } from './components/CekDataModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { CompleteProfilePage } from './pages/CompleteProfilePage.tsx';
import { MemberDashboard } from './pages/MemberDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { OfficialStudentsPage } from './pages/OfficialStudentsPage.tsx';
import { GroupRosterPage } from './pages/GroupRosterPage.tsx';
import { AdminManagementPage } from './pages/AdminManagementPage.tsx';
import { AuditLogPage } from './pages/AuditLogPage.tsx';
import { ChangePasswordPage } from './pages/ChangePasswordPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';

function MainApp() {
  const { user, loading, isAuthenticated, isMember, isAdmin, isSuperAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [checkDataOpen, setCheckDataOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [prefilledNim, setPrefilledNim] = useState<string>('');

  // Handle route redirection based on session
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        if (user?.mustChangePassword) {
          setCurrentTab('change-password');
        } else if (isMember) {
          // If member is in landing or login, redirect to dashboard
          if (['landing', 'login', 'admin-login', 'register'].includes(currentTab)) {
            if (!user?.kelas) {
              setCurrentTab('complete-profile');
            } else {
              setCurrentTab('member-dashboard');
            }
          }
        } else if (isAdmin) {
          // If admin is in landing or login, redirect to admin dashboard
          if (['landing', 'login', 'admin-login', 'register'].includes(currentTab)) {
            setCurrentTab('admin-dashboard');
          }
        }
      }
    }
  }, [isAuthenticated, isMember, isAdmin, loading, user?.mustChangePassword]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Memuat IF26 Verification System...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'landing':
        return (
          <LandingPage
            onNav={(tab) => setCurrentTab(tab)}
            onOpenCheckData={() => setCheckDataOpen(true)}
            onOpenLoginModal={() => setLoginModalOpen(true)}
          />
        );

      case 'login':
        return (
          <LoginPage
            onNav={(tab) => setCurrentTab(tab)}
            onSuccess={() => {
              if (user?.mustChangePassword) {
                setCurrentTab('change-password');
              } else {
                setCurrentTab('member-dashboard');
              }
            }}
          />
        );

      case 'admin-login':
        return (
          <AdminLoginPage
            onNav={(tab) => setCurrentTab(tab)}
            onSuccess={() => {
              if (user?.mustChangePassword) {
                setCurrentTab('change-password');
              } else {
                setCurrentTab('admin-dashboard');
              }
            }}
          />
        );

      case 'register':
        return (
          <RegisterPage
            onNav={(tab) => setCurrentTab(tab)}
            prefilledNim={prefilledNim}
            onSuccess={() => setCurrentTab('complete-profile')}
          />
        );

      case 'complete-profile':
        if (!isAuthenticated) return <LoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('complete-profile')} />;
        return <CompleteProfilePage onNav={(tab) => setCurrentTab(tab)} />;

      case 'member-dashboard':
        if (!isAuthenticated) return <LoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('member-dashboard')} />;
        return <MemberDashboard onNav={(tab) => setCurrentTab(tab)} />;

      case 'admin-dashboard':
        if (!isAdmin) return <AdminLoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('admin-dashboard')} />;
        return <AdminDashboard onNav={(tab) => setCurrentTab(tab)} />;

      case 'official-students':
        if (!isAdmin) return <AdminLoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('official-students')} />;
        return <OfficialStudentsPage onNav={(tab) => setCurrentTab(tab)} />;

      case 'group-roster':
        if (!isAdmin) return <AdminLoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('group-roster')} />;
        return <GroupRosterPage onNav={(tab) => setCurrentTab(tab)} />;

      case 'admin-management':
        if (!isSuperAdmin) return <AdminLoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('admin-management')} />;
        return <AdminManagementPage onNav={(tab) => setCurrentTab(tab)} />;

      case 'audit-log':
        if (!isAdmin) return <AdminLoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('audit-log')} />;
        return <AuditLogPage onNav={(tab) => setCurrentTab(tab)} />;

      case 'change-password':
        if (!isAuthenticated) return <LoginPage onNav={setCurrentTab} onSuccess={() => setCurrentTab('change-password')} />;
        return <ChangePasswordPage onNav={(tab) => setCurrentTab(tab)} />;

      case 'privacy':
        return <PrivacyPage onNav={(tab) => setCurrentTab(tab)} />;

      default:
        return (
          <LandingPage
            onNav={(tab) => setCurrentTab(tab)}
            onOpenCheckData={() => setCheckDataOpen(true)}
            onOpenLoginModal={() => setLoginModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCheckData={() => setCheckDataOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {renderContent()}
      </main>

      <Footer onNav={(tab) => setCurrentTab(tab)} />

      {/* Cek Data Saya (Masked) Modal */}
      <CekDataModal
        isOpen={checkDataOpen}
        onClose={() => setCheckDataOpen(false)}
        onProceedToRegister={(claimedNim) => {
          setPrefilledNim(claimedNim);
          setCurrentTab('register');
        }}
        onProceedToLogin={() => {
          setCheckDataOpen(false);
          setCurrentTab('login');
        }}
      />

      {/* Unified Login Portal Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSelectMahasiswa={() => setCurrentTab('login')}
        onSelectAdmin={() => setCurrentTab('admin-login')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
