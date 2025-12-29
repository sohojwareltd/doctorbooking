import { Head } from '@inertiajs/react';
import { CalendarDays, LayoutDashboard } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';

export default function DoctorDashboard({ stats = {} }) {
  return (
    <>
      <Head title="Doctor Dashboard" />
      <div className="w-full px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-[#005963]/10 p-3">
            <LayoutDashboard className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-700">Your day at a glance.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Today's Appointments</div>
                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.todayAppointments ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-[#005963]/10 p-3">
                <CalendarDays className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.pending ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-[#005963]/10 p-3">
                <LayoutDashboard className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

DoctorDashboard.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
