export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_CONFIRMATION'
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'DUPLICATE_REVIEW';

export interface UserRecord {
  id: string;
  role: Role;
  email: string;
  password_hash: string;
  nama: string;
  nim: string;
  kelas: string;
  program_studi: string;
  angkatan: string;
  wa_number: string;
  wa_display_name: string;
  nickname: string;
  instagram: string;
  status: VerificationStatus;
  admin_note: string;
  member_message: string;
  consent: boolean;
  submit_count: number;
  deleted: boolean;
  deleted_reason: string;
  created_at: string;
  updated_at: string;
  must_change_password?: boolean;
}

export interface OfficialStudentRecord {
  id: string;
  nama: string;
  nim: string;
  kelas: string;
  program_studi: string;
  angkatan: string;
  active: boolean;
  created_at: string;
}

export interface GroupRosterRecord {
  id: string;
  wa_display_name: string;
  wa_number: string;
  nickname: string;
  instagram: string;
  linked_nim: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  target_id: string;
  timestamp: string;
  description: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  nama: string;
  nim: string;
}

export interface MatchingResult {
  inOfficialList: boolean;
  nimMatch: boolean;
  nameMatch: boolean;
  classMatch: boolean;
  prodiMatch: boolean;
  angkatanMatch: boolean;
  inRosterMatch: boolean;
  duplicateNimCount: number;
  duplicateWaCount: number;
  notes: string[];
}
