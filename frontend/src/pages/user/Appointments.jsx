import { Head, Link } from '@inertiajs/react';
import { CalendarCheck2, CalendarDays, CheckCircle2, Eye, FileText, Mail, Search, SlidersHorizontal, UserCheck, UserRound, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import UserLayout from '../../layouts/UserLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';

export default function UserAppointments() {
  const PER_PAGE = 10;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patient/appointments?per_page=${PER_PAGE}&page=${page}`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          const payload = data?.appointments ?? data;
          const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          const meta = payload?.meta ?? data?.meta ?? null;
          const links = payload?.links ?? data?.links ?? null;

          setRows(items);
          setPagination(meta ? { ...meta, links } : null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'scheduled' || s === 'arrived') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (s === 'completed' || s === 'prescribed') return 'border-sky-200 bg-sky-50 text-sky-700';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-600';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  const formatStatusLabel = (status) => {
    const value = String(status || '').trim();
    if (!value) return 'Pending';
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((a) => {
      const status = String(a.status || '').toLowerCase();
      const statusOk = statusFilter === 'all'
        || (statusFilter === 'scheduled' && ['scheduled', 'arrived'].includes(status))
        || (statusFilter === 'completed' && ['completed', 'prescribed'].includes(status))
        || status === statusFilter;

      if (!statusOk) return false;

      if (!needle) return true;

      const haystack = [
        a?.patient_name,
        a?.user?.name,
        a?.patient_email,
        a?.user?.email,
        a?.patient_phone,
        a?.user?.phone,
        a?.chamber?.name,
        a?.appointment_date,
        a?.appointment_time,
        a?.status,
        a?.symptoms,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [rows, searchTerm, statusFilter]);

  const currentPage = pagination?.current_page ?? page;
  const lastPage = pagination?.last_page ?? 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < lastPage;

  const visiblePages = useMemo(() => {
    if (!lastPage || lastPage <= 1) return [1];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  }, [currentPage, lastPage]);

  const formatLastUpdated = (updatedAt) => {
    if (!updatedAt) return '-';
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const getPatientName = (a) => a?.patient_name || a?.user?.name || '-';
  const getPatientEmail = (a) => a?.patient_email || a?.user?.email || '-';
  const getPatientPhone = (a) => a?.patient_phone || a?.user?.phone || null;
  const getPatientContact = (a) => {
    const email = getPatientEmail(a);
    if (email && email !== '-') return email;
    return getPatientPhone(a) || '-';
  };
  const getPatientAge = (a) => (a?.patient_age ?? '-') === '' ? '-' : (a?.patient_age ?? '-');
  const getChamberName = (a) => a?.chamber?.name || '-';
  const formatTime = (a) => formatDisplayTime12h(a?.appointment_time) || a?.appointment_time || '-';
  const getPatientInitials = (a) => {
    const name = String(getPatientName(a) || '').trim();
    if (!name || name === '-') return 'P';
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
    return initials || 'P';
  };

  const hasPrescription = (a) => Boolean(a?.prescription_id || a?.has_prescription);

  const totalCount = pagination?.total ?? rows.length;
  const scheduledCount = rows.filter((a) => ['scheduled', 'arrived'].includes(String(a.status || '').toLowerCase())).length;
  const completedCount = rows.filter((a) => ['completed', 'prescribed'].includes(String(a.status || '').toLowerCase())).length;
  const cancelledCount = rows.filter((a) => String(a.status || '').toLowerCase() === 'cancelled').length;

  const topWidgets = [
    {
      key: 'total',
      label: 'Total Appointments',
      value: totalCount,
      helper: `${pagination?.total ?? rows.length} total appointments found`,
      icon: CalendarCheck2,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: scheduledCount,
      helper: 'Appointments currently scheduled',
      icon: UserCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'completed',
      label: 'Completed',
      value: completedCount,
      helper: 'Visits completed or prescribed',
      icon: CheckCircle2,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: cancelledCount,
      helper: 'Appointments marked cancelled',
      icon: XCircle,
      tone: 'bg-orange-50 text-orange-700',
    },
  ];

  return (
    <>
      <Head title="My Appointments" />

      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <section className="">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">Patient Portal</div> */}
              <h1 className="mt-2 text-xl font-bold text-[#2D3A74] sm:text-2xl">My Appointments</h1>
              <p className="mt-1 text-sm text-slate-600">Track your visit history, status changes, and latest updates.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/patient/prescriptions"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View Prescriptions
              </Link>
              <Link
                href="/book-appointment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D3A74] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243063]"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Book Appointment
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {topWidgets.map((widget) => {
              const Icon = widget.icon;

              return (
                <div key={widget.key} className="surface-card rounded-2xl p-3.5 sm:rounded-3xl sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500 sm:text-sm">{widget.label}</p>
                      <p className="text-2xl font-semibold text-[#2D3A74] sm:text-3xl">{widget.value}</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${widget.tone}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[11px] text-slate-400 sm:mt-4 sm:text-xs">{widget.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="hidden md:grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,360px)_200px] lg:items-end">
                <div className="min-w-0 lg:w-[360px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, phone, chamber, status"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="min-w-0 sm:max-w-[220px] lg:w-[200px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    <option value="all">All status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex md:hidden items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  title="Filters"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {pagination?.total ?? rows.length} records
              </div> */}
            </div>
          </div>


          {/* Mobile cards */}
          <div className="divide-y divide-[#edf4f3] md:hidden">
            {loading ? (
              <div className="px-5 py-14 text-center text-sm text-gray-400">Loading appointments...</div>
            ) : null}

            {!loading && filteredRows.map((a) => (
              <article key={a.id} className="px-4 py-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8ece9] bg-[#eef8f6] text-xs font-bold text-[#1b5b61]">
                        {getPatientInitials(a)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{getPatientName(a)}</p>
                        <p className="truncate text-xs text-slate-500">{getPatientContact(a)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(a.status)}`}>
                      {formatStatusLabel(a.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Date</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Time</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{formatTime(a)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Chamber</p>
                      <p className="mt-0.5 truncate font-semibold text-slate-700">{getChamberName(a)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Age</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{getPatientAge(a)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Notes</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">{a.symptoms || 'No notes added'}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400">Updated: {formatLastUpdated(a.updated_at)}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewRow(a)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPrescription(a) ? (
                        <Link
                          href={`/patient/prescriptions/${a.prescription_id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                          title="Prescription"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-300"
                          title="Prescription not available"
                        >
                          <FileText className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filteredRows.length === 0 && !loading ? (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-gray-400">No appointments found.</p>
              </div>
            ) : null}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                  <th className="px-6 py-4 text-center">Patient</th>
                  <th className="px-6 py-4 text-center">Chamber</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">Loading appointments...</td>
                  </tr>
                ) : null}

                {!loading && filteredRows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8ece9] bg-[#eef8f6] text-xs font-bold text-[#1b5b61]">
                          {getPatientInitials(a)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1b3f44]">{getPatientName(a)}</p>
                          <p className="truncate text-xs text-slate-500">{getPatientContact(a)}</p>
                          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">Age: {getPatientAge(a)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center whitespace-nowrap">{getChamberName(a)}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center whitespace-nowrap">
                      {formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center whitespace-nowrap">{formatTime(a)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>
                        {formatStatusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewRow(a)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {hasPrescription(a) ? (
                          <Link
                            href={`/patient/prescriptions/${a.prescription_id}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                            title="Prescription"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300"
                            title="Prescription not available"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <p className="text-sm text-slate-400">No appointments found.</p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {pagination && typeof pagination.current_page === 'number' && pagination.last_page > 1 ? (
            <div className="border-t border-slate-100 px-5 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-400">
                Page <span className="font-semibold text-gray-700">{pagination.current_page}</span> of{' '}
                <span className="font-semibold text-gray-700">{pagination.last_page}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => canGoPrev && setPage((p) => p - 1)}
                  disabled={!canGoPrev || loading}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                    canGoPrev && !loading
                      ? 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-gray-100 text-gray-300 bg-white cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>

                {visiblePages.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                      p === currentPage
                        ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                        : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => canGoNext && setPage((p) => p + 1)}
                  disabled={!canGoNext || loading}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                    canGoNext && !loading
                      ? 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-gray-100 text-gray-300 bg-white cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Mobile filters modal */}
        {showMobileFilters && typeof document !== 'undefined'
          ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-start bg-black/40 backdrop-blur-[1px]" onClick={() => setShowMobileFilters(false)}>
              <div
                className="w-full rounded-b-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.15)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#2D3A74]">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                    aria-label="Close filters"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Name, phone, chamber, status"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
          : null}

        {/* View details modal */}
        {viewRow && typeof document !== 'undefined'
          ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px] px-4" onClick={() => setViewRow(null)}>
              <div
                className="w-full max-w-lg rounded-2xl border border-[#dceceb] bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.18)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#11383d]">Appointment Details</h3>
                    <p className="text-xs text-slate-500">Updated: {formatLastUpdated(viewRow.updated_at)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewRow(null)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Patient</div>
                    <div className="font-semibold text-[#1b3f44]">{getPatientName(viewRow)}</div>
                  </div>
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Email</div>
                    <div className="flex items-center gap-1.5 text-slate-700"><Mail className="h-3.5 w-3.5" /> {getPatientEmail(viewRow)}</div>
                  </div>
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Age</div>
                    <div className="flex items-center gap-1.5 text-slate-700"><UserRound className="h-3.5 w-3.5" /> {getPatientAge(viewRow)}</div>
                  </div>
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Chamber</div>
                    <div className="text-slate-700">{getChamberName(viewRow)}</div>
                  </div>
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Appointment Date</div>
                    <div className="text-slate-700">{formatDisplayDateWithYearFromDateLike(viewRow.appointment_date) || viewRow.appointment_date || '-'}</div>
                  </div>
                  <div className="rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Time</div>
                    <div className="text-slate-700">{formatTime(viewRow)}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3 text-sm">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status</div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(viewRow.status)}`}>
                    {formatStatusLabel(viewRow.status)}
                  </span>
                </div>

                <div className="mt-3 rounded-xl border border-[#e8f1f0] bg-[#fbfefd] p-3 text-sm">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Symptoms / Notes</div>
                  <p className="text-slate-700">{viewRow.symptoms || viewRow.notes || 'No notes added'}</p>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  {hasPrescription(viewRow) ? (
                    <Link
                      href={`/patient/prescriptions/${viewRow.prescription_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <FileText className="h-4 w-4" />
                      View Prescription
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setViewRow(null)}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
          : null}
      </div>
    </>
  );
}

UserAppointments.layout = (page) => <UserLayout>{page}</UserLayout>;
