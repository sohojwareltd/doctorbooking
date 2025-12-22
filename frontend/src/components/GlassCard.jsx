import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, variant = 'solid', ...props }) {
    const hoverAnimation = hover
        ? {
              scale: 1.02,
              y: -5,
              transition: { duration: 0.3, ease: 'easeOut' },
          }
        : undefined;

    const baseClass =
        variant === 'solid'
            ? 'rounded-3xl bg-white border border-[#00acb1]/10 shadow-xl'
            : 'rounded-3xl bg-white/10 backdrop-blur-xl border border-[#00acb1]/20 shadow-2xl';

    return (
        <motion.div
            className={`${baseClass} ${className}`}
            whileHover={hoverAnimation}
            {...props}
        >
            {children}
        </motion.div>
    );
}
