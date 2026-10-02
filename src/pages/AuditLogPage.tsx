import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.ts';
import { AuditLog } from '../types/index.ts';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  User,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const AuditLogPage: React.FC<Props> = ({ onNav }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(30);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        action: actionFilter,
        search,
      });

      const res = await apiRequest<{
        items: AuditLog[];
        total: number;
        page: number;
        totalPages: number;
        isSuperAdmin: boolean;
      }>(`/audit-logs?${q.toString()}`);

      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setIsSuperAdmin(res.isSuperAdmin);
    } catch (err) {
      console.error('Fetch audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, search]);

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Audit Log Aktivitas Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isSuperAdmin
              ? 'Rekam jejak seluruh aktivitas verifikasi, pendaftaran, dan mutasi data oleh sistem dan pengurus.'
              : 'Rekam jejak riwayat aktivitas verifikasi yang dilakukan oleh akun Anda.'}
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition self-start sm:self-auto"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari deskripsi, aksi, atau pelaku..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="UPDATE_VERIFICATION_STATUS">Ubah Status Verifikasi</option>
              <option value="REGISTER_STUDENT">Pendaftaran Mahasiswa</option>
              <option value="UPDATE_PROFILE">Pembaruan Profil</option>
              <option value="IMPORT_OFFICIAL_STUDENTS">Import Mahasiswa Resmi</option>
              <option value="SOFT_DELETE_MEMBER">Hapus Anomali</option>
              <option value="RESTORE_MEMBER">Pulihkan Data</option>
              <option value="PROMOTE_TO_ADMIN">Promosi Admin</option>
              <option value="REVOKE_ADMIN">Cabut Admin</option>
              <option value="LOGIN_ADMIN">Login Admin</option>
              <option value="CHANGE_PASSWORD">Ganti Password</option>
            </select>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              {total} Catatan Log
            </span>
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3 w-40">Waktu</th>
                <th className="p-3 w-36">Pelaku / Aktor</th>
                <th className="p-3 w-48">Aksi</th>
                <th className="p-3">Deskripsi Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Tidak ditemukan rekam log yang sesuai.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800">
                        {l.actor_name || l.actor_id}
                      </span>
                      {l.actor_role && (
                        <span className="block text-[10px] text-slate-400 uppercase font-sans">
                          {l.actor_role}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800 font-sans">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">
                      {l.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
