import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { apiRequest } from '../api/client.ts';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Props {
  member: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const AnomalyDeleteModal: React.FC<Props> = ({ member, isOpen, onClose, onDeleted }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !member) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setErrorMsg('Alasan penghapusan wajib diisi (minimal 3 karakter).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await apiRequest(`/admin/members/${member.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      onDeleted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base">Hapus Data Anomali</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 space-y-2">
            <p>
              Anda akan menghapus data pendaftar berikut:
            </p>
            <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800">
              <p><strong>Nama:</strong> {member.nama}</p>
              <p><strong>NIM:</strong> {member.nim}</p>
              <p><strong>Email:</strong> {member.email}</p>
            </div>
            <p className="text-slate-500">
              Data ini akan diarsipkan (soft delete) sehingga tidak akan muncul di daftar aktif, namun dapat dipulihkan oleh Super Admin bila diperlukan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Penghapusan (Wajib diisi):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Akun bot fiktif, nomor telepon tidak aktif, atau bukan angkatan 2026..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 3}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {loading ? 'Menghapus...' : 'Konfirmasi Hapus Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
