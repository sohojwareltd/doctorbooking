import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';
import PrimaryButton from '../PrimaryButton';
import ParticlesBackground from '../ParticlesBackground';

export default function HeroSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    const features = [
        '  20+ Years Experience',
        'Board Certified',
        'Advanced Technology',
    ];

    return (
        <section
            ref={ref}
            className="relative w-full overflow-hidden bg-white py-20"
        >
            {/* Particles Background */}
            <ParticlesBackground />

            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, #00acb1 0%, transparent 50%),
                                         radial-gradient(circle at 80% 80%, #00acb1 0%, transparent 50%)`,
                    }}
                />
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
                        Welcome to Excellence
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="mb-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl text-[#005963]"
                    >
                        Dr. Sarah Johnson
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mb-3 text-2xl font-bold text-[#005963] sm:text-3xl"
                    >
                        Board-Certified Dermatologist
                    </motion.p>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mb-10 text-lg text-[#686a6f] leading-relaxed sm:text-xl"
                    >
                        Transform your skin with advanced dermatological care and
                        aesthetic excellence. Over 20 years of expertise dedicated to
                        your confidence and natural beauty.
                    </motion.p>

                    {/* Features List */}
                    <motion.div
                        className="mb-10 space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.1 }}
                    >
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <CheckCircle2 className="h-6 w-6 shrink-0 text-[#005963]" />
                                <span className="text-lg text-[#686a6f] font-medium">
                                    {feature}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col gap-3 sm:flex-row pt-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
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
                            className="rounded-xl border-2 border-[#005963]/30 px-6 py-3 text-sm text-[#005963] font-semibold backdrop-blur-sm transition-all hover:border-[#005963] hover:bg-[#005963]/10"
                            whileHover={{ scale: 1.05, borderColor: '#005963' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Learn More
                        </motion.button>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8 pb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <div>
                            <div className="text-3xl font-black text-[#005963]">
                                15K+
                            </div>
                            <div className="text-sm text-[#686a6f]">Satisfied Patients</div>
                        </div>
                        <div className="h-12 w-px bg-[#005963]/10" />
                        <div>
                            <div className="text-3xl font-black text-[#005963]">
                                98%
                            </div>
                            <div className="text-sm text-[#686a6f]">Success Rate</div>
                        </div>
                        <div className="h-12 w-px bg-[#005963]/10" />
                        <div>
                            <div className="text-3xl font-black text-[#005963]">
                                20+
                            </div>
                            <div className="text-sm text-[#686a6f]">Years of Care</div>
                        </div>
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
                        {/* Glow Background Effect */}
                        <motion.div
                            className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#00acb1] to-[#005963] blur-2xl opacity-40"
                            animate={{
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Floating Accent */}
                        <motion.div
                            className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#00acb1]/20 to-transparent blur-2xl"
                            animate={{
                                y: [0, 20, 0],
                                x: [0, 15, 0],
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Main Image Container */}
                        <motion.div
                            className="relative z-20 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-2xl border-2 border-[#00acb1]/30 backdrop-blur-sm"
                            whileHover={{ scale: 1.03, boxShadow: '0 30px 60px rgba(0, 172, 177, 0.3)' }}
                            transition={{ duration: 0.4 }}
                        >
                            <img
                                src="https://mediicc.netlify.app/images/thunb.png"
                                alt="Dr. Sarah Johnson"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#005963]/30 via-transparent to-transparent" />
                        </motion.div>

                        {/* Bottom Accent */}
                        <motion.div
                            className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-gradient-to-t from-[#00acb1]/15 to-transparent blur-2xl"
                            animate={{
                                y: [0, -20, 0],
                            }}
                            transition={{
                                duration: 7,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 lg:bottom-8"
                animate={{ y: [0, 10, 0] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white/50">Scroll to explore</span>
                    <motion.div
                        className="h-8 w-5 rounded-full border-2 border-white/30 p-1"
                        animate={{ y: [0, 5, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                        }}
                    >
                        <div className="h-1.5 w-1 mx-auto rounded-full bg-[#00acb1]" />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}


