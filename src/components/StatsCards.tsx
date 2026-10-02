import React from 'react';
import { StatsData, VerificationStatus } from '../types/index.ts';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Copy,
  UserX,
} from 'lucide-react';

interface Props {
  stats: StatsData | null;
  activeStatusFilter: string;
  onFilterChange: (status: string) => void;
  onOpenUnregisteredTab?: () => void;
  onOpenDuplicatesTab?: () => void;
}

export const StatsCards: React.FC<Props> = ({
  stats,
  activeStatusFilter,
  onFilterChange,
  onOpenUnregisteredTab,
  onOpenDuplicatesTab,
}) => {
  if (!stats) return null;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Terdata',
      count: stats.totalMembers,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/70',
      border: 'border-blue-200',
      badge: 'Mahasiswa',
      action: () => onFilterChange('ALL'),
      isActive: activeStatusFilter === 'ALL',
    },
    {
      id: 'VERIFIED',
      title: 'Terverifikasi',
      count: stats.verified,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      badge: 'Resmi IF26',
      action: () => onFilterChange('VERIFIED'),
      isActive: activeStatusFilter === 'VERIFIED',
    },
    {
      id: 'PENDING',
      title: 'Menunggu Review',
      count: stats.pending,
      icon: <Clock className="w-5 h-5 text-slate-600" />,
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      badge: 'Perlu Cek',
      action: () => onFilterChange('PENDING'),
      isActive: activeStatusFilter === 'PENDING',
    },
    {
      id: 'NEEDS_CONFIRMATION',
      title: 'Perlu Konfirmasi',
      count: stats.needsConfirmation,
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      badge: 'Data Berbeda',
      action: () => onFilterChange('NEEDS_CONFIRMATION'),
      isActive: activeStatusFilter === 'NEEDS_CONFIRMATION',
    },
    {
      id: 'DUPLICATE_REVIEW',
      title: 'Tinjau Duplikat',
      count: stats.duplicateReview,
      icon: <Copy className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/70',
      border: 'border-purple-200',
      badge: 'NIM/WA Sama',
      action: onOpenDuplicatesTab || (() => onFilterChange('DUPLICATE_REVIEW')),
      isActive: activeStatusFilter === 'DUPLICATE_REVIEW',
    },
    {
      id: 'NOT_VERIFIED',
      title: 'Belum Terverifikasi',
      count: stats.notVerified,
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50/70',
      border: 'border-rose-200',
      badge: 'Ditolak/Anomali',
      action: () => onFilterChange('NOT_VERIFIED'),
      isActive: activeStatusFilter === 'NOT_VERIFIED',
    },
    {
      id: 'UNREGISTERED',
      title: 'Belum Mendaftar',
      count: stats.unregisteredCount,
      icon: <UserX className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      badge: `Dari ${stats.totalOfficial} Resmi`,
      action: onOpenUnregisteredTab,
      isActive: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((c) => (
        <button
          key={c.id}
          onClick={c.action}
          className={`text-left p-3.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
            c.isActive
              ? 'ring-2 ring-blue-600 shadow-md bg-white border-blue-500'
              : `${c.bg} ${c.border} hover:shadow-xs hover:border-slate-300`
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-1.5 rounded-xl bg-white shadow-2xs">{c.icon}</span>
            <span className="text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100">
              {c.badge}
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {c.count}
            </div>
            <div className="text-xs font-semibold text-slate-600 line-clamp-1">{c.title}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
