import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, LogOut, Menu, User, UserCog, Search, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function DoctorHeader({ title = '', onMenuClick }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-gray-100 px-4 lg:px-6 h-[56px]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition" aria-label="Open sidebar">
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients, appointments, prescriptions..."
            className="w-full rounded-lg bg-gray-50 border border-gray-200 pl-10 pr-10 py-2 text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Ctrl</kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition" aria-label="Messages">
          <MessageSquare className="h-5 w-5 text-gray-500" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Availability Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-700">Available</span>
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full hover:bg-gray-100 transition pl-1 pr-2 py-1"
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden bg-[#1e2a4a]/10 flex items-center justify-center flex-shrink-0">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-[#1e2a4a]/70" />
              )}
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Doctor'}</div>
                <div className="text-[11px] text-gray-400 truncate">{user?.email || ''}</div>
              </div>
              <Link href="/doctor/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                <UserCog className="h-4 w-4 text-gray-400" />
                My Profile
              </Link>
              <Link href="/logout" method="post" as="button" className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition" onClick={() => setDropdownOpen(false)}>
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
