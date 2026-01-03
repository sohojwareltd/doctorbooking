import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import { formatDisplayFromDateLike, formatDisplayDate } from '../../utils/dateFormat';

export default function UserPrescriptions({ prescriptions = [] }) {
  const rows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);

  return (
    <>
      <Head title="My Prescriptions" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[#005963]/10 p-3">
            <FileText className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">My Prescriptions</h1>
            <p className="mt-1 text-sm text-gray-700">Your prescriptions from completed visits.</p>
          </div>
        </div>

        <GlassCard variant="solid" hover={false} className="overflow-hidden">
          <div className="border-b bg-white px-4 py-4">
            <div className="text-sm text-gray-700">
              Total prescriptions: <span className="font-semibold text-[#005963]">{pagination?.total ?? rows.length}</span>
            </div>
          </div>
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
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDisplayFromDateLike(p.created_at) || p.created_at}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{p.diagnosis}</td>
                    <td className="px-4 py-3 text-sm whitespace-pre-wrap text-gray-700">{p.medications}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.next_visit_date ? (formatDisplayDate(p.next_visit_date) || p.next_visit_date) : '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No prescriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination data={pagination} />
        </GlassCard>
      </div>
    </>
  );
}

UserPrescriptions.layout = (page) => <UserLayout>{page}</UserLayout>;
