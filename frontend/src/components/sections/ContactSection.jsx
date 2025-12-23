import { motion } from 'framer-motion';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

const contactMethods = [
    {
        icon: Phone,
        title: 'Call Us',
        value: '+1 (555) 123-4567',
        link: 'tel:+15551234567',
        color: '#005963',
    },
    {
        icon: MessageCircle,
        title: 'WhatsApp',
        value: 'Chat on WhatsApp',
        link: 'https://wa.me/15551234567',
        color: '#00acb1',
    },
    {
        icon: Mail,
        title: 'Email',
        value: 'dr.johnson@clinic.com',
        link: 'mailto:dr.johnson@clinic.com',
        color: '#005963',
    },
];

const iconMap = {
    Phone,
    MessageCircle,
    Mail,
    MapPin,
};

const colorMap = {
    primary: '#005963',
    accent: '#00acb1',
};

export default function ContactSection({ content }) {
    const title = content?.title || 'Contact & Location';
    const subtitle =
        content?.subtitle || "Get in touch with us - we're here to help with any questions";
    const clinic =
        content?.clinic ||
        {
            name: 'Johnson Dermatology & Aesthetics',
            line1: '123 Medical Plaza, Suite 500',
            line2: 'Beverly Hills, CA 90210',
            line3: 'United States',
        };
    const methods = content?.methods || contactMethods;
    const officeHours =
        content?.officeHours ||
        [
            { label: 'Monday - Friday', value: '9:00 AM - 6:00 PM' },
            { label: 'Saturday', value: '10:00 AM - 4:00 PM' },
            { label: 'Sunday', value: 'Closed' },
        ];
    const mapEmbedUrl =
        content?.mapEmbedUrl ||
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.4374079384843!2d-118.40168492346382!3d34.063308273156894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bbf2c2d7d7a1%3A0x7e1b2e3f4f5e6d7c!2sBeverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus';

    return (
        <SectionWrapper id="contact" className="bg-white">
            <SectionTitle subtitle={subtitle}>{title}</SectionTitle>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Left: Contact Methods */}
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    {/* Address Card */}
                    <GlassCard variant="solid" className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#005963]">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="mb-2 text-xl font-bold text-[#005963]">
                                    Our Clinic
                                </h3>
                                <p className="text-gray-700 leading-relaxed">
                                    <span className="font-semibold">
                                        {clinic.name}
                                    </span>
                                    <br />
                                    {clinic.line1}
                                    <br />
                                    {clinic.line2}
                                    <br />
                                    {clinic.line3}
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Contact Methods */}
                    <div className="space-y-6">
                        {methods.map((method, index) => {
                            const Icon = typeof method.icon === 'string' ? iconMap[method.icon] : method.icon;
                            const bg =
                                typeof method.color === 'string' && colorMap[method.color]
                                    ? colorMap[method.color]
                                    : method.color || '#005963';

                            return (
                            <motion.a
                                key={index}
                                href={method.link}
                                target={method.title === 'WhatsApp' ? '_blank' : undefined}
                                rel={method.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="block"
                            >
                                <GlassCard variant="solid" className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                            style={{ backgroundColor: bg }}
                                        >
                                            {Icon && <Icon className="h-6 w-6 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-1 text-sm font-medium text-gray-600">
                                                {method.title}
                                            </div>
                                            <div className="text-lg font-semibold text-[#005963]">
                                                {method.value}
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.a>
                            );
                        })}
                    </div>

                    {/* Hours */}
                    <GlassCard variant="solid" className="p-8">
                        <h3 className="mb-4 text-xl font-bold text-[#005963]">
                            Office Hours
                        </h3>
                        <div className="space-y-3 text-gray-700">
                            {officeHours.map((row, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                                >
                                    <span className="font-medium">{row.label}</span>
                                    <span className={row.value === 'Closed' ? 'text-gray-500' : undefined}>
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Right: Map */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full min-h-[500px]"
                >
                    <GlassCard variant="solid" className="h-full overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <div className="text-sm font-medium text-gray-600">Location</div>
                                <div className="text-lg font-semibold text-[#005963]">Find us on the map</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00acb1]/10">
                                <MapPin className="h-5 w-5 text-[#005963]" />
                            </div>
                        </div>
                        <iframe
                            src={mapEmbedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: '500px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Clinic Location"
                        />
                    </GlassCard>
                </motion.div>
            </div>
        </SectionWrapper>
    );
}
