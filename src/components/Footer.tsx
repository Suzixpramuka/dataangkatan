import React from 'react';
import { ShieldCheck, Lock, ShieldAlert } from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const Footer: React.FC<Props> = ({ onNav }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>IF26 Member Verification System</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Sistem resmi pendataan dan verifikasi anggota grup WhatsApp Informatika Universitas Sultan Ageng Tirtayasa (UNTIRTA) Angkatan 2026.
              Menjamin kepastian mahasiswa resmi tanpa pencarian data pribadi ilegal.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <Lock className="w-3.5 h-3.5" />
              <span>Privasi Terlindungi: Tanpa Scraping &bull; Tanpa Akses SIAKAD &bull; Persetujuan Pengguna</span>
            </div>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-3 text-xs uppercase tracking-wider">Akses Menu</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNav('landing')} className="hover:text-white transition">
                  Beranda
                </button>
              </li>
              <li>
                <button onClick={() => onNav('login')} className="hover:text-white transition">
                  Login Mahasiswa
                </button>
              </li>
              <li>
                <button onClick={() => onNav('register')} className="hover:text-white transition">
                  Daftar Mahasiswa
                </button>
              </li>
              <li>
                <button onClick={() => onNav('admin-login')} className="hover:text-white transition text-slate-400">
                  Portal Login Admin
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-3 text-xs uppercase tracking-wider">Keamanan & Kebijakan</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNav('privacy')} className="hover:text-white transition text-blue-400">
                  Kebijakan Privasi & Ketentuan
                </button>
              </li>
              <li className="text-[11px] text-slate-500 leading-normal">
                NIM Informatika 2026: Format 10 digit (333726xxxx). Pencocokan data berbasis NIM penuh.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Informatika UNTIRTA Angkatan 2026. Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              Verifikasi Internal Angkatan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
