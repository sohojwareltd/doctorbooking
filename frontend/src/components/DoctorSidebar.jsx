import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays, ClipboardList, LayoutDashboard, Users, User, UserCog, X,
  Stethoscope, Globe, CalendarClock, BarChart3, CreditCard, Settings, CircleHelp, LogOut
} from 'lucide-react';

export default function DoctorSidebar({ currentPath, onClose }) {
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
    <div className="flex flex-col h-full bg-[#1e2a4a]">
      {/* Mobile Close */}
      <div className="lg:hidden flex justify-end px-3 pt-3">
        <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition" aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Brand */}
      <div className="flex-shrink-0 px-5 pt-6 pb-4">
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-xl bg-[#00acb1] p-2 group-hover:bg-[#009a9e] transition">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-wide">MediCare</div>
            <div className="text-[10px] text-white/40 font-medium tracking-wide">Doctor Portal</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">{group.label}</span>
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
                        : 'text-white/70 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} />
                    <span className="flex-1">{label}</span>
                    {badge != null && (
                      <span className="rounded-full bg-[#3b82f6] px-2 py-0.5 text-[10px] font-bold text-white min-w-[20px] text-center">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Doctor Profile + Logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        <Link href="/doctor/profile" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-white/15 flex items-center justify-center">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white/70" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1e2a4a] bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white/90 truncate">{user?.name || 'Doctor'}</div>
            <div className="text-[11px] text-[#00acb1] font-medium">View Profile</div>
          </div>
        </Link>
        <Link
          href="/logout"
          method="post"
          as="button"
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Link>
      </div>
    </div>
  );
}
