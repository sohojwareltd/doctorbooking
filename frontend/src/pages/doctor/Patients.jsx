import { Head } from '@inertiajs/react';
import DoctorLayout from '../../layouts/DoctorLayout';

export default function Patients({ patients = [] }) {
  return (
    <>
      <Head title="Patients" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">Patients</h1>
        <div className="overflow-hidden rounded-2xl border">
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
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm">{p.name}</td>
                  <td className="px-4 py-3 text-sm">{p.email}</td>
                  <td className="px-4 py-3 text-sm">{p.phone || '-'}</td>
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
      </div>
    </>
  );
}

Patients.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
