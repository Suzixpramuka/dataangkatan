import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import chokidar from 'chokidar';
import {
  UserRecord,
  OfficialStudentRecord,
  GroupRosterRecord,
  AuditLogRecord,
} from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backup');

const USERS_FILE = path.join(DATA_DIR, 'users.csv');
const OFFICIAL_FILE = path.join(DATA_DIR, 'official_students.csv');
const ROSTER_FILE = path.join(DATA_DIR, 'group_roster.csv');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.csv');

// In-memory cache
let usersCache: UserRecord[] = [];
let officialCache: OfficialStudentRecord[] = [];
let rosterCache: GroupRosterRecord[] = [];
let auditCache: AuditLogRecord[] = [];

// Write mutex queue to avoid race conditions
let writeQueue: Promise<void> = Promise.resolve();

// Flag to ignore watcher events triggered by our own writes
let isInternalWrite = false;

// SSE Listeners callback
type ChangeListener = (event: { type: string; payload?: unknown; timestamp: string }) => void;
const listeners: Set<ChangeListener> = new Set();

export function subscribeToChanges(listener: ChangeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastChange(type: string, payload?: unknown) {
  const event = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error('Error broadcasting change to client:', err);
    }
  }
}

// Formula Injection sanitizer: prepend ' if begins with =, +, -, @, \t, \r
export function sanitizeForCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// Remove prepended ' if it was an injection guard
export function desanitizeFromCsv(value: string | undefined): string {
  if (!value) return '';
  if (value.startsWith("'") && /^[=+\-@\t\r]/.test(value.slice(1))) {
    return value.slice(1);
  }
  return value;
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function writeCsvAtomic(filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    fs.writeFile(tempPath, content, 'utf8', (err) => {
      if (err) return reject(err);
      fs.rename(tempPath, filePath, (renameErr) => {
        if (renameErr) {
          try {
            fs.unlinkSync(tempPath);
          } catch {
            // ignore
          }
          return reject(renameErr);
        }
        resolve();
      });
    });
  });
}

function queueWrite(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    isInternalWrite = true;
    try {
      await fn();
    } finally {
      // release flag after short tick so chokidar ignores our own change
      setTimeout(() => {
        isInternalWrite = false;
      }, 300);
    }
  });
  return writeQueue;
}

export async function saveUsers(): Promise<void> {
  return queueWrite(async () => {
    const rows = usersCache.map((u) => ({
      id: sanitizeForCsv(u.id),
      role: sanitizeForCsv(u.role),
      email: sanitizeForCsv(u.email),
      password_hash: u.password_hash, // keep as is
      nama: sanitizeForCsv(u.nama),
      nim: sanitizeForCsv(u.nim),
      kelas: sanitizeForCsv(u.kelas),
      program_studi: sanitizeForCsv(u.program_studi),
      angkatan: sanitizeForCsv(u.angkatan),
      wa_number: sanitizeForCsv(u.wa_number),
      wa_display_name: sanitizeForCsv(u.wa_display_name),
      nickname: sanitizeForCsv(u.nickname),
      instagram: sanitizeForCsv(u.instagram),
      status: sanitizeForCsv(u.status),
      admin_note: sanitizeForCsv(u.admin_note),
      member_message: sanitizeForCsv(u.member_message),
      consent: u.consent ? 'true' : 'false',
      submit_count: String(u.submit_count || 0),
      deleted: u.deleted ? 'true' : 'false',
      deleted_reason: sanitizeForCsv(u.deleted_reason || ''),
      created_at: sanitizeForCsv(u.created_at),
      updated_at: sanitizeForCsv(u.updated_at),
    }));

    const csvOutput = stringify(rows, {
      header: true,
      columns: [
        'id', 'role', 'email', 'password_hash', 'nama', 'nim', 'kelas',
        'program_studi', 'angkatan', 'wa_number', 'wa_display_name',
        'nickname', 'instagram', 'status', 'admin_note', 'member_message',
        'consent', 'submit_count', 'deleted', 'deleted_reason', 'created_at', 'updated_at'
      ],
    });

    await writeCsvAtomic(USERS_FILE, csvOutput);
    broadcastChange('USERS_UPDATED');
  });
}

