import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate } from '../../utils/dateFormat';

export default function DoctorAppointments({ appointments = [] }) {
  const [rows, setRows] = useState(appointments);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDate(today) || today;

  const formatTime12h = (time) => {
    if (!time || typeof time !== 'string') return '';
    const parts = time.split(':');
    const h = Number(parts[0] ?? 0);
    const m = parts[1] ?? '00';
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${ampm}`;
  };

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
    }
  };

  const filteredRows = rows.filter((a) => {
    const statusOk = statusFilter === 'all' ? true : a.status === statusFilter;
    const dateOk = dateFilter === 'all'
      ? true
      : dateFilter === 'today'
        ? a.appointment_date === today
        : true;
    return statusOk && dateOk;
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
    <>
      <Head title="Appointments" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#005963]">Appointments</h1>
          <p className="mt-1 text-sm text-gray-700">Manage appointment status and create prescriptions.</p>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
          <div className="border-b bg-white px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-[#005963]">Today:</span> {todayLabel}
                {lastBookedToday && (
                  <span className="ml-3">
                    <span className="font-semibold text-[#005963]">Last booked today:</span>{' '}
                    {lastBookedToday.user?.name || lastBookedToday.user_id}{' '}at{' '}
                    {formatTime12h(lastBookedToday.appointment_time)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Filter by date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963]"
                  >
                    <option value="all">All</option>
                    <option value="today">Today</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Filter by status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963]"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-14 px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {filteredRows.map((a, idx) => {
                  const canCreatePrescription = !a.has_prescription && (a.status === 'approved' || a.status === 'completed');
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{a.user?.name || a.user_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDisplayDate(a.appointment_date) || a.appointment_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatTime12h(a.appointment_time)}</td>
                      <td className="px-4 py-3 text-sm capitalize">
                        <select
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusSelectClass(a.status)}`}
                          value={a.status}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {a.has_prescription ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Prescription Created
                            </span>
                            {a.prescription_id ? (
                              <Link
                                href={`/doctor/prescriptions/${a.prescription_id}`}
                                className="inline-flex items-center justify-center rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10"
                              >
                                View
                              </Link>
                            ) : null}
                          </div>
                        ) : canCreatePrescription ? (
                          <Link
                            href={`/doctor/prescriptions/create?appointment_id=${a.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10"
                          >
                            Create Prescription
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">No appointments scheduled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

DoctorAppointments.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
