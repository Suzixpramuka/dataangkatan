import React from 'react';
import { VerificationStatus } from '../types/index.ts';
import { CheckCircle2, AlertCircle, XCircle, Clock, Copy } from 'lucide-react';

interface Props {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md', showIcon = true }) => {
  const configs: Record<
    VerificationStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    VERIFIED: {
      label: 'Terverifikasi Resmi',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    NEEDS_CONFIRMATION: {
      label: 'Perlu Konfirmasi',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
    },
    NOT_VERIFIED: {
      label: 'Belum Terverifikasi',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    PENDING: {
      label: 'Menunggu Pemeriksaan',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    },
    DUPLICATE_REVIEW: {
      label: 'Tinjau Duplikat',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <Copy className="w-3.5 h-3.5 text-purple-600" />,
    },
  };

  const config = configs[status] || configs.PENDING;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
