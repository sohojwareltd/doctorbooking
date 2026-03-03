import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, Users, TrendingUp, Clock, CheckCircle, XCircle, FileText, AlertCircle, UserCheck, Stethoscope, TestTube, ChevronRight, X, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';

export default function DoctorDashboard({ stats = {}, scheduledToday = [], recentAppointments = [], upcomingAppointment = null, inVisitAppointment = null, inVisitAppointments = [], awaitingTestsAppointments = [] }) {
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

  const getPatientName = (appointment) => {
    return appointment?.patient_name || appointment?.user?.name || 'Patient';
  };

  const getPatientPhone = (appointment) => {
    return appointment?.patient_phone || appointment?.user?.phone || null;
  };

  const getPatientEmail = (appointment) => {
    return appointment?.patient_email || appointment?.user?.email || null;
  };

  const getDisplaySerial = (appointment, fallback = 1) => {
    return appointment?.serial_no || fallback;
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

  const updateAppointmentStatus = async (appointmentId, status) => {
    if (!appointmentId) return false;

    try {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/doctor/appointments/${appointmentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        console.error(`Status update failed (${status}) - HTTP:`, res.status);
        return false;
      }

      router.reload({
        only: ['stats', 'recentAppointments', 'upcomingAppointment', 'inVisitAppointment', 'inVisitAppointments', 'awaitingTestsAppointments', 'scheduledToday'],
        preserveScroll: true,
      });

      return true;
    } catch (err) {
      console.error(`Status update error (${status}):`, err);
      return false;
    }
  };

  const visitPatient = activeVisitPatient || inVisitAppointment;
  const todayAppointments = [...(recentAppointments || [])].sort((a, b) => {
    const aTime = `${a.appointment_date || ''} ${a.appointment_time || ''}`.trim();
    const bTime = `${b.appointment_date || ''} ${b.appointment_time || ''}`.trim();
    return new Date(aTime) - new Date(bTime);
  });
  
  // Filter out the patient currently in visit AND any non-schedulable statuses
  const availableAppointments = todayAppointments.filter(a =>
    a.id !== visitPatient?.id &&
    ['scheduled', 'arrived'].includes(a.status)
  );
  const nextAppointment = availableAppointments[0] || null;
  const nextAppointmentSerial = nextAppointment ? getDisplaySerial(nextAppointment, 1) : null;
  const visitSerial = visitPatient ? getDisplaySerial(visitPatient, 1) : null;

  return (
    <DoctorLayout title="Dashboard">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.name || 'Doctor'}</p>
      </div>

      <div className="space-y-6">
        {/* Stats Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <GlassCard variant="solid" hover={false} className="p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Patients</div>
                <div className="mt-3 text-4xl font-black text-gray-900">{defaultStats.totalPatients}</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <Users className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today's Appointments</div>
                <div className="mt-3 text-4xl font-black text-gray-900">{defaultStats.todayAppointments}</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <CalendarDays className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scheduled</div>
                <div className="mt-3 text-4xl font-black text-gray-900">{defaultStats.scheduled}</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <CalendarDays className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">In Visit</div>
                <div className="mt-3 text-4xl font-black text-gray-900">{defaultStats.inConsultation}</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <Stethoscope className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prescribed (Month)</div>
                <div className="mt-3 text-4xl font-black text-gray-900">{defaultStats.prescribedThisMonth}</div>
              </div>
              <div className="rounded-xl bg-gray-100 p-3">
                <FileText className="h-6 w-6 text-gray-700" />
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
                className="overflow-hidden border border-gray-200 bg-white p-6 text-gray-900 shadow-sm cursor-pointer"
                onClick={() => setSelectedPatient(nextAppointment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center">{nextAppointmentSerial || 1}</div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Next Appointment</div>
                    </div>
                    <div className="mt-3 text-2xl font-black">{getPatientName(nextAppointment)}</div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold">{nextAppointment.type || 'General Visit'}</span> • {formatDate(nextAppointment.appointment_date)}, {formatTime(nextAppointment.appointment_time)}
                    </div>
                    {getPatientPhone(nextAppointment) && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {getPatientPhone(nextAppointment)}
                      </div>
                    )}
                    {nextAppointment.is_video && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                        <span className="text-lg">📹</span>
                        Video Appointment
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveVisitPatient({ ...nextAppointment, status: 'in_consultation' });
                      const ok = await updateAppointmentStatus(nextAppointment.id, 'in_consultation');
                      if (!ok) {
                        setActiveVisitPatient(null);
                      }
                    }}
                    className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-black transition shadow flex items-center justify-center gap-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Start Visit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (getPatientPhone(nextAppointment)) {
                        handleCall(getPatientPhone(nextAppointment));
                      }
                    }}
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard variant="solid" hover={false} className="p-6 border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No Upcoming Appointments</h3>
                    <p className="text-sm text-gray-600 mt-1">You don't have any scheduled appointments yet.</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* In Visit Patient Featured Card */}
            {visitPatient ? (
              <GlassCard 
                variant="solid" 
                hover={false} 
                className="overflow-hidden border border-gray-200 bg-white p-6 text-gray-900 shadow-sm cursor-pointer"
                onClick={() => setSelectedPatient(visitPatient)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center">{visitSerial || 1}</div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">In Visit</div>
                    </div>
                    <div className="mt-3 text-2xl font-black">{getPatientName(visitPatient)}</div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold">{visitPatient.type || 'General Visit'}</span> • {formatDate(visitPatient.appointment_date)}, {formatTime(visitPatient.appointment_time)}
                    </div>
                    {getPatientPhone(visitPatient) && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {getPatientPhone(visitPatient)}
                      </div>
                    )}
                    {visitPatient.symptoms && (
                      <div className="mt-3 text-xs text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                        <span className="font-semibold">Symptoms:</span> {visitPatient.symptoms}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await updateAppointmentStatus(visitPatient.id, 'prescribed');
                      if (ok) {
                        setActiveVisitPatient(null);
                      }
                    }}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-black transition shadow flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                  {visitPatient.prescription_id ? (
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      href={`/doctor/prescriptions/${visitPatient.prescription_id}`}
                      className="rounded-xl border border-[#005963] bg-[#005963]/5 px-4 py-2.5 text-center text-sm font-semibold text-[#005963] hover:bg-[#005963]/10 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Edit Prescription
                    </Link>
                  ) : (
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      href={`/doctor/prescriptions/create?appointment_id=${visitPatient.id}&selectedPatient=${encodeURIComponent(JSON.stringify({
                        name: getPatientName(visitPatient),
                        phone: getPatientPhone(visitPatient),
                        age: visitPatient.user?.age,
                        gender: visitPatient.user?.gender,
                        weight: visitPatient.user?.weight,
                      }))}`}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Create Prescription
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(visitPatient);
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </GlassCard>
            ) : null}

            {/* Awaiting Test Results */}
            <GlassCard variant="solid" hover={false} className="p-6 border border-gray-200 bg-white shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-amber-600" />
                    Awaiting Test Results
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {awaitingTestsAppointments?.length || 0} patient{(awaitingTestsAppointments?.length || 0) !== 1 ? 's' : ''} waiting for reports
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {awaitingTestsAppointments && awaitingTestsAppointments.length > 0 ? (
                  awaitingTestsAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id || index}
                      className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {appointment.serial_no || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{appointment.patient_name || 'Patient'}</div>
                          <div className="text-xs text-amber-700 mt-0.5">{appointment.appointment_time}</div>
                          {appointment.symptoms && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              <span className="font-semibold">Symptoms:</span> {appointment.symptoms}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        {appointment.prescription_id ? (
                          <Link
                            href={`/doctor/prescriptions/${appointment.prescription_id}?from=dashboard`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005963] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#00434a] whitespace-nowrap"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Add Medicine &amp; Complete
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No prescription yet</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <TestTube className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-semibold text-sm">No patients awaiting tests</p>
                    <p className="text-xs text-gray-400 mt-1">All clear at the moment</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-4">
            {/* Today's Appointments */}
            <GlassCard variant="solid" hover={false} className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Today's Appointments</h3>
                  <p className="text-sm text-gray-500 mt-1">Appointments scheduled for today</p>
                </div>
                <Link href="/doctor/appointments" className="text-gray-700 text-sm font-semibold hover:underline flex items-center gap-1">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {todayAppointments && todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment, index) => (
                    <div 
                      key={appointment.id || index} 
                      onClick={() => setSelectedPatient(appointment)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getDisplaySerial(appointment, index + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{getPatientName(appointment)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                          </div>
                          {getPatientPhone(appointment) && (
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {getPatientPhone(appointment)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center justify-end gap-3">
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap ${getStatusColor(appointment.status)}`}>
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
            <div className="bg-gray-900 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0 border-2 border-white/30">
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {getPatientName(selectedPatient)[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{getPatientName(selectedPatient)}</h3>
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
                    {getPatientPhone(selectedPatient) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{getPatientPhone(selectedPatient)}</div>
                        </div>
                        <button
                          onClick={() => handleCall(getPatientPhone(selectedPatient))}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      </div>
                    )}
                    {getPatientEmail(selectedPatient) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-green-100 p-2">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{getPatientEmail(selectedPatient)}</div>
                        </div>
                        <button
                          onClick={() => handleEmail(getPatientEmail(selectedPatient))}
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
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition"
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
