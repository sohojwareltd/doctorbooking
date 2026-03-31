import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, CalendarCheck2, ClipboardList, ScrollText, LayoutDashboard, Users, TrendingUp, Clock, CheckCircle, XCircle, FileText, AlertCircle, UserCheck, Stethoscope, TestTube, ChevronRight, X, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';

export default function DoctorDashboard({ stats = {}, scheduledToday = [], recentAppointments = [], upcomingAppointment = null, inVisitAppointment = null, inVisitAppointments = [], awaitingTestsAppointments = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeVisitPatient, setActiveVisitPatient] = useState(inVisitAppointment || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', age: '', gender: '' });

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const { toastError, toastSuccess } = await import('../../utils/toast');
    if (!createForm.name || !createForm.phone || !createForm.age || !createForm.gender) {
      toastError('Please fill all fields.');
      return;
    }
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    const res = await fetch('/doctor/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
      },
      credentials: 'include',
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      toastSuccess('Appointment created successfully.');
      setShowCreateModal(false);
      setCreateForm({ name: '', phone: '', age: '', gender: '' });
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data.message || 'Failed to create appointment.');
    }
  };

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
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e2a4a] via-[#1e3a5f] to-[#c2692a] p-8 shadow-lg">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left text */}
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Doctor Control Center
              </div>
              <h1 className="text-3xl font-black leading-tight text-white lg:text-4xl">
                Manage patients, appointments,<br className="hidden lg:block" /> and prescriptions in one place.
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/70">
                This dashboard surfaces today's appointment pipeline, patient queue, and prescription activity so you can focus on care.
              </p>
            </div>

            {/* Right stat panels */}
            <div className="flex gap-4 lg:flex-shrink-0">
              <div className="rounded-xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm border border-white/15">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Today Appointments</div>
                <div className="mt-2 text-5xl font-black text-white">{defaultStats.todayAppointments}</div>
              </div>
              <div className="rounded-xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm border border-white/15">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Prescribed (Month)</div>
                <div className="mt-2 text-5xl font-black text-white">{defaultStats.prescribedThisMonth}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="mt-2 text-4xl font-black text-gray-900">{defaultStats.totalPatients}</p>
                <p className="mt-1 text-xs text-gray-400">All registered patients</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="mt-2 text-4xl font-black text-gray-900">{defaultStats.scheduled}</p>
                <p className="mt-1 text-xs text-gray-400">Confirmed for today</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Consultation</p>
                <p className="mt-2 text-4xl font-black text-gray-900">{defaultStats.inConsultation}</p>
                <p className="mt-1 text-xs text-gray-400">Currently in visit</p>
              </div>
              <div className="rounded-xl bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Awaiting Tests</p>
                <p className="mt-2 text-4xl font-black text-gray-900">{awaitingTestsAppointments?.length || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Pending test reports</p>
              </div>
              <div className="rounded-xl bg-orange-100 p-3">
                <TestTube className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500 mt-0.5">Most common actions, one click away.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-6 text-center hover:bg-orange-100 hover:shadow-md transition-all w-full"
            >
              <div className="rounded-2xl bg-orange-100 p-4 shadow-sm">
                <CalendarDays className="h-8 w-8 text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">New Appointment</span>
            </button>
            <Link
              href="/doctor/appointments"
              className="flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-6 text-center hover:bg-blue-100 hover:shadow-md transition-all"
            >
              <div className="rounded-2xl bg-blue-100 p-4 shadow-sm">
                <CalendarCheck2 className="h-8 w-8 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">All Appointments</span>
            </Link>
            <Link
              href="/doctor/prescriptions/create"
              className="flex flex-col items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-6 text-center hover:bg-green-100 hover:shadow-md transition-all"
            >
              <div className="rounded-2xl bg-green-100 p-4 shadow-sm">
                <FileText className="h-8 w-8 text-green-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">New Prescription</span>
            </Link>
            <Link
              href="/doctor/prescriptions"
              className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-center hover:bg-gray-100 hover:shadow-md transition-all"
            >
              <div className="rounded-2xl bg-gray-200 p-4 shadow-sm">
                <ScrollText className="h-8 w-8 text-gray-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">All Prescriptions</span>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Appointments List - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Appointment Featured Card */}
            {nextAppointment ? (
              <div
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition"
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
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No Upcoming Appointments</h3>
                    <p className="text-sm text-gray-600 mt-1">You don't have any scheduled appointments yet.</p>
                  </div>
                </div>
              </div>
            )}

            {/* In Visit Patient Featured Card */}
            {visitPatient ? (
              <div
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition"
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
              </div>
            ) : null}

            {/* Awaiting Test Results */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-amber-600" />
                    Awaiting Test Results
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {awaitingTestsAppointments?.length || 0} patient{(awaitingTestsAppointments?.length || 0) !== 1 ? 's' : ''} waiting for reports
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {awaitingTestsAppointments && awaitingTestsAppointments.length > 0 ? (
                      awaitingTestsAppointments.map((appointment, index) => (
                        <tr key={appointment.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                              {appointment.serial_no || index + 1}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-gray-900">{appointment.patient_name || 'Patient'}</div>
                            {appointment.symptoms && (
                              <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{appointment.symptoms}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-600">{appointment.appointment_time || '—'}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {appointment.prescription_id ? (
                              <Link
                                href={`/doctor/prescriptions/${appointment.prescription_id}?from=dashboard`}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#005963] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00434a] transition whitespace-nowrap"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Complete
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No prescription</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center">
                          <TestTube className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-400">No patients awaiting tests</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {awaitingTestsAppointments?.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-700">1</span> to <span className="font-semibold text-gray-700">{awaitingTestsAppointments.length}</span> of <span className="font-semibold text-gray-700">{awaitingTestsAppointments.length}</span> results
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Pipeline Status */}
          <div className="space-y-4">
            {/* Today's Appointments Table */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#1e2a4a]" />
                    Pipeline Status
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Live appointment distribution.</p>
                </div>
                <Link href="/doctor/appointments" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {todayAppointments && todayAppointments.length > 0 ? (
                      todayAppointments.map((appointment, index) => (
                        <tr
                          key={appointment.id || index}
                          onClick={() => setSelectedPatient(appointment)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <div className="h-7 w-7 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
                              {getDisplaySerial(appointment, index + 1)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-gray-900">{getPatientName(appointment)}</div>
                            {getPatientPhone(appointment) && (
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Phone className="h-3 w-3" />{getPatientPhone(appointment)}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-600">{formatTime(appointment.appointment_time) || '—'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center">
                          <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-400">No appointments today</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {todayAppointments?.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-700">1</span> to <span className="font-semibold text-gray-700">{todayAppointments.length}</span> of <span className="font-semibold text-gray-700">{todayAppointments.length}</span> results
                </div>
              )}
            </div>
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
            <div className="bg-gradient-to-r from-[#1e2a4a] to-[#1e3a5f] px-6 py-5">
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

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Create Appointment</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#005963] focus:outline-none"
                  placeholder="Patient name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#005963] focus:outline-none"
                  placeholder="+8801..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={createForm.age}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, age: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#005963] focus:outline-none"
                    placeholder="Age"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Gender</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#005963] focus:outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#005963] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00434a]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
