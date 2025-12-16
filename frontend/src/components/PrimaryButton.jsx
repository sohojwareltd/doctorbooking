import { motion } from 'framer-motion';

export default function PrimaryButton({ children, className = '', large = false, ...props }) {
    return (
        <motion.button
            className={`
                relative overflow-hidden rounded-full font-semibold
                bg-[#00acb1]
                text-white shadow-lg shadow-[#00acb1]/30
                ${large ? 'px-10 py-5 text-lg' : 'px-8 py-4 text-base'}
                flex items-center justify-center
                ${className}
            `}
            whileHover={{
                scale: 1.05,
                backgroundColor: '#005963',
                boxShadow: '0 20px 40px rgba(0, 89, 99, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            {...props}
        >
            {children}
        </motion.button>
    );
}
