import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const PrivacyPage: React.FC<Props> = ({ onNav }) => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Pemberitahuan Resmi Privasi & Ketentuan Penggunaan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kebijakan Privasi IF26 Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Sistem Pendataan & Verifikasi Anggota Informatika Universitas Sultan Ageng Tirtayasa (UNTIRTA) Angkatan 2026.
        </p>
      </div>

      {/* Main Privacy Statement */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            1. Tujuan Pengumpulan Data
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Data yang dikumpulkan digunakan semata-mata untuk keperluan pendataan dan verifikasi apakah anggota grup WhatsApp Informatika Angkatan 2026 benar-benar merupakan mahasiswa resmi Informatika UNTIRTA angkatan 2026. Data hanya digunakan untuk keperluan administrasi internal angkatan dan <strong>tidak boleh disebarluaskan tanpa alasan yang sah</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            2. Data yang Diminta
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Pengguna hanya diminta memberikan data mendasar yang diperlukan untuk proses verifikasi, meliputi:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1 pl-2">
            <li>Nama lengkap (sesuai registrasi kampus)</li>
            <li>Nomor Induk Mahasiswa (NIM) 10 digit (format 333726xxxx)</li>
            <li>Kelas pembagian (A26/B26/C26/D26 dst)</li>
            <li>Nomor WhatsApp aktif yang dipakai di grup</li>
            <li>Nama display akun WhatsApp</li>
            <li>Nama panggilan dan username Instagram (opsional, hanya info pendukung)</li>
          </ul>
        </section>

        <section className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
          <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            3. Komitmen Perlindungan & Larangan Keras
          </h2>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
            Sistem ini secara tegas dan mutlak <strong>DILARANG</strong> melakukan:
          </p>
          <ul className="list-disc list-inside text-xs text-rose-800 space-y-1 pl-2">
            <li>Mencari identitas pribadi berdasarkan nomor telepon secara diam-diam</li>
            <li>Meminta atau melacak tanggal lahir, nomor KTP, atau data keluarga</li>
            <li>Membaca buku kontak telepon pengguna</li>
            <li>Melakukan web scraping data media sosial atau followers Instagram</li>
            <li>Meminta kata sandi Instagram, OTP, atau login ke akun pihak ketiga</li>
            <li>Mengakses database SIAKAD kampus tanpa hak</li>
            <li>Deanonymization atau pengambilan data tanpa izin pemiliknya</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-indigo-600" />
            4. Pengamanan Fitur "Cek Data Saya" (Masked)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Untuk memfasilitasi mahasiswa yang ingin memeriksa apakah namanya sudah ada di daftar panitia sebelum mendaftar, sistem menyediakan fitur "Cek Data Saya" yang disamarkan (masked) di server (misal: "A***d M***k", "333****"). NIM lengkap tidak pernah dikirimkan ke peramban secara bebas dan hanya dapat dibuka apabila pengguna mengetikkan ulang 10 digit NIM miliknya sendiri.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            5. Hak Pengguna
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Setiap mahasiswa berhak melihat status verifikasi akunnya, membaca pesan konfirmasi dari admin, dan memperbarui rincian profil yang telah dikirimkan.
          </p>
        </section>
      </div>
    </div>
  );
};
