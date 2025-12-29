import { Head, Link } from '@inertiajs/react';
import { CalendarCheck2, LayoutDashboard, Users } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';

export default function AdminDashboard({ stats = {} }) {
  return (
    <>
      <Head title="Assistant Dashboard" />
      <div className="w-full px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-[#005963]/10 p-3">
            <LayoutDashboard className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Assistant Overview</h1>
            <p className="mt-1 text-sm text-gray-700">Quick snapshot of platform activity.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Users</div>
                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.users ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-[#005963]/10 p-3">
                <Users className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Appointments Today</div>
                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.appointmentsToday ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-[#005963]/10 p-3">
                <CalendarCheck2 className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Pending Appointments</div>
                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.pendingAppointments ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-[#005963]/10 p-3">
                <LayoutDashboard className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>
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
                Open Content Settings
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

AdminDashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
