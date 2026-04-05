import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  CalendarDays, ClipboardList, Users, Clock, CheckCircle,
  FileText, Stethoscope, Phone, Mail,
  UserPlus, ArrowRight,
  CalendarClock, FlaskConical
} from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import StatCard from '../../components/doctor/StatCard';
import StatusBadge, { getStatusConfig } from '../../components/doctor/StatusBadge';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocInput, DocSelect, DocCard, DocEmptyState } from '../../components/doctor/DocUI';

export default function DoctorDashboard({
  stats = {},
  scheduledToday = [],
  recentAppointments = [],
  upcomingAppointment = null,
  inVisitAppointment = null,
  inVisitAppointments = [],
  awaitingTestsAppointments = [],
}) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeVisitPatient, setActiveVisitPatient] = useState(inVisitAppointment || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', age: '', gender: '' });
  const [activeTab, setActiveTab] = useState('today');

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const { toastError, toastSuccess } = await import('../../utils/toast');
    if (!createForm.name || !createForm.phone || !createForm.age || !createForm.gender) {
      toastError('Please fill all fields.');
      return;
    }
    const token = document.cookie.split('; ').find((r) => r.startsWith('XSRF-TOKEN='))?.split('=')[1];
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
      toastSuccess('Appointment created!');
      setShowCreateModal(false);
      setCreateForm({ name: '', phone: '', age: '', gender: '' });
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data.message || 'Failed to create appointment.');
    }
  };

  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

  const defaultStats = {
    todayAppointments: 0, scheduled: 0, totalPatients: 0,
    totalPrescriptions: 0, prescribedThisMonth: 0, inConsultation: 0,
    waitingPatients: 0, followUpsDue: 0, ...stats,
  };

  const fmt = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const fmtTime = (t) => t || '';
  const getName = (a) => a?.patient_name || a?.user?.name || 'Patient';
  const getPhone = (a) => a?.patient_phone || a?.user?.phone || null;
  const getEmail = (a) => a?.patient_email || a?.user?.email || null;
  const getSerial = (a, fallback) => a?.serial_no || fallback;

  const updateStatus = async (id, status) => {
    if (!id) return false;
    try {
      const res = await fetch('/doctor/appointments/' + id + '/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      router.reload({
        only: ['stats', 'recentAppointments', 'upcomingAppointment', 'inVisitAppointment', 'inVisitAppointments', 'awaitingTestsAppointments', 'scheduledToday'],
        preserveScroll: true,
      });
      return true;
    } catch {
      return false;
    }
  };

  const visitPatient = activeVisitPatient || inVisitAppointment;
  const todayAppointments = [...(recentAppointments || [])].sort((a, b) => {
    const at = (a.appointment_date || '') + ' ' + (a.appointment_time || '');
    const bt = (b.appointment_date || '') + ' ' + (b.appointment_time || '');
    return new Date(at) - new Date(bt);
  });
  const awaitingList = awaitingTestsAppointments || [];
  const activeCount = defaultStats.inConsultation || inVisitAppointments?.length || (visitPatient ? 1 : 0);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const doctorName = (user?.name || '').trim() || 'Doctor';
  const doctorDisplayName = /^dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`;

  const tabAppointments =
    activeTab === 'today' ? todayAppointments :
    activeTab === 'awaiting' ? awaitingList :
    todayAppointments.filter((a) => a.status === activeTab);

  const TABS = [
    { key: 'today',           label: 'All Today',       count: todayAppointments.length },
    { key: 'scheduled',       label: 'Scheduled',       count: todayAppointments.filter((a) => a.status === 'scheduled').length },
    { key: 'in_consultation', label: 'In Progress',     count: todayAppointments.filter((a) => a.status === 'in_consultation').length },
    { key: 'awaiting',        label: 'Awaiting Tests',  count: awaitingList.length },
    { key: 'prescribed',      label: 'Completed',       count: todayAppointments.filter((a) => a.status === 'prescribed').length },
  ];

  const completedCount = todayAppointments.filter((a) => a.status === 'prescribed').length;
  const heroMetrics = [
    {
      label: "Today's Appointments",
      value: defaultStats.todayAppointments,
      tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f8fbff]',
      href: '/doctor/appointments?date_filter=today',
      hoverTone: 'doc-banner-metric-sky',
      icon: CalendarDays,
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'In Queue',
      value: defaultStats.waitingPatients,
      tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#fff1e2]',
      href: '/doctor/appointments?status_filter=arrived',
      hoverTone: 'doc-banner-metric-amber',
      icon: Users,
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'In Progress',
      value: activeCount,
      tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#f3f7ff]',
      href: '/doctor/appointments?status_filter=in_consultation',
      hoverTone: 'doc-banner-metric-violet',
      icon: Stethoscope,
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Pending Tests',
      value: awaitingList.length,
      tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#fff0e2]',
      href: '/doctor/appointments?status_filter=awaiting_tests',
      hoverTone: 'doc-banner-metric-orange',
      icon: FlaskConical,
      iconTone: 'bg-white/20 border-white/30',
    },
  ];

  const statCardItems = [
    { label: 'Completed Today', value: completedCount, icon: CheckCircle, variant: 'emerald' },
    { label: 'Follow Ups Due', value: defaultStats.followUpsDue, icon: Clock, variant: 'amber' },
    { label: 'Total Patients', value: defaultStats.totalPatients, icon: Users, variant: 'cyan' },
    { label: 'Prescribed This Month', value: defaultStats.prescribedThisMonth, icon: ClipboardList, variant: 'violet' },
  ];

  return (
    <DoctorLayout title="Dashboard">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* GREETING BANNER */}
        <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#2f3d69]/20 bg-gradient-to-r from-[#253566] via-[#3a456a] to-[#be7846] text-white shadow-[0_22px_38px_-28px_rgba(37,51,89,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/12" />
          <div className="pointer-events-none absolute left-8 top-12 h-26 w-26 rounded-full bg-white/10" style={{ width: 110, height: 110 }} />
          <div className="pointer-events-none absolute -right-14 -top-12 h-32 w-32 rounded-full bg-[#efba92]/14" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <Clock className="h-3.5 w-3.5" />
                  Doctor Command Center
                </div>

                <p className="text-xs font-medium uppercase tracking-wider text-white/70">{todayStr}</p>
                <h1 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">
                  {greeting}, {doctorDisplayName}
                </h1>
                <p className="max-w-xl text-[13px] text-white/80">Patient flow, appointment queue, and prescription output are live.</p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Link
                    href="/doctor/schedule"
                    className="doc-banner-action group inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-[0.97]"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    My Schedule
                    <ArrowRight className="doc-banner-action-arrow h-3.5 w-3.5" />
                  </Link>
                  <DocButton onClick={() => setShowCreateModal(true)} className="doc-banner-action group !bg-[#c57945] !px-3 !py-1.5 !text-white hover:!bg-[#ad6639]">
                    <UserPlus className="h-4 w-4" />
                    New Appointment
                    <ArrowRight className="doc-banner-action-arrow h-3.5 w-3.5" />
                  </DocButton>
                  <Link
                    href="/doctor/prescriptions/create"
                    className="doc-banner-action group inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-[0.97]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Create Prescription
                    <ArrowRight className="doc-banner-action-arrow h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {heroMetrics.map((metric) => (
                  <Link key={metric.label} href={metric.href} className={`doc-banner-metric doc-banner-hover-card ${metric.hoverTone} group rounded-xl border px-3.5 py-2.5 ${metric.tone}`}>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${metric.iconTone}`}>
                          <metric.icon className="h-4 w-4" />
                        </span>
                        <span>{metric.label}</span>
                      </div>
                      <ArrowRight className="doc-banner-hover-icon h-3.5 w-3.5" />
                    </div>
                    <div className="mt-1.5 text-[1.8rem] font-black leading-none tracking-tight">{metric.value}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DocCard>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCardItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} variant={item.variant} />
          ))}
        </div>

        {/* Quick actions hidden for now */}

        {/* MAIN 2-COLUMN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACTIVE PATIENT CARD */}
            {visitPatient ? (
              <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">In Consultation</span>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      #{getSerial(visitPatient, 1)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <PatientAvatar name={getName(visitPatient)} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{getName(visitPatient)}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {visitPatient.type || 'General Visit'} &middot; {fmt(visitPatient.appointment_date)} at {fmtTime(visitPatient.appointment_time)}
                      </p>
                      {getPhone(visitPatient) && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{getPhone(visitPatient)}
                        </p>
                      )}
                      {visitPatient.symptoms && (
                        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Symptoms: </span>{visitPatient.symptoms}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 sm:min-w-[140px]">
                      <DocButton
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          const ok = await updateStatus(visitPatient.id, 'prescribed');
                          if (ok) setActiveVisitPatient(null);
                        }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Complete Visit
                      </DocButton>
                      {visitPatient.prescription_id ? (
                        <Link
                          href={'/doctor/prescriptions/' + visitPatient.prescription_id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
                        >
                          <FileText className="h-3.5 w-3.5" /> Edit Rx
                        </Link>
                      ) : (
                        <Link
                          href={'/doctor/prescriptions/create?appointment_id=' + visitPatient.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
                        >
                          <FileText className="h-3.5 w-3.5" /> Create Rx
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : upcomingAppointment ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Appointment</span>
                    </div>
                    <StatusBadge status={upcomingAppointment.status} size="xs" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="cursor-pointer" onClick={() => setSelectedPatient(upcomingAppointment)}>
                      <PatientAvatar name={getName(upcomingAppointment)} size="lg" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPatient(upcomingAppointment)}>
                      <h3 className="text-lg font-semibold text-slate-900">{getName(upcomingAppointment)}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {upcomingAppointment.type || 'General Visit'} &middot; {fmt(upcomingAppointment.appointment_date)} at {fmtTime(upcomingAppointment.appointment_time)}
                      </p>
                      {getPhone(upcomingAppointment) && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{getPhone(upcomingAppointment)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 sm:min-w-[140px]">
                      <DocButton
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          setActiveVisitPatient({ ...upcomingAppointment, status: 'in_consultation' });
                          const ok = await updateStatus(upcomingAppointment.id, 'in_consultation');
                          if (!ok) setActiveVisitPatient(null);
                        }}
                      >
                        <Stethoscope className="h-3.5 w-3.5" /> Start Visit
                      </DocButton>
                      {getPhone(upcomingAppointment) && (
                        <a
                          href={'tel:' + getPhone(upcomingAppointment)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* TABBED APPOINTMENTS TABLE */}
            <DocCard padding={false} className="overflow-hidden border border-[#d5dfef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_34px_-26px_rgba(30,41,59,0.75)]">
              <div className="border-b border-[#e6edf8] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f7ff_100%)] px-5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold tracking-wide text-slate-900">Appointments</h3>
                  <Link href="/doctor/appointments" className="inline-flex items-center gap-1 rounded-full border border-[#d8e4f8] bg-white px-2.5 py-1 text-xs font-semibold text-[#365aa6] shadow-sm transition hover:bg-[#f4f8ff]">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                        activeTab === tab.key
                          ? 'border-sky-500 bg-white text-sky-700'
                          : 'border-transparent text-slate-400 hover:bg-white/70 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                          activeTab === tab.key ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {tabAppointments.length > 0 ? (
                <div className="doc-table-scroll overflow-x-auto rounded-b-[24px] border-t border-[#e5ecf8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e8eef8] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4] w-10">#</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Patient</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4] hidden md:table-cell">Time</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4] hidden lg:table-cell">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tabAppointments.map((a, i) => (
                        <tr key={a.id || i} className="doc-table-row group border-l-2 border-transparent transition-colors even:bg-[#fbfdff] hover:border-[#d6e4fb] hover:bg-[#f8fbff]">
                          <td className="px-5 py-3.5">
                            <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl border border-[#e4ebf7] bg-white px-2.5 text-xs font-semibold text-[#5f7398] shadow-[0_8px_18px_-18px_rgba(37,53,102,0.6)]">{getSerial(a, i + 1)}</span>
                          </td>
                          <td className="px-5 py-3.5 cursor-pointer" onClick={() => setSelectedPatient(a)}>
                            <div className="flex items-center gap-3">
                              <PatientAvatar name={getName(a)} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-sky-700 transition-colors">{getName(a)}</p>
                                {getPhone(a) && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Phone className="h-2.5 w-2.5" />{getPhone(a)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 hidden md:table-cell">
                            <span className="rounded-md border border-[#dfe8f8] bg-white px-2 py-1 text-xs font-semibold text-[#4f6591]">{fmtTime(a.appointment_time)}</span>
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-500 hidden lg:table-cell">{a.type || 'Consultation'}</td>
                          <td className="px-3 py-3.5">
                            <StatusBadge status={a.status} size="xs" />
                          </td>
                          <td className="px-5 py-3.5">
                            {(a.status === 'scheduled' || a.status === 'arrived') && (
                              <DocButton
                                variant="primary"
                                size="xs"
                                className="!h-8 !min-w-[92px] !justify-center !rounded-lg !px-3 !text-xs !font-semibold"
                                onClick={async () => {
                                  setActiveVisitPatient({ ...a, status: 'in_consultation' });
                                  const ok = await updateStatus(a.id, 'in_consultation');
                                  if (!ok) setActiveVisitPatient(null);
                                }}
                              >
                                <Stethoscope className="h-2.5 w-2.5" /> Start
                              </DocButton>
                            )}
                            {a.status === 'in_consultation' && (
                              <Link
                                href={a.prescription_id ? '/doctor/prescriptions/' + a.prescription_id : '/doctor/prescriptions/create?appointment_id=' + a.id}
                                className="inline-flex h-8 min-w-[92px] items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.97]"
                              >
                                <FileText className="h-2.5 w-2.5" /> Prescribe
                              </Link>
                            )}
                            {a.status === 'awaiting_tests' && a.prescription_id && (
                              <Link
                                href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                                className="inline-flex h-8 min-w-[92px] items-center justify-center gap-1 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white transition hover:bg-orange-700 active:scale-[0.97]"
                              >
                                <FlaskConical className="h-2.5 w-2.5" /> Complete
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <DocEmptyState
                  icon={CalendarDays}
                  title="No appointments found"
                  description="Try selecting a different tab"
                />
              )}
            </DocCard>
          </div>

          {/* RIGHT SIDEBAR (1/3) */}
          <div className="space-y-5">

            {/* Awaiting Tests */}
            {awaitingList.length > 0 && (
              <DocCard padding={false}>
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-800">Awaiting Tests</span>
                  </div>
                  <span className="rounded-md bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">{awaitingList.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {awaitingList.map((a, i) => (
                    <div key={a.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <PatientAvatar name={a.patient_name || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{a.patient_name || 'Patient'}</p>
                        <p className="text-xs text-slate-400">{fmtTime(a.appointment_time)}</p>
                      </div>
                      {a.prescription_id && (
                        <Link
                          href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                          className="rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-orange-700 active:scale-[0.97] transition whitespace-nowrap flex-shrink-0"
                        >
                          Complete
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </DocCard>
            )}

            {/* Today's Schedule */}
            <DocCard padding={false} className="overflow-hidden border border-[#d5dfef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_34px_-26px_rgba(30,41,59,0.75)]">
              <div className="flex items-center justify-between border-b border-[#e6edf8] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f7ff_100%)] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold tracking-wide text-slate-900">Today's Schedule</h3>
                </div>
                <Link href="/doctor/appointments" className="inline-flex items-center gap-0.5 rounded-full border border-[#d8e4f8] bg-white px-2 py-1 text-xs font-semibold text-[#365aa6] shadow-sm transition hover:bg-[#f4f8ff]">
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-[#ecf1f9]">
                {scheduledToday && scheduledToday.length > 0 ? scheduledToday.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f7faff]">
                    <PatientAvatar name={getName(a)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{getName(a)}</p>
                      <p className="text-xs text-slate-400">{fmt(a.appointment_date)}</p>
                    </div>
                    <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-[#e0e9f8] bg-white px-1.5 text-xs font-bold text-[#6a7fa7]">
                      #{String(a.serial_no || i + 1).padStart(2, '0')}
                    </span>
                  </div>
                )) : (
                  <DocEmptyState icon={FileText} title="No schedule yet" />
                )}
              </div>
            </DocCard>
          </div>
        </div>
      </div>

      {/* PATIENT DETAIL MODAL */}
      <DocModal open={!!selectedPatient} onClose={() => setSelectedPatient(null)} size="md">
        {selectedPatient && (
          <>
            <div className="flex items-start gap-4 mb-5">
              <PatientAvatar name={getName(selectedPatient)} size="xl" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">{getName(selectedPatient)}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {fmt(selectedPatient.appointment_date)} at {fmtTime(selectedPatient.appointment_time)}
                </p>
                <div className="mt-2"><StatusBadge status={selectedPatient.status} /></div>
              </div>
            </div>

            <div className="space-y-3">
              {getPhone(selectedPatient) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-sky-100 p-2 flex-shrink-0">
                    <Phone className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{getPhone(selectedPatient)}</p>
                  </div>
                  <a href={'tel:' + getPhone(selectedPatient)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 active:scale-[0.97] transition">Call</a>
                </div>
              )}
              {getEmail(selectedPatient) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="rounded-lg bg-emerald-100 p-2 flex-shrink-0">
                    <Mail className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{getEmail(selectedPatient)}</p>
                  </div>
                </div>
              )}
              {selectedPatient.symptoms && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Symptoms</p>
                  <p className="text-sm text-slate-700">{selectedPatient.symptoms}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <DocButton variant="secondary" size="sm" onClick={() => setSelectedPatient(null)}>Close</DocButton>
              <Link href={'/doctor/appointments?id=' + selectedPatient.id} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 active:scale-[0.97] transition">
                View Appointment
              </Link>
            </div>
          </>
        )}
      </DocModal>

      {/* CREATE APPOINTMENT MODAL */}
      <DocModal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Appointment" icon={CalendarDays}>
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <DocInput label="Patient Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" required />
          <DocInput label="Phone Number" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+8801..." required />
          <div className="grid grid-cols-2 gap-3">
            <DocInput label="Age" type="number" min="1" max="150" value={createForm.age} onChange={(e) => setCreateForm((p) => ({ ...p, age: e.target.value }))} placeholder="Age" required />
            <DocSelect label="Gender" value={createForm.gender} onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value }))} required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </DocSelect>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <DocButton type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</DocButton>
            <DocButton type="submit" variant="primary" size="sm">Create Appointment</DocButton>
          </div>
        </form>
      </DocModal>
    </DoctorLayout>
  );
}
