import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { useRef } from 'react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const caseStudies = [
    {
        title: 'Acne Transformation Journey',
        category: 'Medical Dermatology',
        duration: '6 months',
        rating: 5,
        story:
            'Patient presented with severe cystic acne affecting self-confidence. Through a personalized combination of prescription treatments and advanced laser therapy, achieved clear, healthy skin.',
        results: [
            '95% reduction in active breakouts',
            'Significant improvement in scarring',
            'Restored confidence and quality of life',
        ],
    },
    {
        title: 'Age-Defying Skin Renewal',
        category: 'Anti-Aging & Rejuvenation',
        duration: '3 months',
        rating: 5,
        story:
            'Patient seeking natural-looking rejuvenation. Combined microneedling, laser resurfacing, and strategic injectable placement for comprehensive facial renewal.',
        results: [
            'Dramatic improvement in skin texture',
            'Reduced fine lines and wrinkles',
            'Natural, refreshed appearance',
        ],
    },
    {
        title: 'Pigmentation Correction',
        category: 'Laser & Light Therapy',
        duration: '4 months',
        rating: 5,
        story:
            'Advanced hyperpigmentation treated with customized laser protocols and medical-grade skincare regimen, resulting in even-toned, radiant complexion.',
        results: [
            'Even skin tone achieved',
            'Melasma significantly reduced',
            'Long-lasting results with maintenance',
        ],
    },
];

export default function CaseStudiesSection() {
    const containerRef = useRef(null);
    const { scrollXProgress } = useScroll({ container: containerRef });

    return (
        <SectionWrapper id="results" className="bg-gradient-to-b from-white to-gray-50">
            <SectionTitle subtitle="Real transformations, real results - ethical presentation of patient journeys">
                Patient Success Stories
            </SectionTitle>

            {/* Horizontal Scroll Container */}
            <div className="relative">
                <div
                    ref={containerRef}
                    className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide lg:gap-12"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {caseStudies.map((study, index) => (
                        <motion.div
                            key={index}
                            className="min-w-[90vw] scroll-ml-4 sm:min-w-[500px] lg:min-w-[600px]"
                            style={{ scrollSnapAlign: 'start' }}
                            initial={{ opacity: 0, x: 100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.2,
                                ease: 'easeOut',
                            }}
                        >
                            <GlassCard className="h-full bg-gradient-to-br from-white/80 to-white/40 p-8 lg:p-10">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="rounded-full bg-[#00acb1]/10 px-4 py-1.5 text-sm font-medium text-[#005963]">
                                            {study.category}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {[...Array(study.rating)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-4 w-4 fill-[#00acb1] text-[#00acb1]"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-2xl font-bold text-[#005963] lg:text-3xl">
                                        {study.title}
                                    </h3>
                                    <p className="flex items-center text-sm text-gray-600">
                                        <Heart className="mr-2 h-4 w-4 text-[#00acb1]" />
                                        Treatment Duration: {study.duration}
                                    </p>
                                </div>

                                {/* Story */}
                                <p className="mb-6 leading-relaxed text-gray-700">
                                    {study.story}
                                </p>

                                {/* Results */}
                                <div className="mb-6">
                                    <h4 className="mb-3 font-semibold text-[#005963]">
                                        Key Results:
                                    </h4>
                                    <ul className="space-y-2">
                                        {study.results.map((result, idx) => (
                                            <motion.li
                                                key={idx}
                                                className="flex items-start text-gray-700"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <ArrowRight className="mr-2 mt-1 h-4 w-4 shrink-0 text-[#00acb1]" />
                                                {result}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Disclaimer */}
                                <div className="border-t border-gray-200/50 pt-4">
                                    <p className="text-xs italic text-gray-500">
                                        Individual results may vary. Consult with Dr.
                                        Johnson to discuss your specific needs and expected
                                        outcomes.
                                    </p>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div className="mt-4 flex justify-center">
                    <div className="flex gap-2">
                        {caseStudies.map((_, index) => (
                            <motion.div
                                key={index}
                                className="h-2 w-2 rounded-full bg-gray-300"
                                whileHover={{ scale: 1.2 }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Scroll Hint */}
            <motion.p
                className="mt-8 text-center text-sm text-gray-500 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                Swipe to explore more success stories →
            </motion.p>
        </SectionWrapper>
    );
}
