import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays, CalendarPlus, FileText, LayoutDashboard,
  LogOut, ChevronDown, ChevronRight, User, Activity,
  Heart, ShieldCheck
} from 'lucide-react';
import DoctorLogo from './DoctorLogo';
import { useState } from 'react';

export default function UserSidebar({ currentPath }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const isActive = (href) => currentPath === href || currentPath.startsWith(href + '/');
  const isGroupActive = (hrefs) => hrefs.some((h) => isActive(h));

  const [openGroups, setOpenGroups] = useState({ appointments: true });
  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Link href="/user/dashboard" className="flex items-center gap-2.5">
          <div className="rounded-lg bg-gradient-to-br from-[#005963] to-[#00acb1] p-1.5 shadow-sm">
            <DoctorLogo className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">MediCare</div>
            <div className="text-[10px] text-gray-500 leading-tight">Patient Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <NavItem href="/user/dashboard" label="Home" Icon={LayoutDashboard} active={isActive('/user/dashboard')} />

        {/* Appointments expandable */}
        <div>
          <button
            onClick={() => toggleGroup('appointments')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isGroupActive(['/user/appointments', '/user/book-appointment'])
                ? 'bg-[#005963]/10 text-[#005963] font-semibold'
                : 'text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Appointments</span>
            {openGroups.appointments
              ? <ChevronDown className="h-3 w-3 opacity-60" />
              : <ChevronRight className="h-3 w-3 opacity-60" />}
          </button>
          {openGroups.appointments && (
            <div className="mt-0.5 space-y-0.5 pl-8">
              <SubNavItem href="/user/appointments" label="My Appointments" active={isActive('/user/appointments')} />
              <SubNavItem href="/user/book-appointment" label="Book Appointment" active={isActive('/user/book-appointment')} />
            </div>
          )}
        </div>

        <NavItem href="/user/prescriptions" label="Prescriptions" Icon={FileText} active={isActive('/user/prescriptions')} />

        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Workflows</p>
        </div>

        <NavItem href="/user/profile" label="My Profile" Icon={User} active={isActive('/user/profile')} />
        <NavItem href="/user/health" label="Health Records" Icon={Activity} active={isActive('/user/health')} />
        <NavItem href="/user/insurance" label="Insurance" Icon={ShieldCheck} active={isActive('/user/insurance')} />
      </nav>

      {/* Promo Card */}
      <div className="px-3 pb-3">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-md bg-amber-400 p-1.5">
              <Heart className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-amber-900">Health Plan</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800 mb-2.5">
            Accept premium health features and specialist consultations.
          </p>
          <button className="w-full rounded-lg bg-gray-900 text-white text-[11px] font-semibold py-1.5 hover:bg-gray-800 transition">
            Set up now
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-3 border-t border-gray-200 pt-3">
        <Link
          href="/logout"
          method="post"
          as="button"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}

function NavItem({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-[#005963]/10 text-[#005963] font-semibold'
          : 'text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#005963]' : 'text-gray-400'}`} />
      <span>{label}</span>
    </Link>
  );
}

function SubNavItem({ href, label, active }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? 'text-[#005963] font-semibold'
          : 'text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  );
}
