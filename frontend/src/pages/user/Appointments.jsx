import { Head } from '@inertiajs/react';
import UserLayout from '../../layouts/UserLayout';
import GlassCard from '../../components/GlassCard';

export default function UserAppointments({ appointments = [] }) {
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
                    <td className="px-4 py-3 text-sm text-gray-700">{a.appointment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.appointment_time}</td>
                    <td className="px-4 py-3 text-sm font-semibold capitalize text-[#005963]">{a.status}</td>
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
