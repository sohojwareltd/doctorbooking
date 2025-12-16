import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, Phone, User, X } from 'lucide-react';
import { useState } from 'react';
import GlassCard from '../GlassCard';
import PrimaryButton from '../PrimaryButton';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        try {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const res = await fetch('/book-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json, text/plain, */*',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    date: formData.date,
                    time: formData.time,
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setSuccess('Appointment requested successfully. We will contact you shortly.');
                setFormData({ name: '', phone: '', email: '', date: '', time: '', message: '' });
            } else {
                const data = await res.json().catch(() => ({}));
                const msg = data?.message || 'Failed to submit the booking. Please try again.';
                setError(msg);
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleDateClick = (info) => {
        const clickedDate = info.dateStr;
        setSelectedDate(clickedDate);
        setFormData({ ...formData, date: clickedDate, time: '' });
        fetchAvailableSlots(clickedDate);
    };

    const fetchAvailableSlots = async (date) => {
        setLoadingSlots(true);
        console.log('Fetching slots for date:', date);
        try {
            const res = await fetch(`/available-slots/${date}`);
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);
            setAvailableSlots(data.slots || []);
        } catch (err) {
            console.error('Failed to fetch slots:', err);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleTimeSelect = (time) => {
        setFormData({ ...formData, time });
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

                {(success || error) && (
                    <div className="mx-auto mb-6 max-w-3xl">
                        {success && (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                <div className="mx-auto mb-6 max-w-5xl">
                    <GlassCard className="bg-gradient-to-br from-white/60 to-white/30 p-4 sm:p-6">
                        <h3 className="mb-4 text-xl font-bold text-[#005963]">Select Appointment Date & Time</h3>
                        
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Calendar Section */}
                            <div className="rounded-2xl border-2 border-[#00acb1]/20 bg-gradient-to-br from-white to-gray-50 p-3">
                                <h4 className="mb-2 text-base font-semibold text-[#005963]">Choose Date</h4>
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    dateClick={handleDateClick}
                                    selectable={true}
                                    headerToolbar={{
                                        left: 'prev',
                                        center: 'title',
                                        right: 'next'
                                    }}
                                    height="auto"
                                    validRange={{
                                        start: new Date().toISOString().split('T')[0]
                                    }}
                                    dayCellClassNames={(arg) => {
                                        if (arg.dateStr === selectedDate) {
                                            return 'fc-day-selected';
                                        }
                                        return '';
                                    }}
                                />
                            </div>

                            {/* Time Slots Section */}
                            <div className="rounded-2xl border-2 border-[#00acb1]/20 bg-gradient-to-br from-white to-gray-50 p-3">
                                <h4 className="mb-2 text-base font-semibold text-[#005963]">
                                    Available Time Slots
                                    {selectedDate && <span className="ml-2 text-sm font-normal text-gray-600">({selectedDate})</span>}
                                </h4>
                                
                                {!selectedDate ? (
                                    <div className="flex h-56 items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p>Please select a date first</p>
                                        </div>
                                    </div>
                                ) : loadingSlots ? (
                                    <div className="flex h-56 items-center justify-center">
                                        <div className="text-center">
                                            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#00acb1] border-t-transparent"></div>
                                            <p className="text-gray-600">Loading available slots...</p>
                                        </div>
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="flex h-56 items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p>No slots available for this date</p>
                                            <p className="mt-1 text-sm">Please choose another date</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid max-h-64 gap-2 overflow-y-auto pr-2 sm:grid-cols-3">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => handleTimeSelect(slot)}
                                                className={`rounded-lg border-2 px-3 py-2 text-sm text-center font-semibold transition-all ${
                                                    formData.time === slot
                                                        ? 'border-[#005963] bg-[#005963] text-white shadow-lg'
                                                        : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#00acb1] hover:bg-[#00acb1]/10'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Info */}
                        {formData.date && formData.time && (
                            <div className="mt-3 rounded-lg bg-[#005963]/10 border border-[#00acb1]/30 px-3 py-2">
                                <p className="text-center text-sm font-medium text-[#005963]">
                                    Selected: {formData.date} at {formData.time}
                                </p>
                            </div>
                        )}
                    </GlassCard>
                </div>

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
                                    disabled={submitting}
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
                                        disabled={submitting}
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
                                        disabled={submitting}
                                    />
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
                                    disabled={submitting}
                                />
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.7 }}
                                className="pt-2"
                            >
                                <PrimaryButton className="w-full sm:w-auto" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Request Appointment'}
                                </PrimaryButton>
                            </motion.div>
                        </form>
                    </GlassCard>
                </motion.div>
            </div>
        </SectionWrapper>
    );
}
