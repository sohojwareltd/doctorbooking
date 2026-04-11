import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ClipboardList,
    FileText,
    FlaskConical,
    Heart,
    Mail,
    MapPin,
    Phone,
    Pill,
    Plus,
    RotateCcw,
    Save,
    Stethoscope,
    Trash2,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useReducer, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocCard } from '../../components/doctor/DocUI';
import { toastError, toastSuccess } from '../../utils/toast';

const COMMON_TESTS = [
    'CBC',
    'ESR',
    'CRP',
    'RBS',
    'HbA1c',
    'Serum Creatinine',
    'LFT',
    'Lipid Profile',
    'Urine R/E',
    'ECG',
    'X-ray',
    'USG',
];

const emptyComplaint = () => ({ description: '', duration: '' });
const emptyMedicine = () => ({
    name: '',
    strength: '',
    dosage: '',
    duration: '',
    instruction: 'After meal',
});

const todayYmd = () => new Date().toISOString().split('T')[0];

function formatDisplayDate(ymd) {
    if (!ymd) return '';
    const parts = String(ymd).split('-');
    if (parts.length !== 3) return '';
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return '';
    const date = new Date(y, m - 1, d);
    const fmt = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
    });
    return fmt.format(date);
}

function formatDisplayTime12h(time) {
    if (!time) return '';
    const s = String(time);
    const m = s.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (!m) return '';

    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return '';

    const date = new Date(1970, 0, 1, hh, mm, 0);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(date);
}

const initialState = {
    patient: {
        name: '',
        age_value: '',
        age_unit: 'years',
        gender: '',
        weight: '',
        contact: '',
    },
    visit: {
        date: todayYmd(),
        type: 'New',
    },
    complaints: [emptyComplaint()],
    exam: {
        bp: '',
        pulse: '',
        temperature: '',
        spo2: '',
        notes: '',
    },
    diagnosis: {
        provisional: '',
        final: '',
    },
    medicines: [],
    investigations: {
        common: Object.fromEntries(COMMON_TESTS.map((t) => [t, false])),
        custom: [''],
    },
    advice: {
        lifestyle: '',
        diet_rest: '',
    },
    follow_up: {
        date: '',
        emergency_note:
            'If symptoms worsen or persist, seek emergency care immediately.',
    },
};

