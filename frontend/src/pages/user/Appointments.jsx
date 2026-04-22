import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import UserLayout from '../../layouts/UserLayout';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function UserAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

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
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (s === 'completed') return 'bg-sky-50 text-sky-700';
    if (s === 'cancelled') return 'bg-rose-50 text-rose-600';
    return 'bg-amber-50 text-amber-700';
  };

  const tabs = [
    { label: 'All', value: null },
    { label: 'Approved', value: 'approved' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
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

  return (
    <>
      <Head title="My Appointments" />

      <div className="mb-6 rounded-3xl border border-[#dceeed] bg-[linear-gradient(120deg,#f8fcfb_0%,#eef8f6_100%)] p-5 shadow-[0_16px_40px_rgba(12,123,121,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#12373d]">My Appointments</h1>
            <p className="mt-1 text-sm text-slate-600">Track appointment status and recent updates in one place.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/user/prescriptions"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#cfe8e5] bg-white px-3 py-2 text-sm font-medium text-[#22535a] shadow-sm hover:bg-[#f4fbfa] transition"
            >
              View Prescriptions
            </Link>
            <Link
              href="/user/book-appointment"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0c7b79] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a6664] transition"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Book Appointment
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-[#d7ece9] bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total</div>
            <div className="mt-1 text-lg font-bold text-[#12373d]">{rows.length}</div>
          </div>
          <div className="rounded-xl border border-[#d7ece9] bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Approved</div>
            <div className="mt-1 text-lg font-bold text-emerald-600">{rows.filter((a) => (a.status || '').toLowerCase() === 'approved').length}</div>
          </div>
          <div className="rounded-xl border border-[#d7ece9] bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Completed</div>
            <div className="mt-1 text-lg font-bold text-sky-600">{rows.filter((a) => (a.status || '').toLowerCase() === 'completed').length}</div>
          </div>
          <div className="rounded-xl border border-[#d7ece9] bg-white px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Cancelled</div>
            <div className="mt-1 text-lg font-bold text-rose-600">{rows.filter((a) => (a.status || '').toLowerCase() === 'cancelled').length}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#d9e9e7] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#e7f1f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <button
                key={String(t.value)}
                onClick={() => setActiveTab(t.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                  activeTab === t.value
                    ? 'bg-[#0c7b79] text-white'
                    : 'bg-[#f1f7f6] text-slate-600 hover:bg-[#e7f3f1]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-medium text-slate-400">{pagination?.total ?? rows.length} records</div>
        </div>

        <div className="px-5 py-3 border-b border-[#edf4f3]">
          <span className="text-sm font-semibold text-[#244b50]">Appointments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#edf4f3] bg-[#f8fcfb]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-gray-400">Loading appointments...</td>
                </tr>
              ) : null}

              {filteredRows.map((a) => (
                <tr key={a.id} className="border-b border-[#f1f5f4] transition-colors hover:bg-[#f9fcfb]">
                  <td className="px-4 py-3.5 text-sm font-medium text-[#1b3f44] whitespace-nowrap">
                    {formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                      {a.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    <div className="max-w-[360px] truncate">{a.symptoms || 'No notes added'}</div>
                    {a?.chamber?.name ? <div className="mt-0.5 text-xs text-slate-400">Chamber: {a.chamber.name}</div> : null}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                    {formatLastUpdated(a.updated_at)}
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <p className="text-sm text-gray-400">No appointments found.</p>
                  </td>
                </tr>
              )}
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
      </div>
    </>
  );
}

UserAppointments.layout = (page) => <UserLayout>{page}</UserLayout>;
