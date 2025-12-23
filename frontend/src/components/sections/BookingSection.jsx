import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, Phone, User, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import GlassCard from '../GlassCard';
import PrimaryButton from '../PrimaryButton';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
export default function BookingSection() {
    const page = usePage();
    const contactPhone = page?.props?.site?.contactPhone || '';

    const selectedDateRef = useRef(null);
    const selectedTimeRef = useRef('');

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
    const [allSlots, setAllSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [isClosedDay, setIsClosedDay] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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
                    date: selectedDateRef.current || formData.date,
                    time: selectedTimeRef.current || formData.time,
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setSuccess('Appointment requested successfully. We will contact you shortly.');
                setShowSuccessPopup(true);
                setFormData({ name: '', phone: '', email: '', date: '', time: '', message: '' });
                setSelectedDate(null);
                setAvailableSlots([]);
                setAllSlots([]);
                setBookedSlots([]);
                setIsClosedDay(false);
                selectedDateRef.current = null;
                selectedTimeRef.current = '';
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
        selectedDateRef.current = clickedDate;
        selectedTimeRef.current = '';
        setFormData((prev) => ({ ...prev, date: clickedDate, time: '' }));
        setAvailableSlots([]);
        setAllSlots([]);
        setBookedSlots([]);
        setIsClosedDay(false);
        fetchAvailableSlots(clickedDate);
    };

    const fetchAvailableSlots = async (date) => {
        setLoadingSlots(true);
        try {
            const res = await fetch(`/available-slots/${date}`);
            const data = await res.json();
            setAvailableSlots(data.slots || []);
            setAllSlots(data.all || data.slots || []);
            setBookedSlots(data.booked || []);
            setIsClosedDay(Boolean(data.closed));
        } catch (err) {
            setAvailableSlots([]);
            setAllSlots([]);
            setBookedSlots([]);
            setIsClosedDay(false);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleTimeSelect = (time) => {
        selectedTimeRef.current = time;
        setFormData((prev) => ({ ...prev, time }));
    };

    const inputClasses = (name) => `
        w-full rounded-2xl border-2
        ${focused === name ? 'border-[#00acb1] bg-white' : 'border-[#00acb1]/60 bg-white'}
        px-4 py-4 pl-12 text-gray-900
        transition-all duration-300 ease-out
        focus:border-[#00acb1] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#00acb1]/30
        placeholder:text-gray-500 shadow-sm
    `;

    return (
        <SectionWrapper id="booking" className="bg-white">
            <div>
                <SectionTitle subtitle="Schedule your consultation and start your transformation journey">
                    Book Your Appointment
                </SectionTitle>

                {showSuccessPopup && success && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                        <GlassCard variant="solid" className="w-full max-w-lg p-6">
                            <div className="text-2xl font-extrabold text-[#005963]">Appointment Submitted</div>
                            <p className="mt-2 text-sm text-gray-700">{success}</p>
                            <div className="mt-4 rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3">
                                <div className="text-sm font-semibold text-[#005963]">Need help?</div>
                                <div className="mt-1 text-sm text-gray-700">
                                    Contact: <span className="font-semibold">{contactPhone || 'Please check Contact page for phone number.'}</span>
                                </div>
                            </div>
                            <div className="mt-5 flex justify-end">
                                <PrimaryButton type="button" onClick={() => setShowSuccessPopup(false)}>
                                    Close
                                </PrimaryButton>
                            </div>
                        </GlassCard>
                    </div>
                )}

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
                    <GlassCard variant="solid" className="p-4 sm:p-6">
                        <h3 className="mb-4 text-xl font-bold text-[#005963]">Select Appointment Date & Time</h3>
                        
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Calendar Section */}
                            <div className="rounded-2xl border-2 border-[#00acb1]/20 bg-white p-3">
                                <h4 className="mb-2 text-base font-semibold text-[#005963]">Choose Date</h4>
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    dateClick={handleDateClick}
                                    selectable={true}
                                    showNonCurrentDates={false}
                                    fixedWeekCount={false}
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
                            <div className="rounded-2xl border-2 border-[#00acb1]/20 bg-white p-3">
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
                                ) : isClosedDay ? (
                                    <div className="flex h-56 items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p>Doctor is closed on this date</p>
                                            <p className="mt-1 text-sm">Please choose another date</p>
                                        </div>
                                    </div>
                                ) : allSlots.length === 0 ? (
                                    <div className="flex h-56 items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p>No slots available for this date</p>
                                            <p className="mt-1 text-sm">Please choose another date</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid max-h-64 gap-2 overflow-y-auto pr-2 sm:grid-cols-3">
                                        {allSlots.map((slot) => {
                                            const isBooked = bookedSlots.includes(slot);
                                            const isSelected = formData.time === slot;

                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => {
                                                        if (!isBooked) handleTimeSelect(slot);
                                                    }}
                                                    className={`rounded-lg border-2 px-3 py-2 text-sm text-center font-semibold transition-all ${
                                                        isSelected
                                                            ? 'border-[#005963] bg-[#005963] text-white shadow-lg'
                                                            : isBooked
                                                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                                                                : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#00acb1] hover:bg-[#00acb1]/10'
                                                    }`}
                                                >
                                                    {slot}
                                                    {isBooked ? ' (Booked)' : ''}
                                                </button>
                                            );
                                        })}
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
                    <GlassCard variant="solid" className="border-2 border-[#00acb1]/50 p-8 sm:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name, Email, Phone Section with Border */}
                            <div className="rounded-2xl border-2 border-[#00acb1]/30 bg-white/20 p-6">
                                {/* Name */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-6"
                                >
                                    <label className="mb-2 block text-sm font-semibold text-[#005963]">Full Name</label>
                                    <p className="mb-3 text-xs text-gray-600">Enter your complete full name</p>
                                    <div className="relative">
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
                                    </div>
                                </motion.div>

                                {/* Phone & Email */}
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <label className="mb-2 block text-sm font-semibold text-[#005963]">Phone Number</label>
                                        <p className="mb-3 text-xs text-gray-600">We'll use this to contact you about your appointment</p>
                                        <div className="relative">
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
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <label className="mb-2 block text-sm font-semibold text-[#005963]">Email Address</label>
                                        <p className="mb-3 text-xs text-gray-600">Provide your email for appointment confirmation</p>
                                        <div className="relative">
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
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Message */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="rounded-2xl border-2 border-[#00acb1]/30 bg-white/20 p-6"
                            >
                                <label className="mb-2 block text-sm font-semibold text-[#005963]">Message</label>
                                <p className="mb-3 text-xs text-gray-600">Tell us about your concerns or what you'd like to address</p>
                                <div className="relative">
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
                                </div>
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
