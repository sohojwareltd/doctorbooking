import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

const SURFACE_CLASS = 'rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_24px_60px_-42px_rgba(45,58,116,0.38)] backdrop-blur-sm';

export function DashboardCard({ children, className = '' }) {
  return <section className={`${SURFACE_CLASS} ${className}`}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2D3A74]/60">{eyebrow}</p>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

export function PatientMetaBadge({ children, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200 bg-white/80 text-slate-600',
    primary: 'border-[#c9d2f0] bg-[#eef1fb] text-[#2D3A74]',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, hint, className = '' }) {
  return (
    <div className={`group rounded-2xl border border-white/70 bg-white/88 p-4 shadow-[0_18px_40px_-34px_rgba(45,58,116,0.52)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-28px_rgba(45,58,116,0.42)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D3A74] text-white shadow-[0_16px_30px_-18px_rgba(45,58,116,0.8)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hint ? <p className="mt-4 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function InfoCard({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/75 bg-slate-50/75 p-4 transition duration-200 hover:border-slate-200 hover:bg-white ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e9edf8] text-[#2D3A74]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value || 'Not provided'}</p>
        </div>
      </div>
    </div>
  );
}

export function TimelineItem({ appointment, dateLabel, timeLabel, symptoms, actionHref }) {
  return (
    <div className="group relative pl-8">
      <div className="absolute left-[11px] top-10 bottom-[-24px] w-px bg-slate-200 group-last:hidden" />
      <div className="absolute left-0 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[#cfd8f3] bg-white shadow-sm">
        <div className="h-2.5 w-2.5 rounded-full bg-[#2D3A74]" />
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_48px_-34px_rgba(45,58,116,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-sm font-semibold text-slate-900">{dateLabel}</p>
              <span className="text-sm text-slate-400">{timeLabel}</span>
              <StatusBadge status={appointment.status} size="xs" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Symptoms</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{symptoms}</p>
            </div>
          </div>
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#c9d2f0] hover:bg-[#f6f8fe] hover:text-[#2D3A74]"
          >
            View
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PrescriptionCard({ diagnosis, medications, dateLabel, actionHref }) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_46px_-38px_rgba(45,58,116,0.36)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnosis</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{diagnosis || 'No diagnosis provided'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Medication Summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{medications || 'No medications recorded'}</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">{dateLabel}</div>
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#24305f]"
        >
          Open
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}