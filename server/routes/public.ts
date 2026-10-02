import { Router, Request, Response } from 'express';
import { Storage } from '../storage.ts';
import { maskName, maskNim, maskPhone, maskInstagram } from '../verification.ts';
import { publicSearchLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

// "Cek Data Saya" with Anti-Scraping protection and Server-Side Masking
router.get('/check-my-data', publicSearchLimiter, (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  // Strict anti-scraping: minimum 3 characters required
  if (query.length < 3) {
    res.status(400).json({
      message: 'Masukkan kata kunci pencarian minimal 3 karakter (misal: nama atau 4 digit NIM).',
      results: [],
    });
    return;
  }

  const officialList = Storage.getOfficialStudents().filter((o) => o.active);
  const rosterList = Storage.getGroupRoster();
  const registeredUsers = Storage.getUsers().filter((u) => !u.deleted);
  const registeredNimSet = new Set(registeredUsers.map((u) => u.nim.trim()));

  // Search official students
  const matchedOfficial = officialList.filter(
    (o) => o.nama.toLowerCase().includes(query) || o.nim.includes(query)
  );

  // Maximum 10 results per query to prevent scraping bulk databases
  const limitedResults = matchedOfficial.slice(0, 10).map((o) => {
    const isRegistered = registeredNimSet.has(o.nim.trim());
    // Find matching roster if any
    const roster = rosterList.find((r) => r.linked_nim && r.linked_nim.trim() === o.nim.trim());

    return {
      id: o.id,
      namaMasked: maskName(o.nama),
      nimMasked: maskNim(o.nim),
      kelas: o.kelas,
      programStudi: o.program_studi,
      angkatan: o.angkatan,
      waNumberMasked: roster ? maskPhone(roster.wa_number) : null,
      waDisplayName: roster ? roster.wa_display_name : null,
      nickname: roster ? roster.nickname : null,
      instagramMasked: roster && roster.instagram ? maskInstagram(roster.instagram) : null,
      statusPendaftaran: isRegistered ? 'Sudah Terdaftar' : 'Belum Terdaftar',
      isRegistered,
    };
  });

  res.json({
    totalMatched: matchedOfficial.length,
    results: limitedResults,
  });
});

// Unlock NIM claim by verifying user knows the exact full 10-digit NIM
router.post('/claim-verify-nim', publicSearchLimiter, (req: Request, res: Response) => {
  const { id, fullNim } = req.body;
  if (!id || !fullNim) {
    res.status(400).json({ message: 'ID dan NIM lengkap wajib diisi.' });
    return;
  }

  const cleanNim = String(fullNim).trim();
  const student = Storage.getOfficialStudents().find((o) => o.id === id && o.active);

  if (!student) {
    res.status(404).json({ message: 'Data tidak ditemukan.' });
    return;
  }

  // Exact 10 digit match
  if (student.nim.trim() !== cleanNim) {
    res.status(400).json({
      verified: false,
      message: 'NIM yang Anda masukkan tidak cocok dengan data ini. Silakan periksa kembali.',
    });
    return;
  }

  res.json({
    verified: true,
    message: 'NIM cocok! Anda dapat melanjutkan ke pendaftaran.',
    nim: student.nim,
    namaMasked: maskName(student.nama),
    kelas: student.kelas,
  });
});

// Live Public Dashboard: Registered students list with censorship / masking
router.get('/registered-students', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 15));
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const classFilter = (req.query.kelas as string) || 'ALL';
  const statusFilter = (req.query.status as string) || 'ALL';

  let list = Storage.getUsers().filter((u) => !u.deleted && u.role === 'MEMBER');

  // Overall quick stats
  const stats = {
    total: list.length,
    verified: list.filter((u) => u.status === 'VERIFIED').length,
    pending: list.filter((u) => u.status === 'PENDING').length,
    needsConfirmation: list.filter((u) => u.status === 'NEEDS_CONFIRMATION').length,
    duplicateReview: list.filter((u) => u.status === 'DUPLICATE_REVIEW').length,
    notVerified: list.filter((u) => u.status === 'NOT_VERIFIED').length,
  };

  if (classFilter !== 'ALL') {
    list = list.filter((u) => (u.kelas || '').toUpperCase() === classFilter.toUpperCase());
  }

  if (statusFilter !== 'ALL') {
    list = list.filter((u) => u.status === statusFilter);
  }

  if (search) {
    list = list.filter(
      (u) =>
        u.nama.toLowerCase().includes(search) ||
        u.nim.includes(search) ||
        (u.kelas && u.kelas.toLowerCase().includes(search))
    );
  }

  // Sort by latest registered
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;

  // Mask all private data before sending to public clients
  const items = list.slice(startIndex, startIndex + limit).map((u) => ({
    id: u.id,
    namaMasked: maskName(u.nama),
    nimMasked: maskNim(u.nim),
    kelas: u.kelas || 'Belum Ditentukan',
    programStudi: u.program_studi || 'Informatika',
    angkatan: u.angkatan || '2026',
    waNumberMasked: maskPhone(u.wa_number),
    waDisplayNameMasked: u.wa_display_name ? maskName(u.wa_display_name) : null,
    instagramMasked: maskInstagram(u.instagram),
    status: u.status,
    createdAt: u.created_at,
  }));

  res.json({
    items,
    total,
    page,
    totalPages,
    limit,
    stats,
  });
});

export default router;
