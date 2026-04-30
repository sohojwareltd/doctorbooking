import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Download,
    Eye,
    FileText,
    FileUp,
    FlaskConical,
    HeartHandshake,
    HeartPulse,
    Mail,
    MapPin,
    Phone,
    Pill,
    Plus,
    RotateCcw,
    Save,
    ShieldCheck,
    Stethoscope,
    Trash2,
    Upload,
    User,
    X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocCard } from '../../components/doctor/DocUI';
import PrescriptionMedicineSection from '../../components/prescription/PrescriptionFormSection';
import { toastError, toastSuccess } from '../../utils/toast';

const emptyComplaint = () => ({ description: '', duration: '' });
const emptyMedicine = () => ({
    name: '',
    strength: '',
    dosage: '',
    duration: '',
    instruction: '',
});

const todayYmd = () => new Date().toISOString().split('T')[0];

function normalizeMedicineName(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanInvestigationLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
        .replace(/^[-*•\u2022\d.)\s]+/, '')
        .replace(/\s*[:\-]+\s*$/, '')
        .trim();
}

function splitLegacyInvestigationsText(value) {
    const text = String(value || '').trim();
    if (!text) return [];

    return text
        .split(/\n|,|;/)
        .map((part) => cleanInvestigationLabel(part))
        .filter(Boolean);
}

function findBestCatalogInvestigation(catalogSource, rawName) {
    const clean = cleanInvestigationLabel(rawName);
    const normalized = normalizeText(clean).replace(/[^a-z0-9]+/g, '');
    if (!normalized) return null;

    for (const candidate of catalogSource) {
        const candidateNorm = normalizeText(candidate).replace(/[^a-z0-9]+/g, '');
        if (!candidateNorm) continue;
        if (candidateNorm === normalized) return candidate;
    }

    for (const candidate of catalogSource) {
        const candidateNorm = normalizeText(candidate).replace(/[^a-z0-9]+/g, '');
        if (!candidateNorm) continue;
        if (normalized.includes(candidateNorm) || candidateNorm.includes(normalized)) {
            return candidate;
        }
    }

    return null;
}

function buildMedicineWithStrength(name, strength) {
    const cleanName = String(name || '').trim();
    const cleanStrength = String(strength || '').trim();
    if (!cleanName) return '';
    return cleanStrength ? `${cleanName} ${cleanStrength}` : cleanName;
}

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
        weight: '',
        notes: '',
    },
    diagnosis: {
        provisional: '',
        final: '',
        complaints_text: '',
    },
    medicines: [],
    investigations: {
        common: {},
        commonSample: {},
        custom: [''],
        notes: '',
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

function parseMedicationsText(text, doseText = '') {
    if (!String(text || '').trim()) return [emptyMedicine()];

    const doseLines = String(doseText || '')
        .split('\n')
        .map((line) => line.trim());

    const rows = String(text)
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line, index) => {
            const parts = line.split(' - ');
            const name = String(parts[0] || '').trim();
            const dosage = String(parts[1] || '').trim();
            const duration = String(parts[2] || '').trim();
            const instruction = String(parts[3] || '').trim();
            return {
                name,
                strength: '',
                dosage,
                duration,
                instruction,
            };
        })
        .map((row, index) => ({
            ...row,
            dosage: row.dosage || doseLines[index] || '',
        }));

    return rows.length ? rows : [emptyMedicine()];
}

function parseInvestigationRows(items, testsText = '') {
    if (Array.isArray(items) && items.length) {
        const rows = [...items]
            .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0))
            .map((item) => cleanInvestigationLabel(item?.name))
            .filter(Boolean);
        if (rows.length) return rows;
    }

    const fromText = splitLegacyInvestigationsText(testsText);

    return fromText.length ? fromText : [''];
}

function parseDiagnosisText(text = '') {
    const diagnosisText = String(text || '');
    const lines = diagnosisText.split('\n').map((line) => line.trim());

    const complaints = [];
    let inComplaints = false;

    let provisional = '';
    let finalDiagnosis = '';
    let bp = '';
    let pulse = '';
    let temperature = '';
    let weight = '';
    let examNotes = '';

    lines.forEach((line) => {
        if (!line) {
            inComplaints = false;
            return;
        }

        if (/^Chief Complaints:/i.test(line)) {
            inComplaints = true;
            return;
        }

        if (inComplaints && line.startsWith('-')) {
            const complaint = line.replace(/^-\s*/, '').trim();
            if (complaint) complaints.push({ description: complaint, duration: '' });
            return;
        }

        if (/^Provisional Diagnosis:/i.test(line)) {
            provisional = line.replace(/^Provisional Diagnosis:\s*/i, '').trim();
            return;
        }

        if (/^Final Diagnosis:/i.test(line)) {
            finalDiagnosis = line.replace(/^Final Diagnosis:\s*/i, '').trim();
            return;
        }

        if (/^Vitals:/i.test(line) || /^OE:/i.test(line)) {
            const vitalsPart = line.replace(/^(Vitals|OE):\s*/i, '').trim();
            vitalsPart.split(',').map((part) => part.trim()).forEach((part) => {
                if (/^BP\s+/i.test(part)) bp = part.replace(/^BP\s+/i, '').trim();
                if (/^(Pulse|P)\s+/i.test(part)) pulse = part.replace(/^(Pulse|P)\s+/i, '').trim();
                if (/^(Temp|T)\s+/i.test(part)) temperature = part.replace(/^(Temp|T)\s+/i, '').trim();
                if (/^(SpO₂|SpO2|Wt|Weight)\s+/i.test(part)) {
                    weight = part.replace(/^(SpO₂|SpO2|Wt|Weight)\s+/i, '').trim();
                }
            });
            return;
        }

        if (/^Exam Notes:/i.test(line)) {
            examNotes = line.replace(/^Exam Notes:\s*/i, '').trim();
        }
    });

    return {
        complaints: complaints.length ? complaints : [emptyComplaint()],
        diagnosis: {
            provisional,
            final: finalDiagnosis,
        },
        exam: {
            bp,
            pulse,
            temperature,
            weight,
            notes: examNotes,
        },
    };
}

