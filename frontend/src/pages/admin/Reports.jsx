import { Head } from '@inertiajs/react';
import { BarChart3, Users, Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle, UserCheck, Stethoscope, TestTube } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Reports({ stats = {}, recent_appointments = [] }) {
  const statisticsCards = [
    { label: 'Total Users', value: stats.total_users || 0, icon: Users, iconBg: 'bg-purple-50', iconColor: 'text-purple-400' },
    { label: 'Total Appointments', value: stats.total_appointments || 0, icon: Calendar, iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
    { label: 'Total Prescriptions', value: stats.total_prescriptions || 0, icon: FileText, iconBg: 'bg-green-50', iconColor: 'text-green-400' },
    { label: 'Total Patients', value: stats.total_patients || 0, icon: Users, iconBg: 'bg-orange-50', iconColor: 'text-orange-400' },
  ];

  const appointmentStatusCards = [
    { label: 'Scheduled', value: stats.scheduled_appointments || 0, icon: Clock, iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
    { label: 'Arrived', value: stats.arrived_appointments || 0, icon: UserCheck, iconBg: 'bg-amber-50', iconColor: 'text-amber-400' },
    { label: 'In Consultation', value: stats.in_consultation_appointments || 0, icon: Stethoscope, iconBg: 'bg-purple-50', iconColor: 'text-purple-400' },
    { label: 'Awaiting Tests', value: stats.awaiting_tests_appointments || 0, icon: TestTube, iconBg: 'bg-orange-50', iconColor: 'text-orange-400' },
    { label: 'Prescribed', value: stats.prescribed_appointments || 0, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-400' },
    { label: 'Cancelled', value: stats.cancelled_appointments || 0, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-400' },
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
          <h2 className="text-lg font-semibold text-gray-700 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {statisticsCards.map((stat, idx) => (
              <div key={idx} className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-700">{stat.value}</div>
                  </div>
                  <div className={`rounded-2xl ${stat.iconBg} p-3.5`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Appointment Status Breakdown</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {appointmentStatusCards.map((stat, idx) => (
              <div key={idx} className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-700">{stat.value}</div>
                  </div>
                  <div className={`rounded-2xl ${stat.iconBg} p-3.5`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Appointments</h2>
          <div className="rounded-3xl border border-gray-100/80 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100/80">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">#</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Patient</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Doctor</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Time</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent_appointments.length > 0 ? (
                    recent_appointments.map((appointment, idx) => (
                      <tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{appointment.serial_no || (idx + 1)}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-gray-700">{appointment.patient_name || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-gray-700">{appointment.doctor_name || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                          {formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">
                          {appointment.appointment_time || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            appointment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-700 border border-blue-200' :
                            appointment.status === 'arrived' ? 'bg-amber-500/20 text-amber-700 border border-amber-200' :
                            appointment.status === 'in_consultation' ? 'bg-purple-500/20 text-purple-700 border border-purple-200' :
                            appointment.status === 'awaiting_tests' ? 'bg-orange-500/20 text-orange-700 border border-orange-200' :
                            appointment.status === 'prescribed' ? 'bg-green-500/20 text-green-700 border border-green-200' :
                            appointment.status === 'pending' ? 'bg-amber-500/20 text-amber-700 border border-amber-200' :
                            appointment.status === 'approved' ? 'bg-blue-500/20 text-blue-700 border border-blue-200' :
                            appointment.status === 'completed' ? 'bg-green-500/20 text-green-700 border border-green-200' :
                            'bg-red-500/20 text-red-700 border border-red-200'
                          }`}>
                            {(appointment.status || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center">
                        <AlertCircle className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700">No appointments found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">User Distribution</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-gray-700">Total Doctors</div>
              <div className="mt-2 text-3xl font-bold text-gray-700">{stats.total_doctors || 0}</div>
            </div>
            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-gray-700">Total Patients</div>
              <div className="mt-2 text-3xl font-bold text-gray-700">{stats.total_patients || 0}</div>
            </div>
            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-gray-700">Total Admins</div>
              <div className="mt-2 text-3xl font-bold text-gray-700">
                {(stats.total_users || 0) - (stats.total_patients || 0) - (stats.total_doctors || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Reports.layout = (page) => <AdminLayout>{page}</AdminLayout>;
