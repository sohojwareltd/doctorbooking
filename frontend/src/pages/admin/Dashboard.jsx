import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';

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

        <div className="mt-8">
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-bold text-[#005963]">Site Content</div>
                <div className="text-sm text-gray-600">Edit homepage sections and text from Settings.</div>
              </div>
              <Link
                href="/admin/settings"
                className="inline-flex items-center justify-center rounded-full bg-[#00acb1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00787b] transition"
              >
                Open Settings
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

AdminDashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
