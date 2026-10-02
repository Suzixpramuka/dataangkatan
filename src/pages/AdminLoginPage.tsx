import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, AlertCircle, ArrowLeft, Lock, User, KeyRound } from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
  onSuccess: () => void;
}

export const AdminLoginPage: React.FC<Props> = ({ onNav, onSuccess }) => {
  const { adminLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Username/Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const user = await adminLogin(identifier.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login admin gagal. Pastikan akun memiliki izin pengurus.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle accent header line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal Administrator</h2>
          <p className="text-xs text-slate-500">
            Khusus Pengurus & Administrator Verifikasi IF26
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username atau Email Admin:
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin atau email pengurus"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Admin:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Memverifikasi...' : 'Masuk sebagai Pengurus'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Bukan administrator?{' '}
            <button
              onClick={() => onNav('login')}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Ke Portal Mahasiswa
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
    </div>
  );
};
