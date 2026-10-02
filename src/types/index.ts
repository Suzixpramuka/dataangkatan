export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_CONFIRMATION'
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'DUPLICATE_REVIEW';

export interface User {
  id: string;
  role: Role;
  email: string;
  nama: string;
  nim: string;
  kelas?: string;
  program_studi?: string;
  angkatan?: string;
  wa_number?: string;
  wa_display_name?: string;
  nickname?: string;
  instagram?: string;
  status: VerificationStatus;
  admin_note?: string;
  member_message?: string;
  submit_count?: number;
  deleted?: boolean;
  deleted_reason?: string;
  created_at?: string;
  updated_at?: string;
  mustChangePassword?: boolean;
  needsProfileCompletion?: boolean;
}

export interface OfficialStudent {
  id: string;
  nama: string;
  nim: string;
  kelas: string;
  program_studi: string;
  angkatan: string;
  active: boolean;
  created_at: string;
}

export interface GroupRoster {
  id: string;
  wa_display_name: string;
  wa_number: string;
  nickname?: string;
  instagram?: string;
  linked_nim?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  target_id: string;
  timestamp: string;
  description: string;
}

export interface StatsData {
  totalMembers: number;
  verified: number;
  pending: number;
  needsConfirmation: number;
  notVerified: number;
  duplicateReview: number;
  totalOfficial: number;
  unregisteredCount: number;
  classDistribution: Record<string, number>;
  statusDistribution: {
    VERIFIED: number;
    PENDING: number;
    NEEDS_CONFIRMATION: number;
    NOT_VERIFIED: number;
    DUPLICATE_REVIEW: number;
  };
  deletedCount: number;
}

export interface MatchingEvaluation {
  status: VerificationStatus;
  matching: {
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
  };
  autoNote: string;
  autoMessage: string;
}

export interface MaskedCheckResult {
  id: string;
  namaMasked: string;
  nimMasked: string;
  kelas: string;
  programStudi: string;
  angkatan: string;
  waNumberMasked: string | null;
  waDisplayName: string | null;
  nickname: string | null;
  instagramMasked: string | null;
  statusPendaftaran: 'Sudah Terdaftar' | 'Belum Terdaftar';
  isRegistered: boolean;
}
