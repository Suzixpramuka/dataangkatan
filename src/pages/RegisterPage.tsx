import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  UserPlus,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Lock,
  User,
  Hash,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
  onSuccess: () => void;
  prefilledNim?: string;
}

export const RegisterPage: React.FC<Props> = ({ onNav, onSuccess, prefilledNim = '' }) => {
  const { register } = useAuth();

  const [nama, setNama] = useState('');
  const [nim, setNim] = useState(prefilledNim);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Duplicate conflict confirmation modal state
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    show: boolean;
    message: string;
    conflictNim: string;
  } | null>(null);

  // Live NIM format check
  const cleanNim = nim.trim();
  const is10Digits = /^\d{10}$/.test(cleanNim);
  const isCorrectPrefix = /^333726/.test(cleanNim);
  const showNimFormatWarning = cleanNim.length >= 6 && (!isCorrectPrefix || (cleanNim.length === 10 && !isCorrectPrefix));

  const handleRegister = async (forceConfirmDuplicate = false) => {
    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!cleanNim || cleanNim.length !== 10) {
      setErrorMsg('NIM harus tepat 10 digit angka.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!consent) {
      setErrorMsg('Anda wajib menyetujui kebijakan privasi penggunaan data.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await register({
        nama: nama.trim(),
        nim: cleanNim,
        password,
        consent,
        forceConfirmDuplicate,
      });

      onSuccess();
    } catch (err: any) {
      if (err.data && err.data.requiresDuplicateConfirm) {
        setDuplicatePrompt({
          show: true,
          message: err.data.message,
          conflictNim: err.data.conflictNim,
        });
      } else {
        setErrorMsg(err.message || 'Pendaftaran gagal. Silakan periksa kembali formulir.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Mahasiswa Baru</h2>
          <p className="text-xs text-slate-500">
            Informatika Universitas Sultan Ageng Tirtayasa Angkatan 2026
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister(false);
          }}
          className="space-y-4"
        >
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap (sesuai registrasi kampus):
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Nama Lengkap Anda"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          {/* NIM */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Nomor Induk Mahasiswa (NIM):
              </label>
              <span className="text-[11px] text-slate-400 font-mono">10 Digit Angka</span>
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                maxLength={10}
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 333726xxxx"
                className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            {/* NIM Notice / Warning */}
            {showNimFormatWarning && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Perhatian Format NIM Angkatan 2026</p>
                  <p className="text-[11px] text-amber-800">
                    NIM Informatika 2026 standar diawali <strong>333726</strong>. Jika NIM Anda di luar pola ini, Anda tetap bisa mendaftar namun akun akan ditandai untuk konfirmasi manual oleh admin.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Konfirmasi Sandi:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                required
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Saya memahami dan menyetujui penggunaan data saya untuk keperluan verifikasi anggota Informatika Angkatan 2026. Data tidak akan disebarluaskan untuk kepentingan komersial.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Sudah memiliki akun?{' '}
            <button
              onClick={() => onNav('login')}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Login di sini
            </button>
          </p>
          <div>
            <button
              onClick={() => onNav('landing')}
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate NIM Confirmation Dialog */}
      {duplicatePrompt && duplicatePrompt.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-purple-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Peringatan: NIM Sudah Terdaftar</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {duplicatePrompt.message}
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900">
              <p className="font-bold">Catatan Keamanan:</p>
              <p className="text-[11px] mt-0.5">
                Jika Anda tetap melanjutkan, akun Anda dan akun sebelumnya yang menggunakan NIM {duplicatePrompt.conflictNim} akan otomatis ditandai status <strong>TINJAU DUPLIKAT (DUPLICATE_REVIEW)</strong> untuk diverifikasi langsung oleh admin.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicatePrompt(null)}
                className="flex-1 py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Batal / Periksa Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicatePrompt(null);
                  handleRegister(true);
                }}
                className="flex-1 py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                Tetap Lanjut (Kirim Review)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