function reducer(state, action) {
    switch (action.type) {
        case 'setField': {
            const { path, value } = action;
            const [section, key] = path;
            return {
                ...state,
                [section]: {
                    ...state[section],
                    [key]: value,
                },
            };
        }
        case 'setNestedField': {
            const { path, value } = action;
            const [section, sub, key] = path;
            return {
                ...state,
                [section]: {
                    ...state[section],
                    [sub]: {
                        ...state[section][sub],
                        [key]: value,
                    },
                },
            };
        }
        case 'setArrayItem': {
            const { path, index, patch } = action;
            const [section] = path;
            const arr = Array.isArray(state[section]) ? state[section] : [];
            return {
                ...state,
                [section]: arr.map((it, i) =>
                    i === index ? { ...it, ...patch } : it,
                ),
            };
        }
        case 'addArrayItem': {
            const { section, item } = action;
            const arr = Array.isArray(state[section]) ? state[section] : [];
            return {
                ...state,
                [section]: [...arr, item],
            };
        }
        case 'removeArrayItem': {
            const { section, index, min = 1 } = action;
            const arr = Array.isArray(state[section]) ? state[section] : [];
            const next = arr.filter((_, i) => i !== index);
            return {
                ...state,
                [section]: next.length >= min ? next : arr,
            };
        }
        case 'toggleCommonTest': {
            const { testName } = action;
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    common: {
                        ...state.investigations.common,
                        [testName]: !state.investigations.common[testName],
                    },
                },
            };
        }
        case 'setCustomTest': {
            const { index, value } = action;
            const next = [...(state.investigations.custom || [])];
            next[index] = value;
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    custom: next,
                },
            };
        }
        case 'addCustomTest': {
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    custom: [...(state.investigations.custom || []), ''],
                },
            };
        }
        case 'removeCustomTest': {
            const { index } = action;
            const next = (state.investigations.custom || []).filter(
                (_, i) => i !== index,
            );
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    custom: next.length ? next : [''],
                },
            };
        }
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function CreatePrescription({ appointmentId = null, chamberInfo, selectedPatient, medicines = [] }) {
    const page = usePage();
    const authUser = page?.props?.auth?.user;

    const chamberName = chamberInfo?.name || '';
    const chamberAddress = chamberInfo?.location || '';
    const chamberPhone = chamberInfo?.phone || '';

    const [state, dispatch] = useReducer(reducer, initialState);
    const [submitting, setSubmitting] = useState(false);
    const [appointmentAction, setAppointmentAction] = useState(null);

    // Medicines from backend (App\Models\Medicine) for search/suggestions
    const medicineSuggestions = useMemo(
        () =>
            Array.isArray(medicines)
                ? medicines.map((m) => ({
                      id: m.id,
                      name: m.name || '',
                      strength: m.strength || '',
                  }))
                : [],
        [medicines],
    );
    
    // Medicine form state (fix for getElementById issue)
    const [newMedicine, setNewMedicine] = useState({
        name: '',
        strength: '',
        dosage: '',
        duration: '',
        instruction: 'After meal',
    });

    // Initialize appointment from URL query parameter
    useEffect(() => {
        if (selectedPatient) {
            if (selectedPatient.name) {
                dispatch({
                    type: 'setField',
                    path: ['patient', 'name'],
                    value: selectedPatient.name,
                });
            }
            if (selectedPatient.phone) {
                dispatch({
                    type: 'setField',
                    path: ['patient', 'contact'],
                    value: selectedPatient.phone,
                });
            }
            if (selectedPatient.age) {
                dispatch({
                    type: 'setField',
                    path: ['patient', 'age_value'],
                    value: String(selectedPatient.age),
                });
            }
            if (selectedPatient.gender) {
                dispatch({
                    type: 'setField',
                    path: ['patient', 'gender'],
                    value: selectedPatient.gender,
                });
            }
            if (selectedPatient.weight) {
                dispatch({
                    type: 'setField',
                    path: ['patient', 'weight'],
                    value: selectedPatient.weight,
                });
            }
        }
    }, [selectedPatient]);

    const visitDateLabel = useMemo(
        () => formatDisplayDate(state.visit.date),
        [state.visit.date],
    );
    const followUpDateLabel = useMemo(
        () => formatDisplayDate(state.follow_up.date),
        [state.follow_up.date],
    );
    const selectedTestsCount = useMemo(() => {
        const common = Object.values(state.investigations.common || {}).filter(Boolean).length;
        const custom = (state.investigations.custom || []).map((item) => String(item || '').trim()).filter(Boolean).length;
        return common + custom;
    }, [state.investigations.common, state.investigations.custom]);
    const medicineCount = useMemo(
        () => (state.medicines || []).filter((item) => String(item.name || '').trim()).length,
        [state.medicines],
    );

    const inputClass =
        'w-full rounded-md bg-slate-50/50 px-3 py-2 text-sm text-slate-900 doc-input-focus';
    const medicineInputClass =
        'w-full rounded-md bg-slate-50/50 px-2 py-1 text-xs text-slate-900 doc-input-focus';
    const labelClass = 'mb-2 block text-xs font-semibold text-slate-700';
    const helperClass = 'mt-1 text-xs text-slate-500';
    const sectionTitleClass = 'text-base font-bold text-slate-800';
    const sectionSubClass = 'mt-1 text-xs text-slate-500';

    const buildDiagnosisText = () => {
        const lines = [];

        const cc = (state.complaints || [])
            .map((c) => {
                const desc = String(c.description || '').trim();
                const dur = String(c.duration || '').trim();
                if (!desc && !dur) return null;
                return dur ? `${desc} (${dur})` : desc;
            })
            .filter(Boolean);
        if (cc.length) {
            lines.push('Chief Complaints:');
            cc.forEach((x) => lines.push(`- ${x}`));
            lines.push('');
        }

        const prov = String(state.diagnosis.provisional || '').trim();
        const fin = String(state.diagnosis.final || '').trim();
        if (prov) lines.push(`Provisional Diagnosis: ${prov}`);
        if (fin) lines.push(`Final Diagnosis: ${fin}`);

        const vitals = [];
        if (String(state.exam.bp || '').trim())
            vitals.push(`BP ${String(state.exam.bp).trim()}`);
        if (String(state.exam.pulse || '').trim())
            vitals.push(`Pulse ${String(state.exam.pulse).trim()}`);
        if (String(state.exam.temperature || '').trim())
            vitals.push(`Temp ${String(state.exam.temperature).trim()}`);
        if (String(state.exam.spo2 || '').trim())
            vitals.push(`SpO₂ ${String(state.exam.spo2).trim()}`);
        if (vitals.length) lines.push(`Vitals: ${vitals.join(', ')}`);
        if (String(state.exam.notes || '').trim())
            lines.push(`Exam Notes: ${String(state.exam.notes).trim()}`);

        return lines.join('\n').trim();
    };

    const buildMedicationsText = () => {
        const meds = (state.medicines || [])
            .map((m) => {
                const name = String(m.name || '').trim();
                if (!name) return null;
                const strength = String(m.strength || '').trim();
                const dosage = String(m.dosage || '').trim();
                const duration = String(m.duration || '').trim();
                const instruction = String(m.instruction || '').trim();
                const parts = [name];
                if (strength) parts.push(strength);
                const details = [];
                if (dosage) details.push(dosage);
                if (duration) details.push(duration);
                if (instruction) details.push(instruction);
                if (details.length) parts.push(`- ${details.join(' - ')}`);
                return parts.join(' ');
            })
            .filter(Boolean);
        return meds.join('\n').trim();
    };

    const buildTestsText = () => {
        const common = Object.entries(state.investigations.common || {})
            .filter(([, v]) => !!v)
            .map(([k]) => k);
        const custom = (state.investigations.custom || [])
            .map((t) => String(t || '').trim())
            .filter(Boolean);
        return [...common, ...custom].join('\n').trim();
    };

    const buildInstructionsText = () => {
        const lines = [];
        const lifestyle = String(state.advice.lifestyle || '').trim();
        const diet = String(state.advice.diet_rest || '').trim();
        const emergency = String(state.follow_up.emergency_note || '').trim();
        if (lifestyle) {
            lines.push('Lifestyle Advice:');
            lines.push(lifestyle);
            lines.push('');
        }
        if (diet) {
            lines.push('Diet / Rest:');
            lines.push(diet);
            lines.push('');
        }
        if (emergency) {
            lines.push('Emergency Note:');
            lines.push(emergency);
        }
        return lines.join('\n').trim();
    };

    const handleSubmit = async (action) => {
        setAppointmentAction(action);

        // Validate patient name
        if (!state.patient.name?.trim()) {
            const message = 'Please enter patient name.';
            toastError(message);
            return;
        }

        const diagnosisText = buildDiagnosisText();
        const medicationsText = buildMedicationsText();
        const testsText = buildTestsText();
        const instructionsText = buildInstructionsText();

        setSubmitting(true);
        try {
            // Get CSRF token from cookie
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            
            const res = await fetch('/doctor/prescriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointment_id: appointmentId || null,
                    patient_name: state.patient.name,
                    patient_age: state.patient.age_value,
                    patient_age_unit: state.patient.age_unit,
                    patient_gender: state.patient.gender,
                    patient_weight: state.patient.weight,
                    patient_contact: state.patient.contact,
                    visit_type: state.visit.type,
                    visit_date: state.visit.date,
                    diagnosis: diagnosisText,
                    medications: medicationsText,
                    instructions: instructionsText || null,
                    tests: testsText || null,
                    next_visit_date: state.follow_up.date || null,
                    appointment_action: action || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg =
                    data?.message ||
                    (data?.errors
                        ? Object.values(data.errors).flat().join(' ')
                        : null) ||
                    'Failed to save prescription.';
                toastError(msg);
                return;
            }

            toastSuccess('Prescription saved successfully.');
            const data = await res.json().catch(() => ({}));
            const prescriptionId = data?.prescription_id;
            // If came from dashboard (has appointmentId), go back to dashboard
            if (appointmentId) {
                setTimeout(() => router.visit('/doctor/dashboard'), 400);
            } else if (prescriptionId) {
                setTimeout(() => router.visit(`/doctor/prescriptions/${prescriptionId}`), 400);
            } else {
                setTimeout(() => router.visit('/doctor/prescriptions'), 400);
            }
        } catch {
            const message = 'Network error. Please try again.';
            toastError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DoctorLayout title="Create Prescription" gradient>
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Back link */}
            <div>
                <Link
                    href="/doctor/prescriptions"
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            {/* Prescription Header Card - Like real prescription pad (Matching PrescriptionShow) */}

            <div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    
                    {/* Prescription Header - Doctor left, Chamber right (matching PrescriptionShow) */}
                    <div className="border-b border-slate-200">
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
                            {/* Inset vignette shadow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

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

                            <div className="relative z-10 grid grid-cols-2 divide-x divide-white/10 px-8 py-7">
                                {/* Left — Doctor Info */}
                                <div className="pr-8">
                                    <div className="mb-1.5 flex items-center gap-1.5">
                                        <Stethoscope className="h-3.5 w-3.5 text-blue-300" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Doctor</span>
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-white">
                                        {authUser?.name || 'Doctor'}
                                    </p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-300">
                                        {authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}
                                    </p>
                                    <div className="mt-3 space-y-1.5">
                                        {authUser?.phone ? (
                                            <div className="flex items-center gap-1.5 text-sm text-slate-200">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                                                <span>{authUser.phone}</span>
                                            </div>
                                        ) : null}
                                        {authUser?.email ? (
                                            <div className="flex items-center gap-1.5 text-sm text-slate-200">
                                                <Mail className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                                                <span>{authUser.email}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Right — Chamber Info */}
                                <div className="pl-8 flex flex-col items-end">
                                    <div className="mb-1.5 flex items-center justify-end gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Chamber</span>
                                        <MapPin className="h-3.5 w-3.5 text-blue-300" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-white">
                                        {chamberName || 'Not set'}
                                    </p>
                                    {chamberAddress ? (
                                        <div className="mt-2.5 flex items-start justify-end gap-1.5 text-sm text-slate-200">
                                            <span>{chamberAddress}</span>
                                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />
                                        </div>
                                    ) : null}
                                    {chamberPhone ? (
                                        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-sm text-slate-200">
                                            <span>{chamberPhone}</span>
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info Strip - Inline underline style (matching DoctorPrescriptions modal) */}
                    <div className="border-b border-slate-200 bg-white px-8 py-4">
                        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                            {/* Name */}
                            <div className="flex min-w-[160px] flex-1 items-end gap-2">
                                <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                                <input
                                    className="flex-1 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                                    value={state.patient.name}
                                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'name'], value: e.target.value })}
                                    placeholder="Patient name"
                                />
                            </div>
                            {/* Age */}
                            <div className="flex items-end gap-1.5">
                                <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                                <div className="flex items-end gap-1">
                                    <input
                                        inputMode="numeric"
                                        className="w-10 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-center text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                                        value={state.patient.age_value}
                                        onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_value'], value: e.target.value })}
                                        placeholder="—"
                                    />
                                    <select
                                        className="border-b border-slate-300 bg-transparent pb-0.5 text-xs text-slate-600 focus:border-[#2D3A74] focus:outline-none"
                                        value={state.patient.age_unit}
                                        onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_unit'], value: e.target.value })}
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
                                    value={state.patient.gender}
                                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'gender'], value: e.target.value })}
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
                                    className="w-16 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                                    value={state.patient.weight}
                                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'weight'], value: e.target.value })}
                                    placeholder="kg"
                                />
                            </div>
                            {/* Contact */}
                            <div className="flex items-end gap-1.5">
                                <Phone className="h-3 w-3 shrink-0 text-slate-400 mb-1" />
                                <input
                                    className="w-32 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                                    value={state.patient.contact}
                                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'contact'], value: e.target.value })}
                                    placeholder="Contact"
                                />
                            </div>
                            {/* Visit Type */}
                            <div className="flex items-end gap-1.5">
                                <span className="shrink-0 text-xs font-bold text-slate-600">Visit:</span>
                                <select
                                    className="w-24 border-b border-slate-300 bg-transparent pb-0.5 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                                    value={state.visit.type}
                                    onChange={(e) => dispatch({ type: 'setField', path: ['visit', 'type'], value: e.target.value })}
                                >
                                    <option value="New">New</option>
                                    <option value="Follow-up">Follow-up</option>
                                </select>
                            </div>
                            {/* Date */}
                            <div className="ml-auto flex items-end gap-1.5">
                                <span className="shrink-0 text-xs font-bold text-slate-600">Date:</span>
                                <span className="border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-700">{visitDateLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Main Content - Real Prescription Pad Layout */}
                    <div className="min-h-[500px] bg-white p-8 pb-12">
                        <form onSubmit={(e) => e.preventDefault()}>
                            {/* Prescription Pad Layout - Two Column Grid */}
                            <div className="grid grid-cols-12 gap-8">
                                
                                {/* Left Column - Narrow (Tests Top, Diagnosis Bottom) */}
                                <div className="col-span-3 space-y-6 border-r-2 border-dashed border-slate-200 pr-8">
                                    
                                    {/* Tests Section - Top Right */}
                                    <div>
                                        <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                            <FlaskConical className="h-4 w-4 text-[#3556a6]" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Investigations</span>
                                        </div>
                                        
                                        {/* Common Tests */}
                                        <div className="mb-3">
                                            <div className="mb-2 text-xs font-semibold text-slate-600">Common Tests</div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {COMMON_TESTS.map((test) => (
                                                    <label key={test} className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={state.investigations.common[test] || false}
                                                            onChange={(e) => dispatch({
                                                                type: 'setNestedField',
                                                                path: ['investigations', 'common', test],
                                                                value: e.target.checked,
                                                            })}
                                                            className="rounded"
                                                        />
                                                        <span className="text-xs">{test}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Custom Tests */}
                                        <div>
                                            <div className="mb-2 text-xs font-semibold text-slate-600">Custom Tests</div>
                                            <div className="space-y-1.5">
                                                {(state.investigations.custom || []).map((test, idx) => (
                                                    <div key={idx} className="flex gap-1">
                                                        <input
                                                            className="w-full rounded-md bg-slate-50/50 px-2 py-1 text-xs text-slate-900 doc-input-focus"
                                                            value={test}
                                                            onChange={(e) => dispatch({
                                                                type: 'setCustomTest',
                                                                index: idx,
                                                                value: e.target.value,
                                                            })}
                                                            placeholder="Add test"
                                                        />
                                                        {(state.investigations.custom || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-800 hover:bg-rose-100"
                                                                onClick={() => dispatch({ type: 'removeCustomTest', index: idx })}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="w-full rounded border border-[#d7dfec] bg-[#edf1fb] px-2 py-1 text-xs font-semibold text-[#3556a6] transition hover:bg-[#e4eafb]"
                                                    onClick={() => dispatch({ type: 'addCustomTest' })}
                                                >
                                                    + Add Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Diagnosis & Complaints Section - Bottom Right */}
                                    <div>
                                        <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                            <Stethoscope className="h-4 w-4 text-[#3556a6]" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnosis</span>
                                        </div>
                                        
                                        {/* Provisional Diagnosis */}
                                        <div className="mb-3">
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Provisional</label>
                                            <textarea
                                                className="w-full rounded-md bg-slate-50/50 px-2 py-1.5 text-xs text-slate-900 doc-input-focus"
                                                rows={2}
                                                value={state.diagnosis.provisional}
                                                onChange={(e) => dispatch({
                                                    type: 'setField',
                                                    path: ['diagnosis', 'provisional'],
                                                    value: e.target.value,
                                                })}
                                                placeholder="Initial diagnosis"
                                            />
                                        </div>
                                        
                                        {/* Final Diagnosis */}
                                        <div className="mb-3">
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Final</label>
                                            <textarea
                                                className="w-full rounded-md bg-slate-50/50 px-2 py-1.5 text-xs text-slate-900 doc-input-focus"
                                                rows={2}
                                                value={state.diagnosis.final}
                                                onChange={(e) => dispatch({
                                                    type: 'setField',
                                                    path: ['diagnosis', 'final'],
                                                    value: e.target.value,
                                                })}
                                                placeholder="Confirmed diagnosis"
                                            />
                                        </div>
                                        
                                        {/* Chief Complaints */}
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-600">Complaints</label>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({
                                                        type: 'addArrayItem',
                                                        section: 'complaints',
                                                        item: emptyComplaint(),
                                                    })}
                                                    className="text-[10px] text-[#3556a6] hover:underline"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {(state.complaints || []).map((c, idx) => (
                                                    <div key={idx} className="space-y-1 rounded border border-slate-200 bg-white p-1.5">
                                                        <input
                                                            className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                            value={c.description}
                                                            onChange={(e) => dispatch({
                                                                type: 'setArrayItem',
                                                                path: ['complaints'],
                                                                index: idx,
                                                                patch: { description: e.target.value },
                                                            })}
                                                            placeholder="Complaint"
                                                        />
                                                        <input
                                                            className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                            value={c.duration}
                                                            onChange={(e) => dispatch({
                                                                type: 'setArrayItem',
                                                                path: ['complaints'],
                                                                index: idx,
                                                                patch: { duration: e.target.value },
                                                            })}
                                                            placeholder="Duration"
                                                        />
                                                        {(state.complaints || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="w-full rounded border border-rose-300 bg-rose-50 px-1 py-0.5 text-[10px] text-rose-800 hover:bg-rose-100"
                                                                onClick={() => dispatch({
                                                                    type: 'removeArrayItem',
                                                                    section: 'complaints',
                                                                    index: idx,
                                                                    min: 1,
                                                                })}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Vitals */}
                                        <div className="mt-3 border-t border-slate-200 pt-3">
                                            <div className="mb-2 text-xs font-semibold text-slate-600">Vitals</div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div>
                                                    <input
                                                        className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                        value={state.exam.bp}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'bp'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="BP"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                        value={state.exam.pulse}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'pulse'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Pulse"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                        value={state.exam.temperature}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'temperature'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Temp"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        className="w-full rounded bg-slate-50/50 px-1.5 py-1 text-xs text-slate-900 doc-input-focus"
                                                        value={state.exam.spo2}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'spo2'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="SpO₂"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Wide (Medicine Main, Advice Bottom) */}
                                <div className="col-span-9 space-y-6">
                                    
                                    {/* Rx Symbol and Medications - Main Area */}
                                    <div>
                                        <div className="mb-4 flex items-start gap-3">
                                            <div className="text-5xl font-serif font-bold italic text-slate-800">℞</div>
                                            <div className="flex-1 pt-2">
                                                {/* Medicine Rows - Dynamic */}
                                                <div className="space-y-2">
                                                    {(state.medicines || []).map((m, idx) => (
                                                        <div key={idx} className="group/med flex items-start gap-2 rounded border border-slate-200 bg-white p-2 transition hover:border-[#b9caee] hover:bg-slate-50">
                                                            <span className="mt-1 text-xs font-bold text-slate-400">{idx + 1}.</span>
                                                            <div className="flex-1 grid grid-cols-6 gap-2">
                                                                <input
                                                                    className="col-span-2 rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                                                    value={m.name}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        const match = medicineSuggestions.find(
                                                                            (med) =>
                                                                                med.name.toLowerCase() === value.toLowerCase(),
                                                                        );
                                                                        const patch = { name: value };
                                                                        if (match && match.strength) {
                                                                            patch.strength = match.strength;
                                                                        }
                                                                        dispatch({
                                                                            type: 'setArrayItem',
                                                                            path: ['medicines'],
                                                                            index: idx,
                                                                            patch,
                                                                        });
                                                                    }}
                                                                    placeholder="Medicine name"
                                                                    list="medicine-suggestions"
                                                                />
                                                                <input
                                                                    className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                                                    value={m.strength}
                                                                    onChange={(e) => dispatch({
                                                                        type: 'setArrayItem',
                                                                        path: ['medicines'],
                                                                        index: idx,
                                                                        patch: { strength: e.target.value },
                                                                    })}
                                                                    placeholder="Strength"
                                                                />
                                                                <input
                                                                    className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                                                    value={m.dosage}
                                                                    onChange={(e) => dispatch({
                                                                        type: 'setArrayItem',
                                                                        path: ['medicines'],
                                                                        index: idx,
                                                                        patch: { dosage: e.target.value },
                                                                    })}
                                                                    placeholder="e.g. 1+0+1"
                                                                />
                                                                <input
                                                                    className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                                                    value={m.duration}
                                                                    onChange={(e) => dispatch({
                                                                        type: 'setArrayItem',
                                                                        path: ['medicines'],
                                                                        index: idx,
                                                                        patch: { duration: e.target.value },
                                                                    })}
                                                                    placeholder="Duration"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-xs text-slate-600">
                                                                <span className="font-semibold">Timing</span>
                                                                <div className="flex items-center gap-3">
                                                                    <label className="inline-flex items-center gap-1">
                                                                        <input
                                                                            type="radio"
                                                                            className="h-3 w-3"
                                                                            value=""
                                                                            checked={!m.instruction}
                                                                            onChange={() =>
                                                                                dispatch({
                                                                                    type: 'setArrayItem',
                                                                                    path: ['medicines'],
                                                                                    index: idx,
                                                                                    patch: { instruction: '' },
                                                                                })
                                                                            }
                                                                        />
                                                                        <span>None</span>
                                                                    </label>
                                                                    <label className="inline-flex items-center gap-1">
                                                                        <input
                                                                            type="radio"
                                                                            className="h-3 w-3"
                                                                            value="After meal"
                                                                            checked={m.instruction === 'After meal'}
                                                                            onChange={(e) =>
                                                                                dispatch({
                                                                                    type: 'setArrayItem',
                                                                                    path: ['medicines'],
                                                                                    index: idx,
                                                                                    patch: { instruction: e.target.value },
                                                                                })
                                                                            }
                                                                        />
                                                                        <span>After meal</span>
                                                                    </label>
                                                                    <label className="inline-flex items-center gap-1">
                                                                        <input
                                                                            type="radio"
                                                                            className="h-3 w-3"
                                                                            value="Before meal"
                                                                            checked={m.instruction === 'Before meal'}
                                                                            onChange={(e) =>
                                                                                dispatch({
                                                                                    type: 'setArrayItem',
                                                                                    path: ['medicines'],
                                                                                    index: idx,
                                                                                    patch: { instruction: e.target.value },
                                                                                })
                                                                            }
                                                                        />
                                                                        <span>Before meal</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="opacity-0 group-hover/med:opacity-100 rounded border border-rose-300 bg-rose-50 px-1.5 py-1 text-xs text-rose-800 hover:bg-rose-100 transition"
                                                                onClick={() => dispatch({
                                                                    type: 'removeArrayItem',
                                                                    section: 'medicines',
                                                                    index: idx,
                                                                    min: 0,
                                                                })}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Add New Medicine Row Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            dispatch({
                                                                type: 'addArrayItem',
                                                                section: 'medicines',
                                                                item: emptyMedicine(),
                                                            });
                                                        }}
                                                        className="w-full rounded border-2 border-dashed border-[#d7dfec] bg-[#edf1fb] px-3 py-2 text-xs font-semibold text-[#3556a6] transition hover:bg-[#e4eafb] flex items-center justify-center gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add Medicine Row
                                                    </button>
                                                    
                                                    {/* Medicine Suggestions Datalist from backend medicines */}
                                                    <datalist id="medicine-suggestions">
                                                        {medicineSuggestions.map((med) => (
                                                            <option
                                                                key={med.id ?? med.name}
                                                                value={med.name}
                                                            >
                                                                {med.strength
                                                                    ? `${med.name} ${med.strength}`
                                                                    : med.name}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Advice Section - Bottom Right */}
                                    <div className="border-t-2 border-dotted border-slate-200 pt-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#3556a6]" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-slate-600">Lifestyle</label>
                                                <textarea
                                                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-900 doc-input-focus"
                                                    rows={2}
                                                    value={state.advice.lifestyle}
                                                    onChange={(e) => dispatch({
                                                        type: 'setField',
                                                        path: ['advice', 'lifestyle'],
                                                        value: e.target.value,
                                                    })}
                                                    placeholder="Lifestyle advice"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-slate-600">Diet / Rest</label>
                                                <textarea
                                                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-900 doc-input-focus"
                                                    rows={2}
                                                    value={state.advice.diet_rest}
                                                    onChange={(e) => dispatch({
                                                        type: 'setField',
                                                        path: ['advice', 'diet_rest'],
                                                        value: e.target.value,
                                                    })}
                                                    placeholder="Diet and rest instructions"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-slate-600">Follow-up Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-900 doc-input-focus"
                                                    value={state.follow_up.date}
                                                    onChange={(e) => dispatch({
                                                        type: 'setField',
                                                        path: ['follow_up', 'date'],
                                                        value: e.target.value,
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                    {/* Form Submit Section - Enhanced */}
                    <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="rounded-full bg-[#f6ece5] p-2">
                                    <CheckCircle2 className="h-5 w-5 text-[#c57945]" />
                                </div>
                                <span className="font-medium text-slate-600">
                                    Form complete and ready to submit
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                                    onClick={() => {
                                        dispatch({ type: 'reset' });
                                    }}
                                    disabled={submitting}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Form
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                                    disabled={submitting}
                                    onClick={() => handleSubmit('awaiting_tests')}
                                >
                                    {submitting && appointmentAction === 'awaiting_tests' ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FlaskConical className="h-4 w-4" />
                                            Save &amp; Send for Tests
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-xl bg-[#3556a6] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:opacity-50"
                                    disabled={submitting}
                                    onClick={() => handleSubmit('prescribed')}
                                >
                                    {submitting && appointmentAction === 'prescribed' ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save &amp; Complete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                    </div>
                </div>
            </div>
            
            {/* Bottom spacing to prevent overlap */}
            <div className="h-8"></div>
          </div>
        </DoctorLayout>
    );
}
