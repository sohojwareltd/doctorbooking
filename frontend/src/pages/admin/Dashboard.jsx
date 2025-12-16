import { Head } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminDashboard({ stats = {} }) {
  return (
    <>
      <Head title="Admin Dashboard" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">Admin Overview</h1>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <div className="text-sm text-gray-500">Users</div>
            <div className="mt-2 text-3xl font-bold">{stats.users ?? 0}</div>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm text-gray-500">Appointments Today</div>
            <div className="mt-2 text-3xl font-bold">{stats.appointmentsToday ?? 0}</div>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm text-gray-500">Pending Appointments</div>
            <div className="mt-2 text-3xl font-bold">{stats.pendingAppointments ?? 0}</div>
          </div>
        </div>
      </div>
    </>
  );
}

AdminDashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
