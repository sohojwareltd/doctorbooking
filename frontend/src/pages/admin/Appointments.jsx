import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDisplayDate } from '../../utils/dateFormat';

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
    }
  };
  return (
    <>
      <Head title="Appointments" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">All Appointments</h1>
        <div className="overflow-hidden rounded-2xl border">
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
                <tr key={a.id}>
                  <td className="px-4 py-3 text-sm">{a.user?.name || a.user_id}</td>
                  <td className="px-4 py-3 text-sm">{a.doctor?.name || a.doctor_id}</td>
                  <td className="px-4 py-3 text-sm">{formatDisplayDate(a.appointment_date) || a.appointment_date}</td>
                  <td className="px-4 py-3 text-sm">{a.appointment_time}</td>
                  <td className="px-4 py-3 text-sm capitalize">
                    <select
                      className="rounded border px-2 py-1 text-sm"
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
      </div>
    </>
  );
}

AdminAppointments.layout = (page) => <AdminLayout>{page}</AdminLayout>;