export async function saveOfficialStudents(): Promise<void> {
  return queueWrite(async () => {
    const rows = officialCache.map((o) => ({
      id: sanitizeForCsv(o.id),
      nama: sanitizeForCsv(o.nama),
      nim: sanitizeForCsv(o.nim),
      kelas: sanitizeForCsv(o.kelas),
      program_studi: sanitizeForCsv(o.program_studi),
      angkatan: sanitizeForCsv(o.angkatan),
      active: o.active ? 'true' : 'false',
      created_at: sanitizeForCsv(o.created_at),
    }));

    const csvOutput = stringify(rows, {
      header: true,
      columns: ['id', 'nama', 'nim', 'kelas', 'program_studi', 'angkatan', 'active', 'created_at'],
    });

    await writeCsvAtomic(OFFICIAL_FILE, csvOutput);
    broadcastChange('OFFICIAL_UPDATED');
  });
}

export async function saveGroupRoster(): Promise<void> {
  return queueWrite(async () => {
    const rows = rosterCache.map((r) => ({
      id: sanitizeForCsv(r.id),
      wa_display_name: sanitizeForCsv(r.wa_display_name),
      wa_number: sanitizeForCsv(r.wa_number),
      nickname: sanitizeForCsv(r.nickname),
      instagram: sanitizeForCsv(r.instagram),
      linked_nim: sanitizeForCsv(r.linked_nim),
      created_at: sanitizeForCsv(r.created_at),
    }));

    const csvOutput = stringify(rows, {
      header: true,
      columns: ['id', 'wa_display_name', 'wa_number', 'nickname', 'instagram', 'linked_nim', 'created_at'],
    });

    await writeCsvAtomic(ROSTER_FILE, csvOutput);
    broadcastChange('ROSTER_UPDATED');
  });
}

export async function saveAuditLogs(): Promise<void> {
  return queueWrite(async () => {
    const rows = auditCache.map((a) => ({
      id: sanitizeForCsv(a.id),
      actor_id: sanitizeForCsv(a.actor_id),
      action: sanitizeForCsv(a.action),
      target_id: sanitizeForCsv(a.target_id),
      timestamp: sanitizeForCsv(a.timestamp),
      description: sanitizeForCsv(a.description),
    }));

    const csvOutput = stringify(rows, {
      header: true,
      columns: ['id', 'actor_id', 'action', 'target_id', 'timestamp', 'description'],
    });

    await writeCsvAtomic(AUDIT_FILE, csvOutput);
    broadcastChange('AUDIT_UPDATED');
  });
}

