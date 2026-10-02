import React, { useState } from 'react';
import { MaskedCheckResult } from '../types/index.ts';
import { apiRequest } from '../api/client.ts';
import {
  Search,
  X,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProceedToRegister: (claimedNim: string) => void;
  onProceedToLogin: () => void;
}

export const CekDataModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProceedToRegister,
  onProceedToLogin,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MaskedCheckResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Claim dialog states
  const [selectedStudent, setSelectedStudent] = useState<MaskedCheckResult | null>(null);
  const [claimNimInput, setClaimNimInput] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim().length < 3) {
      setErrorMsg('Masukkan minimal 3 karakter (misal nama depan atau 4 digit NIM)');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest<{ results: MaskedCheckResult[]; totalMatched: number }>(
        `/public/check-my-data?q=${encodeURIComponent(query.trim())}`
      );
      setResults(res.results);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencari data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (claimNimInput.trim().length !== 10) {
      setClaimError('NIM harus tepat 10 digit angka');
      return;
    }

    setClaimLoading(true);
    setClaimError('');
    try {
      const res = await apiRequest<{ verified: boolean; nim: string; message: string }>(
        '/public/claim-verify-nim',
        {
          method: 'POST',
          body: JSON.stringify({
            id: selectedStudent.id,
            fullNim: claimNimInput.trim(),
          }),
        }
      );

      if (res.verified) {
        onProceedToRegister(res.nim);
        onClose();
      }
    } catch (err: any) {
      setClaimError(err.message || 'NIM tidak cocok dengan baris data ini.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-200">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Cek Data Saya Sebelum Daftar</h3>
              <p className="text-blue-200 text-xs">Pencarian tersamar (Anti-Scraping Protected)</p>
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
        <div className="p-6">
          {!selectedStudent ? (
            <>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Temukan apakah nama atau NIM kamu sudah ada di daftar mahasiswa resmi yang dimasukkan panitia angkatan.
                Data pribadi ditampilkan secara <strong>tersamar (masked)</strong> untuk melindungi privasi seluruh mahasiswa.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ketik minimal 3 huruf nama atau NIM (contoh: 3337 / Ahmad)"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
                >
                  {loading ? 'Mencari...' : 'Cari Data'}
                </button>
              </form>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Results */}
              {searched && (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm">Tidak ditemukan data resmi dengan kata kunci tersebut.</p>
                      <p className="text-xs mt-1">
                        Kamu tetap bisa mendaftar akun dan data kamu akan dikonfirmasi manual oleh admin.
                      </p>
                    </div>
                  ) : (
                    results.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 font-mono tracking-wide">
                              {item.namaMasked}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                              NIM: {item.nimMasked}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                              Kelas {item.kelas}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.isRegistered
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.statusPendaftaran}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span>WA: {item.waNumberMasked || '-'}</span>
                            {item.waDisplayName && <span>Nama di Grup: {item.waDisplayName}</span>}
                            {item.instagramMasked && <span>IG: @{item.instagramMasked}</span>}
                          </div>
                        </div>

                        <div>
                          {item.isRegistered ? (
                            <button
                              onClick={() => {
                                onClose();
                                onProceedToLogin();
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                            >
                              Sudah Punya Akun &rarr; Login
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStudent(item);
                                setClaimNimInput('');
                                setClaimError('');
                              }}
                              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
                            >
                              <span>Ini Saya &rarr; Daftar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            /* Claim verification step: type exact 10 digit NIM to prove it is you */
            <form onSubmit={handleClaimVerify} className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Verifikasi Kepemilikan NIM</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Untuk melindungi data pribadi mahasiswa lain, kamu harus memasukkan 10 digit NIM lengkapmu sendiri
                  untuk membuktikan bahwa baris data <strong>{selectedStudent.namaMasked}</strong> (Kelas {selectedStudent.kelas}) memang adalah kamu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masukkan NIM Lengkap 10 Digit:
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={claimNimInput}
                  onChange={(e) => setClaimNimInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 333726xxxx (10 digit)"
                  className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format NIM Informatika 2026 diawali dengan 333726...
                </p>
              </div>

              {claimError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{claimError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={claimLoading || claimNimInput.length !== 10}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {claimLoading ? 'Memverifikasi...' : 'Verifikasi & Lanjut Daftar'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
