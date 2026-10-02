import { Router, Response } from 'express';
import { z } from 'zod';
import { Storage } from '../storage.ts';
import { AuthenticatedRequest, requireSuperAdmin } from '../middleware/auth.ts';

const router = Router();

// Strictly enforce Super Admin only at backend level (HTTP 403 for ordinary admins)
router.use(requireSuperAdmin);

// List all current Admins & Super Admins
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const admins = Storage.getUsers()
    .filter((u) => !u.deleted && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'))
    .map((u) => ({
      id: u.id,
      role: u.role,
      nama: u.nama,
      nim: u.nim,
      email: u.email,
      kelas: u.kelas,
      wa_number: u.wa_number,
      created_at: u.created_at,
    }));

  res.json({ admins });
});

// Search candidate members to promote
router.get('/search-candidates', (req: AuthenticatedRequest, res: Response) => {
  const search = ((req.query.q as string) || '').trim().toLowerCase();
  if (search.length < 2) {
    res.json({ candidates: [] });
    return;
  }

  const candidates = Storage.getUsers()
    .filter(
      (u) =>
        !u.deleted &&
        u.role === 'MEMBER' &&
        (u.nama.toLowerCase().includes(search) ||
          u.nim.includes(search) ||
          u.email.toLowerCase().includes(search))
    )
    .slice(0, 15)
    .map((u) => ({
      id: u.id,
      nama: u.nama,
      nim: u.nim,
      email: u.email,
      kelas: u.kelas,
      status: u.status,
    }));

  res.json({ candidates });
});

// Promote member to ADMIN
const targetSchema = z.object({
  userId: z.string().min(1, 'ID Pengguna wajib diisi'),
});

router.post('/promote', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = targetSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'ID Pengguna tidak valid.' });
      return;
    }

    const { userId } = parseResult.data;
    const targetUser = Storage.findUserById(userId);

    if (!targetUser || targetUser.deleted) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(400).json({ message: 'Pengguna ini sudah merupakan Super Admin.' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(400).json({ message: 'Pengguna ini sudah menjadi Admin.' });
      return;
    }

    await Storage.updateUser(targetUser.id, {
      role: 'ADMIN',
    });

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'PROMOTE_TO_ADMIN',
      target_id: targetUser.id,
      description: `Promosi role mahasiswa ${targetUser.nama} (${targetUser.nim}) menjadi ADMIN oleh Super Admin.`,
    });

    res.json({
      message: `Berhasil mengangkat ${targetUser.nama} sebagai Admin.`,
      user: { id: targetUser.id, nama: targetUser.nama, role: 'ADMIN' },
    });
  } catch (error) {
    console.error('Promote error:', error);
    res.status(500).json({ message: 'Gagal melakukan promosi admin.' });
  }
});

// Demote ADMIN to MEMBER
router.post('/demote', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = targetSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'ID Pengguna tidak valid.' });
      return;
    }

    const { userId } = parseResult.data;
    const targetUser = Storage.findUserById(userId);

    if (!targetUser || targetUser.deleted) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Super Admin tidak dapat dicabut hak aksesnya.' });
      return;
    }

    if (targetUser.role !== 'ADMIN') {
      res.status(400).json({ message: 'Pengguna ini bukan Admin.' });
      return;
    }

    await Storage.updateUser(targetUser.id, {
      role: 'MEMBER',
    });

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'REVOKE_ADMIN',
      target_id: targetUser.id,
      description: `Mencabut hak admin ${targetUser.nama} (${targetUser.nim}) kembali menjadi MEMBER.`,
    });

    res.json({
      message: `Hak admin untuk ${targetUser.nama} berhasil dicabut menjadi Member.`,
      user: { id: targetUser.id, nama: targetUser.nama, role: 'MEMBER' },
    });
  } catch (error) {
    console.error('Demote error:', error);
    res.status(500).json({ message: 'Gagal mencabut hak akses admin.' });
  }
});

export default router;
