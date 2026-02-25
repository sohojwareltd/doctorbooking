import { Head, Link, usePage } from '@inertiajs/react';
import DoctorLogo from '../components/DoctorLogo';
import AdminSidebar from '../components/AdminSidebar';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Unified Admin Layout Component
 * - Consistent sidebar and main content structure
 * - Mobile responsive with toggle sidebar
 * - Used by all admin dashboard pages
 */
export default function AdminLayout({ children, title = '' }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routePulse, setRoutePulse] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [url]);

  useEffect(() => {
    setRoutePulse(true);
    const timer = setTimeout(() => setRoutePulse(false), 420);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <>
      <Head title={title ? `${title} - Admin Dashboard` : 'Admin Dashboard'} />
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
              <AdminSidebar currentPath={url} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <AnimatePresence>
                {routePulse && (
                  <motion.div
                    key={`pulse-${url}`}
                    initial={{ opacity: 0.18 }}
                    animate={{ opacity: 0.08 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 z-10 bg-white"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={url}
                  initial={{ opacity: 0, x: 26, y: 14, scale: 0.985, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -22, y: -8, scale: 0.99, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="doctor-route-stagger p-4 md:p-6 lg:p-8"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
