import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import GlassCard from '../GlassCard';
import PrimaryButton from '../PrimaryButton';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';

export default function BookingSection() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        message: '',
    });

    const [focused, setFocused] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log('Booking submitted:', formData);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const inputClasses = (name) => `
        w-full rounded-2xl border-2 
        ${focused === name ? 'border-[#00acb1] bg-white/80' : 'border-white/30 bg-white/50'}
        px-4 py-4 pl-12 text-gray-900 backdrop-blur-sm
        transition-all duration-300 ease-out
        focus:border-[#00acb1] focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20
        placeholder:text-gray-500
    `;

    return (
        <SectionWrapper id="booking" className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, #005963 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative">
                <SectionTitle subtitle="Schedule your consultation and start your transformation journey">
                    Book Your Appointment
                </SectionTitle>

                <motion.div
                    className="mx-auto max-w-3xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <GlassCard className="bg-gradient-to-br from-white/60 to-white/30 p-8 sm:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="relative"
                            >
                                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('name')}
                                    onBlur={() => setFocused('')}
                                    className={inputClasses('name')}
                                />
                            </motion.div>

                            {/* Phone & Email */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="relative"
                                >
                                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('phone')}
                                        onBlur={() => setFocused('')}
                                        className={inputClasses('phone')}
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="relative"
                                >
                                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused('')}
                                        className={inputClasses('email')}
                                    />
                                </motion.div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="relative"
                                >
                                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        type="date"
                                        name="date"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('date')}
                                        onBlur={() => setFocused('')}
                                        className={inputClasses('date')}
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 }}
                                    className="relative"
                                >
                                    <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <select
                                        name="time"
                                        required
                                        value={formData.time}
                                        onChange={handleChange}
                                        onFocus={() => setFocused('time')}
                                        onBlur={() => setFocused('')}
                                        className={inputClasses('time')}
                                    >
                                        <option value="">Select Time</option>
                                        <option value="09:00">09:00 AM</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="14:00">02:00 PM</option>
                                        <option value="15:00">03:00 PM</option>
                                        <option value="16:00">04:00 PM</option>
                                    </select>
                                </motion.div>
                            </div>

                            {/* Message */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="relative"
                            >
                                <textarea
                                    name="message"
                                    placeholder="Tell us about your concerns or what you'd like to address..."
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('message')}
                                    onBlur={() => setFocused('')}
                                    className={`${inputClasses('message')} resize-none !pl-4`}
                                />
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.7 }}
                                className="text-center"
                            >
                                <PrimaryButton type="submit" large className="w-full sm:w-auto">
                                    Confirm Appointment
                                </PrimaryButton>
                                <p className="mt-4 text-sm text-gray-600">
                                    We'll confirm your appointment within 24 hours
                                </p>
                            </motion.div>
                        </form>
                    </GlassCard>
                </motion.div>
            </div>
        </SectionWrapper>
    );
}