export function loadAllFromDisk() {
  ensureDirectories();

  // Load Users
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as any[];
      usersCache = records.map((r: any) => ({
        id: desanitizeFromCsv(r.id),
        role: (desanitizeFromCsv(r.role) as UserRecord['role']) || 'MEMBER',
        email: desanitizeFromCsv(r.email),
        password_hash: r.password_hash || '',
        nama: desanitizeFromCsv(r.nama),
        nim: desanitizeFromCsv(r.nim),
        kelas: desanitizeFromCsv(r.kelas),
        program_studi: desanitizeFromCsv(r.program_studi) || 'Informatika',
        angkatan: desanitizeFromCsv(r.angkatan) || '2026',
        wa_number: desanitizeFromCsv(r.wa_number),
        wa_display_name: desanitizeFromCsv(r.wa_display_name),
        nickname: desanitizeFromCsv(r.nickname),
        instagram: desanitizeFromCsv(r.instagram),
        status: (desanitizeFromCsv(r.status) as UserRecord['status']) || 'PENDING',
        admin_note: desanitizeFromCsv(r.admin_note),
        member_message: desanitizeFromCsv(r.member_message),
        consent: r.consent === 'true',
        submit_count: parseInt(r.submit_count || '0', 10) || 0,
        deleted: r.deleted === 'true',
        deleted_reason: desanitizeFromCsv(r.deleted_reason),
        created_at: desanitizeFromCsv(r.created_at) || new Date().toISOString(),
        updated_at: desanitizeFromCsv(r.updated_at) || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Error parsing users.csv:', e);
    }
  }

  // Load Official Students
  if (fs.existsSync(OFFICIAL_FILE)) {
    try {
      const content = fs.readFileSync(OFFICIAL_FILE, 'utf8');
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as any[];
      officialCache = records.map((r: any) => ({
        id: desanitizeFromCsv(r.id),
        nama: desanitizeFromCsv(r.nama),
        nim: desanitizeFromCsv(r.nim),
        kelas: desanitizeFromCsv(r.kelas),
        program_studi: desanitizeFromCsv(r.program_studi) || 'Informatika',
        angkatan: desanitizeFromCsv(r.angkatan) || '2026',
        active: r.active !== 'false',
        created_at: desanitizeFromCsv(r.created_at) || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Error parsing official_students.csv:', e);
    }
  }

  // Load Group Roster
  if (fs.existsSync(ROSTER_FILE)) {
    try {
      const content = fs.readFileSync(ROSTER_FILE, 'utf8');
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as any[];
      rosterCache = records.map((r: any) => ({
        id: desanitizeFromCsv(r.id),
        wa_display_name: desanitizeFromCsv(r.wa_display_name),
        wa_number: desanitizeFromCsv(r.wa_number),
        nickname: desanitizeFromCsv(r.nickname),
        instagram: desanitizeFromCsv(r.instagram),
        linked_nim: desanitizeFromCsv(r.linked_nim),
        created_at: desanitizeFromCsv(r.created_at) || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Error parsing group_roster.csv:', e);
    }
  }

  // Load Audit Logs
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const content = fs.readFileSync(AUDIT_FILE, 'utf8');
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as any[];
      auditCache = records.map((r: any) => ({
        id: desanitizeFromCsv(r.id),
        actor_id: desanitizeFromCsv(r.actor_id),
        action: desanitizeFromCsv(r.action),
        target_id: desanitizeFromCsv(r.target_id),
        timestamp: desanitizeFromCsv(r.timestamp),
        description: desanitizeFromCsv(r.description),
      }));
    } catch (e) {
      console.error('Error parsing audit_logs.csv:', e);
    }
  }
}

// Automatic backup function
export function createBackup() {
  ensureDirectories();
  const dateStr = new Date().toISOString().slice(0, 10);
  const backupFolder = path.join(BACKUP_DIR, dateStr);
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  const files = [USERS_FILE, OFFICIAL_FILE, ROSTER_FILE, AUDIT_FILE];
  for (const f of files) {
    if (fs.existsSync(f)) {
      const filename = path.basename(f);
      fs.copyFileSync(f, path.join(backupFolder, filename));
    }
  }
  console.log(`[Backup] Automatic backup saved to ${backupFolder}`);
}

// Set up watcher with chokidar
export function initWatcher() {
  const watcher = chokidar.watch(path.join(DATA_DIR, '*.csv'), {
    ignored: /[\/\\]\./, // ignore dotfiles/tmp
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (changedPath) => {
    if (isInternalWrite) return;
    console.log(`[Watcher] External file change detected on: ${changedPath}`);
    loadAllFromDisk();
    broadcastChange('DISK_RELOAD');
  });

  // Schedule daily backup check (run every 12 hours)
  setInterval(() => {
    try {
      createBackup();
    } catch (err) {
      console.error('Backup error:', err);
    }
  }, 12 * 60 * 60 * 1000);
}

// Getters and Mutators for in-memory collections
export const Storage = {
  // Users
  getUsers: () => usersCache,
  findUserById: (id: string) => usersCache.find((u) => u.id === id),
  findUserByEmail: (email: string) =>
    usersCache.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findUserByNim: (nim: string) =>
    usersCache.find((u) => !u.deleted && u.nim.trim() === nim.trim()),
  findActiveUsersByNim: (nim: string) =>
    usersCache.filter((u) => !u.deleted && u.nim.trim() === nim.trim()),
  findActiveUsersByWa: (wa: string) => {
    const clean = wa.replace(/\D/g, '');
    if (!clean) return [];
    return usersCache.filter((u) => {
      if (u.deleted || !u.wa_number) return false;
      const uClean = u.wa_number.replace(/\D/g, '');
      return uClean === clean;
    });
  },
  addUser: async (user: UserRecord) => {
    usersCache.push(user);
    await saveUsers();
    return user;
  },
  updateUser: async (id: string, updates: Partial<UserRecord>) => {
    const idx = usersCache.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    usersCache[idx] = {
      ...usersCache[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await saveUsers();
    return usersCache[idx];
  },
  softDeleteUser: async (id: string, reason: string) => {
    const idx = usersCache.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    usersCache[idx].deleted = true;
    usersCache[idx].deleted_reason = reason;
    usersCache[idx].updated_at = new Date().toISOString();
    await saveUsers();
    return usersCache[idx];
  },
  restoreUser: async (id: string) => {
    const idx = usersCache.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    usersCache[idx].deleted = false;
    usersCache[idx].deleted_reason = '';
    usersCache[idx].updated_at = new Date().toISOString();
    await saveUsers();
    return usersCache[idx];
  },

  // Official Students
  getOfficialStudents: () => officialCache,
  findOfficialByNim: (nim: string) =>
    officialCache.find((o) => o.active && o.nim.trim() === nim.trim()),
  addOfficialStudent: async (student: OfficialStudentRecord) => {
    officialCache.push(student);
    await saveOfficialStudents();
    return student;
  },
  addOfficialStudentsBulk: async (students: OfficialStudentRecord[]) => {
    officialCache.push(...students);
    await saveOfficialStudents();
    return students;
  },
  updateOfficialStudent: async (id: string, updates: Partial<OfficialStudentRecord>) => {
    const idx = officialCache.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    officialCache[idx] = { ...officialCache[idx], ...updates };
    await saveOfficialStudents();
    return officialCache[idx];
  },
  deleteOfficialStudent: async (id: string) => {
    const idx = officialCache.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    officialCache.splice(idx, 1);
    await saveOfficialStudents();
    return true;
  },

  // Group Roster
  getGroupRoster: () => rosterCache,
  findRosterByWa: (wa: string) => {
    const clean = wa.replace(/\D/g, '');
    if (!clean) return undefined;
    return rosterCache.find((r) => r.wa_number.replace(/\D/g, '') === clean);
  },
  addRosterEntry: async (entry: GroupRosterRecord) => {
    rosterCache.push(entry);
    await saveGroupRoster();
    return entry;
  },
  addRosterBulk: async (entries: GroupRosterRecord[]) => {
    rosterCache.push(...entries);
    await saveGroupRoster();
    return entries;
  },
  deleteRosterEntry: async (id: string) => {
    const idx = rosterCache.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rosterCache.splice(idx, 1);
    await saveGroupRoster();
    return true;
  },

  // Audit Logs
  getAuditLogs: () => auditCache,
  addAuditLog: async (log: Omit<AuditLogRecord, 'id' | 'timestamp'>) => {
    const record: AuditLogRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    auditCache.unshift(record);
    // Keep max 20,000 logs in memory/disk
    if (auditCache.length > 20000) {
      auditCache = auditCache.slice(0, 20000);
    }
    await saveAuditLogs();
    return record;
  },
};
