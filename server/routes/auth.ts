import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Storage } from '../storage.ts';
import { UserRecord } from '../types.ts';
import { generateToken, AuthenticatedRequest, authenticateToken } from '../middleware/auth.ts';
import { authLimiter } from '../middleware/rateLimiter.ts';
import { evaluateStudentMatching, normalizeText, NIM_REGEX } from '../verification.ts';

const router = Router();

// Zod schemas
const registerSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  nim: z.string().regex(/^\d{10}$/, 'NIM harus tepat 10 digit angka'),
  email: z.string().optional(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui kebijakan privasi dan penggunaan data.',
  }),
  forceConfirmDuplicate: z.boolean().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'NIM atau username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

// Register Mahasiswa
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({
        message: issues[0]?.message || 'Input data tidak valid.',
        errors: issues,
      });
      return;
    }

    const { nama, nim, password, forceConfirmDuplicate } = parseResult.data;
    const cleanNim = nim.trim();
    const cleanEmail = parseResult.data.email?.trim().toLowerCase() || `${cleanNim}@student.untirta.ac.id`;

    // Check email uniqueness if explicitly provided
    if (parseResult.data.email) {
      const existingEmail = Storage.findUserByEmail(cleanEmail);
      if (existingEmail && !existingEmail.deleted) {
        res.status(400).json({ message: 'Email sudah terdaftar. Silakan langsung login.' });
        return;
      }
    }

    // NIM validation rules
    const isValidNimFormat = NIM_REGEX.test(cleanNim);

    // Duplicate NIM check
    const existingNimUsers = Storage.findActiveUsersByNim(cleanNim);
    if (existingNimUsers.length > 0) {
      // Check if both NIM and exact normalized name match
      const normInputName = normalizeText(nama);
      const isIdenticalNameAndNim = existingNimUsers.some(
        (u) => normalizeText(u.nama) === normInputName
      );

      if (isIdenticalNameAndNim) {
        res.status(400).json({
          message:
            'Data pendaftaran dengan NIM dan Nama yang persis sama sudah ada di sistem. Silakan login ke akun Anda atau hubungi admin.',
          isDuplicateIdentical: true,
        });
        return;
      }

      if (!forceConfirmDuplicate) {
        res.status(409).json({
          message:
            'NIM ini sudah digunakan oleh akun lain. Jika ini NIM kamu, kamu bisa melanjutkan untuk mengirim laporan duplikat ke admin.',
          requiresDuplicateConfirm: true,
          conflictNim: cleanNim,
        });
        return;
      }
    }

    // Evaluate against official students list
    const evalResult = evaluateStudentMatching({
      nama,
      nim: cleanNim,
      angkatan: '2026',
      program_studi: 'Informatika',
    });

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      role: 'MEMBER',
      email: cleanEmail,
      password_hash: passwordHash,
      nama: nama.trim(),
      nim: cleanNim,
      kelas: '',
      program_studi: 'Informatika',
      angkatan: '2026',
      wa_number: '',
      wa_display_name: '',
      nickname: '',
      instagram: '',
      status: evalResult.status === 'VERIFIED' ? 'PENDING' : evalResult.status, // start pending until complete profile
      admin_note: evalResult.autoNote,
      member_message: evalResult.autoMessage,
      consent: true,
      submit_count: 0,
      deleted: false,
      deleted_reason: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If duplicate was confirmed, mark both as DUPLICATE_REVIEW
    if (existingNimUsers.length > 0) {
      newUser.status = 'DUPLICATE_REVIEW';
      newUser.admin_note += ' | Mendaftar dengan NIM yang sudah ada (Konfirmasi Duplikat).';
      for (const otherUser of existingNimUsers) {
        await Storage.updateUser(otherUser.id, {
          status: 'DUPLICATE_REVIEW',
          admin_note: `${otherUser.admin_note} | Terdeteksi duplikat dengan akun baru ID ${newUser.id}`.trim(),
        });
      }
    }

    await Storage.addUser(newUser);

    await Storage.addAuditLog({
      actor_id: newUser.id,
      actor_name: newUser.nama,
      actor_role: newUser.role,
      action: 'REGISTER_STUDENT',
      target_id: newUser.id,
      description: `Pendaftaran mahasiswa baru: ${newUser.nama} (${newUser.nim}). Status: ${newUser.status}`,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      nama: newUser.nama,
      nim: newUser.nim,
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Pendaftaran berhasil.',
      token,
      user: {
        id: newUser.id,
        role: newUser.role,
        email: newUser.email,
        nama: newUser.nama,
        nim: newUser.nim,
        status: newUser.status,
        kelas: newUser.kelas,
        needsProfileCompletion: true,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat pendaftaran.' });
  }
});

