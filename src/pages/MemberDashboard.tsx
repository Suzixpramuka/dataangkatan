import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest, useRealtimeEvents } from '../api/client.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  Phone,
  Instagram,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Radio,
  FileText,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const MemberDashboard: React.FC<Props> = ({ onNav }) => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest('/members/profile');
      setProfileData(res.user);
    } catch {
      // fallback to user in auth context
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Listen for realtime updates from backend
  useRealtimeEvents((event) => {
    if (event.type === 'USERS_UPDATED' || event.type === 'DISK_RELOAD') {
      fetchProfile();
      refreshUser();
    }
  });

  const member = profileData || user;
  const status = member?.status || 'PENDING';

  const statusExplanations: Record<string, { title: string; desc: string; bg: string; border: string }> = {
    VERIFIED: {
      title: 'Selamat! Akun Anda Terverifikasi Resmi 🎉',
      desc: 'Data Anda telah cocok dengan daftar resmi mahasiswa Informatika UNTIRTA 2026. Anda merupakan anggota resmi dan sah di grup angkatan.',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200 text-emerald-900',
    },
    NEEDS_CONFIRMATION: {
      title: 'Data Masih Memerlukan Konfirmasi Admin 🟡',
      desc:
        member?.member_message ||
        'Data kamu masih memerlukan konfirmasi admin. Silakan tunggu atau hubungi admin apabila diperlukan.',
      bg: 'bg-amber-50',
      border: 'border-amber-200 text-amber-900',
    },
    NOT_VERIFIED: {
      title: 'Data Belum / Tidak Terverifikasi 🔴',
      desc:
        member?.member_message ||
        'Data Anda belum dapat diverifikasi sebagai mahasiswa Informatika 2026. Silakan periksa kembali profil Anda atau hubungi pengurus angkatan.',
      bg: 'bg-rose-50',
      border: 'border-rose-200 text-rose-900',
    },
    PENDING: {
      title: 'Data Sedang Diperiksa Tim Admin ⚪',
      desc:
        member?.member_message ||
        'Data kamu sudah diterima dan sedang diperiksa admin. Tim kami akan melakukan pencocokan data secepatnya.',
      bg: 'bg-slate-50',
      border: 'border-slate-200 text-slate-900',
    },
    DUPLICATE_REVIEW: {
      title: 'Pemeriksaan Duplikat Sedang Berlangsung 🟣',
      desc:
        member?.member_message ||
        'NIM atau nomor WhatsApp Anda terdeteksi memiliki kesamaan dengan akun lain. Pengurus sedang melakukan peninjauan langsung.',
      bg: 'bg-purple-50',
      border: 'border-purple-200 text-purple-900',
    },
  };

  const explanation = statusExplanations[status] || statusExplanations.PENDING;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 space-y-6">
      {/* Realtime Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Koneksi Realtime Terhubung</span>
        </div>
        <button
          onClick={() => onNav('complete-profile')}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Ubah Profil</span>
        </button>
      </div>

      {/* Greeting Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halo, {member?.nama}! 👋
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm font-normal">
              Selamat datang di Sistem Verifikasi Mahasiswa Informatika UNTIRTA 2026.
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={status} size="lg" />
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={`p-5 rounded-2xl border ${explanation.bg} ${explanation.border} space-y-2 shadow-xs`}>
        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
          {explanation.title}
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed opacity-90">
          {explanation.desc}
        </p>

        {member?.member_message && member.member_message !== explanation.desc && (
          <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/60 text-xs text-slate-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-700">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Pesan Khusus dari Tim Admin:</span>
            </div>
            <p className="italic">{member.member_message}</p>
          </div>
        )}
      </div>

      {/* Profile Details Summary */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Rincian Data Terdaftar</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Submit ke-{member?.submit_count || 1}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
            <span className="font-bold text-slate-800 text-sm">{member?.nama || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">NIM</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{member?.nim || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Kelas</span>
            <span className="font-bold text-slate-800 text-sm">{member?.kelas ? `Kelas ${member.kelas}` : 'Belum Dipilih'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Program Studi / Angkatan</span>
            <span className="font-semibold text-slate-800">
              {member?.program_studi || 'Informatika'} ({member?.angkatan || '2026'})
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Nomor WhatsApp</span>
            <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {member?.wa_number || 'Belum diisi'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Nama di Grup WhatsApp</span>
            <span className="font-semibold text-slate-800">{member?.wa_display_name || 'Belum diisi'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Nama Panggilan</span>
            <span className="font-semibold text-slate-800">{member?.nickname || '-'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Instagram</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Instagram className="w-3.5 h-3.5 text-slate-400" />
              {member?.instagram ? `@${member.instagram}` : '-'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Status Akun</span>
            <span className="font-semibold text-slate-800">Aktif</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onNav('complete-profile')}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Perbarui Data Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
