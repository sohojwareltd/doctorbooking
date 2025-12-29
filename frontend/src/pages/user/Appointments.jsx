import { Head } from '@inertiajs/react';
import UserLayout from '../../layouts/UserLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDate } from '../../utils/dateFormat';

export default function UserAppointments({ appointments = [] }) {
  const formatTime12h = (time) => {
    if (!time || typeof time !== 'string') return '';
    const parts = time.split(':');
    const h = Number(parts[0] ?? 0);
    const m = parts[1] ?? '00';
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${ampm}`;
  };

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#005963]">My Appointments</h1>
          <p className="mt-1 text-sm text-gray-700">Track your appointment requests and status.</p>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
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
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDisplayDate(a.appointment_date) || a.appointment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatTime12h(a.appointment_time)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.symptoms || '-'}</td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No appointments yet.</td>
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

UserAppointments.layout = (page) => <UserLayout>{page}</UserLayout>;