function parseInstructionsText(text = '') {
    const raw = String(text || '').trim();
    if (!raw) {
        return {
            lifestyle: '',
            diet_rest: '',
            emergency_note: 'If symptoms worsen or persist, seek emergency care immediately.',
        };
    }

    const lines = raw.split('\n');
    let section = '';
    const bucket = {
        lifestyle: [],
        diet_rest: [],
        emergency_note: [],
    };

    lines.forEach((line) => {
        const value = String(line || '');
        if (/^Lifestyle Advice:/i.test(value)) {
            section = 'lifestyle';
            const rest = value.replace(/^Lifestyle Advice:\s*/i, '').trim();
            if (rest) bucket.lifestyle.push(rest);
            return;
        }
        if (/^Diet\s*\/\s*Rest:/i.test(value)) {
            section = 'diet_rest';
            const rest = value.replace(/^Diet\s*\/\s*Rest:\s*/i, '').trim();
            if (rest) bucket.diet_rest.push(rest);
            return;
        }
        if (/^Emergency Note:/i.test(value)) {
            section = 'emergency_note';
            const rest = value.replace(/^Emergency Note:\s*/i, '').trim();
            if (rest) bucket.emergency_note.push(rest);
            return;
        }

        if (section) {
            bucket[section].push(value.trim());
            return;
        }

        bucket.emergency_note.push(value.trim());
    });

    const lifestyle = bucket.lifestyle.join('\n').trim();
    const diet_rest = bucket.diet_rest.join('\n').trim();
    const emergency_note = bucket.emergency_note.join('\n').trim() || 'If symptoms worsen or persist, seek emergency care immediately.';

    return { lifestyle, diet_rest, emergency_note };
}

function buildStateFromPrescription(prescription) {
    if (!prescription) return initialState;

    const parsedDiagnosis = parseDiagnosisText(prescription.diagnosis || '');
    const parsedInstructions = parseInstructionsText(prescription.instructions || '');

    const parsedOeData = Array.isArray(prescription.oe_data) ? prescription.oe_data : [];
    const oeByKey = Object.fromEntries(
        parsedOeData
            .map((item) => [String(item?.key || '').trim().toUpperCase(), String(item?.value || '').trim()])
            .filter(([key, value]) => key && value),
    );

    return {
        ...initialState,
        patient: {
            name: String(prescription.patient_name || '').trim(),
            age_value: String(prescription.patient_age || '').trim(),
            age_unit: String(prescription.patient_age_unit || 'years').trim(),
            gender: String(prescription.patient_gender || '').trim(),
            weight: String(prescription.patient_weight || '').trim(),
            contact: String(prescription.patient_contact || '').trim(),
        },
        visit: {
            date: String(prescription.created_at || '').slice(0, 10) || todayYmd(),
            type: String(prescription.visit_type || 'New').trim(),
        },
        exam: {
            ...parsedDiagnosis.exam,
            pulse: oeByKey.P ?? oeByKey.PULSE ?? parsedDiagnosis.exam.pulse,
            bp: oeByKey.BP ?? parsedDiagnosis.exam.bp,
            temperature: oeByKey.T ?? oeByKey.TEMP ?? oeByKey.TEMPERATURE ?? parsedDiagnosis.exam.temperature,
            weight: oeByKey.WT ?? oeByKey.WEIGHT ?? parsedDiagnosis.exam.weight,
        },
        diagnosis: {
            ...parsedDiagnosis.diagnosis,
            complaints_text: String(prescription.chief_complaints || '').trim() || parsedDiagnosis.complaints
                .map((c) => String(c.description || '').trim())
                .filter(Boolean)
                .join('\n'),
        },
        medicines: parseMedicationsText(prescription.medications || '', prescription.dose || ''),
        investigations: {
            common: {},
            commonSample: (() => {
                const sampleMap = {};
                if (Array.isArray(prescription.investigation_items)) {
                    for (const item of prescription.investigation_items) {
                        if (item?.name && item?.note) {
                            sampleMap[String(item.name).trim()] = String(item.note).trim();
                        }
                    }
                }
                return sampleMap;
            })(),
            custom: parseInvestigationRows(prescription.investigation_items, prescription.tests),
            notes: '',
        },
        advice: {
            lifestyle: parsedInstructions.lifestyle,
            diet_rest: parsedInstructions.diet_rest,
        },
        follow_up: {
            date: String(prescription.next_visit_date || '').trim(),
            emergency_note: parsedInstructions.emergency_note,
        },
    };
}

