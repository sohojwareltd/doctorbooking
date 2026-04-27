import { Link, usePage } from '@inertiajs/react';
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
  weeklyScheduleToday = [],
  isScheduleClosedToday = false,
  unavailableRanges = [],
}) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [apiStats, setApiStats] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [yearAppts, setYearAppts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeVisitPatient, setActiveVisitPatient] = useState(null);
  const [hideActiveVisitCard, setHideActiveVisitCard] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', age: '', gender: '' });
  const [activeTab, setActiveTab] = useState('today');
  const [scheduleTab, setScheduleTab] = useState('today');

  const fetchDashboardData = async () => {
    const yr = new Date().getFullYear();
    const opts = { headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    const [statsRes, todayRes, yearRes] = await Promise.all([
      fetch('/api/doctor/stats', opts),
      fetch('/api/doctor/appointments?date_filter=all&per_page=500', opts),
      fetch(`/api/doctor/appointments?date_from=${yr}-01-01&date_to=${yr}-12-31&per_page=1000`, opts),
    ]);
    if (statsRes.ok) setApiStats(await statsRes.json());
    if (todayRes.ok) {
      const d = await todayRes.json();
      const items = Array.isArray(d.appointments) ? d.appointments : (d.appointments?.data ?? []);
      setTodayAppts(items);
      setActiveVisitPatient((prev) => prev ?? (items.find((a) => a.status === 'in_consultation') ?? null));
    }
    if (yearRes.ok) {
      const d = await yearRes.json();
      setYearAppts(Array.isArray(d.appointments) ? d.appointments : (d.appointments?.data ?? []));
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

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
      fetchDashboardData();
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data.message || 'Failed to create appointment.');
    }
  };

  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

  const defaultStats = {
    todayAppointments: apiStats?.today_appointments ?? 0,
    scheduled: apiStats?.scheduled ?? 0,
    totalPatients: apiStats?.total_patients ?? 0,
    totalPrescriptions: apiStats?.total_prescriptions ?? 0,
    prescribedThisMonth: apiStats?.prescribed_this_month ?? 0,
    inConsultation: apiStats?.in_consultation ?? 0,
    waitingPatients: apiStats?.waiting_patients ?? 0,
    followUpsDue: todayAppts.filter((a) => ['awaiting_tests', 'test_registered'].includes(a.status)).length,
  };

  const fmt = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const fmtTime = (timeValue) => {
    if (!timeValue) return '';

    const raw = String(timeValue).trim();
    if (!raw) return '';

    if (/\s?(AM|PM)$/i.test(raw)) {
      return raw.replace(/\s?(am|pm)$/i, (_, marker) => ` ${marker.toUpperCase()}`);
    }

    const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return raw;

    const hours24 = Number(match[1]);
    const minutes = match[2];
    if (Number.isNaN(hours24) || hours24 < 0 || hours24 > 23) return raw;

    const meridiem = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes} ${meridiem}`;
  };
  const getName = (a) => a?.patient_name || a?.user?.name || 'Patient';
  const getPhone = (a) => a?.patient_phone || a?.user?.phone || null;
  const getGender = (a) => String(a?.patient_gender || a?.user?.gender || '').toLowerCase();
  const getAge = (a) => a?.patient_age || a?.user?.age || null;
  const getEmail = (a) => a?.patient_email || a?.user?.email || null;
  const getChamberName = (a) => a?.chamber?.name || 'Unassigned chamber';
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
      await fetchDashboardData();
      return true;
    } catch {
      return false;
    }
  };

  const inVisitAppointments = todayAppts.filter((a) => a.status === 'in_consultation');
  const awaitingTestsAppointments = todayAppts.filter((a) => ['awaiting_tests', 'test_registered'].includes(a.status));
  const inVisitAppointment = inVisitAppointments[0] ?? null;
  const upcomingAppointment = todayAppts.find((a) => a.status === 'scheduled' || a.status === 'arrived') ?? null;
  const visitPatient = activeVisitPatient || inVisitAppointment;

  useEffect(() => {
    setHideActiveVisitCard(false);
  }, [activeVisitPatient?.id, inVisitAppointment?.id]);
  const todayAppointments = [...todayAppts].sort((a, b) => {
    const at = (a.appointment_date || '') + ' ' + (a.appointment_time || '');
    const bt = (b.appointment_date || '') + ' ' + (b.appointment_time || '');
    return new Date(at) - new Date(bt);
  });
  const getSerial = (appointment, fallback) => {
    const stableIndexByRef = todayAppointments.indexOf(appointment);
    if (stableIndexByRef >= 0) return stableIndexByRef + 1;

    const hasId = appointment?.id !== null && appointment?.id !== undefined;
    const stableIndexById = hasId
      ? todayAppointments.findIndex((item) => item?.id === appointment.id)
      : -1;

    return stableIndexById >= 0 ? stableIndexById + 1 : fallback;
  };
  const awaitingList = awaitingTestsAppointments;
  const activeCount = defaultStats.inConsultation || inVisitAppointments.length || (visitPatient ? 1 : 0);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const doctorName = (user?.name || '').trim() || 'Doctor';
  const doctorDisplayName = /^dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`;

  const STATUS_ORDER = ['in_consultation', 'arrived', 'scheduled', 'test_registered', 'awaiting_tests', 'prescribed', 'cancelled'];
  const sortByStatusOrder = (list) =>
    [...list].sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status);
      const bi = STATUS_ORDER.indexOf(b.status);
      return (ai === -1 ? STATUS_ORDER.length : ai) - (bi === -1 ? STATUS_ORDER.length : bi);
    });

  const tabAppointments =
    activeTab === 'today' ? sortByStatusOrder(todayAppointments).slice(0, 10) :
      activeTab === 'awaiting' ? sortByStatusOrder(awaitingList) :
        sortByStatusOrder(todayAppointments.filter((a) => a.status === activeTab));

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
    { key: 'today', label: 'All Appointments', count: todayAppointments.length },
    { key: 'scheduled', label: 'Scheduled', count: todayAppointments.filter((a) => a.status === 'scheduled').length },
    { key: 'in_consultation', label: 'In Progress', count: todayAppointments.filter((a) => a.status === 'in_consultation').length },
    { key: 'awaiting', label: 'Awaiting Tests', count: awaitingList.length },
    { key: 'test_registered', label: 'Report Submitted', count: todayAppointments.filter((a) => a.status === 'test_registered').length },
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
      test_registered: {
        active: 'border-cyan-500 text-cyan-700',
        idle: 'text-cyan-600 hover:text-cyan-700',
        badgeActive: 'bg-cyan-100 text-cyan-700',
        badgeIdle: 'bg-cyan-50 text-cyan-600',
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

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyAppointments = Array(12).fill(0);

  yearAppts.forEach((appointment) => {
    if (!appointment?.appointment_date) return;
    const date = new Date(appointment.appointment_date);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== now.getFullYear()) return;
    monthlyAppointments[date.getMonth()] += 1;
  });

  const monthlyChartWidth = 560;
  const monthlyChartHeight = 200;
  const monthlyPadX = 42;
  const monthlyPadTop = 24;
  const monthlyPadBottom = 34;
  const monthlyUsableHeight = monthlyChartHeight - monthlyPadTop - monthlyPadBottom;
  const monthlyUsableWidth = monthlyChartWidth - monthlyPadX * 2;
  const monthlyMax = Math.max(1, ...monthlyAppointments);
  const monthlyBarGap = monthlyUsableWidth / 12;
  const monthlyBarWidth = Math.max(10, monthlyBarGap * 0.58);
  const monthlyTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(monthlyMax * ratio));
  const statusGraphItems = [
    { key: 'scheduled', label: 'Scheduled', color: '#64748b', value: todayAppointments.filter((a) => a.status === 'scheduled').length },
    { key: 'in_consultation', label: 'In Progress', color: '#7c3aed', value: todayAppointments.filter((a) => a.status === 'in_consultation').length },
    { key: 'awaiting_tests', label: 'Awaiting Tests', color: '#ea580c', value: todayAppointments.filter((a) => ['awaiting_tests', 'test_registered'].includes(a.status)).length },
    { key: 'prescribed', label: 'Completed', color: '#059669', value: todayAppointments.filter((a) => a.status === 'prescribed').length },
  ];
  const statusGraphMax = Math.max(1, ...statusGraphItems.map((item) => item.value));
  const chamberBreakdown = Object.values(
    todayAppointments.reduce((acc, appointment) => {
      const name = getChamberName(appointment);
      if (!acc[name]) {
        acc[name] = {
          name,
          count: 0,
          awaiting: 0,
          active: 0,
        };
      }

      acc[name].count += 1;
      if (['awaiting_tests', 'test_registered'].includes(appointment.status)) acc[name].awaiting += 1;
      if (appointment.status === 'in_consultation') acc[name].active += 1;

      return acc;
    }, {})
  ).sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  const chamberMax = Math.max(1, ...chamberBreakdown.map((item) => item.count));
  const busiestChamber = chamberBreakdown[0] ?? null;
  const chamberSummary = chamberBreakdown.slice(0, 4);

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
        <div className="grid gap-6 ">

          {/* LEFT (2/3) */}
          <div className="space-y-6">

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
                      {user?.role !== 'compounder' && (visitPatient.prescription_id ? (
                        <Link
                          href={'/doctor/prescriptions/' + (visitPatient.prescription_uuid || visitPatient.prescription_id)}
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : upcomingAppointment ? (
              ''
              // <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              //   <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
              //   <div className="p-5">
              //     <div className="flex items-center justify-between mb-4">
              //       <div className="flex items-center gap-2">
              //         <Clock className="h-3.5 w-3.5 text-slate-400" />
              //         <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Appointment</span>
              //       </div>
              //       <StatusBadge status={upcomingAppointment.status} size="xs" />
              //     </div>

              //     <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              //       <div className="cursor-pointer" onClick={() => setSelectedPatient(upcomingAppointment)}>
              //         <PatientAvatar name={getName(upcomingAppointment)} size="lg" />
              //       </div>
              //       <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPatient(upcomingAppointment)}>
              //         <h3 className="text-lg font-semibold text-slate-900">{getName(upcomingAppointment)}</h3>
              //         <p className="text-sm text-slate-500 mt-0.5">
              //           {upcomingAppointment.type || 'General Visit'} &middot; {fmt(upcomingAppointment.appointment_date)} at {fmtTime(upcomingAppointment.appointment_time)}
              //         </p>
              //         {getPhone(upcomingAppointment) && (
              //           <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              //             <Phone className="h-3 w-3" />{getPhone(upcomingAppointment)}
              //           </p>
              //         )}
              //       </div>

              //       <div className="flex flex-col gap-2 flex-shrink-0 sm:min-w-[140px]">
              //         <DocButton
              //           variant="primary"
              //           size="sm"
              //           onClick={async () => {
              //             setActiveVisitPatient({ ...upcomingAppointment, status: 'in_consultation' });
              //             const ok = await updateStatus(upcomingAppointment.id, 'in_consultation');
              //             if (!ok) setActiveVisitPatient(null);
              //           }}
              //         >
              //           <Stethoscope className="h-3.5 w-3.5" /> Start Visit
              //         </DocButton>
              //         {getPhone(upcomingAppointment) && (
              //           <a
              //             href={'tel:' + getPhone(upcomingAppointment)}
              //             className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
              //           >
              //             <Phone className="h-3.5 w-3.5" /> Call
              //           </a>
              //         )}
              //       </div>
              //     </div>
              //   </div>
              // </div>


            ) : null}

            {/* TABBED APPOINTMENTS TABLE — admin table style */}
            <div className="hidden md:block surface-card rounded-3xl overflow-hidden">
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
                        className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${isActive ? tone.active : `border-transparent ${tone.idle}`
                          }`}
                      >
                        {tab.label}
                        {/* {tab.count > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none ${isActive ? tone.badgeActive : tone.badgeIdle
                            }`}>
                            {tab.count}
                          </span>
                        )} */}
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
                              {i + 1}
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
                            {a.status === 'in_consultation' && user?.role !== 'compounder' && (
                              <Link
                                href={a.prescription_id ? '/doctor/prescriptions/' + (a.prescription_uuid || a.prescription_id) : '/doctor/prescriptions/create?appointment_id=' + a.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                              >
                                <FileText className="h-3 w-3" /> Prescribe
                              </Link>
                            )}
                            {a.status === 'awaiting_tests' && a.prescription_id && (
                              <Link
                                href={'/doctor/prescriptions/' + (a.prescription_uuid || a.prescription_id) + '?from=dashboard'}
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
                          href={'/doctor/prescriptions/' + (a.prescription_uuid || a.prescription_id) + '?from=dashboard'}
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

          </div>
        </div>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

          {/* <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2D3A74]">Today Status Mix</h3>
              <span className="text-xs text-slate-500">{todayAppointments.length} total</span>
            </div>
            <div className="space-y-3">
              {statusGraphItems.map((item) => {
                const pct = Math.round((item.value / Math.max(1, todayAppointments.length)) * 100);
                const width = (item.value / statusGraphMax) * 100;
                return (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <span className="text-slate-500">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}
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
                  className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${scheduleTab === 'today'
                    ? 'bg-slate-100 text-[#2D3A74]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#2D3A74]'
                    }`}
                >
                  Today's Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTab('unavailable')}
                  className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${scheduleTab === 'unavailable'
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
        </section>

        {/* <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card rounded-3xl overflow-hidden xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#4055A8]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#2D3A74]">Today by Chamber</h3>
                  <p className="text-xs text-slate-500">Live appointment load across chambers.</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {todayAppointments.length} total
              </span>
            </div>

            {chamberSummary.length > 0 ? (
              <div className="space-y-4 px-5 py-5">
                {busiestChamber && (
                  <div className="rounded-2xl border border-[#d8e2fb] bg-[#f6f8ff] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4055A8]">Busiest Chamber</p>
                        <p className="mt-1 text-base font-semibold text-[#2D3A74]">{busiestChamber.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-[#2D3A74]">{busiestChamber.count}</p>
                        <p className="text-xs text-slate-500">appointments today</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {chamberSummary.map((chamber) => (
                    <div key={chamber.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-700">{chamber.name}</p>
                          <p className="text-xs text-slate-400">{chamber.active} in progress • {chamber.awaiting} awaiting tests</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{chamber.count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#4055A8] to-[#4aa5ec]"
                          style={{ width: `${(chamber.count / chamberMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DocEmptyState icon={Building2} title="No chamber activity today" description="Today's appointments will be grouped here once bookings are available." />
            )}
          </div>

          <div className="surface-card rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Awaiting Tests</p>
                <p className="text-3xl font-semibold text-[#2D3A74]">{awaitingList.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                <FlaskConical className="h-5 w-5 text-[#FF7C00]" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Patients waiting for reports or test completion.</p>
            <div className="mt-4 space-y-2">
              {awaitingList.slice(0, 3).map((appointment, index) => (
                <div key={appointment.id || index} className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">{getName(appointment)}</p>
                    <p className="truncate text-[11px] text-slate-500">{getChamberName(appointment)}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-orange-700">{fmtTime(appointment.appointment_time) || 'Pending'}</span>
                </div>
              ))}
              {awaitingList.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">No patients are awaiting tests right now.</div>
              )}
            </div>
          </div>

          <div className="surface-card rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Appointments Today</p>
                <p className="text-3xl font-semibold text-[#2D3A74]">{todayAppointments.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50">
                <CalendarDays className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">All booked patients scheduled for the current day.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">In Queue</p>
                <p className="mt-1 text-lg font-semibold text-slate-700">{defaultStats.waitingPatients}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-violet-400">In Progress</p>
                <p className="mt-1 text-lg font-semibold text-violet-700">{activeCount}</p>
              </div>
            </div>
          </div>
        </section> */}





        {/* MAIN 2-COLUMN GRID */}

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
