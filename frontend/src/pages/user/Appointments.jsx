import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Eye, FileText, Mail, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import UserLayout from '../../layouts/UserLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';

export default function UserAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/patient/appointments?per_page=50', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.appointments) ? data.appointments : (data.appointments?.data ?? []);
          setRows(items);
          setPagination(data.meta ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'scheduled' || s === 'arrived') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (s === 'completed' || s === 'prescribed') return 'border-sky-200 bg-sky-50 text-sky-700';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-600';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  const tabs = [
    { label: 'All', value: null },
    { label: 'Approved', value: 'approved' },
    { label: 'Completed', value: 'completed' },
    // { label: 'Cancelled', value: 'cancelled' },
  ];

  const [activeTab, setActiveTab] = useState(null);

  const filteredRows = useMemo(() => (
    activeTab ? rows.filter((a) => (a.status || '').toLowerCase() === activeTab) : rows
  ), [rows, activeTab]);

  const formatLastUpdated = (updatedAt) => {
    if (!updatedAt) return '-';
    const d = new Date(updatedAt);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const getPatientName = (a) => a?.patient_name || a?.user?.name || '-';
  const getPatientEmail = (a) => a?.patient_email || a?.user?.email || '-';
  const getPatientAge = (a) => (a?.patient_age ?? '-') === '' ? '-' : (a?.patient_age ?? '-');
  const getChamberName = (a) => a?.chamber?.name || '-';
  const formatTime = (a) => formatDisplayTime12h(a?.appointment_time) || a?.appointment_time || '-';

  const hasPrescription = (a) => Boolean(a?.prescription_id || a?.has_prescription);

  const totalCount = rows.length;
  const scheduledCount = rows.filter((a) => ['approved', 'scheduled', 'arrived'].includes(String(a.status || '').toLowerCase())).length;
  const completedCount = rows.filter((a) => ['completed', 'prescribed'].includes(String(a.status || '').toLowerCase())).length;
  const cancelledCount = rows.filter((a) => String(a.status || '').toLowerCase() === 'cancelled').length;

  return (
    <>
      <Head title="My Appointments" />

      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-[#d7eeeb] bg-[linear-gradient(145deg,#f7fcfb_0%,#eef8f6_52%,#fbfefd_100%)] p-5 shadow-[0_18px_45px_rgba(12,123,121,0.08)] sm:p-6">
          <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-[#0c7b79]/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#3d8bff]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cde7e4] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#25656b]">Patient Portal</div>
              <h1 className="mt-2 text-xl font-bold text-[#11383d] sm:text-2xl">My Appointments</h1>
              <p className="mt-1 text-sm text-slate-600">Track your visit history, status changes, and latest updates.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/patient/prescriptions"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cfe8e5] bg-white px-3.5 py-2 text-sm font-medium text-[#22535a] shadow-sm transition hover:bg-[#f4fbfa]"
              >
                View Prescriptions
              </Link>
              <Link
                href="/book-appointment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0c7b79] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a6664]"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Book Appointment
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#d7ece9] bg-white/95 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total</div>
              <div className="mt-1 text-lg font-bold text-[#12373d]">{totalCount}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/95 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Scheduled</div>
              <div className="mt-1 text-lg font-bold text-emerald-600">{scheduledCount}</div>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Completed</div>
              <div className="mt-1 text-lg font-bold text-sky-600">{completedCount}</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white/95 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Cancelled</div>
              <div className="mt-1 text-lg font-bold text-rose-600">{cancelledCount}</div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#d9e9e7] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-[#e7f1f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((t) => (
                <button
                  key={String(t.value)}
                  onClick={() => setActiveTab(t.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                    activeTab === t.value
                      ? 'border-[#0c7b79] bg-[#0c7b79] text-white shadow-sm'
                      : 'border-[#d8ece9] bg-[#f1f7f6] text-slate-600 hover:bg-[#e7f3f1]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="rounded-full border border-[#dcefed] bg-[#f5fbfa] px-3 py-1 text-xs font-medium text-slate-500">{pagination?.total ?? rows.length} records</div>
          </div>

          <div className="px-5 py-3 border-b border-[#edf4f3]">
            <span className="text-sm font-semibold text-[#244b50]">Appointments</span>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-[#edf4f3] md:hidden">
            {loading ? (
              <div className="px-5 py-14 text-center text-sm text-gray-400">Loading appointments...</div>
            ) : null}

            {!loading && filteredRows.map((a) => (
              <article key={a.id} className="px-4 py-4">
                <div className="rounded-2xl border border-[#e6f0ef] bg-[#fbfefd] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Appointment Date</p>
                      <p className="mt-1 text-sm font-semibold text-[#1b3f44]">
                        {formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                      {a.status || 'Pending'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500">Patient: <span className="font-medium text-slate-700">{getPatientName(a)}</span></p>
                    <p className="text-xs text-slate-500">Email: <span className="font-medium text-slate-700">{getPatientEmail(a)}</span></p>
                    <p className="text-xs text-slate-500">Age: <span className="font-medium text-slate-700">{getPatientAge(a)}</span></p>
                    <p className="text-xs text-slate-500">Time: <span className="font-medium text-slate-700">{formatTime(a)}</span></p>
                    <p className="text-xs text-slate-500">Chamber: <span className="font-medium text-slate-700">{getChamberName(a)}</span></p>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Details</p>
                      <p className="mt-1 text-sm text-slate-600">{a.symptoms || 'No notes added'}</p>
                    </div>
                    <p className="text-xs text-slate-400">Updated: {formatLastUpdated(a.updated_at)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewRow(a)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPrescription(a) ? (
                        <Link
                          href={`/patient/prescriptions/${a.prescription_id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                          title="Prescription"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-slate-400"
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
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#edf4f3] bg-[#f8fcfb]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Patient Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Chamber</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-sm text-gray-400">Loading appointments...</td>
                  </tr>
                ) : null}

                {!loading && filteredRows.map((a) => (
                  <tr key={a.id} className="border-b border-[#f1f5f4] transition-colors odd:bg-white even:bg-[#fcfefd] hover:bg-[#f2faf9]">
                    <td className="px-4 py-3.5 text-sm font-medium text-[#1b3f44] whitespace-nowrap">{getPatientName(a)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{getPatientEmail(a)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{getPatientAge(a)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{getChamberName(a)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-[#1b3f44] whitespace-nowrap">
                      {formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatTime(a)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                        {a.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewRow(a)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {hasPrescription(a) ? (
                          <Link
                            href={`/patient/prescriptions/${a.prescription_id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                            title="Prescription"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-400"
                            title="Prescription not available"
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <p className="text-sm text-gray-400">No appointments found.</p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="border-t border-[#e7f1f0] px-5 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-400">
                Page <span className="font-semibold text-gray-700">{pagination.current_page}</span> of{' '}
                <span className="font-semibold text-gray-700">{pagination.last_page}</span>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                  const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));
                  const base = 'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border transition';
                  const on = 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50';
                  const off = 'border-gray-100 text-gray-300 bg-white cursor-not-allowed';
                  return (
                    <>
                      {prev?.url ? <Link href={prev.url} className={`${base} ${on}`}>Previous</Link> : <span className={`${base} ${off}`}>Previous</span>}
                      {next?.url ? <Link href={next.url} className={`${base} ${on}`}>Next</Link> : <span className={`${base} ${off}`}>Next</span>}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>

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
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge(viewRow.status)}`}>
                    {viewRow.status || 'Pending'}
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
