import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const galleryImages = [
    {
        url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
        alt: 'Modern clinic reception area',
        category: 'Clinic',
    },
    {
        url: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80',
        alt: 'Treatment room with advanced equipment',
        category: 'Facilities',
    },
    {
        url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80',
        alt: 'Dr. Johnson consulting with patient',
        category: 'Consultation',
    },
    {
        url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
        alt: 'State-of-the-art laser equipment',
        category: 'Technology',
    },
    {
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
        alt: 'Comfortable waiting lounge',
        category: 'Clinic',
    },
    {
        url: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80',
        alt: 'Private treatment suite',
        category: 'Facilities',
    },
];

export default function GallerySection() {
    const [selectedImage, setSelectedImage] = useState(null);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: 'easeOut' },
        },
    };

    return (
        <SectionWrapper id="gallery" className="bg-white">
            <SectionTitle subtitle="Tour our state-of-the-art facility and comfortable treatment spaces">
                Our Clinic
            </SectionTitle>

            {/* Gallery Grid */}
            <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
            >
                {galleryImages.map((image, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl"
                        onClick={() => setSelectedImage(image)}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        <img
                            src={image.url}
                            alt={image.alt}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#005963]/80 via-[#005963]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                    {image.category}
                                </span>
                                <p className="mt-2 text-sm font-medium text-white">
                                    {image.alt}
                                </p>
                            </div>
                        </div>
                        {/* Hover Effect */}
                        <motion.div
                            className="absolute inset-0 bg-[#00acb1]/10"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Lightbox */}
            {selectedImage && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#005963]/95 p-4 backdrop-blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <motion.div
                        className="max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.alt}
                            className="h-full w-full object-contain"
                        />
                        <div className="bg-white/10 p-6 backdrop-blur-xl">
                            <span className="mb-2 inline-block rounded-full bg-[#00acb1]/20 px-3 py-1 text-xs font-medium text-white">
                                {selectedImage.category}
                            </span>
                            <p className="text-lg font-medium text-white">
                                {selectedImage.alt}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </SectionWrapper>
    );
}
