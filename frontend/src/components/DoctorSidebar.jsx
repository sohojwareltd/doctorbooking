import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, Users, User, UserCog, LogOut, ChevronRight, Stethoscope } from 'lucide-react';
import DoctorLogo from './DoctorLogo';

export default function DoctorSidebar({ currentPath }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/doctor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      ]
    },
    {
      label: 'Patient Care',
      items: [
        { href: '/doctor/appointments', label: 'Appointments', Icon: CalendarDays },
        { href: '/doctor/patients', label: 'Patients', Icon: Users },
        { href: '/doctor/prescriptions', label: 'Prescriptions', Icon: ClipboardList },
      ]
    },
    {
      label: 'Settings',
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
    <div className="flex flex-col h-full bg-[#f9fafb] border-r border-gray-200">
      {/* Brand Header */}
      <div className="flex-shrink-0 px-4 py-5 border-b border-gray-200 bg-white">
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-xl bg-[#111827] p-2.5 shadow-sm group-hover:shadow-md transition-shadow">
            <DoctorLogo className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">MediCare</div>
            <div className="text-xs text-gray-500">Doctor Portal</div>
          </div>
        </Link>
      </div>

      {/* Doctor Profile Card */}
      <div className="flex-shrink-0 mx-3 my-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`} 
                    alt={user.name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Doctor'}</div>
              {user?.specialization && (
                <div className="text-xs text-gray-600 truncate mt-0.5">{user.specialization}</div>
              )}
              {user?.degree && (
                <div className="text-xs text-gray-500 truncate mt-0.5">{user.degree}</div>
              )}
              <div className="flex items-center gap-1 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-600 font-medium">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'mt-6' : ''}>
            <div className="px-3 mb-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </div>
            </div>
            <div className="space-y-1">
              {group.items.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(href)
                      ? 'bg-white text-gray-900 border border-gray-300 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive(href) ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="flex-1">{label}</span>
                  {isActive(href) && (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200">
        <Link
          href="/logout"
          method="post"
          as="button"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
