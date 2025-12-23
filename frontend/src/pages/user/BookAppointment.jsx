import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, Mail, Phone, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import UserLayout from '../../layouts/UserLayout';

export default function UserBookAppointment() {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const contactPhone = page?.props?.site?.contactPhone || '';

  const initial = useMemo(() => ({
    name: authUser?.name || '',
    phone: authUser?.phone || '',
    email: authUser?.email || '',
    date: '',
    time: '',
    message: '',
  }), [authUser]);

  const [formData, setFormData] = useState(initial);
  const [selectedDate, setSelectedDate] = useState(null);
  const selectedDateRef = useRef(null);
  const selectedTimeRef = useRef('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const fetchAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/available-slots/${date}`);
      const data = await res.json().catch(() => ({}));
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    selectedDateRef.current = clickedDate;
    selectedTimeRef.current = '';
    setFormData((p) => ({ ...p, date: clickedDate, time: '' }));
    fetchAvailableSlots(clickedDate);
  };

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
          Accept: 'application/json',
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
        setFormData((p) => ({ ...p, date: '', time: '', message: '' }));
        setSelectedDate(null);
        setAvailableSlots([]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Failed to submit the booking. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20';

  return (
    <>
      <Head title="Book Appointment" />

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

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#005963]">Book Appointment</h1>
          <p className="mt-1 text-sm text-gray-700">Select a date and time, then submit your request.</p>
        </div>

        {(success || error) && (
          <GlassCard variant="solid" className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard variant="solid" className="p-5">
            <h3 className="mb-3 text-lg font-extrabold text-[#005963]">Choose Date</h3>
            <div className="rounded-2xl border border-[#00acb1]/20 bg-white p-3">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                dateClick={handleDateClick}
                selectable
                showNonCurrentDates={false}
                fixedWeekCount={false}
                headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                height="auto"
                validRange={{ start: new Date().toISOString().split('T')[0] }}
                dayCellClassNames={(arg) => (arg.dateStr === selectedDate ? 'fc-day-selected' : '')}
              />
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="p-5">
            <h3 className="mb-3 text-lg font-extrabold text-[#005963]">Available Time Slots</h3>

            {!selectedDate ? (
              <div className="flex h-56 items-center justify-center text-gray-600">
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
              <div className="flex h-56 items-center justify-center text-gray-600">
                <div className="text-center">
                  <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p>No slots available for this date</p>
                  <p className="mt-1 text-sm">Please choose another date</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3 text-sm text-gray-700">Selected date: <span className="font-semibold">{selectedDate}</span></div>
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-2 sm:grid-cols-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        selectedTimeRef.current = slot;
                        setFormData((p) => ({ ...p, time: slot }));
                      }}
                      className={`rounded-lg border-2 px-3 py-2 text-center text-sm font-semibold transition-all ${
                        formData.time === slot
                          ? 'border-[#005963] bg-[#005963] text-white'
                          : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#00acb1] hover:bg-[#00acb1]/10'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.date && formData.time && (
              <div className="mt-4 rounded-2xl border border-[#00acb1]/30 bg-[#005963]/10 px-4 py-3 text-center text-sm font-semibold text-[#005963]">
                Selected: {formData.date} at {formData.time}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="mt-6">
          <GlassCard variant="solid" className="p-6">
            <h3 className="mb-4 text-lg font-extrabold text-[#005963]">Your Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                    <input
                      className={`${inputClass} pl-11`}
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                    <input
                      className={`${inputClass} pl-11`}
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                    <input
                      type="email"
                      className={`${inputClass} pl-11`}
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">Message (optional)</label>
                <textarea
                  className={inputClass}
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="pt-1">
                <PrimaryButton type="submit" disabled={submitting || !formData.date || !formData.time}
                  className={(!formData.date || !formData.time) ? 'opacity-60' : ''}
                >
                  {submitting ? 'Submitting…' : 'Submit Appointment Request'}
                </PrimaryButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

UserBookAppointment.layout = (page) => <UserLayout>{page}</UserLayout>;
