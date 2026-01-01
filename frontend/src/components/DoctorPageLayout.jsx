import { Head, Link, usePage } from '@inertiajs/react';
import ParticlesBackground from './ParticlesBackground';
import DoctorLogo from './DoctorLogo';
import CollapsibleSidebar from './CollapsibleSidebar';
import Breadcrumb from './Breadcrumb';

export default function DoctorPageLayout({ title, children }) {
  const { url } = usePage();

  return (
    <div className="min-h-screen relative bg-gray-50">
      <Head title={title} />
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <ParticlesBackground id="tsparticles-doctor-page" variant="pulse" />
      </div>

      {/* Main Container */}
      <div className="relative z-50 h-screen flex flex-col">
        {/* Top Logo Bar for Mobile */}
        <div className="md:hidden px-4 pt-4">
          <div className="flex items-center justify-between rounded-2xl border-2 border-[#005963] bg-white/80 p-4 backdrop-blur-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-[#005963] p-1.5">
                <DoctorLogo className="h-8 w-8" />
              </div>
              <div>
                <div className="font-black leading-tight text-[#005963]">MediCare</div>
                <div className="text-xs text-[#005963]/70">Doctor</div>
              </div>
            </Link>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="rounded-xl bg-[#005963]/10 px-3 py-2 text-sm font-semibold text-[#005963] transition hover:bg-[#005963]/20"
            >
              Logout
            </Link>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex flex-1 overflow-hidden gap-0 w-full">
          {/* Left Sidebar - Doctor Profile Card */}
          <div className="flex-shrink-0 overflow-hidden w-80">
            <CollapsibleSidebar currentPath={url} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto pb-8 scrollbar-thin scrollbar-thumb-[#005963]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#005963]/50 min-w-0">
            <Breadcrumb items={[]} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
