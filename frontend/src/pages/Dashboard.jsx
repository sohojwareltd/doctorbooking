import { Head } from '@inertiajs/react';
import UserLayout from '../layouts/UserLayout';
import GlassCard from '../components/GlassCard';

export default function Dashboard({ stats = {} }) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="mb-6 text-3xl font-bold text-[#005963]">Dashboard</h1>
                <div className="grid gap-6 sm:grid-cols-2">
                    <GlassCard variant="solid" hover={false} className="p-6">
                        <div className="text-sm text-gray-500">Upcoming Appointments</div>
                        <div className="mt-2 text-3xl font-black text-[#005963]">{stats.upcomingAppointments ?? 0}</div>
                    </GlassCard>
                    <GlassCard variant="solid" hover={false} className="p-6">
                        <div className="text-sm text-gray-500">Prescriptions</div>
                        <div className="mt-2 text-3xl font-black text-[#005963]">{stats.prescriptions ?? 0}</div>
                    </GlassCard>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
