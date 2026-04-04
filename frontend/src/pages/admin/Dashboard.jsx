import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock, FileText, Users } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminDashboard({ stats = {} }) {
  const cards = [
    { label: 'Total Users', value: stats.users ?? 0, icon: Users, iconBg: 'bg-purple-50', iconColor: 'text-purple-400' },
    { label: 'Patients', value: stats.patients ?? 0, icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-400' },
    { label: 'Doctors', value: stats.doctors ?? 0, icon: Users, iconBg: 'bg-sky-50', iconColor: 'text-sky-400' },
    { label: 'Total Appointments', value: stats.totalAppointments ?? 0, icon: CalendarDays, iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
    { label: "Today's Appointments", value: stats.appointmentsToday ?? 0, icon: CalendarDays, iconBg: 'bg-orange-50', iconColor: 'text-orange-400' },
    { label: 'Scheduled Appointments', value: stats.scheduledAppointments ?? stats.pendingAppointments ?? 0, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-400' },
    { label: 'Total Prescriptions', value: stats.totalPrescriptions ?? 0, icon: FileText, iconBg: 'bg-rose-50', iconColor: 'text-rose-400' },
  ];

  return (
    <>
      <Head title="Admin Dashboard" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
        <p className="mt-2 text-gray-600">Quick snapshot of platform activity.</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{card.label}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-700">{card.value}</div>
                  </div>
                  <div className={`rounded-2xl ${card.iconBg} p-3.5`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-700">Site Content</div>
              <div className="text-sm text-gray-500">Edit homepage sections and text from Settings.</div>
            </div>
            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center rounded-full bg-[#00acb1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00787b] transition"
            >
              Open Content Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

AdminDashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
