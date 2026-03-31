import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, Users, User, UserCog, LogOut, X, Stethoscope, Globe } from 'lucide-react';
import DoctorLogo from './DoctorLogo';

export default function DoctorSidebar({ currentPath, onClose }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const navGroups = [
    {
      label: 'Main',
      items: [
        { href: '/doctor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        { href: '/doctor/appointments', label: 'Appointments', Icon: CalendarDays },
        { href: '/doctor/patients', label: 'Patients', Icon: Users },
        { href: '/doctor/prescriptions', label: 'Prescriptions', Icon: ClipboardList },
      ]
    },
    {
      label: 'System',
      items: [
        { href: '/doctor/chambers', label: 'Chambers', Icon: Stethoscope },
        { href: '/doctor/schedule', label: 'Schedule', Icon: Settings },
        { href: '/doctor/profile', label: 'My Profile', Icon: UserCog },
      ]
    }
  ];

  const isActive = (href) => {
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full bg-[#1e2a4a]">
      {/* Mobile Close Button (inside sidebar) */}
      <div className="lg:hidden flex justify-end px-3 pt-3">
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Brand Header — desktop only */}
      <div className="hidden lg:flex flex-shrink-0 px-5 py-5">
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-xl bg-white/15 p-2.5 group-hover:bg-white/20 transition">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-black text-white tracking-wide">MediCare</div>
            <div className="text-[11px] text-white/50 font-medium">Doctor Portal</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 mt-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'mt-7' : ''}>
            <div className="px-3 mb-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(href)
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                    isActive(href) ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  }`} />
                  <span className="flex-1 leading-none">{label}</span>
                  {isActive(href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile + Logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="relative flex-shrink-0">
            <div className="h-9 w-9 overflow-hidden rounded-lg bg-white/15 flex items-center justify-center">
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
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1e2a4a] bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name || 'Doctor'}</div>
            <div className="text-[11px] text-white/45 truncate">{user?.email || ''}</div>
          </div>
          <Link
            href="/logout"
            method="post"
            as="button"
            title="Logout"
            className="flex-shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300 transition"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
