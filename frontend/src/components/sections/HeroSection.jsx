import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function HeroSection({ doctor }) {
    const headingLines = doctor?.name ? [doctor.name] : ['Dr. Sarah Johnson'];
    const doctorName = doctor?.name || 'Dr. Sarah Johnson';
    const doctorTitle =
        [doctor?.degree, doctor?.specialization].filter(Boolean).join(' • ') ||
        doctor?.specialization ||
        'Consultant Physician';
    const doctorBio =
        doctor?.bio ||
        'A refined, patient-first consultation experience with clear treatment planning and modern clinical care.';
    const heroSource = doctor?.hero_image || doctor?.profile_picture || '';
    const imageUrl = heroSource
        ? (heroSource.startsWith('http') || heroSource.startsWith('/')
            ? heroSource
            : `/storage/${heroSource}`)
        : 'https://img.freepik.com/premium-photo/medical-background_935395-109680.jpg';
    const serviceChips = ['Consultation', 'Treatment Plan', 'Follow-up Care'];

    return (
        <section className="relative isolate overflow-hidden text-white">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,27,0.92)_0%,rgba(8,26,31,0.74)_46%,rgba(9,24,29,0.42)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(140,241,220,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.14),_transparent_24%)]" />
            <div className="absolute left-[-7rem] top-20 h-64 w-64 rounded-full bg-[#8ff4de]/14 blur-3xl" />
            <div className="absolute bottom-[-4rem] right-[-3rem] h-80 w-80 rounded-full bg-[#ffffff]/10 blur-3xl" />

            <div className="relative mx-auto min-h-[660px] max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:min-h-[720px] lg:pb-28 lg:pt-20">
                <div className="flex min-h-[560px] items-center lg:min-h-[620px]">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-2xl pb-2 lg:pb-10"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b9f4ea] backdrop-blur-xl">
                            <ShieldCheck className="h-4 w-4" />
                            Trusted Doctor Portfolio
                        </div>

                        <motion.h1
                            className="mt-6 text-3xl font-semibold leading-[0.96] tracking-tight sm:text-4xl lg:text-5xl xl:text-[4.35rem]"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {
                                        staggerChildren: 0.16,
                                        delayChildren: 0.1,
                                    },
                                },
                            }}
                        >
                            {headingLines.map((line) => (
                                <span key={line} className="block overflow-hidden pb-1.5">
                                    <motion.span
                                        className="relative block"
                                        variants={{
                                            hidden: { opacity: 0, y: 28 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: {
                                                    duration: 0.65,
                                                    ease: [0.22, 1, 0.36, 1],
                                                },
                                            },
                                        }}
                                    >
                                        {line}
                                        <motion.span
                                            aria-hidden="true"
                                            className="absolute inset-0 origin-left bg-[#e8fff7] mix-blend-lighten"
                                            variants={{
                                                hidden: { scaleX: 1 },
                                                visible: {
                                                    scaleX: 0,
                                                    transition: {
                                                        duration: 0.78,
                                                        ease: [0.76, 0, 0.24, 1],
                                                    },
                                                },
                                            }}
                                        />
                                    </motion.span>
                                </span>
                            ))}
                        </motion.h1>

                        <p className="mt-6 max-w-lg text-base leading-8 text-[#d7e9e5] sm:text-lg">
                            {doctorName} provides calm consultations, clear treatment planning, and a polished appointment experience designed for modern patients.
                        </p>

                        <div className="mt-6 text-sm font-medium uppercase tracking-[0.16em] text-[#9fe9dd]">
                            {doctorTitle}
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <a
                                href="/book-appointment"
                                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#b8ff4f] px-10 py-5 text-lg font-semibold text-[#062128] shadow-[0_22px_55px_rgba(184,255,79,0.42)] ring-4 ring-[#dfffaa]/30 transition hover:bg-[#d2ff85] hover:shadow-[0_26px_65px_rgba(184,255,79,0.52)]"
                            >
                                Book appointment
                                <ArrowRight className="h-5 w-5" />
                            </a>
                        </div>

                        <div className="mt-10 flex flex-wrap gap-2">
                            {serviceChips.map((chip) => (
                                <div
                                    key={chip}
                                    className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-xl"
                                >
                                    {chip}
                                </div>
                            ))}
                        </div>

                        {/* <div className="mt-8 max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] p-5 backdrop-blur-xl">
                            <div className="text-sm font-medium uppercase tracking-[0.16em] text-[#9fe9dd]">
                                {doctorName}
                            </div>
                            <p className="mt-3 text-sm leading-7 text-[#deeeeb] sm:text-base">
                                {doctorBio}
                            </p>
                        </div> */}
                    </motion.div>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 text-[#f7f8f8]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-full w-full fill-current">
                    <path d="M0,62 C240,18 420,92 600,70 C820,42 980,100 1200,64 L1200,120 L0,120 Z" />
                </svg>
            </div>
        </section>
    );
}


