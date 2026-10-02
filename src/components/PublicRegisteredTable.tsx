import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest, useRealtimeEvents } from '../api/client.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Radio,
  Lock,
} from 'lucide-react';

interface RegisteredItem {
  id: string;
  namaMasked: string;
  nimMasked: string;
  kelas: string;
  programStudi: string;
  angkatan: string;
  waNumberMasked: string | null;
  waDisplayNameMasked: string | null;
  instagramMasked: string | null;
  status: any;
  createdAt: string;
}

interface StatsOverview {
  total: number;
  verified: number;
  pending: number;
  needsConfirmation: number;
  duplicateReview: number;
  notVerified: number;
}

export const PublicRegisteredTable: React.FC = () => {
  const [items, setItems] = useState<RegisteredItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRegistered = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        kelas: classFilter,
        status: statusFilter,
      });

      const res = await apiRequest<{
        items: RegisteredItem[];
        total: number;
        page: number;
        totalPages: number;
        stats: StatsOverview;
      }>(`/public/registered-students?${q.toString()}`);

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setStats(res.stats);
    } catch (err) {
      console.error('Error fetching registered students:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, classFilter, statusFilter]);

  useEffect(() => {
    fetchRegistered();
  }, [fetchRegistered]);

  // Realtime updates via Server-Sent Events
  useRealtimeEvents((event) => {
    if (event.type === 'USERS_UPDATED' || event.type === 'DISK_RELOAD') {
      fetchRegistered();
    }
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-4">
      {/* Top Banner & Live Status */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              Live Realtime Feed
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Daftar Mahasiswa Terdata (Disensor / Masked)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Pengunjung dapat melihat langsung seluruh mahasiswa yang telah menginput data dirinya. Data pribadi otomatis disensor dari server demi menjaga kerahasiaan dan privasi.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs text-blue-200 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-xs">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Bukan Akun Demo &bull; Data Riil Terverifikasi</span>
        </div>
      </div>

      {/* Stats Summary Chips */}
      {stats && (
        <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Total Masuk</span>
              <span className="text-xl font-black text-blue-950 font-mono">{stats.total}</span>
            </div>
            <Users className="w-5 h-5 text-blue-600" />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Terverifikasi Resmi</span>
              <span className="text-xl font-black text-emerald-800 font-mono">{stats.verified}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Perlu Konfirmasi</span>
              <span className="text-xl font-black text-amber-800 font-mono">{stats.needsConfirmation}</span>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Menunggu Review</span>
              <span className="text-xl font-black text-slate-800 font-mono">{stats.pending}</span>
            </div>
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau NIM tersamar..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kelas</option>
            <option value="A26">Kelas A26</option>
            <option value="B26">Kelas B26</option>
            <option value="C26">Kelas C26</option>
            <option value="D26">Kelas D26</option>
            <option value="E26">Kelas E26</option>
            <option value="F26">Kelas F26</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="VERIFIED">Terverifikasi Resmi</option>
            <option value="PENDING">Menunggu Review</option>
            <option value="NEEDS_CONFIRMATION">Perlu Konfirmasi</option>
            <option value="DUPLICATE_REVIEW">Tinjau Duplikat</option>
          </select>
        </div>

        <button
          onClick={fetchRegistered}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
          title="Segarkan Data Realtime"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3 w-12 text-center">No</th>
              <th className="p-3">Nama (Disensor)</th>
              <th className="p-3">NIM (Disensor)</th>
              <th className="p-3">Kelas</th>
              <th className="p-3">No WA (Disensor)</th>
              <th className="p-3">Instagram</th>
              <th className="p-3">Status Verifikasi</th>
              <th className="p-3 text-right">Waktu Mendaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span>Memuat data mahasiswa terdata...</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada data mahasiswa terdaftar yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition">
                  <td className="p-3 text-center text-slate-400 font-mono">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="p-3 font-bold text-slate-900 font-mono tracking-wide">
                    {item.namaMasked}
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-800">
                    {item.nimMasked}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold text-slate-700">
                      {item.kelas}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {item.waNumberMasked || '-'}
                  </td>
                  <td className="p-3 text-slate-600">
                    {item.instagramMasked ? `@${item.instagramMasked}` : '-'}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Menampilkan {items.length} dari <strong>{total}</strong> mahasiswa terdata
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700">
            Halaman {page} dari {totalPages}
          </span>
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
  );
};
