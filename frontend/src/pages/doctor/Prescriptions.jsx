import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Eye,
  FilePlus,
  FileText,
  Hash,
  Loader2,
  Mars,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Stethoscope,
  Upload,
  User,
  Venus,
  X,
} from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import DocModal from '../../components/doctor/DocModal';
import { DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

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

function formatGender(gender) {
  const value = String(gender || '').trim().toLowerCase();

  if (!value) {
    return 'N/A';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPatientName(prescription) {
  return prescription?.patient_name || prescription?.user?.name || `Patient #${prescription?.user_id || ''}`;
}

function getPatientPhone(prescription) {
  return prescription?.patient_contact || prescription?.user?.phone || null;
}

function getPatientGender(prescription) {
  return prescription?.patient_gender || prescription?.user?.gender || '';
}

function getPatientAge(prescription) {
  return prescription?.patient_age || prescription?.user?.age || '';
}

function getNextVisitLabel(prescription) {
  return prescription?.next_visit_date
    ? formatDisplayDateWithYearFromDateLike(prescription.next_visit_date)
    : 'No follow-up';
}

function getEditPrescriptionParam(prescription) {
  return prescription?.id || prescription?.uuid || '';
}

function sanitizePhoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function toLocalPhone11Digits(value) {
  const digits = sanitizePhoneDigits(value);
  const withoutCountryCode = digits.startsWith('88') ? digits.slice(2) : digits;
  return withoutCountryCode.slice(0, 11);
}

function getXsrfCookieToken() {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (cookie) {
    return decodeURIComponent(cookie);
  }

  return '';
}

function getCsrfToken() {
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  if (metaToken) {
    return metaToken;
  }

  return getXsrfCookieToken();
}

export default function DoctorPrescriptions({ prescriptions = [], stats = {} }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);

  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [reportsByPrescription, setReportsByPrescription] = useState({});
  const [reportLoading, setReportLoading] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [reportNote, setReportNote] = useState('');
  const [reportText, setReportText] = useState('');
  const [showReportUploadModal, setShowReportUploadModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messagePhone, setMessagePhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [chosenPatient, setChosenPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
  });
  const [patientFormErrors, setPatientFormErrors] = useState({});
  const [patientSubmitting, setPatientSubmitting] = useState(false);

  const patientDropRef = useRef(null);
  const skipPatientSearchRef = useRef(false);
  const reportEditorRef = useRef(null);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  useEffect(() => {
    if (!showCreateModal || !patientSearch.trim()) {
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
        const res = await fetch(`/api/doctor/patients?search=${encodeURIComponent(patientSearch.trim())}&per_page=10&include_all=1`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const list = Array.isArray(data?.patients) ? data.patients : (data?.patients?.data ?? []);
          setPatientResults(list);
        } else {
          setPatientResults([]);
        }
      } catch {
        setPatientResults([]);
      } finally {
        setPatientSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [patientSearch, showCreateModal]);

  useEffect(() => {
    const handler = (event) => {
      if (patientDropRef.current && !patientDropRef.current.contains(event.target)) {
        setShowPatientDrop(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const id = selectedPrescription?.id;
    if (!id) return;

    const loadReports = async () => {
      setReportLoading(true);
      try {
        const res = await fetch(`/api/doctor/prescriptions/${id}/reports`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toastError(data?.message || 'Failed to load reports.');
          return;
        }
        const list = Array.isArray(data?.reports) ? data.reports : [];
        setReportsByPrescription((prev) => ({ ...prev, [id]: list }));
      } catch {
        toastError('Failed to load reports.');
      } finally {
        setReportLoading(false);
      }
    };

    setReportFile(null);
    setReportNote('');
    setReportText('');
    setShowReportUploadModal(false);
    loadReports();
  }, [selectedPrescription?.id]);

  const todayIso = new Date().toISOString().split('T')[0];

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((prescription) => {
      const createdDateOnly = String(prescription.created_at || '').slice(0, 10);
      const dateOk = dateFilter === 'all' || createdDateOnly === todayIso;

      if (!dateOk) {
        return false;
      }

      const genderValue = String(getPatientGender(prescription) || '').trim().toLowerCase();
      if (genderFilter !== 'all' && genderValue !== genderFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = [
        prescription.id,
        getPatientName(prescription),
        getPatientPhone(prescription),
        prescription.diagnosis,
        prescription.instructions,
        prescription.tests,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [rows, searchTerm, dateFilter, todayIso, genderFilter]);

  const statsView = useMemo(() => ({
    visible: filteredRows.length,
    today: rows.filter((item) => String(item.created_at || '').slice(0, 10) === todayIso).length,
    withFollowUp: stats?.withFollowUp ?? rows.filter((item) => Boolean(item.next_visit_date)).length,
    upcoming: stats?.upcomingFollowUps ?? rows.filter((item) => item.next_visit_date && item.next_visit_date >= todayIso).length,
    withoutFollowUp: stats?.withoutFollowUp ?? rows.filter((item) => !item.next_visit_date).length,
  }), [filteredRows.length, rows, stats, todayIso]);

  const topWidgets = [
    {
      key: 'today',
      label: 'Today Prescriptions',
      value: statsView.today,
      helper: `${statsView.visible} visible after filters`,
      icon: Calendar,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'followup',
      label: 'With Follow-up',
      value: statsView.withFollowUp,
      helper: 'Prescriptions with revisit date',
      icon: FileText,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      key: 'upcoming',
      label: 'Upcoming Visits',
      value: statsView.upcoming,
      helper: 'Follow-up dates from today',
      icon: Stethoscope,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'nofollowup',
      label: 'No Follow-up',
      value: statsView.withoutFollowUp,
      helper: 'Need manual revisit plan',
      icon: FilePlus,
      tone: 'bg-orange-50 text-orange-700',
    },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setGenderFilter('all');
    setShowMobileFilters(false);
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setPatientSearch('');
    setPatientResults([]);
    setShowPatientDrop(false);
    setChosenPatient(null);
  };

  const resetCreatePatientModal = () => {
    setShowCreatePatientModal(false);
    setPatientForm({
      name: '',
      phone: '',
      age: '',
      gender: '',
      address: '',
    });
    setPatientFormErrors({});
  };

  const handleSelectPatient = async (patient) => {
    skipPatientSearchRef.current = true;
    setChosenPatient(patient);
    setPatientSearch(patient?.name || '');
    setPatientResults([]);
    setShowPatientDrop(false);

    if (!patient?.id) {
      return;
    }

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
      // Keep lightweight result if detail request fails.
    }
  };

  const handleCreatePatient = async () => {
    const errors = {};

    if (!patientForm.name.trim()) {
      errors.name = 'Patient name is required.';
    }

    if (!patientForm.phone.trim()) {
      errors.phone = 'Phone is required.';
    }

    if (Object.keys(errors).length > 0) {
      setPatientFormErrors(errors);
      return;
    }

    setPatientSubmitting(true);
    setPatientFormErrors({});

    try {
      const csrfToken = getCsrfToken();
      const xsrfToken = getXsrfCookieToken();
      const res = await fetch('/api/doctor/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
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
          Object.entries(data.errors).forEach(([key, value]) => {
            mapped[key] = Array.isArray(value) ? value[0] : value;
          });
          setPatientFormErrors(mapped);
        } else {
          toastError(data?.message || 'Failed to create patient.');
        }
        return;
      }

      const patient = data?.patient || null;
      if (patient) {
        setChosenPatient(patient);
        setPatientSearch(patient.name || '');
        skipPatientSearchRef.current = true;
      }

      toastSuccess(data?.message || 'Patient created successfully.');
      resetCreatePatientModal();
    } catch {
      toastError('Failed to create patient.');
    } finally {
      setPatientSubmitting(false);
    }
  };

  const handleContinueToPrescription = () => {
    if (!chosenPatient?.id) {
      toastError('Select or create a patient first.');
      return;
    }

    router.visit(`/doctor/prescriptions/create?patient_id=${chosenPatient.id}`);
  };

  const handlePrintPrescription = (prescription) => {
    const routeParam = prescription?.uuid || prescription?.id;
    const printWindow = window.open(`/doctor/prescriptions/${routeParam}?action=print`, '_blank');

    if (printWindow) {
      toastSuccess('Opening prescription for printing...');
      return;
    }

    toastError('Unable to open the print view right now.');
  };

  const openMessageModal = (prescription) => {
    const routeParam = prescription?.uuid || prescription?.id;
    const patientName = getPatientName(prescription);
    const prescriptionUrl = routeParam ? `${window.location.origin}/prescription/${routeParam}` : '';
    const defaultMessage = `Dear Mr. ${patientName},\n\nYour prescription has been successfully prepared by the doctor.\nPlease review it at your convenience using the link below:\n\n${prescriptionUrl}\n\nIf you have any questions or need further assistance, feel free to reach out.\n\nThank you.`;

    setMessageTarget(prescription);
    setMessagePhone(toLocalPhone11Digits(getPatientPhone(prescription) || ''));
    setMessageText(defaultMessage);
    setShowMessageModal(true);
  };

  const handleSaveMessage = async () => {
    const routeParam = messageTarget?.uuid || messageTarget?.id;
    if (!routeParam || sendingMessage) return;

    const normalizedPhone = toLocalPhone11Digits(messagePhone);

    if (!normalizedPhone) {
      toastError('Phone is required.');
      return;
    }

    if (!/^\d{11}$/.test(normalizedPhone)) {
      toastError('Phone must be exactly 11 digits.');
      return;
    }

    if (!String(messageText || '').trim()) {
      toastError('Message is required.');
      return;
    }

    setSendingMessage(true);
    try {
      const csrfToken = getCsrfToken();
      const xsrfToken = getXsrfCookieToken();
      const res = await fetch(`/api/doctor/prescriptions/${routeParam}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          phone: `+88${normalizedPhone}`,
          message: messageText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(data?.message || 'Failed to save message.');
        return;
      }

      toastSuccess(data?.message || 'Message saved successfully.');
      setMessagePhone('');
      setMessageText('');
      setShowMessageModal(false);
      setMessageTarget(null);
    } catch {
      toastError('Failed to save message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatFileSize = (value) => {
    const size = Number(value || 0);
    if (!size || Number.isNaN(size)) return 'N/A';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadReport = async () => {
    const prescriptionId = selectedPrescription?.id;
    if (!prescriptionId || uploadingReport) return;

    const trimmedText = reportText.trim();
    if (!reportFile && !trimmedText) {
      toastError('Add a report file or write a text report.');
      return;
    }

    setUploadingReport(true);
    try {
      const csrfToken = getCsrfToken();
      const xsrfToken = getXsrfCookieToken();
      const formData = new FormData();
      if (reportFile) {
        formData.append('report_file', reportFile);
      }
      if (trimmedText) {
        formData.append('report_text', trimmedText);
      }
      if (reportNote.trim()) {
        formData.append('note', reportNote.trim());
      }

      const res = await fetch(`/api/doctor/prescriptions/${prescriptionId}/reports`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
        credentials: 'same-origin',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(data?.message || 'Failed to upload report.');
        return;
      }

      const created = data?.report;
      if (created) {
        setReportsByPrescription((prev) => {
          const list = Array.isArray(prev[prescriptionId]) ? prev[prescriptionId] : [];
          return { ...prev, [prescriptionId]: [created, ...list] };
        });
      }
      setReportFile(null);
      setReportNote('');
      setReportText('');
      setShowReportUploadModal(false);
      toastSuccess(data?.message || 'Report uploaded successfully.');
      router.visit('/doctor/appointments');
    } catch {
      toastError('Failed to upload report.');
    } finally {
      setUploadingReport(false);
    }
  };

  const applyReportFormat = (command) => {
    try {
      document.execCommand(command, false);
      reportEditorRef.current?.focus();
    } catch {
      // no-op fallback
    }
  };

  return (
    <DoctorLayout title="Prescriptions" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="mb-4 space-y-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#2D3A74]">Prescriptions</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {statsView.visible}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Track completed prescriptions, follow-up dates, and start a new prescription from one place.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                New Prescription
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {topWidgets.map((widget) => {
              const Icon = widget.icon;

              return (
                <div key={widget.key} className="surface-card rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-sm text-slate-500">{widget.label}</p>
                      <p className="text-3xl font-semibold text-[#2D3A74]">{widget.value}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${widget.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">{widget.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="hidden md:grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,360px)_180px_180px] lg:items-end">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Patient, phone, diagnosis or id"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      />
                    </div>
                  </div>

                  <div className="sm:max-w-[190px] lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Created date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
                    </select>
                  </div>

                  <div className="sm:max-w-[190px] lg:w-[180px]">
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

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-3 border-t border-slate-100 bg-slate-50/70 p-3">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <DocEmptyState icon={FileText} title="No prescriptions found" description="Try another filter or search keyword." />
              </div>
            ) : filteredRows.map((prescription, index) => {
              const serial = ((pagination?.current_page || 1) - 1) * (pagination?.per_page || 10) + index + 1;
              return (
                <div
                  key={prescription.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 cursor-pointer active:bg-slate-50"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <GenderIconAvatar gender={getPatientGender(prescription)} />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{renderHighlighted(getPatientName(prescription), searchTerm)}</div>
                        <div className="text-xs text-slate-500">
                          {getPatientAge(prescription) ? `${getPatientAge(prescription)}y` : 'Age N/A'}
                          {getPatientPhone(prescription) ? ` · ${getPatientPhone(prescription)}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-slate-400 text-right">
                      <div className="font-medium text-slate-500">#{serial}</div>
                      <div>{formatDisplayDateWithYearFromDateLike(prescription.created_at) || prescription.created_at}</div>
                    </div>
                  </div>
                  {prescription.diagnosis && (
                    <div className="text-xs text-slate-600 line-clamp-2">{prescription.diagnosis}</div>
                  )}
                  <div className="text-xs text-slate-400">
                    Follow-up: {getNextVisitLabel(prescription)}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedPrescription(prescription)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                      aria-label="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={`/prescription/${prescription.uuid || prescription.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      aria-label="Open prescription"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                    <Link
                      href={`/doctor/prescriptions/${getEditPrescriptionParam(prescription)}/edit`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      aria-label="Edit prescription"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {/* <button
                      type="button"
                      onClick={() => handlePrintPrescription(prescription)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      aria-label="Print"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-6 py-4 text-center">Patient</th>
                  {/* <th className="px-6 py-4 text-center">Phone</th> */}
                  <th className="px-6 py-4 text-center">Diagnosis</th>
                  {/* <th className="px-6 py-4 text-center">Follow-up</th> */}
                  <th className="px-6 py-4 text-center">Prescribed at</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((prescription, index) => {
                  const serial = ((pagination?.current_page || 1) - 1) * (pagination?.per_page || 10) + index + 1;

                  return (
                    <tr
                      key={prescription.id}
                      className="cursor-pointer hover:bg-slate-50/80"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <td className="px-6 py-4 text-center font-medium text-slate-600">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-2.5 text-start">
                          <GenderIconAvatar gender={getPatientGender(prescription)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(prescription), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">  {renderHighlighted(getPatientPhone(prescription) || 'N/A', searchTerm)}</div>

                            <div className="mt-0.5 text-xs font-medium text-slate-500">{getPatientAge(prescription) ? `${getPatientAge(prescription)}y` : 'Age N/A'}</div>
                          </div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(getPatientPhone(prescription) || 'N/A', searchTerm)}
                        </span>
                      </td> */}
                      <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        <div className="mx-auto max-w-[220px] truncate" title={prescription.diagnosis || 'N/A'}>
                          {renderHighlighted(prescription.diagnosis || 'N/A', searchTerm)}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        {getNextVisitLabel(prescription)}
                      </td> */}
                      <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        <div className="inline-flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDisplayDateWithYearFromDateLike(prescription.created_at) || prescription.created_at}
                          </span>
                         
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* <button
                            type="button"
                            onClick={() => setSelectedPrescription(prescription)}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Details
                            </span>
                          </button> */}

                          <a
                            href={`/prescription/${prescription.uuid || prescription.id}`}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                            aria-label="Open prescription"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Open Prescription
                            </span>
                          </a>

                          <Link
                            href={`/doctor/prescriptions/${getEditPrescriptionParam(prescription)}/edit`}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800"
                            aria-label="Edit prescription"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Edit Prescription
                            </span>
                          </Link>

                          {/* <button
                            type="button"
                            onClick={() => handlePrintPrescription(prescription)}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800"
                            aria-label="Print prescription"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Print
                            </span>
                          </button> */}

                          <button
                            type="button"
                            onClick={() => openMessageModal(prescription)}
                            className="group relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-violet-200 bg-violet-50 text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800"
                            aria-label="Message patient"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Message Patient
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <div className="hidden md:block p-5">
              <DocEmptyState
                icon={FileText}
                title="No prescriptions found"
                description="Try another filter or search keyword."
              />
            </div>
          ) : null}

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> row(s) on this page
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const prev = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('previous'));
                  const next = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('next'));

                  return (
                    <>
                      {prev?.url ? (
                        <Link href={prev.url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">Previous</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Previous</span>
                      )}
                      {next?.url ? (
                        <Link href={next.url} className="rounded-lg bg-[#2D3A74] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#243063]">Next</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Next</span>
                      )}
                    </>
                  );
                })()}
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
                      placeholder="Patient, phone, diagnosis or id"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Created date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
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
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      <DocModal
        open={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        icon={User}
        size="sm"
        overlayClassName="bg-[rgba(15,23,42,0.46)] backdrop-blur-[4px]"
        panelClassName="max-h-[60vh] border-slate-200/80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)]"
        headerClassName="px-4 py-3"
        bodyClassName="px-4 py-3"
        footerClassName="px-4 py-3"
        footer={
          selectedPrescription ? (
            <>
              <button
                type="button"
                onClick={() => handlePrintPrescription(selectedPrescription)}
                className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={`/prescription/${selectedPrescription.uuid || selectedPrescription.id}`}
                className="inline-flex items-center rounded-lg bg-[#2D3A74] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243063]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Prescription
              </a>
            </>
          ) : null
        }
      >
        {selectedPrescription ? (
          <div className="space-y-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-2.5">
              <div className="flex items-center gap-3">
                <GenderIconAvatar gender={getPatientGender(selectedPrescription)} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Patient</p>
                  <h3 className="text-[15px] font-semibold leading-tight text-slate-900">{getPatientName(selectedPrescription)}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Prescription #{selectedPrescription?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Phone</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-slate-800">{getPatientPhone(selectedPrescription) || 'N/A'}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Age / Gender</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-slate-800">
                  {getPatientAge(selectedPrescription) ? `${getPatientAge(selectedPrescription)}y` : 'N/A'}
                  {' • '}
                  {formatGender(getPatientGender(selectedPrescription))}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Created</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-slate-800">{formatDisplayDateWithYearFromDateLike(selectedPrescription.created_at) || selectedPrescription.created_at}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Follow-up</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-slate-800">{getNextVisitLabel(selectedPrescription)}</p>
              </div>
            </div>

            {selectedPrescription?.diagnosis ? (
              <div className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Diagnosis</p>
                <p className="mt-0.5 line-clamp-3 text-[13px] text-slate-700">{selectedPrescription.diagnosis}</p>
              </div>
            ) : null}

            {selectedPrescription?.tests ? (
              <div className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Tests</p>
                <p className="mt-0.5 line-clamp-3 text-[13px] text-slate-700">{selectedPrescription.tests}</p>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Test Reports</p>
                {reportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowReportUploadModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D3A74]/20 bg-[#2D3A74]/5 px-3 py-1.5 text-xs font-semibold text-[#2D3A74] transition hover:bg-[#2D3A74]/10"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Test Report
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {((reportsByPrescription[selectedPrescription.id] || []).length === 0 && !reportLoading) ? (
                  <p className="text-xs text-slate-500">No reports uploaded yet.</p>
                ) : null}
                {(reportsByPrescription[selectedPrescription.id] || []).map((report) => (
                  <a
                    key={report.id}
                    href={report.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-800">{report.note || report.original_name}</div>
                      <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${String(report.mime_type || '').startsWith('text/') ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                        {String(report.mime_type || '').startsWith('text/') ? 'Text Report' : 'File Report'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {formatFileSize(report.file_size)}
                      {' · '}
                      {formatDisplayDateWithYearFromDateLike(report.created_at) || report.created_at}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DocModal>

      <DocModal
        open={showMessageModal && !!messageTarget}
        onClose={() => {
          setShowMessageModal(false);
          setMessageTarget(null);
        }}
        title="Message Patient"
        icon={MessageSquare}
        size="md"
        footer={(
          <>
            <button
              type="button"
              onClick={() => {
                setShowMessageModal(false);
                setMessageTarget(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveMessage}
              disabled={sendingMessage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D3A74] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
            >
              {sendingMessage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              {sendingMessage ? 'Saving...' : 'Save Message'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Phone</label>
            <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
             
              <input
                type="text"
                inputMode="numeric"
                value={messagePhone}
                onChange={(e) => setMessagePhone(toLocalPhone11Digits(e.target.value))}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Only 11 digits are allowed. `-` and spaces are removed automatically.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Message</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              placeholder="Write a message for the patient"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </div>
        </div>
      </DocModal>

      <DocModal
        open={showReportUploadModal && !!selectedPrescription}
        onClose={() => setShowReportUploadModal(false)}
        title="Upload Test Report"
        icon={Upload}
        size="lg"
        containerClassName="z-[120] items-start pt-6 sm:items-start sm:pt-10"
        overlayClassName="bg-[rgba(2,6,23,0.78)] backdrop-blur-sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowReportUploadModal(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadReport}
              disabled={uploadingReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D3A74] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
            >
              {uploadingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploadingReport ? 'Uploading...' : 'Upload'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <input
            type="text"
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Report title or note"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Text Report Editor</label>
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5">
                <button type="button" onClick={() => applyReportFormat('bold')} className="rounded border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-50">B</button>
                <button type="button" onClick={() => applyReportFormat('italic')} className="rounded border border-slate-200 px-2 py-0.5 text-xs italic text-slate-700 hover:bg-slate-50">I</button>
                <button type="button" onClick={() => applyReportFormat('underline')} className="rounded border border-slate-200 px-2 py-0.5 text-xs underline text-slate-700 hover:bg-slate-50">U</button>
                <button type="button" onClick={() => applyReportFormat('insertUnorderedList')} className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50">• List</button>
                <button type="button" onClick={() => applyReportFormat('insertOrderedList')} className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50">1. List</button>
              </div>
              <div
                ref={reportEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setReportText(e.currentTarget.innerHTML)}
                className="min-h-[150px] px-3 py-2 text-sm text-slate-800 focus:outline-none"
                dangerouslySetInnerHTML={{ __html: reportText || '' }}
                data-placeholder="Write detailed report using rich text editor..."
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">You can upload a file, write a text report, or both.</p>
        </div>
      </DocModal>

      <DocModal
        open={showCreateModal}
        onClose={resetCreateModal}
        title="New Prescription"
        icon={FilePlus}
        size="xl"
        panelClassName="min-h-[44rem] max-h-none max-w-[60rem] overflow-visible"
        bodyClassName="h-auto overflow-visible px-6 py-6"
        footer={(
          <>
            <button
              type="button"
              onClick={resetCreateModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinueToPrescription}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
            >
              Continue
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Patient</p>
            <p className="text-sm text-slate-500">Select an existing patient or create a new one, then continue to the prescription editor.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search Patient</label>
            <div className="relative" ref={patientDropRef}>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  skipPatientSearchRef.current = false;
                  setPatientSearch(e.target.value);
                  if (chosenPatient) {
                    setChosenPatient(null);
                  }
                  setShowPatientDrop(true);
                }}
                onFocus={() => {
                  if (patientSearch && !chosenPatient) {
                    setShowPatientDrop(true);
                  }
                }}
                placeholder="Search by name or phone..."
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
              {patientSearching ? (
                <Loader2 className="pointer-events-none absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
              ) : null}

              {showPatientDrop && !patientSearching && patientSearch.trim() && patientResults.length === 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 shadow-xl">
                  No patients found
                </div>
              ) : null}

              {showPatientDrop && patientResults.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  {patientResults.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="mb-2 grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm transition last:mb-0 hover:border-[#d7dfec] hover:bg-slate-50"
                    >
                      <div className="pt-0.5">
                        <GenderIconAvatar gender={patient.gender} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-semibold text-slate-800">{patient.name}</p>
                          <span className="text-xs text-slate-500">
                            {patient.age ? `${patient.age}y` : 'Age N/A'}
                            {' • '}
                            {patient.gender ? formatGender(patient.gender) : 'N/A'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {patient.phone || 'No phone'}
                          </span>
                          {patient.address ? (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="truncate">{patient.address}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {chosenPatient ? (
              <div className="mt-4 rounded-2xl border border-[#2D3A74]/20 bg-[#2D3A74]/5 p-4">
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
                      <p className="break-words text-[13px] font-semibold text-slate-800">{chosenPatient.address || '—'}</p>
                    </div>
                  </div>
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
        description="Add a new patient and continue directly to the prescription page."
        size="md"
        footer={(
          <div className="flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetCreatePatientModal}
              disabled={patientSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePatient}
              disabled={patientSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
            >
              {patientSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Patient
            </button>
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
            {patientFormErrors.name ? <p className="mt-1 text-xs text-rose-500">{patientFormErrors.name}</p> : null}
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
            {patientFormErrors.phone ? <p className="mt-1 text-xs text-rose-500">{patientFormErrors.phone}</p> : null}
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
    </DoctorLayout>
  );
}
