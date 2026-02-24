import { Head, Link } from '@inertiajs/react';
import { CalendarDays, FileText, CalendarPlus, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';

export default function Dashboard({ stats = {} }) {
    return (
        <>
            <Head title="Dashboard" />

            {/* Page header — matches image: title + subtitle left, actions right */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Manage your appointments and health records.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/user/appointments"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                    >
                        <CalendarDays className="h-3.5 w-3.5" />
                        View All
                    </Link>
                    <Link
                        href="/user/book-appointment"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition"
                    >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Book Appointment
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                <StatCard
                    label="Upcoming"
                    value={stats.upcomingAppointments ?? 0}
                    icon={<CalendarDays className="h-4 w-4 text-[#005963]" />}
                    iconBg="bg-[#005963]/10"
                    sub="Scheduled"
                />
                <StatCard
                    label="Prescriptions"
                    value={stats.prescriptions ?? 0}
                    icon={<FileText className="h-4 w-4 text-violet-600" />}
                    iconBg="bg-violet-50"
                    sub="Medical records"
                />
                <StatCard
                    label="Completed"
                    value={stats.completedAppointments ?? 0}
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                    sub="Past visits"
                />
                <StatCard
                    label="Cancelled"
                    value={stats.cancelledAppointments ?? 0}
                    icon={<XCircle className="h-4 w-4 text-rose-500" />}
                    iconBg="bg-rose-50"
                    sub="Not attended"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">Quick Actions</h2>
                </div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <QuickActionLink
                        href="/user/appointments"
                        icon={<CalendarDays className="h-4 w-4 text-[#005963]" />}
                        iconBg="bg-[#005963]/10"
                        title="My Appointments"
                        desc="View all your appointment history and status."
                    />
                    <QuickActionLink
                        href="/user/prescriptions"
                        icon={<FileText className="h-4 w-4 text-violet-600" />}
                        iconBg="bg-violet-50"
                        title="Prescriptions"
                        desc="View and download your medical prescriptions."
                    />
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, icon, iconBg, sub }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
                </div>
                <div className={`rounded-lg ${iconBg} p-2 shrink-0`}>{icon}</div>
            </div>
        </div>
    );
}

function QuickActionLink({ href, icon, iconBg, title, desc }) {
    return (
        <Link href={href} className="flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors group">
            <div className={`rounded-lg ${iconBg} p-2 shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#005963] transition-colors">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#005963] transition-colors shrink-0" />
        </Link>
    );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
