import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
    const hoverAnimation = hover
        ? {
              scale: 1.02,
              y: -5,
              transition: { duration: 0.3, ease: 'easeOut' },
          }
        : {};

    return (
        <motion.div
            className={`rounded-3xl bg-white/10 backdrop-blur-xl border border-[#00acb1]/20 shadow-2xl ${className}`}
            whileHover={hoverAnimation}
            {...props}
        >
            {children}
        </motion.div>
    );
}
