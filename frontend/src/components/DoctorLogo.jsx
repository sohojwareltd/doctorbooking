import { motion } from 'framer-motion';

export default function DoctorLogo({ className = "h-10 w-auto" }) {
    const heartbeat = {
        animate: {
            scale: [1, 1.15, 1, 1, 1.15, 1],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };


    return (
        <motion.svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Outer Pulse Circle */}
            <motion.circle
                cx="100"
                cy="100"
                r="35"
                stroke="#00acb1"
                strokeWidth="1"
                fill="none"
                style={{ transformOrigin: '100px 100px', transformBox: 'fill-box' }}
                animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.35, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Static Circle Background */}
            <circle cx="100" cy="100" r="90" stroke="#005963" strokeWidth="2" fill="none" opacity="0.2" />

            {/* Animated Heart */}
            <motion.g variants={heartbeat} animate="animate">
                {/* Left Heart Lobe */}
                <path
                    d="M 100 140 C 75 120, 60 105, 60 90 C 60 78, 68 70, 76 70 C 84 70, 92 76, 100 85 C 108 76, 116 70, 124 70 C 132 70, 140 78, 140 90 C 140 105, 125 120, 100 140 Z"
                    fill="#00acb1"
                    opacity="0.9"
                />
            </motion.g>

            {/* Stethoscope Arms - Left */}
            <path
                d="M 60 70 Q 50 50 40 50"
                stroke="#005963"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
            />

            {/* Stethoscope Arms - Right */}
            <path
                d="M 140 70 Q 150 50 160 50"
                stroke="#005963"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
            />

            {/* Stethoscope Earpieces */}
            <circle cx="38" cy="48" r="4" fill="#005963" opacity="0.7" />
            <circle cx="162" cy="48" r="4" fill="#005963" opacity="0.7" />

            {/* Heartbeat Line */}
            <path
                d="M 50 155 L 60 155 L 65 150 L 70 160 L 75 155 L 85 155 L 95 155 L 100 155"
                stroke="#00acb1"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
            />

            {/* Center Accent */}
            <motion.circle
                cx="100"
                cy="100"
                r="8"
                fill="#00acb1"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </motion.svg>
    );
}

