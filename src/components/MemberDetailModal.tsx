import React, { useState, useEffect } from 'react';
import { User, VerificationStatus, MatchingEvaluation, OfficialStudent, GroupRoster } from '../types/index.ts';
import { apiRequest } from '../api/client.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Copy,
  Trash2,
  ShieldCheck,
  Send,
  MessageSquare,
  FileText,
  UserCheck,
  Phone,
  Instagram,
  GraduationCap,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface Props {
  memberId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onRequestDelete: (member: User) => void;
  isSuperAdmin?: boolean;
}

export const MemberDetailModal: React.FC<Props> = ({
  memberId,
  isOpen,
  onClose,
  onRefresh,
  onRequestDelete,
  isSuperAdmin = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<User | null>(null);
  const [evaluation, setEvaluation] = useState<MatchingEvaluation | null>(null);
  const [officialRecord, setOfficialRecord] = useState<OfficialStudent | null>(null);
  const [rosterRecord, setRosterRecord] = useState<GroupRoster | null>(null);
  const [duplicateAccounts, setDuplicateAccounts] = useState<any[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus>('PENDING');
  const [adminNote, setAdminNote] = useState('');
  const [memberMessage, setMemberMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [msgNotice, setMsgNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !memberId) return;

    setLoading(true);
    setMsgNotice(null);
    apiRequest<{
      member: User;
      evaluation: MatchingEvaluation;
      officialRecord: OfficialStudent | null;
      rosterRecord: GroupRoster | null;
      duplicateAccounts: any[];
    }>(`/admin/members/${memberId}`)
      .then((res) => {
        setMember(res.member);
        setEvaluation(res.evaluation);
        setOfficialRecord(res.officialRecord);
        setRosterRecord(res.rosterRecord);
        setDuplicateAccounts(res.duplicateAccounts);
        setSelectedStatus(res.member.status);
        setAdminNote(res.member.admin_note || '');
        setMemberMessage(res.member.member_message || '');
      })
      .catch((err) => {
        setMsgNotice({ type: 'error', text: err.message || 'Gagal memuat detail mahasiswa' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, memberId]);

  if (!isOpen) return null;

  const handleSaveStatus = async (statusOverride?: VerificationStatus) => {
    if (!member) return;
    const newStatus = statusOverride || selectedStatus;
    setUpdating(true);
    setMsgNotice(null);

    try {
      const res = await apiRequest(`/admin/members/${member.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          admin_note: adminNote,
          member_message: memberMessage,
        }),
      });
      setSelectedStatus(newStatus);
      setMsgNotice({ type: 'success', text: `Status berhasil diubah menjadi ${newStatus}` });
      setMember({ ...member, status: newStatus, admin_note: adminNote, member_message: memberMessage });
      onRefresh();
    } catch (err: any) {
      setMsgNotice({ type: 'error', text: err.message || 'Gagal memperbarui status.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRestore = async () => {
    if (!member) return;
    setUpdating(true);
    try {
      await apiRequest(`/admin/members/${member.id}/restore`, { method: 'POST' });
      setMsgNotice({ type: 'success', text: 'Data mahasiswa berhasil dipulihkan dari arsip.' });
      onRefresh();
      onClose();
    } catch (err: any) {
      setMsgNotice({ type: 'error', text: err.message || 'Gagal memulihkan data.' });
    } finally {
      setUpdating(false);
    }
  };

  const matching = evaluation?.matching;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">{member ? member.nama : 'Memuat data...'}</h3>
                {member && <StatusBadge status={member.status} size="sm" />}
                {member?.deleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    DIARSIPKAN / TERHAPUS
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-mono">{member?.nim} &bull; {member?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <span>Memuat data lengkap & hasil verifikasi...</span>
            </div>
          ) : !member ? (
            <div className="text-center py-12 text-rose-600">Gagal memuat data mahasiswa.</div>
          ) : (
            <>
              {msgNotice && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    msgNotice.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {msgNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{msgNotice.text}</span>
                </div>
              )}

              {/* Duplicate Warning Box if any */}
              {duplicateAccounts.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-700">
                    <Copy className="w-4 h-4" />
                    <span>Terdeteksi Duplikat dengan {duplicateAccounts.length} Akun Lain!</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {duplicateAccounts.map((dup) => (
                      <div key={dup.id} className="p-2.5 bg-white rounded-lg border border-purple-100 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{dup.nama}</p>
                          <p className="text-[11px] text-slate-500 font-mono">NIM: {dup.nim} &bull; WA: {dup.wa_number}</p>
                        </div>
                        <StatusBadge status={dup.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Columns: Profile data vs Automated Verification Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Member Submission Data */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Data yang Diinput Mahasiswa
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-semibold text-slate-900 text-right">{member.nama}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">NIM:</span>
                      <span className="font-mono font-semibold text-slate-900">{member.nim}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Kelas:</span>
                      <span className="font-semibold text-slate-900">{member.kelas || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Program Studi:</span>
                      <span className="text-slate-800">{member.program_studi || 'Informatika'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Angkatan:</span>
                      <span className="text-slate-800">{member.angkatan || '2026'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">WhatsApp:</span>
                      <span className="font-mono font-semibold text-slate-900 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {member.wa_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Nama di Grup WA:</span>
                      <span className="text-slate-800">{member.wa_display_name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Nama Panggilan:</span>
                      <span className="text-slate-800">{member.nickname || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Instagram:</span>
                      <span className="text-slate-800 flex items-center gap-1">
                        {member.instagram ? `@${member.instagram}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Jumlah Submit:</span>
                      <span className="font-mono text-slate-800">{member.submit_count || 1} kali</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Waktu Mendaftar:</span>
                      <span className="text-slate-600 text-[11px]">{member.created_at ? new Date(member.created_at).toLocaleString('id-ID') : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Automated Verification Checklist */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Hasil Pencocokan Otomatis Sistem
                  </h4>

                  <div className="space-y-2 text-xs">
                    {/* NIM in Official Data */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-800">1. Terdaftar di Data Resmi Mahasiswa</div>
                        <div className="text-[11px] text-slate-500">
                          {officialRecord ? `Tercatat: ${officialRecord.nama} (Kelas ${officialRecord.kelas})` : 'NIM tidak ada di official_students.csv'}
                        </div>
                      </div>
                      {matching?.inOfficialList ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cocok
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Tidak Ada
                        </span>
                      )}
                    </div>

                    {/* NIM Format */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-800">2. Format Pola NIM (333726xxxx)</div>
                        <div className="text-[11px] text-slate-500">Format 10 digit resmi angkatan 2026</div>
                      </div>
                      {matching?.nimMatch ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Tidak Sesuai
                        </span>
                      )}
                    </div>

                    {/* Name match */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-800">3. Kesesuaian Nama Lengkap</div>
                        <div className="text-[11px] text-slate-500">
                          Resmi: {officialRecord ? officialRecord.nama : '-'}
                        </div>
                      </div>
                      {matching?.nameMatch ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cocok
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Beda
                        </span>
                      )}
                    </div>

                    {/* Class match */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-800">4. Kesesuaian Kelas</div>
                        <div className="text-[11px] text-slate-500">
                          Resmi: {officialRecord ? officialRecord.kelas : '-'}
                        </div>
                      </div>
                      {matching?.classMatch ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cocok
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Beda
                        </span>
                      )}
                    </div>

                    {/* WhatsApp in Roster */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
                      <div>
                        <div className="font-semibold text-slate-800">5. Nomor WhatsApp di Roster Grup</div>
                        <div className="text-[11px] text-slate-500">
                          {rosterRecord ? `Tercatat di grup: "${rosterRecord.wa_display_name}"` : 'Belum ada di roster WhatsApp'}
                        </div>
                      </div>
                      {matching?.inRosterMatch ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ada di Grup
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Belum Ada
                        </span>
                      )}
                    </div>
                  </div>

                  {matching?.notes && matching.notes.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Catatan Sistem:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {matching.notes.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Override Buttons */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Aksi Verifikasi Admin
                  </h4>
                  <span className="text-xs text-slate-500">
                    Status saat ini: <strong className="text-slate-800">{selectedStatus}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveStatus('VERIFIED')}
                    disabled={updating}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Terverifikasi Resmi (VERIFIED)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveStatus('NEEDS_CONFIRMATION')}
                    disabled={updating}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Minta Konfirmasi (NEEDS_CONFIRMATION)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveStatus('DUPLICATE_REVIEW')}
                    disabled={updating}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    Tinjau Duplikat (DUPLICATE_REVIEW)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveStatus('NOT_VERIFIED')}
                    disabled={updating}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak / Belum Terverifikasi (NOT_VERIFIED)
                  </button>
                </div>
              </div>

              {/* Notes Sections: Internal vs Public */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Internal Admin Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Catatan Internal Admin (Rahasia)
                    </span>
                    <span className="text-[10px] text-amber-600 font-normal">TIDAK terlihat oleh member</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Catatan internal pengurus (misal: 'Sudah crosscheck kontak kelas, oke')..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Public Member Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      Pesan untuk Mahasiswa
                    </span>
                    <span className="text-[10px] text-blue-600 font-normal">TERLIHAT di dashboard mahasiswa</span>
                  </label>
                  <textarea
                    rows={3}
                    value={memberMessage}
                    onChange={(e) => setMemberMessage(e.target.value)}
                    placeholder="Pesan petunjuk atau konfirmasi untuk mahasiswa ini..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Save notes button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveStatus()}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan Catatan & Pesan'}
                </button>
              </div>

              {/* Anomaly Deletion Area */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Tindakan Khusus Data Anomali
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Gunakan jika data ini adalah akun fiktif, spam, atau anomali yang tidak dikenali.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {member.deleted ? (
                    isSuperAdmin && (
                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={updating}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Pulihkan Data (Super Admin)
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestDelete(member);
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus / Arsipkan Data Anomali
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
