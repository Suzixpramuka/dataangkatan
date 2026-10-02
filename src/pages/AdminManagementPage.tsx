import React, { useState, useEffect } from 'react';
import { apiRequest, useRealtimeEvents } from '../api/client.ts';
import {
  Shield,
  UserCheck,
  UserMinus,
  Search,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Crown,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const AdminManagementPage: React.FC<Props> = ({ onNav }) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Candidate Search State
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ admins: any[] }>('/manage-admins');
      setAdmins(res.admins);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal memuat daftar admin.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useRealtimeEvents((event) => {
    if (event.type === 'USERS_UPDATED' || event.type === 'DISK_RELOAD') {
      fetchAdmins();
    }
  });

  const handleSearchCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateQuery.trim().length < 2) return;

    setSearchingCandidates(true);
    try {
      const res = await apiRequest<{ candidates: any[] }>(
        `/manage-admins/search-candidates?q=${encodeURIComponent(candidateQuery.trim())}`
      );
      setCandidates(res.candidates);
    } catch (err: any) {
      alert(err.message || 'Gagal mencari calon admin.');
    } finally {
      setSearchingCandidates(false);
    }
  };

  const handlePromote = async (userId: string, name: string) => {
    if (!confirm(`Jadikan mahasiswa ${name} sebagai ADMIN IF26?`)) return;

    try {
      const res = await apiRequest('/manage-admins/promote', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setNotice({ type: 'success', text: res.message });
      setCandidates(candidates.filter((c) => c.id !== userId));
      fetchAdmins();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal mengangkat admin.' });
    }
  };

  const handleDemote = async (userId: string, name: string) => {
    if (!confirm(`Cabut hak akses admin untuk ${name} dan kembalikan menjadi MEMBER?`)) return;

    try {
      const res = await apiRequest('/manage-admins/demote', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setNotice({ type: 'success', text: res.message });
      fetchAdmins();
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal mencabut hak admin.' });
    }
  };

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Kelola Hak Akses Administrator (Super Admin)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hak istimewa Super Admin untuk mengangkat mahasiswa terdaftar menjadi Admin atau mencabut hak admin.
          </p>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
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

      {/* Grid: Current Admins vs Promote New Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Current Admins List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span>Daftar Pengurus & Administrator Saat Ini</span>
            </h3>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
              {admins.length} Admin
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {admins.map((adm) => (
              <div
                key={adm.id}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{adm.nama}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        adm.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {adm.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    NIM: {adm.nim} &bull; {adm.email}
                  </p>
                </div>

                <div>
                  {adm.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDemote(adm.id, adm.nama)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Cabut Admin</span>
                    </button>
                  )}
                  {adm.role === 'SUPER_ADMIN' && (
                    <span className="text-[11px] font-bold text-slate-400">Admin Utama</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Search Registered Member & Promote */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Jadikan Mahasiswa Terdaftar sebagai Admin</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cari akun mahasiswa (Member) yang sudah mendaftar untuk diberi wewenang verifikasi data.
            </p>
          </div>

          <form onSubmit={handleSearchCandidates} className="flex gap-2">
            <input
              type="text"
              value={candidateQuery}
              onChange={(e) => setCandidateQuery(e.target.value)}
              placeholder="Ketik nama, NIM, atau email mahasiswa..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searchingCandidates}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              {searchingCandidates ? 'Mencari...' : 'Cari'}
            </button>
          </form>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {candidates.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Gunakan kotak pencarian di atas untuk mencari mahasiswa yang ingin diangkat sebagai admin.
              </p>
            ) : (
              candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{cand.nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NIM: {cand.nim} &bull; {cand.email}
                    </p>
                    {cand.kelas && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                        Kelas {cand.kelas}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePromote(cand.id, cand.nama)}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Jadikan Admin</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