// Login Mahasiswa
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'NIM dan password wajib diisi.' });
      return;
    }

    const { identifier, password } = parseResult.data;
    const cleanId = identifier.trim().toLowerCase();

    // Allow login by exact NIM (or email if admin/legacy)
    const user = Storage.getUsers().find(
      (u) =>
        !u.deleted &&
        (u.nim.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId ||
          (cleanId === 'admin' && u.email === 'admin@untirta.ac.id'))
    );

    if (!user) {
      res.status(401).json({ message: 'NIM atau password salah.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'NIM atau password salah.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
      nim: user.nim,
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await Storage.addAuditLog({
      actor_id: user.id,
      actor_name: user.nama,
      actor_role: user.role,
      action: 'LOGIN_MEMBER',
      target_id: user.id,
      description: `Login anggota: ${user.nama}`,
    });

    res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        nama: user.nama,
        nim: user.nim,
        status: user.status,
        kelas: user.kelas,
        mustChangePassword: user.must_change_password || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// Login Admin (Khusus ADMIN dan SUPER_ADMIN)
router.post('/admin-login', authLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Input username/email dan password tidak lengkap.' });
      return;
    }

    const { identifier, password } = parseResult.data;
    const cleanId = identifier.trim().toLowerCase();

    const user = Storage.getUsers().find(
      (u) =>
        !u.deleted &&
        (u.email.toLowerCase() === cleanId ||
          u.nim.toLowerCase() === cleanId ||
          (cleanId === 'admin' && (u.email === 'admin@untirta.ac.id' || u.role === 'SUPER_ADMIN')))
    );

    if (!user) {
      res.status(401).json({ message: 'Kredensial admin tidak valid.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        message: 'Akses ditolak. Halaman ini khusus untuk Administrator Informatika IF26.',
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'Kredensial admin tidak valid.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
      nim: user.nim,
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await Storage.addAuditLog({
      actor_id: user.id,
      actor_name: user.nama,
      actor_role: user.role,
      action: 'LOGIN_ADMIN',
      target_id: user.id,
      description: `Login admin (${user.role}): ${user.nama}`,
    });

    res.json({
      message: 'Login Admin berhasil.',
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        nama: user.nama,
        nim: user.nim,
        status: user.status,
        mustChangePassword: user.must_change_password || false,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login admin.' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout berhasil.' });
});

// Get current session
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = Storage.findUserById(req.user!.id);
  if (!user || user.deleted) {
    res.status(401).json({ message: 'Sesi tidak valid.' });
    return;
  }

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
      mustChangePassword: user.must_change_password || false,
      submit_count: user.submit_count,
    },
  });
});

// Change Password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || [];
      res.status(400).json({ message: issues[0]?.message || 'Input tidak valid.' });
      return;
    }

    const { oldPassword, newPassword } = parseResult.data;
    const user = Storage.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      return;
    }

    // If not first-time forced change, verify old password
    if (!user.must_change_password) {
      if (!oldPassword) {
        res.status(400).json({ message: 'Password lama wajib diisi.' });
        return;
      }
      const isOldMatch = bcrypt.compareSync(oldPassword, user.password_hash);
      if (!isOldMatch) {
        res.status(400).json({ message: 'Password lama tidak sesuai.' });
        return;
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await Storage.updateUser(user.id, {
      password_hash: newHash,
      must_change_password: false,
    });

    await Storage.addAuditLog({
      actor_id: user.id,
      actor_name: user.nama,
      actor_role: user.role,
      action: 'CHANGE_PASSWORD',
      target_id: user.id,
      description: `Perubahan kata sandi berhasil untuk akun: ${user.nama}`,
    });

    res.json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Gagal memperbarui kata sandi.' });
  }
});

export default router;
