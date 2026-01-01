import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Search, CheckCircle2, XCircle } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorAppointments({ appointments = [] }) {
  const pageRows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const [rows, setRows] = useState(pageRows);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(today) || today;

  const statusSelectClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (s === 'completed') return 'border-sky-200 bg-sky-50 text-sky-800';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800';
    return 'border-amber-200 bg-amber-50 text-amber-800';
  };

  const updateStatus = async (id, status) => {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const res = await fetch(`/doctor/appointments/${id}/status`, {
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

  const filteredRows = rows.filter((a) => {
    const statusOk = statusFilter === 'all' ? true : a.status === statusFilter;
    const dateOk = dateFilter === 'all'
      ? true
      : dateFilter === 'today'
        ? a.appointment_date === today
        : true;
    const searchOk = searchTerm === '' || (a.user?.name || a.user_id).toLowerCase().includes(searchTerm.toLowerCase());
    return statusOk && dateOk && searchOk;
  });

  const lastBookedToday = (() => {
    const todays = rows.filter((a) => a.appointment_date === today);
    if (todays.length === 0) return null;

    const sorted = [...todays].sort((a, b) => {
      const aKey = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
      const bKey = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
      return bKey.localeCompare(aKey);
    });

    return sorted[0] || null;
  })();

  return (
    <DoctorLayout title="Appointments">
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Appointments</h1>
            <p className="mt-2 text-gray-600">Manage and track all your patient appointments</p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-bold text-[#005963]">{filteredRows.length}</span> appointment{filteredRows.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: rows.length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Pending', value: rows.filter(a => a.status === 'pending').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Approved', value: rows.filter(a => a.status === 'approved').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Completed', value: rows.filter(a => a.status === 'completed').length, color: 'bg-sky-50 text-sky-700 border-sky-200' },
          ].map((stat, idx) => (
            <GlassCard key={idx} variant="solid" className={`border-2 p-4 ${stat.color}`}>
              <div className="text-sm font-semibold opacity-75">{stat.label}</div>
              <div className="mt-2 text-2xl font-black">{stat.value}</div>
            </GlassCard>
          ))}
        </div>

        {/* Main Table Card */}
        <GlassCard variant="solid" hover={false} className="overflow-hidden border border-[#00acb1]/20">
          {/* Header with Filters and Search */}
          <div className="space-y-4 border-b border-gray-200 bg-gradient-to-r from-white to-[#00acb1]/5 px-6 py-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="text-sm font-semibold text-gray-700">
                  <span className="text-[#005963]">Today:</span> {todayLabel}
                </div>
                {lastBookedToday && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-[#005963]">Last:</span> {lastBookedToday.user?.name || lastBookedToday.user_id} at {formatDisplayTime12h(lastBookedToday.appointment_time) || lastBookedToday.appointment_time}
                  </div>
                )}
              </div>
              {selectedIds.length > 0 && (
                <div className="text-sm font-semibold text-[#005963]">
                  {selectedIds.length} selected
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              {/* Search */}
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

              {/* Date Filter */}
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

              {/* Status Filter */}
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

          {/* Table */}
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((a, idx) => {
                  const canCreatePrescription = !a.has_prescription && (a.status === 'approved' || a.status === 'completed');
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <tr key={a.id} className={`transition ${isSelected ? 'bg-[#00acb1]/10' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, a.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== a.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#005963]">{a.user?.name || a.user_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDisplayTime12h(a.appointment_time) || a.appointment_time}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${statusSelectClass(a.status)}`}
                          value={a.status}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {a.has_prescription ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Prescription
                            </span>
                            {a.prescription_id ? (
                              <Link
                                href={`/doctor/prescriptions/${a.prescription_id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-[#00acb1]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 transition"
                              >
                                View
                              </Link>
                            ) : null}
                          </div>
                        ) : canCreatePrescription ? (
                          <Link
                            href={`/doctor/prescriptions/create?appointment_id=${a.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-[#00acb1] bg-[#00acb1]/10 px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                          >
                            Create
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
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

          {/* Pagination */}
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
                    const btnBase = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition';
                    const btnOn = 'bg-[#005963] text-white hover:bg-[#00787b]';
                    const btnOff = 'bg-gray-200 text-gray-400 cursor-not-allowed';
                    return (
                      <>
                        {prev?.url ? (
                          <Link href={prev.url} className={`${btnBase} ${btnOn}`}>
                            ← Previous
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>← Previous</span>
                        )}
                        {next?.url ? (
                          <Link href={next.url} className={`${btnBase} ${btnOn}`}>
                            Next →
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>Next →</span>
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
    </DoctorLayout>
  );
}
