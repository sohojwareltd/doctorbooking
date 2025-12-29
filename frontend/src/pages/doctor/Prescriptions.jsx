import { Head, Link } from '@inertiajs/react';
import { FileText, PlusCircle } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayFromDateLike, formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function DoctorPrescriptions({ prescriptions = [] }) {
  return (
    <>
      <Head title="Prescriptions" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-[#00acb1]/20 bg-white/60 p-2">
              <FileText className="h-6 w-6 text-[#005963]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#005963]">Prescriptions</h1>
              <p className="mt-1 text-sm text-gray-700">View and create prescriptions for your patients.</p>
            </div>
          </div>

          <Link
            href="/doctor/prescriptions/create"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00acb1] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#00acb1]/30"
          >
            <PlusCircle className="h-4 w-4" />
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
                  <th className="px-4 py-3 text-right text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#00acb1]/5">
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{p.user?.name || p.user_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDisplayFromDateLike(p.created_at) || p.created_at}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{p.diagnosis}</td>
                    <td className="px-4 py-3 text-sm whitespace-pre-wrap text-gray-800">{p.medications}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.next_visit_date ? (formatDisplayDateWithYearFromDateLike(p.next_visit_date) || p.next_visit_date) : '-'}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/doctor/prescriptions/${p.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-sm font-semibold text-[#005963]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
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
