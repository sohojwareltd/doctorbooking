import { Head } from '@inertiajs/react';
import AboutSection from '../components/sections/AboutSection';
import BookingSection from '../components/sections/BookingSection';
import CaseStudiesSection from '../components/sections/CaseStudiesSection';
import ContactSection from '../components/sections/ContactSection';
import GallerySection from '../components/sections/GallerySection';
import HeroSection from '../components/sections/HeroSection';
import ServicesSection from '../components/sections/ServicesSection';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Dr. Sarah Johnson - Premier Dermatology & Aesthetics">
                <meta
                    name="description"
                    content="Transform your skin with Dr. Sarah Johnson, a board-certified dermatologist specializing in advanced aesthetic treatments and medical dermatology."
                />
            </Head>

            <div className="relative min-h-screen bg-white font-sans text-gray-900">
                {/* Hero Section */}
                <HeroSection />

                {/* About Section */}
                <AboutSection />

                {/* Services Section */}
                <ServicesSection />

                {/* Case Studies Section */}
                <CaseStudiesSection />

                {/* Gallery Section */}
                <GallerySection />

                {/* Booking Section */}
                <BookingSection />

                {/* Contact Section */}
                <ContactSection />

                {/* Footer */}
                <footer className="bg-[#005963] py-12 text-white">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <h3 className="mb-2 text-2xl font-bold">
                            Dr. Sarah Johnson
                        </h3>
                        <p className="mb-6 text-white/80">
                            Board-Certified Dermatologist & Cosmetic Surgeon
                        </p>
                        <div className="mb-6 h-px w-24 mx-auto bg-white/30" />
                        <p className="text-sm text-white/60">
                            © {new Date().getFullYear()} Johnson Dermatology &
                            Aesthetics. All rights reserved.
                        </p>
                        <p className="mt-2 text-xs text-white/50">
                            Individual results may vary. Consult with Dr. Johnson
                            for personalized treatment recommendations.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

