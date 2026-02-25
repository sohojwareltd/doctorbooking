import { Head, Link, usePage } from '@inertiajs/react';
import DoctorLogo from '../components/DoctorLogo';
import DoctorSidebar from '../components/DoctorSidebar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Unified Doctor Layout Component
 * - Consistent sidebar and main content structure
 * - Mobile responsive with toggle sidebar
 * - Used by all doctor dashboard pages
 */
export default function DoctorLayout({ children, title = '' }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Head title={title ? `${title} - Doctor Dashboard` : 'Doctor Dashboard'} />
      <div className="min-h-screen bg-[#f3f4f6]">
        {/* Main Container */}
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-lg bg-[#111827] p-1.5">
                <DoctorLogo className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-gray-900">MediCare</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Sidebar - Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30 top-16"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] lg:h-screen w-72 lg:w-64 bg-[#f9fafb] z-40 transform transition-transform duration-300 lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="h-full overflow-y-auto">
              <DoctorSidebar currentPath={url} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <div className="p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
