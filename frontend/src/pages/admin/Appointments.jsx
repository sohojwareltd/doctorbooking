import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, PlusCircle, Search } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

export default function AdminAppointments({ appointments = [] }) {
  const pageRows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const [rows, setRows] = useState(pageRows);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const todayLabel = useMemo(() => formatDisplayDateWithYearFromDateLike(new Date()), []);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const normalizedStatus = (row?.status || '').toLowerCase();
      const patientName = (row?.patient_name || row?.user?.name || '').toLowerCase();

      if (statusFilter !== 'all' && normalizedStatus !== statusFilter) {
        return false;
      }

      if (dateFilter === 'today') {
        const rowDate = row?.appointment_date ? new Date(row.appointment_date) : null;
        const now = new Date();

        if (!rowDate) {
          return false;
        }

        if (
          rowDate.getFullYear() !== now.getFullYear() ||
          rowDate.getMonth() !== now.getMonth() ||
          rowDate.getDate() !== now.getDate()
        ) {
          return false;
        }
      }

      if (q && !patientName.includes(q)) {
        return false;
      }

      return true;
    });
  }, [rows, statusFilter, dateFilter, searchTerm]);

  const displayCount = filteredRows.length;

  const statusCounts = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const status = (row?.status || '').toLowerCase();
        acc.total += 1;
        if (status === 'pending') acc.pending += 1;
        if (status === 'approved') acc.approved += 1;
        if (status === 'completed') acc.completed += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, completed: 0 }
    );
  }, [filteredRows]);

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
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Appointments</h1>
            <p className="mt-2 text-gray-600">Monitor and manage all patient appointments</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/book-appointment"
              className="flex items-center gap-2 rounded-xl bg-[#005963] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00434a] transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Book Appointment
            </Link>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-[#005963]">{displayCount}</span> appointment{displayCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: statusCounts.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Pending', value: statusCounts.pending, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Approved', value: statusCounts.approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Completed', value: statusCounts.completed, color: 'bg-sky-50 text-sky-700 border-sky-200' },
          ].map((stat, idx) => (
            <GlassCard key={idx} variant="solid" className={`border-2 p-4 ${stat.color}`}>
              <div className="text-sm font-semibold opacity-75">{stat.label}</div>
              <div className="mt-2 text-2xl font-black">{stat.value}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="solid" hover={false} className="overflow-hidden border border-[#00acb1]/20">
          <div className="space-y-4 border-b border-gray-200 bg-gradient-to-r from-white to-[#00acb1]/5 px-6 py-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="text-sm font-semibold text-gray-700">
                <span className="text-[#005963]">Today:</span> {todayLabel}
              </div>
              {selectedIds.length > 0 && (
                <div className="text-sm font-semibold text-[#005963]">
                  {selectedIds.length} selected
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-700">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Filter by date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Filter by status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredRows.map(r => r.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Doctor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {filteredRows.map((a) => (
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
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <CalendarCheck2 className="mx-auto mb-3 h-8 w-8 opacity-50" />
                        <p className="font-semibold">No appointments found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="text-sm text-gray-600">
                  Page <span className="font-bold text-[#005963]">{pagination.current_page}</span> of <span className="font-bold text-[#005963]">{pagination.last_page}</span> • Total: <span className="font-bold text-[#005963]">{pagination.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                    const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));
                    const btnBase = 'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition';
                    const btnOn = 'bg-[#005963] text-white hover:bg-[#00434a]';
                    const btnOff = 'bg-gray-200 text-gray-400 cursor-not-allowed';
                    return (
                      <>
                        {prev?.url ? (
                          <Link href={prev.url} className={`${btnBase} ${btnOn}`}>Previous</Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>Previous</span>
                        )}
                        {next?.url ? (
                          <Link href={next.url} className={`${btnBase} ${btnOn}`}>Next</Link>
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
