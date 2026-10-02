import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../api/client.ts';
import { KeyRound, Lock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const ChangePasswordPage: React.FC<Props> = ({ onNav }) => {
  const { user, refreshUser, updateUserLocal } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mustChange = user?.mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mustChange && !oldPassword) {
      setNotice({ type: 'error', text: 'Kata sandi lama wajib diisi.' });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'error', text: 'Kata sandi baru minimal 8 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: mustChange ? undefined : oldPassword,
          newPassword,
        }),
      });

      updateUserLocal({ mustChangePassword: false });
      await refreshUser();

      setNotice({
        type: 'success',
        text: 'Kata sandi berhasil diperbarui!',
      });

      setTimeout(() => {
        if (user?.role === 'MEMBER') {
          onNav('member-dashboard');
        } else {
          onNav('admin-dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ganti Kata Sandi</h2>
          <p className="text-xs text-slate-500">
            Perbarui kata sandi akun Anda untuk meningkatkan keamanan
          </p>
        </div>

        {mustChange && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Wajib Ganti Kata Sandi Default</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Akun Anda masih menggunakan kata sandi bawaan awal sistem. Demi keamanan data mahasiswa, silakan buat kata sandi baru yang kuat sekarang.
            </p>
          </div>
        )}

        {notice && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!mustChange && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi Lama:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required={!mustChange}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Sandi Baru:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
          </button>
        </form>
      </div>
    </div>
  );
};
