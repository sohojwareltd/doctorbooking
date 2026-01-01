import { Head, Link } from '@inertiajs/react';
import { CalendarCheck2, LayoutDashboard, Users } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';

export default function AdminDashboard({ stats = {} }) {
  return (
    <>
      <Head title="Assistant Dashboard" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
        <p className="mt-2 text-gray-600">Quick snapshot of platform activity.</p>
      </div>

      <div className="space-y-6">

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
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

          <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
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

          <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
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

        <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
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
    </>
  );
}

AdminDashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
