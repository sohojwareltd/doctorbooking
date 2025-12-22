import { Link, usePage } from '@inertiajs/react';
import { Menu, X, LogIn, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ParticlesBackground from '../components/ParticlesBackground';
import DoctorLogo from '../components/DoctorLogo';

export default function PublicLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { auth } = usePage().props;

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
            {/* Navigation */}
            <nav className="sticky top-0 z-40 bg-gradient-to-r from-[#005963] to-[#004148] shadow-lg relative overflow-hidden">
                {/* Particles Background */}
                <div className="absolute inset-0 z-0">
                    <ParticlesBackground id="tsparticles-nav" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center gap-3">
                            <div className="bg-white rounded-lg p-1">
                                <DoctorLogo className="h-10 w-10" />
                            </div>
                            <span className="text-xl font-bold text-white hidden sm:inline">
                                MediCare
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link
                                href="/"
                                className="text-white hover:text-[#00acb1] transition flex items-center gap-2"
                            >
                                Home
                            </Link>
                            <Link
                                href="/#about"
                                className="text-white hover:text-[#00acb1] transition"
                            >
                                About
                            </Link>
                            <Link
                                href="/#services"
                                className="text-white hover:text-[#00acb1] transition"
                            >
                                Services
                            </Link>
                            <Link
                                href="/#booking"
                                className="text-white hover:text-[#00acb1] transition"
                            >
                                Book
                            </Link>
                            <Link
                                href="/#contact"
                                className="text-white hover:text-[#00acb1] transition"
                            >
                                Contact
                            </Link>

                            {auth.user ? (
                                <>
                                    <Link
                                        href={
                                            auth.user.role === 'doctor'
                                                ? '/doctor/dashboard'
                                                : '/user/dashboard'
                                        }
                                        className="text-white hover:text-[#00acb1] transition"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="bg-[#00acb1] text-white px-6 py-2 rounded-lg hover:bg-[#00787b] transition"
                                    >
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 bg-[#00acb1] text-white px-6 py-2 rounded-lg hover:bg-[#00787b] transition"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-4">
                            {!auth.user && (
                                <Link
                                    href="/login"
                                    className="text-white hover:text-[#00acb1]"
                                >
                                    <LogIn className="h-5 w-5" />
                                </Link>
                            )}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-white"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden pb-4 space-y-3 border-t border-white/20 pt-4">
                            <Link
                                href="/"
                                className="block text-white hover:text-[#00acb1] transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                🏠 Home
                            </Link>
                            <Link
                                href="/#about"
                                className="block text-white hover:text-[#00acb1] transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                href="/#services"
                                className="block text-white hover:text-[#00acb1] transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Services
                            </Link>
                            <Link
                                href="/#booking"
                                className="block text-white hover:text-[#00acb1] transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Book
                            </Link>
                            <Link
                                href="/#contact"
                                className="block text-white hover:text-[#00acb1] transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            {auth.user && (
                                <>
                                    <Link
                                        href={
                                            auth.user.role === 'doctor'
                                                ? '/doctor/dashboard'
                                                : '/user/dashboard'
                                        }
                                        className="block text-white hover:text-[#00acb1] transition py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full text-left bg-[#00acb1] text-white px-4 py-2 rounded-lg hover:bg-[#00787b] transition"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Logout
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-[#005963] to-[#004148] text-white relative overflow-hidden">
                {/* Particles Background */}
                <div className="absolute inset-0 z-0">
                    <ParticlesBackground id="tsparticles-footer" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white rounded-lg p-1">
                                    <DoctorLogo className="h-10 w-10" />
                                </div>
                                <h3 className="text-lg font-bold">MediCare</h3>
                            </div>
                            <p className="text-gray-300">
                                Premier healthcare services for your wellness.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <div className="space-y-2">
                                <Link href="/#about" className="text-gray-300 hover:text-white transition">
                                    About
                                </Link>
                                <Link href="/#services" className="text-gray-300 hover:text-white transition">
                                    Services
                                </Link>
                                <Link href="/#booking" className="text-gray-300 hover:text-white transition">
                                    Book Appointment
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <div className="space-y-2 text-gray-300">
                                <p>Phone: (555) 123-4567</p>
                                <p>Email: info@medicare.com</p>
                                <p>Hours: 9 AM - 5 PM, Monday-Friday</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/20 pt-8 text-center text-gray-300">
                        <p>&copy; 2025 MediCare. All rights reserved.</p>
                    </div>
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
