import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarCheck2, Clock3, Eye, FilePlus, FileText, Hash, Loader2, Mars, Phone, Plus, Search, SlidersHorizontal, User, UserCheck, UserPlus, Venus, X } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import StatusBadge from '../../components/doctor/StatusBadge';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'in_consultation', label: 'In consultation' },
  { value: 'awaiting_tests', label: 'Awaiting tests' },
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
    awaiting_tests: 'border-orange-200 bg-white text-orange-700',
    prescribed: 'border-emerald-200 bg-white text-emerald-700',
    cancelled: 'border-rose-200 bg-white text-rose-700',
  };

  return tones[value] || tones.scheduled;
}

function getStatusSummaryTone(status) {
  const value = String(status || '').toLowerCase();

  const tones = {
    today: 'border-[#CBD5E1] bg-slate-50 text-slate-700',
    scheduled: 'border-slate-200 bg-slate-50 text-slate-700',
    arrived: 'border-amber-200 bg-amber-50 text-amber-700',
    in_consultation: 'border-violet-200 bg-violet-50 text-violet-700',
    awaiting_tests: 'border-orange-200 bg-orange-50 text-orange-700',
    prescribed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return tones[value] || tones.scheduled;
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
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('all'); // all | today | week | month | custom
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [chamberFilter, setChamberFilter] = useState('all');
  const [chambers, setChambers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Create appointment modal states
  const defaultApptForm = () => ({
    patient_name: '',
    patient_phone: '',
    patient_address: '',
    patient_age: '',
    patient_gender: '',
    chamber_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: new Date().toTimeString().slice(0, 5),
    symptoms: '',
    status: 'scheduled',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [apptMode, setApptMode] = useState('select'); // select | walkin | new
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [chosenPatient, setChosenPatient] = useState(null);
  const [apptForm, setApptForm] = useState(defaultApptForm);
  const [apptErrors, setApptErrors] = useState({});
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const patientDropRef = useRef(null);

  const buildParams = () => ({ per_page: 200 });

  const fetchAppointments = async (params = {}) => {
    setLoading(true);
    const query = new URLSearchParams({ per_page: 200, ...params }).toString();
    try {
      const res = await fetch(`/api/doctor/appointments?${query}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.appointments) ? data.appointments : (data.appointments?.data ?? []);
        setRows(items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(buildParams());
    // Fetch doctor's chambers once
    fetch('/api/doctor/chambers', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : { chambers: [] })
      .then((data) => setChambers(Array.isArray(data.chambers) ? data.chambers : []));
  }, []);

  // Patient search for create modal
  useEffect(() => {
    if (apptMode !== 'select' || !patientSearch.trim()) {
      setPatientResults([]);
      return;
    }
    setPatientSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/doctor/patients?search=${encodeURIComponent(patientSearch)}&per_page=10`, {
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

  const getPatientName = (appointment) => appointment?.patient_name || appointment?.user?.name || `Patient #${appointment?.user_id || ''}`;
  const getPatientPhone = (appointment) => appointment?.patient_phone || appointment?.user?.phone || null;
  const getPatientAge = (appointment) => appointment?.patient_age || appointment?.user?.age || '';
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
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
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
  };

  const handleCreateAppointment = async () => {
    setApptErrors({});
    const errors = {};

    if (apptMode === 'select' && !chosenPatient) {
      errors.patient = 'Please select a patient.';
    }
    if ((apptMode === 'walkin' || apptMode === 'new') && !apptForm.patient_name.trim()) {
      errors.patient_name = 'Patient name is required.';
    }
    if (!apptForm.appointment_date) errors.appointment_date = 'Date is required.';
    if (!apptForm.appointment_time) errors.appointment_time = 'Time is required.';

    if (Object.keys(errors).length > 0) {
      setApptErrors(errors);
      return;
    }

    setApptSubmitting(true);
    try {
      const modeMap = { select: 'select_patient', walkin: 'walkin', new: 'new_patient' };
      const payload = {
        mode:             modeMap[apptMode],
        user_id:          apptMode === 'select' ? chosenPatient.id : undefined,
        name:             apptMode === 'select' ? chosenPatient?.name : apptForm.patient_name,
        phone:            apptMode === 'select' ? chosenPatient?.phone || undefined : apptForm.patient_phone || undefined,
        address:          apptForm.patient_address || undefined,
        age:              apptMode !== 'select' && apptForm.patient_age ? Number(apptForm.patient_age) : undefined,
        gender:           apptMode !== 'select' && apptForm.patient_gender ? apptForm.patient_gender : undefined,
        chamber_id:       apptForm.chamber_id ? Number(apptForm.chamber_id) : undefined,
        appointment_date: apptForm.appointment_date,
        appointment_time: apptForm.appointment_time,
        symptoms:         apptForm.symptoms || undefined,
        status:           apptForm.status,
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
        fetchAppointments(buildParams());
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

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const now = new Date();

    const inDateRange = (appointmentDate) => {
      if (!appointmentDate) return false;
      const dateOnly = String(appointmentDate).slice(0, 10);

      if (datePreset === 'all') return true;
      if (datePreset === 'custom') {
        if (dateFrom && dateOnly < dateFrom) return false;
        if (dateTo && dateOnly > dateTo) return false;
        return true;
      }

      if (datePreset === 'today') {
        return dateOnly === now.toISOString().slice(0, 10);
      }

      const targetDate = new Date(dateOnly);
      if (Number.isNaN(targetDate.getTime())) return false;

      if (datePreset === 'week') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return targetDate >= startOfWeek && targetDate <= endOfWeek;
      }

      if (datePreset === 'month') {
        return targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth();
      }

      return true;
    };

    return rows.filter((appointment) => {
      const statusOk = statusFilter === 'all' || appointment.status === statusFilter;
      if (!statusOk) {
        return false;
      }

      if (!inDateRange(appointment.appointment_date)) {
        return false;
      }

      const genderValue = String(getPatientGender(appointment) || '').trim().toLowerCase();
      const genderOk = genderFilter === 'all' || genderValue === genderFilter;
      if (!genderOk) {
        return false;
      }

      const ageRaw = Number(getPatientAge(appointment));
      const hasAge = Number.isFinite(ageRaw) && ageRaw > 0;

      if (ageMin !== '' && (!hasAge || ageRaw < Number(ageMin))) {
        return false;
      }

      if (ageMax !== '' && (!hasAge || ageRaw > Number(ageMax))) {
        return false;
      }

      if (chamberFilter !== 'all') {
        const apptChamberId = appointment.chamber?.id ? String(appointment.chamber.id) : null;
        if (apptChamberId !== chamberFilter) return false;
      }

      if (!needle) {
        return true;
      }

      const name = getPatientName(appointment).toLowerCase();
      const phone = (getPatientPhone(appointment) || '').toLowerCase();
      const appointmentId = String(appointment.id || '').toLowerCase();
      const serial = String(appointment.serial_no || '').toLowerCase();

      return (
        name.includes(needle)
        || phone.includes(needle)
        || appointmentId.includes(needle)
        || serial.includes(needle)
      );
    });
  }, [rows, statusFilter, searchTerm, datePreset, dateFrom, dateTo, genderFilter, ageMin, ageMax, chamberFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, datePreset, dateFrom, dateTo, genderFilter, ageMin, ageMax, chamberFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return filteredRows.slice(start, end);
  }, [filteredRows, safeCurrentPage, ROWS_PER_PAGE]);

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

  const today = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => ({
    total: rows.length,
    today: rows.filter((item) => item.appointment_date === today).length,
    inProgress: rows.filter((item) => item.status === 'in_consultation').length,
    completed: rows.filter((item) => item.status === 'prescribed').length,
    visible: filteredRows.length,
  }), [rows, today, filteredRows.length]);

  const statusCountItems = useMemo(() => (
    STATUS_OPTIONS
      .filter((option) => option.value !== 'all')
      .map((option) => ({
        key: option.value,
        label: option.label,
        count: rows.filter((item) => item.status === option.value).length,
      }))
  ), [rows]);

  return (
    <DoctorLayout title="Appointments" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#2D3A74]">Appointments</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {stats.visible}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                <div className={`rounded-xl border px-2.5 py-1.5 ${getStatusSummaryTone('today')}`}>
                  Today: <span className="font-semibold">{stats.today}</span>
                </div>
                {statusCountItems.map((statusItem) => (
                  <div
                    key={statusItem.key}
                    className={`rounded-xl border px-2.5 py-1.5 ${getStatusSummaryTone(statusItem.key)}`}
                  >
                    {statusItem.label}: <span className="font-semibold">{statusItem.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,360px)_180px_180px] lg:items-end">
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

                  <div className="sm:max-w-[190px] lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</label>
                    <select
                      value={datePreset}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDatePreset(value);
                        if (value !== 'custom') {
                          setDateFrom('');
                          setDateTo('');
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </div>

                  {chambers.length > 0 && (
                    <div className="sm:max-w-[190px] lg:w-[180px]">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Chamber</label>
                      <select
                        value={chamberFilter}
                        onChange={(e) => setChamberFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      >
                        <option value="all">All chambers</option>
                        {chambers.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Plus className="h-4 w-4" />
                    New Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showFilters ? 'Hide Filters' : 'Filters'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-end">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setGenderFilter(option.value)}
                            className={`min-w-20 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                              genderFilter === option.value
                                ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Age Range</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={ageMin}
                          onChange={(e) => setAgeMin(e.target.value)}
                          placeholder="Min"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          min="0"
                          value={ageMax}
                          onChange={(e) => setAgeMax(e.target.value)}
                          placeholder="Max"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="rounded-xl bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
                    >
                      Apply Filters
                    </button>
                  </div>

                  {datePreset === 'custom' && (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                        <input
                          type="date"
                          value={dateTo}
                          min={dateFrom || undefined}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        />
                      </div>
                      {(dateFrom || dateTo) && (
                        <button
                          type="button"
                          onClick={() => { setDateFrom(''); setDateTo(''); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-500 hover:border-rose-200 hover:text-rose-500 transition"
                        >
                          <X className="h-3.5 w-3.5" /> Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-6 py-4 text-center">Patient</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Time</th>
                  <th className="px-6 py-4 text-center">Update Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedRows.map((appointment, index) => {
                  const serial = appointment.id;
                  const patientPhone = getPatientPhone(appointment);

                  return (
                    <tr key={appointment.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => setSelectedPatient(appointment)}>
                      <td className="px-6 py-4 font-medium text-slate-600 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2.5 text-center">
                          <GenderIconAvatar gender={getPatientGender(appointment)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(appointment), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{formatAgeGender(appointment)}</div>
                            <div className="mt-1 text-[12px] font-medium text-slate-500">
                              <span className="inline-flex items-center justify-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {renderHighlighted(patientPhone || 'N/A', searchTerm)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Calendar className="h-[18px] w-[18px] text-slate-600" />
                          {formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Clock3 className="h-4 w-4 text-slate-500" />
                          {formatDisplayTime12h(appointment.appointment_time) || appointment.appointment_time}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={appointment.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(appointment.id, e.target.value)}
                          className={`w-[136px] min-w-0 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 ${getStatusSelectTone(appointment.status)}`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="arrived">Arrived</option>
                          <option value="in_consultation">In consultation</option>
                          <option value="awaiting_tests">Awaiting tests</option>
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

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading appointments…</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-5">
              <DocEmptyState
                icon={CalendarCheck2}
                title="No appointments found"
                description="Try another status or keyword."
              />
            </div>
          ) : null}

          {!loading && filteredRows.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Showing
                {' '}
                <span className="font-semibold text-slate-700">{(safeCurrentPage - 1) * ROWS_PER_PAGE + 1}</span>
                {' '}
                to
                {' '}
                <span className="font-semibold text-slate-700">{Math.min(safeCurrentPage * ROWS_PER_PAGE, filteredRows.length)}</span>
                {' '}
                of
                {' '}
                <span className="font-semibold text-slate-700">{filteredRows.length}</span>
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
                    className={`min-w-8 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
                      page === safeCurrentPage
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
        size="lg"
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'select', label: 'Select Patient', icon: UserCheck },
                { value: 'walkin', label: 'Walk-in', icon: User },
                { value: 'new', label: 'New Patient', icon: UserPlus },
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
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    apptMode === value
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
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search Patient</label>
              <div className="relative" ref={patientDropRef}>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (chosenPatient) setChosenPatient(null);
                    setShowPatientDrop(true);
                  }}
                  onFocus={() => { if (patientSearch) setShowPatientDrop(true); }}
                  placeholder="Search by name or phone…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
                {patientSearching && (
                  <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
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
                        onClick={() => {
                          setChosenPatient(patient);
                          setPatientSearch(patient.name);
                          setShowPatientDrop(false);
                        }}
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

              {/* Address for select mode */}
              <div className="mt-3">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Address</label>
                <input
                  type="text"
                  value={apptForm.patient_address}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, patient_address: e.target.value }))}
                  placeholder="Patient's home address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
              </div>

              {/* Selected patient info card */}
              {chosenPatient && (
                <div className="mt-3 rounded-xl border border-[#2D3A74]/20 bg-[#2D3A74]/5 p-3">
                  <div className="flex items-center gap-3">
                    <GenderIconAvatar gender={chosenPatient.gender} />
                    <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-1">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Walk-in / New Patient: manual fields */}
          {(apptMode === 'walkin' || apptMode === 'new') && (
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
              {apptMode === 'new' && apptForm.patient_phone.trim() && (
                <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                  <p className="mb-1 font-semibold">Auto-generated login credentials:</p>
                  <p>Username: <span className="font-mono font-bold">{apptForm.patient_phone.trim()}</span></p>
                  <p>Password: <span className="font-mono font-bold">{apptForm.patient_phone.trim()}</span></p>
                </div>
              )}
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
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={apptForm.appointment_date}
                onChange={(e) => setApptForm((prev) => ({ ...prev, appointment_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
              />
              {apptErrors.appointment_date && <p className="mt-1 text-xs text-rose-500">{apptErrors.appointment_date}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                value={apptForm.appointment_time}
                onChange={(e) => setApptForm((prev) => ({ ...prev, appointment_time: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
              />
              {apptErrors.appointment_time && <p className="mt-1 text-xs text-rose-500">{apptErrors.appointment_time}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
              <select
                value={apptForm.status}
                onChange={(e) => setApptForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
              >
                <option value="scheduled">Scheduled</option>
                <option value="arrived">Arrived</option>
                <option value="in_consultation">In consultation</option>
                <option value="awaiting_tests">Awaiting tests</option>
                <option value="prescribed">Prescribed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Symptoms</label>
              <input
                type="text"
                value={apptForm.symptoms}
                onChange={(e) => setApptForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Chief complaints…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
              />
            </div>
            {chambers.length > 0 && (
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Chamber</label>
                <select
                  value={apptForm.chamber_id}
                  onChange={(e) => setApptForm((prev) => ({ ...prev, chamber_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                >
                  <option value="">No specific chamber</option>
                  {chambers.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </DocModal>
    </DoctorLayout>
  );
}
