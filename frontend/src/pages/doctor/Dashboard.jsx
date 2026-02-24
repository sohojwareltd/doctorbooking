import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, Users, TrendingUp, Clock, CheckCircle, XCircle, FileText, AlertCircle, UserCheck, Stethoscope, TestTube, ChevronRight, X, Phone, Mail, MapPin, Plus } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';

export default function DoctorDashboard({ stats = {}, scheduledToday = [], recentAppointments = [], upcomingAppointment = null, inVisitAppointment = null, inVisitAppointments = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeVisitPatient, setActiveVisitPatient] = useState(inVisitAppointment || null);

  // Get auth token from meta tag or localStorage
  const getAuthToken = () => {
    const token = document.querySelector('meta[name="csrf-token"]')?.content ||
                  localStorage.getItem('auth_token') ||
                  document.querySelector('meta[name="auth-token"]')?.content;
    return token;
  };

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
  };

  // Safe default values
  const defaultStats = {
    todayAppointments: 0,
    scheduled: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    prescribedThisMonth: 0,
    inConsultation: 0,
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
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-700 border border-blue-200';
      case 'arrived':
        return 'bg-amber-500/20 text-amber-700 border border-amber-200';
      case 'in_consultation':
        return 'bg-purple-500/20 text-purple-700 border border-purple-200';
      case 'awaiting_tests':
        return 'bg-orange-500/20 text-orange-700 border border-orange-200';
      case 'prescribed':
        return 'bg-green-500/20 text-green-700 border border-green-200';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border border-red-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'Scheduled';
      case 'arrived':
        return 'Arrived';
      case 'in_consultation':
        return 'In Consultation';
      case 'awaiting_tests':
        return 'Awaiting Tests';
      case 'prescribed':
        return 'Prescribed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const visitPatient = activeVisitPatient || inVisitAppointment;
  const todayAppointments = [...(recentAppointments || [])].sort((a, b) => {
    const aTime = `${a.appointment_date || ''} ${a.appointment_time || ''}`.trim();
    const bTime = `${b.appointment_date || ''} ${b.appointment_time || ''}`.trim();
    return new Date(aTime) - new Date(bTime);
  });
  
  // Filter out the patient currently in visit to get the next appointment
  const availableAppointments = todayAppointments.filter(a => a.id !== visitPatient?.id);
  const nextAppointment = availableAppointments[0] || null;
  
  const getSerial = (appointment) => {
    if (!appointment || !todayAppointments.length) return null;
    const idx = todayAppointments.findIndex((a) => a.id === appointment.id);
    return idx >= 0 ? idx + 1 : null;
  };
  const nextAppointmentSerial = nextAppointment ? (getSerial(nextAppointment) ?? 1) : null;
  const visitSerial = visitPatient ? (getSerial(visitPatient) ?? 1) : null;

  return (
    <DoctorLayout title="Dashboard">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.name || 'Doctor'}</p>
      </div>

      <div className="space-y-6">
        {/* Stats Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scheduled</div>
                <div className="mt-3 text-4xl font-black text-blue-600">{defaultStats.scheduled}</div>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-purple-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">In Visit</div>
                <div className="mt-3 text-4xl font-black text-purple-600">{defaultStats.inConsultation}</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Stethoscope className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border-l-4 border-l-green-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prescribed (Month)</div>
                <div className="mt-3 text-4xl font-black text-green-600">{defaultStats.prescribedThisMonth}</div>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Appointments List - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Appointment Featured Card */}
            {nextAppointment ? (
              <GlassCard 
                variant="solid" 
                hover={false} 
                className="overflow-hidden bg-gradient-to-br from-[#005963] via-[#00acb1] to-[#00d4db] p-6 text-white shadow-lg cursor-pointer"
                onClick={() => setSelectedPatient(nextAppointment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/30 text-white font-bold text-xs flex items-center justify-center">{nextAppointmentSerial || 1}</div>
                      <div className="text-xs font-semibold uppercase tracking-widest opacity-90">Next Appointment</div>
                    </div>
                    <div className="mt-3 text-2xl font-black">{nextAppointment.user?.name || 'Patient'}</div>
                    <div className="mt-2 text-sm opacity-95">
                      <span className="font-semibold">{nextAppointment.type || 'General Visit'}</span> • {formatDate(nextAppointment.appointment_date)}, {formatTime(nextAppointment.appointment_time)}
                    </div>
                    {nextAppointment.user?.phone && (
                      <div className="mt-2 text-xs opacity-90 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {nextAppointment.user.phone}
                      </div>
                    )}
                    {nextAppointment.is_video && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                        <span className="text-lg">📹</span>
                        Video Appointment
                      </div>
                    )}
                  </div>
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/50 bg-white/10 backdrop-blur-sm flex-shrink-0">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/10 text-3xl font-bold text-white">
                      {(upcomingAppointment.user?.name || 'P')[0].toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVisitPatient({ ...nextAppointment, status: 'in_consultation' });
                      const csrfToken = getCsrfToken();
                      fetch(`/doctor/appointments/${nextAppointment.id}/status`, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Accept': 'application/json',
                          'X-Requested-With': 'XMLHttpRequest',
                          ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
                        },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'in_consultation' })
                      }).then(res => {
                        if (!res.ok) console.error('Start visit error - Status:', res.status);
                        return res.json();
                      }).catch(err => console.error('Start visit fetch error:', err));
                    }}
                    className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-600 transition shadow flex items-center justify-center gap-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Start Visit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (nextAppointment.user?.phone) {
                        handleCall(nextAppointment.user.phone);
                      }
                    }}
                    className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#005963] hover:bg-gray-100 transition shadow flex items-center justify-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard variant="solid" hover={false} className="p-6 bg-blue-50 border-l-4 border-l-blue-400">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900">No Upcoming Appointments</h3>
                    <p className="text-sm text-blue-700 mt-1">You don't have any scheduled appointments yet.</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* In Visit Patient Featured Card */}
            {visitPatient ? (
              <GlassCard 
                variant="solid" 
                hover={false} 
                className="overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-6 text-white shadow-lg cursor-pointer"
                onClick={() => setSelectedPatient(visitPatient)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/30 text-white font-bold text-xs flex items-center justify-center">{visitSerial || 1}</div>
                      <div className="text-xs font-semibold uppercase tracking-widest opacity-90">In Visit</div>
                    </div>
                    <div className="mt-3 text-2xl font-black">{visitPatient.user?.name || 'Patient'}</div>
                    <div className="mt-2 text-sm opacity-95">
                      <span className="font-semibold">{visitPatient.type || 'General Visit'}</span> • {formatDate(visitPatient.appointment_date)}, {formatTime(visitPatient.appointment_time)}
                    </div>
                    {visitPatient.user?.phone && (
                      <div className="mt-2 text-xs opacity-90 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {visitPatient.user.phone}
                      </div>
                    )}
                    {visitPatient.symptoms && (
                      <div className="mt-3 text-xs opacity-90 bg-white/20 rounded-lg px-3 py-2">
                        <span className="font-semibold">Symptoms:</span> {visitPatient.symptoms}
                      </div>
                    )}
                  </div>
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/50 bg-white/10 backdrop-blur-sm flex-shrink-0">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/10 text-3xl font-bold text-white">
                      {(visitPatient.user?.name || 'P')[0].toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const csrfToken = getCsrfToken();
                      fetch(`/doctor/appointments/${visitPatient.id}/status`, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Accept': 'application/json',
                          'X-Requested-With': 'XMLHttpRequest',
                          ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
                        },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'prescribed' })
                      }).then(res => {
                        if (res.ok) {
                          setActiveVisitPatient(null);
                        } else {
                          console.error('Complete error - Status:', res.status);
                        }
                        return res.json();
                      }).catch(err => console.error('Complete fetch error:', err));
                    }}
                    className="rounded-xl bg-blue-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-600 transition shadow flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (visitPatient.user?.phone) {
                        handleCall(visitPatient.user.phone);
                      }
                    }}
                    className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-purple-600 hover:bg-gray-100 transition shadow flex items-center justify-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </button>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/doctor/prescriptions/create?appointmentId=${visitPatient.id}&selectedPatient=${encodeURIComponent(JSON.stringify({
                      name: visitPatient.user?.name,
                      phone: visitPatient.user?.phone,
                      age: visitPatient.user?.age,
                      gender: visitPatient.user?.gender,
                      weight: visitPatient.user?.weight,
                    }))}`}
                    className="rounded-xl bg-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/30 transition shadow flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Create Prescription
                  </Link>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/doctor/appointments/${visitPatient.id}`}
                    className="rounded-xl bg-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/30 transition shadow flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    View Details
                  </Link>
                </div>
              </GlassCard>
            ) : null}

            {/* Patients In Visit */}
            <GlassCard variant="solid" hover={false} className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#005963] flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-purple-600" />
                    In Visit / Consultation
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {inVisitAppointments?.length || 0} patient{(inVisitAppointments?.length || 0) !== 1 ? 's' : ''} in consultation
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {inVisitAppointments && inVisitAppointments.length > 0 ? (
                  inVisitAppointments.map((appointment, index) => (
                    <div 
                      key={appointment.id || index} 
                      onClick={() => setSelectedPatient(appointment)}
                      className="flex items-center justify-between rounded-xl border-2 border-purple-200 bg-white p-4 hover:bg-purple-50 hover:border-purple-300 transition cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex-shrink-0">
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                            {(appointment.user?.name || 'P')[0].toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{appointment.user?.name || 'Patient'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(appointment.appointment_time)}
                          </div>
                          {appointment.symptoms && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              <span className="font-semibold">Symptoms:</span> {appointment.symptoms}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <span className="rounded-full px-3 py-1 text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                          In Visit
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-semibold text-sm">No patients in consultation</p>
                    <p className="text-xs text-gray-400 mt-1">All clear at the moment</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-4">
            {/* Today's Appointments (moved to right column) */}
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
                {todayAppointments && todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment, index) => (
                    <div 
                      key={appointment.id || index} 
                      onClick={() => setSelectedPatient(appointment)}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-8 w-8 rounded-full bg-[#005963] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
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
                          {appointment.user?.phone && (
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
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
                    <li>• {defaultStats.scheduled} scheduled</li>
                    <li>• {defaultStats.prescribedThisMonth} prescribed this month</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Patient Info Modal */}
      {selectedPatient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0 border-2 border-white/30">
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {(selectedPatient.user?.name || 'P')[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPatient.user?.name || 'Patient'}</h3>
                    <p className="text-sm text-white/90 mt-1">
                      Appointment: {formatDate(selectedPatient.appointment_date)} at {formatTime(selectedPatient.appointment_time)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/20 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {selectedPatient.user?.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.phone}</div>
                        </div>
                        <button
                          onClick={() => handleCall(selectedPatient.user.phone)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      </div>
                    )}
                    {selectedPatient.user?.email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-green-100 p-2">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.email}</div>
                        </div>
                        <button
                          onClick={() => handleEmail(selectedPatient.user.email)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    )}
                    {selectedPatient.user?.address && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Address</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                {selectedPatient.symptoms && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Symptoms / Notes</h4>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-gray-700">{selectedPatient.symptoms}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Status</h4>
                  <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${getStatusColor(selectedPatient.status)}`}>
                    {getStatusLabel(selectedPatient.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <Link
                href={`/doctor/appointments?id=${selectedPatient.id}`}
                className="rounded-lg bg-[#005963] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00434a] transition"
              >
                View Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
