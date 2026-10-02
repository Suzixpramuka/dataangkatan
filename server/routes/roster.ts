import { Router, Response } from 'express';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { Storage } from '../storage.ts';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.ts';
import { GroupRosterRecord } from '../types.ts';
import { cleanPhone } from '../verification.ts';

const router = Router();
router.use(requireAdmin);

const rosterSchema = z.object({
  wa_display_name: z.string().min(1, 'Nama di grup wajib diisi'),
  wa_number: z.string().min(8, 'Nomor WhatsApp wajib diisi'),
  nickname: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  linked_nim: z.string().optional().default(''),
});

// List roster
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  let list = Storage.getGroupRoster();

  if (search) {
    list = list.filter(
      (r) =>
        r.wa_display_name.toLowerCase().includes(search) ||
        r.wa_number.includes(search) ||
        r.nickname.toLowerCase().includes(search) ||
        r.linked_nim.includes(search)
    );
  }

  res.json({ total: list.length, roster: list });
});

// Add roster entry
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = rosterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({ message: issues[0]?.message || 'Input tidak valid.' });
      return;
    }

    const { wa_display_name, wa_number, nickname, instagram, linked_nim } = parseResult.data;
    const formattedWa = cleanPhone(wa_number);

    const newEntry: GroupRosterRecord = {
      id: `rst_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      wa_display_name: wa_display_name.trim(),
      wa_number: formattedWa,
      nickname: (nickname || '').trim(),
      instagram: (instagram || '').trim().replace(/^@/, ''),
      linked_nim: (linked_nim || '').trim(),
      created_at: new Date().toISOString(),
    };

    await Storage.addRosterEntry(newEntry);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'ADD_ROSTER_ENTRY',
      target_id: newEntry.id,
      description: `Menambahkan anggota grup WhatsApp: ${newEntry.wa_display_name} (${newEntry.wa_number})`,
    });

    res.status(201).json({ message: 'Data grup berhasil ditambahkan.', entry: newEntry });
  } catch (error) {
    console.error('Add roster error:', error);
    res.status(500).json({ message: 'Gagal menambahkan anggota grup.' });
  }
});

// Delete roster entry
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = Storage.getGroupRoster().find((r) => r.id === req.params.id);
    if (!entry) {
      res.status(404).json({ message: 'Data tidak ditemukan.' });
      return;
    }

    await Storage.deleteRosterEntry(req.params.id);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'DELETE_ROSTER_ENTRY',
      target_id: req.params.id,
      description: `Menghapus data anggota grup WhatsApp: ${entry.wa_display_name}`,
    });

    res.json({ message: 'Data anggota grup berhasil dihapus.' });
  } catch (error) {
    console.error('Delete roster error:', error);
    res.status(500).json({ message: 'Gagal menghapus data grup.' });
  }
});

// Import Roster CSV
router.post('/import', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      res.status(400).json({ message: 'Konten CSV tidak boleh kosong.' });
      return;
    }

    const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    const toInsert: GroupRosterRecord[] = [];
    const now = new Date().toISOString();

    for (const r of records as Record<string, string>[]) {
      const waName = r.nama_di_grup || r.wa_display_name || r.name || '';
      const waNumber = cleanPhone(r.no_wa || r.wa_number || r.phone || '');
      if (!waName || !waNumber) continue;

      toInsert.push({
        id: `rst_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        wa_display_name: waName.trim(),
        wa_number: waNumber,
        nickname: (r.nama_panggilan || r.nickname || '').trim(),
        instagram: (r.instagram || '').trim().replace(/^@/, ''),
        linked_nim: (r.linked_nim || r.nim || '').trim(),
        created_at: now,
      });
    }

    await Storage.addRosterBulk(toInsert);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'IMPORT_ROSTER',
      target_id: `COUNT_${toInsert.length}`,
      description: `Mengimpor ${toInsert.length} data anggota grup WhatsApp dari CSV.`,
    });

    res.json({ message: `Berhasil mengimpor ${toInsert.length} data grup WhatsApp.`, count: toInsert.length });
  } catch (error) {
    console.error('Import roster error:', error);
    res.status(500).json({ message: 'Gagal mengimpor data grup.' });
  }
});

export default router;
