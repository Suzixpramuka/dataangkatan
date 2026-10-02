import { Router, Response } from 'express';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { Storage } from '../storage.ts';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.ts';
import { OfficialStudentRecord } from '../types.ts';
import { NIM_REGEX } from '../verification.ts';

const router = Router();
router.use(requireAdmin);

const studentSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  nim: z.string().regex(/^\d{10}$/, 'NIM harus 10 digit angka'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  program_studi: z.string().default('Informatika'),
  angkatan: z.string().default('2026'),
  active: z.boolean().default(true),
});

// List official students
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const kelas = (req.query.kelas as string) || 'ALL';

  let list = Storage.getOfficialStudents();
  if (kelas !== 'ALL') {
    list = list.filter((s) => (s.kelas || '').toUpperCase() === kelas.toUpperCase());
  }
  if (search) {
    list = list.filter((s) => s.nama.toLowerCase().includes(search) || s.nim.includes(search));
  }

  res.json({
    total: list.length,
    students: list,
  });
});

// Add single official student
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = studentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({ message: issues[0]?.message || 'Input tidak valid.' });
      return;
    }

    const { nama, nim, kelas, program_studi, angkatan, active } = parseResult.data;
    const cleanNim = nim.trim();

    const existing = Storage.findOfficialByNim(cleanNim);
    if (existing) {
      res.status(400).json({ message: `NIM ${cleanNim} sudah ada dalam data resmi (${existing.nama}).` });
      return;
    }

    const newStudent: OfficialStudentRecord = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      nama: nama.trim(),
      nim: cleanNim,
      kelas: kelas.trim().toUpperCase(),
      program_studi: program_studi.trim() || 'Informatika',
      angkatan: angkatan.trim() || '2026',
      active,
      created_at: new Date().toISOString(),
    };

    await Storage.addOfficialStudent(newStudent);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'ADD_OFFICIAL_STUDENT',
      target_id: newStudent.id,
      description: `Menambahkan data resmi mahasiswa: ${newStudent.nama} (${newStudent.nim})`,
    });

    res.status(201).json({
      message: 'Mahasiswa resmi berhasil ditambahkan.',
      student: newStudent,
    });
  } catch (error) {
    console.error('Add official student error:', error);
    res.status(500).json({ message: 'Gagal menambahkan data resmi mahasiswa.' });
  }
});

// Update official student
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = studentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({ message: issues[0]?.message || 'Input tidak valid.' });
      return;
    }

    const { nama, nim, kelas, program_studi, angkatan, active } = parseResult.data;
    const existing = Storage.getOfficialStudents().find((s) => s.id === req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Data mahasiswa resmi tidak ditemukan.' });
      return;
    }

    const updated = await Storage.updateOfficialStudent(req.params.id, {
      nama: nama.trim(),
      nim: nim.trim(),
      kelas: kelas.trim().toUpperCase(),
      program_studi: program_studi.trim(),
      angkatan: angkatan.trim(),
      active,
    });

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'UPDATE_OFFICIAL_STUDENT',
      target_id: req.params.id,
      description: `Memperbarui data resmi mahasiswa: ${nama} (${nim})`,
    });

    res.json({ message: 'Data resmi berhasil diperbarui.', student: updated });
  } catch (error) {
    console.error('Update official student error:', error);
    res.status(500).json({ message: 'Gagal memperbarui data resmi.' });
  }
});

// Delete official student
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = Storage.getOfficialStudents().find((s) => s.id === req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Data tidak ditemukan.' });
      return;
    }

    await Storage.deleteOfficialStudent(req.params.id);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'DELETE_OFFICIAL_STUDENT',
      target_id: req.params.id,
      description: `Menghapus data resmi mahasiswa: ${student.nama} (${student.nim})`,
    });

    res.json({ message: 'Data resmi berhasil dihapus.' });
  } catch (error) {
    console.error('Delete official student error:', error);
    res.status(500).json({ message: 'Gagal menghapus data resmi.' });
  }
});

