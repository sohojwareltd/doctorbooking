import { Head } from '@inertiajs/react';
import AboutSection from '../components/sections/AboutSection';
import BookingSection from '../components/sections/BookingSection';
import CaseStudiesSection from '../components/sections/CaseStudiesSection';
import ContactSection from '../components/sections/ContactSection';
import GallerySection from '../components/sections/GallerySection';
import HeroSection from '../components/sections/HeroSection';
import ServicesSection from '../components/sections/ServicesSection';

import PublicLayout from '../layouts/PublicLayout';

export default function Welcome({ auth, home, doctor }) {
    const meta = home?.meta || {};

    return (
        <>
            <Head title={meta.title || 'Dr. Sarah Johnson - Premier Dermatology & Aesthetics'}>
                <meta
                    name="description"
                    content={
                        meta.description ||
                        'Transform your skin with Dr. Sarah Johnson, a board-certified dermatologist specializing in advanced aesthetic treatments and medical dermatology.'
                    }
                />
            </Head>

            <div className="relative min-h-screen bg-white font-sans text-gray-900">
                {/* Hero Section */}
                <HeroSection content={home?.hero} doctor={doctor} />

                {/* About Section */}
                <AboutSection content={home?.about} doctor={doctor} />

                {/* Services Section */}
                <ServicesSection content={home?.services} />

                {/* Case Studies Section */}
                <CaseStudiesSection content={home?.caseStudies} />

                {/* Gallery Section */}
                <GallerySection content={home?.gallery} />

                {/* Booking Section */}
                <BookingSection />

                {/* Contact Section */}
                <ContactSection content={home?.contact} />
            </div>
        </>
    );
}

Welcome.layout = (page) => <PublicLayout>{page}</PublicLayout>;

