import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock, FileText, Users } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';

export default function AdminDashboard({ stats = {} }) {
  const cards = [
    { label: 'Total Users', value: stats.users ?? 0, icon: Users, accent: 'bg-[#005963]/10 text-[#005963]' },
    { label: 'Patients', value: stats.patients ?? 0, icon: Users, accent: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Doctors', value: stats.doctors ?? 0, icon: Users, accent: 'bg-sky-50 text-sky-700 border-sky-200' },
    { label: 'Total Appointments', value: stats.totalAppointments ?? 0, icon: CalendarDays, accent: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: "Today's Appointments", value: stats.appointmentsToday ?? 0, icon: CalendarDays, accent: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
    { label: 'Pending Appointments', value: stats.pendingAppointments ?? 0, icon: Clock, accent: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Total Prescriptions', value: stats.totalPrescriptions ?? 0, icon: FileText, accent: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  return (
    <>
      <Head title="Admin Dashboard" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
        <p className="mt-2 text-gray-600">Quick snapshot of platform activity.</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <GlassCard key={idx} variant="solid" className={`border-2 p-5 ${card.accent?.includes('border-') ? card.accent : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</div>
                    <div className="mt-3 text-3xl font-black text-[#005963]">{card.value}</div>
                  </div>
                  <div className={`rounded-xl ${card.accent?.split(' ')[0] || 'bg-[#005963]/10'} p-3`}>
                    <Icon className="h-6 w-6 text-[#005963]" />
                  </div>
                </div>
              </GlassCard>
            );
          })}
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
