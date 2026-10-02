import React from 'react';
import {
  ShieldCheck,
  Search,
  UserPlus,
  LogIn,
  CheckCircle2,
  Lock,
  FileText,
  Users,
  Shield,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';
import { PublicRegisteredTable } from '../components/PublicRegisteredTable.tsx';

interface Props {
  onNav: (tab: string) => void;
  onOpenCheckData: () => void;
  onOpenLoginModal: () => void;
}

export const LandingPage: React.FC<Props> = ({ onNav, onOpenCheckData, onOpenLoginModal }) => {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-14 shadow-2xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Sistem Resmi Verifikasi Mahasiswa IF UNTIRTA 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Memastikan Anggota Grup Adalah{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200">
              Mahasiswa Asli Informatika 2026
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
            Platform verifikasi transparan dan aman untuk mendata seluruh mahasiswa baru Informatika Universitas Sultan Ageng Tirtayasa Angkatan 2026. Data diverifikasi silang dengan daftar resmi tanpa scraping ilegal.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNav('register')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2 group cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Mahasiswa Baru</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={onOpenLoginModal}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-blue-300" />
              <span>Masuk / Login</span>
            </button>

            <button
              onClick={onOpenCheckData}
              className="px-5 py-3.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-semibold text-sm border border-indigo-400/30 backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-indigo-300" />
              <span>Cek Data Saya (Masked)</span>
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Privasi Terjamin (Sensor Server)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Exact Match NIM (333726xxxx)
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Realtime Sync (SSE)
            </span>
          </div>
        </div>
      </section>

      {/* Main Public Live Registered Students Table */}
      <section className="space-y-4">
        <PublicRegisteredTable />
      </section>

      {/* 4-Step Verification Workflow */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Alur Verifikasi 4 Langkah</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Proses mudah, cepat, dan transparan tanpa perlu mengunggah berkas rahasia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm mb-4">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Daftar Akun</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buat akun dengan email aktif, password, nama lengkap, dan 10 digit NIM Informatika 2026.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm mb-4">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Lengkapi Profil</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih kelas (A26/B26/C26/D26), nomor WhatsApp di grup, dan nama akun yang tampil di grup angkatan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm mb-4">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Verifikasi Otomatis & Tim</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem mencocokkan data secara otomatis dengan data resmi dan daftar grup, lalu dikonfirmasi oleh pengurus.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm mb-4">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Status Terverifikasi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dapatkan badge resmi "Terverifikasi Resmi" di dashboard Anda dan nikmati keanggotaan aman di grup IF26.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy & Anti-Scraping Guarantee Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl text-blue-700 shadow-xs border border-slate-200/60">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Jaminan Privasi & Kepatuhan Etika Data Mahasiswa
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Sistem ini murni menggunakan data yang diberikan secara sadar oleh pengguna dan data resmi dari pengurus angkatan. Dilarang keras melakukan web scraping, peretasan SIAKAD, pengambilan kontak pribadi, atau pencarian latar belakang tanpa izin.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNav('privacy')}
          className="whitespace-nowrap px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
        >
          Baca Kebijakan Privasi Lengkap &rarr;
        </button>
      </section>

      {/* Login Gateway */}
      <section className="text-center py-6 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Sudah memiliki akun mahasiswa atau akun administrator?{' '}
          <button
            onClick={onOpenLoginModal}
            className="text-blue-700 hover:text-blue-800 font-bold hover:underline cursor-pointer"
          >
            Buka Menu Masuk / Login &rarr;
          </button>
        </p>
      </section>
    </div>
  );
};
