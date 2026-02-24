import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import UserLayout from '../../layouts/UserLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';

export default function UserAppointments({ appointments = [] }) {
  const rows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

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
  const filteredRows = activeTab ? rows.filter((a) => (a.status || '').toLowerCase() === activeTab) : rows;

  return (
    <>
      <Head title="My Appointments" />

      {/* Page header — matches image exactly */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Appointments</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your accounts and bookings.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/user/prescriptions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            View Prescriptions
          </Link>
          <Link
            href="/user/book-appointment"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tabs row — matches image tab bar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5">
          <div className="flex items-center">
            {tabs.map((t) => (
              <button
                key={String(t.value)}
                onClick={() => setActiveTab(t.value)}
                className={`px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.value
                    ? 'border-gray-900 text-gray-900 font-semibold'
                    : 'border-transparent text-gray-500 font-medium hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden sm:inline">{pagination?.total ?? rows.length} total</span>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">All Records</span>
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition">
            Status <span className="ml-1 text-gray-400">▾</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-10 px-5 py-3">
                  <input type="checkbox" className="rounded border-gray-300 text-[#005963] focus:ring-[#005963]" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Due date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Doctor / Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Invoice no</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <input type="checkbox" className="rounded border-gray-300 text-[#005963] focus:ring-[#005963]" />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-800 font-medium whitespace-nowrap">
                    {formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                      {a.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[180px] truncate">{a.symptoms || '-'}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {formatDisplayTime12h(a.appointment_time) || a.appointment_time}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">
                    #{a.id ?? '-'}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-400 whitespace-nowrap">
                    {a.updated_at
                      ? new Date(a.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      : '-'}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-gray-400">No appointments found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.data && typeof pagination.current_page === 'number' ? (
          <div className="border-t border-gray-200 px-5 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
