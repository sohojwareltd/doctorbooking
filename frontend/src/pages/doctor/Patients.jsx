import { Head } from '@inertiajs/react';
import { Users } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';

export default function Patients({ patients = [] }) {
  return (
    <>
      <Head title="Patients" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl border border-[#00acb1]/20 bg-white/60 p-2">
            <Users className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Patients</h1>
            <p className="mt-1 text-sm text-gray-700">List of patients who booked appointments with you.</p>
          </div>
        </div>

        <GlassCard variant="solid" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-[#00acb1]/5">
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.phone || '-'}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-gray-500">No patients yet.</td>
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

Patients.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
