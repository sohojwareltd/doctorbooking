import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';
import UserLayout from '../../layouts/UserLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';

export default function UserAppointments({ appointments = [] }) {
  const rows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (s === 'completed') return 'border-sky-200 bg-sky-50 text-sky-800';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
  };

  return (
    <>
      <Head title="My Appointments" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[#005963]/10 p-3">
            <CalendarDays className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">My Appointments</h1>
            <p className="mt-1 text-sm text-gray-700">Track your appointment requests and status.</p>
          </div>
        </div>

        <GlassCard variant="solid" hover={false} className="overflow-hidden">
          <div className="border-b bg-white px-4 py-4">
            <div className="text-sm text-gray-700">
              Total appointments: <span className="font-semibold text-[#005963]">{pagination?.total ?? rows.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-[#00acb1]/5">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDisplayTime12h(a.appointment_time) || a.appointment_time}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.symptoms || '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No appointments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="border-t bg-white px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold text-[#005963]">{pagination.current_page}</span> of{' '}
                  <span className="font-semibold text-[#005963]">{pagination.last_page}</span>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                    const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));

                    const btnBase = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition';
                    const btnOn = 'bg-[#00acb1] text-white hover:bg-[#00787b]';
                    const btnOff = 'bg-gray-100 text-gray-400 cursor-not-allowed';

                    return (
                      <>
                        {prev?.url ? (
                          <Link href={prev.url} className={`${btnBase} ${btnOn}`}>
                            Prev
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>Prev</span>
                        )}
                        {next?.url ? (
                          <Link href={next.url} className={`${btnBase} ${btnOn}`}>
                            Next
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>Next</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </>
  );
}

UserAppointments.layout = (page) => <UserLayout>{page}</UserLayout>;
