import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, CalendarPlus, LayoutDashboard, FileText, User } from 'lucide-react';
import DoctorLogo from './DoctorLogo';
import GlassCard from './GlassCard';

export default function UserSidebar({ currentPath }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const navItems = [
    { href: '/user/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/user/appointments', label: 'Appointments', Icon: CalendarDays },
    { href: '/user/book-appointment', label: 'Book Appointment', Icon: CalendarPlus },
    { href: '/user/prescriptions', label: 'Prescriptions', Icon: FileText },
  ];

  const isActive = (href) => {
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <GlassCard variant="solid" hover={false} className="flex flex-col h-full overflow-hidden border-0 p-0">
      {/* Profile Header with Blue Background and Logo */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#005963] to-[#00acb1] px-4 pb-12 pt-4">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')]"></div>
        </div>

        {/* Logo Section - Desktop only */}
        <div className="relative z-10 mb-4 hidden md:block">
          <Link href="/user/dashboard" className="flex items-center gap-2">
            <div className="rounded-2xl bg-white/20 p-2 backdrop-blur-sm">
              <DoctorLogo className="h-10 w-10" />
            </div>
            <div>
              <div className="font-black leading-tight text-white">MediCare</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Picture */}
        <div className="mb-4 flex justify-center px-4 relative z-20">
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg relative z-20">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#005963] to-[#00acb1]">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 text-center">
          <h2 className="text-lg font-bold text-[#005963]">{user?.name || 'Patient Name'}</h2>
          {user?.email && (
            <p className="mt-1 text-xs text-gray-600">{user.email}</p>
          )}
          <div className="mt-2 inline-flex rounded-full bg-[#005963]/10 px-3 py-1 text-xs font-semibold text-[#005963]">
            • {user?.role || 'patient'}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="mx-4 mt-6 space-y-1.5">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                isActive(href)
                  ? 'bg-[#005963]/15 text-[#00434a] ring-1 ring-[#005963]/25'
                  : 'text-[#005963] hover:bg-[#005963]/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mx-4 mt-6 mb-4 border-t border-gray-200 pt-4">
          <Link
            href="/logout"
            method="post"
            as="button"
            className="flex w-full items-center justify-center rounded-2xl bg-[#005963]/10 px-4 py-3 text-sm font-semibold text-[#005963] hover:bg-[#005963]/15 transition"
          >
            Logout
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
