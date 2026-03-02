import { motion } from 'framer-motion';
import { Award, BookOpen, Heart, Users } from 'lucide-react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const iconMap = {
    Users,
    Award,
    Heart,
    BookOpen,
};

export default function AboutSection({ content, doctor }) {
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

    // Use doctor data if available, fallback to content settings
    const doctorName = doctor?.name || 'Dr. Sarah Johnson';
    const aboutContent = doctor?.about_content || {};

    const replaceDefaultDoctorName = (value) => {
        if (typeof value !== 'string' || !doctor?.name) {
            return value;
        }

        return value
            .replace(/Dr\.\s*Sarah\s*Johnson/gi, doctor.name)
            .replace(/Sarah\s*Johnson/gi, doctor.name.replace(/^Dr\.\s*/i, ''));
    };

    const title = replaceDefaultDoctorName(content?.title) || `About ${doctorName}`;
    const subtitle =
        aboutContent?.subtitle || content?.subtitle || 'Dedicated to Your Health and Well-being';
    
    // Use doctor profile picture if available
    const imageUrl = doctor?.profile_picture 
        ? `/storage/${doctor.profile_picture}` 
        : (content?.image?.url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80');
    const imageAlt = content?.image?.alt || doctorName;
    
    const highlightValue = aboutContent?.highlight?.value || content?.highlight?.value || (doctor?.experience ? `${doctor.experience}+` : '15+');
    const highlightLabel = aboutContent?.highlight?.label || content?.highlight?.label || 'Years Experience';
    
    // Build detailed about paragraphs from doctor bio or content
    const paragraphs = (aboutContent?.paragraphs?.map(replaceDefaultDoctorName)) || (content?.paragraphs?.map(replaceDefaultDoctorName)) || (doctor?.bio ? [doctor.bio] : [
        `${doctorName} is a dedicated medical professional committed to providing comprehensive healthcare to all patients. With extensive training and experience in general medicine, she brings a compassionate and thorough approach to every consultation.`,
        'Her practice philosophy centers on preventive care, early diagnosis, and personalized treatment plans. She believes in taking the time to listen to each patient\'s concerns and working collaboratively to achieve optimal health outcomes.',
        'Beyond clinical excellence, she is passionate about patient education and empowering individuals to take charge of their health through informed decisions and healthy lifestyle choices.',
    ]);
    
    const credentialsTitle = aboutContent?.credentialsTitle || content?.credentialsTitle || 'Professional Qualifications';
    
    // Build credentials from doctor data or content
    const credentials = aboutContent?.credentials || content?.credentials || [
        doctor?.degree || 'MBBS - Dhaka Medical College',
        doctor?.specialization || 'FCPS (Medicine) - Bangladesh College of Physicians & Surgeons',
        doctor?.registration_no ? `Registration: ${doctor.registration_no}` : 'Licensed Medical Practitioner',
        'Member, Bangladesh Medical Association (BMA)',
    ].filter(Boolean);
    
    const stats =
        aboutContent?.stats ||
        content?.stats ||
        [
            { icon: 'Users', value: '10,000+', label: 'Patients Treated' },
            { icon: 'Award', value: doctor?.experience ? `${doctor.experience}+` : '15+', label: 'Years Experience' },
            { icon: 'Heart', value: '95%', label: 'Patient Satisfaction' },
            { icon: 'BookOpen', value: '100+', label: 'Medical Cases' },
        ];

    return (
        <SectionWrapper id="about" className="bg-white">
            <SectionTitle subtitle={subtitle}>{title}</SectionTitle>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Left: Image */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="relative"
                >
                    <div className="relative h-[600px] overflow-hidden rounded-3xl bg-white">
                        <img
                            src={imageUrl}
                            alt={imageAlt}
                            className="h-full w-full object-contain"
                        />
                        {/* Image kept solid; no overlay */}
                    </div>

                    {/* Floating Stats Card (solid) */}
                    <div className="relative z-10">
                        <GlassCard variant="solid" hover={false} className="absolute -bottom-8 -right-8 p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#005963]">{highlightValue}</div>
                                <div className="text-sm font-medium text-gray-700">{highlightLabel}</div>
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
                        {paragraphs.map((p, idx) => (
                            <p key={idx}>{p}</p>
                        ))}
                    </div>

                    {/* Credentials */}
                    <div className="mb-8 space-y-2">
                        <h3 className="mb-4 text-xl font-semibold text-[#005963]">
                            {credentialsTitle}
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                            {credentials.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                    <span className="mr-2 text-[#00acb1]">✦</span>
                                    {item}
                                </li>
                            ))}
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
                        {stats.map((stat, index) => {
                            const Icon = typeof stat.icon === 'string' ? iconMap[stat.icon] : stat.icon;

                            return (
                            <motion.div key={index} variants={itemVariants}>
                                <GlassCard variant="solid" hover={false} className="p-6 text-center">
                                    {Icon && <Icon className="mx-auto mb-3 h-8 w-8 text-[#00acb1]" />}
                                    <div className="mb-1 text-2xl font-bold text-[#005963]">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">
                                        {stat.label}
                                    </div>
                                </GlassCard>
                            </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.div>
            </div>
        </SectionWrapper>
    );
}
