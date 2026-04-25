import {
  CalendarClock, Timer, Stethoscope, FlaskConical,
  BadgeCheck, Ban, CircleDot
} from 'lucide-react';

export const STATUS_CONFIG = {
  scheduled:       { label: 'Scheduled',       bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    icon: CalendarClock },
  arrived:         { label: 'Arrived',          bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   icon: Timer },
  in_consultation: { label: 'In Consultation',  bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  icon: Stethoscope },
  test_registered: { label: 'Report Submitted', bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    dot: 'bg-cyan-500',    icon: FlaskConical },
  awaiting_tests:  { label: 'Awaiting Report',  bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500',  icon: FlaskConical },
  prescribed:      { label: 'Completed',        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: BadgeCheck },
  cancelled:       { label: 'Cancelled',        bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     icon: Ban },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: CircleDot,
  };
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = getStatusConfig(status);
  const StatusIcon = cfg.icon;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full border font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <StatusIcon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {cfg.label}
    </span>
  );
}
