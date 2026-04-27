import { Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, Calendar, CheckCircle2, ChevronLeft, Clock, Loader2, MapPin, Phone, ShieldQuestion, Sparkles, User } from 'lucide-react';
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
  const initialSearch = typeof window !== 'undefined' ? window.location.search : '';

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
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [step, setStep] = useState(1);
  const [previewSerial, setPreviewSerial] = useState(null);
  const [previewTime, setPreviewTime] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [requestedChamberId, setRequestedChamberId] = useState(() => {
    const params = new URLSearchParams(initialSearch);
    return params.get('chamber_id');
  });
  const [requestedStep, setRequestedStep] = useState(() => {
    const params = new URLSearchParams(initialSearch);
    const rawStep = Number(params.get('step'));
    return Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 3 ? rawStep : null;
  });
  const captchaRequestSeq = useRef(0);

  const getTodayYmd = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isClosedByWeekday = (dateStr) => {
    if (!dateStr || !Array.isArray(closedWeekdays) || closedWeekdays.length === 0) return false;
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    return closedWeekdays.includes(dow);
  };

  const isUnavailableDate = (dateStr) => {
    if (!dateStr) return false;
    if (dateStr < getTodayYmd()) return true;
    if (isClosedByWeekday(dateStr)) return true;
    if (Array.isArray(fullyBookedDates) && fullyBookedDates.includes(dateStr)) return true;
    if (!Array.isArray(unavailableRanges) || unavailableRanges.length === 0) return false;
    return unavailableRanges.some(
      (r) => r?.start_date && r?.end_date && r.start_date <= dateStr && dateStr <= r.end_date
    );
  };

  const isFullyBookedDate = (dateStr) => Array.isArray(fullyBookedDates) && fullyBookedDates.includes(dateStr);

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
        setFullyBookedDates(Array.isArray(data?.fully_booked_dates) ? data.fully_booked_dates : []);
      } catch {
        if (!mounted) return;
        setUnavailableRanges([]);
        setClosedWeekdays([]);
        setFullyBookedDates([]);
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
        const matchedRequestedChamber = requestedChamberId
          ? list.find((item) => String(item?.id) === String(requestedChamberId))
          : null;

        if (matchedRequestedChamber) {
          setSelectedChamberId(matchedRequestedChamber.id);
          setSelectedChamber(matchedRequestedChamber);
          if (requestedStep) {
            setStep(requestedStep);
          }
          setRequestedChamberId(null);
          setRequestedStep(null);
        } else if (list.length === 1) {
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
    return () => {
      mounted = false;
    };
  }, [requestedChamberId, requestedStep]);

  useEffect(() => {
    if (!selectedChamberId || chambers.length === 0) return;
    const active = chambers.find((item) => String(item?.id) === String(selectedChamberId)) || null;
    setSelectedChamber(active);
  }, [selectedChamberId, chambers]);

  // Load a simple math captcha
  const loadCaptcha = async () => {
    const seq = ++captchaRequestSeq.current;
    setLoadingCaptcha(true);
    try {
      const res = await fetch('/api/public/captcha', {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (seq !== captchaRequestSeq.current) return;
      setCaptchaQuestion(data?.question || '');
      setCaptchaToken(data?.token || '');
      setFormData((prev) => ({ ...prev, captcha_answer: '' }));
    } catch {
      if (seq !== captchaRequestSeq.current) return;
      setCaptchaQuestion('');
      setCaptchaToken('');
    } finally {
      if (seq !== captchaRequestSeq.current) return;
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetBookingFlow = async () => {
    setStep(1);
    setError('');
    setSuccess('');
    setSuccessDetails(null);
    setSelectedDate(null);
    selectedDateRef.current = null;
    setPreviewSerial(null);
    setPreviewTime(null);
    setFormData((prev) => ({
      ...initial,
      name: prev.name || authUser?.name || '',
      phone: prev.phone || authUser?.phone || '',
      age: prev.age || '',
      gender: prev.gender || '',
      address: prev.address || '',
    }));
    await loadCaptcha();
  };

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
        if (data?.serial_no && data?.estimated_time) {
          setPreviewSerial(data.serial_no);
          setPreviewTime(data.estimated_time);
          setError('');
        } else {
          setPreviewSerial(null);
          setPreviewTime(null);
          if (data?.message) {
            setError(data.message);
          }
        }
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

    if (clickedDate < getTodayYmd()) {
      const message = 'Previous dates are not available for booking. Please choose today or a future date.';
      setError(message);
      toastError(message);
      return;
    }

    if (isFullyBookedDate(clickedDate)) {
      const message = 'All slots are already booked on the selected date. Please choose another date.';
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
    setFormData((p) => ({ ...p, date: clickedDate }));
    setPreviewSerial(null);
    setPreviewTime(null);
  };

  const handleDayCellDidMount = (arg) => {
    // Dates are styled via CSS classes in dayCellClassNames callback
    // No icon decoration needed
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (submitting) return;

    if (!selectedChamberId || !formData.date || !formData.name || !formData.phone) {
      const message = 'Please complete required fields (chamber, date, name, and phone) before confirming.';
      setError(message);
      toastError(message);
      return;
    }

    if (!captchaToken) {
      const message = 'Captcha expired. Reloading a new captcha now. Please answer and submit again.';
      setError(message);
      toastError(message);
      await loadCaptcha();
      return;
    }

    if (!formData.captcha_answer) {
      const message = 'Please answer the captcha before confirming booking.';
      setError(message);
      toastError(message);
      return;
    }

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

  const calendarRenderKey = useMemo(
    () => `${closedWeekdays.join(',')}|${unavailableRanges.map((r) => `${r?.start_date || ''}-${r?.end_date || ''}`).join(',')}`,
    [closedWeekdays, unavailableRanges]
  );

  const steps = [
    { id: 1, label: 'Chamber', hint: 'Choose location' },
    { id: 2, label: 'Date', hint: 'Pick day' },
    { id: 3, label: 'Details', hint: 'Confirm info' },
  ];

  const selectChamberAndContinue = (ch) => {
    setSelectedChamberId(ch.id);
    setSelectedChamber(ch);
    setFormData((p) => ({ ...p, date: '' }));
    setSelectedDate(null);
    selectedDateRef.current = null;
    setStep(2);
  };

  const stepCardMotion = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -18 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <>
      <Head title="Book Appointment" />

      <div className="mx-auto w-full max-w-7xl px-4 pt-0 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-[linear-gradient(180deg,#f7fbfa_0%,#eef6f4_100%)] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="hidden lg:flex mt-3 items-center gap-3 sm:gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0c7b79] shadow-sm">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="max-w-2xl text-sm   text-slate-500 sm:text-base">
                    Choose a Chamber
                  </p>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Select the location where you want to meet the doctor
                  </p>
                </div>
              </div>
            </div>


          </div>

          <div className="mb-7 grid grid-cols-3">
            {steps.map((item) => {
              const active = step === item.id;
              const done = step > item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: item.id * 0.06 }}
                  className="relative overflow-hidden  py-4 transition-all"
                >
                  <div className="pt-1">
                    <div className="relative">
                      <div className={`h-px w-full ${done ? 'bg-emerald-300' : active ? 'bg-[#7dcfc7]' : 'bg-slate-200'}`} />
                      <div className={`absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed text-sm font-semibold ${done
                        ? 'border-emerald-300 bg-emerald-500 text-white'
                        : active
                          ? 'border-[#0c7b79]/45 bg-white text-[#0c7b79]'
                          : 'border-slate-300 bg-white text-slate-500'}
                      `}>
                        {done ? <CheckCircle2 className="h-5 w-5" /> : item.id}
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <div className={`text-sm font-semibold ${active || done ? 'text-[#12373d]' : 'text-slate-500'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-400">{item.hint}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {error && (
            <GlassCard variant="solid" className="mb-6 border-rose-200 bg-rose-50/75 p-4">
              <div className="text-sm font-semibold text-rose-800">{error}</div>
            </GlassCard>
          )}

          <div className="grid gap-6 ">
            <div>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step-1" {...stepCardMotion}>
                    <GlassCard variant="solid" className="p-4 rounded-[30px] border border-white/80 bg-white/88 p-0 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-7">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold tracking-tight text-[#10363b]">Choose Chamber</h3>
                        <p className="mt-1 text-sm text-slate-500">Select where you want to meet the doctor.</p>
                      </div>

                      {loadingChambers ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading chambers…
                        </div>
                      ) : chambers.length === 0 ? (
                        <div className="text-sm text-slate-500">No chambers configured yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {chambers.map((ch, index) => {
                            const isActive = selectedChamberId === ch.id;
                            const mapsUrl =
                              ch.google_maps_url && ch.google_maps_url.trim() !== ''
                                ? ch.google_maps_url
                                : ch.location
                                  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ch.location)}`
                                  : null;

                            return (
                              <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, delay: index * 0.05 }}
                                onClick={() => selectChamberAndContinue(ch)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    selectChamberAndContinue(ch);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Select chamber ${ch.name}`}
                                className={`w-full cursor-pointer rounded-2xl border px-4 pb-2 py-4 transition-all duration-200 sm:px-5 sm:py-4 ${isActive
                                  ? 'border-[#0c7b79]/30 bg-[#f0faf9] shadow-[0_4px_20px_rgba(12,123,121,0.12)]'
                                  : 'border-[#e3e8ef] bg-white hover:border-[#0c7b79]/20 hover:bg-[#f7fdfb] hover:shadow-[0_2px_12px_rgba(12,123,121,0.07)]'
                                  }`}
                              >
                                <>
                                  <div className="sm:hidden">
                                    <div className="flex items-start gap-3">
                                      <div className="flex min-w-0 items-start gap-3">
                                        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ${isActive ? 'border-[#0c7b79]/25 bg-[#0c7b79]/10 text-[#0c7b79]' : 'border-[#dbe9ec] bg-[#eaf4f3] text-[#0c7b79]'}`}>
                                          <Building2 className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-[17px] font-semibold leading-snug text-[#1a2f44]">
                                            {ch.name}
                                          </p>
                                          <p className="mt-1 text-[14px] leading-snug text-slate-500 line-clamp-2">
                                            {ch.location || 'Location details shared during confirmation.'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 text-[15px] text-[#4b5563]">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span>{ch.phone || 'Call for schedule information'}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectChamberAndContinue(ch);
                                        }}
                                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition ${isActive ? 'bg-[#0a6664]' : 'bg-[#0c7b79] hover:bg-[#0a6664]'}`}
                                        aria-label={`Select chamber ${ch.name}`}
                                      >
                                        <ArrowRight className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <div className="mt-4 border-t border-slate-200 pt-1">
                                      <div className="grid grid-cols-2 divide-x divide-slate-200 text-[#0c7b79]">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (mapsUrl) window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                          className="flex items-center justify-center gap-2 py-1.5 text-[15px] font-medium"
                                        >
                                          <MapPin className="h-4 w-4" />
                                          Map
                                        </button>
                                        <a
                                          href={ch.phone ? `tel:${ch.phone}` : undefined}
                                          onClick={(e) => {
                                            if (!ch.phone) e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          className="flex items-center justify-center gap-2 py-1.5 text-[15px] font-medium"
                                        >
                                          <Phone className="h-4 w-4" />
                                          Call
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="hidden items-center justify-between gap-3.5 sm:flex sm:gap-4">
                                    <div className="flex min-w-0 gap-5 sm:w-[45%] sm:max-w-[45%] sm:shrink-0">
                                      <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ${isActive ? 'border-[#0c7b79]/25 bg-[#0c7b79]/10 text-[#0c7b79]' : 'border-[#dbe9ec] bg-[#eaf4f3] text-[#0c7b79]'}`}>
                                        <Building2 className="h-5 w-5" />
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate text-[15px] font-semibold leading-snug text-[#1a2f44]">
                                          {ch.name}
                                        </p>
                                        <div className="mt-0.5 flex items-start gap-1 text-[13px] text-slate-500">
                                          <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#0c7b79]" />
                                          <span className="line-clamp-1">{ch.location || 'Location details shared during confirmation.'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="hidden h-10 w-px shrink-0 bg-slate-400/40 sm:block" />

                                    <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                                      {ch.phone && (
                                        <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                                          <Phone className="h-3.5 w-3.5 shrink-0" />
                                          {ch.phone}
                                        </span>
                                      )}
                                      <div className="flex items-center gap-2.5">
                                        {mapsUrl && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                            className="flex items-center gap-1 text-[12px] font-medium text-[#0c7b79] transition hover:text-[#0a6664] hover:underline"
                                          >
                                            <MapPin className="h-3 w-3" />
                                            View on map
                                          </button>
                                        )}
                                        {ch.phone && (
                                          <a
                                            href={`tel:${ch.phone}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 text-[12px] font-medium text-[#0c7b79] transition hover:text-[#0a6664] hover:underline"
                                          >
                                            <Phone className="h-3 w-3" />
                                            Call
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <div className="hidden h-10 w-px shrink-0 bg-slate-400/40 sm:block" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectChamberAndContinue(ch);
                                      }}
                                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-white transition-all duration-150 ${isActive
                                        ? 'bg-[#0a6664] shadow-[0_2px_8px_rgba(10,102,100,0.30)]'
                                        : 'bg-[#0c7b79] hover:bg-[#0a6664] hover:shadow-[0_2px_8px_rgba(10,102,100,0.22)]'
                                        }`}
                                    >
                                      Select
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step-2" {...stepCardMotion}>
                    <GlassCard variant="solid" className="rounded-[30px] border border-white/80 bg-white/88 p-0 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-7">
                      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                        {/* Left: Doctor/Chamber Info */}
                        <div className="hidden lg:block">
                          <div className="sticky top-4 space-y-6 rounded-[28px] border border-slate-200/60 bg-[linear-gradient(180deg,#f9fcfb_0%,#ffffff_100%)] p-6 shadow-sm">
                            {/* Doctor/Clinic Header */}
                            <div className="border-b border-slate-200 pb-5">
                              {/* <h4 className="text-sm font-semibold tracking-tight text-slate-900">Clinic</h4> */}
                              <p className="mt-2 text-base font-bold text-[#0c7b79]">{selectedChamber?.name || 'Consultation Clinic'}</p>
                              <p className="mt-1 text-xs text-slate-500">Professional healthcare services</p>
                            </div>

                            {/* Consultation Info */}
                            <div className="space-y-4 border-b border-slate-200 pb-5">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#e0f2f1] text-[#0c7b79]">
                                  <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Consultation Duration</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-900">30 min</p>
                                </div>
                              </div>
                            </div>

                            {/* What's Included */}
                            <div className="space-y-3 border-b border-slate-200 pb-5">
                              <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                What's included
                              </p>
                              <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Professional consultation with specialist</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Diagnosis and treatment plan</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Prescription and follow-up guidance</span>
                                </li>
                              </ul>
                            </div>

                            {/* Before Appointment */}
                            <div className="space-y-3 border-b border-slate-200 pb-5">
                              <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Before your appointment
                              </p>
                              <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Arrive 5-10 minutes early</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Bring medical documents if available</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-1.5 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                  <span>Prepare list of symptoms/concerns</span>
                                </li>
                              </ul>
                            </div>

                            {/* Contact Info */}
                            <div className="pt-1">
                              <p className="text-xs font-semibold text-slate-700 mb-3">Contact Information</p>
                              <a
                                href={`tel:${selectedChamber?.phone || contactPhone}`}
                                className="inline-flex items-center gap-2 text-xs text-[#0c7b79] hover:underline"
                              >
                                <Phone className="h-4 w-4" />
                                {selectedChamber?.phone || contactPhone || 'Call for details'}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Right: Calendar Section */}
                        <div>
                          <div className="mb-5 flex items-center justify-between gap-3">
                            <div className='p-4 lg:p-0'>
                              <h3 className="text-xl font-semibold tracking-tight text-[#10363b]">Select a Date</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Choose your preferred appointment date
                              </p>
                            </div>
                            <button
                              type="button"
                              className="inline-flex me-3 lg:me-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden"
                              onClick={() => setStep(1)}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              Back
                            </button>
                          </div>

                          <div className="public-booking-calendar rounded-[28px] border-0 bg-transparent p-2 shadow-none sm:border sm:border-slate-200/80 sm:bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfb_100%)] sm:p-4 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_30px_rgba(15,23,42,0.04)]">
                            <FullCalendar
                              key={calendarRenderKey}
                              plugins={[dayGridPlugin, interactionPlugin]}
                              initialView="dayGridMonth"
                              dateClick={handleDateClick}
                              dayCellDidMount={handleDayCellDidMount}
                              selectable
                              showNonCurrentDates={true}
                              fixedWeekCount={false}
                              headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                              height="auto"
                              dayCellClassNames={(arg) => {
                                const dayStr = normalizeCalendarDate(arg);
                                if (isUnavailableDate(dayStr)) return 'fc-unavailable';
                                if (dayStr === selectedDate) return 'fc-day-selected';
                                if (dayStr === getTodayYmd()) return 'fc-day-today-custom';
                                return 'fc-day-available';
                              }}
                            />
                          </div>

                          {formData.date && (
                            <div className="mt-5 border-t border-slate-100 pt-5">
                              {loadingPreview ? (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Calculating estimated time…
                                </div>
                              ) : previewSerial && previewTime ? (
                                <div className="mx-[10px] lg:mx-0 rounded-[24px] border border-[#caebe6] bg-[linear-gradient(135deg,#eefaf8_0%,#ffffff_100%)] px-4 py-4 text-sm text-[#0d5558] shadow-sm">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Selected date</div>
                                  <div className="mt-1 font-semibold">
                                    {formatDisplayDateWithYear(formData.date) || formData.date}
                                  </div>
                                  <div className="mt-2 text-xs sm:text-sm">
                                    Serial <span className="font-bold">#{previewSerial}</span> • Estimated time{' '}
                                    <span className="font-bold">{formatDisplayTime12h(previewTime) || previewTime}</span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}

                          <div className="mt-6 mb-4 lg:mb-0 mx-4 lg:mx-0 flex flex-row gap-3 lg:flex-row lg:justify-between">
                            <button
                              type="button"
                              className="w-[30%] lg:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              onClick={() => setStep(1)}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              Back
                            </button>

                            <PrimaryButton
                              type="button"
                              disabled={!isStep2Complete}
                              className={`w-[70%] lg:w-auto rounded-full px-6 py-3 ${!isStep2Complete ? 'opacity-60' : ''}`}
                              onClick={() => setStep(3)}
                            >
                              Continue
                            </PrimaryButton>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step-3" {...stepCardMotion}>
                    <GlassCard variant="solid" className="p-4 rounded-[30px] border border-white/80 bg-white/88 p-0 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-7">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight text-[#10363b]">Patient Information</h3>
                          <p className="mt-1 text-sm text-slate-500">Enter the final details to confirm this booking.</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          onClick={() => setStep(2)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Back
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

                        {/* <div className="grid grid-cols-2 lg:grid-cols-1 gap-3"> */}
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
                        {/* </div> */}
                      </div>

                      <div className="mt-4">
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

                      <div className="mt-4">
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

                      <div className="mt-4">
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

                      <div className="hidden lg:block mt-4 rounded-[24px] border border-[#d6ece8] bg-[linear-gradient(135deg,#f7fdfc_0%,#ffffff_100%)] px-4 py-4 text-xs text-gray-700">
                        <div className=" mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Appointment Summary
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
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

                      <div className="mt-4">
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

                      <div className="mt-6 flex items-center justify-between gap-4 text-[11px] text-slate-500">
                        <div className='hidden lg:block'>Step 1: Chamber • Step 2: Date • Step 3: Patient Info</div>
                        <PrimaryButton
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="rounded-full px-6 py-3"
                        >
                          {submitting ? 'Confirming…' : 'Confirm Booking'}
                        </PrimaryButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {step === 4 && success && (
                  <motion.div key="step-4" {...stepCardMotion}>
                    <GlassCard variant="solid" className="mx-auto rounded-[30px] border border-white/80 bg-white/90 p-7 text-center shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:max-w-xl">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_16px_40px_rgba(16,185,129,0.28)]">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#10363b]">Booking Confirmed</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{success}</p>
                      {successDetails && (
                        <div className="mt-5 rounded-[24px] border border-[#d6ece8] bg-[linear-gradient(135deg,#f7fdfc_0%,#ffffff_100%)] px-4 py-4 text-left text-sm text-gray-700">
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
                            Your appointment request is now available in the doctor panel.
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <PrimaryButton type="button" onClick={resetBookingFlow} className="rounded-full px-6 py-3">
                          Back to Booking
                        </PrimaryButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </div>
        </div>
      </div>
      <style>{`
        .public-booking-calendar .fc-theme-standard td,
        .public-booking-calendar .fc-theme-standard th,
        .public-booking-calendar .fc-scrollgrid,
        .public-booking-calendar .fc-scrollgrid-section > * {
          border: 0;
        }

        .public-booking-calendar .fc-col-header-cell {
          padding-bottom: 10px;
        }

        .public-booking-calendar .fc .fc-daygrid-day-frame {
          padding: 6px 0;
          min-height: 58px;
          display: flex;
          flex-direction: row;
          justify-content: center;
        }

        .public-booking-calendar .fc-daygrid-day-top {
          justify-content: center;
        }

        .public-booking-calendar .fc-daygrid-day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          font-size: 18px;
          border-radius: 999px;
          font-weight: 600;
          color: #334155;
          transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .public-booking-calendar .fc-day-available .fc-daygrid-day-number {
          background: #eef4ff;
          color: #2563eb;
        }

        .public-booking-calendar .fc-day-today-custom .fc-daygrid-day-number,
        .public-booking-calendar .fc-day-selected .fc-daygrid-day-number {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
        }

        .public-booking-calendar .fc-unavailable .fc-daygrid-day-number {
          background: transparent !important;
          background-image: none !important;
          color: #94a3b8;
          opacity: 1;
          box-shadow: none;
        }

        .public-booking-calendar .fc-day-available:hover .fc-daygrid-day-number,
        .public-booking-calendar .fc-day-today-custom:hover .fc-daygrid-day-number {
          filter: brightness(0.98);
        }

        .public-booking-calendar .fc-day-other .fc-daygrid-day-number {
          opacity: 0.45;
        }

        .fc-daygrid-day-number {
          font-size: 14px !important;
          padding: 8px !important;
        }

        @media (max-width: 640px) {
          .public-booking-calendar .fc .fc-toolbar {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (min-width: 640px) {
          .fc-daygrid-day-number {
            font-size: 16px !important;
            padding: 27px !important;
          }
        }
      `}</style>
    </>
  );
}

PublicBookAppointment.layout = (page) => <PublicLayout>{page}</PublicLayout>;

