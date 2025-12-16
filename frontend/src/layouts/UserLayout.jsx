import { Link } from '@inertiajs/react';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-bold text-[#005963]">MediCare</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/user/appointments">Appointments</Link>
            <Link href="/user/prescriptions">Prescriptions</Link>
            <Link href="/user/profile">Profile</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
