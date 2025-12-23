import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';

export default function DoctorPrescriptions({ prescriptions = [] }) {
  return (
    <>
      <Head title="Prescriptions" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Prescriptions</h1>
            <p className="mt-1 text-sm text-gray-700">View and create prescriptions for your patients.</p>
          </div>
          <Link
            href="/doctor/prescriptions/create"
            className="inline-flex items-center justify-center rounded-full bg-[#00acb1] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#00acb1]/30"
          >
            Create Prescription
          </Link>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Medications</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Next Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{p.user?.name || p.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.created_at}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{p.diagnosis}</td>
                    <td className="px-4 py-3 text-sm whitespace-pre-wrap text-gray-800">{p.medications}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.next_visit_date || '-'}</td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No prescriptions found.
                    </td>
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

DoctorPrescriptions.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
