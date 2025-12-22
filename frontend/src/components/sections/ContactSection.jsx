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

export default function ContactSection() {
    return (
        <SectionWrapper id="contact" className="bg-white">
            <SectionTitle subtitle="Get in touch with us - we're here to help with any questions">
                Contact & Location
            </SectionTitle>

            <div className="grid gap-12 lg:grid-cols-2">
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
                        <div className="mb-4 flex items-start">
                            <div className="mr-4 rounded-2xl bg-[#005963] p-4">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-xl font-bold text-[#005963]">
                                    Our Clinic
                                </h3>
                                <p className="text-gray-700">
                                    <strong>Johnson Dermatology & Aesthetics</strong>
                                    <br />
                                    123 Medical Plaza, Suite 500
                                    <br />
                                    Beverly Hills, CA 90210
                                    <br />
                                    United States
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Contact Methods */}
                    <div className="space-y-4">
                        {contactMethods.map((method, index) => (
                            <motion.a
                                key={index}
                                href={method.link}
                                target={method.title === 'WhatsApp' ? '_blank' : undefined}
                                rel={method.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <GlassCard variant="solid" className="p-6">
                                    <div className="flex items-center">
                                        <motion.div
                                            className="mr-4 rounded-xl p-3"
                                            style={{ backgroundColor: method.color }}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <method.icon className="h-5 w-5 text-white" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-600">
                                                {method.title}
                                            </div>
                                            <div className="text-lg font-semibold text-[#005963]">
                                                {method.value}
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.a>
                        ))}
                    </div>

                    {/* Hours */}
                    <GlassCard variant="solid" className="p-8">
                        <h3 className="mb-4 text-xl font-bold text-[#005963]">
                            Office Hours
                        </h3>
                        <div className="space-y-2 text-gray-700">
                            <div className="flex justify-between">
                                <span className="font-medium">Monday - Friday</span>
                                <span>9:00 AM - 6:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Saturday</span>
                                <span>10:00 AM - 4:00 PM</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Sunday</span>
                                <span className="text-gray-500">Closed</span>
                            </div>
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
                    <GlassCard variant="solid" className="h-full overflow-hidden p-0">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.4374079384843!2d-118.40168492346382!3d34.063308273156894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bbf2c2d7d7a1%3A0x7e1b2e3f4f5e6d7c!2sBeverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
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
