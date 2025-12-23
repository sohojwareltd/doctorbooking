import { Link, usePage } from '@inertiajs/react';

export default function DoctorLayout({ children }) {
  const { auth } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-bold text-[#005963]">MediCare</Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/doctor/appointments">Appointments</Link>
              <Link href="/doctor/patients">Patients</Link>
              <Link href="/doctor/prescriptions">Prescriptions</Link>
              <Link href="/doctor/schedule">Schedule</Link>
            </nav>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-gray-600">{auth?.user?.name}</span>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="rounded-lg bg-[#00acb1] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#00787b] transition"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
