import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Menu,
  X,
  UserCheck,
  Search,
  LogOut,
  KeyRound,
  FileSpreadsheet,
  Users,
  Shield,
  FileText,
  User,
  LogIn,
} from 'lucide-react';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCheckData: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  onOpenCheckData,
  onOpenLoginModal,
}) => {
  const { user, isAuthenticated, isMember, isAdmin, isSuperAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentTab('landing');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => handleNav(isAuthenticated ? (isMember ? 'member-dashboard' : 'admin-dashboard') : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-800 transition">
              <ShieldCheck className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">IF26 VERIFY</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  UNTIRTA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Sistem Verifikasi Anggota Informatika '26
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => handleNav('landing')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'landing' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Beranda
                </button>
                <button
                  onClick={onOpenCheckData}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4 text-blue-600" />
                  Cek Data Saya
                </button>
                <button
                  onClick={() => handleNav('privacy')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'privacy' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Kebijakan Privasi
                </button>
                <div className="h-5 w-px bg-slate-200 mx-2" />
                <button
                  onClick={onOpenLoginModal}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <span>Masuk / Login</span>
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Daftar Mahasiswa
                </button>
              </>
            )}

            {isAuthenticated && isMember && (
              <>
                <button
                  onClick={() => handleNav('member-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'member-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dashboard Saya
                </button>
                <button
                  onClick={() => handleNav('complete-profile')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'complete-profile' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Lengkapi / Ubah Profil
                </button>
                <button
                  onClick={() => handleNav('privacy')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'privacy' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Kebijakan Privasi
                </button>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <button
                  onClick={() => handleNav('admin-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'admin-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dashboard Admin
                </button>
                <button
                  onClick={() => handleNav('official-students')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'official-students' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Data Resmi
                </button>
                <button
                  onClick={() => handleNav('group-roster')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'group-roster' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Grup WA
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleNav('admin-management')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      currentTab === 'admin-management' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-purple-600" />
                    Kelola Admin
                  </button>
                )}
                <button
                  onClick={() => handleNav('audit-log')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentTab === 'audit-log' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Audit Log
                </button>
              </>
            )}
          </div>

          {/* User profile / Logout */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
                    <span>{user?.nama}</span>
                    {isSuperAdmin && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        SUPER ADMIN
                      </span>
                    )}
                    {isAdmin && !isSuperAdmin && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{user?.nim || user?.email}</div>
                </div>
                <button
                  onClick={() => handleNav('change-password')}
                  title="Ganti Password"
                  className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {!isAuthenticated && (
            <>
              <button
                onClick={() => handleNav('landing')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Beranda
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckData();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Cek Data Saya (Masked)
              </button>
              <button
                onClick={() => handleNav('privacy')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Kebijakan Privasi
              </button>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-center bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Login (Mahasiswa / Admin)</span>
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-center bg-blue-700 text-white shadow-xs"
                >
                  Daftar Mahasiswa Baru
                </button>
              </div>
            </>
          )}

          {isAuthenticated && (
            <>
              <div className="px-3 py-2 mb-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-slate-900">{user?.nama}</p>
                <p className="text-[11px] text-slate-500 font-mono">{user?.nim || user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>

              {isMember && (
                <>
                  <button
                    onClick={() => handleNav('member-dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Dashboard Saya
                  </button>
                  <button
                    onClick={() => handleNav('complete-profile')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Lengkapi / Ubah Profil
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => handleNav('admin-dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Dashboard Admin
                  </button>
                  <button
                    onClick={() => handleNav('official-students')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Data Resmi Mahasiswa
                  </button>
                  <button
                    onClick={() => handleNav('group-roster')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Data Grup WhatsApp
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleNav('admin-management')}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50"
                    >
                      Kelola Admin
                    </button>
                  )}
                  <button
                    onClick={() => handleNav('audit-log')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Audit Log
                  </button>
                </>
              )}

              <button
                onClick={() => handleNav('change-password')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                Ganti Kata Sandi
              </button>
              <button
                onClick={() => handleNav('privacy')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Kebijakan Privasi
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar dari Akun
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
