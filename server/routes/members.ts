import { Router, Response } from 'express';
import { z } from 'zod';
import { Storage } from '../storage.ts';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.ts';
import { evaluateStudentMatching, cleanPhone, NIM_REGEX } from '../verification.ts';

const router = Router();

const profileSchema = z.object({
  nama: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  nim: z.string().regex(/^\d{10}$/, 'NIM harus tepat 10 digit'),
  kelas: z.string().min(1, 'Kelas wajib dipilih'),
  program_studi: z.string().default('Informatika'),
  angkatan: z.string().default('2026'),
  wa_number: z.string().min(9, 'Nomor WhatsApp minimal 9 digit').max(16),
  wa_display_name: z.string().min(1, 'Nama di grup WhatsApp wajib diisi').max(100),
  nickname: z.string().max(50).optional().default(''),
  instagram: z.string().max(50).optional().default(''),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Persetujuan kebijakan privasi wajib dicentang.',
  }),
});

// Get own profile
router.get('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = Storage.findUserById(req.user!.id);
  if (!user || user.deleted) {
    res.status(404).json({ message: 'Data pengguna tidak ditemukan.' });
    return;
  }

  // Calculate live matching breakdown for user's own feedback
  const evalResult = evaluateStudentMatching({
    id: user.id,
    nama: user.nama,
    nim: user.nim,
    kelas: user.kelas,
    program_studi: user.program_studi,
    angkatan: user.angkatan,
    wa_number: user.wa_number,
  });

  res.json({
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      nama: user.nama,
      nim: user.nim,
      kelas: user.kelas,
      program_studi: user.program_studi,
      angkatan: user.angkatan,
      wa_number: user.wa_number,
      wa_display_name: user.wa_display_name,
      nickname: user.nickname,
      instagram: user.instagram,
      status: user.status,
      member_message: user.member_message,
      submit_count: user.submit_count,
      created_at: user.created_at,
      updated_at: user.updated_at,
      evaluation: {
        inOfficialList: evalResult.matching.inOfficialList,
        nimMatch: evalResult.matching.nimMatch,
        nameMatch: evalResult.matching.nameMatch,
        classMatch: evalResult.matching.classMatch,
        inRosterMatch: evalResult.matching.inRosterMatch,
      },
    },
  });
});

// Update / Complete profile
router.post('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = profileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({
        message: issues[0]?.message || 'Input profil tidak valid.',
        errors: issues,
      });
      return;
    }

    const user = Storage.findUserById(req.user!.id);
    if (!user || user.deleted) {
      res.status(404).json({ message: 'Data pengguna tidak ditemukan.' });
      return;
    }

    const {
      nama,
      nim,
      kelas,
      program_studi,
      angkatan,
      wa_number,
      wa_display_name,
      nickname,
      instagram,
      consent,
    } = parseResult.data;

    const cleanNim = nim.trim();
    const formattedWa = cleanPhone(wa_number);
    const cleanIg = instagram ? instagram.trim().replace(/^@/, '') : '';

    // Check duplicate NIM with other active accounts
    const otherNimUsers = Storage.findActiveUsersByNim(cleanNim).filter((u) => u.id !== user.id);
    const otherWaUsers = Storage.findActiveUsersByWa(formattedWa).filter((u) => u.id !== user.id);

    const submitCount = (user.submit_count || 0) + 1;

    // Run verification algorithm
    const evalResult = evaluateStudentMatching({
      id: user.id,
      nama,
      nim: cleanNim,
      kelas,
      program_studi,
      angkatan,
      wa_number: formattedWa,
    });

    let newStatus = evalResult.status;
    let autoNote = evalResult.autoNote;
    let autoMessage = evalResult.autoMessage;

    if (otherNimUsers.length > 0 || otherWaUsers.length > 0) {
      newStatus = 'DUPLICATE_REVIEW';
      autoNote += ' | Terdeteksi duplikat NIM atau No WhatsApp dengan akun lain.';
      autoMessage =
        'Data Anda terdeteksi memiliki kesamaan NIM atau WhatsApp dengan akun lain. Tim admin akan memverifikasi secara langsung.';
    }

    if (submitCount > 5) {
      autoNote += ' | [PERINGATAN] Akun telah melakukan submit profil lebih dari 5 kali.';
    }

    // Retain previous admin note if manual, or append
    const updatedAdminNote = user.admin_note
      ? `${user.admin_note} [Update otomatis: ${autoNote}]`
      : autoNote;

    const updated = await Storage.updateUser(user.id, {
      nama: nama.trim(),
      nim: cleanNim,
      kelas: kelas.trim(),
      program_studi: program_studi.trim() || 'Informatika',
      angkatan: angkatan.trim() || '2026',
      wa_number: formattedWa,
      wa_display_name: wa_display_name.trim(),
      nickname: (nickname || '').trim(),
      instagram: cleanIg,
      consent,
      submit_count: submitCount,
      // If was previously verified manually by admin, keep verified unless NIM changed
      status: user.status === 'VERIFIED' && user.nim === cleanNim ? 'VERIFIED' : newStatus,
      admin_note: updatedAdminNote,
      member_message: user.status === 'VERIFIED' ? user.member_message : autoMessage,
    });

    await Storage.addAuditLog({
      actor_id: user.id,
      actor_name: nama,
      actor_role: user.role,
      action: 'UPDATE_PROFILE',
      target_id: user.id,
      description: `Pembaruan profil oleh ${nama} (${cleanNim}). Status: ${updated?.status}. Submit ke-${submitCount}`,
    });

    res.json({
      message: 'Profil berhasil disimpan dan diperbarui.',
      user: {
        id: updated!.id,
        nama: updated!.nama,
        nim: updated!.nim,
        kelas: updated!.kelas,
        program_studi: updated!.program_studi,
        angkatan: updated!.angkatan,
        wa_number: updated!.wa_number,
        wa_display_name: updated!.wa_display_name,
        nickname: updated!.nickname,
        instagram: updated!.instagram,
        status: updated!.status,
        member_message: updated!.member_message,
        submit_count: updated!.submit_count,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan profil.' });
  }
});

export default router;
