import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { apiRequest, useRealtimeEvents } from "../api/client.ts";
import { StatsData, User, VerificationStatus } from "../types/index.ts";
import { StatsCards } from "../components/StatsCards.tsx";
import { StatusBadge } from "../components/StatusBadge.tsx";
import { MemberDetailModal } from "../components/MemberDetailModal.tsx";
import { AnomalyDeleteModal } from "../components/AnomalyDeleteModal.tsx";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Copy,
  UserX,
  FileText,
  BarChart3,
  CheckSquare,
  Square,
  Shield,
  Layers,
} from "lucide-react";

interface Props {
  onNav: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onNav }) => {
  const { user, isSuperAdmin } = useAuth();

  // Navigation tab inside dashboard
  const [activeTab, setActiveTab] = useState<
    "members" | "unregistered" | "duplicates" | "archived"
  >("members");

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);

  // Members table filter & pagination
  const [members, setMembers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  // Selection for bulk action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeletePrompt, setBulkDeletePrompt] = useState(false);
  const [bulkDeleteReason, setBulkDeleteReason] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Tab: Unregistered
  const [unregisteredList, setUnregisteredList] = useState<any[]>([]);
  const [loadingUnregistered, setLoadingUnregistered] = useState(false);

  // Tab: Duplicates
  const [duplicatesList, setDuplicatesList] = useState<any[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  // Modals
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [deleteTargetMember, setDeleteTargetMember] = useState<User | null>(
    null,
  );

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiRequest<StatsData>("/admin/stats");
      setStats(res);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  // Fetch Members (Server-Side Paginated)
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const showDeleted = activeTab === "archived";
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        status: statusFilter,
        // kelas: classFilter,
        sortBy,
        sortDir,
        showDeleted: String(showDeleted),
      });

      const res = await apiRequest<{
        items: User[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/members?${q.toString()}`);

      setMembers(res.items);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    statusFilter,
    classFilter,
    sortBy,
    sortDir,
    activeTab,
  ]);

  // Fetch Unregistered Tab
  const fetchUnregistered = async () => {
    setLoadingUnregistered(true);
    try {
      const res = await apiRequest<{ items: any[]; total: number }>(
        "/admin/unregistered",
      );
      setUnregisteredList(res.items);
    } catch (err) {
      console.error("Fetch unregistered error:", err);
    } finally {
      setLoadingUnregistered(false);
    }
  };

  // Fetch Duplicates Tab
  const fetchDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const res = await apiRequest<{ items: any[]; total: number }>(
        "/admin/duplicates",
      );
      setDuplicatesList(res.items);
    } catch (err) {
      console.error("Fetch duplicates error:", err);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "members" || activeTab === "archived") {
      fetchMembers();
    } else if (activeTab === "unregistered") {
      fetchUnregistered();
    } else if (activeTab === "duplicates") {
      fetchDuplicates();
    }
  }, [fetchMembers, activeTab]);

  // Realtime SSE updates
  useRealtimeEvents((event) => {
    fetchStats();
    if (activeTab === "members" || activeTab === "archived") {
      fetchMembers();
    } else if (activeTab === "unregistered") {
      fetchUnregistered();
    } else if (activeTab === "duplicates") {
      fetchDuplicates();
    }
  });

  const handleBulkDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || bulkDeleteReason.trim().length < 3) return;

    setBulkDeleting(true);
    try {
      await apiRequest("/admin/members/bulk-delete", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedIds,
          reason: bulkDeleteReason.trim(),
        }),
      });
      setBulkDeletePrompt(false);
      setBulkDeleteReason("");
      setSelectedIds([]);
      fetchStats();
      fetchMembers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus massal.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const toggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Top Banner: Welcome Admin & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Dashboard Verifikasi IF26
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-100 text-blue-800">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau dan verifikasi mahasiswa angkatan 2026 secara realtime tanpa
            batasan baris data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/admin/export/csv?status=${statusFilter}&kelas=${classFilter}`}
            download
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <a
            href={`/api/admin/export/xlsx?status=${statusFilter}&kelas=${classFilter}`}
            download
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (XLSX)</span>
          </a>
          <button
            onClick={() => {
              fetchStats();
              fetchMembers();
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Realtime Stats Cards */}
      <StatsCards
        stats={stats}
        activeStatusFilter={statusFilter}
        onFilterChange={(s) => {
          setStatusFilter(s);
          setActiveTab("members");
          setPage(1);
        }}
        onOpenUnregisteredTab={() => setActiveTab("unregistered")}
        onOpenDuplicatesTab={() => setActiveTab("duplicates")}
      />
      Simple Visual Distribution Cards (Charts)
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Distribution Bar */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              {/* <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Distribusi Mahasiswa Per Kelas
              </h3> */}
              <span className="text-[11px] text-slate-400 font-mono">
                Total {stats.totalMembers} Terdata
              </span>
            </div>
            <div className="space-y-2 pt-1">
              {["A26", "B26", "C26", "D26", "E26", "F26"].map((k) => {
                const count = stats.classDistribution[k] || 0;
                const pct =
                  stats.totalMembers > 0
                    ? Math.round((count / stats.totalMembers) * 100)
                    : 0;
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      {/* <span className="text-slate-700 font-semibold">
                        Kelas {k}
                      </span> */}
                      <span className="text-slate-500 font-mono">
                        {count} org ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Status Breakdown */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Rasio Status Verifikasi
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {stats.totalMembers > 0
                  ? `${Math.round((stats.verified / stats.totalMembers) * 100)}% Terverifikasi`
                  : "0%"}
              </span>
            </div>
            <div className="space-y-2 pt-1">
              {[
                {
                  label: "Terverifikasi Resmi (VERIFIED)",
                  count: stats.verified,
                  color: "bg-emerald-600",
                },
                {
                  label: "Menunggu Pemeriksaan (PENDING)",
                  count: stats.pending,
                  color: "bg-slate-400",
                },
                {
                  label: "Perlu Konfirmasi (NEEDS_CONFIRMATION)",
                  count: stats.needsConfirmation,
                  color: "bg-amber-500",
                },
                {
                  label: "Tinjau Duplikat (DUPLICATE_REVIEW)",
                  count: stats.duplicateReview,
                  color: "bg-purple-600",
                },
                {
                  label: "Belum Terverifikasi (NOT_VERIFIED)",
                  count: stats.notVerified,
                  color: "bg-rose-500",
                },
              ].map((s) => {
                const pct =
                  stats.totalMembers > 0
                    ? Math.round((s.count / stats.totalMembers) * 100)
                    : 0;
                return (
                  <div key={s.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">
                        {s.label}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Tabs Bar */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "members"
              ? "bg-white border-t-2 border-blue-600 text-blue-700 font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Semua Anggota Terdata</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
            {stats?.totalMembers || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("unregistered")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "unregistered"
              ? "bg-white border-t-2 border-indigo-600 text-indigo-700 font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserX className="w-4 h-4 text-indigo-600" />
          <span>Belum Mendaftar</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
            {stats?.unregisteredCount || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("duplicates")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "duplicates"
              ? "bg-white border-t-2 border-purple-600 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Copy className="w-4 h-4 text-purple-600" />
          <span>Tinjau Duplikat</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
            {stats?.duplicateReview || 0}
          </span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "archived"
                ? "bg-white border-t-2 border-rose-600 text-rose-700 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Arsip / Terhapus</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
              {stats?.deletedCount || 0}
            </span>
          </button>
        )}
      </div>
      {/* TAB 1: MEMBERS TABLE */}
      {(activeTab === "members" || activeTab === "archived") && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
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
                  placeholder="Cari Nama, NIM, No WA, IG, atau Nama di grup..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="VERIFIED">Terverifikasi Resmi</option>
                <option value="PENDING">Menunggu Review</option>
                <option value="NEEDS_CONFIRMATION">Perlu Konfirmasi</option>
                <option value="DUPLICATE_REVIEW">Tinjau Duplikat</option>
                <option value="NOT_VERIFIED">Belum Terverifikasi</option>
              </select>

              {/* Class Filter */}
              {/* <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value="ALL">Semua Kelas</option>
                <option value="A26">Kelas A26</option>
                <option value="B26">Kelas B26</option>
                <option value="C26">Kelas C26</option>
                <option value="D26">Kelas D26</option>
                <option value="E26">Kelas E26</option>
                <option value="F26">Kelas F26</option>
              </select> */}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-rose-800">
                  {selectedIds.length} data terpilih
                </span>
                <button
                  onClick={() => setBulkDeletePrompt(true)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih</span>
                </button>
              </div>
            )}
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:text-slate-800"
                    >
                      {selectedIds.length === members.length &&
                      members.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">NIM</th>
                  {/* <th className="p-3">Kelas</th> */}
                  <th className="p-3">WhatsApp & Nama Grup</th>
                  <th className="p-3">Instagram</th>
                  <th className="p-3">Status Verifikasi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data anggota...</span>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ditemukan data anggota yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isSelected = selectedIds.includes(m.id);
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-blue-50/40 transition ${
                          isSelected ? "bg-blue-50/60" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleSelectId(m.id)}
                            className="p-1 hover:text-slate-800"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{m.nama}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {m.email}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 tracking-wide">
                          {m.nim}
                        </td>
                        {/* <td className="p-3 font-semibold text-slate-700">
                          {m.kelas ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">
                              {m.kelas}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td> */}
                        <td className="p-3">
                          <div className="font-mono text-slate-800">
                            {m.wa_number || "-"}
                          </div>
                          {m.wa_display_name && (
                            <div className="text-[11px] text-slate-500">
                              di grup: "{m.wa_display_name}"
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {m.instagram ? `@${m.instagram}` : "-"}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailMemberId(m.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-1 transition"
                              title="Lihat Detail & Verifikasi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => setDeleteTargetMember(m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus / Anomali"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan {members.length} dari <strong>{totalCount}</strong>{" "}
              total data mahasiswa
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
      )}
      {/* TAB 2: UNREGISTERED STUDENTS TAB */}
      {activeTab === "unregistered" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mahasiswa Resmi yang Belum Mendaftar Akun
              </h3>
              <p className="text-xs text-slate-500">
                Data resmi yang dimasukkan panitia namun belum memiliki akun di
                sistem
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
              {unregisteredList.length} Mahasiswa
            </span>
          </div>

          {loadingUnregistered ? (
            <div className="py-12 text-center text-slate-400">
              Memuat data...
            </div>
          ) : unregisteredList.length === 0 ? (
            <div className="py-12 text-center text-emerald-600 font-semibold">
              Hebat! Seluruh mahasiswa resmi telah mendaftar akun di sistem.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3">No</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">NIM</th>

                    <th className="p-3">Program Studi</th>
                    <th className="p-3">Status Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unregisteredList.map((st, i) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {st.nama}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {st.nim}
                      </td>
                      <td className="p-3">
                        {/* <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold">
                          {st.kelas}
                        </span> */}
                      </td>
                      <td className="p-3 text-slate-600">{st.program_studi}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                          Belum Punya Akun
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* TAB 3: DUPLICATE REVIEWS TAB */}
      {activeTab === "duplicates" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Copy className="w-5 h-5 text-purple-600" />
                Daftar Mahasiswa dengan Konflik Duplikasi (DUPLICATE_REVIEW)
              </h3>
              <p className="text-xs text-slate-500">
                Akun yang memiliki kesamaan NIM penuh atau nomor WhatsApp dengan
                akun lain. Periksa secara saksama.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
              {duplicatesList.length} Kasus
            </span>
          </div>

          {loadingDuplicates ? (
            <div className="py-12 text-center text-slate-400">
              Memuat data duplikat...
            </div>
          ) : duplicatesList.length === 0 ? (
            <div className="py-12 text-center text-emerald-600 font-semibold">
              Tidak ada data yang sedang berada dalam status Tinjau Duplikat.
            </div>
          ) : (
            <div className="space-y-4">
              {duplicatesList.map((item) => (
                <div
                  key={item.member.id}
                  className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.member.nama}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        NIM: {item.member.nim} &bull; WA:{" "}
                        {item.member.wa_number} &bull; Email:{" "}
                        {item.member.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setDetailMemberId(item.member.id)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                      Buka Verifikasi Detail
                    </button>
                  </div>

                  <div className="text-xs bg-white p-3 rounded-xl border border-purple-100 space-y-1">
                    <p className="font-bold text-purple-900">
                      Penyebab Konflik Duplikat:
                    </p>
                    {item.duplicateNims.length > 0 && (
                      <p className="text-rose-700">
                        &bull; NIM {item.member.nim} juga digunakan oleh:{" "}
                        {item.duplicateNims
                          .map((d: any) => `${d.nama} (${d.email})`)
                          .join(", ")}
                      </p>
                    )}
                    {item.duplicateWas.length > 0 && (
                      <p className="text-amber-700">
                        &bull; No WhatsApp {item.member.wa_number} juga
                        digunakan oleh:{" "}
                        {item.duplicateWas
                          .map((d: any) => `${d.nama} (${d.email})`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Detail Modal */}
      <MemberDetailModal
        memberId={detailMemberId}
        isOpen={!!detailMemberId}
        onClose={() => setDetailMemberId(null)}
        onRefresh={() => {
          fetchStats();
          fetchMembers();
        }}
        onRequestDelete={(m) => setDeleteTargetMember(m)}
        isSuperAdmin={isSuperAdmin}
      />
      {/* Delete / Anomaly Confirmation Modal */}
      <AnomalyDeleteModal
        member={deleteTargetMember}
        isOpen={!!deleteTargetMember}
        onClose={() => setDeleteTargetMember(null)}
        onDeleted={() => {
          fetchStats();
          fetchMembers();
        }}
      />
      {/* Bulk Delete Modal */}
      {bulkDeletePrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-rose-200">
            <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Hapus Massal {selectedIds.length} Mahasiswa
            </h3>
            <p className="text-xs text-slate-600">
              Anda akan mengarsipkan/menghapus {selectedIds.length} mahasiswa
              terpilih. Masukkan alasan yang sah untuk dicatat di audit log.
            </p>

            <form onSubmit={handleBulkDelete} className="space-y-3">
              <textarea
                rows={3}
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                placeholder="Alasan penghapusan massal..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkDeletePrompt(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkDeleting || bulkDeleteReason.trim().length < 3}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {bulkDeleting ? "Menghapus..." : "Konfirmasi Hapus Massal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
