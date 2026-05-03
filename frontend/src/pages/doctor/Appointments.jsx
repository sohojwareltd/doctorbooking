import { Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarCheck2, Eye, FilePlus, FileText, Hash, Loader2, Mars, Phone, Plus, Search, SlidersHorizontal, User, UserCheck, Venus, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import DoctorLayout from '../../layouts/DoctorLayout';
import StatusBadge from '../../components/doctor/StatusBadge';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'in_consultation', label: 'In consultation' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'test_registered', label: 'Report Submitted' },
  { value: 'awaiting_tests', label: 'Awaiting Report' },
  { value: 'prescribed', label: 'Prescribed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function renderHighlighted(value, query) {
  const text = String(value ?? '');
  const needle = query.trim();

  if (!needle) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const start = lowerText.indexOf(lowerNeedle);

  if (start === -1) {
    return text;
  }

  const end = start + needle.length;

  return (
    <>
      {text.slice(0, start)}
      <span className="font-semibold text-slate-900">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}

function formatStatusLabel(status) {
  const value = String(status || '').trim();
  if (!value) return 'Unknown';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusSelectTone(status) {
  const value = String(status || '').toLowerCase();

  const tones = {
    scheduled: 'border-slate-200 bg-white text-slate-700',
    arrived: 'border-amber-200 bg-white text-amber-700',
    in_consultation: 'border-violet-200 bg-white text-violet-700',
    test_registered: 'border-cyan-200 bg-white text-cyan-700',
    awaiting_tests: 'border-orange-200 bg-white text-orange-700',
    prescribed: 'border-emerald-200 bg-white text-emerald-700',
    cancelled: 'border-rose-200 bg-white text-rose-700',
  };

  return tones[value] || tones.scheduled;
}

function getMobileCardAccent(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'in_consultation') return 'from-violet-500 to-indigo-500';
  if (value === 'arrived') return 'from-amber-400 to-orange-400';
  if (value === 'scheduled') return 'from-sky-400 to-blue-500';
  if (value === 'test_registered') return 'from-cyan-400 to-sky-500';
  if (value === 'awaiting_tests') return 'from-orange-400 to-amber-500';
  if (value === 'prescribed') return 'from-emerald-500 to-green-500';
  if (value === 'cancelled') return 'from-rose-400 to-red-500';

  return 'from-slate-300 to-slate-400';
}

function getStatusSummaryTone(status) {
  const value = String(status || '').toLowerCase();

  const tones = {
    today: 'border-[#CBD5E1] bg-slate-50 text-slate-700',
    scheduled: 'border-slate-200 bg-slate-50 text-slate-700',
    arrived: 'border-amber-200 bg-amber-50 text-amber-700',
    in_consultation: 'border-violet-200 bg-violet-50 text-violet-700',
    test_registered: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    awaiting_tests: 'border-orange-200 bg-orange-50 text-orange-700',
    prescribed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return tones[value] || tones.scheduled;
}

function getTodayYmd() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFirstDayOfCurrentMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function GenderIconAvatar({ gender }) {
  const value = String(gender || '').toLowerCase();

  if (value === 'female') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-[0_6px_14px_-8px_rgba(244,63,94,0.9)]" title="Female">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-pink-100 text-pink-600 shadow-sm">
          <Venus className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  if (value === 'male') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_6px_14px_-8px_rgba(59,130,246,0.95)]" title="Male">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-sky-100 text-sky-600 shadow-sm">
          <Mars className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
      <User className="h-4 w-4" />
    </span>
  );
}

