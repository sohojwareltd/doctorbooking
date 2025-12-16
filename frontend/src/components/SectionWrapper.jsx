import { motion } from 'framer-motion';

export default function SectionWrapper({ children, className = '', id = '' }) {
    return (
        <section id={id} className={`py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
            <div className="mx-auto max-w-7xl">{children}</div>
        </section>
    );
}

export function SectionTitle({ children, subtitle = '', className = '' }) {
    return (
        <motion.div
            className={`mb-16 text-center ${className}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#005963] sm:text-5xl lg:text-6xl">
                {children}
            </h2>
            {subtitle && (
                <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}
