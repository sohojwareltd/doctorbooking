import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    FilePlus2,
    FileText,
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

export default function CreatePrescription({ appointmentId = null, contactInfo, selectedPatient, medicines = [] }) {
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

    const inputClass =
        'w-full rounded-md bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20';
    const medicineInputClass =
        'w-full rounded-md bg-gray-50/50 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20';
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

            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl">
                    
                    {/* Prescription Header - Like real prescription pad with gradient */}
                    <div className="border-b-4 border-[#005963] bg-gradient-to-r from-[#005963] via-[#007a7a] to-[#00acb1] p-8 text-white">
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
                    <div className="border-b-2 border-dashed border-gray-300 bg-gray-50 px-8 py-5">
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

                    {/* Form Main Content - Real Prescription Pad Layout */}
                    <div className="min-h-[500px] bg-white p-8 pb-12">
                        <form onSubmit={onSubmit}>
                            {/* Patient Information Section - Editable Fields Above Prescription */}
                            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                                <div className="mb-4 flex items-center gap-2 border-b border-gray-300 pb-2">
                                    <User className="h-5 w-5 text-[#005963]" />
                                    <span className="text-sm font-bold text-[#005963]">Patient Information</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Patient Name *</label>
                                        <input
                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                            value={state.patient.name}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'name'], value: e.target.value })}
                                            placeholder="Full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Contact</label>
                                        <input
                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                            value={state.patient.contact}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'contact'], value: e.target.value })}
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Age</label>
                                        <div className="flex gap-1">
                                            <input
                                                inputMode="numeric"
                                                className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                                value={state.patient.age_value}
                                                onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_value'], value: e.target.value })}
                                                placeholder="25"
                                            />
                                            <select
                                                className="w-20 rounded-md bg-gray-50/50 px-1 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                                value={state.patient.age_unit}
                                                onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_unit'], value: e.target.value })}
                                            >
                                                <option value="years">Y</option>
                                                <option value="months">M</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Gender</label>
                                        <select
                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                            value={state.patient.gender}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'gender'], value: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Weight (kg)</label>
                                        <input
                                            inputMode="decimal"
                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                            value={state.patient.weight}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'weight'], value: e.target.value })}
                                            placeholder="70"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Visit Type</label>
                                        <select
                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
                                            value={state.visit.type}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['visit', 'type'], value: e.target.value })}
                                        >
                                            <option value="New">New</option>
                                            <option value="Follow-up">Follow-up</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Pad Layout - Two Column Grid */}
                            <div className="grid grid-cols-12 gap-8">
                                
                                {/* Left Column - Narrow (Tests Top, Diagnosis Bottom) */}
                                <div className="col-span-3 space-y-6 border-r-2 border-dashed border-gray-200 pr-8">
                                    
                                    {/* Tests Section - Top Right */}
                                    <div>
                                        <div className="mb-3 flex items-center gap-2 border-b border-[#005963]/20 pb-2">
                                            <FlaskConical className="h-4 w-4 text-[#005963]" />
                                            <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Investigations</span>
                                        </div>
                                        
                                        {/* Common Tests */}
                                        <div className="mb-3">
                                            <div className="mb-2 text-xs font-semibold text-gray-700">Common Tests</div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {COMMON_TESTS.map((test) => (
                                                    <label key={test} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                                            <div className="mb-2 text-xs font-semibold text-gray-700">Custom Tests</div>
                                            <div className="space-y-1.5">
                                                {(state.investigations.custom || []).map((test, idx) => (
                                                    <div key={idx} className="flex gap-1">
                                                        <input
                                                            className="w-full rounded-md bg-gray-50/50 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                    className="w-full rounded border border-[#005963]/50 bg-[#005963]/5 px-2 py-1 text-xs font-semibold text-[#005963] hover:bg-[#005963]/10"
                                                    onClick={() => dispatch({ type: 'addCustomTest' })}
                                                >
                                                    + Add Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Diagnosis & Complaints Section - Bottom Right */}
                                    <div>
                                        <div className="mb-3 flex items-center gap-2 border-b border-[#005963]/20 pb-2">
                                            <Stethoscope className="h-4 w-4 text-[#005963]" />
                                            <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Diagnosis</span>
                                        </div>
                                        
                                        {/* Provisional Diagnosis */}
                                        <div className="mb-3">
                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Provisional</label>
                                            <textarea
                                                className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Final</label>
                                            <textarea
                                                className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                <label className="text-xs font-semibold text-gray-700">Complaints</label>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({
                                                        type: 'addArrayItem',
                                                        section: 'complaints',
                                                        item: emptyComplaint(),
                                                    })}
                                                    className="text-[10px] text-[#005963] hover:underline"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {(state.complaints || []).map((c, idx) => (
                                                    <div key={idx} className="space-y-1 rounded border border-gray-200 bg-white p-1.5">
                                                        <input
                                                            className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                            className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                        <div className="mt-3 border-t border-gray-200 pt-3">
                                            <div className="mb-2 text-xs font-semibold text-gray-700">Vitals</div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div>
                                                    <input
                                                        className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                        className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                        className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                        className="w-full rounded bg-gray-50/50 px-1.5 py-1 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                            <div className="text-5xl font-serif font-bold italic text-[#005963]">℞</div>
                                            <div className="flex-1 pt-2">
                                                {/* Medicine Rows - Dynamic */}
                                                <div className="space-y-2">
                                                    {(state.medicines || []).map((m, idx) => (
                                                        <div key={idx} className="group/med flex items-start gap-2 rounded border border-gray-200 bg-white p-2 hover:border-[#005963] hover:bg-gray-50">
                                                            <span className="mt-1 text-xs font-bold text-gray-500">{idx + 1}.</span>
                                                            <div className="flex-1 grid grid-cols-6 gap-2">
                                                                <input
                                                                    className="col-span-2 rounded bg-gray-50/50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                                    className="rounded bg-gray-50/50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                                    className="rounded bg-gray-50/50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                                    className="rounded bg-gray-50/50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                            <div className="flex flex-col gap-1 text-xs text-gray-700">
                                                                <span className="font-semibold">Timing</span>
                                                                <div className="flex items-center gap-3">
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
                                                        className="w-full rounded border-2 border-dashed border-[#005963]/30 bg-[#005963]/5 px-3 py-2 text-xs font-semibold text-[#005963] hover:bg-[#005963]/10 transition flex items-center justify-center gap-1"
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
                                    <div className="border-t-2 border-dotted border-gray-200 pt-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#005963]" />
                                            <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Advice</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-gray-700">Lifestyle</label>
                                                <textarea
                                                    className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                <label className="mb-1 block text-xs font-semibold text-gray-700">Diet / Rest</label>
                                                <textarea
                                                    className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                                                <label className="mb-1 block text-xs font-semibold text-gray-700">Follow-up Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-md bg-gray-50/50 px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#005963]/20"
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
                    <div className="mt-10 rounded-2xl border-2 border-[#005963]/30 bg-gradient-to-r from-[#005963]/5 to-transparent p-6 shadow-md">
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
            
            {/* Bottom spacing to prevent overlap */}
            <div className="h-8"></div>
        </DoctorLayout>
    );
}
