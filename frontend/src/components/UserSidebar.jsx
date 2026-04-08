import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays, CalendarPlus, FileText, LayoutDashboard,
  LogOut, ChevronDown, User, Activity,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ACCENT = '#4aa5ec';

export default function UserSidebar({ currentPath }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const isActive = (href) => currentPath === href || currentPath.startsWith(href + '/');
  const apptActive = isActive('/user/appointments') || isActive('/user/book-appointment');

  const [apptOpen, setApptOpen] = useState(apptActive);
  const dropRef = useRef(null);
  const [dropH, setDropH] = useState(0);

  useEffect(() => {
    if (dropRef.current) setDropH(dropRef.current.scrollHeight);
  }, [apptOpen]);

  const mainNav = [
    { href: '/user/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/user/prescriptions', label: 'Prescriptions', Icon: FileText },
    { href: '/user/profile', label: 'My Profile', Icon: User },
  ];

  return (
    <div className="flex flex-col h-full bg-[#2D3A74] text-white">

      {/* Logo */}
      <div className="flex-shrink-0 px-6 py-6 pb-8">
        <Link href="/user/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-lg p-2.5 flex-shrink-0 shadow-md" style={{ background: ACCENT }}>
            <Activity className="text-white" style={{ width: 20, height: 20 }} />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold tracking-wide text-white">MediCare</div>
            <div className="text-[11px] font-medium text-white/60">Patient Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        <div className="mb-2">
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider px-6 mb-3">Menu</h3>
          <ul className="space-y-0.5">

            {/* Dashboard */}
            <li>
              <Link
                href="/user/dashboard"
                className={`flex items-center text-white text-sm py-3 transition-colors ${
                  isActive('/user/dashboard') ? 'font-semibold' : 'hover:bg-white/10'
                }`}
                style={isActive('/user/dashboard')
                  ? { background: 'rgba(255,255,255,0.15)', borderLeft: `4px solid ${ACCENT}`, paddingLeft: '20px' }
                  : { paddingLeft: '24px' }}
              >
                <LayoutDashboard className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive('/user/dashboard') ? 'text-white' : 'text-white/70'}`} />
                Dashboard
              </Link>
            </li>

            {/* Appointments — expandable */}
            <li>
              <button
                type="button"
                onClick={() => setApptOpen((p) => !p)}
                className={`w-full flex items-center text-white text-sm py-3 transition-colors ${
                  apptActive && !apptOpen ? 'font-semibold' : 'hover:bg-white/10'
                }`}
                style={apptActive && !apptOpen
                  ? { background: 'rgba(255,255,255,0.15)', borderLeft: `4px solid ${ACCENT}`, paddingLeft: '20px' }
                  : { paddingLeft: '24px' }}
              >
                <CalendarDays className={`w-5 h-5 mr-3 flex-shrink-0 ${apptActive ? 'text-white' : 'text-white/70'}`} />
                <span className="flex-1 text-left">Appointments</span>
                <ChevronDown className={`h-3.5 w-3.5 mr-4 text-white/50 transition-transform duration-200 ${apptOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                ref={dropRef}
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: apptOpen ? `${dropH}px` : '0px', opacity: apptOpen ? 1 : 0 }}
              >
                <ul>
                  {[
                    { href: '/user/appointments', label: 'My Appointments' },
                    { href: '/user/book-appointment', label: 'Book Appointment' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center text-white text-sm py-2 transition-colors ${
                          isActive(href) ? 'font-semibold' : 'hover:bg-white/10'
                        }`}
                        style={isActive(href)
                          ? { background: 'rgba(255,255,255,0.15)', borderLeft: `4px solid ${ACCENT}`, paddingLeft: '40px' }
                          : { paddingLeft: '44px' }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>

            {/* Prescriptions */}
            <li>
              <Link
                href="/user/prescriptions"
                className={`flex items-center text-white text-sm py-3 transition-colors ${
                  isActive('/user/prescriptions') ? 'font-semibold' : 'hover:bg-white/10'
                }`}
                style={isActive('/user/prescriptions')
                  ? { background: 'rgba(255,255,255,0.15)', borderLeft: `4px solid ${ACCENT}`, paddingLeft: '20px' }
                  : { paddingLeft: '24px' }}
              >
                <FileText className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive('/user/prescriptions') ? 'text-white' : 'text-white/70'}`} />
                Prescriptions
              </Link>
            </li>

            {/* My Profile */}
            <li>
              <Link
                href="/user/profile"
                className={`flex items-center text-white text-sm py-3 transition-colors ${
                  isActive('/user/profile') ? 'font-semibold' : 'hover:bg-white/10'
                }`}
                style={isActive('/user/profile')
                  ? { background: 'rgba(255,255,255,0.15)', borderLeft: `4px solid ${ACCENT}`, paddingLeft: '20px' }
                  : { paddingLeft: '24px' }}
              >
                <User className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive('/user/profile') ? 'text-white' : 'text-white/70'}`} />
                My Profile
              </Link>
            </li>

          </ul>
        </div>
      </nav>

      {/* Profile + Logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <Link
          href="/user/profile"
          className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/10"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 flex-shrink-0">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-[18px] w-[18px] text-white/70" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-white">{user?.name || 'Patient'}</div>
            <div className="truncate text-xs text-white/60">{user?.email || ''}</div>
          </div>
        </Link>
        <Link
          href="/logout"
          method="post"
          as="button"
          className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log Out
        </Link>
      </div>
    </div>
  );
}
