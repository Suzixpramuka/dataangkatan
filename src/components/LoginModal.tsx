import React from 'react';
import {
  LogIn,
  GraduationCap,
  Shield,
  X,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectMahasiswa: () => void;
  onSelectAdmin: () => void;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectMahasiswa,
  onSelectAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-blue-200">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pilih Akses Masuk</h3>
              <p className="text-blue-200 text-xs">IF26 Member Verification System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 text-center">
            Silakan pilih portal masuk sesuai peran Anda:
          </p>

          <div className="space-y-3">
            {/* Opsi 1: Mahasiswa */}
            <button
              onClick={() => {
                onClose();
                onSelectMahasiswa();
              }}
              className="w-full text-left p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50 transition group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                    Login Mahasiswa
                  </h4>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5">
                    Mahasiswa Baru Informatika Angkatan 2026
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </button>

            {/* Opsi 2: Administrator */}
            <button
              onClick={() => {
                onClose();
                onSelectAdmin();
              }}
              className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-800 bg-slate-50 hover:bg-slate-100 transition group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-slate-800 transition">
                    Login Admin / Pengurus
                  </h4>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5">
                    Khusus Panitia & Tim Verifikasi Angkatan
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
