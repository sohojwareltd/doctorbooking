import { Link, usePage } from '@inertiajs/react';
import ParticlesBackground from '../components/ParticlesBackground';
import DoctorLogo from '../components/DoctorLogo';
import GlassCard from '../components/GlassCard';

export default function UserLayout({ children }) {
  const { auth } = usePage().props;
  const { url } = usePage();

  const navLinkClass = (href) => {
    const active = url === href || url.startsWith(href + '/');
    return `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      active ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
    }`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#005963] via-[#004148] to-[#005963]">
      <div className="absolute inset-0 z-0">
        <ParticlesBackground id="tsparticles-user" variant="pulse" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-72 p-4">
          <GlassCard variant="glass" className="h-full overflow-y-auto p-5 flex flex-col">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="bg-white rounded-2xl p-2">
                <DoctorLogo className="h-10 w-10" />
              </div>
              <div>
                <div className="text-white font-black leading-tight">MediCare</div>
                <div className="text-white/70 hint text-xs">Patient</div>
              </div>
            </Link>

            <nav className="space-y-2 flex-1">
              <Link href="/user/dashboard" className={navLinkClass('/user/dashboard')}>Dashboard</Link>
              <Link href="/user/appointments" className={navLinkClass('/user/appointments')}>Appointments</Link>
              <Link href="/user/book-appointment" className={navLinkClass('/user/book-appointment')}>Book Appointment</Link>
              <Link href="/user/prescriptions" className={navLinkClass('/user/prescriptions')}>Prescriptions</Link>
            </nav>

            <div className="pt-4 border-t border-white/15">
              <div className="text-white/70 text-sm mb-3 truncate">{auth?.user?.name}</div>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
              >
                Logout
              </Link>
            </div>
          </GlassCard>
        </aside>

        <div className="flex-1 p-4 md:p-8 md:ml-80">
          <div className="md:hidden mb-4">
            <GlassCard variant="glass" className="p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-white rounded-xl p-1.5">
                    <DoctorLogo className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-white font-black leading-tight">MediCare</div>
                    <div className="text-white/70 text-xs">Patient</div>
                  </div>
                </Link>
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 transition"
                >
                  Logout
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/user/dashboard" className={navLinkClass('/user/dashboard')}>Dashboard</Link>
                <Link href="/user/appointments" className={navLinkClass('/user/appointments')}>Appointments</Link>
                <Link href="/user/book-appointment" className={navLinkClass('/user/book-appointment')}>Book</Link>
                <Link href="/user/prescriptions" className={navLinkClass('/user/prescriptions')}>Prescriptions</Link>
              </div>
            </GlassCard>
          </div>

          <GlassCard variant="solid" className="p-0 overflow-hidden">
            {children}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
