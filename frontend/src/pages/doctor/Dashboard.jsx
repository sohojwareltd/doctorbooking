import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
  Building2, CalendarDays, ClipboardList, Users, Clock, CheckCircle,
  FileText, Stethoscope, Phone, User, X,
  CalendarClock, FlaskConical, Hash
} from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import StatusBadge, { getStatusConfig } from '../../components/doctor/StatusBadge';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocInput, DocSelect, DocEmptyState } from '../../components/doctor/DocUI';

export default function DoctorDashboard({
  stats = {},
  scheduledToday = [],
  weeklyScheduleToday = [],
  isScheduleClosedToday = false,
  unavailableRanges = [],
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
  const [hideActiveVisitCard, setHideActiveVisitCard] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', age: '', gender: '' });
  const [activeTab, setActiveTab] = useState('today');
  const [scheduleTab, setScheduleTab] = useState('today');
  const performanceRange = 'today';

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const { toastError, toastSuccess } = await import('../../utils/toast');
    if (!createForm.name || !createForm.phone || !createForm.age || !createForm.gender) {
      toastError('Please fill all fields.');
      return;
    }
    const token = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
    const res = await fetch('/api/doctor/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
      credentials: 'same-origin',
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
  const getGender = (a) => String(a?.patient_gender || a?.user?.gender || '').toLowerCase();
  const getAge = (a) => a?.patient_age || a?.user?.age || null;
  const getEmail = (a) => a?.patient_email || a?.user?.email || null;
  const getSerial = (a, fallback) => a?.serial_no || fallback;
  const formatGender = (value) => {
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };
  const genderIconTone = (value) => {
    if (value === 'female') return 'border-pink-200 bg-pink-50 text-pink-600';
    if (value === 'male') return 'border-sky-200 bg-sky-50 text-sky-600';
    return 'border-slate-200 bg-slate-50 text-slate-500';
  };

  const updateStatus = async (id, status) => {
    if (!id) return false;
    try {
      const res = await fetch(`/api/doctor/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
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

  useEffect(() => {
    setHideActiveVisitCard(false);
  }, [activeVisitPatient?.id, inVisitAppointment?.id]);
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

  const formatRangeTime = (start, end) => {
    const startLabel = start ? fmtTime(start) : '-';
    const endLabel = end ? fmtTime(end) : '-';
    return `${startLabel} - ${endLabel}`;
  };

  const todayScheduleRows = (weeklyScheduleToday || []).map((row, idx) => ({
    id: `s-${row.id || idx}`,
    serial: idx + 1,
    range: formatRangeTime(row.start_time, row.end_time),
    chamber: row.chamber_name || 'Default chamber',
    slot: 'Available',
  }));

  const unavailableDateRows = (unavailableRanges || []).map((r, idx) => ({
    id: `u-${r.id || idx}`,
    serial: idx + 1,
    from: fmt(r.start_date) || r.start_date,
    to: fmt(r.end_date) || r.end_date,
    note: r.start_date === r.end_date ? 'Unavailable this day' : 'Unavailable range',
  }));

  const TABS = [
    { key: 'today',           label: 'All Today',       count: todayAppointments.length },
    { key: 'scheduled',       label: 'Scheduled',       count: todayAppointments.filter((a) => a.status === 'scheduled').length },
    { key: 'in_consultation', label: 'In Progress',     count: todayAppointments.filter((a) => a.status === 'in_consultation').length },
    { key: 'awaiting',        label: 'Awaiting Tests',  count: awaitingList.length },
    { key: 'prescribed',      label: 'Completed',       count: todayAppointments.filter((a) => a.status === 'prescribed').length },
  ];

  const getTabTone = (key) => {
    const tones = {
      today: {
        active: 'border-[#2D3A74] text-[#2D3A74]',
        idle: 'text-slate-600 hover:text-[#2D3A74]',
        badgeActive: 'bg-[#2D3A74]/10 text-[#2D3A74]',
        badgeIdle: 'bg-slate-100 text-slate-600',
      },
      scheduled: {
        active: 'border-slate-500 text-slate-700',
        idle: 'text-slate-600 hover:text-slate-700',
        badgeActive: 'bg-slate-100 text-slate-700',
        badgeIdle: 'bg-slate-100 text-slate-600',
      },
      in_consultation: {
        active: 'border-violet-500 text-violet-700',
        idle: 'text-violet-600 hover:text-violet-700',
        badgeActive: 'bg-violet-100 text-violet-700',
        badgeIdle: 'bg-violet-50 text-violet-600',
      },
      awaiting: {
        active: 'border-orange-500 text-orange-700',
        idle: 'text-orange-600 hover:text-orange-700',
        badgeActive: 'bg-orange-100 text-orange-700',
        badgeIdle: 'bg-orange-50 text-orange-600',
      },
      prescribed: {
        active: 'border-emerald-500 text-emerald-700',
        idle: 'text-emerald-600 hover:text-emerald-700',
        badgeActive: 'bg-emerald-100 text-emerald-700',
        badgeIdle: 'bg-emerald-50 text-emerald-600',
      },
    };

    return tones[key] || tones.today;
  };

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
    { label: 'Completed Today', value: completedCount, icon: CheckCircle, iconBg: 'bg-orange-50', iconColor: 'text-[#FF7C00]', desc: 'Consultations finished today.' },
    { label: 'Follow Ups Due', value: defaultStats.followUpsDue, icon: Clock, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', desc: 'Patients needing follow-up visits.' },
    { label: 'Total Patients', value: defaultStats.totalPatients, icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', desc: 'All registered patients.' },
    { label: 'Prescribed This Month', value: defaultStats.prescribedThisMonth, icon: ClipboardList, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', desc: 'Prescriptions written this month.' },
  ];

  const statusDefinitions = [
    { label: 'Scheduled', key: 'scheduled', color: '#3b82f6', match: (a) => a?.status === 'scheduled' },
    { label: 'In Progress', key: 'in_progress', color: '#6366f1', match: (a) => a?.status === 'in_consultation' },
    { label: 'Awaiting Tests', key: 'awaiting_tests', color: '#f59e0b', match: (a) => a?.status === 'awaiting_tests' },
    { label: 'Completed', key: 'completed', color: '#10b981', match: (a) => a?.status === 'prescribed' },
  ];

  const parseAppointmentDate = (appointment) => {
    if (!appointment?.appointment_date) return null;
    const parsed = new Date(appointment.appointment_date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const sameDay = (a, b) => (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );

  const sourceAppointments = Array.isArray(recentAppointments) && recentAppointments.length > 0
    ? recentAppointments
    : todayAppointments;

  const rangeAppointmentsRaw = sourceAppointments.filter((appointment) => {
    const date = parseAppointmentDate(appointment);
    if (!date) return performanceRange === 'today';

    if (performanceRange === 'today') {
      return sameDay(date, now);
    }

    if (performanceRange === '7days') {
      const rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 6);
      rangeStart.setHours(0, 0, 0, 0);
      return date >= rangeStart && date <= now;
    }

    if (performanceRange === 'month') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }

    if (performanceRange === 'year') {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  });

  const rangeAppointments = rangeAppointmentsRaw.length > 0 ? rangeAppointmentsRaw : todayAppointments;
  const rangeTotal = rangeAppointments.length;
  const statusWithMeta = statusDefinitions.map((status) => {
    const count = rangeAppointments.filter((appointment) => status.match(appointment)).length;
    const percent = rangeTotal > 0 ? Math.round((count / rangeTotal) * 100) : 0;
    return { ...status, count, percent };
  });

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyAppointments = Array(12).fill(0);

  sourceAppointments.forEach((appointment) => {
    const date = parseAppointmentDate(appointment);
    if (!date || date.getFullYear() !== now.getFullYear()) return;
    const monthIndex = date.getMonth();

    monthlyAppointments[monthIndex] += 1;
  });

  const monthlyChartWidth = 560;
  const monthlyChartHeight = 260;
  const monthlyPadX = 42;
  const monthlyPadTop = 24;
  const monthlyPadBottom = 34;
  const monthlyUsableHeight = monthlyChartHeight - monthlyPadTop - monthlyPadBottom;
  const monthlyUsableWidth = monthlyChartWidth - monthlyPadX * 2;
  const monthlyMax = Math.max(1, ...monthlyAppointments);
  const monthlyBarGap = monthlyUsableWidth / 12;
  const monthlyBarWidth = Math.max(10, monthlyBarGap * 0.58);
  const monthlyTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(monthlyMax * ratio));

  return (
    <DoctorLayout title="Dashboard" gradient>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* HERO BANNER — exact admin hero-panel */}
        <section className="hero-panel rounded-[28px] p-6 md:p-8 text-white">
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 mb-4">
                <Clock className="h-[11px] w-[11px]" />
                Doctor Command Center
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {greeting}, {doctorDisplayName}
              </h1>
              <p className="text-sm md:text-base text-white/80 max-w-2xl">
                This dashboard surfaces today's patient flow, appointment queue, and prescription output so you can act quickly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
              {heroMetrics.slice(0, 2).map((metric) => (
                <Link key={metric.label} href={metric.href} className="glass-card rounded-2xl p-4 transition hover:bg-white/[0.18]">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60 mb-1">{metric.label}</p>
                  <p className="text-3xl font-semibold">{metric.value}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* STAT CARDS — exact admin surface-card rounded-3xl p-5 */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCardItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="surface-card rounded-3xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                    <p className="text-3xl font-semibold text-[#2D3A74]">{item.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">{item.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-[#2D3A74]">Monthly Appointments</h3>
              <svg viewBox={`0 0 ${monthlyChartWidth} ${monthlyChartHeight}`} className="mt-3 w-full">
                {monthlyTicks.map((tick, index) => {
                  const y = monthlyPadTop + (1 - tick / Math.max(1, monthlyMax)) * monthlyUsableHeight;
                  return (
                    <g key={`${tick}-${index}`}>
                      <line x1={monthlyPadX} y1={y} x2={monthlyChartWidth - monthlyPadX} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                      <text x={monthlyPadX - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{tick}</text>
                    </g>
                  );
                })}

                {monthLabels.map((label, index) => {
                  const x = monthlyPadX + monthlyBarGap * index + (monthlyBarGap - monthlyBarWidth) / 2;
                  const value = monthlyAppointments[index] || 0;
                  const barHeight = (value / Math.max(1, monthlyMax)) * monthlyUsableHeight;
                  const y = monthlyChartHeight - monthlyPadBottom - barHeight;
                  return (
                    <g key={label}>
                      <rect x={x} y={y} width={monthlyBarWidth} height={barHeight} rx="3" fill="#4aa5ec" />
                      <text x={x + monthlyBarWidth / 2} y={monthlyChartHeight - 12} textAnchor="middle" className="fill-slate-500 text-[10px]">{label}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#4aa5ec]" />
                Appointments
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-[#2D3A74]">Appointment Status Distribution</h3>
              <svg viewBox="0 0 360 260" className="mt-2 w-full">
                {statusWithMeta.map((status, index) => {
                  const radius = 88 - index * 18;
                  const circumference = 2 * Math.PI * radius;
                  const arcLength = (status.percent / 100) * circumference;
                  return (
                    <g key={status.key}>
                      <circle cx="180" cy="118" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle
                        cx="180"
                        cy="118"
                        r={radius}
                        fill="none"
                        stroke={status.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        transform="rotate(-90 180 118)"
                      />
                    </g>
                  );
                })}

                <text x="180" y="112" textAnchor="middle" className="fill-[#2D3A74] text-[22px] font-semibold">{rangeTotal}</text>
                <text x="180" y="132" textAnchor="middle" className="fill-slate-500 text-[11px] font-medium">Total Cases</text>
              </svg>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                {statusWithMeta.map((status) => (
                  <div key={status.key} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: status.color }} />
                    {status.label} ({status.count})
                  </div>
                ))}
              </div>
            </div>
        </section>



        {/* MAIN 2-COLUMN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACTIVE PATIENT CARD */}
            {visitPatient && !hideActiveVisitCard ? (
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
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        #{getSerial(visitPatient, 1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setHideActiveVisitCard(true)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Close card"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <PatientAvatar name={getName(visitPatient)} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{getName(visitPatient)}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {visitPatient.type || 'General Visit'} &middot; {fmt(visitPatient.appointment_date)} at {fmtTime(visitPatient.appointment_time)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Age: {getAge(visitPatient) || 'N/A'}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Gender: {formatGender(getGender(visitPatient))}</span>
                      </div>
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
                          <FileText className="h-3.5 w-3.5" /> Create Prescription
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

            {/* TABBED APPOINTMENTS TABLE — admin table style */}
            <div className="surface-card rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-[#2D3A74]">
                    <CalendarDays className="h-5 w-5 text-[#4055A8]" />
                    <span>Today's appointments</span>
                  </h2>
                  <p className="text-sm text-slate-500">Latest patients in the pipeline.</p>
                </div>
                <Link href="/doctor/appointments" className="text-sm font-semibold text-[#4055A8] hover:text-[#2D3A74]">View all</Link>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-3 border-b border-slate-100 flex gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  (() => {
                    const tone = getTabTone(tab.key);
                    const isActive = activeTab === tab.key;

                    return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive ? tone.active : `border-transparent ${tone.idle}`
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                        isActive ? tone.badgeActive : tone.badgeIdle
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                    );
                  })()
                ))}
              </div>

              {tabAppointments.length > 0 ? (
                <div className="overflow-x-auto border-t border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                      <tr>
                        <th className="px-6 py-4 text-left">#</th>
                        <th className="px-6 py-4 text-left">Patient</th>
                        <th className="px-6 py-4 text-left">Contact</th>
                        <th className="px-6 py-4 text-left hidden md:table-cell">Time</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tabAppointments.map((a, i) => (
                        <tr key={a.id || i} className="cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => setSelectedPatient(a)}>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                              <Hash className="h-3.5 w-3.5 text-slate-400" />
                              {getSerial(a, i + 1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${genderIconTone(getGender(a))}`}>
                                <User className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900">{getName(a)}</div>
                                <div className="text-xs text-slate-500">{getAge(a) ? `${getAge(a)}y` : 'Age N/A'} • {formatGender(getGender(a))}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {getPhone(a) || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-medium text-slate-700 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {fmtTime(a.appointment_time)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={a.status} size="xs" />
                          </td>
                          <td className="px-6 py-4 pr-8" onClick={(e) => e.stopPropagation()}>
                            {(a.status === 'scheduled' || a.status === 'arrived') && (
                              <DocButton
                                variant="primary"
                                size="xs"
                                onClick={async () => {
                                  setActiveVisitPatient({ ...a, status: 'in_consultation' });
                                  const ok = await updateStatus(a.id, 'in_consultation');
                                  if (!ok) setActiveVisitPatient(null);
                                }}
                              >
                                <Stethoscope className="h-3 w-3" /> Start
                              </DocButton>
                            )}
                            {a.status === 'in_consultation' && (
                              <Link
                                href={a.prescription_id ? '/doctor/prescriptions/' + a.prescription_id : '/doctor/prescriptions/create?appointment_id=' + a.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                              >
                                <FileText className="h-3 w-3" /> Prescribe
                              </Link>
                            )}
                            {a.status === 'awaiting_tests' && a.prescription_id && (
                              <Link
                                href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                                className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition"
                              >
                                <FlaskConical className="h-3 w-3" /> Complete
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
            </div>
          </div>

          {/* RIGHT SIDEBAR (1/3) */}
          <div className="space-y-5">

            {/* Awaiting Tests */}
            {awaitingList.length > 0 && (
              <div className="surface-card rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#FF7C00]" />
                    <span className="text-sm font-semibold text-[#2D3A74]">Awaiting Tests</span>
                  </div>
                  <span className="rounded-full bg-[#FF7C00] px-2.5 py-0.5 text-xs font-bold text-white">{awaitingList.length}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {awaitingList.map((a, i) => (
                    <div key={a.id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors">
                      <PatientAvatar name={a.patient_name || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{a.patient_name || 'Patient'}</p>
                        <p className="text-xs text-slate-400">{fmtTime(a.appointment_time)}</p>
                      </div>
                      {a.prescription_id && (
                        <Link
                          href={'/doctor/prescriptions/' + a.prescription_id + '?from=dashboard'}
                          className="rounded-lg bg-[#FF7C00] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#E56D00] transition whitespace-nowrap flex-shrink-0"
                        >
                          Complete
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Schedule */}
            <div className="surface-card rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-[#FF7C00]" />
                  <h3 className="text-sm font-semibold text-[#2D3A74]">Schedule</h3>
                </div>
                <Link href="/doctor/schedule" className="text-sm font-semibold text-[#4055A8] hover:text-[#2D3A74] transition-colors">
                  Manage
                </Link>
              </div>

              <div className="border-b border-slate-100 px-5 pt-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScheduleTab('today')}
                    className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      scheduleTab === 'today'
                        ? 'bg-slate-100 text-[#2D3A74]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#2D3A74]'
                    }`}
                  >
                    Today's Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleTab('unavailable')}
                    className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      scheduleTab === 'unavailable'
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-orange-700'
                    }`}
                  >
                    Unavailable Dates
                  </button>
                </div>
              </div>

              {scheduleTab === 'today' ? (
                todayScheduleRows.length > 0 ? (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.1em]">
                        <tr>
                          <th className="px-5 py-3 text-left">#</th>
                          <th className="px-5 py-3 text-left">Time Range</th>
                          <th className="px-5 py-3 text-left">Chamber</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {todayScheduleRows.slice(0, 8).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-slate-400" />
                                {row.serial}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {row.range}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                {row.chamber}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-semibold text-emerald-700">
                              <span className="inline-flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />
                                {row.slot}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <DocEmptyState icon={FileText} title={isScheduleClosedToday ? 'Today is marked closed' : 'No weekly schedule for today'} />
                )
              ) : (
                unavailableDateRows.length > 0 ? (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-orange-50/60 text-orange-700 uppercase text-[11px] tracking-[0.1em]">
                        <tr>
                          <th className="px-5 py-3 text-left">#</th>
                          <th className="px-5 py-3 text-left">From</th>
                          <th className="px-5 py-3 text-left">To</th>
                          <th className="px-5 py-3 text-left">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100 bg-white">
                        {unavailableDateRows.slice(0, 8).map((row) => (
                          <tr key={row.id} className="hover:bg-orange-50/40 transition-colors">
                            <td className="px-5 py-3 text-xs font-semibold text-orange-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5" />
                                {row.serial}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                {row.from}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                {row.to}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-orange-700">
                              <span className="inline-flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {row.note}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <DocEmptyState icon={CalendarClock} title="No upcoming unavailable dates" />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT DETAIL MODAL */}
      <DocModal open={!!selectedPatient} onClose={() => setSelectedPatient(null)} size="md" title="Appointment Details" icon={User}>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Phone</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{getPhone(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Email</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 break-all">{getEmail(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Age</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{getAge(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Gender</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formatGender(getGender(selectedPatient))}</p>
              </div>
              {selectedPatient.symptoms && (
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 sm:col-span-2">
                  <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Symptoms</p>
                  <p className="text-sm text-slate-700">{selectedPatient.symptoms}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <DocButton variant="secondary" size="sm" onClick={() => setSelectedPatient(null)}>Close</DocButton>
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
