import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import UserLayout from '../../layouts/UserLayout';
import { toastError, toastSuccess } from '../../utils/toast';
import { formatDisplayDateWithYear, formatDisplayTime12h } from '../../utils/dateFormat';

function getCsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (cookie) {
    return decodeURIComponent(cookie);
  }

  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

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
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [step, setStep] = useState(1);
  const calendarContainerRef = useRef(null);

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

  const normalizeCalendarDate = (arg) => {
    if (arg?.dateStr) return arg.dateStr;
    const d = arg?.date;
    if (!(d instanceof Date)) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Status → colour mapping for calendar events
  const statusColor = (status) => {
    switch (status) {
      case 'scheduled':       return '#2D3A74';
      case 'arrived':         return '#f59e0b';
      case 'in_consultation': return '#8b5cf6';
      case 'awaiting_tests':  return '#06b6d4';
      case 'prescribed':      return '#10b981';
      case 'cancelled':       return '#ef4444';
      default:                return '#6b7280';
    }
  };

  // Load patient's existing appointments for calendar highlights
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch('/api/patient/appointments?per_page=200', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setExistingAppointments(Array.isArray(data?.appointments?.data) ? data.appointments.data : []);
      } catch {
        // non-critical — calendar still usable without highlights
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Load doctor's unavailable ranges for calendar — reloads when chamber changes
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const params = selectedChamberId ? `?chamber_id=${selectedChamberId}` : '';
        const res = await fetch(`/api/public/unavailable-ranges${params}`);
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
  }, [selectedChamberId]);

  // Load active chambers once (for step 2)
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingChambers(true);
        const res = await fetch('/api/public/chambers');
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        const list = Array.isArray(data?.chambers) ? data.chambers : [];
        setChambers(list);
        if (list.length === 1) {
          setSelectedChamberId(list[0].id);
          setSelectedChamber(list[0]);
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

  useEffect(() => {
    if (!selectedChamberId || chambers.length === 0) return;
    const active = chambers.find((item) => String(item?.id) === String(selectedChamberId)) || null;
    setSelectedChamber(active);
  }, [selectedChamberId, chambers]);

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
        const res = await fetch(`/api/public/booking-preview?${params.toString()}`);
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

    if (!selectedChamberId) {
      const message = 'Please choose a chamber first to load that chamber schedule.';
      setError(message);
      toastError(message);
      return;
    }

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

  const handleDayCellDidMount = (arg) => {
    const cell = arg?.el;
    if (!cell) return;

    const frame = cell.querySelector('.fc-daygrid-day-frame') || cell;
    frame.style.position = 'relative';

    const dayStr = normalizeCalendarDate(arg);

    // ── Unavailable 🚫 icon ──────────────────────────────────────────────────
    const unavailable = isUnavailableDate(dayStr);
    const existingIcon = cell.querySelector('.fc-unavailable-icon');
    if (unavailable && !existingIcon) {
      const icon = document.createElement('span');
      icon.className = 'fc-unavailable-icon';
      icon.textContent = '🚫';
      icon.setAttribute('aria-label', 'Unavailable date');
      icon.title = 'Unavailable date';
      icon.style.cssText = 'position:absolute;top:3px;right:4px;font-size:15px;line-height:1;pointer-events:none;z-index:2;background:rgba(255,255,255,0.95);border-radius:999px;padding:1px';
      frame.appendChild(icon);
    } else if (!unavailable && existingIcon) {
      existingIcon.remove();
    }

    // ── Appointment dots ─────────────────────────────────────────────────────
    const existingDots = cell.querySelector('.fc-appt-dots');
    if (existingDots) existingDots.remove();

    const dayAppts = existingAppointments.filter((a) => a.appointment_date === dayStr);
    if (dayAppts.length === 0) return;

    const wrap = document.createElement('div');
    wrap.className = 'fc-appt-dots';
    wrap.style.cssText = 'position:absolute;bottom:3px;left:0;right:0;display:flex;justify-content:center;gap:3px;pointer-events:none;z-index:3';

    // Show up to 4 dots; if more, last dot shows a "+"
    const shown = dayAppts.slice(0, 4);
    shown.forEach((a, i) => {
      const dot = document.createElement('span');
      const isExtra = i === 3 && dayAppts.length > 4;
      dot.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px;border-radius:50%;background:${statusColor(a.status)};font-size:6px;color:#fff;font-weight:700;flex-shrink:0`;
      if (isExtra) {
        dot.textContent = '+';
        dot.style.width = '10px';
        dot.style.height = '10px';
      }
      dot.title = isExtra
        ? `+${dayAppts.length - 3} more appointments`
        : (a.status?.replace(/_/g, ' ') ?? 'appointment');
      wrap.appendChild(dot);
    });

    frame.appendChild(wrap);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setSuccessDetails(null);
    setError('');

    try {
      const token = getCsrfToken();
      if (!token) {
        const message = 'Missing CSRF token. Please refresh the page and try again.';
        setError(message);
        toastError(message);
        return;
      }
      const res = await fetch('/api/public/book-appointment', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-XSRF-TOKEN': token,
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
        setStep(1);
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

  const selectChamberAndResetDate = useCallback((chamber) => {
    if (!chamber) return;
    setSelectedChamberId(chamber.id);
    setSelectedChamber(chamber);
    setSelectedDate(null);
    selectedDateRef.current = null;
    setFormData((p) => ({ ...p, date: '' }));
    setPreviewSerial(null);
    setPreviewTime(null);
    setStep(2);
  }, []);

  const isStep1Complete = Boolean(selectedChamberId);
  const isStep2Complete = Boolean(selectedChamberId && formData.date);

  const steps = [
    { id: 1, label: 'Chamber' },
    { id: 2, label: 'Date' },
    { id: 3, label: 'Confirm' },
  ];

  const calendarRenderKey = useMemo(
    () => [
      selectedChamberId ?? 'none',
      closedWeekdays.join(','),
      unavailableRanges.map((r) => `${r?.start_date || ''}-${r?.end_date || ''}`).join(','),
    ].join('|'),
    [selectedChamberId, closedWeekdays, unavailableRanges]
  );

  // Inject coloured dots directly into FullCalendar cells using data-date attributes
  const injectAppointmentDots = useCallback(() => {
    const container = calendarContainerRef.current;
    if (!container) return;

    // Clear any previously injected dots
    container.querySelectorAll('.fc-appt-dots').forEach((el) => el.remove());
    if (existingAppointments.length === 0) return;

    // Group appointments by date
    const byDate = {};
    existingAppointments.forEach((a) => {
      if (!a.appointment_date) return;
      if (!byDate[a.appointment_date]) byDate[a.appointment_date] = [];
      byDate[a.appointment_date].push(a);
    });

    Object.entries(byDate).forEach(([date, appts]) => {
      // FullCalendar adds data-date="YYYY-MM-DD" to every day cell
      const cell = container.querySelector(`[data-date="${date}"]`);
      if (!cell) return;

      const frame = cell.querySelector('.fc-daygrid-day-frame') || cell;
      frame.style.position = 'relative';

      const wrap = document.createElement('div');
      wrap.className = 'fc-appt-dots';
      wrap.style.cssText =
        'position:absolute;bottom:3px;left:0;right:0;display:flex;justify-content:center;gap:3px;pointer-events:none;z-index:3';

      appts.slice(0, 4).forEach((a, i) => {
        const isExtra = i === 3 && appts.length > 4;
        const dot = document.createElement('span');
        dot.style.cssText =
          `display:inline-flex;align-items:center;justify-content:center;` +
          `width:${isExtra ? 10 : 8}px;height:${isExtra ? 10 : 8}px;` +
          `border-radius:50%;background:${statusColor(a.status)};` +
          `font-size:6px;color:#fff;font-weight:700;flex-shrink:0`;
        if (isExtra) dot.textContent = '+';
        dot.title = isExtra
          ? `+${appts.length - 3} more appointments`
          : (a.status?.replace(/_/g, ' ') ?? 'appointment');
        wrap.appendChild(dot);
      });

      frame.appendChild(wrap);
    });
  }, [existingAppointments]);

  // Re-inject whenever appointments load or calendar remounts
  useEffect(() => {
    const timer = setTimeout(injectAppointmentDots, 80);
    return () => clearTimeout(timer);
  }, [injectAppointmentDots, calendarRenderKey]);



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

      <div className="relative mx-auto w-full px-4 py-10 lg:w-[60%] lg:max-w-[980px]">
        <div className="pointer-events-none absolute left-0 top-8 h-32 w-32 rounded-full bg-[#7cd9cf]/25 blur-3xl" />
        <div className="pointer-events-none absolute right-3 top-24 h-40 w-40 rounded-full bg-[#0c7b79]/10 blur-3xl" />

        <div className="mb-4 flex items-start gap-3 rounded-3xl border border-white/70 bg-[linear-gradient(180deg,#f5fbfa_0%,#eef7f5_100%)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="rounded-2xl border border-[#00acb1]/20 bg-white/80 p-2">
            <Calendar className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#005963] sm:text-3xl">Book Appointment</h1>
            <p className="mt-1 text-sm text-gray-700">Fast 3-step booking flow.</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
              <span className="rounded-full border border-[#00acb1]/30 bg-white px-2.5 py-1 text-[#005963]">1 Chamber</span>
              <span className="rounded-full border border-[#00acb1]/30 bg-white px-2.5 py-1 text-[#005963]">2 Date</span>
              <span className="rounded-full border border-[#00acb1]/30 bg-white px-2.5 py-1 text-[#005963]">3 Confirm</span>
            </div>
          </div>
        </div>

        {(success || error) && (
          <GlassCard variant="solid" className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {steps.map((item) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 1) setStep(1);
                  if (item.id === 2 && isStep1Complete) setStep(2);
                  if (item.id === 3 && isStep2Complete) setStep(3);
                }}
                className={`rounded-2xl border px-3 py-2 text-left transition ${
                  done
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : active
                      ? 'border-[#9dded7] bg-white shadow-sm'
                      : 'border-white/70 bg-white/60'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Step {item.id}</div>
                <div className={`mt-0.5 text-sm font-semibold ${active || done ? 'text-[#12373d]' : 'text-slate-500'}`}>{item.label}</div>
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <GlassCard variant="solid" className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#005963] sm:text-lg">Choose Chamber</h3>
              <span className="rounded-full bg-[#00acb1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#005963]">Step 1</span>
            </div>

            {loadingChambers ? (
              <div className="text-sm text-gray-600">Loading chambers...</div>
            ) : chambers.length === 0 ? (
              <div className="text-sm text-gray-500">No chambers configured yet.</div>
            ) : (
              <div className="max-h-48 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {chambers.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => selectChamberAndResetDate(ch)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                        selectedChamberId === ch.id
                          ? 'border-[#005963] bg-[#005963] text-white'
                          : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#005963] hover:bg-[#00acb1]/10'
                      }`}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedChamber && (
              <div className="mt-3 rounded-2xl border border-[#00acb1]/20 bg-[#00acb1]/5 px-3 py-2.5 text-xs text-[#0f5963]">
                <div className="font-semibold">Selected chamber</div>
                <div className="mt-0.5">{selectedChamber.name}</div>
                {selectedChamber.location && (
                  <div className="mt-0.5 inline-flex items-start gap-1.5 text-gray-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{selectedChamber.location}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <PrimaryButton
                type="button"
                onClick={() => setStep(2)}
                disabled={!isStep1Complete}
                className={!isStep1Complete ? 'opacity-60' : ''}
              >
                Continue
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard variant="solid" className="p-4 sm:p-5 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#005963] sm:text-lg">Choose Date</h3>
              <span className="rounded-full bg-[#00acb1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#005963]">Step 2</span>
            </div>

            <div className="mt-3 rounded-[24px] border border-[#caebe6] bg-[linear-gradient(180deg,#f8fcfb_0%,#ffffff_100%)] p-3 sm:p-4">
              <div className="text-xs font-semibold text-[#005963]">
                {selectedChamberId
                  ? `Schedule for: ${selectedChamber?.name || 'Selected chamber'}`
                  : 'Please choose a chamber first in Step 1.'}
              </div>

              <div ref={calendarContainerRef} className="public-booking-calendar doctor-appointment-calendar mt-3 rounded-2xl border border-[#00acb1]/20 bg-white p-2.5 sm:p-3">
                <FullCalendar
                  key={calendarRenderKey}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  dateClick={handleDateClick}
                  dayCellDidMount={handleDayCellDidMount}
                  datesSet={() => setTimeout(injectAppointmentDots, 80)}
                  selectable
                  showNonCurrentDates={false}
                  fixedWeekCount={false}
                  headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                  height="auto"
                  validRange={{ start: new Date().toISOString().split('T')[0] }}
                  dayCellClassNames={(arg) => {
                    const dayStr = normalizeCalendarDate(arg);
                    if (isUnavailableDate(dayStr)) return 'fc-unavailable';
                    if (dayStr === selectedDate) return 'fc-day-selected';
                    return '';
                  }}
                />
              </div>

              {formData.date && previewTime && previewSerial && (
                <div className="mt-3 rounded-2xl border border-[#00acb1]/30 bg-[#005963]/10 px-4 py-2.5 text-center text-sm font-semibold text-[#005963]">
                  {formatDisplayDateWithYear(formData.date) || formData.date} • Serial #{previewSerial} • Est. time {formatDisplayTime12h(previewTime) || previewTime}
                </div>
              )}

              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="mb-2 text-xs font-semibold text-[#005963]">Estimated visit time</div>
                {!selectedDate ? (
                  <div className="text-xs text-gray-500">Please select a date first.</div>
                ) : !selectedChamberId ? (
                  <div className="text-xs text-gray-500">Please choose a chamber to see your estimated time.</div>
                ) : loadingPreview ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    Calculating estimated time…
                  </div>
                ) : previewTime ? (
                  <div className="text-xs text-gray-700">
                    You will be seen around <span className="font-semibold">{formatDisplayTime12h(previewTime) || previewTime}</span> as serial <span className="font-semibold">#{previewSerial}</span>.
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Unable to calculate estimated time. You can still continue.</div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <PrimaryButton
                type="button"
                onClick={() => setStep(3)}
                disabled={!isStep2Complete}
                className={!isStep2Complete ? 'opacity-60' : ''}
              >
                Continue
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard variant="solid" className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#005963] sm:text-lg">Confirm & Submit</h3>
              <span className="rounded-full bg-[#00acb1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#005963]">Step 3</span>
            </div>

            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#00acb1]/20 bg-[#00acb1]/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">Patient</div>
                <div className="mt-1 font-semibold text-gray-900">{authUser?.name || formData.name || '—'}</div>
              </div>
              <div className="rounded-xl border border-[#00acb1]/20 bg-[#00acb1]/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">Contact</div>
                <div className="mt-1 text-gray-700">{authUser?.phone || formData.phone || 'No phone'}</div>
              </div>
              <div className="rounded-xl border border-[#00acb1]/20 bg-[#00acb1]/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">Date & Chamber</div>
                <div className="mt-1 text-gray-700">
                  {formData.date ? (formatDisplayDateWithYear(formData.date) || formData.date) : 'Date not selected'}
                  {' • '}
                  {selectedChamberId
                    ? chambers.find((c) => c.id === selectedChamberId)?.name ?? 'Selected'
                    : 'Chamber not selected'}
                </div>
              </div>
              <div className="rounded-xl border border-[#00acb1]/20 bg-[#00acb1]/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">Serial & Time</div>
                <div className="mt-1 text-gray-700">
                  {previewSerial
                    ? `#${previewSerial}${previewTime ? ` • ${formatDisplayTime12h(previewTime) || previewTime}` : ''}`
                    : 'Assigned after confirmation'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => setStep(2)}
              >
                Back
              </button>
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
        )}


      </div>
    </>
  );
}

UserBookAppointment.layout = (page) => <UserLayout>{page}</UserLayout>;
