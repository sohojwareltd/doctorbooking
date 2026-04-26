import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays, ClipboardList, LayoutDashboard, Users, User, UserCog, UserPlus, X,
  Stethoscope, Globe, CalendarClock, LogOut, ChevronLeft, ChevronRight, ChevronDown, Settings, Pill
} from 'lucide-react';

export default function DoctorSidebar({ currentPath, onClose, collapsed = false, onToggleCollapse }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const brandName = user?.name || 'Doctor Profile';

  const isCompounder = user?.role === 'compounder';

  const practiceSettingsItems = [
    { href: '/doctor/chambers', label: 'Chambers', Icon: Stethoscope },
    { href: '/doctor/medicines', label: 'Medicines', Icon: Pill },
    { href: '/doctor/schedule', label: 'Schedule', Icon: CalendarClock },
    { href: '/doctor/profile', label: 'Profile', Icon: UserCog },
  ];

  const practiceSettingsActive = practiceSettingsItems.some(
    (item) => currentPath === item.href || currentPath.startsWith(item.href + '/')
  );

  const [practiceOpen, setPracticeOpen] = useState(practiceSettingsActive);
  const dropdownRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(0);

  useEffect(() => {
    if (dropdownRef.current) {
      setDropdownHeight(dropdownRef.current.scrollHeight);
    }
  }, [practiceOpen]);

  const navGroups = [
    {
      label: 'Menu',
      items: [
        { href: '/doctor/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        { href: '/doctor/appointments', label: 'Appointments', Icon: CalendarDays, badge: null },
        { href: '/doctor/patients', label: 'Patients', Icon: Users },
        { href: '/doctor/prescriptions', label: 'Prescriptions', Icon: ClipboardList },
        ...(!isCompounder ? [{ href: '/doctor/compounders', label: 'Compounders', Icon: UserPlus }] : []),
      ],
    },
  ];

  const isActive = (href) => currentPath === href || currentPath.startsWith(href + '/');
  const brandImageUrl = '/stethoscope-2.png';

  return (
    <div className="flex h-full flex-col bg-[#2D3A74] text-white">
      {/* Mobile Close */}
      <div className="lg:hidden flex justify-end px-3 pt-3">
        <button onClick={onClose} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Close sidebar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Logo Area */}
      <div className={`flex-shrink-0 ${collapsed ? 'px-3 py-6 pb-8' : 'px-6 py-6 pb-8'} flex items-center justify-between`}>
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="rounded-lg bg-white p-1 transition group-hover:bg-slate-100 flex-shrink-0 shadow-md">
            <img
              src={brandImageUrl}
              alt="Medical logo"
              className="h-10 w-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <Stethoscope className="hidden text-[#2D3A74]" style={{ width: 20, height: 20 }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-base font-bold tracking-wide text-white">{brandName}</div>
              <div className="text-[11px] font-medium text-white/60">Doctor Portal</div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto doc-sidebar-scroll px-0">
        {/* MAIN Section */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider px-6 mb-3">MAIN</h3>
          )}
          <ul className="space-y-1">
            {navGroups[0].items.map(({ href, label, Icon, badge }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center text-white text-sm py-3 transition-colors ${
                      active
                        ? 'font-semibold'
                        : 'hover:bg-white/10'
                    } ${collapsed ? 'justify-center px-2.5' : ''}`}
                    style={active ? { background: 'rgba(255,255,255,0.15)', borderLeft: '4px solid #FF7C00', paddingLeft: collapsed ? undefined : '20px' } : { paddingLeft: collapsed ? undefined : '24px' }}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${active ? 'text-white' : 'text-white/70'}`} />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && badge != null && (
                      <span className="ml-auto min-w-[22px] rounded-full bg-[#FF7C00] px-2 py-0.5 text-center text-[11px] font-bold text-white">{badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Practice Settings Dropdown — doctor only */}
            {practiceSettingsItems.length > 0 && (
            <li>
              <div className="sidebar-menu-item">
                <div className={`flex items-center ${practiceSettingsActive && !practiceOpen ? '' : ''}`}
                     style={practiceSettingsActive && !practiceOpen ? { background: 'rgba(255,255,255,0.15)', borderLeft: '4px solid #FF7C00', paddingLeft: '20px' } : {}}>
                  <button
                    onClick={() => setPracticeOpen((prev) => !prev)}
                    className={`flex items-center flex-1 text-white text-sm py-3 transition-colors ${
                      practiceSettingsActive ? 'font-semibold' : 'hover:bg-white/10'
                    } ${collapsed ? 'justify-center px-2.5' : ''}`}
                    style={!practiceSettingsActive || practiceOpen ? { paddingLeft: collapsed ? undefined : '24px' } : {}}
                    title={collapsed ? 'Practice Settings' : undefined}
                  >
                    <Settings className={`w-5 h-5 mr-3 flex-shrink-0 ${practiceSettingsActive ? 'text-white' : 'text-white/70'}`} />
                    {!collapsed && <span>Practice Settings</span>}
                  </button>
                  {!collapsed && (
                    <button
                      onClick={() => setPracticeOpen((prev) => !prev)}
                      className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${practiceOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                <div
                  ref={dropdownRef}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: practiceOpen ? `${dropdownHeight}px` : '0px',
                    opacity: practiceOpen ? 1 : 0,
                  }}
                >
                  <ul>
                    {practiceSettingsItems.map(({ href, label, Icon }) => {
                      const active = isActive(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={`flex items-center text-white text-sm py-2 transition-colors ${
                              active ? 'font-semibold' : 'hover:bg-white/10'
                            }`}
                            style={active ? { background: 'rgba(255,255,255,0.15)', borderLeft: '4px solid #FF7C00', paddingLeft: '40px' } : { paddingLeft: '44px' }}
                          >
                            <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${active ? 'text-white' : 'text-white/70'}`} />
                            {!collapsed && <span>{label}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Collapse toggle (desktop only) */}
      {/* {onToggleCollapse && (
        <div className="hidden lg:block px-3 pb-2">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className={`h-[18px] w-[18px] transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )} */}

      {/* Doctor Profile + Logout */}
      <div className="flex-shrink-0 border-t border-white/10 p-3">
        <Link href="/doctor/profile" className={`group flex items-center gap-3 rounded-xl ${collapsed ? 'justify-center p-2.5' : 'p-2.5'} transition hover:bg-white/10`}>
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
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
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium text-white">{user?.name || 'Doctor'}</div>
              <div className="truncate text-xs text-white/60">{user?.email || 'View Profile'}</div>
            </div>
          )}
        </Link>
        <Link
          href="/logout"
          method="post"
          as="button"
          className={`mt-1.5 flex w-full items-center gap-2 rounded-xl py-2.5 text-sm ${collapsed ? 'justify-center px-2.5' : 'px-3.5'} text-white/70 transition hover:bg-white/10 hover:text-white`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && 'Log Out'}
        </Link>
      </div>
    </div>
  );
}
