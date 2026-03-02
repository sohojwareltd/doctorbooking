import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import GlassCard from '../GlassCard';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

export default function ContactSection({ doctor, chambers = [] }) {
    const title = 'Contact & Location';
    const subtitle = 'Reach the doctor directly and find chamber location on map';
    const activeChambers = Array.isArray(chambers) ? chambers : [];
    const primaryChamber = activeChambers[0] || null;
    const mapEmbedUrl = primaryChamber?.location
        ? `https://www.google.com/maps?q=${encodeURIComponent(primaryChamber.location)}&output=embed`
        : 'https://www.google.com/maps?q=Dhaka&output=embed';

    const doctorContacts = [
        doctor?.phone
            ? {
                  icon: Phone,
                  title: 'Phone',
                  value: doctor.phone,
                  link: `tel:${doctor.phone}`,
              }
            : null,
        doctor?.email
            ? {
                  icon: Mail,
                  title: 'Email',
                  value: doctor.email,
                  link: `mailto:${doctor.email}`,
              }
            : null,
    ].filter(Boolean);

    return (
        <SectionWrapper id="contact" className="bg-white">
            <SectionTitle subtitle={subtitle}>{title}</SectionTitle>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <GlassCard variant="solid" className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#005963]">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="mb-2 text-xl font-bold text-[#005963]">Doctor Contact</h3>
                                {doctorContacts.length > 0 ? (
                                    <div className="space-y-2">
                                        {doctorContacts.map((item, index) => {
                                            const Icon = item.icon;
                                            return (
                                                <a
                                                    key={index}
                                                    href={item.link}
                                                    className="flex items-center gap-2 text-gray-700 hover:text-[#005963]"
                                                >
                                                    <Icon className="h-4 w-4 text-[#005963]" />
                                                    <span>
                                                        <span className="font-semibold">{item.title}:</span>{' '}
                                                        {item.value}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">Contact information will be available soon.</p>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

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
                                <div className="text-lg font-semibold text-[#005963]">
                                    {primaryChamber?.name || 'Find us on the map'}
                                </div>
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