// Import Preview
router.post('/import/preview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ message: 'Konten CSV tidak boleh kosong.' });
      return;
    }

    let records: Record<string, string>[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      res.status(400).json({ message: 'Gagal membaca format CSV. Pastikan baris header sesuai.' });
      return;
    }

    const existingNims = new Set(Storage.getOfficialStudents().map((o) => o.nim.trim()));
    const seenFileNims = new Set<string>();

    const validRows: Array<{
      nama: string;
      nim: string;
      kelas: string;
      program_studi: string;
      angkatan: string;
    }> = [];

    const duplicateRows: Array<{
      row: number;
      nim: string;
      nama: string;
      reason: string;
    }> = [];

    const errorRows: Array<{
      row: number;
      data: Record<string, string>;
      reason: string;
    }> = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // considering 1-indexed and header
      const nama = row.nama || row.Nama || row['nama lengkap'] || '';
      const nim = (row.nim || row.NIM || '').replace(/\D/g, '');
      const kelas = row.kelas || row.Kelas || 'A26';
      const prodi = row.program_studi || row['Program Studi'] || row.prodi || 'Informatika';
      const angkatan = row.angkatan || row.Angkatan || '2026';

      if (!nama || !nim) {
        errorRows.push({
          row: rowNum,
          data: row,
          reason: 'Nama dan NIM wajib diisi',
        });
        return;
      }

      if (nim.length !== 10) {
        errorRows.push({
          row: rowNum,
          data: row,
          reason: `NIM harus 10 digit (ditemukan: ${nim.length} digit)`,
        });
        return;
      }

      if (!NIM_REGEX.test(nim)) {
        // Warning pattern
        // still can be listed or marked
      }

      if (seenFileNims.has(nim)) {
        duplicateRows.push({
          row: rowNum,
          nim,
          nama,
          reason: 'NIM duplikat di dalam file yang diunggah',
        });
        return;
      }

      if (existingNims.has(nim)) {
        duplicateRows.push({
          row: rowNum,
          nim,
          nama,
          reason: 'NIM sudah ada di database data resmi',
        });
        return;
      }

      seenFileNims.add(nim);
      validRows.push({
        nama: nama.trim(),
        nim,
        kelas: kelas.trim().toUpperCase(),
        program_studi: prodi.trim(),
        angkatan: angkatan.trim(),
      });
    });

    res.json({
      summary: {
        totalRows: records.length,
        validCount: validRows.length,
        duplicateCount: duplicateRows.length,
        errorCount: errorRows.length,
      },
      validRows,
      duplicateRows,
      errorRows,
    });
  } catch (error) {
    console.error('Import preview error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses preview import.' });
  }
});

// Import Confirm
router.post('/import/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ message: 'Daftar mahasiswa yang akan diimport kosong.' });
      return;
    }

    const recordsToInsert: OfficialStudentRecord[] = [];
    const now = new Date().toISOString();

    for (const s of students) {
      if (!s.nama || !s.nim) continue;
      recordsToInsert.push({
        id: `off_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        nama: s.nama.trim(),
        nim: s.nim.trim(),
        kelas: (s.kelas || 'A26').trim().toUpperCase(),
        program_studi: (s.program_studi || 'Informatika').trim(),
        angkatan: (s.angkatan || '2026').trim(),
        active: true,
        created_at: now,
      });
    }

    await Storage.addOfficialStudentsBulk(recordsToInsert);

    await Storage.addAuditLog({
      actor_id: req.user!.id,
      actor_name: req.user!.nama,
      actor_role: req.user!.role,
      action: 'IMPORT_OFFICIAL_STUDENTS',
      target_id: `COUNT_${recordsToInsert.length}`,
      description: `Mengimpor ${recordsToInsert.length} data resmi mahasiswa Informatika angkatan 2026 dari CSV.`,
    });

    res.json({
      message: `Berhasil mengimpor ${recordsToInsert.length} data mahasiswa resmi.`,
      count: recordsToInsert.length,
    });
  } catch (error) {
    console.error('Import confirm error:', error);
    res.status(500).json({ message: 'Gagal mengimpor data.' });
  }
});

// Download CSV template
router.get('/template', (req: AuthenticatedRequest, res: Response) => {
  const sampleCsv = `nama,nim,kelas,program_studi,angkatan
Mahasiswa Contoh Satu,3337260001,A26,Informatika,2026
Mahasiswa Contoh Dua,3337260002,A26,Informatika,2026
Mahasiswa Contoh Tiga,3337260003,B26,Informatika,2026
Mahasiswa Contoh Empat,3337260004,C26,Informatika,2026`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="template_mahasiswa_resmi_if26.csv"');
  res.send('\uFEFF' + sampleCsv);
});

export default router;
