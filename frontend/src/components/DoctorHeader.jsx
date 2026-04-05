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
    <header className="doc-header-shell sticky top-0 z-20 border-b border-[#d8deea]/70 bg-white/80 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6b87cf]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="doc-header-glow absolute -left-10 top-1/2 h-20 w-28 -translate-y-1/2 rounded-full bg-[#8da5de]/35 blur-2xl" />
        <div className="doc-header-glow absolute right-16 top-1/2 h-14 w-24 -translate-y-1/2 rounded-full bg-[#d8a983]/30 blur-2xl" style={{ animationDelay: '1.6s' }} />
      </div>
      <div className="relative flex h-[66px] items-center justify-between px-5 md:px-8 lg:px-20 xl:px-28">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="doc-kinetic-btn rounded-lg p-2 transition hover:bg-[#e9eef9] lg:hidden" aria-label="Open sidebar">
            <Menu className="h-5 w-5 text-[var(--doc-text-muted)]" />
          </button>
          <div>
            <h1 className="doc-title-live text-base font-semibold tracking-tight text-[var(--doc-text)]">{title}</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--doc-text-light)]" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="doc-search-live w-full rounded-xl border border-[var(--doc-border)] bg-white/85 py-2.5 pl-10 pr-4 text-sm text-[var(--doc-text)] placeholder-[var(--doc-text-light)] shadow-[0_1px_0_rgba(123,139,174,0.1)] transition focus:border-[var(--doc-primary)] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <button className="doc-kinetic-btn relative rounded-lg p-2 transition hover:bg-[#e9eef9]" aria-label="Notifications">
            <Bell className="h-5 w-5 text-[var(--doc-text-muted)]" />
            <span className="doc-live-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#c57945] ring-2 ring-white" />
          </button>

          {/* Separator */}
          <div className="mx-1.5 hidden h-6 w-px bg-[var(--doc-border)] sm:block" />

          {/* Status Badge */}
          <div className="doc-header-chip hidden items-center gap-1.5 rounded-full border border-[#e2c2aa] bg-[#f6ece5] px-3 py-1 lg:flex">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d19567] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c57945]" />
            </span>
            <span className="text-[11px] font-semibold text-[#9c5b31]">Online</span>
          </div>

          {/* Avatar + Dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="doc-kinetic-btn flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[#eef2fb]"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e9eef9]">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-[var(--doc-text-light)]" />
                )}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="max-w-[120px] truncate text-sm font-medium text-[var(--doc-text)]">{user?.name || 'Doctor'}</div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-[var(--doc-text-light)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="doc-dropdown-enter absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--doc-border)] bg-white py-1 shadow-lg shadow-[#9cabcb]/35">
                <div className="border-b border-[var(--doc-border-light)] px-4 py-3">
                  <div className="truncate text-sm font-semibold text-[var(--doc-text)]">{user?.name || 'Doctor'}</div>
                  <div className="mt-0.5 truncate text-xs text-[var(--doc-text-light)]">{user?.email || ''}</div>
                </div>
                <div className="py-1">
                  <Link
                    href="/doctor/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--doc-text)] transition hover:bg-[#eff3fb]"
                  >
                    <UserCog className="h-4 w-4 text-[var(--doc-text-light)]" />
                    My Profile
                  </Link>
                </div>
                <div className="border-t border-[var(--doc-border-light)] py-1">
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
