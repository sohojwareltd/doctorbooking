import { Head } from '@inertiajs/react';
import AboutSection from '../components/sections/AboutSection';
import BookingSection from '../components/sections/BookingSection';
import CaseStudiesSection from '../components/sections/CaseStudiesSection';
import ContactSection from '../components/sections/ContactSection';
import GallerySection from '../components/sections/GallerySection';
import HeroSection from '../components/sections/HeroSection';
import ServicesSection from '../components/sections/ServicesSection';

import PublicLayout from '../layouts/PublicLayout';

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
            </div>
        </>
    );
}

Welcome.layout = (page) => <PublicLayout>{page}</PublicLayout>;

