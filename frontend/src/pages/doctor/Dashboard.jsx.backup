import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  CalendarDays, ClipboardList, Users, Clock, CheckCircle,
  FileText, Stethoscope, TestTube, ChevronRight, X, Phone, Mail,
  UserPlus, Printer, Activity, Zap, ArrowRight, Star,
  CalendarClock, FlaskConical, BadgeCheck, CircleDot, Ban, Timer
} from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';

const STATUS_CONFIG = {
  scheduled:       { label: 'Scheduled',     bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',    icon: CalendarClock },
  arrived:         { label: 'Arrived',        bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',   icon: Timer },
  in_consultation: { label: 'In Progress',    bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500',  icon: Stethoscope },
  awaiting_tests:  { label: 'Awaiting Tests', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400',  icon: FlaskConical },
  prescribed:      { label: 'Completed',      bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500', icon: BadgeCheck },
  cancelled:       { label: 'Cancelled',      bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400',     icon: Ban },
};
const getStatusCfg = (s) => STATUS_CONFIG[s] || { label: s || 'Unknown', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', icon: CircleDot };

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];
const avatarColor = (name) => AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];

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

  const tabAppointments =
    activeTab === 'today' ? todayAppointments :
    activeTab === 'awaiting' ? awaitingList :
    todayAppointments.filter((a) => a.status === activeTab);

  const TABS = [
    { key: 'today',          label: 'Today',          count: todayAppointments.length,                                         color: 'blue' },
    { key: 'scheduled',      label: 'Scheduled',       count: todayAppointments.filter((a) => a.status === 'scheduled').length, color: 'blue' },
    { key: 'in_consultation',label: 'In Progress',     count: todayAppointments.filter((a) => a.status === 'in_consultation').length, color: 'violet' },
    { key: 'awaiting',       label: 'Awaiting Tests',  count: awaitingList.length,                                             color: 'orange' },
    { key: 'prescribed',     label: 'Completed',       count: todayAppointments.filter((a) => a.status === 'prescribed').length,color: 'emerald' },
  ];
  const TAB_COLORS = {
    blue:    'text-blue-600 border-blue-500',
    violet:  'text-violet-600 border-violet-500',
    orange:  'text-orange-600 border-orange-500',
    emerald: 'text-emerald-600 border-emerald-500',
  };

  return (
    <DoctorLayout title="Dashboard">
      <div className="space-y-5">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f2744] via-[#1e3a5f] to-[#1a5276] p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white opacity-5" />
          <div className="pointer-events-none absolute -bottom-10 right-28 h-36 w-36 rounded-full bg-teal-400 opacity-10" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 bg-opacity-20 text-teal-300">
                  <Activity className="h-3 w-3" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-white opacity-40">Doctor Portal</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                {greeting}, Dr. {(user?.name || 'Doctor').split(' ')[0]} 
              </h1>
              <p className="mt-0.5 text-xs text-white opacity-50">{todayStr}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: 'Appointments today', value: defaultStats.todayAppointments, cls: 'bg-blue-500 bg-opacity-20 text-blue-300 border border-blue-400 border-opacity-20' },
                  { label: 'In queue',            value: defaultStats.waitingPatients,   cls: 'bg-amber-500 bg-opacity-20 text-amber-300 border border-amber-400 border-opacity-20' },
                  { label: 'In consultation',     value: activeCount,                    cls: 'bg-violet-500 bg-opacity-20 text-violet-300 border border-violet-400 border-opacity-20' },
                  { label: 'Awaiting tests',      value: awaitingList.length,            cls: 'bg-orange-500 bg-opacity-20 text-orange-300 border border-orange-400 border-opacity-20' },
                ].map((f, i) => (
                  <div key={i} className={'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ' + f.cls}>
                    <span className="text-sm font-bold">{f.value}</span>
                    <span className="opacity-70 font-normal">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/doctor/schedule"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-lg"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                My Schedule
                <ChevronRight className="h-3 w-3 opacity-70" />
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white border-opacity-10 bg-white bg-opacity-5 hover:bg-opacity-10 active:scale-95 px-4 py-2.5 text-xs font-semibold text-white opacity-80 transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                New Appointment
              </button>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Today's Appts",  value: defaultStats.todayAppointments,  icon: CalendarDays,  from: 'from-blue-500',    to: 'to-blue-600' },
            { label: 'In Queue',       value: defaultStats.waitingPatients,     icon: Users,         from: 'from-amber-400',   to: 'to-amber-500' },
            { label: 'In Consult',     value: activeCount,                      icon: Stethoscope,   from: 'from-violet-500',  to: 'to-violet-600' },
            { label: 'Rx This Month',  value: defaultStats.prescribedThisMonth, icon: ClipboardList, from: 'from-emerald-500', to: 'to-emerald-600' },
            { label: 'Total Patients', value: defaultStats.totalPatients,       icon: Star,          from: 'from-teal-500',    to: 'to-teal-600' },
          ].map((s, i) => (
            <div key={i} className="group relative rounded-2xl bg-white border border-gray-100 p-4 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 leading-none">{s.label}</p>
                  <p className="mt-2 text-3xl font-black text-gray-900 leading-none">{s.value}</p>
                </div>
                <div className={'flex-shrink-0 rounded-xl bg-gradient-to-br p-2.5 shadow-md ' + s.from + ' ' + s.to}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN 2-COLUMN GRID */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* LEFT (2/3) */}
          <div className="lg:col-span-2 space-y-5">

            {/* ACTIVE PATIENT CARD */}
            {visitPatient ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white shadow-sm">
                <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-teal-600">In Consultation — Live</span>
                    </div>
                    <span className="rounded-full bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                      #{getSerial(visitPatient, 1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-start gap-4">
                    <div className={'h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ' + avatarColor(getName(visitPatient))}>
                      {getName(visitPatient)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">{getName(visitPatient)}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {visitPatient.type || 'General Visit'} &middot; {fmt(visitPatient.appointment_date)} at {fmtTime(visitPatient.appointment_time)}
                      </p>
                      {getPhone(visitPatient) && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{getPhone(visitPatient)}
                        </p>
                      )}
                      {visitPatient.symptoms && (
                        <div className="mt-2 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2 text-xs text-gray-700">
                          <span className="font-semibold text-teal-700">Symptoms: </span>{visitPatient.symptoms}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-36">
                      <button
                        onClick={async () => {
                          const ok = await updateStatus(visitPatient.id, 'prescribed');
                          if (ok) setActiveVisitPatient(null);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-600 active:scale-95 transition-all shadow-md"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Complete Visit
                      </button>
                      {visitPatient.prescription_id ? (
                        <Link
                          href={'/doctor/prescriptions/' + visitPatient.prescription_id}
                          className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-teal-200 px-4 py-2.5 text-xs font-bold text-teal-600 hover:bg-teal-50 active:scale-95 transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Edit Prescription
                        </Link>
                      ) : (
                        <Link
                          href={'/doctor/prescriptions/create?appointment_id=' + visitPatient.id}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Create Rx
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : upcomingAppointment ? (
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-gradient-to-r from-[#1e3a5f] via-blue-600 to-blue-400" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#1e3a5f]" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Next Appointment</span>
                    </div>
                    {(() => {
                      const cfg = getStatusCfg(upcomingAppointment.status);
                      return (
                        <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ' + cfg.bg + ' ' + cfg.text + ' ' + cfg.border}>
                          <span className={'h-1.5 w-1.5 rounded-full ' + cfg.dot} />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className={'h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 cursor-pointer ' + avatarColor(getName(upcomingAppointment))}
                      onClick={() => setSelectedPatient(upcomingAppointment)}
                    >
                      {getName(upcomingAppointment)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPatient(upcomingAppointment)}>
                      <h3 className="text-lg font-bold text-gray-900">{getName(upcomingAppointment)}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {upcomingAppointment.type || 'General Visit'} &middot; {fmt(upcomingAppointment.appointment_date)} at {fmtTime(upcomingAppointment.appointment_time)}
                      </p>
                      {getPhone(upcomingAppointment) && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{getPhone(upcomingAppointment)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-36">
                      <button
                        onClick={async () => {
                          setActiveVisitPatient({ ...upcomingAppointment, status: 'in_consultation' });
                          const ok = await updateStatus(upcomingAppointment.id, 'in_consultation');
                          if (!ok) setActiveVisitPatient(null);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-900 active:scale-95 transition-all shadow-md"
                      >
                        <Stethoscope className="h-3.5 w-3.5" /> Start Visit
                      </button>
                      {getPhone(upcomingAppointment) && (
                        <a
                          href={'tel:' + getPhone(upcomingAppointment)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call Patient
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* TABBED APPOINTMENTS TABLE */}
            <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
              {/* Tab bar */}
              <div className="px-5 pt-4 pb-0 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Appointments</h3>
                  <Link href="/doctor/appointments" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-500 hover:text-teal-700 transition">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-0">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const colorCls = isActive ? TAB_COLORS[tab.color] : 'text-gray-400 border-transparent hover:text-gray-600';
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-semibold border-b-2 transition-colors ' + colorCls}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-bold leading-none text-gray-600">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              {tabAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-10">#</th>
                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Patient</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Time</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Type</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                        <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tabAppointments.map((a, i) => {
                        const cfg = getStatusCfg(a.status);
                        const StatusIcon = cfg.icon;
                        const aColor = avatarColor(getName(a));
                        return (
                          <tr key={a.id || i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-bold text-gray-400">{getSerial(a, i + 1)}</span>
                            </td>
                            <td className="px-5 py-3.5 cursor-pointer" onClick={() => setSelectedPatient(a)}>
                              <div className="flex items-center gap-3">
                                <div className={'h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ' + aColor}>
                                  {getName(a)[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors">{getName(a)}</p>
                                  {getPhone(a) && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Phone className="h-2.5 w-2.5" />{getPhone(a)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 hidden md:table-cell">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-lg px-2 py-1">{fmtTime(a.appointment_time)}</span>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-gray-500 hidden lg:table-cell">{a.type || 'Consultation'}</td>
                            <td className="px-3 py-3.5">
                              <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap ' + cfg.bg + ' ' + cfg.text + ' ' + cfg.border}>
                                <StatusIcon className="h-2.5 w-2.5" />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {(a.status === 'scheduled' || a.status === 'arrived') && (
                                <button
                                  onClick={async () => {
                                    setActiveVisitPatient({ ...a, status: 'in_consultation' });
                                    const ok = await updateStatus(a.id, 'in_consultation');
                                    if (!ok) setActiveVisitPatient(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900 active:scale-95 transition-all"
                                >
                                  <Stethoscope className="h-2.5 w-2.5" /> Start
                                </button>
                              )}
                              {a.status === 'in_consultation' && (
                                <Link
                                  href={a.prescription_id ? '/doctor/prescriptions/' + a.prescription_id : '/doctor/prescriptions/create?appointment_id=' + a.id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all"
                                >
                                  <FileText className="h-2.5 w-2.5" /> Prescribe
                                </Link>
                              )}
                              {a.status === 'awaiting_tests' && a.prescription_id && (
                                <Link
                                  href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                                  className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 active:scale-95 transition-all"
                                >
                                  <FlaskConical className="h-2.5 w-2.5" /> Complete
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <CalendarDays className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No appointments found</p>
                  <p className="text-xs text-gray-300 mt-0.5">Try a different filter</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR (1/3) */}
          <div className="space-y-4">

            {/* Quick Actions */}
            <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'New Appointment', icon: CalendarDays,  from: 'from-blue-500',    to: 'to-blue-600',    action: 'modal' },
                  { label: 'New Prescription',icon: FileText,       from: 'from-emerald-500', to: 'to-emerald-600', href: '/doctor/prescriptions/create' },
                  { label: 'Add Patient',     icon: UserPlus,       from: 'from-violet-500',  to: 'to-violet-600',  action: 'modal' },
                  { label: 'Prescriptions',   icon: Printer,        from: 'from-orange-400',  to: 'to-orange-500',  href: '/doctor/prescriptions' },
                ].map((item, i) => {
                  const iconEl = (
                    <div className={'group flex flex-col items-center gap-2 rounded-xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md p-3.5 transition-all duration-200 cursor-pointer text-center'}>
                      <div className={'rounded-xl bg-gradient-to-br p-2.5 shadow-md ' + item.from + ' ' + item.to}>
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 leading-tight">{item.label}</span>
                    </div>
                  );
                  if (item.href) {
                    return <Link key={i} href={item.href}>{iconEl}</Link>;
                  }
                  return (
                    <button key={i} type="button" onClick={() => setShowCreateModal(true)} className="w-full text-left">
                      {iconEl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Awaiting Tests */}
            {awaitingList.length > 0 && (
              <div className="rounded-2xl bg-white border border-orange-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-800">Awaiting Tests</span>
                  </div>
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">{awaitingList.length}</span>
                </div>
                <div className="divide-y divide-orange-50">
                  {awaitingList.map((a, i) => (
                    <div key={a.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors">
                      <div className={'h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ' + avatarColor(a.patient_name || '')}>
                        {(a.patient_name || 'P')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.patient_name || 'Patient'}</p>
                        <p className="text-xs text-gray-400">{fmtTime(a.appointment_time)}</p>
                      </div>
                      {a.prescription_id && (
                        <Link
                          href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                          className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-orange-600 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                        >
                          Complete
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Scheduled */}
            <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#1e3a5f]" />
                  <h3 className="text-xs font-bold text-gray-900">Today's Schedule</h3>
                </div>
                <Link href="/doctor/prescriptions" className="inline-flex items-center gap-0.5 text-xs font-semibold text-teal-500 hover:text-teal-700 transition">
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {scheduledToday && scheduledToday.length > 0 ? scheduledToday.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className={'h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ' + avatarColor(getName(a))}>
                      {getName(a)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{getName(a)}</p>
                      <p className="text-xs text-gray-400">{fmt(a.appointment_date)}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      #{String(a.serial_no || i + 1).padStart(2, '0')}
                    </span>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <FileText className="h-8 w-8 text-gray-200 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-400">No schedule yet</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PATIENT DETAIL MODAL */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-screen overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#1e3a5f] to-blue-700 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={'h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white border-opacity-20 flex-shrink-0 ' + avatarColor(getName(selectedPatient))}>
                    {getName(selectedPatient)[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{getName(selectedPatient)}</h3>
                    <p className="text-sm text-white opacity-70 mt-0.5">
                      {fmt(selectedPatient.appointment_date)} at {fmtTime(selectedPatient.appointment_time)}
                    </p>
                    {(() => {
                      const cfg = getStatusCfg(selectedPatient.status);
                      return (
                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white border-opacity-20 bg-white bg-opacity-10 px-2.5 py-0.5 text-xs font-bold text-white">
                          <span className={'h-1.5 w-1.5 rounded-full ' + cfg.dot} />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-xl p-2 text-white opacity-60 hover:bg-white hover:bg-opacity-10 hover:opacity-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {getPhone(selectedPatient) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="rounded-xl bg-blue-100 p-2.5 flex-shrink-0">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase text-blue-400">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{getPhone(selectedPatient)}</p>
                  </div>
                  <a
                    href={'tel:' + getPhone(selectedPatient)}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition-all flex-shrink-0"
                  >
                    Call
                  </a>
                </div>
              )}
              {getEmail(selectedPatient) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="rounded-xl bg-emerald-100 p-2.5 flex-shrink-0">
                    <Mail className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase text-emerald-400">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{getEmail(selectedPatient)}</p>
                  </div>
                </div>
              )}
              {selectedPatient.symptoms && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <p className="text-xs font-semibold uppercase text-violet-400 mb-1">Symptoms</p>
                  <p className="text-sm text-gray-700">{selectedPatient.symptoms}</p>
                </div>
              )}
            </div>

            <div className="border-t bg-gray-50 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Close
              </button>
              <Link
                href={'/doctor/appointments?id=' + selectedPatient.id}
                className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 active:scale-95 transition-all"
              >
                View Appointment
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CREATE APPOINTMENT MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-100 p-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">New Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:outline-none transition"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:outline-none transition"
                  placeholder="+8801..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={createForm.age}
                    onChange={(e) => setCreateForm((p) => ({ ...p, age: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:outline-none transition"
                    placeholder="Age"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Gender
                  </label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:outline-none transition"
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600 active:scale-95 transition-all shadow-md"
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
