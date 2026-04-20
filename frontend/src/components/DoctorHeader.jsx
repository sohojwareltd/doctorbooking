import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, User, UserCog } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function DoctorHeader({ title = '', onMenuClick, collapsed = false, onToggleCollapse }) {
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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b border-[#EDEDED] flex items-center justify-between px-4 md:px-8 " style={{ left: undefined }} id="doc-header">
      <div className="flex items-center gap-3 text-sm">
        <button onClick={onMenuClick} className="lg:hidden text-[#2D3A74]" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-[#2D3A74]/60 transition hover:bg-[#2D3A74]/8 hover:text-[#2D3A74]"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        )}
        {title && (
          <span className="text-[#2D3A74] font-medium">{title}</span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="text-[#6A6A6A] hover:text-[#2D3A74] transition-colors relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Admin Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-3 cursor-pointer group"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e9eef9] flex items-center justify-center">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `/storage/${user.profile_picture}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-[#6A6A6A]" />
              )}
            </div>
            <ChevronDown className={`h-3 w-3 text-[#6A6A6A] group-hover:text-[#2D3A74] transition-colors ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Doctor'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
              <Link
                href="/doctor/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCog className="h-4 w-4" />
                My Profile
              </Link>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                onClick={() => setDropdownOpen(false)}
              >
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
