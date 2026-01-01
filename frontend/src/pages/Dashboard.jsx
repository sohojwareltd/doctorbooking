import { Head } from '@inertiajs/react';
import { CalendarDays, FileText, LayoutDashboard } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import GlassCard from '../components/GlassCard';

export default function Dashboard({ stats = {} }) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#005963]">Dashboard</h1>
                <p className="mt-2 text-gray-600">Quick overview of your appointments and prescriptions.</p>
            </div>

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-gray-500">Upcoming Appointments</div>
                                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.upcomingAppointments ?? 0}</div>
                            </div>
                            <div className="rounded-2xl bg-[#005963]/10 p-3">
                                <CalendarDays className="h-6 w-6 text-[#005963]" />
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard variant="solid" className="border-2 border-[#00acb1]/20 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-gray-500">Prescriptions</div>
                                <div className="mt-2 text-3xl font-black text-[#005963]">{stats.prescriptions ?? 0}</div>
                            </div>
                            <div className="rounded-2xl bg-[#005963]/10 p-3">
                                <FileText className="h-6 w-6 text-[#005963]" />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
