import { Head, usePage } from '@inertiajs/react';
import DoctorSidebar from '../components/DoctorSidebar';
import DoctorHeader from '../components/DoctorHeader';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SIDEBAR_W = 260;
const SIDEBAR_COLLAPSED_W = 68;

export default function DoctorLayout({ children, title = '', gradient = false }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [url]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const bgStyle = gradient
    ? 'radial-gradient(circle at top right, rgba(255, 124, 0, 0.08), transparent 24%), linear-gradient(180deg, #F8FAFC 0%, #F7F8FA 100%)'
    : '#F7F8FA';

  return (
    <>
      <Head title={title ? `${title} - Doctor Dashboard` : 'Doctor Dashboard'} />
      <div className="doctor-theme min-h-screen" style={{ fontFamily: 'var(--thm-font)', background: bgStyle }}>
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-30 bg-[rgba(26,36,67,0.52)] backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed top-0 left-0 h-screen z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            style={{ width: sidebarOpen ? SIDEBAR_W : sidebarWidth }}
          >
            <div className="h-full overflow-y-auto">
              <DoctorSidebar
                currentPath={url}
                onClose={() => setSidebarOpen(false)}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
              />
            </div>
          </aside>

          {/* Main content with responsive sidebar margin */}
          <main className="flex-1 min-h-screen flex flex-col" style={{ marginLeft: 0 }}>
            <div
              className="flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out"
              id="doc-main"
            >
              {/* On lg+, offset sidebar width for main and header */}
              <style>{`
                @media (min-width: 1024px) {
                  #doc-main { margin-left: ${sidebarWidth}px; }
                  #doc-header { left: ${sidebarWidth}px; }
                }
              `}</style>
              <DoctorHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
              <div className="relative flex-1 pt-16 min-h-screen">

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="doctor-route-stagger relative z-10 p-4 md:p-8"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
