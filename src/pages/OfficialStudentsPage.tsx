import React, { useState, useEffect } from 'react';
import { apiRequest, useRealtimeEvents } from '../api/client.ts';
import { OfficialStudent } from '../types/index.ts';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

interface Props {
  onNav: (tab: string) => void;
}

export const OfficialStudentsPage: React.FC<Props> = ({ onNav }) => {
  const [students, setStudents] = useState<OfficialStudent[]>([]);
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addNama, setAddNama] = useState('');
  const [addNim, setAddNim] = useState('');
  const [addKelas, setAddKelas] = useState('A26');
  const [addProdi, setAddProdi] = useState('Informatika');
  const [addAngkatan, setAddAngkatan] = useState('2026');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fetchOfficial = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, kelas: kelasFilter });
      const res = await apiRequest<{ students: OfficialStudent[] }>(`/official?${q.toString()}`);
      setStudents(res.students);
    } catch (err) {
      console.error('Fetch official students error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficial();
  }, [search, kelasFilter]);

  useRealtimeEvents((event) => {
    if (event.type === 'OFFICIAL_UPDATED' || event.type === 'DISK_RELOAD') {
      fetchOfficial();
    }
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNama.trim() || addNim.trim().length !== 10) {
      setAddError('Nama dan NIM (10 digit) wajib diisi.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      await apiRequest('/official', {
        method: 'POST',
        body: JSON.stringify({
          nama: addNama.trim(),
          nim: addNim.trim(),
          kelas: addKelas,
          program_studi: addProdi,
          angkatan: addAngkatan,
        }),
      });
      setShowAddModal(false);
      setAddNama('');
      setAddNim('');
      fetchOfficial();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan data resmi.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus data resmi mahasiswa ${nama}?`)) return;
    try {
      await apiRequest(`/official/${id}`, { method: 'DELETE' });
      fetchOfficial();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      handleGeneratePreview(text);
    };
    reader.readAsText(file);
  };

  const handleGeneratePreview = async (text: string) => {
    setImporting(true);
    setImportNotice(null);
    try {
      const res = await apiRequest('/official/import/preview', {
        method: 'POST',
        body: JSON.stringify({ csvContent: text }),
      });
      setPreviewData(res);
    } catch (err: any) {
      setImportNotice(err.message || 'Gagal memproses file CSV.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await apiRequest('/official/import/confirm', {
        method: 'POST',
        body: JSON.stringify({ students: previewData.validRows }),
      });
      alert(res.message);
      setShowImportModal(false);
      setPreviewData(null);
      setCsvContent('');
      fetchOfficial();
    } catch (err: any) {
      alert(err.message || 'Gagal mengimpor data.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Data Resmi Mahasiswa Informatika 2026
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar acuan resmi mahasiswa untuk pencocokan otomatis verifikasi akun pendaftar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/official/template"
            download
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template CSV</span>
          </a>
          <button
            onClick={() => {
              setShowImportModal(true);
              setPreviewData(null);
              setCsvContent('');
            }}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Manual</span>
          </button>
        </div>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau NIM resmi..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="A26">Kelas A26</option>
              <option value="B26">Kelas B26</option>
              <option value="C26">Kelas C26</option>
              <option value="D26">Kelas D26</option>
              <option value="E26">Kelas E26</option>
              <option value="F26">Kelas F26</option>
            </select>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              {students.length} Mahasiswa
            </span>
          </div>
        </div>

        {/* Official Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Nama Mahasiswa</th>
                <th className="p-3">NIM Lengkap</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Program Studi</th>
                <th className="p-3">Angkatan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data resmi mahasiswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Belum ada data resmi mahasiswa. Gunakan tombol "Import CSV" atau "Tambah Manual".
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{s.nama}</td>
                    <td className="p-3 font-mono font-bold text-blue-800">{s.nim}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{s.program_studi}</td>
                    <td className="p-3 text-slate-600">{s.angkatan}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id, s.nama)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Hapus data"
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

      {/* Modal: Tambah Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Tambah Data Mahasiswa Resmi
            </h3>

            {addError && <p className="text-xs text-rose-600 font-semibold">{addError}</p>}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  placeholder="Contoh: Nama Lengkap Mahasiswa"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIM (10 Digit) *</label>
                <input
                  type="text"
                  maxLength={10}
                  value={addNim}
                  onChange={(e) => setAddNim(e.target.value.replace(/\D/g, ''))}
                  placeholder="333726xxxx"
                  className="w-full p-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas *</label>
                <select
                  value={addKelas}
                  onChange={(e) => setAddKelas(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="A26">A26</option>
                  <option value="B26">B26</option>
                  <option value="C26">C26</option>
                  <option value="D26">D26</option>
                  <option value="E26">E26</option>
                  <option value="F26">F26</option>
                </select>
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
                  {addLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV with Preview & Validation */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Data Mahasiswa Resmi dari CSV
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <p className="font-bold">Format Kolom Header CSV yang Didukung:</p>
                <p className="font-mono text-[11px] text-blue-800">
                  nama,nim,kelas,program_studi,angkatan
                </p>
                <p className="text-[11px] text-blue-700">
                  Contoh baris: <code>Nama Mahasiswa,3337260001,A26,Informatika,2026</code>
                </p>
              </div>

              {/* Upload file input */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="font-bold text-sm text-slate-800">
                    Klik untuk memilih file CSV
                  </p>
                  <p className="text-slate-400 text-xs">
                    Mendukung ratusan hingga ribuan data mahasiswa sekaligus
                  </p>
                </label>
              </div>

              {importNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                  {importNotice}
                </div>
              )}

              {/* Preview Summary */}
              {previewData && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                      <span className="text-[11px] text-emerald-600 block">Siap Diimpor (Valid)</span>
                      <span className="text-xl font-black">{previewData.summary.validCount} baris</span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                      <span className="text-[11px] text-amber-600 block">Duplikat (Dilewati)</span>
                      <span className="text-xl font-black">{previewData.summary.duplicateCount} baris</span>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                      <span className="text-[11px] text-rose-600 block">Format Salah (Error)</span>
                      <span className="text-xl font-black">{previewData.summary.errorCount} baris</span>
                    </div>
                  </div>

                  {/* Valid preview sample table */}
                  {previewData.validRows.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                          <tr>
                            <th className="p-2">Nama</th>
                            <th className="p-2">NIM</th>
                            <th className="p-2">Kelas</th>
                            <th className="p-2">Prodi</th>
                            <th className="p-2">Angkatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewData.validRows.slice(0, 10).map((r: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-2 font-semibold text-slate-800">{r.nama}</td>
                              <td className="p-2 font-mono text-blue-700">{r.nim}</td>
                              <td className="p-2">{r.kelas}</td>
                              <td className="p-2">{r.program_studi}</td>
                              <td className="p-2">{r.angkatan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.validRows.length > 10 && (
                        <p className="p-2 text-center text-[11px] text-slate-400 bg-slate-50">
                          + {previewData.validRows.length - 10} baris data valid lainnya...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || !previewData || previewData.validRows.length === 0}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                {importing ? 'Mengimpor Data...' : `Konfirmasi Import ${previewData?.validRows?.length || 0} Data`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
