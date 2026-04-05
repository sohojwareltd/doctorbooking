import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays, ClipboardList, LayoutDashboard, Users, User, UserCog, X,
  Stethoscope, Globe, CalendarClock, LogOut, ChevronLeft, Activity
} from 'lucide-react';

export default function DoctorSidebar({ currentPath, onClose, collapsed = false, onToggleCollapse }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const navGroups = [
    {
      label: 'Menu',
      items: [
        { href: '/doctor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        { href: '/doctor/appointments', label: 'Appointments', Icon: CalendarDays, badge: null },
        { href: '/doctor/patients', label: 'Patients', Icon: Users },
        { href: '/doctor/prescriptions', label: 'Prescriptions', Icon: ClipboardList },
      ],
    },
    {
      label: 'Practice',
      items: [
        { href: '/doctor/chambers', label: 'Chambers', Icon: Stethoscope },
        { href: '/doctor/schedule', label: 'Schedule', Icon: CalendarClock },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/doctor/profile', label: 'Profile', Icon: UserCog },
      ],
    },
  ];

  const isActive = (href) => currentPath === href || currentPath.startsWith(href + '/');

  return (
    <div className="flex h-full flex-col border-r border-[#455b93] bg-gradient-to-b from-[#253561] via-[#2c3f70] to-[#253561] text-[#ecf3ff] backdrop-blur-md shadow-[10px_0_34px_-20px_rgba(17,26,54,0.78)]">
      {/* Mobile Close */}
      <div className="lg:hidden flex justify-end px-3 pt-3">
        <button onClick={onClose} className="doc-kinetic-btn rounded-lg p-2 text-[#c5d4f6] transition hover:bg-white/12 hover:text-white" aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Brand Header */}
      <div className={`flex-shrink-0 border-b border-white/12 bg-white/[0.05] ${collapsed ? 'px-3 py-5' : 'px-5 py-5'}`}>
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-lg bg-[#cf8650] p-2.5 transition group-hover:bg-[#dd9865] flex-shrink-0 shadow-md shadow-[#cf8650]/40">
            <Activity className="text-white" style={{ width: 20, height: 20 }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-base font-bold tracking-wide text-white">MediCare</div>
              <div className="text-[11px] font-medium text-[#c6d4f3]">Doctor Portal</div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto doc-sidebar-scroll px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
            {!collapsed && (
              <div className="px-3 mb-2 doc-nav-group-label">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b9c9eb]">{group.label}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`doc-nav-live group relative flex items-center gap-3 ${collapsed ? 'justify-center px-2.5' : 'px-3.5'} rounded-xl py-3 text-[14px] font-semibold transition-all duration-150 ${
                      active
                        ? 'border border-[#b8caf5]/35 bg-[#3c5694]/88 text-white shadow-sm shadow-[#0f1a35]/40'
                        : 'text-[#d6e2fb] hover:bg-white/12 hover:text-white'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ebb17f]" />
                    )}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-[#ffd8b5]' : 'text-[#c4d3f4] group-hover:text-white'}`} />
                    {!collapsed && <span className="flex-1 doc-nav-label">{label}</span>}
                    {!collapsed && badge != null && (
                      <span className="min-w-[22px] rounded-full bg-[#cf8650] px-2 py-0.5 text-center text-[11px] font-bold text-white">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <div className="hidden lg:block px-3 pb-2">
          <button
            onClick={onToggleCollapse}
            className="doc-kinetic-btn flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#d0dcf6] transition hover:bg-white/12 hover:text-white"
          >
            <ChevronLeft className={`h-[18px] w-[18px] transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* Doctor Profile + Logout */}
      <div className="flex-shrink-0 border-t border-white/12 bg-white/[0.05] p-3">
        <Link href="/doctor/profile" className={`doc-kinetic-btn group flex items-center gap-3 rounded-xl ${collapsed ? 'justify-center p-2.5' : 'p-2.5'} transition hover:bg-white/12`}>
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/12">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-[18px] w-[18px] text-[#d6e2fb]" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1f2c52] bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="truncate text-[15px] font-semibold text-white">{user?.name || 'Doctor'}</div>
              <div className="truncate text-[12px] text-[#c4d1ef]">{user?.email || 'View Profile'}</div>
            </div>
          )}
        </Link>
        <Link
          href="/logout"
          method="post"
          as="button"
          className={`doc-kinetic-btn mt-1.5 flex w-full items-center gap-2 rounded-xl py-2.5 text-[14px] font-medium ${collapsed ? 'justify-center px-2.5' : 'px-3.5'} text-[#d5e1fa] transition hover:bg-[#553344]/45 hover:text-[#ffe1e6]`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && 'Log Out'}
        </Link>
      </div>
    </div>
  );
}
