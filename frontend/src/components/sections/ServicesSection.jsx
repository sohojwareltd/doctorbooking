import { motion } from 'framer-motion';
import { Microscope, Sparkles, Syringe, Zap } from 'lucide-react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const services = [
    {
        icon: Sparkles,
        title: 'Advanced Skin Rejuvenation',
        description:
            'Cutting-edge laser treatments, chemical peels, and microneedling to restore youthful, radiant skin.',
        treatments: ['Laser Resurfacing', 'Chemical Peels', 'Microneedling', 'IPL Therapy'],
    },
    {
        icon: Syringe,
        title: 'Cosmetic Injectables',
        description:
            'Expert administration of dermal fillers and neuromodulators for natural-looking enhancement.',
        treatments: ['Dermal Fillers', 'Botox & Dysport', 'Lip Enhancement', 'Facial Contouring'],
    },
    {
        icon: Microscope,
        title: 'Medical Dermatology',
        description:
            'Comprehensive diagnosis and treatment of skin conditions, from acne to complex disorders.',
        treatments: ['Acne Treatment', 'Eczema Care', 'Psoriasis Management', 'Skin Cancer Screening'],
    },
    {
        icon: Zap,
        title: 'Body Contouring',
        description:
            'Non-invasive body sculpting and skin tightening for confidence-boosting transformations.',
        treatments: ['CoolSculpting', 'Radiofrequency Tightening', 'Cellulite Treatment', 'Body Laser'],
    },
];

export default function ServicesSection() {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
        },
    };

    return (
        <SectionWrapper id="services" className="bg-white">
            <SectionTitle subtitle="Comprehensive dermatological and aesthetic treatments tailored to your unique needs">
                Services & Expertise
            </SectionTitle>

            <motion.div
                className="grid gap-8 md:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
            >
                {services.map((service, index) => (
                    <motion.div key={index} variants={itemVariants}>
                        <GlassCard variant="solid" hover={false} className="h-full p-8">
                            {/* Icon */}
                            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00acb1] shadow-lg">
                                <service.icon className="h-8 w-8 text-white" />
                            </div>

                            {/* Title */}
                            <h3 className="mb-4 text-2xl font-bold text-[#005963]">
                                {service.title}
                            </h3>

                            {/* Description */}
                            <p className="mb-6 text-gray-700 leading-relaxed">
                                {service.description}
                            </p>

                            {/* Treatments List */}
                            <div className="space-y-2">
                                {service.treatments.map((treatment, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center text-sm text-gray-600"
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#00acb1]" />
                                        {treatment}
                                    </motion.div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </motion.div>
        </SectionWrapper>
    );
}
