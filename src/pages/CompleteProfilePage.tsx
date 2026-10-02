import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../api/client.ts';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Instagram,
  GraduationCap,
  Users,
  ShieldCheck,
  Save,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const CompleteProfilePage: React.FC<Props> = ({ onNav }) => {
  const { user, refreshUser } = useAuth();

  const [nama, setNama] = useState(user?.nama || '');
  const [nim, setNim] = useState(user?.nim || '');
  const [kelas, setKelas] = useState(user?.kelas || 'A26');
  const [programStudi, setProgramStudi] = useState(user?.program_studi || 'Informatika');
  const [angkatan, setAngkatan] = useState(user?.angkatan || '2026');
  const [waNumber, setWaNumber] = useState(user?.wa_number || '');
  const [waDisplayName, setWaDisplayName] = useState(user?.wa_display_name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [consent, setConsent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setNim(user.nim || '');
      setKelas(user.kelas || 'A26');
      setProgramStudi(user.program_studi || 'Informatika');
      setAngkatan(user.angkatan || '2026');
      setWaNumber(user.wa_number || '');
      setWaDisplayName(user.wa_display_name || '');
      setNickname(user.nickname || '');
      setInstagram(user.instagram || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nim.trim() || !kelas || !waNumber.trim() || !waDisplayName.trim()) {
      setNotice({ type: 'error', text: 'Semua kolom bertanda bintang (*) wajib diisi.' });
      return;
    }
    if (!consent) {
      setNotice({ type: 'error', text: 'Persetujuan kebijakan privasi wajib dicentang.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      await apiRequest('/members/profile', {
        method: 'POST',
        body: JSON.stringify({
          nama: nama.trim(),
          nim: nim.trim(),
          kelas,
          program_studi: programStudi,
          angkatan,
          wa_number: waNumber.trim(),
          wa_display_name: waDisplayName.trim(),
          nickname: nickname.trim(),
          instagram: instagram.trim().replace(/^@/, ''),
          consent: true,
        }),
      });

      await refreshUser();
      setNotice({
        type: 'success',
        text: 'Profil berhasil disimpan dan diverifikasi ulang!',
      });

      setTimeout(() => {
        onNav('member-dashboard');
      }, 1200);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pendataan Profil Mahasiswa IF26</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lengkapi / Perbarui Profil</h2>
          <p className="text-xs text-slate-500 mt-1">
            Data ini digunakan untuk mencocokkan identitas Anda dengan data resmi angkatan dan nomor di grup WhatsApp.
          </p>
        </div>

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
          {/* Identitas Mahasiswa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIM (10 Digit) *
              </label>
              <input
                type="text"
                maxLength={10}
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/\D/g, ''))}
                placeholder="333726xxxx"
                className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Kelas & Prodi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kelas *
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                required
              >
                <option value="A26">A26 (Kelas A)</option>
                <option value="B26">B26 (Kelas B)</option>
                <option value="C26">C26 (Kelas C)</option>
                <option value="D26">D26 (Kelas D)</option>
                <option value="E26">E26 (Kelas E)</option>
                <option value="F26">F26 (Kelas F)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Program Studi
              </label>
              <input
                type="text"
                value={programStudi}
                readOnly
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Angkatan
              </label>
              <input
                type="text"
                value={angkatan}
                readOnly
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              Kontak & Grup WhatsApp Angkatan
            </h4>
          </div>

          {/* WhatsApp info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp yang Bergabung di Grup *
              </label>
              <input
                type="tel"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400">Nomor aktif yang digunakan di grup WA angkatan</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama yang Terlihat di Grup WhatsApp *
              </label>
              <input
                type="text"
                value={waDisplayName}
                onChange={(e) => setWaDisplayName(e.target.value)}
                placeholder="Contoh: Nama Panggilan (Kelas)"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400">Nama profil/display name akun WhatsApp Anda</span>
            </div>
          </div>

          {/* Optional info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Panggilan (Opsional):
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Nama Panggilan"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Instagram (Opsional):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="username_ig"
                  className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400">Hanya info pendukung, BUKAN bukti utama verifikasi</span>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Etika Privasi IF26</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Kami TIDAK PERNAH meminta kata sandi Instagram, OTP, nomor rekening, data SIAKAD, tanggal lahir, atau data kontak kerabat. Seluruh data murni untuk verifikasi keanggotaan grup mahasiswa IF 2026.
            </p>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              required
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Saya memahami dan menyetujui penggunaan data saya untuk keperluan verifikasi anggota Informatika Angkatan 2026.
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNav('member-dashboard')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan & Memverifikasi...' : 'Simpan Profil & Jalankan Verifikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
