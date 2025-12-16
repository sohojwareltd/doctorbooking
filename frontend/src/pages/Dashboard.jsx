import { Head, Link, usePage } from '@inertiajs/react';
import UserLayout from '../layouts/UserLayout';

export default function Dashboard({ stats = {} }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gray-100">
                <nav className="border-b border-gray-100 bg-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex shrink-0 items-center">
                                    <Link
                                        href="/"
                                        className="text-xl font-bold text-gray-900"
                                    >
                                        Doctor Booking
                                    </Link>
                                </div>
                                <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center border-b-2 border-indigo-400 px-1 pt-1 text-sm font-medium text-gray-900"
                                    >
                                        Dashboard
                                    </Link>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-700">
                                    {auth.user?.name || 'User'}
                                </span>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="ml-4 text-sm text-gray-700 hover:text-gray-900"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Dashboard
                        </h1>
                    </div>
                </header>

                <main>
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="overflow-hidden rounded-2xl border bg-white">
                                <div className="p-6">
                                    <div className="text-sm text-gray-500">Upcoming Appointments</div>
                                    <div className="mt-2 text-3xl font-bold">{stats.upcomingAppointments ?? 0}</div>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-2xl border bg-white">
                                <div className="p-6">
                                    <div className="text-sm text-gray-500">Prescriptions</div>
                                    <div className="mt-2 text-3xl font-bold">{stats.prescriptions ?? 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
