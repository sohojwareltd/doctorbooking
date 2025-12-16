import { Head } from '@inertiajs/react';
import UserLayout from '../../layouts/UserLayout';

export default function UserAppointments({ appointments = [] }) {
  return (
    <>
      <Head title="My Appointments" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">My Appointments</h1>
        <div className="overflow-hidden rounded-2xl border">
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
                  <td className="px-4 py-3 text-sm">{a.appointment_date}</td>
                  <td className="px-4 py-3 text-sm">{a.appointment_time}</td>
                  <td className="px-4 py-3 text-sm capitalize">{a.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.symptoms || '-'}</td>
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
      </div>
    </>
  );
}

UserAppointments.layout = (page) => <UserLayout>{page}</UserLayout>;
