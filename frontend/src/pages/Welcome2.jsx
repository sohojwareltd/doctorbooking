import { Head } from '@inertiajs/react';
import BookingSection from '../components/sections/BookingSection';
import CaseStudiesSection from '../components/sections/CaseStudiesSection';
import ContactSection from '../components/sections/ContactSection';
import GallerySection from '../components/sections/GallerySection';
import HeroSection2 from '../components/sections/HeroSection2';
import ServicesSection from '../components/sections/ServicesSection';

import PublicLayout from '../layouts/PublicLayout';

export default function Welcome2({ auth, home, doctor, chambers = [] }) {
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
                <HeroSection2 doctor={doctor} />
                <ServicesSection content={home?.services} />
                <CaseStudiesSection content={home?.caseStudies} />
                <GallerySection content={home?.gallery} />
                <BookingSection />
                <ContactSection doctor={doctor} chambers={chambers} />
            </div>
        </>
    );
}

Welcome2.layout = (page) => <PublicLayout>{page}</PublicLayout>;