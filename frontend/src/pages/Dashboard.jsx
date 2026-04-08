import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
  CalendarDays, FileText, CalendarPlus, CheckCircle2, XCircle,
  Clock, Stethoscope, Hash, ArrowRight, User,
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import StatusBadge from '../components/doctor/StatusBadge';

export default function Dashboard({
  stats = {},
  recentAppointments = [],
  upcomingAppointment = null,
}) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [apiRecent, setApiRecent] = useState(recentAppointments);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const opts = { headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    fetch('/api/patient/appointments?per_page=50', opts)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const items = Array.isArray(d.appointments) ? d.appointments : (d.appointments?.data ?? []);
        if (items.length > 0) setApiRecent(items.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const patientName = (user?.name || '').trim() || 'there';

  const fmt = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const fmtTime = (t) => t || '';

  // Tabs for recent appointments
  const TABS = [
    { key: 'all',       label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'prescribed',label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];
  const tabItems =
    activeTab === 'all' ? apiRecent :
    apiRecent.filter((a) => a.status === activeTab);

  const statCards = [
    { label: 'Upcoming', value: stats.upcomingAppointments ?? 0, icon: CalendarDays, iconBg: 'bg-[#2D3A74]/10', iconColor: 'text-[#2D3A74]', desc: 'Scheduled appointments ahead.' },
    { label: 'Prescriptions', value: stats.prescriptions ?? 0, icon: FileText, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', desc: 'Your medical records.' },
    { label: 'Completed', value: stats.completedAppointments ?? 0, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', desc: 'Past visits finished.' },
    { label: 'Cancelled', value: stats.cancelledAppointments ?? 0, icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-500', desc: 'Appointments not attended.' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* HERO BANNER */}
      <section className="hero-panel rounded-[28px] p-6 md:p-8 text-white">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 mb-4">
              <User className="h-[11px] w-[11px]" />
              Patient Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              {greeting}, {patientName}
            </h1>
            <p className="text-sm md:text-base text-white/80 max-w-2xl">
              Track your appointments, access prescriptions, and manage your health all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
            <Link href="/user/appointments" className="glass-card rounded-2xl p-4 transition hover:bg-white/[0.18]">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60 mb-1">Upcoming</p>
              <p className="text-3xl font-semibold">{stats.upcomingAppointments ?? 0}</p>
            </Link>
            <Link href="/user/prescriptions" className="glass-card rounded-2xl p-4 transition hover:bg-white/[0.18]">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60 mb-1">Prescriptions</p>
              <p className="text-3xl font-semibold">{stats.prescriptions ?? 0}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((item) => {
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

      {/* MAIN 2-COLUMN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* NEXT APPOINTMENT CARD */}
          {upcomingAppointment && (
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
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-slate-900">
                      {fmt(upcomingAppointment.appointment_date)} at {fmtTime(upcomingAppointment.appointment_time)}
                    </p>
                    {upcomingAppointment.symptoms && (
                      <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Symptoms: </span>{upcomingAppointment.symptoms}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href="/user/appointments"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e2a5a] transition"
                    >
                      <CalendarDays className="h-3.5 w-3.5" /> View Details
                    </Link>
                    {upcomingAppointment.prescription_id && (
                      <Link
                        href={'/user/prescriptions/' + upcomingAppointment.prescription_id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Rx
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECENT APPOINTMENTS TABLE */}
          <div className="surface-card rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-[#2D3A74]">
                  <CalendarDays className="h-5 w-5 text-[#4055A8]" />
                  Recent Appointments
                </h2>
                <p className="text-sm text-slate-500">Your latest appointment activity.</p>
              </div>
              <Link href="/user/appointments" className="text-sm font-semibold text-[#4055A8] hover:text-[#2D3A74]">View all</Link>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 border-b border-slate-100 flex gap-1 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#2D3A74] text-[#2D3A74]'
                      : 'border-transparent text-slate-600 hover:text-[#2D3A74]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {tabItems.length > 0 ? (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                    <tr>
                      <th className="px-6 py-4 text-left">#</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left hidden md:table-cell">Time</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tabItems.map((a, i) => (
                      <tr key={a.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            {a.serial_no || (i + 1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {fmt(a.appointment_date)}
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
                        <td className="px-6 py-4">
                          {a.prescription_id ? (
                            <Link
                              href={'/user/prescriptions/' + a.prescription_id}
                              className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition"
                            >
                              <FileText className="h-3 w-3" /> View Rx
                            </Link>
                          ) : (
                            <Link
                              href="/user/appointments"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                              Details
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarDays className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-sm">No appointments found</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (1/3) */}
        <div className="space-y-5">

          {/* Book Appointment CTA */}
          <div className="hero-panel rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-white/70" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">New Visit</span>
            </div>
            <p className="text-base font-semibold mb-4">Need to see a doctor?</p>
            <Link
              href="/user/book-appointment"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition w-full justify-center"
            >
              <CalendarPlus className="h-4 w-4" /> Book Appointment
            </Link>
          </div>

          {/* Quick Links */}
          <div className="surface-card rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#2D3A74]">Quick Access</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { href: '/user/appointments', icon: CalendarDays, label: 'My Appointments', desc: 'View appointment history', color: 'text-[#2D3A74]', bg: 'bg-[#2D3A74]/10' },
                { href: '/user/prescriptions', icon: FileText, label: 'Prescriptions', desc: 'Download medical records', color: 'text-violet-600', bg: 'bg-violet-50' },
                { href: '/user/book-appointment', icon: CalendarPlus, label: 'Book Appointment', desc: 'Schedule a new visit', color: 'text-[#FF7C00]', bg: 'bg-orange-50' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors group">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
