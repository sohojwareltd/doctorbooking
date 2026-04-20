import { Link, usePage } from '@inertiajs/react';
import { Menu, X, LogIn, ArrowUp, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import DoctorLogo from '../components/DoctorLogo';

export default function PublicLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { auth, home, doctor, publicDoctor } = usePage().props;

    const header = home?.header || {};
    const footer = home?.footer || {};
    const headerLogoUrl = header.logoUrl;
    const brandName = publicDoctor?.name || doctor?.name || auth?.user?.name || 'Doctor Profile';
    const footerBrandName = footer.brandName || brandName;
    const footerCopyright = footer.copyright || `Copyright ${new Date().getFullYear()} ${footerBrandName}. All rights reserved.`;

        const dashboardHref =
                auth?.user?.role === 'admin'
                        ? '/admin/dashboard'
                        : auth?.user?.role === 'doctor'
                            ? '/doctor/dashboard'
                            : auth?.user?.role === 'user'
                                ? '/user/dashboard'
                                : '/dashboard';

        const navLinks = [
            { label: 'Home', href: '/' },
            { label: 'Chambers', href: '/#chambers' },
            { label: 'About', href: '/#about' },
        ];

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <nav className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(8,24,29,0.78)] shadow-[0_18px_45px_rgba(2,12,17,0.18)] backdrop-blur-2xl">
                <div className="flex h-[74px] items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="group flex shrink-0 items-center gap-3">
                            {headerLogoUrl && headerLogoUrl.trim() !== '' ? (
                                <>
                                    <img 
                                        src={headerLogoUrl} 
                                        alt="Logo" 
                                        className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
                                    />
                                    <div className="hidden text-base font-semibold tracking-wide text-white sm:block">{brandName}</div>
                                </>
                            ) : (
                                <>
                                    <div className="rounded-2xl bg-[linear-gradient(135deg,#123c46_0%,#1ea39b_100%)] p-2.5 shadow-[0_10px_24px_rgba(30,163,155,0.22)] transition-shadow group-hover:shadow-[0_14px_30px_rgba(30,163,155,0.3)]">
                                        <DoctorLogo className="h-6 w-6" />
                                    </div>
                                    <div className="hidden text-base font-semibold tracking-wide text-white sm:block">{brandName}</div>
                                </>
                            )}
                        </Link>

                        <div className="hidden items-center gap-3 md:flex">
                            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2 py-2 backdrop-blur-xl">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="rounded-full px-4 py-2 text-sm font-medium text-white/82 transition hover:bg-white/10 hover:text-white"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>

                            <Link
                                href="/book-appointment"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b8ff4f] px-6 py-3 text-sm font-semibold text-[#062128] shadow-[0_18px_40px_rgba(184,255,79,0.34)] ring-4 ring-[#dfffaa]/25 transition hover:bg-[#d2ff85] hover:shadow-[0_22px_48px_rgba(184,255,79,0.46)]"
                            >
                                Book Now
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            {auth.user ? (
                                <>
                                    <Link
                                        href={dashboardHref}
                                        className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                    >
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3 md:hidden">
                            <Link
                                href="/book-appointment"
                                className="inline-flex items-center rounded-full bg-[#b8ff4f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#062128] shadow-[0_12px_24px_rgba(184,255,79,0.32)]"
                            >
                                Book Now
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="border-t border-white/10 px-4 pb-4 pt-4 md:hidden sm:px-6 lg:px-8">
                            <div className="space-y-2">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/book-appointment"
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b8ff4f] px-5 py-4 text-sm font-semibold text-[#062128] shadow-[0_16px_32px_rgba(184,255,79,0.34)] ring-4 ring-[#dfffaa]/20"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Book Now
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {auth.user && (
                                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                                    <Link
                                        href={dashboardHref}
                                        className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Logout
                                    </Link>
                                </div>
                            )}

                            {!auth.user && (
                                <div className="mt-3 border-t border-white/10 pt-3">
                                    <Link
                                        href="/login"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 px-4 py-3 text-sm font-medium text-white/86 transition hover:bg-white/8 hover:text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            <footer className="border-t border-slate-200 bg-[#f8fbfa]">
                <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
                    {footerCopyright}
                </div>
            </footer>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-[#005963] to-[#00acb1] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-bounce"
                    title="Back to top"
                >
                    <ArrowUp className="h-6 w-6" />
                </button>
            )}
        </div>
    );
}
