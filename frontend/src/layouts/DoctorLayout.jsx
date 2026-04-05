import { Head, usePage } from '@inertiajs/react';
import DoctorSidebar from '../components/DoctorSidebar';
import DoctorHeader from '../components/DoctorHeader';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SIDEBAR_W = 256;
const SIDEBAR_COLLAPSED_W = 72;

export default function DoctorLayout({ children, title = '' }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [url]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  return (
    <>
      <Head title={title ? `${title} - Doctor Dashboard` : 'Doctor Dashboard'} />
      <div className="doctor-theme min-h-screen bg-[var(--doc-surface)]" style={{ fontFamily: 'var(--thm-font)' }}>
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
            <div className="hidden lg:block fixed inset-0 pointer-events-none" />
            <div
              className="flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out"
              style={{ marginLeft: undefined }}
              id="doc-main"
            >
              {/* On lg+, offset by sidebar width dynamically */}
              <style>{`
                @media (min-width: 1024px) {
                  #doc-main { margin-left: ${sidebarWidth}px; }
                }
              `}</style>
              <DoctorHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
              <div className="relative flex-1 overflow-y-auto">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute right-[-120px] top-[-80px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(197,121,69,0.22),rgba(197,121,69,0))]" />
                  <div className="absolute left-[-90px] bottom-[-110px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(54,87,167,0.2),rgba(54,87,167,0))]" />
                  <div className="doc-ambient-orb doc-ambient-orb-a" />
                  <div className="doc-ambient-orb doc-ambient-orb-b" />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="doctor-route-stagger relative z-10 p-5 md:p-8 lg:px-20 xl:px-28 lg:py-8"
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
