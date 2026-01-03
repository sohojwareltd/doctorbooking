import { Head } from '@inertiajs/react';
import { BarChart3, Users, Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Reports({ stats = {}, recent_appointments = [] }) {
  const statisticsCards = [
    { 
      label: 'Total Users', 
      value: stats.total_users || 0, 
      icon: Users, 
      color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' 
    },
    { 
      label: 'Total Appointments', 
      value: stats.total_appointments || 0, 
      icon: Calendar, 
      color: 'bg-sky-50 text-sky-700 border-sky-200' 
    },
    { 
      label: 'Total Prescriptions', 
      value: stats.total_prescriptions || 0, 
      icon: FileText, 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      label: 'Total Patients', 
      value: stats.total_patients || 0, 
      icon: Users, 
      color: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
  ];

  const appointmentStatusCards = [
    { 
      label: 'Pending', 
      value: stats.pending_appointments || 0, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    { 
      label: 'Approved', 
      value: stats.approved_appointments || 0, 
      icon: CheckCircle, 
      color: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    { 
      label: 'Completed', 
      value: stats.completed_appointments || 0, 
      icon: CheckCircle, 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      label: 'Cancelled', 
      value: stats.cancelled_appointments || 0, 
      icon: XCircle, 
      color: 'bg-rose-50 text-rose-700 border-rose-200' 
    },
  ];

  return (
    <>
      <Head title="Reports" />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-[#005963]" />
          <h1 className="text-3xl font-bold text-[#005963]">Reports & Analytics</h1>
        </div>
        <p className="text-gray-600">Comprehensive overview of system statistics and performance</p>
      </div>

      <div className="space-y-6">
        {/* Main Statistics */}
        <div>
          <h2 className="text-lg font-bold text-[#005963] mb-4">System Overview</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statisticsCards.map((stat, idx) => (
              <GlassCard key={idx} variant="solid" className={`border-2 p-5 ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-3xl font-black">{stat.value}</div>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div>
          <h2 className="text-lg font-bold text-[#005963] mb-4">Appointment Status Breakdown</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {appointmentStatusCards.map((stat, idx) => (
              <GlassCard key={idx} variant="solid" className={`border-2 p-5 ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-3xl font-black">{stat.value}</div>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div>
          <h2 className="text-lg font-bold text-[#005963] mb-4">Recent Appointments</h2>
          <GlassCard variant="solid" hover={false} className="overflow-hidden border border-[#00acb1]/20">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Doctor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recent_appointments.length > 0 ? (
                    recent_appointments.map((appointment, idx) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#005963]">{appointment.user?.name || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#005963]">{appointment.doctor?.name || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {appointment.appointment_time || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            appointment.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            appointment.status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {appointment.status || '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-semibold">No appointments found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Additional Metrics */}
        <div>
          <h2 className="text-lg font-bold text-[#005963] mb-4">User Distribution</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <GlassCard variant="solid" className="border-2 p-5 bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Doctors</div>
              <div className="mt-2 text-3xl font-black">{stats.total_doctors || 0}</div>
            </GlassCard>
            <GlassCard variant="solid" className="border-2 p-5 bg-emerald-50 text-emerald-700 border-emerald-200">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Patients</div>
              <div className="mt-2 text-3xl font-black">{stats.total_patients || 0}</div>
            </GlassCard>
            <GlassCard variant="solid" className="border-2 p-5 bg-sky-50 text-sky-700 border-sky-200">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Admins</div>
              <div className="mt-2 text-3xl font-black">
                {(stats.total_users || 0) - (stats.total_patients || 0) - (stats.total_doctors || 0)}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}

Reports.layout = (page) => <AdminLayout>{page}</AdminLayout>;
