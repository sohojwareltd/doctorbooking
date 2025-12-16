import { Head } from '@inertiajs/react';
import DoctorLayout from '../../layouts/DoctorLayout';

export default function DoctorDashboard({ stats = {} }) {
  return (
    <>
      <Head title="Doctor Dashboard" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">Dashboard</h1>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <div className="text-sm text-gray-500">Today's Appointments</div>
            <div className="mt-2 text-3xl font-bold">{stats.todayAppointments ?? 0}</div>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="mt-2 text-3xl font-bold">{stats.pending ?? 0}</div>
          </div>
        </div>
      </div>
    </>
  );
}

DoctorDashboard.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
