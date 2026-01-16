import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    FilePlus2,
    FlaskConical,
    Heart,
    Mail,
    MapPin,
    MessageCircle,
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
import GlassCard from '../../components/GlassCard';
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

const MEDICINE_SUGGESTIONS = [
    'Paracetamol',
    'Omeprazole',
    'Esomeprazole',
    'Cefixime',
    'Azithromycin',
    'Metformin',
    'Amlodipine',
    'Losartan',
    'Cetirizine',
    'Montelukast',
    'Salbutamol',
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

export default function CreatePrescription({ appointmentId = null, contactInfo, selectedPatient }) {
    const page = usePage();
    const authUser = page?.props?.auth?.user;
    const prescriptionSettings = page?.props?.site?.prescription || {};
    
    // Clinic info from contactInfo or fallback to prescriptionSettings
    const clinicData = contactInfo?.clinic || {};
    const clinicName = clinicData?.name || prescriptionSettings?.clinicName || page?.props?.name || 'MediCare';
    const clinicAddress = [
        clinicData?.line1,
        clinicData?.line2,
        clinicData?.line3
    ].filter(Boolean).join(', ') || prescriptionSettings?.address || authUser?.address || '';
    
    // Contact methods from contactInfo
    const contactMethods = contactInfo?.methods || [];
    const phoneMethod = contactMethods.find(m => m.icon === 'Phone' || m.title?.toLowerCase().includes('call'));
    const whatsappMethod = contactMethods.find(m => m.icon === 'MessageCircle' || m.title?.toLowerCase().includes('whatsapp'));
    const emailMethod = contactMethods.find(m => m.icon === 'Mail' || m.title?.toLowerCase().includes('email'));
    
    const contactPhone = phoneMethod?.value || prescriptionSettings?.phone || authUser?.phone || page?.props?.site?.contactPhone || '';
    const contactWhatsApp = whatsappMethod?.value || '';
    const contactEmail = emailMethod?.value || prescriptionSettings?.email || authUser?.email || page?.props?.site?.contactEmail || '';
    
    const clinicLogoUrl = prescriptionSettings?.logoUrl || '';
    const clinicRegistration = prescriptionSettings?.registrationNo || authUser?.registration_no || '';
    const clinicWebsite = prescriptionSettings?.website || page?.props?.site?.website || '';
    const footerNote = prescriptionSettings?.footerNote || '';

    const [state, dispatch] = useReducer(reducer, initialState);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [appointmentId, setAppointmentId] = useState('');
    
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

    const inputClass =
        'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20';
    const medicineInputClass =
        'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20';
    const labelClass = 'mb-2 block text-xs font-semibold text-[#005963]';
    const helperClass = 'mt-1 text-xs text-gray-600';
    const errorClass = 'mt-1 text-xs font-semibold text-rose-700';
    const sectionTitleClass = 'text-base font-extrabold text-[#005963]';
    const sectionSubClass = 'mt-1 text-xs text-gray-600';
    const chipClass =
        'inline-flex items-center gap-2 rounded-full border border-[#00acb1]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963]';

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

    const onSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        // Validate patient name
        if (!state.patient.name?.trim()) {
            const message = 'Please enter patient name.';
            setError(message);
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
                setError(msg);
                toastError(msg);
                return;
            }

            setSuccess('Prescription saved successfully. Redirecting...');
            toastSuccess('Prescription saved successfully.');
            const data = await res.json().catch(() => ({}));
            const prescriptionId = data?.prescription_id;
            if (prescriptionId) {
                setTimeout(() => router.visit(`/doctor/prescriptions/${prescriptionId}`), 400);
            } else {
                setTimeout(() => router.visit('/doctor/prescriptions'), 400);
            }
        } catch {
            const message = 'Network error. Please try again.';
            setError(message);
            toastError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DoctorLayout title="Create Prescription">
            {/* Hero Header Section with Gradient */}
            <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#005963] via-[#00acb1] to-[#005963] p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                            <FilePlus2 className="h-10 w-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">
                                Create Prescription
                            </h1>
                            <p className="mt-2 text-white/90">
                                Fast, touch-friendly prescription form for
                                patient visits
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/doctor/prescriptions"
                        className="rounded-2xl bg-white/20 px-6 py-3 font-semibold backdrop-blur-sm transition hover:bg-white/30"
                    >
                        ← Back to List
                    </Link>
                </div>
            </div>

            {/* Alert Messages with Icons */}
            {(success || error) && (
                <div
                    className={`animate-in slide-in-from-top mb-6 duration-300`}
                >
                    <GlassCard
                        variant="solid"
                        className={`p-5 ${success ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100/60' : 'border-rose-300 bg-gradient-to-r from-rose-50 to-rose-100/60'}`}
                    >
                        <div className="flex items-center gap-3">
                            {success ? (
                                <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                            ) : (
                                <AlertCircle className="h-6 w-6 flex-shrink-0 text-rose-600" />
                            )}
                            <div
                                className={`text-sm font-semibold ${success ? 'text-emerald-900' : 'text-rose-900'}`}
                            >
                                {success || error}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Prescription Header Card - Like real prescription pad (Matching PrescriptionShow) */}

            <div className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl">
                    
                    {/* Prescription Header - Like real prescription pad with gradient */}
                    <div className="border-b-4 border-[#005963] bg-gradient-to-r from-[#005963] via-[#007a7a] to-[#00acb1] p-6 text-white">
                        <div className="flex items-start justify-between">
                            {/* Doctor Info - Left */}
                            <div className="flex-1">
                                <div className="text-2xl font-black tracking-wide">{authUser?.name || 'Doctor'}</div>
                                <div className="mt-1 text-sm font-medium opacity-90">{authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}</div>
                                {authUser?.phone && (
                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4" />
                                        <span>{authUser.phone}</span>
                                    </div>
                                )}
                                {authUser?.email && (
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4" />
                                        <span>{authUser.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Clinic Info - Right */}
                            <div className="text-right">
                                <div className="text-lg font-bold">{clinicName}</div>
                                {clinicRegistration && (
                                    <div className="text-[10px] font-medium opacity-70">Reg. No: {clinicRegistration}</div>
                                )}
                                
                                {/* Our Clinic Info */}
                                {clinicAddress && (
                                    <div className="mt-2 pt-1.5 border-t border-white/20">
                                        <div className="text-[10px] font-semibold opacity-80 mb-0.5">Our Clinic</div>
                                        <div className="flex items-start justify-end gap-1 text-[10px] opacity-75">
                                            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                                            <span className="max-w-xs leading-tight">{clinicAddress}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Contact Information */}
                                <div className="mt-2 pt-1.5 border-t border-white/20 space-y-0.5">
                                    {contactPhone && (
                                        <div className="flex items-center justify-end gap-1 text-[10px]">
                                            <Phone className="h-2.5 w-2.5" />
                                            <span className="font-medium">Call:</span>
                                            <span className="opacity-90">{contactPhone}</span>
                                        </div>
                                    )}
                                    {contactWhatsApp && (
                                        <div className="flex items-center justify-end gap-1 text-[10px]">
                                            <MessageCircle className="h-2.5 w-2.5" />
                                            <span className="font-medium">WhatsApp:</span>
                                            <span className="opacity-90">{contactWhatsApp}</span>
                                        </div>
                                    )}
                                    {contactEmail && (
                                        <div className="flex items-center justify-end gap-1 text-[10px]">
                                            <Mail className="h-2.5 w-2.5" />
                                            <span className="font-medium">Email:</span>
                                            <span className="opacity-90">{contactEmail}</span>
                                        </div>
                                    )}
                                    {clinicWebsite && (
                                        <div className="text-[9px] opacity-60 mt-0.5">{clinicWebsite}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info Bar - Dynamic */}
                    <div className="border-b-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase text-gray-500">Patient:</span>
                                    <span className="text-base font-bold text-gray-900">{state.patient.name || '—'}</span>
                                </div>
                                {state.patient.age_value && (
                                    <div className="flex items-center gap-1 text-sm text-gray-700">
                                        <span className="font-semibold">{state.patient.age_value}</span>
                                        <span>{state.patient.age_unit}</span>
                                    </div>
                                )}
                                {state.patient.gender && (
                                    <div className="text-sm text-gray-700">{state.patient.gender}</div>
                                )}
                                {state.patient.weight && (
                                    <div className="text-sm text-gray-700">{state.patient.weight} kg</div>
                                )}
                                {state.patient.contact && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Phone className="h-3 w-3" />
                                        {state.patient.contact}
                                    </div>
                                )}
                                {state.visit.type && (
                                    <div className="rounded-full border border-[#00acb1]/40 bg-[#00acb1]/10 px-2 py-0.5 text-xs font-semibold text-[#005963]">
                                        {state.visit.type}
                                    </div>
                                )}
                                {visitDateLabel && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Calendar className="h-3 w-3" />
                                        {visitDateLabel}
                                    </div>
                                )}
                            </div>
                            {state.follow_up.date && (
                                <div className="flex items-center gap-2 rounded-lg border border-[#005963]/30 bg-[#005963]/5 px-3 py-1.5">
                                    <Calendar className="h-4 w-4 text-[#005963]" />
                                    <span className="text-xs font-bold text-[#005963]">Follow-up: {followUpDateLabel}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Main Content */}
                    <div className="min-h-[500px] bg-white p-6">
                        <form onSubmit={onSubmit} className="space-y-10">
                    {/* Patient Information Section */}
                    <div className="group">
                        <div className="mb-6 flex items-center gap-2">
                            <User className="h-6 w-6 text-[#005963]" />
                            <div>
                                <div className={sectionTitleClass}>
                                    Patient Information
                                </div>
                                <div className={sectionSubClass}>
                                    Enter patient details and visit information
                                </div>
                            </div>
                        </div>

                        <GlassCard
                            variant="solid"
                            className="border border-[#00acb1]/30 bg-white p-6 shadow-md"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        Patient Name *
                                    </label>
                                    <input
                                        className={inputClass}
                                        value={state.patient.name}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['patient', 'name'],
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="Patient full name"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Contact Number
                                    </label>
                                    <input
                                        className={inputClass}
                                        value={state.patient.contact}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['patient', 'contact'],
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 01XXXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Age</label>
                                    <div className="flex gap-2">
                                        <input
                                            inputMode="numeric"
                                            className={`${inputClass} flex-1`}
                                            value={state.patient.age_value}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: [
                                                        'patient',
                                                        'age_value',
                                                    ],
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 25"
                                        />
                                        <select
                                            className="w-32 rounded-2xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm"
                                            value={state.patient.age_unit}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: [
                                                        'patient',
                                                        'age_unit',
                                                    ],
                                                    value: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="years">Years</option>
                                            <option value="months">
                                                Months
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Gender</label>
                                    <select
                                        className={inputClass}
                                        value={state.patient.gender}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['patient', 'gender'],
                                                value: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Weight (kg)
                                    </label>
                                    <input
                                        inputMode="decimal"
                                        className={inputClass}
                                        value={state.patient.weight}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['patient', 'weight'],
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Visit Type
                                    </label>
                                    <select
                                        className={inputClass}
                                        value={state.visit.type}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['visit', 'type'],
                                                value: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="New">New</option>
                                        <option value="Follow-up">
                                            Follow-up
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Complaints & Examination */}
                    <div className="group">
                        <div className="mb-6 flex items-center gap-2">
                            <Stethoscope className="h-6 w-6 text-[#005963]" />
                            <div>
                                <div className={sectionTitleClass}>
                                    Complaints & Examination
                                </div>
                                <div className={sectionSubClass}>
                                    Document symptoms and vital signs
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <GlassCard
                                variant="solid"
                                className="border border-[#00acb1]/30 bg-white p-6 shadow-md"
                            >
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-[#005963]">
                                        Chief Complaints
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {(state.complaints || []).map((c, idx) => (
                                        <div
                                            key={idx}
                                            className="space-y-2 rounded-xl border border-[#00acb1]/20 bg-white p-3"
                                        >
                                            <input
                                                className={inputClass}
                                                value={c.description}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: 'setArrayItem',
                                                        path: ['complaints'],
                                                        index: idx,
                                                        patch: {
                                                            description:
                                                                e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Complaint description"
                                            />
                                            <input
                                                className={inputClass}
                                                value={c.duration}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: 'setArrayItem',
                                                        path: ['complaints'],
                                                        index: idx,
                                                        patch: {
                                                            duration:
                                                                e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="Duration (e.g., 3 days)"
                                            />
                                            {(state.complaints || []).length >
                                                1 && (
                                                <button
                                                    type="button"
                                                    className="w-full rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800"
                                                    onClick={() =>
                                                        dispatch({
                                                            type: 'removeArrayItem',
                                                            section:
                                                                'complaints',
                                                            index: idx,
                                                            min: 1,
                                                        })
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#005963]/50 bg-[#005963]/5 px-4 py-3 text-sm font-semibold text-[#005963] transition hover:bg-[#005963]/10"
                                        onClick={() =>
                                            dispatch({
                                                type: 'addArrayItem',
                                                section: 'complaints',
                                                item: emptyComplaint(),
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4 transition group-hover/btn:scale-110" />
                                        Add Complaint
                                    </button>
                                </div>
                            </GlassCard>

                            <GlassCard
                                variant="solid"
                                className="border border-[#00acb1]/30 bg-white p-6 shadow-md"
                            >
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-[#005963]">
                                        Clinical Examination
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <div>
                                        <label className={labelClass}>
                                            BP (mmHg)
                                        </label>
                                        <input
                                            className={inputClass}
                                            value={state.exam.bp}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: ['exam', 'bp'],
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. 120/80"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700">
                                                Pulse (bpm)
                                            </label>
                                            <input
                                                className={inputClass}
                                                value={state.exam.pulse}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: 'setField',
                                                        path: ['exam', 'pulse'],
                                                        value: e.target.value,
                                                    })
                                                }
                                                placeholder="72"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700">
                                                Temp (┬░C)
                                            </label>
                                            <input
                                                className={inputClass}
                                                value={state.exam.temperature}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: 'setField',
                                                        path: [
                                                            'exam',
                                                            'temperature',
                                                        ],
                                                        value: e.target.value,
                                                    })
                                                }
                                                placeholder="98.6"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700">
                                                SpO₂ (%)
                                            </label>
                                            <input
                                                className={inputClass}
                                                value={state.exam.spo2}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: 'setField',
                                                        path: ['exam', 'spo2'],
                                                        value: e.target.value,
                                                    })
                                                }
                                                placeholder="98"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Clinical Notes
                                        </label>
                                        <textarea
                                            className={inputClass}
                                            rows={2}
                                            value={state.exam.notes}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: ['exam', 'notes'],
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="Additional notes"
                                        />
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Diagnosis & Treatment */}
                    <div className="group">
                        <div className="mb-6 flex items-center gap-2">
                            <Pill className="h-6 w-6 text-[#005963]" />
                            <div>
                                <div className={sectionTitleClass}>
                                    Diagnosis & Treatment
                                </div>
                                <div className={sectionSubClass}>
                                    Diagnosis and medication prescription
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis Section */}
                        <GlassCard
                            variant="solid"
                            className="mb-6 border border-[#00acb1]/30 bg-white p-6 shadow-md"
                        >
                            <div className="mb-5 flex items-center gap-2 border-b-2 border-[#005963]/10 pb-3">
                                <Stethoscope className="h-5 w-5 text-[#005963]" />
                                <div className="text-base font-bold text-[#005963]">
                                    Diagnosis
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        Provisional Diagnosis
                                    </label>
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={state.diagnosis.provisional}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: [
                                                    'diagnosis',
                                                    'provisional',
                                                ],
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="Initial diagnosis"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Final Diagnosis
                                    </label>
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={state.diagnosis.final}
                                        onChange={(e) =>
                                            dispatch({
                                                type: 'setField',
                                                path: ['diagnosis', 'final'],
                                                value: e.target.value,
                                            })
                                        }
                                        placeholder="Confirmed diagnosis (optional)"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Medications Section - Form + Table View */}
                        <GlassCard
                            variant="solid"
                            className="border-2 border-[#005963]/30 bg-white p-6 shadow-lg"
                        >
                            <div className="mb-6 flex items-center gap-3 border-b-2 border-[#005963]/20 pb-4">
                                <div className="rounded-xl bg-gradient-to-br from-[#005963] to-[#00acb1] p-2">
                                    <Pill className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-[#005963]">
                                        Medications Management
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Add and manage prescribed medications
                                    </div>
                                </div>
                            </div>

                            {/* Add Medicine Form */}
                            <div className="mb-6 rounded-2xl border-2 border-[#005963]/20 bg-gray-50 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm font-bold text-[#005963]">
                                        Add New Medicine
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        Fill the form and click Add Medicine
                                    </span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                    <div className="lg:col-span-2">
                                        <label className="mb-2 block text-xs font-bold text-[#005963]">
                                            Medicine Name *
                                        </label>
                                        <input
                                            list="medicine-suggestions"
                                            className="w-full rounded-xl border-2 border-[#00acb1]/40 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#00acb1]/20"
                                            value={newMedicine.name}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                                            placeholder="e.g., Paracetamol"
                                        />
                                        <datalist id="medicine-suggestions">
                                            {MEDICINE_SUGGESTIONS.map((s) => (
                                                <option key={s} value={s} />
                                            ))}
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold text-[#005963]">
                                            Strength
                                        </label>
                                        <input
                                            className="w-full rounded-xl border-2 border-[#00acb1]/40 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#00acb1]/20"
                                            value={newMedicine.strength}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, strength: e.target.value })}
                                            placeholder="500mg"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold text-[#005963]">
                                            Dosage
                                        </label>
                                        <input
                                            className="w-full rounded-xl border-2 border-[#00acb1]/40 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#00acb1]/20"
                                            value={newMedicine.dosage}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                                            placeholder="1+0+1"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold text-[#005963]">
                                            Duration
                                        </label>
                                        <input
                                            className="w-full rounded-xl border-2 border-[#00acb1]/40 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#00acb1]/20"
                                            value={newMedicine.duration}
                                            onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                                            placeholder="5 days"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-bold text-[#005963]">
                                        When to Take
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-md transition ${
                                                newMedicine.instruction === 'Before meal'
                                                    ? 'border-[#005963] bg-[#005963] text-white'
                                                    : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#005963]/50'
                                            }`}
                                            onClick={() => setNewMedicine({ ...newMedicine, instruction: 'Before meal' })}
                                        >
                                            🍽️ Before Meal
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-md transition ${
                                                newMedicine.instruction === 'After meal'
                                                    ? 'border-[#005963] bg-[#005963] text-white'
                                                    : 'border-[#00acb1]/30 bg-white text-[#005963] hover:border-[#005963]/50'
                                            }`}
                                            onClick={() => setNewMedicine({ ...newMedicine, instruction: 'After meal' })}
                                        >
                                            🍴 After Meal
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => {
                                            if (newMedicine.name.trim()) {
                                                dispatch({
                                                    type: 'addArrayItem',
                                                    section: 'medicines',
                                                    item: {
                                                        name: newMedicine.name.trim(),
                                                        strength: newMedicine.strength.trim(),
                                                        dosage: newMedicine.dosage.trim(),
                                                        duration: newMedicine.duration.trim(),
                                                        instruction: newMedicine.instruction,
                                                    },
                                                });
                                                // Clear form
                                                setNewMedicine({
                                                    name: '',
                                                    strength: '',
                                                    dosage: '',
                                                    duration: '',
                                                    instruction: 'After meal',
                                                });
                                                toastSuccess('Medicine added successfully');
                                            } else {
                                                toastError('Please enter medicine name');
                                            }
                                        }}
                                        disabled={!newMedicine.name.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Medicine
                                    </button>
                                </div>
                            </div>

                            {/* Medicines Table View */}
                            {(state.medicines || []).length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-[#00acb1]/30 bg-white/80 p-8 text-center">
                                    <Pill className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p className="font-semibold text-gray-600">
                                        No medications added yet
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Fill the form above and click "Add
                                        Medicine"
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border-2 border-[#005963]/20 bg-white shadow-md">
                                    <div className="bg-gradient-to-r from-[#005963] to-[#00acb1] px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-white">
                                                <ClipboardList className="h-5 w-5" />
                                                <span className="font-bold">
                                                    Prescribed Medications
                                                </span>
                                            </div>
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                                                {(state.medicines || []).length}{' '}
                                                {(state.medicines || [])
                                                    .length === 1
                                                    ? 'Medicine'
                                                    : 'Medicines'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b-2 border-[#005963]/10 bg-[#005963]/5">
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        #
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        Medicine Name
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        Strength
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        Dosage
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        Duration
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#005963]">
                                                        When
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#005963]">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(state.medicines || []).map(
                                                    (m, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className="border-b border-[#00acb1]/10 transition hover:bg-[#005963]/5"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#005963]/10 text-xs font-bold text-[#005963]">
                                                                    {idx + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold text-gray-900">
                                                                    {m.name ||
                                                                        '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {m.strength ||
                                                                    '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {m.dosage ||
                                                                    '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {m.duration ||
                                                                    '-'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                        m.instruction ===
                                                                        'Before meal'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                    }`}
                                                                >
                                                                    {m.instruction ===
                                                                    'Before meal'
                                                                        ? '🍽️'
                                                                        : '🍴'}{' '}
                                                                    {
                                                                        m.instruction
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center gap-1 rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                                    onClick={() =>
                                                                        dispatch(
                                                                            {
                                                                                type: 'removeArrayItem',
                                                                                section:
                                                                                    'medicines',
                                                                                index: idx,
                                                                                min: 0,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Investigations & Advice */}
                    <div className="group">
                        <div className="mb-6 flex items-center gap-2">
                            <FlaskConical className="h-6 w-6 text-[#005963]" />
                            <div>
                                <div className={sectionTitleClass}>
                                    Tests & Follow-up
                                </div>
                                <div className={sectionSubClass}>
                                    Investigations and patient guidance
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <GlassCard
                                variant="solid"
                                className="border border-[#00acb1]/30 bg-white p-6 shadow-md"
                            >
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-[#005963]">
                                        Investigations
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="mb-2 text-xs font-semibold text-gray-700">
                                            Common Tests
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {COMMON_TESTS.map((test) => (
                                                <label
                                                    key={test}
                                                    className="flex items-center gap-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            state.investigations
                                                                .common[test] ||
                                                            false
                                                        }
                                                        onChange={(e) =>
                                                            dispatch({
                                                                type: 'setNestedField',
                                                                path: [
                                                                    'investigations',
                                                                    'common',
                                                                    test,
                                                                ],
                                                                value: e.target
                                                                    .checked,
                                                            })
                                                        }
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">
                                                        {test}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2 text-xs font-semibold text-gray-700">
                                            Custom Tests
                                        </div>
                                        <div className="space-y-2">
                                            {(
                                                state.investigations.custom ||
                                                []
                                            ).map((test, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <input
                                                        className={`${inputClass} flex-1`}
                                                        value={test}
                                                        onChange={(e) =>
                                                            dispatch({
                                                                type: 'setCustomTest',
                                                                index: idx,
                                                                value: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Add custom test"
                                                    />
                                                    {(
                                                        state.investigations
                                                            .custom || []
                                                    ).length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800"
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: 'removeCustomTest',
                                                                    index: idx,
                                                                })
                                                            }
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="w-full rounded-lg border border-[#005963]/50 bg-[#005963]/5 px-2 py-1 text-xs font-semibold text-[#005963]"
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'addCustomTest',
                                                    })
                                                }
                                            >
                                                + Add Custom Test
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard
                                variant="solid"
                                className="border border-[#00acb1]/30 bg-white p-6 shadow-md"
                            >
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-[#005963]">
                                        Advice & Follow-up
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass}>
                                            Lifestyle Advice
                                        </label>
                                        <textarea
                                            className={inputClass}
                                            rows={2}
                                            value={state.advice.lifestyle}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: [
                                                        'advice',
                                                        'lifestyle',
                                                    ],
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Rest, avoid stress..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Diet / Rest Instructions
                                        </label>
                                        <textarea
                                            className={inputClass}
                                            rows={2}
                                            value={state.advice.diet_rest}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: [
                                                        'advice',
                                                        'diet_rest',
                                                    ],
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Light diet, bed rest..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Follow-up Date
                                        </label>
                                        <input
                                            type="date"
                                            className={inputClass}
                                            value={state.follow_up.date}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'setField',
                                                    path: ['follow_up', 'date'],
                                                    value: e.target.value,
                                                })
                                            }
                                        />
                                        {followUpDateLabel && (
                                            <div className={helperClass}>
                                                📅 {followUpDateLabel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Form Submit Section - Enhanced */}
                    <div className="rounded-2xl border-2 border-[#005963]/30 bg-gradient-to-r from-[#005963]/5 to-transparent p-6 shadow-md">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="rounded-full bg-emerald-100 p-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <span className="font-semibold text-gray-700">
                                    Form complete and ready to submit
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-2xl border-2 border-[#005963]/30 bg-white px-6 py-3 text-sm font-semibold text-[#005963] shadow-sm transition hover:bg-[#005963]/5 hover:shadow-md disabled:opacity-50"
                                    onClick={() => {
                                        dispatch({ type: 'reset' });
                                        setSuccess('');
                                        setError('');
                                    }}
                                    disabled={submitting}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Form
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Prescription
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
        </DoctorLayout>
    );
}
