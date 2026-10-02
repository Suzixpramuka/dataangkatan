import { Storage } from './storage.ts';
import { MatchingResult, UserRecord, VerificationStatus } from './types.ts';

export const NIM_REGEX = /^333726\d{4}$/;

export function normalizeText(str: string | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanPhone(phone: string | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && digits.length >= 9) {
    digits = '0' + digits;
  }
  return digits;
}

export function evaluateStudentMatching(user: {
  nama: string;
  nim: string;
  kelas?: string;
  program_studi?: string;
  angkatan?: string;
  wa_number?: string;
  id?: string;
}): {
  status: VerificationStatus;
  matching: MatchingResult;
  autoNote: string;
  autoMessage: string;
} {
  const cleanNim = user.nim ? user.nim.trim() : '';
  const official = Storage.findOfficialByNim(cleanNim);
  const activeNimUsers = Storage.findActiveUsersByNim(cleanNim).filter(
    (u) => !user.id || u.id !== user.id
  );
  const activeWaUsers = user.wa_number
    ? Storage.findActiveUsersByWa(user.wa_number).filter((u) => !user.id || u.id !== user.id)
    : [];

  const rosterEntry = user.wa_number ? Storage.findRosterByWa(user.wa_number) : undefined;

  const notes: string[] = [];

  const inOfficialList = !!official;
  const nimMatch = NIM_REGEX.test(cleanNim);
  if (!nimMatch) {
    notes.push('Pola NIM tidak sesuai standar Informatika 2026 (harus 10 digit diawali 333726).');
  }

  let nameMatch = false;
  let classMatch = false;
  let prodiMatch = false;
  let angkatanMatch = false;

  if (official) {
    const userNormName = normalizeText(user.nama);
    const offNormName = normalizeText(official.nama);

    // Exact or mutual inclusion match
    if (userNormName === offNormName) {
      nameMatch = true;
    } else {
      // Check if all words of one exist in the other
      const userWords = userNormName.split(' ').filter(Boolean);
      const offWords = offNormName.split(' ').filter(Boolean);
      const commonWords = userWords.filter((w) => offWords.includes(w));
      if (commonWords.length >= 2 || (offWords.length === 1 && commonWords.length === 1)) {
        nameMatch = true;
      }
    }

    if (!nameMatch) {
      notes.push(`Nama pendaftar "${user.nama}" tidak persis dengan data resmi "${official.nama}".`);
    }

    const userClass = (user.kelas || '').trim().toUpperCase();
    const offClass = (official.kelas || '').trim().toUpperCase();
    classMatch = !offClass || userClass === offClass;
    if (!classMatch && offClass) {
      notes.push(`Kelas dipilih (${userClass}) berbeda dengan data resmi (${offClass}).`);
    }

    const userProdi = normalizeText(user.program_studi || 'Informatika');
    const offProdi = normalizeText(official.program_studi || 'Informatika');
    prodiMatch = userProdi === offProdi || userProdi.includes('informatika');

    const userAngkatan = (user.angkatan || '2026').trim();
    const offAngkatan = (official.angkatan || '2026').trim();
    angkatanMatch = userAngkatan === offAngkatan;
  } else {
    notes.push('NIM tidak ditemukan di data resmi mahasiswa Informatika 2026.');
  }

  const inRosterMatch = !!rosterEntry;
  if (!inRosterMatch && user.wa_number) {
    notes.push('Nomor WhatsApp belum tercatat di daftar grup resmi WhatsApp.');
  }

  const duplicateNimCount = activeNimUsers.length;
  const duplicateWaCount = activeWaUsers.length;

  if (duplicateNimCount > 0) {
    notes.push(`NIM ${cleanNim} terdeteksi digunakan di ${duplicateNimCount} akun lain.`);
  }
  if (duplicateWaCount > 0) {
    notes.push(`Nomor WhatsApp terdeteksi digunakan di ${duplicateWaCount} akun lain.`);
  }

  let calculatedStatus: VerificationStatus = 'PENDING';
  let autoMessage = 'Data kamu sudah diterima dan sedang diperiksa admin.';

  if (duplicateNimCount > 0 || duplicateWaCount > 0) {
    calculatedStatus = 'DUPLICATE_REVIEW';
    autoMessage =
      'Data kamu terdeteksi memiliki kesamaan NIM/WhatsApp dengan akun lain. Tim admin sedang meninjau data ini.';
  } else if (!inOfficialList || !nimMatch) {
    calculatedStatus = 'NEEDS_CONFIRMATION';
    autoMessage =
      'Data kamu masih memerlukan konfirmasi admin. Silakan tunggu atau hubungi admin apabila diperlukan.';
  } else if (nameMatch && classMatch && prodiMatch && angkatanMatch) {
    calculatedStatus = 'VERIFIED';
    autoMessage =
      'Selamat! Data kamu telah berhasil diverifikasi sebagai mahasiswa Informatika UNTIRTA 2026.';
  } else {
    calculatedStatus = 'NEEDS_CONFIRMATION';
    autoMessage =
      'Data kamu masih memerlukan konfirmasi admin karena terdapat ketidaksesuaian rincian data. Admin akan memeriksa secara manual.';
  }

  return {
    status: calculatedStatus,
    matching: {
      inOfficialList,
      nimMatch,
      nameMatch,
      classMatch,
      prodiMatch,
      angkatanMatch,
      inRosterMatch,
      duplicateNimCount,
      duplicateWaCount,
      notes,
    },
    autoNote: notes.join(' | '),
    autoMessage,
  };
}

export function maskName(name: string | undefined): string {
  if (!name) return '***';
  return name
    .split(' ')
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed.length <= 2) return trimmed[0] + '*';
      return trimmed[0] + '***' + trimmed[trimmed.length - 1];
    })
    .join(' ');
}

export function maskNim(nim: string | undefined): string {
  if (!nim || nim.length < 3) return '***';
  return nim.slice(0, 3) + '****';
}

export function maskPhone(phone: string | undefined): string {
  if (!phone) return '-';
  const clean = cleanPhone(phone);
  if (clean.length < 4) return '08***';
  return clean.slice(0, 4) + '***';
}

export function maskInstagram(ig: string | undefined): string {
  if (!ig) return '-';
  const clean = ig.replace(/^@/, '');
  if (clean.length <= 2) return clean + '***';
  return clean.slice(0, 2) + '***';
}
