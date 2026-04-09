import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, MapPin, Phone, ShieldQuestion, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import PublicLayout from '../../layouts/PublicLayout';
import { toastError, toastSuccess } from '../../utils/toast';
import {
  formatDisplayDateTimeFromYmdAndTime,
  formatDisplayDateWithYear,
  formatDisplayTime12h,
} from '../../utils/dateFormat';

export default function PublicBookAppointment() {
  const page = usePage();
  const contactPhone = page?.props?.site?.contactPhone || '';
  const authUser = page?.props?.auth?.user || null;

  const initial = useMemo(
    () => ({
      name: '',
      phone: '',
      date: '',
      time: '',
      age: '',
      gender: '',
      symptoms: '',
      notes: '',
      address: '',
      captcha_answer: '',
    }),
    []
  );

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
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [closedWeekdays, setClosedWeekdays] = useState([]);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [step, setStep] = useState(1);
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
    return unavailableRanges.some(
      (r) => r?.start_date && r?.end_date && r.start_date <= dateStr && dateStr <= r.end_date
    );
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

  // Pre-fill form from API if logged in
  useEffect(() => {
    if (!authUser) return;
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch('/user/booking-profile', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok || !mounted) return;
        const data = await res.json().catch(() => ({}));
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || prev.phone,
          age: data.age != null ? String(data.age) : prev.age,
          gender: data.gender || prev.gender,
          address: data.address || prev.address,
        }));
      } catch { /* silently ignore */ }
    };
    run();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load unavailable ranges for the selected chamber's schedule
  useEffect(() => {
    if (!selectedChamberId) {
      setUnavailableRanges([]);
      setClosedWeekdays([]);
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        const params = new URLSearchParams({ chamber_id: String(selectedChamberId) });
        const res = await fetch(`/api/public/unavailable-ranges?${params}`);
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
    return () => {
      mounted = false;
    };
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
    return () => {
      mounted = false;
    };
  }, []);

  // Load a simple math captcha
  const loadCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetch('/api/public/captcha');
      const data = await res.json().catch(() => ({}));
      setCaptchaQuestion(data?.question || '');
      setCaptchaToken(data?.token || '');
      setFormData((prev) => ({ ...prev, captcha_answer: '' }));
    } catch {
      setCaptchaQuestion('');
      setCaptchaToken('');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview serial & estimated time whenever date and chamber are selected
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

    if (isUnavailableDate(clickedDate)) {
      const message = 'Doctor is unavailable on the selected date. Please choose another date.';
      setError(message);
      toastError(message);
      return;
    }

    setError('');
    setSelectedDate(clickedDate);
    selectedDateRef.current = clickedDate;
    setFormData((p) => ({ ...p, date: clickedDate }));
    setPreviewSerial(null);
    setPreviewTime(null);
  };

  const handleDayCellDidMount = (arg) => {
    const cell = arg?.el;
    if (!cell) return;

    const existing = cell.querySelector('.fc-unavailable-icon');
    const dayStr = normalizeCalendarDate(arg);
    const unavailable = isUnavailableDate(dayStr);

    if (!unavailable) {
      if (existing) existing.remove();
      return;
    }

    if (existing) return;

    const frame = cell.querySelector('.fc-daygrid-day-frame') || cell;
    frame.style.position = 'relative';

    const icon = document.createElement('span');
    icon.className = 'fc-unavailable-icon';
    icon.textContent = '🚫';
    icon.setAttribute('aria-label', 'Unavailable date');
    icon.title = 'Unavailable date';
    icon.style.position = 'absolute';
    icon.style.top = '3px';
    icon.style.right = '4px';
    icon.style.fontSize = '15px';
    icon.style.lineHeight = '1';
    icon.style.pointerEvents = 'none';
    icon.style.zIndex = '2';
    icon.style.background = 'rgba(255,255,255,0.95)';
    icon.style.borderRadius = '999px';
    icon.style.padding = '1px';

    frame.appendChild(icon);
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
      const res = await fetch('/api/public/book-appointment', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          date: selectedDateRef.current || formData.date,
          chamber_id: selectedChamberId,
          age: formData.age !== '' ? Number(formData.age) : undefined,
          gender: formData.gender || undefined,
          symptoms: formData.symptoms || undefined,
          notes: formData.notes || undefined,
          address: formData.address || undefined,
          captcha_token: captchaToken,
          captcha_answer: formData.captcha_answer,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          data?.message || 'Appointment requested successfully. We will contact you shortly.';
        setSuccess(message);
        if (data?.serial_no || data?.estimated_time) {
          setSuccessDetails({
            serial: data.serial_no ?? null,
            estimated_time: data.estimated_time ?? null,
          });
        }
        toastSuccess(message);
        setStep(4);
        setFormData(initial);
        setSelectedDate(null);
        setCaptchaQuestion('');
        setCaptchaToken('');
        await loadCaptcha();
      } else {
        const data = await res.json().catch(() => ({}));
        const message = data?.message || 'Failed to submit the booking. Please try again.';
        setError(message);
        toastError(message);
        await loadCaptcha();
      }
    } catch {
      const message = 'Network error. Please try again.';
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20';

  const isStep1Complete = Boolean(selectedChamberId);
  const isStep2Complete = Boolean(selectedChamberId && formData.date);
  const isStep3Complete =
    Boolean(formData.name && formData.phone) &&
    Boolean(formData.date && selectedChamberId) &&
    Boolean(captchaToken && formData.captcha_answer);

  const calendarRenderKey = useMemo(
    () => `${closedWeekdays.join(',')}|${unavailableRanges.map((r) => `${r?.start_date || ''}-${r?.end_date || ''}`).join(',')}`,
    [closedWeekdays, unavailableRanges]
  );

  return (
    <>
      <Head title="Book Appointment" />

      <div className="w-full px-4 py-10 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#005963]">Book Appointment</h1>
          <p className="mt-1 text-sm text-gray-600">
            Get your serial number in 3 easy steps
          </p>

          {/* Simple step indicator */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => {
              const active = step === s;
              const done = step > s;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : active
                          ? 'border-[#00acb1] bg-[#00acb1] text-white'
                          : 'border-gray-300 bg-white text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      active || done ? 'text-[#005963]' : 'text-gray-400'
                    }`}
                  >
                    {s === 1 ? 'Chamber' : s === 2 ? 'Date' : 'Patient Info'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <GlassCard variant="solid" className="mb-6 border-rose-200 bg-rose-50/60 p-4">
            <div className="text-sm font-semibold text-rose-800">{error}</div>
          </GlassCard>
        )}

        {/* Step 1 – Chamber */}
        {step === 1 && (
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#005963]">Choose Chamber</h3>
              <p className="text-xs text-gray-600">Select where you&apos;d like to see the doctor</p>
            </div>

            {loadingChambers ? (
              <div className="text-sm text-gray-600">Loading chambers…</div>
            ) : chambers.length === 0 ? (
              <div className="text-sm text-gray-500">No chambers configured yet.</div>
            ) : (
              <div className="space-y-3">
                {chambers.map((ch) => {
                  const isActive = selectedChamberId === ch.id;
                  const mapsUrl =
                    ch.google_maps_url && ch.google_maps_url.trim() !== ''
                      ? ch.google_maps_url
                      : ch.location
                        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            ch.location
                          )}`
                        : null;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChamberId(ch.id);
                        setSelectedChamber(ch);
                        setFormData((p) => ({ ...p, date: '' }));
                        setSelectedDate(null);
                        selectedDateRef.current = null;
                      }}
                      className={`w-full text-left rounded-2xl border px-4 py-3 text-sm transition ${
                        isActive
                          ? 'border-[#00acb1] bg-[#00acb1]/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-[#00acb1]'
                      }`}
                    >
                      <div className="font-semibold text-[#005963]">{ch.name}</div>
                      {ch.location && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{ch.location}</span>
                          {mapsUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="ml-1 text-[10px] font-semibold text-[#005963] underline underline-offset-2"
                            >
                              Directions
                            </button>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <PrimaryButton
                type="button"
                disabled={!isStep1Complete}
                className={!isStep1Complete ? 'opacity-60' : ''}
                onClick={() => setStep(2)}
              >
                Continue
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {/* Step 2 – Date */}
        {step === 2 && (
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#005963]">Pick a Date</h3>
                <p className="text-xs text-gray-600">
                  {selectedChamber?.name || 'Choose your preferred appointment date'}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[#005963] hover:underline"
                onClick={() => setStep(1)}
              >
                &larr; Back
              </button>
            </div>

            <div className="rounded-2xl border border-[#00acb1]/20 bg-white p-3">
              <FullCalendar
                key={calendarRenderKey}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                dateClick={handleDateClick}
                dayCellDidMount={handleDayCellDidMount}
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

            {formData.date && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                {loadingPreview ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    Calculating estimated time…
                  </div>
                ) : previewSerial && previewTime ? (
                  <div className="rounded-2xl border border-[#00acb1]/30 bg-[#005963]/5 px-4 py-3 text-xs text-[#005963]">
                    <div className="font-semibold">
                      {formatDisplayDateWithYear(formData.date) || formData.date}
                    </div>
                    <div className="mt-1">
                      Serial <span className="font-bold">#{previewSerial}</span> • Est. time:{' '}
                      <span className="font-bold">
                        {formatDisplayTime12h(previewTime) || previewTime}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                className="text-xs text-[#005963] hover:underline"
                onClick={() => setStep(1)}
              >
                &larr; Back
              </button>
              <PrimaryButton
                type="button"
                disabled={!isStep2Complete}
                className={!isStep2Complete ? 'opacity-60' : ''}
                onClick={() => setStep(3)}
              >
                Continue
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {/* Step 3 – Patient info + summary + captcha */}
        {step === 3 && (
          <GlassCard variant="solid" className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#005963]">Patient Information</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Enter details to confirm the booking.
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-[#005963] hover:underline"
                onClick={() => setStep(2)}
              >
                &larr; Back
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">Full Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className={`${inputClass} pl-11`}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className={`${inputClass} pl-11`}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Age (optional)"
                  min={1}
                  max={150}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                  className={inputClass}
                  disabled={submitting}
                >
                  <option value="">Select gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#005963]">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-[#005963]" />
                <input
                  type="text"
                  name="address"
                  placeholder="Address (optional)"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className={`${inputClass} pl-11`}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#005963]">Symptoms / Chief Complaint</label>
              <textarea
                name="symptoms"
                placeholder="Describe your symptoms (optional)"
                rows={3}
                value={formData.symptoms}
                onChange={(e) => setFormData((p) => ({ ...p, symptoms: e.target.value }))}
                className={`${inputClass} resize-none`}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#005963]">Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any additional notes (optional)"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className={`${inputClass} resize-none`}
                disabled={submitting}
              />
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-xs text-gray-700">
              <div className="font-semibold text-[#005963] mb-1">Appointment Summary</div>
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                <div>
                  <div className="text-[11px] text-gray-500">Date</div>
                  <div className="font-semibold">
                    {formData.date
                      ? formatDisplayDateWithYear(formData.date) || formData.date
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Chamber</div>
                  <div className="font-semibold">
                    {selectedChamber?.name || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Serial Number</div>
                  <div className="font-semibold">
                    {previewSerial ?? successDetails?.serial ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Est. Time</div>
                  <div className="font-semibold">
                    {previewTime
                      ? formatDisplayTime12h(previewTime) || previewTime
                      : successDetails?.estimated_time
                        ? formatDisplayTime12h(successDetails.estimated_time) ||
                          successDetails.estimated_time
                        : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#005963]">Captcha</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 rounded-2xl border border-[#00acb1]/30 bg-[#00acb1]/5 px-3 py-2 text-sm text-[#005963]">
                    <ShieldQuestion className="h-4 w-4" />
                    <span>
                      {loadingCaptcha
                        ? 'Loading…'
                        : captchaQuestion || 'Captcha unavailable. Please reload.'}
                    </span>
                  </div>
                  <input
                    type="text"
                    name="captcha_answer"
                    placeholder="Your answer"
                    value={formData.captcha_answer}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, captcha_answer: e.target.value }))
                    }
                    className={`${inputClass} mt-2`}
                    disabled={submitting || !captchaQuestion}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={loadingCaptcha}
                  className="mt-6 rounded-2xl border border-[#00acb1]/40 bg-white px-3 py-2 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-[11px] text-gray-500">
              <div>
                Step 1: Date • Step 2: Chamber • Step 3: Patient Info
              </div>
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !isStep3Complete}
                className={!isStep3Complete ? 'opacity-60' : ''}
              >
                {submitting ? 'Confirming…' : 'Confirm Booking'}
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {/* Step 4 – Success card */}
        {step === 4 && success && (
          <div className="mt-6">
            <GlassCard variant="solid" className="mx-auto max-w-md p-6 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl">
                ✓
              </div>
              <h3 className="text-lg font-extrabold text-[#005963]">Booking Confirmed!</h3>
              <p className="mt-1 text-sm text-gray-700">
                {success}
              </p>
              {successDetails && (
                <div className="mt-4 rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm text-left text-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-500">Serial Number</div>
                      <div className="text-lg font-extrabold text-emerald-600">
                        #{successDetails.serial}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">Est. Time</div>
                      <div className="text-sm font-semibold text-[#005963]">
                        {formatDisplayTime12h(successDetails.estimated_time) ||
                          successDetails.estimated_time}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    You will also see this appointment in the doctor&apos;s panel.
                  </div>
                </div>
              )}

              <div className="mt-5">
                <PrimaryButton type="button" onClick={() => setStep(1)}>
                  Back to Booking
                </PrimaryButton>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}

PublicBookAppointment.layout = (page) => <PublicLayout>{page}</PublicLayout>;

