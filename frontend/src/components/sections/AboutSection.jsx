import { motion } from 'framer-motion';
import { Award, BookOpen, Heart, Users } from 'lucide-react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const stats = [
    { icon: Users, value: '15,000+', label: 'Patients Treated' },
    { icon: Award, value: '20+', label: 'Years Experience' },
    { icon: Heart, value: '98%', label: 'Patient Satisfaction' },
    { icon: BookOpen, value: '50+', label: 'Published Research' },
];

const pulseVariants = {
    pulse: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
    },
};

export default function AboutSection() {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
        },
    };

    return (
        <SectionWrapper id="about" className="bg-white">
            <SectionTitle subtitle="Excellence in dermatological care and aesthetic medicine">
                About Dr. Sarah Johnson
            </SectionTitle>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Left: Image */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="relative"
                >
                    <div className="relative h-[600px] overflow-hidden rounded-3xl">
                        <img
                            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
                            alt="Dr. Sarah Johnson"
                            className="h-full w-full object-cover"
                        />
                        {/* Image kept solid; no overlay */}
                    </div>

                    {/* Floating Stats Card (solid) */}
                    <div className="relative z-10">
                        <GlassCard variant="solid" hover={false} className="absolute -bottom-8 -right-8 p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#005963]">98%</div>
                                <div className="text-sm font-medium text-gray-700">Success Rate</div>
                            </div>
                        </GlassCard>
                    </div>
                </motion.div>

                {/* Right: Content */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex flex-col justify-center"
                >
                    <div className="mb-8 space-y-4 text-lg leading-relaxed text-gray-700">
                        <p>
                            Dr. Sarah Johnson is a board-certified dermatologist and
                            cosmetic surgeon with over 20 years of experience in
                            transforming the lives of her patients through advanced
                            skincare treatments and aesthetic procedures.
                        </p>
                        <p>
                            Graduating with honors from Harvard Medical School, Dr.
                            Johnson has dedicated her career to staying at the
                            forefront of dermatological innovation, combining
                            evidence-based medicine with artistic precision.
                        </p>
                        <p>
                            Her patient-centered approach focuses on creating natural,
                            lasting results while prioritizing safety and comfort.
                            Each treatment plan is customized to meet individual
                            goals and skin health needs.
                        </p>
                    </div>

                    {/* Credentials */}
                    <div className="mb-8 space-y-2">
                        <h3 className="mb-4 text-xl font-semibold text-[#005963]">
                            Credentials & Certifications
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start">
                                <span className="mr-2 text-[#00acb1]">✦</span>
                                MD, Harvard Medical School
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-[#00acb1]">✦</span>
                                Board Certified, American Academy of Dermatology
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-[#00acb1]">✦</span>
                                Fellow, American Society for Dermatologic Surgery
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-[#00acb1]">✦</span>
                                Member, International Society of Cosmetic Dermatology
                            </li>
                        </ul>
                    </div>

                    {/* Stats Grid */}
                    <motion.div
                        className="grid grid-cols-2 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {stats.map((stat, index) => (
                            <motion.div key={index} variants={itemVariants}>
                                <GlassCard variant="solid" hover={false} className="p-6 text-center">
                                    <stat.icon className="mx-auto mb-3 h-8 w-8 text-[#00acb1]" />
                                    <div className="mb-1 text-2xl font-bold text-[#005963]">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">
                                        {stat.label}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </SectionWrapper>
    );
}