export default function DoctorAppointments() {
  const { auth } = usePage().props;
  const isCompounder = auth?.user?.role === 'compounder';
  const ROWS_PER_PAGE = 10;
  const [rows, setRows] = useState([]);
  const [pageMeta, setPageMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [chamberFilter, setChamberFilter] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [chambers, setChambers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Create appointment modal states
  const defaultApptForm = () => ({
    patient_name: '',
    patient_phone: '',
    patient_address: '',
    patient_age: '',
    patient_gender: '',
    chamber_id: '',
    appointment_date: '',
    appointment_time: '',
  });
  const defaultPatientForm = () => ({
    name: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [apptMode, setApptMode] = useState('select'); // select | walkin
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [chosenPatient, setChosenPatient] = useState(null);
  const [apptForm, setApptForm] = useState(defaultApptForm);
  const [apptErrors, setApptErrors] = useState({});
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [patientForm, setPatientForm] = useState(defaultPatientForm);
  const [patientFormErrors, setPatientFormErrors] = useState({});
  const [patientSubmitting, setPatientSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [previewSerial, setPreviewSerial] = useState(null);
  const [previewTime, setPreviewTime] = useState(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [closedWeekdays, setClosedWeekdays] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const patientDropRef = useRef(null);
  const skipPatientSearchRef = useRef(false);

  const buildParams = (page = currentPage) => {
    const params = {
      page,
      per_page: ROWS_PER_PAGE,
    };

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (statusFilter !== 'all') {
      params.status_filter = statusFilter;
    }

    if (datePreset === 'today' || datePreset === 'week' || datePreset === 'month') {
      params.date_filter = datePreset;
    }

    if (genderFilter !== 'all') {
      params.gender = genderFilter;
    }

    if (chamberFilter !== 'all') {
      params.chamber_id = chamberFilter;
    }

    return params;
  };

  const fetchAppointments = async (params = {}) => {
    setLoading(true);
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`/api/doctor/appointments?${query}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.appointments) ? data.appointments : (data.appointments?.data ?? []);
        setRows(items);
        setPageMeta({
          currentPage: data.meta?.current_page ?? 1,
          lastPage: data.meta?.last_page ?? 1,
          total: data.meta?.total ?? items.length,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/doctor/chambers', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : { chambers: [] })
      .then((data) => setChambers(Array.isArray(data.chambers) ? data.chambers : []));
  }, []);

  useEffect(() => {
    fetchAppointments(buildParams(currentPage));
  }, [currentPage, searchTerm, statusFilter, datePreset, genderFilter, chamberFilter]);

  // Patient search for create modal
  useEffect(() => {
    if (apptMode !== 'select' || !patientSearch.trim()) {
      setPatientResults([]);
      return;
    }

    if (skipPatientSearchRef.current) {
      skipPatientSearchRef.current = false;
      setPatientSearching(false);
      return;
    }

    setPatientSearching(true);
    const timer = setTimeout(async () => {
      try {
        const searchValue = patientSearch.trim();
        const res = await fetch(`/api/doctor/patients?search=${encodeURIComponent(searchValue)}&per_page=10&include_all=1`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.patients?.data ?? (Array.isArray(data.patients) ? data.patients : []);
          setPatientResults(items);
          setShowPatientDrop(true);
        }
      } catch {
        // silent
      } finally {
        setPatientSearching(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [patientSearch, apptMode]);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (patientDropRef.current && !patientDropRef.current.contains(e.target)) {
        setShowPatientDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPatientName = (appointment) => appointment?.patient_name || appointment?.user?.name || appointment?.name || `Patient #${appointment?.user_id || ''}`;
  const getPatientPhone = (appointment) => appointment?.patient_phone || appointment?.user?.phone || null;
  const getPatientAge = (appointment) => appointment?.patient_age || appointment?.user?.age || '';
  const getPatientAddress = (appointment) => appointment?.address || appointment?.patient_address || '';
  const getChamberName = (appointment) => appointment?.chamber_name || appointment?.chamber?.name || 'N/A';
  const getPatientGender = (appointment) => {
    return appointment?.patient_gender || appointment?.user?.gender || '';
  };

  const formatAgeGender = (appointment) => {
    const age = getPatientAge(appointment);
    const gender = formatGender(getPatientGender(appointment));
    const ageLabel = age ? `${age}y` : 'Age N/A';
    return `${ageLabel} • ${gender}`;
  };

  const formatGender = (gender) => {
    const value = String(gender || '').trim().toLowerCase();
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const updateStatus = async (id, status) => {
    const response = await fetch(`/api/doctor/appointments/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setSelectedPatient((prev) => (prev?.id === id ? { ...prev, status } : prev));
      await fetchAppointments(buildParams(currentPage));
      toastSuccess('Appointment status updated.');
      return;
    }

    const data = await response.json().catch(() => ({}));
    toastError(data?.message || 'Failed to update status.');
  };

  const resetAndClose = () => {
    setShowCreateModal(false);
    setApptMode('select');
    setPatientSearch('');
    setPatientResults([]);
    setShowPatientDrop(false);
    setChosenPatient(null);
    setApptForm(defaultApptForm());
    setApptErrors({});
    setSelectedDate(null);
    setPreviewSerial(null);
    setPreviewTime(null);
    setPreviewMessage('');
    setUnavailableRanges([]);
    setClosedWeekdays([]);
  };

  const resetCreatePatientModal = () => {
    setShowCreatePatientModal(false);
    setPatientForm(defaultPatientForm());
    setPatientFormErrors({});
  };

  const isClosedByWeekday = useCallback((dateStr) => {
    if (!dateStr || closedWeekdays.length === 0) return false;
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    return closedWeekdays.includes(dow);
  }, [closedWeekdays]);

  const isUnavailableDate = useCallback((dateStr) => {
    if (!dateStr) return false;
    if (dateStr < getTodayYmd()) return true;
    if (isClosedByWeekday(dateStr)) return true;
    return unavailableRanges.some((range) => range?.start_date && range?.end_date && range.start_date <= dateStr && dateStr <= range.end_date);
  }, [isClosedByWeekday, unavailableRanges]);

  const normalizeCalendarDate = useCallback((arg) => {
    if (arg?.dateStr) return arg.dateStr;
    const date = arg?.date;
    if (!(date instanceof Date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleCalendarDayCellDidMount = useCallback(() => {
    // Dates are styled via dayCellClassNames, matching the public booking calendar.
  }, []);

  const handleDateSelect = useCallback((info) => {
    if (!apptForm.chamber_id) {
      toastError('Select a chamber first.');
      return;
    }

    const dateStr = info.dateStr;
    if (dateStr < getTodayYmd()) {
      toastError('Previous dates are not available.');
      return;
    }
    if (isUnavailableDate(dateStr)) {
      toastError('Selected chamber is unavailable on this date.');
      return;
    }

    setSelectedDate(dateStr);
    setPreviewSerial(null);
    setPreviewTime(null);
    setPreviewMessage('');
    setApptForm((prev) => ({ ...prev, appointment_date: dateStr, appointment_time: '' }));
  }, [apptForm.chamber_id, isUnavailableDate]);

  useEffect(() => {
    if (!showCreateModal || !apptForm.chamber_id) {
      setSelectedDate(null);
      setPreviewSerial(null);
      setPreviewTime(null);
      setUnavailableRanges([]);
      setClosedWeekdays([]);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        setLoadingCalendar(true);
        const params = new URLSearchParams({ chamber_id: String(apptForm.chamber_id) });
        const res = await fetch(`/api/public/unavailable-ranges?${params.toString()}`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setUnavailableRanges(Array.isArray(data?.ranges) ? data.ranges : []);
        setClosedWeekdays(Array.isArray(data?.closed_weekdays) ? data.closed_weekdays : []);
      } catch {
        if (!mounted) return;
        setUnavailableRanges([]);
        setClosedWeekdays([]);
      } finally {
        if (!mounted) return;
        setLoadingCalendar(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, [showCreateModal, apptForm.chamber_id]);

  useEffect(() => {
    const date = apptForm.appointment_date;
    const chamberId = apptForm.chamber_id;

    if (!showCreateModal || !date || !chamberId) {
      setPreviewSerial(null);
      setPreviewTime(null);
      setPreviewMessage('');
      setApptForm((prev) => (prev.appointment_time ? { ...prev, appointment_time: '' } : prev));
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoadingPreview(true);
        setPreviewMessage('');
        const params = new URLSearchParams({ date, chamber_id: String(chamberId) });
        const res = await fetch(`/api/public/booking-preview?${params.toString()}`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const nextTime = data?.estimated_time ?? null;
        setPreviewSerial(data?.serial_no ?? null);
        setPreviewTime(nextTime);
        if (!nextTime) {
          setPreviewMessage(data?.message || 'No estimated time is available for this date in the selected chamber. Please choose another date or chamber.');
        }
        setApptForm((prev) => ({ ...prev, appointment_time: nextTime || '' }));
      } catch {
        if (cancelled) return;
        setPreviewSerial(null);
        setPreviewTime(null);
        setPreviewMessage('Unable to load appointment preview right now. Please retry or pick another date.');
        setApptForm((prev) => ({ ...prev, appointment_time: '' }));
      } finally {
        if (cancelled) return;
        setLoadingPreview(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [showCreateModal, apptForm.appointment_date, apptForm.chamber_id]);

  const handleCreateAppointment = async () => {
    setApptErrors({});
    const errors = {};

    if (apptMode === 'select' && !chosenPatient) {
      errors.patient = 'Please select a patient.';
    }
    if (apptMode === 'walkin' && !apptForm.patient_name.trim()) {
      errors.patient_name = 'Patient name is required.';
    }
    if (!apptForm.chamber_id) errors.chamber_id = 'Chamber is required.';
    if (!apptForm.appointment_date) errors.appointment_date = 'Date is required.';
    if (!apptForm.appointment_time) errors.appointment_time = 'Time is required.';

    if (Object.keys(errors).length > 0) {
      setApptErrors(errors);
      return;
    }

    setApptSubmitting(true);
    try {
      const modeMap = { select: 'select_patient', walkin: 'walkin' };
      const payload = {
        mode: modeMap[apptMode],
        user_id: apptMode === 'select' ? chosenPatient.id : undefined,
        name: apptMode === 'select' ? chosenPatient?.name : apptForm.patient_name,
        phone: apptMode === 'select' ? chosenPatient?.phone || undefined : apptForm.patient_phone || undefined,
        address: apptMode === 'select' ? undefined : (apptForm.patient_address || undefined),
        age: apptMode === 'walkin' && apptForm.patient_age ? Number(apptForm.patient_age) : undefined,
        gender: apptMode === 'walkin' && apptForm.patient_gender ? apptForm.patient_gender : undefined,
        chamber_id: apptForm.chamber_id ? Number(apptForm.chamber_id) : undefined,
        appointment_date: apptForm.appointment_date,
        appointment_time: apptForm.appointment_time,
        status: 'scheduled',
      };

      const res = await fetch('/api/doctor/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toastSuccess('Appointment created successfully.');
        setCurrentPage(1);
        fetchAppointments(buildParams(1));
        resetAndClose();
      } else {
        if (data?.errors) {
          const mapped = {};
          Object.entries(data.errors).forEach(([key, msgs]) => {
            mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setApptErrors(mapped);
        } else {
          toastError(data?.message || 'Failed to create appointment.');
        }
      }
    } catch {
      toastError('Something went wrong. Please try again.');
    } finally {
      setApptSubmitting(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    skipPatientSearchRef.current = true;
    setChosenPatient(patient);
    setPatientSearch(patient?.name || '');
    setPatientResults([]);
    setShowPatientDrop(false);

    if (!patient?.id) return;

    try {
      const res = await fetch(`/api/doctor/patients/${patient.id}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.patient) {
        setChosenPatient(data.patient);
      }
    } catch {
      // Keep the lightweight search result if the detail request fails.
    }
  };

  const handleCreatePatient = async () => {
    const errors = {};
    if (!patientForm.name.trim()) errors.name = 'Patient name is required.';
    if (!patientForm.phone.trim()) errors.phone = 'Phone is required.';
    if (Object.keys(errors).length > 0) {
      setPatientFormErrors(errors);
      return;
    }

    setPatientSubmitting(true);
    setPatientFormErrors({});
    try {
      const res = await fetch('/api/doctor/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: patientForm.name,
          phone: patientForm.phone,
          age: patientForm.age ? Number(patientForm.age) : undefined,
          gender: patientForm.gender || undefined,
          address: patientForm.address || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.errors) {
          const mapped = {};
          Object.entries(data.errors).forEach(([key, msgs]) => {
            mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setPatientFormErrors(mapped);
        } else {
          toastError(data?.message || 'Failed to create patient.');
        }
        return;
      }

      const patient = data?.patient || null;
      if (patient) {
        setApptMode('select');
        setChosenPatient(patient);
        setPatientSearch(patient.name || '');
        setShowPatientDrop(false);
      }
      toastSuccess(data?.message || 'Patient created successfully.');
      resetCreatePatientModal();
    } catch {
      toastError('Failed to create patient.');
    } finally {
      setPatientSubmitting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, datePreset, genderFilter, chamberFilter]);

  const totalPages = Math.max(1, pageMeta.lastPage || 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = rows;

  const visiblePageNumbers = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);

    if ((end - start + 1) < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safeCurrentPage, totalPages]);

  const today = getTodayYmd();
  const stats = useMemo(() => ({
    total: pageMeta.total,
    today: rows.filter((item) => item.appointment_date === today).length,
    awaitingTests: rows.filter((item) => item.status === 'awaiting_tests').length,
    arrived: rows.filter((item) => item.status === 'arrived').length,
    reportSubmitted: rows.filter((item) => item.status === 'test_registered').length,
    completed: rows.filter((item) => item.status === 'prescribed').length,
    visible: pageMeta.total,
  }), [rows, today, pageMeta.total]);

  const statusCountItems = useMemo(() => (
    STATUS_OPTIONS
      .filter((option) => option.value !== 'all')
      .map((option) => ({
        key: option.value,
        label: option.label,
        count: rows.filter((item) => item.status === option.value).length,
      }))
  ), [rows]);

  const topWidgets = [
    {
      key: 'today',
      label: 'Today Appointments',
      value: stats.today,
      helper: `${stats.visible} total appointments found`,
      icon: CalendarCheck2,
      tone: 'bg-sky-50 text-sky-700',
      filter: { type: 'date', value: 'today' },
    },
    {
      key: 'queue',
      label: 'Arrived',
      value: stats.arrived,
      helper: 'Patients marked arrived',
      icon: UserCheck,
      tone: 'bg-amber-50 text-amber-700',
      filter: { type: 'status', value: 'arrived' },
    },
    {
      key: 'progress',
      label: 'Report Submitted',
      value: stats.reportSubmitted,
      helper: 'Patients with submitted reports',
      icon: FileText,
      tone: 'bg-violet-50 text-violet-700',
      filter: { type: 'status', value: 'test_registered' },
    },
    {
      key: 'tests',
      label: 'Awaiting Tests',
      value: stats.awaitingTests,
      helper: `${stats.completed} completed overall`,
      icon: FileText,
      tone: 'bg-orange-50 text-orange-700',
      filter: { type: 'status', value: 'awaiting_tests' },
    },
  ];

  const applyWidgetFilter = useCallback((widget) => {
    if (!widget?.filter) return;

    if (widget.filter.type === 'status') {
      setStatusFilter(widget.filter.value);
      return;
    }

    if (widget.filter.type === 'date') {
      setDatePreset(widget.filter.value);
    }
  }, []);

  const isWidgetActive = useCallback((widget) => {
    if (!widget?.filter) return false;

    if (widget.filter.type === 'status') {
      return statusFilter === widget.filter.value;
    }

    if (widget.filter.type === 'date') {
      return datePreset === widget.filter.value;
    }

    return false;
  }, [datePreset, statusFilter]);

  const calendarRenderKey = useMemo(
    () => [
      apptForm.chamber_id || 'none',
      closedWeekdays.join(','),
      unavailableRanges.map((range) => `${range?.start_date || ''}-${range?.end_date || ''}`).join(','),
    ].join('|'),
    [apptForm.chamber_id, closedWeekdays, unavailableRanges]
  );

  return (
    <DoctorLayout title="Appointments" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="mb-4 space-y-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#2D3A74]">Appointments</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {stats.visible}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Track today’s queue, update statuses, and open prescriptions from one place.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* <div className={`rounded-xl border px-2.5 py-1.5 text-xs ${getStatusSummaryTone('today')}`}>
                Today: <span className="font-semibold">{stats.today}</span>
              </div>
              <div className={`rounded-xl border px-2.5 py-1.5 text-xs ${getStatusSummaryTone('awaiting_tests')}`}>
                Awaiting tests: <span className="font-semibold">{stats.awaitingTests}</span>
              </div> */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                New Appointment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {topWidgets.map((widget, widgetIndex) => {
              const Icon = widget.icon;
              const active = isWidgetActive(widget);

              return (
                <button
                  key={widget.key}
                  type="button"
                  onClick={() => applyWidgetFilter(widget)}
                  style={{ animationDelay: `${widgetIndex * 120}ms` }}
                  className={`surface-card rounded-2xl p-3.5 text-left transition animate-[widget-bounce-in_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both] sm:rounded-3xl sm:p-5 ${active
                    ? 'ring-2 ring-[#2D3A74]/35 shadow-[0_14px_34px_-18px_rgba(45,58,116,0.7)]'
                    : 'hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-20px_rgba(15,23,42,0.5)]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500 sm:text-sm">{widget.label}</p>
                      <p className="text-2xl font-semibold text-[#2D3A74] sm:text-3xl">{widget.value}</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${widget.tone}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[11px] text-slate-400 sm:mt-4 sm:text-xs">{widget.helper}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="hidden md:grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,360px)_180px_180px_180px_180px] lg:items-end">
                  <div className="col-span-2 lg:col-span-1">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Name, phone, serial or id"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 min-w-0 lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</label>
                    <select
                      value={datePreset}
                      onChange={(e) => setDatePreset(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>

                  <div className="col-span-1 min-w-0 lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-1 min-w-0 lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 min-w-0 lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Chamber</label>
                    <select
                      value={chamberFilter}
                      onChange={(e) => setChamberFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All chambers</option>
                      {chambers.map((chamber) => (
                        <option key={chamber.id} value={String(chamber.id)}>{chamber.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex md:hidden items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    title="Open filters"
                    aria-label="Open filters"
                  >
                    <SlidersHorizontal className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="hidden lg:block" />
              </div>
            </div>
          </div>

          <div className="md:hidden border-t border-slate-100 bg-slate-50/70 px-3 py-3 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2D3A74]" />
                  <span>Loading appointments...</span>
                </div>
              </div>
            ) : paginatedRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <DocEmptyState
                  icon={CalendarCheck2}
                  title="No appointments found"
                  description="Try another status or keyword."
                />
              </div>
            ) : paginatedRows.map((appointment) => {
              const patientPhone = getPatientPhone(appointment);
              const appointmentTimeLabel = formatDisplayTime12h(appointment.appointment_time) || appointment.appointment_time || 'N/A';
              const isInConsultation = appointment.status === 'in_consultation';

              return (
                <div
                  key={appointment.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-[0_10px_22px_rgba(15,23,42,0.06)] cursor-pointer transition active:scale-[0.995] ${
                    isInConsultation
                      ? 'border-emerald-300 animate-[consultation-bounce_1.8s_ease-in-out_infinite]'
                      : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedPatient(appointment)}
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${getMobileCardAccent(appointment.status)}`} />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GenderIconAvatar gender={getPatientGender(appointment)} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 leading-tight">{renderHighlighted(getPatientName(appointment), searchTerm)}</div>
                          <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                            {renderHighlighted(patientPhone || 'N/A', searchTerm)}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">{formatAgeGender(appointment)}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">#{appointment.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Date</p>
                        <p className="mt-0.5 font-semibold text-slate-700 truncate">{formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Time</p>
                        <p className="mt-0.5 font-semibold text-slate-700">{appointmentTimeLabel}</p>
                      </div>
                    </div>

                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Schedule Status</p>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <select
                          value={appointment.status}
                          onChange={(e) => updateStatus(appointment.id, e.target.value)}
                          className={`w-full rounded-lg border bg-white px-2.5 py-2 text-xs font-semibold transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 ${getStatusSelectTone(appointment.status)}`}
                        >
                          <option value="in_consultation">In consultation</option>
                          <option value="arrived">Arrived</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="test_registered">Report Submitted</option>
                          <option value="awaiting_tests">Awaiting Report</option>
                          <option value="prescribed">Prescribed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                      {!isCompounder && (
                        !appointment.has_prescription || !appointment.prescription_id ? (
                          <Link
                            href={`/doctor/prescriptions/create?appointment_id=${appointment.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e2f8] bg-white text-[#3556a6] transition hover:bg-[#f3f7ff]"
                            aria-label="Create prescription"
                          >
                            <FilePlus className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300">
                            <FilePlus className="h-4 w-4" />
                          </span>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPatient(appointment)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                        aria-label="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {appointment.has_prescription && appointment.prescription_id ? (
                        <Link
                          href={`/doctor/prescriptions/${appointment.prescription_id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                          aria-label="View prescription"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setSelectedPatient(appointment)}
                        className="ml-auto inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-6 py-4 text-center">SL</th>
                  <th className="px-6 py-4 text-center">Patient</th>
                  <th className="px-6 py-4 text-center">Chamber</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Update Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin text-[#2D3A74]" />
                        <span>Loading appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRows.map((appointment, index) => {
                  const serial = appointment.serial_no ?? appointment.id;
                  const patientPhone = getPatientPhone(appointment);
                  const appointmentTimeLabel = formatDisplayTime12h(appointment.appointment_time) || appointment.appointment_time || 'N/A';

                  const isInConsultation = appointment.status === 'in_consultation';
                  return (
                    <tr
                      key={appointment.id}
                      className={`cursor-pointer transition-colors ${
                        isInConsultation
                          ? 'consultation-active animate-[consultation-bounce_1.8s_ease-in-out_infinite]'
                          : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => setSelectedPatient(appointment)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-600 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-2.5 text-start">
                          <GenderIconAvatar gender={getPatientGender(appointment)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(appointment), searchTerm)}</div>

                            <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              {/* <Phone className="h-3.5 w-3.5 text-slate-400" /> */}
                              {renderHighlighted(patientPhone || 'N/A', searchTerm)}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{formatAgeGender(appointment)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center">
                        {getChamberName(appointment)}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center">
                        <span className="inline-flex flex-col items-center justify-center gap-0.5 leading-tight">
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Calendar className="h-[18px] w-[18px] text-slate-600" />
                            {(formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date)}
                          </span>
                          <span className="text-xs text-slate-500">{appointmentTimeLabel}</span>
                        </span>

                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={appointment.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(appointment.id, e.target.value)}
                          className={`w-[136px] min-w-0 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 ${getStatusSelectTone(appointment.status)}`}
                        >
                          <option value="in_consultation">In consultation</option>
                          <option value="arrived">Arrived</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="test_registered">Report Submitted</option>
                          <option value="awaiting_tests">Awaiting Report</option>
                          <option value="prescribed">Prescribed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isCompounder && (
                            !appointment.has_prescription || !appointment.prescription_id ? (
                              <Link
                                onClick={(e) => e.stopPropagation()}
                                href={`/doctor/prescriptions/create?appointment_id=${appointment.id}`}
                                className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#d8e2f8] bg-white text-[#3556a6] transition hover:bg-[#f3f7ff]"
                                aria-label="Create prescription"
                              >
                                <FilePlus className="h-3.5 w-3.5" />
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                  Create Prescription
                                </span>
                              </Link>
                            ) : (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300">
                                <FilePlus className="h-3.5 w-3.5" />
                              </span>
                            )
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(appointment);
                            }}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Details
                            </span>
                          </button>
                          {appointment.has_prescription && appointment.prescription_id ? (
                            <Link
                              onClick={(e) => e.stopPropagation()}
                              href={`/doctor/prescriptions/${appointment.prescription_id}`}
                              className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                              aria-label="View prescription"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                View Prescription
                              </span>
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && paginatedRows.length === 0 ? (
            <div className="hidden md:block p-5">
              <DocEmptyState
                icon={CalendarCheck2}
                title="No appointments found"
                description="Try another status or keyword."
              />
            </div>
          ) : null}

          {!loading && paginatedRows.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Showing
                {' '}
                <span className="font-semibold text-slate-700">{pageMeta.total === 0 ? 0 : ((safeCurrentPage - 1) * ROWS_PER_PAGE) + 1}</span>
                {' '}
                to
                {' '}
                <span className="font-semibold text-slate-700">{Math.min(safeCurrentPage * ROWS_PER_PAGE, pageMeta.total)}</span>
                {' '}
                of
                {' '}
                <span className="font-semibold text-slate-700">{pageMeta.total}</span>
                {' '}
                appointments
              </p>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>

                {visiblePageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-8 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${page === safeCurrentPage
                      ? 'bg-[#2D3A74] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {showMobileFilters && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[110] flex items-start bg-black/40 backdrop-blur-[1px]" onClick={() => setShowMobileFilters(false)}>
            <div
              className="w-full rounded-b-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D3A74]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, phone, serial or id"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</label>
                    <select
                      value={datePreset}
                      onChange={(e) => setDatePreset(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Chamber</label>
                    <select
                      value={chamberFilter}
                      onChange={(e) => setChamberFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All chambers</option>
                      {chambers.map((chamber) => (
                        <option key={chamber.id} value={String(chamber.id)}>{chamber.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      <DocModal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Appointment Details"
        icon={User}
        size="sm"
        overlayClassName="bg-[rgba(15,23,42,0.46)] backdrop-blur-[4px]"
        panelClassName="max-h-[60vh] border-slate-200/80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)]"
        headerClassName="px-4 py-3"
        bodyClassName="px-4 py-3"
        footerClassName="px-4 py-3"
        footer={
          <>
            {getPatientPhone(selectedPatient) ? (
              <DocButton size="xs" onClick={() => handleCall(getPatientPhone(selectedPatient))}>
                <Phone className="h-4 w-4" /> Call Patient
              </DocButton>
            ) : null}
            <DocButton variant="secondary" size="xs" onClick={() => setSelectedPatient(null)}>Close</DocButton>
            {selectedPatient?.has_prescription && selectedPatient?.prescription_id ? (
              <Link
                href={`/doctor/prescriptions/${selectedPatient.prescription_id}`}
                className="inline-flex items-center rounded-lg bg-[#2D3A74] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243063]"
              >
                Open Prescription
              </Link>
            ) : !isCompounder && selectedPatient?.id ? (
              <Link
                href={`/doctor/prescriptions/create?appointment_id=${selectedPatient.id}`}
                className="inline-flex items-center rounded-lg bg-[#2D3A74] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243063]"
              >
                Create Prescription
              </Link>
            ) : null}
          </>
        }
      >
        {selectedPatient ? (
          <div className="space-y-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-2.5">
              <div className="flex items-center gap-3">
                <GenderIconAvatar gender={getPatientGender(selectedPatient)} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Patient</p>
                  <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">{getPatientName(selectedPatient)}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Appointment #{selectedPatient?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Date</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatDisplayDateWithYearFromDateLike(selectedPatient.appointment_date) || selectedPatient.appointment_date}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Time</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatDisplayTime12h(selectedPatient.appointment_time) || selectedPatient.appointment_time}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Phone</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{getPatientPhone(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Age</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{getPatientAge(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Gender</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatGender(getPatientGender(selectedPatient))}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Status</p>
                <div className="mt-1"><StatusBadge status={selectedPatient.status} /></div>
              </div>
            </div>

            {selectedPatient?.symptoms ? (
              <div className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Symptoms</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-700">{selectedPatient.symptoms}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DocModal>
      {/* Create Appointment Modal */}
      <DocModal
        open={showCreateModal}
        onClose={resetAndClose}
        title="New Appointment"
        icon={CalendarCheck2}
        size="xl"
        panelClassName="min-h-[44rem] max-h-[96vh] max-w-[60rem]"
        footer={
          <>
            <DocButton variant="secondary" size="sm" onClick={resetAndClose}>Cancel</DocButton>
            <DocButton size="sm" onClick={handleCreateAppointment} disabled={apptSubmitting}>
              {apptSubmitting
                ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</span>
                : 'Create Appointment'}
            </DocButton>
          </>
        }
      >
        <div className="space-y-5">
          {/* Patient type tabs */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Patient Type</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'select', label: 'Select Patient', icon: UserCheck },
                { value: 'walkin', label: 'Guest', icon: Plus },
              ].map(({ value, label, icon: ModeIcon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setApptMode(value);
                    setChosenPatient(null);
                    setPatientSearch('');
                    setPatientResults([]);
                    setApptErrors({});
                    setApptForm((prev) => ({ ...prev, patient_name: '', patient_phone: '', patient_age: '', patient_gender: '' }));
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${apptMode === value
                    ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#2D3A74]/30 hover:bg-slate-50'
                    }`}
                >
                  <ModeIcon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Select Patient: searchable dropdown */}
          {apptMode === 'select' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 xl:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search Patient</label>
                <div className="relative" ref={patientDropRef}>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      skipPatientSearchRef.current = false;
                      setPatientSearch(e.target.value);
                      if (chosenPatient) setChosenPatient(null);
                      setShowPatientDrop(true);
                    }}
                    onFocus={() => {
                      if (patientSearch && !chosenPatient) setShowPatientDrop(true);
                    }}
                    placeholder="Search by name or phone…"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-24 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePatientModal(true)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-[#2D3A74]/30 hover:bg-[#2D3A74]/5 hover:text-[#2D3A74]"
                    title="Create patient"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {patientSearching && (
                    <Loader2 className="pointer-events-none absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}

                  {showPatientDrop && !patientSearching && patientSearch.trim() && patientResults.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                      No patients found
                    </div>
                  )}

                  {showPatientDrop && patientResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {patientResults.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                        >
                          <GenderIconAvatar gender={patient.gender} />
                          <div>
                            <p className="font-semibold text-slate-800">{patient.name}</p>
                            <p className="text-xs text-slate-400">
                              {patient.phone || 'No phone'}
                              {patient.age ? ` • ${patient.age}y` : ''}
                              {patient.gender ? ` • ${formatGender(patient.gender)}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {apptErrors.patient && <p className="mt-1 text-xs text-rose-500">{apptErrors.patient}</p>}
              </div>

              <div className="col-span-2 xl:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Chamber <span className="text-rose-400">*</span>
                </label>
                <select
                  value={apptForm.chamber_id}
                  onChange={(e) => {
                    const nextChamberId = e.target.value;
                    setApptForm((prev) => ({ ...prev, chamber_id: nextChamberId, appointment_date: '', appointment_time: '' }));
                    setSelectedDate(null);
                    setPreviewSerial(null);
                    setPreviewTime(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                >
                  <option value="">Select chamber</option>
                  {chambers.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                {apptErrors.chamber_id && <p className="mt-1 text-xs text-rose-500">{apptErrors.chamber_id}</p>}
              </div>

              {chosenPatient && (
                <div className="col-span-2 rounded-xl border border-[#2D3A74]/20 bg-[#2D3A74]/5 p-3">
                  <div className="flex items-center gap-3">
                    <GenderIconAvatar gender={chosenPatient.gender} />
                    <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Name</p>
                        <p className="text-[13px] font-semibold text-slate-800">{chosenPatient.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Phone</p>
                        <p className="text-[13px] font-semibold text-slate-800">{chosenPatient.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Age / Gender</p>
                        <p className="text-[13px] font-semibold text-slate-800">
                          {chosenPatient.age ? `${chosenPatient.age}y` : '—'}
                          {chosenPatient.gender ? ` • ${formatGender(chosenPatient.gender)}` : ''}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Address</p>
                        <p className="text-[13px] font-semibold text-slate-800 break-words">{getPatientAddress(chosenPatient) || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Walk-in: manual fields */}
          {apptMode === 'walkin' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Patient Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={apptForm.patient_name}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
                {apptErrors.patient_name && <p className="mt-1 text-xs text-rose-500">{apptErrors.patient_name}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Phone</label>
                <input
                  type="text"
                  value={apptForm.patient_phone}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_phone: e.target.value }))}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Address</label>
                <input
                  type="text"
                  value={apptForm.patient_address}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_address: e.target.value }))}
                  placeholder="Home address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Age</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={apptForm.patient_age}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_age: e.target.value }))}
                  placeholder="e.g. 30"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                <select
                  value={apptForm.patient_gender}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_gender: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100" />

          {/* Appointment fields */}
          <div className="grid grid-cols-2 gap-3">
            {apptMode !== 'select' && (
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Chamber <span className="text-rose-400">*</span>
                </label>
                <select
                  value={apptForm.chamber_id}
                  onChange={(e) => {
                    const nextChamberId = e.target.value;
                    setApptForm((prev) => ({ ...prev, chamber_id: nextChamberId, appointment_date: '', appointment_time: '' }));
                    setSelectedDate(null);
                    setPreviewSerial(null);
                    setPreviewTime(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                >
                  <option value="">Select chamber</option>
                  {chambers.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                {apptErrors.chamber_id && <p className="mt-1 text-xs text-rose-500">{apptErrors.chamber_id}</p>}
              </div>
            )}
            {apptForm.chamber_id ? (
              <div className="col-span-2 grid gap-3 xl:grid-cols-3 xl:items-start">
                <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#fdfefe_0%,#f5faf9_100%)] p-3.5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] xl:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Available Dates</p>
                      <p className="text-xs text-slate-500">Choose an available date for the selected chamber.</p>
                    </div>
                    {loadingCalendar && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  <div className="doctor-appointment-calendar w-full rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfb_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_rgba(15,23,42,0.05)]">
                    <FullCalendar
                      key={calendarRenderKey}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                      height="auto"
                      showNonCurrentDates={false}
                      fixedWeekCount={false}
                      selectable
                      validRange={{ start: getFirstDayOfCurrentMonth() }}
                      dateClick={handleDateSelect}
                      dayCellDidMount={handleCalendarDayCellDidMount}
                      dayCellClassNames={(arg) => {
                        const dayStr = normalizeCalendarDate(arg);
                        if (isUnavailableDate(dayStr)) return 'fc-unavailable';
                        if (dayStr === today) return 'fc-day-today-custom';
                        if (selectedDate === dayStr) return 'fc-day-selected';
                        return 'fc-day-available';
                      }}
                    />
                  </div>
                  {apptErrors.appointment_date && <p className="mt-2 text-xs text-rose-500">{apptErrors.appointment_date}</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 xl:col-span-1 xl:min-h-[365px]">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Appointment Preview</p>
                      <p className="text-xs text-slate-500">Generated from selected date and chamber.</p>
                    </div>
                    {loadingPreview && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  {!selectedDate ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Select a date first.
                    </div>
                  ) : loadingPreview ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading preview...
                    </div>
                  ) : previewTime ? (
                    <div className="rounded-xl border border-[#2D3A74]/20 bg-[#2D3A74]/8 px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDisplayDateWithYearFromDateLike(selectedDate) || selectedDate}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Serial</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">#{previewSerial}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Time</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDisplayTime12h(previewTime) || previewTime}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      {previewMessage || 'No preview details are available for this selected date.'}
                    </div>
                  )}
                  {apptErrors.appointment_time && <p className="mt-2 text-xs text-rose-500">{apptErrors.appointment_time}</p>}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DocModal>

      <DocModal
        open={showCreatePatientModal}
        onClose={resetCreatePatientModal}
        title="Create Patient"
        description="Add a new patient and use them immediately in the appointment form."
        size="lg"
        footer={(
          <div className="flex w-full items-center justify-end gap-2">
            <DocButton variant="secondary" onClick={resetCreatePatientModal} disabled={patientSubmitting}>Cancel</DocButton>
            <DocButton onClick={handleCreatePatient} disabled={patientSubmitting}>
              {patientSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : 'Create Patient'}
            </DocButton>
          </div>
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Patient Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={patientForm.name}
              onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
            />
            {patientFormErrors.name && <p className="mt-1 text-xs text-rose-500">{patientFormErrors.name}</p>}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Phone <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={patientForm.phone}
              onChange={(e) => setPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
            />
            {patientFormErrors.phone && <p className="mt-1 text-xs text-rose-500">{patientFormErrors.phone}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Age</label>
            <input
              type="number"
              min="0"
              max="150"
              value={patientForm.age}
              onChange={(e) => setPatientForm((prev) => ({ ...prev, age: e.target.value }))}
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
            <select
              value={patientForm.gender}
              onChange={(e) => setPatientForm((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Address</label>
            <input
              type="text"
              value={patientForm.address}
              onChange={(e) => setPatientForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Home address"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
            />
          </div>
        </div>
      </DocModal>

      <style>{`
        .doctor-appointment-calendar .fc-theme-standard td,
        .doctor-appointment-calendar .fc-theme-standard th,
        .doctor-appointment-calendar .fc-scrollgrid,
        .doctor-appointment-calendar .fc-scrollgrid-section > * {
          border: 0;
        }

        .doctor-appointment-calendar .fc-col-header-cell {
          padding-bottom: 10px;
        }

        .doctor-appointment-calendar .fc .fc-daygrid-day-frame {
          padding: 0;
          min-height: 40px;
          display: flex;
          flex-direction: row;
          justify-content: center;
        }

        .doctor-appointment-calendar .fc-daygrid-day-top {
          justify-content: center;
        }

        .doctor-appointment-calendar .fc-daygrid-day-number {
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

        .doctor-appointment-calendar .fc-day-available .fc-daygrid-day-number {
          background: #eef4ff;
          color: #2563eb;
        }

        .doctor-appointment-calendar .fc-day-today-custom .fc-daygrid-day-number,
        .doctor-appointment-calendar .fc-day-selected .fc-daygrid-day-number {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
        }

        .doctor-appointment-calendar .fc .fc-daygrid-day.fc-unavailable {
          background-color: white !important;
        }

        .doctor-appointment-calendar .fc-unavailable .fc-daygrid-day-number {
          background: transparent !important;
          background-image: none !important;
          color: #94a3b8;
          opacity: 1;
          box-shadow: none;
        }

        .doctor-appointment-calendar .fc-day-other .fc-daygrid-day-number {
          opacity: 0.45;
        }

        .doctor-appointment-calendar .fc .fc-daygrid-day.fc-day-selected .fc-daygrid-day-number {
          background: #2563eb !important;
          box-shadow: none !important;
        }

        .doctor-appointment-calendar .fc .fc-highlight {
          background-color: white !important;
          border: none !important;
          box-shadow: none !important;
        }

        @media (max-width: 640px) {
          .doctor-appointment-calendar .fc .fc-toolbar {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (min-width: 640px) {
          .doctor-appointment-calendar .fc-daygrid-day-number {
            font-size: 14px !important;
            padding: 27px !important;
          }
        }
      `}</style>
    </DoctorLayout>
  );
}

