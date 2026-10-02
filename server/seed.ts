import bcrypt from 'bcryptjs';
import { Storage } from './storage.ts';
import { UserRecord, OfficialStudentRecord, GroupRosterRecord } from './types.ts';

export async function seedInitialData() {
  const users = Storage.getUsers();
  const superAdmin = users.find((u) => u.role === 'SUPER_ADMIN' && !u.deleted);

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'IF26GOO';

  if (!superAdmin) {
    console.log('[Seed] Seeding initial Super Admin (username/email: admin@untirta.ac.id or admin)...');
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);

    const adminUser: UserRecord = {
      id: 'usr_super_admin_001',
      role: 'SUPER_ADMIN',
      email: 'admin@untirta.ac.id',
      password_hash: hash,
      nama: 'Super Administrator IF26',
      nim: '3337260000',
      kelas: 'A26',
      program_studi: 'Informatika',
      angkatan: '2026',
      wa_number: '081234567890',
      wa_display_name: 'Admin Utama IF26',
      nickname: 'Admin IF26',
      instagram: 'himatif_untirta',
      status: 'VERIFIED',
      admin_note: 'Akun Super Admin sistem otomatis diinisiasi.',
      member_message: 'Akun Administrator Utama Sistem.',
      consent: true,
      submit_count: 1,
      deleted: false,
      deleted_reason: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      must_change_password: true,
    };

    await Storage.addUser(adminUser);
    await Storage.addAuditLog({
      actor_id: 'SYSTEM',
      action: 'INIT_SUPER_ADMIN',
      target_id: adminUser.id,
      description: 'Super Admin akun diinisiasi otomatis dengan default password.',
    });
  }

  // Seed sample official students if empty
  const official = Storage.getOfficialStudents();
  if (official.length === 0) {
    console.log('[Seed] Seeding initial sample official students...');
    const sampleOfficial: OfficialStudentRecord[] = [
      {
        id: 'off_001',
        nama: 'Mahasiswa Contoh A',
        nim: '3337260001',
        kelas: 'A26',
        program_studi: 'Informatika',
        angkatan: '2026',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'off_002',
        nama: 'Mahasiswa Contoh B',
        nim: '3337260002',
        kelas: 'B26',
        program_studi: 'Informatika',
        angkatan: '2026',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'off_003',
        nama: 'Mahasiswa Contoh C',
        nim: '3337260003',
        kelas: 'C26',
        program_studi: 'Informatika',
        angkatan: '2026',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'off_004',
        nama: 'Mahasiswa Contoh D',
        nim: '3337260004',
        kelas: 'D26',
        program_studi: 'Informatika',
        angkatan: '2026',
        active: true,
        created_at: new Date().toISOString(),
      },
    ];

    await Storage.addOfficialStudentsBulk(sampleOfficial);
    await Storage.addAuditLog({
      actor_id: 'SYSTEM',
      action: 'SEED_OFFICIAL_STUDENTS',
      target_id: 'OFFICIAL_DATA',
      description: 'Menambahkan data awal daftar mahasiswa resmi Informatika 2026 (Samaran Contoh).',
    });
  }

  // Seed sample group roster if empty
  const roster = Storage.getGroupRoster();
  if (roster.length === 0) {
    console.log('[Seed] Seeding initial sample WhatsApp group roster...');
    const sampleRoster: GroupRosterRecord[] = [
      {
        id: 'rst_001',
        wa_display_name: 'Mahasiswa A (A26)',
        wa_number: '081200000001',
        nickname: 'Mahasiswa A',
        instagram: 'mhs_contoh_a',
        linked_nim: '3337260001',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rst_002',
        wa_display_name: 'Mahasiswa B (B26)',
        wa_number: '081200000002',
        nickname: 'Mahasiswa B',
        instagram: 'mhs_contoh_b',
        linked_nim: '3337260002',
        created_at: new Date().toISOString(),
      },
    ];
    await Storage.addRosterBulk(sampleRoster);
  }
}
