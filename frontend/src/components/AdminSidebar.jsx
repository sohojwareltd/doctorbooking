import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CalendarCheck2, LayoutDashboard, PlusCircle, Settings, Users, User, LogOut, ChevronRight, FileText } from 'lucide-react';
import DoctorLogo from './DoctorLogo';

export default function AdminSidebar({ currentPath }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      ]
    },
    {
      label: 'Management',
      items: [
        { href: '/admin/users', label: 'Users', Icon: Users },
        { href: '/admin/appointments', label: 'Appointments', Icon: CalendarCheck2 },
        { href: '/admin/prescriptions', label: 'Prescriptions', Icon: FileText },
        { href: '/admin/book-appointment', label: 'Book Appointment', Icon: PlusCircle },
      ]
    },
    {
      label: 'Analytics & Settings',
      items: [
        { href: '/admin/reports', label: 'Reports', Icon: BarChart3 },
        { href: '/admin/settings', label: 'Content Settings', Icon: Settings },
      ]
    }
  ];

  const isActive = (href) => {
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="flex-shrink-0 px-4 py-5 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-xl bg-gradient-to-br from-[#005963] to-[#00acb1] p-2.5 shadow-sm group-hover:shadow-md transition-shadow">
            <DoctorLogo className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">MediCare</div>
            <div className="text-xs text-gray-500">Admin Portal</div>
          </div>
        </Link>
      </div>

      {/* User Profile Compact */}
      <div className="flex-shrink-0 px-4 py-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-200 bg-white">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`} 
                  alt={user.name} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#005963] to-[#00acb1]">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
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
                      ? 'bg-[#005963] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive(href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="flex-1">{label}</span>
                  {isActive(href) && (
                    <ChevronRight className="h-4 w-4 text-white/70" />
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
