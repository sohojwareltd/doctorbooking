import { Link, usePage } from '@inertiajs/react';
import ParticlesBackground from '../components/ParticlesBackground';
import DoctorLogo from '../components/DoctorLogo';
import GlassCard from '../components/GlassCard';

export default function DoctorLayout({ children }) {
  const { auth } = usePage().props;
  const { url } = usePage();

  const navLinkClass = (href) => {
    const active = url === href || url.startsWith(href + '/');
    return `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      active ? 'bg-[#005963] text-white' : 'text-[#005963] hover:bg-[#005963]/10'
    }`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#005963] via-[#004148] to-[#005963]">
      <div className="absolute inset-0 z-0">
        <ParticlesBackground id="tsparticles-doctor" variant="pulse" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-72 p-4">
          <div className="bg-[#FFFEF7] rounded-3xl shadow-lg h-full overflow-y-auto p-5 flex flex-col">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="bg-[#005963] rounded-2xl p-2">
                <DoctorLogo className="h-10 w-10" />
              </div>
              <div>
                <div className="text-[#005963] font-black leading-tight">MediCare</div>
                <div className="text-[#005963]/70 text-xs">Doctor</div>
              </div>
            </Link>

            <nav className="space-y-2 flex-1">
              <Link href="/doctor/dashboard" className={navLinkClass('/doctor/dashboard')}>Dashboard</Link>
              <Link href="/doctor/appointments" className={navLinkClass('/doctor/appointments')}>Appointments</Link>
              <Link href="/doctor/patients" className={navLinkClass('/doctor/patients')}>Patients</Link>
              <Link href="/doctor/prescriptions" className={navLinkClass('/doctor/prescriptions')}>Prescriptions</Link>
              <Link href="/doctor/schedule" className={navLinkClass('/doctor/schedule')}>Schedule</Link>
            </nav>

            <div className="pt-4 border-t border-[#005963]/15">
              <div className="text-[#005963]/70 text-sm mb-3 truncate">{auth?.user?.name}</div>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="w-full rounded-2xl bg-[#005963]/10 px-4 py-3 text-sm font-semibold text-[#005963] hover:bg-[#005963]/20 transition"
              >
                Logout
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1 p-4 md:p-8 md:ml-80">
          <div className="md:hidden mb-4">
            <div className="bg-[#FFFEF7] rounded-3xl shadow-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-[#005963] rounded-xl p-1.5">
                    <DoctorLogo className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-[#005963] font-black leading-tight">MediCare</div>
                    <div className="text-[#005963]/70 text-xs">Doctor</div>
                  </div>
                </Link>
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="rounded-xl bg-[#005963]/10 px-3 py-2 text-sm font-semibold text-[#005963] hover:bg-[#005963]/20 transition"
                >
                  Logout
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/doctor/dashboard" className={navLinkClass('/doctor/dashboard')}>Dashboard</Link>
                <Link href="/doctor/appointments" className={navLinkClass('/doctor/appointments')}>Appointments</Link>
                <Link href="/doctor/patients" className={navLinkClass('/doctor/patients')}>Patients</Link>
                <Link href="/doctor/schedule" className={navLinkClass('/doctor/schedule')}>Schedule</Link>
                <Link href="/doctor/prescriptions" className={navLinkClass('/doctor/prescriptions')}>Prescriptions</Link>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFEF7] rounded-3xl shadow-lg p-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
