import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Calendar, CheckCircle2, ClipboardList, Eye, FileText, FilePlus, FlaskConical, Hash, Loader2, MapPin, Mars, Phone, Plus, Printer, RotateCcw, Save, Search, SlidersHorizontal, Stethoscope, User, Venus } from 'lucide-react';
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

function getPrescriptionSummaryTone(key) {
  const tones = {
    today: 'border-[#CBD5E1] bg-slate-50 text-slate-700',
    withFollowUp: 'border-violet-200 bg-violet-50 text-violet-700',
    upcoming: 'border-sky-200 bg-sky-50 text-sky-700',
    withoutFollowUp: 'border-orange-200 bg-orange-50 text-orange-700',
  };

  return tones[key] || tones.today;
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

const COMMON_TESTS = [
  'CBC', 'ESR', 'CRP', 'RBS', 'HbA1c', 'Serum Creatinine',
  'LFT', 'Lipid Profile', 'Urine R/E', 'ECG', 'X-ray', 'USG',
];
const emptyComplaint = () => ({ description: '', duration: '' });
const emptyMedicine = () => ({ name: '', strength: '', dosage: '', duration: '', instruction: 'After meal' });
const todayYmd = () => new Date().toISOString().split('T')[0];

const initialRxState = {
  patient: { name: '', age_value: '', age_unit: 'years', gender: '', weight: '', contact: '' },
  visit: { date: todayYmd(), type: 'New' },
  complaints: [emptyComplaint()],
  exam: { bp: '', pulse: '', temperature: '', spo2: '' },
  diagnosis: { provisional: '', final: '' },
  medicines: [],
  investigations: { common: Object.fromEntries(COMMON_TESTS.map((t) => [t, false])), custom: [''] },
  advice: { lifestyle: '', diet_rest: '' },
  follow_up: { date: '' },
};

function rxReducer(state, action) {
  switch (action.type) {
    case 'setField': {
      const [section, key] = action.path;
      return { ...state, [section]: { ...state[section], [key]: action.value } };
    }
    case 'addArrayItem': {
      const arr = Array.isArray(state[action.section]) ? state[action.section] : [];
      return { ...state, [action.section]: [...arr, action.item] };
    }
    case 'setArrayItem': {
      const [section] = action.path;
      const arr = Array.isArray(state[section]) ? state[section] : [];
      return { ...state, [section]: arr.map((it, i) => i === action.index ? { ...it, ...action.patch } : it) };
    }
    case 'removeArrayItem': {
      const arr = Array.isArray(state[action.section]) ? state[action.section] : [];
      const next = arr.filter((_, i) => i !== action.index);
      return { ...state, [action.section]: next.length >= (action.min ?? 0) ? next : arr };
    }
    case 'toggleCommonTest':
      return { ...state, investigations: { ...state.investigations, common: { ...state.investigations.common, [action.testName]: !state.investigations.common[action.testName] } } };
    case 'setCustomTest': {
      const next = [...(state.investigations.custom || [])];
      next[action.index] = action.value;
      return { ...state, investigations: { ...state.investigations, custom: next } };
    }
    case 'addCustomTest':
      return { ...state, investigations: { ...state.investigations, custom: [...(state.investigations.custom || []), ''] } };
    case 'removeCustomTest': {
      const next = (state.investigations.custom || []).filter((_, i) => i !== action.index);
      return { ...state, investigations: { ...state.investigations, custom: next.length ? next : [''] } };
    }
    case 'prefillPatient': {
      const { appt } = action;
      return { ...state, patient: { ...state.patient, name: appt.patient_name || '', contact: appt.patient_phone || '', age_value: appt.patient_age ? String(appt.patient_age) : '', gender: appt.patient_gender || '' } };
    }
    case 'reset':
      return { ...initialRxState, visit: { date: todayYmd(), type: 'New' }, investigations: { common: Object.fromEntries(COMMON_TESTS.map((t) => [t, false])), custom: [''] } };
    default:
      return state;
  }
}

export default function DoctorPrescriptions({ prescriptions = [], stats = {} }) {
  const authUser = usePage()?.props?.auth?.user;
  const chamberInfo = usePage()?.props?.chamberInfo || {};
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);

  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Create Prescription modal states
  const [showCreateRxModal, setShowCreateRxModal] = useState(false);
  const [apptSearch, setApptSearch] = useState('');
  const [apptResults, setApptResults] = useState([]);
  const [apptSearching, setApptSearching] = useState(false);
  const [showApptDrop, setShowApptDrop] = useState(false);
  const [chosenAppt, setChosenAppt] = useState(null);
  const [rxState, rxDispatch] = useReducer(rxReducer, initialRxState);
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [rxErrors, setRxErrors] = useState({});
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxAction, setRxAction] = useState(null);
  const apptDropRef = useRef(null);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  // Appointment search for create prescription modal
  useEffect(() => {
    if (!apptSearch.trim()) {
      setApptResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setApptSearching(true);
      fetch(`/api/doctor/appointments?search=${encodeURIComponent(apptSearch.trim())}&per_page=20`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
        .then((r) => (r.ok ? r.json() : { appointments: [] }))
        .then((data) => {
          const list = Array.isArray(data.appointments) ? data.appointments : (data.appointments?.data ?? []);
          setApptResults(list.filter((a) => !a.has_prescription));
        })
        .finally(() => setApptSearching(false));
    }, 320);
    return () => clearTimeout(timer);
  }, [apptSearch]);

  // Fetch medicines for datalist once when modal opens
  useEffect(() => {
    if (!showCreateRxModal || medicineSuggestions.length > 0) return;
    fetch('/api/doctor/medicines', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { medicines: [] }))
      .then((data) => setMedicineSuggestions(Array.isArray(data) ? data : (data.medicines ?? [])));
  }, [showCreateRxModal]);

  // Close appointment dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (apptDropRef.current && !apptDropRef.current.contains(e.target)) {
        setShowApptDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resolvePatientAge = (p) => {
    if (p?.patient_age !== undefined && p?.patient_age !== null && p?.patient_age !== '') {
      return p.patient_age;
    }

    if (p?.user?.age !== undefined && p?.user?.age !== null && p?.user?.age !== '') {
      return p.user.age;
    }

    const dob = p?.user?.date_of_birth;
    if (!dob) return null;

    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;

    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = todayDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  };

  const getPatientName = (prescription) => (
    prescription?.patient_name || prescription?.user?.name || `Patient #${prescription?.user_id || ''}`
  );

  const getPatientPhone = (prescription) => prescription?.patient_contact || prescription?.user?.phone || null;
  const getPatientGender = (prescription) => prescription?.patient_gender || prescription?.user?.gender || 'N/A';
  const formatGender = (gender) => {
    const value = String(gender || '').trim().toLowerCase();
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatAgeLabel = (prescription) => {
    const age = resolvePatientAge(prescription);
    return age ? `${age}y` : 'Age N/A';
  };

  const todayIso = new Date().toISOString().split('T')[0];

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((p) => {
      const createdDateOnly = (p.created_at || '').slice(0, 10);
      const dateOk = dateFilter === 'all' || createdDateOnly === todayIso;

      if (!dateOk) {
        return false;
      }

      const genderValue = String(getPatientGender(p) || '').trim().toLowerCase();
      const genderOk = genderFilter === 'all' || genderValue === genderFilter;
      if (!genderOk) {
        return false;
      }

      if (followUpFilter === 'with' && !p.follow_up_date) {
        return false;
      }

      if (followUpFilter === 'without' && p.follow_up_date) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = `${p.id || ''} ${getPatientName(p)} ${getPatientPhone(p) || ''} ${p.diagnosis || ''} ${p.instructions || ''} ${p.symptoms || ''} ${p.patient_gender || p.user?.gender || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, searchTerm, dateFilter, todayIso, genderFilter, followUpFilter]);

  const statsView = useMemo(() => ({
    visible: filteredRows.length,
    today: rows.filter((item) => (item.created_at || '').slice(0, 10) === todayIso).length,
    withFollowUp: stats?.withFollowUp ?? rows.filter((item) => Boolean(item.follow_up_date)).length,
    upcoming: stats?.upcomingFollowUps ?? rows.filter((item) => {
      if (!item.follow_up_date) return false;
      return item.follow_up_date >= todayIso;
    }).length,
    withoutFollowUp: stats?.withoutFollowUp ?? rows.filter((item) => !item.follow_up_date).length,
  }), [filteredRows.length, rows, stats, todayIso]);

  const resetAndCloseRx = () => {
    setShowCreateRxModal(false);
    setApptSearch('');
    setApptResults([]);
    setShowApptDrop(false);
    setChosenAppt(null);
    rxDispatch({ type: 'reset' });
    setRxErrors({});
    setRxAction(null);
  };

  const buildRxDiagnosis = () => {
    const lines = [];
    const cc = (rxState.complaints || []).map((c) => {
      const desc = String(c.description || '').trim();
      const dur = String(c.duration || '').trim();
      if (!desc && !dur) return null;
      return dur ? `${desc} (${dur})` : desc;
    }).filter(Boolean);
    if (cc.length) { lines.push('Chief Complaints:'); cc.forEach((x) => lines.push(`- ${x}`)); lines.push(''); }
    const prov = String(rxState.diagnosis.provisional || '').trim();
    const fin = String(rxState.diagnosis.final || '').trim();
    if (prov) lines.push(`Provisional Diagnosis: ${prov}`);
    if (fin) lines.push(`Final Diagnosis: ${fin}`);
    const vitals = [];
    if (String(rxState.exam.bp || '').trim()) vitals.push(`BP ${rxState.exam.bp.trim()}`);
    if (String(rxState.exam.pulse || '').trim()) vitals.push(`Pulse ${rxState.exam.pulse.trim()}`);
    if (String(rxState.exam.temperature || '').trim()) vitals.push(`Temp ${rxState.exam.temperature.trim()}`);
    if (String(rxState.exam.spo2 || '').trim()) vitals.push(`SpO₂ ${rxState.exam.spo2.trim()}`);
    if (vitals.length) lines.push(`Vitals: ${vitals.join(', ')}`);
    return lines.join('\n').trim();
  };
  const buildRxMedications = () => (rxState.medicines || []).map((m) => {
    const name = String(m.name || '').trim();
    if (!name) return null;
    const parts = [name];
    if (m.strength) parts.push(m.strength);
    const details = [m.dosage, m.duration, m.instruction].filter(Boolean);
    if (details.length) parts.push(`- ${details.join(' - ')}`);
    return parts.join(' ');
  }).filter(Boolean).join('\n').trim();
  const buildRxTests = () => {
    const common = Object.entries(rxState.investigations.common || {}).filter(([, v]) => !!v).map(([k]) => k);
    const custom = (rxState.investigations.custom || []).map((t) => String(t || '').trim()).filter(Boolean);
    return [...common, ...custom].join('\n').trim();
  };
  const buildRxInstructions = () => {
    const lines = [];
    if (rxState.advice.lifestyle) { lines.push('Lifestyle Advice:'); lines.push(rxState.advice.lifestyle); lines.push(''); }
    if (rxState.advice.diet_rest) { lines.push('Diet / Rest:'); lines.push(rxState.advice.diet_rest); lines.push(''); }
    return lines.join('\n').trim();
  };

  const handleCreatePrescription = async (appointmentAction = null) => {
    setRxErrors({});
    setRxAction(appointmentAction);
    const errors = {};
    if (!rxState.patient.name.trim()) {
      errors.patient_name = 'Patient name is required.';
    }
    if (Object.keys(errors).length > 0) {
      setRxErrors(errors);
      return;
    }
    setRxSubmitting(true);
    try {
      const payload = {
        appointment_id:     chosenAppt?.id ?? undefined,
        patient_name:       rxState.patient.name,
        patient_contact:    rxState.patient.contact || undefined,
        patient_age:        rxState.patient.age_value || undefined,
        patient_age_unit:   rxState.patient.age_unit || 'years',
        patient_gender:     rxState.patient.gender || undefined,
        patient_weight:     rxState.patient.weight || undefined,
        visit_type:         rxState.visit.type || undefined,
        diagnosis:          buildRxDiagnosis() || undefined,
        medications:        buildRxMedications() || undefined,
        instructions:       buildRxInstructions() || undefined,
        tests:              buildRxTests() || undefined,
        next_visit_date:    rxState.follow_up.date || undefined,
        appointment_action: appointmentAction || undefined,
      };
      const res = await fetch('/api/doctor/prescriptions', {
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
        toastSuccess('Prescription created successfully.');
        router.reload({ only: ['prescriptions', 'stats'] });
        resetAndCloseRx();
      } else if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setRxErrors(mapped);
      } else {
        toastError(data?.message || 'Failed to create prescription.');
      }
    } catch {
      toastError('Network error. Please try again.');
    } finally {
      setRxSubmitting(false);
    }
  };

  const handlePrintPrescription = (prescription) => {
    const printWindow = window.open(`/doctor/prescriptions/${prescription.id}?action=print`, '_blank');

    if (printWindow) {
      toastSuccess('Opening prescription for printing...');
      return;
    }

    toastError('Unable to open the print view right now.');
  };

  return (
    <DoctorLayout title="Prescriptions" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#2D3A74]">Prescriptions</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {statsView.visible}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('today')}`}>
                  Today: <span className="font-semibold">{statsView.today}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('withFollowUp')}`}>
                  With Follow-up: <span className="font-semibold">{statsView.withFollowUp}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('upcoming')}`}>
                  Upcoming Visits: <span className="font-semibold">{statsView.upcoming}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('withoutFollowUp')}`}>
                  No Follow-up: <span className="font-semibold">{statsView.withoutFollowUp}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,360px)_180px] xl:items-end">
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

                  <div className="sm:max-w-[190px] xl:w-[180px]">
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
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateRxModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Prescription
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
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
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
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Follow-up</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'with', label: 'With Follow-up' },
                          { value: 'without', label: 'No Follow-up' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFollowUpFilter(option.value)}
                            className={`inline-flex h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${
                              followUpFilter === option.value
                                ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="inline-flex h-10 items-center rounded-xl bg-[#2D3A74] px-4 text-sm font-semibold text-white transition hover:bg-[#243063]"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-4 py-3.5 text-left">#</th>
                  <th className="px-4 py-3.5 text-left">Patient</th>
                  <th className="px-4 py-3.5 text-left">Symptoms</th>
                  <th className="px-4 py-3.5 text-left">Diagnosis / Advice</th>
                  <th className="px-4 py-3.5 text-left">Created</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((p, index) => {
                  const serial = p.serial_no || (((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1);

                  return (
                    <tr
                      key={p.id || index}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => router.visit(`/doctor/prescriptions/${p.id}`)}
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 text-left">
                          <GenderIconAvatar gender={getPatientGender(p)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(p), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">Prescription #{p.id}</div>
                            <div className="text-xs font-medium text-slate-500">{formatAgeLabel(p)}</div>
                            <div className="mt-1 text-xs font-medium text-slate-500 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {renderHighlighted(getPatientPhone(p) || 'N/A', searchTerm)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <div className="max-w-[180px] truncate inline-flex items-center gap-1.5" title={p.symptoms || 'N/A'}>
                          <ClipboardList className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          {renderHighlighted(p.symptoms || 'N/A', searchTerm)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <div className="max-w-[200px] truncate inline-flex items-center gap-1.5" title={p.diagnosis || p.instructions || 'N/A'}>
                          <Stethoscope className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          {renderHighlighted(p.diagnosis || p.instructions || 'N/A', searchTerm)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.visit(`/doctor/prescriptions/${p.id}`)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View prescription"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Prescription
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintPrescription(p)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800"
                            aria-label="Print prescription"
                          >
                            <Printer className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Print
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
            <div className="p-5">
              <DocEmptyState
                icon={FileText}
                title="No prescriptions found"
                description="Try another date filter or keyword."
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
                        <Link href={prev.url} className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300">Previous</Link>
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
      <DocModal
        open={showCreateRxModal}
        onClose={resetAndCloseRx}
        title="New Prescription"
        icon={FilePlus}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={resetAndCloseRx}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { rxDispatch({ type: 'reset' }); setChosenAppt(null); setApptSearch(''); setRxErrors({}); }}
              disabled={rxSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              type="button"
              onClick={() => handleCreatePrescription('awaiting_tests')}
              disabled={rxSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {rxSubmitting && rxAction === 'awaiting_tests' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              Send for Tests
            </button>
            <button
              type="button"
              onClick={() => handleCreatePrescription('prescribed')}
              disabled={rxSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3556a6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a488f] disabled:opacity-60"
            >
              {rxSubmitting && rxAction === 'prescribed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save &amp; Complete
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Appointment search — optional, leave blank to enter patient info manually */}
          <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search Appointment</label>
              <div className="relative" ref={apptDropRef}>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={apptSearch}
                  onChange={(e) => { setApptSearch(e.target.value); if (chosenAppt) setChosenAppt(null); setShowApptDrop(true); }}
                  onFocus={() => { if (apptSearch) setShowApptDrop(true); }}
                  placeholder="Search by patient name or phone…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                />
                {apptSearching && <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
                {showApptDrop && !apptSearching && apptSearch.trim() && apptResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">No appointments without prescription found</div>
                )}
                {showApptDrop && apptResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {apptResults.map((appt) => (
                      <button key={appt.id} type="button"
                        onClick={() => {
                          setChosenAppt(appt);
                          setApptSearch(`${appt.patient_name} — ${appt.appointment_date}`);
                          setShowApptDrop(false);
                          rxDispatch({ type: 'prefillPatient', appt });
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                      >
                        <GenderIconAvatar gender={appt.patient_gender} />
                        <div>
                          <p className="font-semibold text-slate-800">{appt.patient_name}</p>
                          <p className="text-xs text-slate-400">{appt.appointment_date}{appt.patient_phone ? ` • ${appt.patient_phone}` : ''}{appt.status ? ` • ${appt.status}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {rxErrors.appt && <p className="mt-1 text-xs text-rose-500">{rxErrors.appt}</p>}
            </div>

          {/* Patient Information — inline underline strip */}
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              {/* Name */}
              <div className="flex min-w-[160px] flex-1 items-end gap-2">
                <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                <div className="flex-1">
                  <input
                    className="w-full border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                    value={rxState.patient.name}
                    onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'name'], value: e.target.value })}
                    placeholder="Patient name"
                  />
                  {rxErrors.patient_name && <p className="mt-0.5 text-[10px] text-rose-500">{rxErrors.patient_name}</p>}
                </div>
              </div>
              {/* Age */}
              <div className="flex items-end gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                <div className="flex items-end gap-1">
                  <input
                    inputMode="numeric"
                    className="w-10 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-center text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                    value={rxState.patient.age_value}
                    onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'age_value'], value: e.target.value })}
                    placeholder="—"
                  />
                  <select
                    className="border-b border-slate-300 bg-transparent pb-0.5 text-xs text-slate-600 focus:border-[#2D3A74] focus:outline-none"
                    value={rxState.patient.age_unit}
                    onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'age_unit'], value: e.target.value })}
                  >
                    <option value="years">yr</option>
                    <option value="months">mo</option>
                  </select>
                </div>
              </div>
              {/* Gender */}
              <div className="flex items-end gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
                <select
                  className="w-24 border-b border-slate-300 bg-transparent pb-0.5 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                  value={rxState.patient.gender}
                  onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'gender'], value: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Weight */}
              <div className="flex items-end gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-600">Weight:</span>
                <input
                  inputMode="decimal"
                  className="w-14 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                  value={rxState.patient.weight}
                  onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'weight'], value: e.target.value })}
                  placeholder="kg"
                />
              </div>
              {/* Contact */}
              <div className="flex items-end gap-1.5">
                <Phone className="h-3 w-3 shrink-0 text-slate-400 mb-1" />
                <input
                  className="w-28 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                  value={rxState.patient.contact}
                  onChange={(e) => rxDispatch({ type: 'setField', path: ['patient', 'contact'], value: e.target.value })}
                  placeholder="Contact"
                />
              </div>
              {/* Visit Type */}
              <div className="flex items-end gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-600">Visit:</span>
                <select
                  className="w-24 border-b border-slate-300 bg-transparent pb-0.5 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                  value={rxState.visit.type}
                  onChange={(e) => rxDispatch({ type: 'setField', path: ['visit', 'type'], value: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prescription Pad */}
          <div className="rx-pad-inputs overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Mini Letterhead */}
            <div className="border-b border-slate-200">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]" />
                {/* Decorative stethoscope SVG watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07] select-none">
                  <svg viewBox="0 0 280 360" className="h-full w-auto" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 75 60 Q 140 18 205 60" strokeWidth="10" />
                    <path d="M 75 60 C 70 82 56 105 52 135" strokeWidth="8" />
                    <path d="M 205 60 C 210 82 224 105 228 135" strokeWidth="8" />
                    <path d="M 52 135 C 46 195 100 225 140 238" strokeWidth="8" />
                    <path d="M 228 135 C 234 195 180 225 140 238" strokeWidth="8" />
                    <path d="M 140 238 L 140 282" strokeWidth="10" />
                    <circle cx="140" cy="314" r="36" strokeWidth="12" />
                    <circle cx="140" cy="314" r="18" strokeWidth="5" />
                    <circle cx="140" cy="314" r="6" strokeWidth="4" fill="white" />
                    <ellipse cx="75" cy="54" rx="11" ry="8" strokeWidth="5" fill="white" />
                    <ellipse cx="205" cy="54" rx="11" ry="8" strokeWidth="5" fill="white" />
                  </svg>
                </div>
                <div className="relative z-10 grid grid-cols-2 divide-x divide-white/10 px-6 py-4">
                  {/* Doctor side */}
                  <div className="pr-6">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3 text-blue-300" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-300">Doctor</span>
                    </div>
                    <p className="text-base font-black tracking-tight text-white">{authUser?.name || 'Doctor'}</p>
                    <p className="mt-0.5 text-xs text-slate-300">{authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}</p>
                    <div className="mt-1.5 space-y-0.5 text-xs text-slate-200">
                      {authUser?.phone ? <p>{authUser.phone}</p> : null}
                      {authUser?.email ? <p>{authUser.email}</p> : null}
                    </div>
                  </div>
                  {/* Chamber side */}
                  <div className="pl-6">
                    <div className="mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-blue-300" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-300">Chamber</span>
                    </div>
                    <p className="text-base font-black tracking-tight text-white">
                      {chamberInfo?.name || 'Medical Chamber'}
                    </p>
                    {chamberInfo?.location ? (
                      <p className="mt-0.5 text-xs text-slate-200">{chamberInfo.location}</p>
                    ) : null}
                    {chamberInfo?.phone ? (
                      <p className="mt-0.5 text-xs text-slate-200">{chamberInfo.phone}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12 divide-x divide-dashed divide-slate-200">

              {/* Left column — Investigations + Diagnosis + Complaints + Vitals */}
              <div className="col-span-4 space-y-5 p-4">

                {/* Investigations */}
                <div>
                  <div className="mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <FlaskConical className="h-3.5 w-3.5 text-[#3556a6]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Investigations</span>
                  </div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">Common Tests</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {COMMON_TESTS.map((test) => (
                      <label key={test} className="flex cursor-pointer items-center gap-1.5 rounded p-0.5 hover:bg-slate-50">
                        <input type="checkbox" className="rounded"
                          checked={rxState.investigations.common[test] || false}
                          onChange={() => rxDispatch({ type: 'toggleCommonTest', testName: test })} />
                        <span className="text-xs">{test}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold text-slate-600">Custom Tests</div>
                    <div className="space-y-1">
                      {(rxState.investigations.custom || []).map((test, idx) => (
                        <div key={idx} className="flex gap-1">
                          <input className="w-full rounded px-2 py-1 text-xs text-slate-900 doc-input-focus border"
                            value={test}
                            onChange={(e) => rxDispatch({ type: 'setCustomTest', index: idx, value: e.target.value })}
                            placeholder="Add test" />
                          {(rxState.investigations.custom || []).length > 1 && (
                            <button type="button" className="rounded border border-rose-300 bg-rose-50 px-2 text-xs text-rose-800 hover:bg-rose-100"
                              onClick={() => rxDispatch({ type: 'removeCustomTest', index: idx })}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button"
                        className="w-full rounded border border-[#d7dfec] bg-[#edf1fb] px-2 py-1 text-xs font-semibold text-[#3556a6] hover:bg-[#e4eafb]"
                        onClick={() => rxDispatch({ type: 'addCustomTest' })}>+ Add Test</button>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <div className="mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Stethoscope className="h-3.5 w-3.5 text-[#3556a6]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnosis</span>
                  </div>
                  <div className="mb-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Provisional</label>
                    <textarea rows={2} className="w-full rounded-md px-2 py-1.5 text-xs text-slate-900 doc-input-focus border"
                      value={rxState.diagnosis.provisional}
                      onChange={(e) => rxDispatch({ type: 'setField', path: ['diagnosis', 'provisional'], value: e.target.value })}
                      placeholder="Initial diagnosis" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Final</label>
                    <textarea rows={2} className="w-full rounded-md px-2 py-1.5 text-xs text-slate-900 doc-input-focus border"
                      value={rxState.diagnosis.final}
                      onChange={(e) => rxDispatch({ type: 'setField', path: ['diagnosis', 'final'], value: e.target.value })}
                      placeholder="Confirmed diagnosis" />
                  </div>
                </div>

                {/* Complaints */}
                <div>
                  <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Complaints</span>
                    <button type="button" className="text-[10px] text-[#3556a6] hover:underline"
                      onClick={() => rxDispatch({ type: 'addArrayItem', section: 'complaints', item: emptyComplaint() })}>+ Add</button>
                  </div>
                  <div className="space-y-1.5">
                    {(rxState.complaints || []).map((c, idx) => (
                      <div key={idx} className="space-y-1 rounded border border-slate-200 bg-white p-1.5">
                        <input className="w-full rounded px-1.5 py-1 text-xs text-slate-900 doc-input-focus border"
                          value={c.description}
                          onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['complaints'], index: idx, patch: { description: e.target.value } })}
                          placeholder="Complaint" />
                        <input className="w-full rounded px-1.5 py-1 text-xs text-slate-900 doc-input-focus border"
                          value={c.duration}
                          onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['complaints'], index: idx, patch: { duration: e.target.value } })}
                          placeholder="Duration" />
                        {(rxState.complaints || []).length > 1 && (
                          <button type="button"
                            className="w-full rounded border border-rose-300 bg-rose-50 px-1 py-0.5 text-[10px] text-rose-800 hover:bg-rose-100"
                            onClick={() => rxDispatch({ type: 'removeArrayItem', section: 'complaints', index: idx, min: 1 })}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <div className="mb-2 border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Vitals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[['bp', 'BP'], ['pulse', 'Pulse'], ['temperature', 'Temp'], ['spo2', 'SpO₂']].map(([key, label]) => (
                      <input key={key} className="rounded px-1.5 py-1 text-xs text-slate-900 doc-input-focus border"
                        value={rxState.exam[key]}
                        onChange={(e) => rxDispatch({ type: 'setField', path: ['exam', key], value: e.target.value })}
                        placeholder={label} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column — ℞ Medicines + Advice */}
              <div className="col-span-8 space-y-5 p-4">

                {/* Rx Medicines */}
                <div>
                  <div className="mb-3 flex items-start gap-3">
                    <div className="text-4xl font-serif font-bold italic leading-none text-slate-800">℞</div>
                    <div className="flex-1 space-y-2">
                      {(rxState.medicines || []).map((m, idx) => (
                        <div key={idx} className="group/med flex items-start gap-1.5 rounded border border-slate-200 bg-white p-2 transition hover:border-[#b9caee] hover:bg-slate-50">
                          <span className="mt-1.5 min-w-[1rem] text-xs font-bold text-slate-400">{idx + 1}.</span>
                          <div className="flex flex-1 flex-wrap gap-1.5">
                            <input className="min-w-[120px] flex-[2] rounded px-2 py-1.5 text-sm text-slate-900 doc-input-focus border"
                              list="rx-medicine-suggestions"
                              value={m.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                const match = medicineSuggestions.find((med) => med.name.toLowerCase() === val.toLowerCase());
                                const patch = { name: val };
                                if (match?.strength) patch.strength = match.strength;
                                rxDispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch });
                              }}
                              placeholder="Medicine name" />
                            <input className="w-20 flex-none rounded px-2 py-1.5 text-sm text-slate-900 doc-input-focus border"
                              value={m.strength}
                              onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { strength: e.target.value } })}
                              placeholder="Strength" />
                            <input className="w-20 flex-none rounded px-2 py-1.5 text-sm text-slate-900 doc-input-focus border"
                              value={m.dosage}
                              onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { dosage: e.target.value } })}
                              placeholder="1+0+1" />
                            <input className="w-24 flex-none rounded px-2 py-1.5 text-sm text-slate-900 doc-input-focus border"
                              value={m.duration}
                              onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { duration: e.target.value } })}
                              placeholder="Duration" />
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-slate-600">
                            <span className="text-[10px] font-semibold">Timing</span>
                            <div className="flex items-center gap-2">
                              {['After meal', 'Before meal'].map((opt) => (
                                <label key={opt} className="inline-flex cursor-pointer items-center gap-1">
                                  <input type="radio" className="h-3 w-3" value={opt} checked={m.instruction === opt}
                                    onChange={(e) => rxDispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { instruction: e.target.value } })} />
                                  <span className="whitespace-nowrap text-[10px]">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <button type="button"
                            className="rounded border border-rose-300 bg-rose-50 px-1.5 py-1 text-xs text-rose-800 opacity-0 transition hover:bg-rose-100 group-hover/med:opacity-100"
                            onClick={() => rxDispatch({ type: 'removeArrayItem', section: 'medicines', index: idx, min: 0 })}>×</button>
                        </div>
                      ))}
                      <button type="button"
                        className="flex w-full items-center justify-center gap-1 rounded border-2 border-dashed border-[#d7dfec] bg-[#edf1fb] px-3 py-2 text-xs font-semibold text-[#3556a6] hover:bg-[#e4eafb]"
                        onClick={() => rxDispatch({ type: 'addArrayItem', section: 'medicines', item: emptyMedicine() })}>
                        <Plus className="h-3 w-3" /> Add Medicine Row
                      </button>
                      <datalist id="rx-medicine-suggestions">
                        {medicineSuggestions.map((med) => (
                          <option key={med.id ?? med.name} value={med.name}>{med.strength ? `${med.name} ${med.strength}` : med.name}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Advice + Follow-up */}
                <div className="border-t-2 border-dotted border-slate-200 pt-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#3556a6]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice &amp; Follow-up</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Lifestyle</label>
                      <textarea rows={3} className="w-full rounded-md px-2 py-1.5 text-xs text-slate-900 doc-input-focus border"
                        value={rxState.advice.lifestyle}
                        onChange={(e) => rxDispatch({ type: 'setField', path: ['advice', 'lifestyle'], value: e.target.value })}
                        placeholder="Lifestyle advice" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Diet / Rest</label>
                      <textarea rows={3} className="w-full rounded-md px-2 py-1.5 text-xs text-slate-900 doc-input-focus border"
                        value={rxState.advice.diet_rest}
                        onChange={(e) => rxDispatch({ type: 'setField', path: ['advice', 'diet_rest'], value: e.target.value })}
                        placeholder="Diet and rest instructions" />
                    </div>
                    <div className="sm:col-span-2 sm:max-w-xs">
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Follow-up Date</label>
                      <input type="date" className="w-full rounded-md px-2 py-1.5 text-xs text-slate-900 doc-input-focus border"
                        value={rxState.follow_up.date}
                        onChange={(e) => rxDispatch({ type: 'setField', path: ['follow_up', 'date'], value: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocModal>
    </DoctorLayout>
  );
}