function reducer(state, action) {
    switch (action.type) {
        case 'hydrate':
            return action.value;
        case 'setInvestigations':
            return {
                ...state,
                investigations: action.value,
            };
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
        case 'setTestSample': {
            const { testName, value } = action;
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    commonSample: {
                        ...state.investigations.commonSample,
                        [testName]: value,
                    },
                },
            };
        }
        case 'syncCommonTests': {
            const tests = Array.isArray(action.tests) ? action.tests : [];
            const prevCommon = state.investigations.common || {};
            const nextCommon = Object.fromEntries(
                tests.map((testName) => [testName, !!prevCommon[testName]]),
            );
            return {
                ...state,
                investigations: {
                    ...state.investigations,
                    common: nextCommon,
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

export default function Prescription({
    mode = 'create',
    defaultTemplateType = null,
    appointmentId = null,
    chamberInfo,
    selectedPatient,
    doctorInfo = null,
    prescription = null,
    medicines = [],
    reports: initialReports = null,
}) {
    const isEditMode = mode === 'edit' || !!prescription?.id;

    const page = usePage();
    const authUser = page?.props?.auth?.user;
    const branding = page?.props?.site?.branding || {};
    const doctorSpecialization = doctorInfo?.specialization || authUser?.specialization || '';
    const doctorDegree = doctorInfo?.degree || authUser?.degree || '';

    const chamberName = chamberInfo?.name || '';
    const chamberAddress = chamberInfo?.location || '';
    const chamberPhone = chamberInfo?.phone || '';
    const chamberMapUrl = chamberInfo?.google_maps_url || '';
    const chamberQrSrc = chamberMapUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(chamberMapUrl)}`
        : '';
    const doctorLogoSrc =
        branding?.brandLogoUrl ||
        branding?.sidebarLogoUrl ||
        authUser?.profile_picture ||
        '/stethoscope-2.png';

    const [state, dispatch] = useReducer(reducer, initialState);
    const [submitting, setSubmitting] = useState(false);
    const [appointmentAction, setAppointmentAction] = useState(null);
    const [investigationCatalog, setInvestigationCatalog] = useState([]);
    const [medicineMatchesByRow, setMedicineMatchesByRow] = useState({});
    const medicineMatchCacheRef = useRef(new Map());
    const medicineQuerySeqRef = useRef({});
    const didHydrateEditRef = useRef(false);

    // Medicine form state (fix for getElementById issue)
    const [newMedicine, setNewMedicine] = useState({
        name: '',
        strength: '',
        dosage: '',
        duration: '',
        instruction: '',
    });
    const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(null);

    // Report upload state (edit mode only)
    const [reports, setReports] = useState(Array.isArray(initialReports) ? initialReports : []);
    const [loadingReports, setLoadingReports] = useState(false);
    const [uploadingReport, setUploadingReport] = useState(false);
    const [reportFile, setReportFile] = useState(null);
    const [reportTitle, setReportTitle] = useState('');
    const [reportNote, setReportNote] = useState('');
    const [reportText, setReportText] = useState('');
    const [showReportUploadModal, setShowReportUploadModal] = useState(false);
    const [showReportViewModal, setShowReportViewModal] = useState(false);
    const [viewingReport, setViewingReport] = useState(null);
    const [deletingReportId, setDeletingReportId] = useState(null);

    const loadReports = async () => {
        const id = prescription?.id;
        if (!id) return;
        try {
            setLoadingReports(true);
            const res = await fetch(`/api/doctor/prescriptions/${id}/reports`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                toastError(body?.message || 'Failed to load test reports.');
                return;
            }
            setReports(Array.isArray(body?.reports) ? body.reports : []);
        } catch {
            toastError('Failed to load test reports.');
        } finally {
            setLoadingReports(false);
        }
    };

    const handleUploadReport = async (e) => {
        e?.preventDefault?.();
        if (!prescription?.id) {
            toastError('Please save prescription first, then upload reports.');
            return;
        }
        const trimmedText = String(reportText || '').trim();
        if (!reportFile && !trimmedText) {
            toastError('Please choose a file or write a text report.');
            return;
        }
        try {
            setUploadingReport(true);
            const formData = new FormData();
            if (reportTitle.trim()) formData.append('title', reportTitle.trim());
            if (reportFile) formData.append('report_file', reportFile);
            if (trimmedText) formData.append('report_text', trimmedText);
            if (reportNote.trim()) formData.append('note', reportNote.trim());
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/api/doctor/prescriptions/${prescription.id}/reports`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) { toastError(body?.message || 'Failed to upload report.'); return; }
            toastSuccess(body?.message || 'Report uploaded.');
            if (body?.report && typeof body.report === 'object') {
                setReports((prev) => [body.report, ...(Array.isArray(prev) ? prev : [])]);
            }
            setReportFile(null);
            setReportTitle('');
            setReportNote('');
            setReportText('');
            setShowReportUploadModal(false);
            const fileInput = document.getElementById('rx-report-upload-input');
            if (fileInput) fileInput.value = '';
            await loadReports();
        } catch {
            toastError('Network error while uploading report.');
        } finally {
            setUploadingReport(false);
        }
    };

    const handleDeleteReport = async (report) => {
        if (!prescription?.id || !report?.id) return;
        const ok = window.confirm('Delete this report? This action cannot be undone.');
        if (!ok) return;

        try {
            setDeletingReportId(report.id);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/api/doctor/prescriptions/${prescription.id}/reports/${report.id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                toastError(body?.message || 'Failed to delete report.');
                return;
            }
            setReports((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== report.id) : []));
            if (viewingReport?.id === report.id) {
                setShowReportViewModal(false);
                setViewingReport(null);
            }
            toastSuccess(body?.message || 'Report deleted.');
        } catch {
            toastError('Network error while deleting report.');
        } finally {
            setDeletingReportId(null);
        }
    };

    const loadInvestigationTests = async () => {
        try {
            const res = await fetch('/api/doctor/investigation-tests', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                return;
            }

            const names = (Array.isArray(body?.items) ? body.items : [])
                .map((item) => String(item?.name || '').trim())
                .filter(Boolean);

            setInvestigationCatalog(names);
            if (!isEditMode) {
                dispatch({ type: 'syncCommonTests', tests: names });
            }
        } catch {
            // Keep manual custom tests usable even if this list fails to load.
        }
    };

    const queryMedicineMatches = async (rawName, rowIndex) => {
        const normalized = normalizeMedicineName(rawName);
        if (!normalized) {
            setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
            return;
        }

        const cached = medicineMatchCacheRef.current.get(normalized);
        if (cached) {
            setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: cached }));
            const exactCachedMatch = cached.find(
                (item) => normalizeMedicineName(item.name) === normalized,
            );
            if (exactCachedMatch) {
                dispatch({
                    type: 'setArrayItem',
                    path: ['medicines'],
                    index: rowIndex,
                    patch: {
                        name: buildMedicineWithStrength(exactCachedMatch.name, exactCachedMatch.strength) || String(rawName || '').trim(),
                        strength: String(exactCachedMatch.strength || '').trim(),
                    },
                });
            }
            return;
        }

        const seq = (medicineQuerySeqRef.current[rowIndex] || 0) + 1;
        medicineQuerySeqRef.current[rowIndex] = seq;

        try {
            const params = new URLSearchParams({
                query: rawName,
                limit: '8',
            });
            const res = await fetch(`/api/doctor/medicines?${params.toString()}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load medicines');
            const data = await res.json();
            if (medicineQuerySeqRef.current[rowIndex] !== seq) return;

            const raw = Array.isArray(data)
                ? data.map((med) => ({
                    id: med.id,
                    name: med.name || '',
                    strength: med.strength || '',
                }))
                : [];

            // Exact matches first, then starts-with, then rest
            const matches = [...raw].sort((a, b) => {
                const aN = normalizeMedicineName(a.name);
                const bN = normalizeMedicineName(b.name);
                const aExact = aN === normalized ? 0 : aN.startsWith(normalized) ? 1 : 2;
                const bExact = bN === normalized ? 0 : bN.startsWith(normalized) ? 1 : 2;
                return aExact - bExact;
            });

            medicineMatchCacheRef.current.set(normalized, matches);
            setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: matches }));

            const exactMatch = matches.find(
                (item) => normalizeMedicineName(item.name) === normalized,
            );

            if (exactMatch) {
                dispatch({
                    type: 'setArrayItem',
                    path: ['medicines'],
                    index: rowIndex,
                    patch: {
                        name: buildMedicineWithStrength(exactMatch.name, exactMatch.strength) || String(rawName || '').trim(),
                        strength: String(exactMatch.strength || '').trim(),
                    },
                });
            }
        } catch {
            if (medicineQuerySeqRef.current[rowIndex] !== seq) return;
            setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
        }
    };

    const handleMedicineNameChange = (idx, value) => {
        dispatch({
            type: 'setArrayItem',
            path: ['medicines'],
            index: idx,
            patch: { name: value },
        });
        void queryMedicineMatches(value, idx);
    };

    const handleMedicineSuggestionSelect = (idx, med) => {
        dispatch({
            type: 'setArrayItem',
            path: ['medicines'],
            index: idx,
            patch: {
                name: buildMedicineWithStrength(med.name, med.strength),
                strength: String(med.strength || '').trim(),
            },
        });
    };

    const handleMedicineFieldChange = (idx, field, value) => {
        dispatch({
            type: 'setArrayItem',
            path: ['medicines'],
            index: idx,
            patch: { [field]: value },
        });
    };

    const handleRemoveMedicine = (idx) => {
        dispatch({
            type: 'removeArrayItem',
            section: 'medicines',
            index: idx,
            min: 0,
        });
    };

    const handleAddMedicine = () => {
        dispatch({
            type: 'addArrayItem',
            section: 'medicines',
            item: emptyMedicine(),
        });
    };

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

    useEffect(() => {
        if (!isEditMode || !prescription) return;
        didHydrateEditRef.current = true;
        dispatch({ type: 'hydrate', value: buildStateFromPrescription(prescription) });
    }, [isEditMode, prescription]);

    useEffect(() => {
        if (!Array.isArray(initialReports)) return;
        setReports(initialReports);
    }, [initialReports]);

    useEffect(() => {
        if (!isEditMode || !didHydrateEditRef.current) return;

        const catalogSource = investigationCatalog;

        if (!catalogSource.length) return;

        const prevCommon = state.investigations.common || {};
        const prevCustom = Array.isArray(state.investigations.custom)
            ? state.investigations.custom
            : [];
        const prevCommonSample = state.investigations.commonSample || {};

        const nextCommon = Object.fromEntries(
            catalogSource.map((name) => [name, !!prevCommon[name]]),
        );
        const nextCommonSample = { ...prevCommonSample };

        const remainingCustom = [];
        prevCustom.forEach((rawItem) => {
            const rawText = String(rawItem || '').trim();
            const clean = cleanInvestigationLabel(rawText);
            if (!clean) return;
            const matchedKey = findBestCatalogInvestigation(catalogSource, clean);
            if (matchedKey) {
                nextCommon[matchedKey] = true;
                // carry over sample from raw item name if not yet set via catalog key
                if (!nextCommonSample[matchedKey]) {
                    nextCommonSample[matchedKey] =
                        prevCommonSample[rawText]
                        || prevCommonSample[clean]
                        || '';
                }
            } else {
                remainingCustom.push(clean);
            }
        });

        const currentCommonSignature = JSON.stringify(prevCommon);
        const nextCommonSignature = JSON.stringify(nextCommon);
        const currentCustomSignature = JSON.stringify(prevCustom.map((x) => String(x || '').trim()).filter(Boolean));
        const nextCustomSignature = JSON.stringify(remainingCustom);

        if (
            currentCommonSignature !== nextCommonSignature ||
            currentCustomSignature !== nextCustomSignature
        ) {
            dispatch({
                type: 'setInvestigations',
                value: {
                    ...state.investigations,
                    common: nextCommon,
                    commonSample: nextCommonSample,
                    custom: remainingCustom.length ? remainingCustom : [''],
                },
            });
        }
    }, [
        isEditMode,
        investigationCatalog,
        state.investigations,
    ]);

    useEffect(() => {
        void loadInvestigationTests();
    }, []);

    useEffect(() => {
        if (prescription?.id) void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prescription?.id]);

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
        'w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 doc-input-focus';
    const medicineInputClass =
        'w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1 text-xs text-slate-900 doc-input-focus';
    const labelClass = 'mb-2 block text-xs font-semibold text-slate-700';
    const helperClass = 'mt-1 text-xs text-slate-500';
    const sectionTitleClass = 'text-base font-bold text-slate-800';
    const sectionSubClass = 'mt-1 text-xs text-slate-500';

    const buildDiagnosisText = () => {
        const lines = [];

        const cc = String(state.diagnosis.complaints_text || '')
            .split('\n')
            .map((l) => l.trim())
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
        if (String(state.exam.pulse || '').trim())
            vitals.push(`P: ${String(state.exam.pulse).trim()}`);
        if (String(state.exam.bp || '').trim())
            vitals.push(`BP: ${String(state.exam.bp).trim()}`);
        if (String(state.exam.temperature || '').trim())
            vitals.push(`T: ${String(state.exam.temperature).trim()}`);
        if (String(state.exam.weight || '').trim())
            vitals.push(`Wt: ${String(state.exam.weight).trim()}`);
        if (vitals.length) {
            lines.push('O/E:');
            vitals.forEach((v) => lines.push(`- ${v}`));
            lines.push('');
        }
        if (String(state.exam.notes || '').trim())
            lines.push(`Exam Notes: ${String(state.exam.notes).trim()}`);

        return lines.join('\n').trim();
    };

    const buildMedicationsText = () => {
        const meds = (state.medicines || [])
            .map((m) => {
                const name = String(m.name || '').trim();
                if (!name) return null;
                const dosage = String(m.dosage || '').trim();
                const duration = String(m.duration || '').trim();
                const instruction = String(m.instruction || '').trim();
                const parts = [name];
                const details = [];
                if (dosage) details.push(`${dosage}`);
                if (duration) details.push(duration);
                if (instruction) details.push(instruction);
                if (details.length) parts.push(`- ${details.join(' - ')}`);
                return parts.join(' ');
            })
            .filter(Boolean);
        return meds.join('\n').trim();
    };

    const buildDoseText = () => {
        const doses = (state.medicines || [])
            .filter((m) => String(m?.name || '').trim())
            .map((m) => String(m?.dosage || '').trim());
        return doses.join('\n').trim();
    };

    const buildTestsText = () => {
        const common = Object.entries(state.investigations.common || {})
            .filter(([, v]) => !!v)
            .map(([k]) => k);
        const custom = (state.investigations.custom || [])
            .map((t) => String(t || '').trim())
            .filter(Boolean);
        const notes = String(state.investigations.notes || '').trim();
        return [...common, ...custom, ...(notes ? [notes] : [])].join('\n').trim();
    };

    const buildInvestigationItems = () => {
        const common = Object.entries(state.investigations.common || {})
            .filter(([, v]) => !!v)
            .map(([k]) => String(k || '').trim())
            .filter(Boolean);
        const commonSample = state.investigations.commonSample || {};
        const custom = (state.investigations.custom || [])
            .map((t) => String(t || '').trim())
            .filter(Boolean);
        const notes = String(state.investigations.notes || '').trim();
        const merged = [...common, ...custom, ...(notes ? [notes] : [])];
        return merged.map((name, index) => {
            const sample = common.includes(name)
                ? String(commonSample[name] || '').trim()
                : '';
            return {
                name,
                note: sample || null,
                sort_order: index,
            };
        });
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

    const handleSubmit = async (submitType = 'save') => {
        const role = String(authUser?.role || '').toLowerCase();
        const computedAppointmentAction = submitType === 'complete'
            ? 'prescribed'
            : (role === 'doctor' ? 'awaiting_tests' : null);
        setAppointmentAction(submitType);

        // Validate patient name
        if (!state.patient.name?.trim()) {
            const message = 'Please enter patient name.';
            toastError(message);
            return;
        }

        const diagnosisText = buildDiagnosisText();
        const chiefComplaintsText = String(state.diagnosis.complaints_text || '').trim() || null;
        const oeData = [
            { key: 'P', label: 'Pulse', value: String(state.exam.pulse || '').trim() },
            { key: 'BP', label: 'BP', value: String(state.exam.bp || '').trim() },
            { key: 'T', label: 'Temp', value: String(state.exam.temperature || '').trim() },
            { key: 'WT', label: 'Weight', value: String(state.exam.weight || '').trim() },
        ].filter((item) => item.value !== '');
        const medicationsText = buildMedicationsText();
        const doseText = buildDoseText();
        const testsText = buildTestsText();
        const investigationItems = buildInvestigationItems();
        const instructionsText = buildInstructionsText();

        setSubmitting(true);
        try {
            const metaCsrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const cookieCsrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            const csrfToken = metaCsrfToken || (cookieCsrfToken ? decodeURIComponent(cookieCsrfToken) : '');

            const url = isEditMode
                ? `/doctor/prescriptions/${prescription.id}`
                : '/doctor/prescriptions';

            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': cookieCsrfToken ? decodeURIComponent(cookieCsrfToken) : '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointment_id: isEditMode ? (prescription?.appointment_id || null) : (appointmentId || null),
                    patient_name: state.patient.name,
                    patient_age: state.patient.age_value,
                    patient_age_unit: state.patient.age_unit,
                    patient_gender: state.patient.gender,
                    patient_weight: state.patient.weight,
                    patient_contact: state.patient.contact,
                    visit_type: state.visit.type,
                    specialty_data: null,
                    chief_complaints: chiefComplaintsText,
                    oe_data: oeData.length ? oeData : null,
                    visit_date: state.visit.date,
                    diagnosis: diagnosisText,
                    medications: medicationsText,
                    dose: doseText || null,
                    instructions: instructionsText || null,
                    tests: testsText || null,
                    investigation_items: investigationItems,
                    next_visit_date: state.follow_up.date || null,
                    appointment_action: computedAppointmentAction,
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

            toastSuccess(isEditMode ? 'Prescription updated successfully.' : 'Prescription saved successfully.');
            setTimeout(() => router.visit('/doctor/appointments'), 400);
        } catch {
            const message = 'Network error. Please try again.';
            toastError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DoctorLayout title={isEditMode ? 'Edit Prescription' : 'Create Prescription'} gradient>
            <div className="mx-auto max-w-[1400px] space-y-6">
                {/* Top actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/doctor/prescriptions"
                        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to List
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowReportUploadModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#3556a6] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#2a488f]"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Report
                    </button>
                </div>

                {/* Prescription Header Card - Like real prescription pad (Matching PrescriptionShow) */}

                <div>
                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f8fafc] shadow-sm">
                        <div className="h-4 bg-[#0b3f86]" />

                        {/* Prescription Header - Doctor left, Chamber right (matching PrescriptionShow) */}
                        <div className="border-b border-slate-300 bg-white">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
                                    <Stethoscope className="h-48 w-48 text-[#0b3f86]" />
                                </div>

                                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-slate-300 px-4 py-4 sm:px-8 sm:py-7">
                                    {/* Left — Doctor Info */}
                                    <div className="pr-0 sm:pr-8">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#cfd8e6] bg-white sm:h-20 sm:w-20">
                                                <img src={doctorLogoSrc} alt="Doctor logo" className="h-full w-full object-contain" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1.5 flex items-center gap-1.5">
                                                    <Stethoscope className="h-3.5 w-3.5 text-[#0b3f86]" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b3f86]">Doctor</span>
                                                </div>
                                                <p className="text-2xl font-black tracking-tight text-[#0d2f63]">
                                                    {authUser?.name || 'Doctor'}
                                                </p>
                                                <p className="mt-0.5 text-sm font-medium text-slate-600">
                                                    {doctorSpecialization || doctorDegree || 'MBBS, FCPS'}
                                                </p>
                                                <div className="mt-3 space-y-1.5">
                                                    {authUser?.phone ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                                            <Phone className="h-3.5 w-3.5 shrink-0 text-[#0b3f86]" />
                                                            <span>{authUser.phone}</span>
                                                        </div>
                                                    ) : null}
                                                    {authUser?.email ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                                            <Mail className="h-3.5 w-3.5 shrink-0 text-[#0b3f86]" />
                                                            <span>{authUser.email}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — Chamber Info */}
                                    <div className="pl-0 sm:pl-8 flex flex-col items-start sm:items-end border-t border-slate-200 sm:border-t-0 pt-4 sm:pt-0">
                                        <div className="mb-1.5 flex items-center justify-start sm:justify-end gap-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b3f86]">Chamber</span>
                                        </div>
                                        <p className="text-2xl font-black tracking-tight text-[#0d2f63]">
                                            {chamberName || 'Not set'}
                                        </p>
                                        {chamberAddress ? (
                                            <div className="mt-2.5 flex items-start justify-start sm:justify-end gap-1.5 text-sm text-slate-700">
                                                <span>{chamberAddress}</span>
                                            </div>
                                        ) : null}
                                        {chamberPhone ? (
                                            <div className="mt-1.5 flex items-center justify-start sm:justify-end gap-1.5 text-sm text-slate-700">
                                                <span>{chamberPhone}</span>
                                            </div>
                                        ) : null}
                                        {/* {chamberQrSrc ? (
                                        <div className="mt-2 text-center">
                                            <div className="inline-flex overflow-hidden rounded border border-slate-300 bg-white p-1">
                                                <img src={chamberQrSrc} alt="Location QR" className="h-16 w-16 object-contain" />
                                            </div>
                                            <p className="mt-1 text-[10px] font-semibold text-slate-600">Scan for Location</p>
                                        </div>
                                    ) : null} */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Info Strip - Inline underline style (matching DoctorPrescriptions modal) */}
                        <div className="border-b border-slate-300 bg-[#f8fbff] px-4 py-3 sm:px-8 sm:py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-5 sm:divide-x divide-slate-300 gap-y-2 sm:gap-y-0 gap-0">
                                {/* Name */}
                                <div className="min-w-0 pr-0 sm:pr-2">
                                    <div className="flex items-center gap-2 border-b border-dotted border-[#9aa8be] pb-1">
                                        <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                                        <input
                                            className="flex-1 border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                                            value={state.patient.name}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'name'], value: e.target.value })}
                                            placeholder="Patient name"
                                        />
                                    </div>
                                </div>
                                {/* Age */}
                                <div className="px-0 sm:px-2">
                                    <div className="flex items-center justify-start sm:justify-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                                        <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                inputMode="numeric"
                                                className="w-12 border-0 bg-transparent px-1.5 py-0.5 text-center text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                                                value={state.patient.age_value}
                                                onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_value'], value: e.target.value })}
                                                placeholder="—"
                                            />
                                            <select
                                                className="min-w-[54px] border-0 bg-transparent px-1 py-0.5 text-sm text-slate-700 focus:outline-none"
                                                value={state.patient.age_unit}
                                                onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_unit'], value: e.target.value })}
                                            >
                                                <option value="years">yr</option>
                                                <option value="months">mo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                {/* Gender */}
                                <div className="px-0 sm:px-2">
                                    <div className="flex items-center justify-start sm:justify-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                                        <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
                                        <select
                                            className="w-24 border-0 bg-transparent px-1 py-0.5 text-sm text-slate-900 focus:outline-none"
                                            value={state.patient.gender}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'gender'], value: e.target.value })}
                                        >
                                            <option value="">—</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Contact */}
                                <div className="col-span-1 sm:col-span-2 px-0 sm:px-2">
                                    <div className="mx-0 sm:mx-auto flex w-full max-w-full sm:max-w-[220px] items-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                        <input
                                            className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                                            value={state.patient.contact}
                                            onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'contact'], value: e.target.value })}
                                            placeholder="Phone"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Main Content - Real Prescription Pad Layout */}
                        <div className="min-h-[500px] bg-white p-4 sm:p-8 pb-6 sm:pb-12">
                            <form onSubmit={(e) => e.preventDefault()}>
                                {/* Prescription Pad Layout - Two Column Grid */}
                                <div className="grid grid-cols-12 gap-4 sm:gap-8">

              
                                    <div className="col-span-12 sm:col-span-3 space-y-6 sm:border-r-2 border-dashed border-slate-200 pr-0 sm:pr-8">
                                        <div className="flex flex-col rounded-xl border border-[#cad6e8] bg-[#f2f5fa] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                            <div className="mb-3 inline-flex items-center gap-2 bg-[#0b4fa3] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}>
                                                <ClipboardList className="h-4 w-4" />
                                                Chief Complaints
                                            </div>
                                            <textarea
                                                className="w-full resize-none rounded-lg border border-[#d4e0f0] bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0b4fa3] focus:outline-none"
                                                rows={4}
                                                value={state.diagnosis.complaints_text}
                                                onChange={(e) => dispatch({
                                                    type: 'setField',
                                                    path: ['diagnosis', 'complaints_text'],
                                                    value: e.target.value,
                                                })}
                                                placeholder={"Headache\nFever\nCough"}
                                            />
                                        </div>

                                        <div className="flex flex-col rounded-xl border border-[#cad6e8] bg-[#f2f5fa] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                            <div className="mb-3 inline-flex items-center gap-2 bg-[#0b4fa3] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}>
                                                <HeartPulse className="h-4 w-4" />
                                                O/E
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">P</span>
                                                    <input
                                                        className="w-full rounded border border-[#d4e0f0] bg-white px-1.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0b4fa3] focus:outline-none"
                                                        value={state.exam.pulse}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'pulse'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Pulse"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">BP</span>
                                                    <input
                                                        className="w-full rounded border border-[#d4e0f0] bg-white px-1.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0b4fa3] focus:outline-none"
                                                        value={state.exam.bp}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'bp'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="BP"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">T</span>
                                                    <input
                                                        className="w-full rounded border border-[#d4e0f0] bg-white px-1.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0b4fa3] focus:outline-none"
                                                        value={state.exam.temperature}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'temperature'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Temp"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Wt</span>
                                                    <input
                                                        className="w-full rounded border border-[#d4e0f0] bg-white px-1.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0b4fa3] focus:outline-none"
                                                        value={state.exam.weight}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['exam', 'weight'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Wt"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex min-h-[250px] flex-col rounded-xl border border-[#cad6e8] bg-[#f2f5fa] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                            <div className="mb-3 inline-flex items-center gap-2 bg-[#0b4fa3] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}>
                                                <FlaskConical className="h-4 w-4" />
                                                Investigations
                                            </div>

                                            {investigationCatalog.length > 0 ? (
                                                <div className="space-y-1 px-1">
                                                    {investigationCatalog.map((testName) => {
                                                            const checked = !!state.investigations.common?.[testName];
                                                            return (
                                                                <div key={testName}>
                                                                    <button
                                                                        type="button"
                                                                        className={`flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1 text-left text-xs transition ${checked
                                                                            ? 'border-[#0b4fa3] bg-[#eaf2ff] text-[#0b3f86]'
                                                                            : 'border-transparent text-slate-700 hover:border-[#d4e1f6] hover:bg-[#f7faff]'
                                                                            }`}
                                                                        onClick={() => dispatch({ type: 'toggleCommonTest', testName })}
                                                                    >
                                                                        <span className="truncate">{testName}</span>
                                                                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold ${checked
                                                                            ? 'border-[#0b4fa3] bg-[#0b4fa3] text-white'
                                                                            : 'border-slate-300 bg-white text-transparent'
                                                                            }`}>
                                                                            ✓
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ) : null}

                                            <div className="mt-3 space-y-1 px-1">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Additional tests</p>
                                                {(state.investigations.custom || []).map((test, idx) => (
                                                    <div key={idx} className="group flex items-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                                                        <span className="text-slate-700">•</span>
                                                        <input
                                                            className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                                            value={test}
                                                            onChange={(e) => dispatch({
                                                                type: 'setCustomTest',
                                                                index: idx,
                                                                value: e.target.value,
                                                            })}
                                                            placeholder="Add test"
                                                        />
                                                        {(state.investigations.custom || []).length > 1 ? (
                                                            <button
                                                                type="button"
                                                                className="rounded border border-rose-300 bg-rose-50 px-1.5 py-0 text-[11px] text-rose-800 opacity-0 transition group-hover:opacity-100"
                                                                onClick={() => dispatch({ type: 'removeCustomTest', index: idx })}
                                                            >
                                                                ×
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* <div className="mt-3 flex-1 space-y-3 px-1">
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                        </div> */}

                                            <button
                                                type="button"
                                                className="mt-3 self-start text-xs font-semibold text-[#0b4fa3] hover:underline"
                                                onClick={() => dispatch({ type: 'addCustomTest' })}
                                            >
                                                + Add Test
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 px-1 text-[#4d6289]">
                                            <div className="h-px flex-1 bg-[#7b8fac]" />
                                            <HeartPulse className="h-4 w-4" />
                                            <div className="h-px flex-1 bg-[#7b8fac]" />
                                        </div>



                                        <div className="flex min-h-[250px] flex-col rounded-xl border border-[#cad6e8] bg-[#f2f5fa] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                            <div className="mb-3 inline-flex items-center gap-2 bg-[#0b4fa3] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}>
                                                <ClipboardList className="h-4 w-4" />
                                                Diagnosis
                                            </div>

                                            <div className="space-y-1 px-1">
                                                <div className="group flex items-center gap-2 border-b border-dotted border-[#9aa8be] pb-1">
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">P</span>
                                                    <input
                                                        className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                                        value={state.diagnosis.provisional}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['diagnosis', 'provisional'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Provisional diagnosis"
                                                    />
                                                </div>
                                                <div className="group flex items-center gap-2 border-b border-dotted border-[#9aa8be] pb-1">
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">F</span>
                                                    <input
                                                        className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                                        value={state.diagnosis.final}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['diagnosis', 'final'],
                                                            value: e.target.value,
                                                        })}
                                                        placeholder="Final diagnosis"
                                                    />
                                                </div>
                                            </div>

                                            {/* <div className="mt-3 flex-1 space-y-3 px-1">
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                            <div className="border-b border-dotted border-[#9aa8be]" />
                                        </div> */}
                                        </div>
                                    </div>

                                    {/* Right Column - Wide (Medicine Main, Advice Bottom) */}
                                    <div className="col-span-12 sm:col-span-9 space-y-6">

                                        <PrescriptionMedicineSection
                                            medicines={state.medicines || []}
                                            normalizeMedicineName={normalizeMedicineName}
                                            medicineMatchesByRow={medicineMatchesByRow}
                                            focusedMedicineIndex={focusedMedicineIndex}
                                            setFocusedMedicineIndex={setFocusedMedicineIndex}
                                            onNameFocus={(idx, name) => {
                                                void queryMedicineMatches(name, idx);
                                            }}
                                            onNameBlur={(idx) => {
                                                setFocusedMedicineIndex((current) => (current === idx ? null : current));
                                            }}
                                            onNameChange={handleMedicineNameChange}
                                            onSelectSuggestion={handleMedicineSuggestionSelect}
                                            onDoseChange={(idx, value) => handleMedicineFieldChange(idx, 'dosage', value)}
                                            onDurationChange={(idx, value) => handleMedicineFieldChange(idx, 'duration', value)}
                                            onInstructionChange={(idx, value) => handleMedicineFieldChange(idx, 'instruction', value)}
                                            onRemove={handleRemoveMedicine}
                                            onAdd={handleAddMedicine}
                                            showNoMatchHint
                                        />

                                        {/* Advice Section - Bottom Right */}
                                        <div className="border-t-2 border-dotted border-slate-200 pt-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#3556a6]" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                                            </div>

                                            <div className="rounded-lg border border-[#d5deea] bg-[#f5f8fd] px-3 py-2.5 text-sm text-slate-800">
                                                <p className="mb-1 font-semibold text-slate-800">Emergency Note:</p>
                                                <textarea
                                                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                                                    rows={2}
                                                    value={state.follow_up.emergency_note}
                                                    onChange={(e) => dispatch({
                                                        type: 'setField',
                                                        path: ['follow_up', 'emergency_note'],
                                                        value: e.target.value,
                                                    })}
                                                />
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-[#dbe3ef] pt-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-[#0d2f63]" />
                                                    <span className="text-xs font-bold uppercase tracking-wide text-[#0d2f63]">Follow-up Date</span>
                                                    <input
                                                        type="date"
                                                        className="min-w-[140px] rounded-md border border-[#cdd9ea] bg-[#f3f7fd] px-3 py-1 text-xs font-semibold text-slate-700"
                                                        value={state.follow_up.date}
                                                        onChange={(e) => dispatch({
                                                            type: 'setField',
                                                            path: ['follow_up', 'date'],
                                                            value: e.target.value,
                                                        })}
                                                    />
                                                </div>

                                                <div className="flex items-end gap-3 text-right">
                                                    <div>
                                                        <div className="mb-1 border-b border-[#0d2f63] pb-1 text-lg font-semibold italic text-[#0d2f63]">{authUser?.name || 'Doctor'}</div>
                                                        <div className="text-xs text-slate-600">{doctorSpecialization || doctorDegree || 'MBBS, FCPS'}</div>
                                                        <div className="text-xs text-slate-500">Reg. No: {doctorInfo?.registration_no || '123456'}</div>
                                                    </div>
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0b3f86] bg-white p-2">
                                                        <img src={doctorLogoSrc} alt="Seal" className="h-full w-full object-contain" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 rounded-2xl bg-[#0b3f86] px-5 py-2.5 text-[11px] text-white">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-white/30">
                                                    <div className="flex items-center justify-center gap-2 px-2"><ShieldCheck className="h-4 w-4" />Your Health, Our Priority</div>
                                                    <div className="flex items-center justify-center gap-2 px-2"><HeartHandshake className="h-4 w-4" />Compassionate Care, Trusted Results</div>
                                                    <div className="flex items-center justify-center gap-2 px-2"><Calendar className="h-4 w-4" />Thank You for Trusting Us</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Submit Section - Enhanced */}
                                <div className="mt-6 sm:mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                                    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                                        Save keeps appointment status unchanged for compounder and sets <span className="font-semibold">awaiting_tests</span> for doctor. Complete marks the appointment as completed.
                                    </div>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-[#f6ece5] p-2">
                                                    <CheckCircle2 className="h-5 w-5 text-[#c57945]" />
                                                </div>
                                                <span className="font-medium text-slate-600">
                                                    Form complete and ready to submit
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</span>
                                                <input
                                                    type="date"
                                                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                                                    value={state.visit.date}
                                                    onChange={(e) => dispatch({ type: 'setField', path: ['visit', 'date'], value: e.target.value })}
                                                />
                                                <span className="text-xs font-medium text-slate-500">{visitDateLabel}</span>
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
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
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50 sm:w-auto"
                                                disabled={submitting}
                                                onClick={() => handleSubmit('save')}
                                            >
                                                {submitting && appointmentAction === 'save' ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FlaskConical className="h-4 w-4" />
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3556a6] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:opacity-50 sm:w-auto"
                                                disabled={submitting}
                                                onClick={() => handleSubmit('complete')}
                                            >
                                                {submitting && appointmentAction === 'complete' ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        Complete
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

                {/* Report Upload Section */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <FileUp className="h-5 w-5 text-[#3556a6]" />
                                <span className="text-sm font-semibold text-slate-800">Test Reports</span>
                                {loadingReports ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3556a6] border-t-transparent" />
                                ) : (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{reports.length}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReportUploadModal(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3556a6] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2a488f]"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                Upload Report
                            </button>
                        </div>

                        {!prescription?.id ? (
                            <div className="border-b border-slate-100 bg-amber-50 px-5 py-2 text-xs text-amber-800">
                                Save prescription first to upload and persist reports.
                            </div>
                        ) : null}

                        {reports.length === 0 && !loadingReports ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-400">
                                No reports uploaded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Title</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {reports.map((report) => (
                                            <tr key={report.id}>
                                                <td className="px-5 py-3 text-sm font-medium text-slate-800">{report.title || report.original_name || report.note || 'Report'}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setViewingReport(report);
                                                                setShowReportViewModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={deletingReportId === report.id}
                                                            onClick={() => handleDeleteReport(report)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            {deletingReportId === report.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                {/* Report upload modal */}
                {showReportUploadModal && typeof document !== 'undefined'
                    ? createPortal(
                        <div
                            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
                            onClick={() => setShowReportUploadModal(false)}
                        >
                            <div
                                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_-20px_rgba(2,6,23,0.5)] ring-1 ring-slate-900/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <FileUp className="h-5 w-5 text-[#3556a6]" />
                                        <span className="text-sm font-semibold text-slate-800">Upload Test Report</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowReportUploadModal(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleUploadReport} className="space-y-4 px-5 py-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Title</label>
                                        <input
                                            type="text"
                                            value={reportTitle}
                                            onChange={(e) => setReportTitle(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#3556a6] focus:outline-none focus:ring-2 focus:ring-[#3556a6]/20"
                                            placeholder="e.g. CBC Report"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">File (PDF / Image)</label>
                                        <input
                                            id="rx-report-upload-input"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#3556a6] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Or write a text report</label>
                                        <textarea
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#3556a6] focus:outline-none focus:ring-2 focus:ring-[#3556a6]/20"
                                            placeholder="Enter test results or report text…"
                                            value={reportText}
                                            onChange={(e) => setReportText(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Note (optional)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#3556a6] focus:outline-none focus:ring-2 focus:ring-[#3556a6]/20"
                                            placeholder="e.g. CBC, Blood Sugar"
                                            value={reportNote}
                                            onChange={(e) => setReportNote(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowReportUploadModal(false)}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={uploadingReport}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#3556a6] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2a488f] disabled:opacity-50"
                                        >
                                            {uploadingReport ? (
                                                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading…</>
                                            ) : (
                                                <><Upload className="h-4 w-4" /> Upload</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>,
                        document.body,
                    )
                    : null}

                {/* Report details modal */}
                {showReportViewModal && typeof document !== 'undefined'
                    ? createPortal(
                        <div
                            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
                            onClick={() => setShowReportViewModal(false)}
                        >
                            <div
                                className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_-20px_rgba(2,6,23,0.5)] ring-1 ring-slate-900/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-[#3556a6]" />
                                        <span className="text-sm font-semibold text-slate-800">Report Details</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowReportViewModal(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-4 px-5 py-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Title</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">{viewingReport?.title || viewingReport?.original_name || 'Report'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                                        <p className="mt-1 text-sm text-slate-700">{viewingReport?.created_at ? String(viewingReport.created_at).slice(0, 10) : 'N/A'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Note</p>
                                        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{viewingReport?.note || 'No note added.'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Text Report</p>
                                        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{viewingReport?.report_text || 'No text report.'}</p>
                                    </div>

                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                        {(viewingReport?.file_url || viewingReport?.file_path) ? (
                                            <a
                                                href={viewingReport?.file_url || `/storage/${viewingReport?.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#3556a6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a488f]"
                                            >
                                                <Download className="h-4 w-4" />
                                                View File (New Tab)
                                            </a>
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={deletingReportId === viewingReport?.id}
                                            onClick={() => handleDeleteReport(viewingReport)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {deletingReportId === viewingReport?.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReportViewModal(false)}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body,
                    )
                    : null}

                {/* Bottom spacing to prevent overlap */}
                <div className="h-8"></div>
            </div>
        </DoctorLayout>
    );
}
