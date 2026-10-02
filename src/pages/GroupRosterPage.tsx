import React, { useState, useEffect } from 'react';
import { apiRequest, useRealtimeEvents } from '../api/client.ts';
import { GroupRoster } from '../types/index.ts';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Search,
  Phone,
  Instagram,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const GroupRosterPage: React.FC<Props> = ({ onNav }) => {
  const [roster, setRoster] = useState<GroupRoster[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [waName, setWaName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [ig, setIg] = useState('');
  const [linkedNim, setLinkedNim] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search });
      const res = await apiRequest<{ roster: GroupRoster[] }>(`/roster?${q.toString()}`);
      setRoster(res.roster);
    } catch (err) {
      console.error('Fetch roster error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [search]);

  useRealtimeEvents((event) => {
    if (event.type === 'ROSTER_UPDATED' || event.type === 'DISK_RELOAD') {
      fetchRoster();
    }
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waName.trim() || !waNumber.trim()) {
      setAddError('Nama di grup dan Nomor WhatsApp wajib diisi.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      await apiRequest('/roster', {
        method: 'POST',
        body: JSON.stringify({
          wa_display_name: waName.trim(),
          wa_number: waNumber.trim(),
          nickname: nickname.trim(),
          instagram: ig.trim(),
          linked_nim: linkedNim.trim(),
        }),
      });
      setShowAddModal(false);
      setWaName('');
      setWaNumber('');
      setNickname('');
      setIg('');
      setLinkedNim('');
      fetchRoster();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan anggota grup.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data ${name} dari daftar grup?`)) return;
    try {
      await apiRequest(`/roster/${id}`, { method: 'DELETE' });
      fetchRoster();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setImporting(true);
    try {
      const res = await apiRequest('/roster/import', {
        method: 'POST',
        body: JSON.stringify({ csvContent: csvText }),
      });
      alert(res.message);
      setShowImportModal(false);
      setCsvText('');
      fetchRoster();
    } catch (err: any) {
      alert(err.message || 'Gagal mengimpor data grup.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Daftar Anggota Grup WhatsApp Angkatan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data nomor telepon dan nama akun yang tertera di grup resmi WhatsApp Informatika 2026.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV Roster</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kontak</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama display grup, no WA, nama panggilan..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            {roster.length} Anggota Grup
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Nama di Grup WhatsApp</th>
                <th className="p-3">Nomor WhatsApp</th>
                <th className="p-3">Nama Panggilan</th>
                <th className="p-3">Instagram</th>
                <th className="p-3">Linked NIM</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data grup WhatsApp...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Belum ada data anggota grup WhatsApp tercatat.
                  </td>
                </tr>
              ) : (
                roster.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{r.wa_display_name}</td>
                    <td className="p-3 font-mono text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {r.wa_number}
                    </td>
                    <td className="p-3 text-slate-600">{r.nickname || '-'}</td>
                    <td className="p-3 text-slate-600">
                      {r.instagram ? `@${r.instagram}` : '-'}
                    </td>
                    <td className="p-3 font-mono text-blue-700">{r.linked_nim || '-'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.wa_display_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Kontak */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Tambah Anggota Grup WhatsApp
            </h3>

            {addError && <p className="text-xs text-rose-600 font-semibold">{addError}</p>}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama yang Tertera di Grup WA *
                </label>
                <input
                  type="text"
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  placeholder="Contoh: Nama di WhatsApp (Kelas)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full p-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Panggilan (Opsional):
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Nama Panggilan"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Instagram (Opsional):
                </label>
                <input
                  type="text"
                  value={ig}
                  onChange={(e) => setIg(e.target.value)}
                  placeholder="username_ig"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Linked NIM (Opsional jika diketahui):
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={linkedNim}
                  onChange={(e) => setLinkedNim(e.target.value)}
                  placeholder="333726xxxx"
                  className="w-full p-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  {addLoading ? 'Menyimpan...' : 'Simpan Data Grup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Roster CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Import Data Anggota Grup dari CSV
            </h3>

            <p className="text-xs text-slate-500">
              Format header kolom: <code>nama_di_grup,no_wa,nama_panggilan,instagram,linked_nim</code>
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Tempelkan isi CSV di sini..."
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  {importing ? 'Mengimpor...' : 'Proses Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
