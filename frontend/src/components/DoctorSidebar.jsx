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
    <div className="flex flex-col h-full border-r border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/70 backdrop-blur-md shadow-[8px_0_26px_-18px_rgba(15,23,42,0.32)]">
      {/* Mobile Close */}
      <div className="lg:hidden flex justify-end px-3 pt-3">
        <button onClick={onClose} className="doc-kinetic-btn p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition" aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Brand Header */}
      <div className={`flex-shrink-0 border-b border-slate-100/90 bg-white/70 ${collapsed ? 'px-3 py-5' : 'px-5 py-5'}`}>
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-lg bg-sky-600 p-2 group-hover:bg-sky-500 transition flex-shrink-0 shadow-md shadow-sky-300/50">
            <Activity className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 tracking-wide">MediCare</div>
              <div className="text-[10px] text-slate-500 font-medium">Doctor Portal</div>
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
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{group.label}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`doc-nav-live group relative flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-sky-50/95 text-sky-700 border border-sky-100 shadow-sm shadow-sky-100/80'
                        : 'text-slate-600 hover:bg-white/80 hover:shadow-sm hover:shadow-slate-200/70 hover:text-slate-900'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sky-500 rounded-r-full" />
                    )}
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    {!collapsed && <span className="flex-1 doc-nav-label">{label}</span>}
                    {!collapsed && badge != null && (
                      <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white min-w-[20px] text-center">{badge}</span>
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
            className="doc-kinetic-btn w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-white/80 hover:shadow-sm hover:text-slate-700 transition"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* Doctor Profile + Logout */}
      <div className="flex-shrink-0 border-t border-slate-100/90 bg-white/55 p-3">
        <Link href="/doctor/profile" className={`doc-kinetic-btn flex items-center gap-3 group rounded-lg ${collapsed ? 'justify-center p-2' : 'p-2'} hover:bg-white/80 hover:shadow-sm transition`}>
          <div className="relative flex-shrink-0">
            <div className="h-9 w-9 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-slate-500" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name || 'Doctor'}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email || 'View Profile'}</div>
            </div>
          )}
        </Link>
        <Link
          href="/logout"
          method="post"
          as="button"
          className={`doc-kinetic-btn mt-1 w-full flex items-center gap-2 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Log Out'}
        </Link>
      </div>
    </div>
  );
}
