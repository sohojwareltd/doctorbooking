import { Head } from '@inertiajs/react';
import UserLayout from '../../layouts/UserLayout';
import GlassCard from '../../components/GlassCard';

export default function UserPrescriptions({ prescriptions = [] }) {
  return (
    <>
      <Head title="My Prescriptions" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#005963]">My Prescriptions</h1>
          <p className="mt-1 text-sm text-gray-700">Your prescriptions from completed visits.</p>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Medications</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Next Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.created_at}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{p.diagnosis}</td>
                    <td className="px-4 py-3 text-sm whitespace-pre-wrap text-gray-700">{p.medications}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.next_visit_date || '-'}</td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No prescriptions found.</td>
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

UserPrescriptions.layout = (page) => <UserLayout>{page}</UserLayout>;
