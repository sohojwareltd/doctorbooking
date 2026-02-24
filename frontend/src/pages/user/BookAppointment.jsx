import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, Mail, Phone, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import UserLayout from '../../layouts/UserLayout';
import { toastError, toastSuccess } from '../../utils/toast';
import { formatDisplayDateTimeFromYmdAndTime, formatDisplayDateWithYear, formatDisplayTime12h } from '../../utils/dateFormat';

export default function UserBookAppointment() {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const contactPhone = page?.props?.site?.contactPhone || '';

  const initial = useMemo(() => ({
    name: authUser?.name || '',
    phone: authUser?.phone || '',
    email: authUser?.email || '',
    date: '',
    message: '',
  }), [authUser]);

  const [formData, setFormData] = useState(initial);
  const [selectedDate, setSelectedDate] = useState(null);
  const selectedDateRef = useRef(null);
  const [chambers, setChambers] = useState([]);
  const [loadingChambers, setLoadingChambers] = useState(false);
  const [selectedChamberId, setSelectedChamberId] = useState(null);
  const [selectedChamber, setSelectedChamber] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [closedWeekdays, setClosedWeekdays] = useState([]);
  const [previewSerial, setPreviewSerial] = useState(null);
  const [previewTime, setPreviewTime] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const isClosedByWeekday = (dateStr) => {
    if (!dateStr || !Array.isArray(closedWeekdays) || closedWeekdays.length === 0) return false;
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    return closedWeekdays.includes(dow);
  };

  const isUnavailableDate = (dateStr) => {
    if (!dateStr) return false;
    if (isClosedByWeekday(dateStr)) return true;
    if (!Array.isArray(unavailableRanges) || unavailableRanges.length === 0) return false;
    return unavailableRanges.some((r) => r?.start_date && r?.end_date && r.start_date <= dateStr && dateStr <= r.end_date);
  };

  // Load doctor's unavailable ranges for calendar
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch('/doctor-unavailable-ranges');
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setUnavailableRanges(Array.isArray(data?.ranges) ? data.ranges : []);
        setClosedWeekdays(Array.isArray(data?.closed_weekdays) ? data.closed_weekdays : []);
      } catch {
        if (!mounted) return;
        setUnavailableRanges([]);
        setClosedWeekdays([]);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Load active chambers once (for step 2)
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingChambers(true);
        const res = await fetch('/public-chambers');
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        const list = Array.isArray(data?.chambers) ? data.chambers : [];
        setChambers(list);
        if (list.length === 1) {
          setSelectedChamberId(list[0].id);
        }
      } catch {
        if (!mounted) return;
        setChambers([]);
      } finally {
        if (!mounted) return;
        setLoadingChambers(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Auto-preview serial and estimated time when date and chamber are selected
  useEffect(() => {
    const date = formData.date;
    const chamberId = selectedChamberId;
    if (!date || !chamberId) {
      setPreviewSerial(null);
      setPreviewTime(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoadingPreview(true);
        const params = new URLSearchParams({
          date,
          chamber_id: String(chamberId),
        });
        const res = await fetch(`/booking-preview?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setPreviewSerial(data?.serial_no ?? null);
        setPreviewTime(data?.estimated_time ?? null);
      } catch {
        if (cancelled) return;
        setPreviewSerial(null);
        setPreviewTime(null);
      } finally {
        if (cancelled) return;
        setLoadingPreview(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [formData.date, selectedChamberId]);

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;

    if (isUnavailableDate(clickedDate)) {
      const message = 'Doctor is unavailable on the selected date. Please choose another date.';
      setError(message);
      toastError(message);
      return;
    }

    setError('');
    setSelectedDate(clickedDate);
    selectedDateRef.current = clickedDate;
    setSelectedChamberId((prev) => (chambers.length === 1 ? chambers[0].id : prev));
    setFormData((p) => ({ ...p, date: clickedDate }));
    setPreviewSerial(null);
    setPreviewTime(null);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setSuccessDetails(null);
    setError('');

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      if (!token) {
        const message = 'Missing CSRF token. Please refresh the page and try again.';
        setError(message);
        toastError(message);
        return;
      }
      const res = await fetch('/book-appointment', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          // Use authenticated user's info for a quick flow
          name: formData.name || authUser?.name || '',
          phone: formData.phone || authUser?.phone || '',
          email: formData.email || authUser?.email || '',
          date: selectedDateRef.current || formData.date,
          message: formData.message,
          chamber_id: selectedChamberId,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.message || 'Appointment requested successfully. We will contact you shortly.';
        setSuccess(message);
        if (data?.serial_no || data?.estimated_time) {
          setSuccessDetails({
            serial: data.serial_no ?? null,
            estimated_time: data.estimated_time ?? null,
          });
        }
        toastSuccess(message);
        setShowSuccessPopup(true);
        setFormData((p) => ({ ...p, date: '', message: '' }));
        setSelectedDate(null);
        setSelectedChamberId(null);
        setSelectedChamber(null);
        setPreviewSerial(null);
        setPreviewTime(null);
      } else {
        const data = await res.json().catch(() => ({}));
        const message = data?.message || 'Failed to submit the booking. Please try again.';
        setError(message);
        toastError(message);
      }
    } catch {
      const message = 'Network error. Please try again.';
      setError(message);
      toastError(message);
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
            {successDetails && (successDetails.serial || successDetails.estimated_time) && (
              <div className="mt-3 rounded-2xl border border-[#00acb1]/30 bg-[#00acb1]/5 px-4 py-3 text-sm text-[#005963]">
                {successDetails.serial && (
                  <div>
                    <span className="font-semibold">Your serial:</span>{' '}
                    <span className="font-bold">#{successDetails.serial}</span>
                  </div>
                )}
                {successDetails.estimated_time && (
                  <div className="mt-1">
                    <span className="font-semibold">Estimated time:</span>{' '}
                    <span className="font-bold">
                      {formatDisplayTime12h(successDetails.estimated_time) || successDetails.estimated_time}
                    </span>
                  </div>
                )}
              </div>
            )}
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

      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl border border-[#00acb1]/20 bg-white/60 p-2">
            <Calendar className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Book Appointment</h1>
            <p className="mt-1 text-sm text-gray-700">
              Step 1: select a date • Step 2: choose chamber & time • Step 3: confirmation
            </p>
          </div>
        </div>

        {(success || error) && (
          <GlassCard variant="solid" className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Step 1 – Date */}
          <GlassCard variant="solid" className="p-5">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#005963]/80">Step 1</h3>
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
                dayCellClassNames={(arg) => {
                  if (isUnavailableDate(arg.dateStr)) return 'fc-unavailable';
                  if (arg.dateStr === selectedDate) return 'fc-day-selected';
                  return '';
                }}
              />
            </div>
          </GlassCard>

          {/* Step 2 – Chamber & Time frame */}
          <GlassCard variant="solid" className="p-5 flex flex-col">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#005963]/80">Step 2</h3>
            <h3 className="mb-3 text-lg font-extrabold text-[#005963]">Choose Chamber</h3>

            <div className="flex-1 min-h-0 space-y-4">
            {/* Chambers row */}
            <div>
              {loadingChambers ? (
                <div className="text-sm text-gray-600">Loading chambers…</div>
              ) : chambers.length === 0 ? (
                <div className="text-sm text-gray-500">No chambers configured yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {chambers.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChamberId(ch.id);
                        setSelectedChamber(ch);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        selectedChamberId === ch.id
                          ? 'border-[#005963] bg-[#005963] text-white'
                          : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#005963] hover:bg-[#00acb1]/10'
                      }`}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated time preview (no manual time selection) */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="mb-2 text-xs font-semibold text-[#005963]">
                Estimated visit time
              </div>
              {!selectedDate ? (
                <div className="text-xs text-gray-500">
                  Please select a date first.
                </div>
              ) : !selectedChamberId ? (
                <div className="text-xs text-gray-500">
                  Please choose a chamber to see your estimated time.
                </div>
              ) : loadingPreview ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-4 w-4 animate-spin" />
                  Calculating estimated time…
                </div>
              ) : previewTime ? (
                <div className="text-xs text-gray-700">
                  You will be seen around{' '}
                  <span className="font-semibold">
                    {formatDisplayTime12h(previewTime) || previewTime}
                  </span>{' '}
                  as serial{' '}
                  <span className="font-semibold">
                    #{previewSerial}
                  </span>
                  .
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Unable to calculate estimated time. You can still continue.
                </div>
              )}
            </div>

            </div>

            {formData.date && previewTime && previewSerial && (
              <div className="mt-4 rounded-2xl border border-[#00acb1]/30 bg-[#005963]/10 px-4 py-3 text-center text-sm font-semibold text-[#005963]">
                {formatDisplayDateWithYear(formData.date) || formData.date} • Serial #{previewSerial} • Est. time {formatDisplayTime12h(previewTime) || previewTime}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Step 3 – Quick confirmation (no long form) */}
        <div className="mt-6">
          <GlassCard variant="solid" className="p-6 flex flex-col gap-4">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#005963]/80">Step 3</h3>
              <h3 className="text-lg font-extrabold text-[#005963]">Confirm & Submit</h3>
              <p className="mt-1 text-sm text-gray-600">
                We will use your profile information to create the booking.
              </p>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-gray-500">Patient</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {authUser?.name || formData.name || '—'}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {authUser?.email || formData.email || 'No email'}
                </div>
                <div className="mt-0.5 text-xs text-gray-600">
                  {authUser?.phone || formData.phone || 'No phone'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Appointment</div>
                <div className="mt-1 text-sm text-gray-900">
                  {formData.date
                    ? (formatDisplayDateWithYear(formData.date) || formData.date)
                    : 'Please select a date'}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {selectedChamberId
                    ? `Chamber: ${chambers.find((c) => c.id === selectedChamberId)?.name ?? 'Selected'}`
                    : 'Chamber not selected'}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {previewSerial
                    ? `Serial: #${previewSerial}${
                        previewTime
                          ? ` • Est. time: ${
                              formatDisplayTime12h(previewTime) || previewTime
                            }`
                          : ''
                      }`
                    : 'Serial will be assigned automatically'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500">Notes</div>
                <div className="mt-1 text-xs text-gray-600">
                  You can update your profile information from your account page if needed.
                </div>
              </div>
            </div>

            <div className="pt-1">
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !formData.date || !selectedChamberId}
                className={(!formData.date || !selectedChamberId) ? 'opacity-60' : ''}
              >
                {submitting ? 'Submitting…' : 'Confirm Booking'}
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

UserBookAppointment.layout = (page) => <UserLayout>{page}</UserLayout>;
