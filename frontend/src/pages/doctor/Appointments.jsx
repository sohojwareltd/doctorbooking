import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import DoctorLayout from '../../layouts/DoctorLayout';

export default function DoctorAppointments({ appointments = [] }) {
  const [rows, setRows] = useState(appointments);

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
  return (
    <>
      <Head title="Appointments" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#005963]">Appointments</h1>
          <p className="mt-1 text-sm text-gray-700">Manage appointment status and create prescriptions.</p>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {rows.map((a) => {
                  const canCreatePrescription = !a.has_prescription && (a.status === 'approved' || a.status === 'completed');
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{a.user?.name || a.user_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{a.appointment_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{a.appointment_time}</td>
                      <td className="px-4 py-3 text-sm capitalize">
                        <select
                          className="rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm"
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
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            Prescription Created
                          </span>
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
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">No appointments scheduled.</td>
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
