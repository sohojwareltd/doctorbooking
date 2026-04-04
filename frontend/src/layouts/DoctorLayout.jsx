import { Head, usePage } from '@inertiajs/react';
import DoctorSidebar from '../components/DoctorSidebar';
import DoctorHeader from '../components/DoctorHeader';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DoctorLayout({ children, title = '' }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routePulse, setRoutePulse] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [url]);
  useEffect(() => {
    setRoutePulse(true);
    const timer = setTimeout(() => setRoutePulse(false), 420);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <>
      <Head title={title ? `${title} - Doctor Dashboard` : 'Doctor Dashboard'} />
      <div className="min-h-screen bg-[#f0f2f5]" style={{ fontFamily: '"Montserrat", sans-serif' }}>
        <div className="min-h-screen flex flex-col lg:flex-row">
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`fixed top-0 left-0 h-screen w-72 lg:w-[250px] bg-[#1e2a4a] z-40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="h-full overflow-y-auto">
              <DoctorSidebar currentPath={url} onClose={() => setSidebarOpen(false)} />
            </div>
          </aside>
          <main className="flex-1 lg:ml-[250px] min-h-screen flex flex-col">
            <DoctorHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
            <div className="relative flex-1 overflow-y-auto">
              <AnimatePresence>
                {routePulse && (
                  <motion.div key={`pulse-${url}`} initial={{ opacity: 0.15 }} animate={{ opacity: 0.05 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="pointer-events-none absolute inset-0 z-10 bg-white" />
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={url}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="p-4 md:p-6 lg:p-8"
 className="doctor-route-stagger py-4 px-8 md:py-6 md:px-14 lg:py-8 lg:px-20"
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
