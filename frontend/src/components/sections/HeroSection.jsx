import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';
import PrimaryButton from '../PrimaryButton';
import ParticlesBackground from '../ParticlesBackground';

export default function HeroSection({ doctor }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    const aboutContent = doctor?.about_content || {};
    const doctorName = doctor?.name || 'Doctor';
    const doctorSubtitle =
        [doctor?.degree, doctor?.specialization].filter(Boolean).join(', ') ||
        doctor?.specialization ||
        'Consultant Physician';
    const doctorBadge = aboutContent?.subtitle || 'Doctor Profile';

    const paragraphs = Array.isArray(aboutContent?.paragraphs) && aboutContent.paragraphs.length
        ? aboutContent.paragraphs.filter(Boolean)
        : (doctor?.bio ? [doctor.bio] : ['Compassionate and comprehensive healthcare with a patient-first approach.']);

    const credentialsTitle = aboutContent?.credentialsTitle || 'Credentials & Certifications';
    const credentials =
        Array.isArray(aboutContent?.credentials) && aboutContent.credentials.length
            ? aboutContent.credentials.filter(Boolean)
            : [
                  doctor?.degree,
                  doctor?.specialization,
                  doctor?.registration_no ? `Registration: ${doctor.registration_no}` : null,
              ].filter(Boolean);

    const stats =
        Array.isArray(aboutContent?.stats) && aboutContent.stats.length
            ? aboutContent.stats.filter((item) => item?.value || item?.label)
            : [
                  { value: '15K+', label: 'Patients Treated' },
                  { value: '98%', label: 'Success Rate' },
                  { value: '20+', label: 'Years of Care' },
              ];

    const highlightValue = aboutContent?.highlight?.value || stats?.[0]?.value || null;
    const highlightLabel = aboutContent?.highlight?.label || stats?.[0]?.label || null;

    const profilePicture = doctor?.profile_picture || '';
    const imageUrl = profilePicture
        ? (profilePicture.startsWith('http') || profilePicture.startsWith('/')
            ? profilePicture
            : `/storage/${profilePicture}`)
        : 'https://mediicc.netlify.app/images/thunb.png';
    const imageAlt = doctorName;

    return (
        <section
            ref={ref}
            id="about"
            className="relative w-full overflow-hidden bg-white pt-10 pb-20"
        >
            {/* Particles (pulse) */}
            <div className="absolute inset-0 z-0">
                <ParticlesBackground id="tsparticles-hero" variant="pulse" />
            </div>

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 xl:px-24 min-h-[calc(100vh-80px)]">
                {/* Left Content */}
                <motion.div
                    style={{ opacity }}
                    className="flex flex-col justify-center py-12 lg:py-0"
                >
                    {/* Top Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963]"
                    >
                        <div className="h-2 w-2 rounded-full bg-[#005963]" />
                        {doctorBadge}
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="mb-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl text-[#005963]"
                    >
                        {doctorName}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mb-6 text-2xl font-bold text-[#005963] sm:text-3xl"
                    >
                        {doctorSubtitle}
                    </motion.p>

                    <motion.div
                        className="mb-8 space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3, staggerChildren: 0.1 }}
                    >
                        {paragraphs.map((paragraph, idx) => (
                            <motion.p
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + idx * 0.08 }}
                                className="text-lg text-[#686a6f] leading-relaxed"
                            >
                                {paragraph}
                            </motion.p>
                        ))}
                    </motion.div>

                    {credentials.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45 }}
                            className="mb-10"
                        >
                            <h3 className="mb-4 text-xl font-bold text-[#005963]">{credentialsTitle}</h3>
                            <div className="space-y-2">
                                {credentials.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-base text-[#686a6f]">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#005963]" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col gap-3 sm:flex-row pt-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.55 }}
                    >
                        <PrimaryButton
                            onClick={() =>
                                document
                                    .getElementById('booking')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="flex items-center justify-center text-sm gap-1.5"
                        >
                            Book Now
                            <ArrowRight className="h-4 w-4" />
                        </PrimaryButton>
                        <motion.button
                            type="button"
                            onClick={() =>
                                document
                                    .getElementById('contact')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="rounded-xl border-2 border-[#005963]/30 px-6 py-3 text-sm text-[#005963] font-semibold backdrop-blur-sm transition-all hover:border-[#005963] hover:bg-[#005963]/10"
                            whileHover={{ scale: 1.05, borderColor: '#005963' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Contact
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Right Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:flex items-center justify-center"
                >
                    <div className="relative w-full max-w-sm">
                        {/* Main Image Container */}
                        <div className="relative z-20 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-2xl border-2 border-[#00acb1]/30 bg-white">
                            <img
                                src={imageUrl}
                                alt={imageAlt}
                                className="h-full w-full object-cover object-[center_30%]"
                            />
                        </div>

                        {highlightValue && highlightLabel && (
                            <div className="absolute -bottom-6 -left-6 z-30 rounded-2xl border border-[#00acb1]/20 bg-white px-5 py-4 shadow-xl">
                                <div className="text-3xl font-black text-[#005963]">{highlightValue}</div>
                                <div className="text-sm font-semibold text-[#686a6f]">{highlightLabel}</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="relative z-10 mx-auto mt-8 grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-12 xl:px-24"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.65 }}
            >
                {stats.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#00acb1]/20 bg-white p-5 shadow-lg">
                        <div className="text-3xl font-black text-[#005963]">{item?.value || '-'}</div>
                        <div className="text-sm font-semibold text-[#686a6f]">{item?.label || 'Stat'}</div>
                    </div>
                ))}
            </motion.div>
        </section>
    );
}


