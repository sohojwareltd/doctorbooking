import { Link, usePage, router } from '@inertiajs/react';
import { CalendarDays, Users, TrendingUp, Clock, FileText, Plus } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import { useEffect, useState } from 'react';

export default function DoctorDashboard({ stats = {}, recentAppointments = [], todaysAppointments: todaysAppointmentsProp = [], upcomingAppointment = null }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Safe default values
  const defaultStats = {
    todayAppointments: 0,
    pending: 0,
    totalPatients: 0,
    ...stats,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-700 border border-blue-200';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border border-yellow-200';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border border-red-200';
      case 'completed':
        return 'bg-green-500/20 text-green-700 border border-green-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border border-gray-200';
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDate(todayIso) || todayIso;

  const todaysAppointments = Array.isArray(todaysAppointmentsProp)
    ? todaysAppointmentsProp
    : [];

  // Auto-refresh dashboard data every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      router.reload({
        only: ['stats', 'recentAppointments', 'todaysAppointments', 'upcomingAppointment'],
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setIsRefreshing(false),
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.reload({
      only: ['stats', 'recentAppointments', 'todaysAppointments', 'upcomingAppointment'],
      preserveScroll: true,
      preserveState: true,
      onFinish: () => setIsRefreshing(false),
    });
  };

  return (
    <DoctorLayout title="Dashboard">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.name || 'Doctor'}</p>
      </div>

      <div className="space-y-6">
        {/* Stats Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Patients Card */}
          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-[#005963]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Patients</div>
                <div className="mt-3 text-4xl font-black text-[#005963]">{defaultStats.totalPatients}</div>
              </div>
              <div className="rounded-xl bg-[#005963]/10 p-3">
                <Users className="h-6 w-6 text-[#005963]" />
              </div>
            </div>
          </GlassCard>

          {/* Appointments Today Card */}
          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-[#00acb1]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today's Appointments</div>
                <div className="mt-3 text-4xl font-black text-[#00acb1]">{defaultStats.todayAppointments}</div>
              </div>
              <div className="rounded-xl bg-[#00acb1]/10 p-3">
                <CalendarDays className="h-6 w-6 text-[#00acb1]" />
              </div>
            </div>
          </GlassCard>

          {/* Pending Reviews Card */}
          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-yellow-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Reviews</div>
                <div className="mt-3 text-4xl font-black text-yellow-600">{defaultStats.pending}</div>
              </div>
              <div className="rounded-xl bg-yellow-500/10 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats Card */}
          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-[#005963]/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent Activity</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {recentAppointments.length} appointments in last 7 days
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <span className="text-[#005963]">Today:</span> {todayLabel}
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="rounded-lg border border-[#005963]/30 px-3 py-1 text-xs font-semibold text-[#005963] hover:bg-[#005963]/5 transition disabled:opacity-60"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh now'}
                  </button>
                </div>
        </div>
              </div>
            </GlassCard>
          </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Appointments List - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard variant="solid" hover={false} className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#005963]">Today's Appointments</h3>
                  <p className="text-sm text-gray-500 mt-1">Appointments scheduled for today</p>
                </div>
                <Link href="/doctor/appointments" className="text-[#005963] text-sm font-semibold hover:underline flex items-center gap-1">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {todaysAppointments && todaysAppointments.length > 0 ? (
                  todaysAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id || index}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer"
                      onClick={() => router.visit(`/doctor/appointments?focus=${appointment.id || ''}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-[#005963] to-[#00acb1] flex-shrink-0">
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                            {(appointment.user?.name || 'P')[0].toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{appointment.user?.name || 'Patient'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                          {appointment.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <GlassCard variant="solid" hover={false} className="p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#005963]">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/doctor/appointments"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#005963] px-4 py-3 text-sm font-semibold text-white hover:bg-[#00434a] transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Appointment
                </Link>
                <Link
                  href="/doctor/prescriptions/create"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#005963]/30 bg-white px-4 py-3 text-sm font-semibold text-[#005963] hover:bg-[#005963]/5 transition"
                >
                  <FileText className="h-4 w-4" />
                  Create Prescription
                </Link>
                <Link
                  href="/doctor/appointments"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#005963]/30 bg-white px-4 py-3 text-sm font-semibold text-[#005963] hover:bg-[#005963]/5 transition"
                >
                  <CalendarDays className="h-4 w-4" />
                  View Appointments
                </Link>
                <Link
                  href="/doctor/schedule"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#005963]/30 bg-white px-4 py-3 text-sm font-semibold text-[#005963] hover:bg-[#005963]/5 transition"
                >
                  <Clock className="h-4 w-4" />
                  Manage Availability
                </Link>
              </div>
            </GlassCard>

            {/* Quick Stats */}
            <GlassCard variant="solid" hover={false} className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-900">Active Patients</div>
                  <div className="mt-2 text-3xl font-black text-blue-600">{defaultStats.totalPatients}</div>
                </div>
                <div className="h-px bg-gradient-to-r from-blue-300 to-transparent"></div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-semibold">Latest Updates</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• {defaultStats.todayAppointments} appointment{defaultStats.todayAppointments !== 1 ? 's' : ''} today</li>
                    <li>• {defaultStats.pending} review{defaultStats.pending !== 1 ? 's' : ''} pending</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
