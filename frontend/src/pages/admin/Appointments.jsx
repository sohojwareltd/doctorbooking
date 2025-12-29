import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarCheck2, PlusCircle } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDate } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

export default function AdminAppointments({ appointments = [] }) {
  const [rows, setRows] = useState(appointments);

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
              Total appointments: <span className="font-semibold text-[#005963]">{rows.length}</span>
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
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{a.user?.name || a.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.doctor?.name || a.doctor_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDisplayDate(a.appointment_date) || a.appointment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.appointment_time}</td>
                    <td className="px-4 py-3 text-sm capitalize">
                      <select
                        className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963]"
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
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
        </GlassCard>
      </div>
    </>
  );
}

AdminAppointments.layout = (page) => <AdminLayout>{page}</AdminLayout>;
