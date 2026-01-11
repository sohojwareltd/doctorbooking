import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, PlusCircle } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

export default function AdminAppointments({ appointments = [] }) {
  const pageRows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const [rows, setRows] = useState(pageRows);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'scheduled') return 'border-blue-200 bg-blue-50 text-blue-800';
    if (s === 'arrived') return 'border-amber-200 bg-amber-50 text-amber-800';
    if (s === 'in_consultation') return 'border-purple-200 bg-purple-50 text-purple-800';
    if (s === 'awaiting_tests') return 'border-orange-200 bg-orange-50 text-orange-800';
    if (s === 'prescribed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800';
    // Legacy statuses for backward compatibility
    if (s === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (s === 'completed') return 'border-sky-200 bg-sky-50 text-sky-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
  };

  const updateStatus = async (id, status) => {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const res = await fetch(`/admin/appointments/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toastSuccess('Appointment status updated.');
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data?.message || 'Failed to update status.');
    }
  };
  return (
    <>
      <Head title="Appointments" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#005963]/10 p-3">
              <CalendarCheck2 className="h-6 w-6 text-[#005963]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#005963]">All Appointments</h1>
              <p className="mt-1 text-sm text-gray-700">Monitor bookings and update appointment status.</p>
            </div>
          </div>

          <Link
            href="/admin/book-appointment"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00acb1] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#00acb1]/30"
          >
            <PlusCircle className="h-4 w-4" />
            Book Appointment
          </Link>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-[#00acb1]/5">
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{a.user?.name || a.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.doctor?.name || a.doctor_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDisplayTime12h(a.appointment_time) || a.appointment_time}</td>
                    <td className="px-4 py-3 text-sm capitalize">
                      <div className="relative inline-block min-w-[140px] w-full">
                        <select
                          className={`appearance-none w-full rounded-lg border-2 px-4 py-2.5 pr-10 text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md active:shadow-sm ${getStatusColor(a.status)}`}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '14px',
                            paddingRight: '2.5rem',
                          }}
                          value={a.status}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="arrived">Arrived</option>
                          <option value="in_consultation">In Consultation</option>
                          <option value="awaiting_tests">Awaiting Tests</option>
                          <option value="prescribed">Prescribed</option>
                          <option value="cancelled">Cancelled</option>
                          {/* Legacy options for backward compatibility */}
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">No appointments found.</td>
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

AdminAppointments.layout = (page) => <AdminLayout>{page}</AdminLayout>;
