import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { LogIn, AlertCircle, ArrowLeft, Lock, Hash, ShieldCheck } from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<Props> = ({ onNav, onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('NIM dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const user = await login(identifier.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'NIM atau kata sandi tidak cocok.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login Mahasiswa</h2>
          <p className="text-xs text-slate-500">
            Masuk dengan NIM dan Kata Sandi Mahasiswa Informatika 2026
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
              Nomor Induk Mahasiswa (NIM):
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                maxLength={10}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 333726xxxx (10 digit)"
                className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

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
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses...' : 'Masuk ke Akun Saya'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Belum memiliki akun?{' '}
            <button
              onClick={() => onNav('register')}
              className="text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Daftar Mahasiswa Baru
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
