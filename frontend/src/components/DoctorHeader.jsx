import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, LogOut, Menu, User, UserCog, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function DoctorHeader({ title = '', onMenuClick }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="doc-header-shell sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="doc-header-glow absolute -left-10 top-1/2 h-20 w-28 -translate-y-1/2 rounded-full bg-sky-200/40 blur-2xl" />
        <div className="doc-header-glow absolute right-16 top-1/2 h-14 w-24 -translate-y-1/2 rounded-full bg-teal-200/35 blur-2xl" style={{ animationDelay: '1.6s' }} />
      </div>
      <div className="relative flex h-[66px] items-center justify-between px-5 md:px-8 lg:px-20 xl:px-28">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="doc-kinetic-btn lg:hidden p-2 rounded-lg hover:bg-slate-100 transition" aria-label="Open sidebar">
            <Menu className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <h1 className="doc-title-live text-base font-semibold tracking-tight text-slate-900">{title}</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="doc-search-live w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-[0_1px_0_rgba(148,163,184,0.08)] focus:bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-100 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <button className="doc-kinetic-btn relative rounded-lg p-2 hover:bg-slate-100 transition" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="doc-live-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 mx-1.5 hidden sm:block" />

          {/* Status Badge */}
          <div className="doc-header-chip hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Online</span>
          </div>

          {/* Avatar + Dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="doc-kinetic-btn flex items-center gap-2 rounded-lg hover:bg-slate-50 transition px-2 py-1.5"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{user?.name || 'Doctor'}</div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="doc-dropdown-enter absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Doctor'}</div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{user?.email || ''}</div>
                </div>
                <div className="py-1">
                  <Link
                    href="/doctor/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <UserCog className="h-4 w-4 text-slate-400" />
                    My Profile
                  </Link>
                </div>
                <div className="border-t border-slate-100 py-1">
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
