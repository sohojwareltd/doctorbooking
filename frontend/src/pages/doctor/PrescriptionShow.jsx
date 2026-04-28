import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, ClipboardList, Heart, HeartPulse, Phone, Mail, User, Stethoscope, Pill, FlaskConical, FileText, MapPin, Printer, ArrowLeft, Download, Save, X, Plus, Trash2, Upload, FileUp, Pencil } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import EyePrescriptionSection, {
  createEmptyEyePrescriptionData,
  isEyeSpecialist,
  normalizeEyePrescriptionData,
} from '../../components/prescription/EyePrescriptionSection';
import PrescriptionMedicineSection from '../../components/prescription/PrescriptionFormSection';
import PrescriptionDocument from '../../components/prescription/PrescriptionDocument';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';

export default function PrescriptionShow({ prescription, chamberInfo, medicines: medicineSuggestions = [] }) {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const prescriptionSettings = page?.props?.site?.prescription || {};
  const doctorSpecialization = authUser?.specialization || '';
  const prefersEyeTemplate = isEyeSpecialist(doctorSpecialization);

  const toStr = (val) => (val === null || val === undefined ? '' : String(val));
  const normalizeMedicineName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const buildMedicineWithStrength = (name, strength) => {
    const cleanName = String(name || '').trim();
    const cleanStrength = String(strength || '').trim();
    if (!cleanName) return '';
    return cleanStrength ? `${cleanName} ${cleanStrength}` : cleanName;
  };
  const calculateAgeFromDob = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  };

  const resolvePatientAge = (source) => {
    if (source?.patient_age !== undefined && source?.patient_age !== null && source?.patient_age !== '') {
      return source.patient_age;
    }
    if (source?.user?.age !== undefined && source?.user?.age !== null && source?.user?.age !== '') {
      return source.user.age;
    }
    if (source?.appointment?.age !== undefined && source?.appointment?.age !== null && source?.appointment?.age !== '') {
      return source.appointment.age;
    }
    return calculateAgeFromDob(source?.user?.date_of_birth);
  };

  const emptyMedicine = () => ({ name: '', strength: '', dosage: '', duration: '', instruction: '' });
  const parseInvestigationRows = (items, testsText = '') => {
    if (Array.isArray(items) && items.length) {
      const rows = items
        .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0))
        .map((item) => String(item?.name || '').trim())
        .filter(Boolean);
      if (rows.length) return rows;
    }
    const fromText = String(testsText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return fromText.length ? fromText : [''];
  };

  const buildInvestigationItems = (rows) => (
    (rows || [])
      .map((row, index) => ({
        name: String(row || '').trim(),
        note: null,
        sort_order: index,
      }))
      .filter((row) => row.name)
  );

  const buildTestsText = (rows) => (
    (rows || [])
      .map((row) => String(row || '').trim())
      .filter(Boolean)
      .join('\n')
  );

  const normalizeMedicineRow = (row = {}) => ({
    name: String(row?.name || '').trim(),
    strength: String(row?.strength ?? row?.dose ?? '').trim(),
    dosage: String(row?.dosage ?? row?.frequency ?? '').trim(),
    duration: String(row?.duration || '').trim(),
    instruction: String(row?.instruction || '').trim(),
  });

  // Parse saved medications text back into structured rows
  const parseMedicationsText = (text, doseText = '') => {
    if (!text?.trim()) return [emptyMedicine()];
    const doseLines = String(doseText || '').split('\n').map((line) => line.trim());
    const rows = text.trim().split('\n').filter(Boolean).map((line, index) => {
      const parts = line.split(' - ');
      const nameStrength = String(parts[0] || '').trim();
      const doseMatch = nameStrength.match(/^(.*?)\s*dose:\s*(.+)$/i);
      let name = doseMatch ? String(doseMatch[1] || '').trim() : nameStrength;
      let strength = doseMatch ? String(doseMatch[2] || '').trim() : '';
      const rowDose = String(doseLines[index] || '').trim();
      if (!strength && rowDose && name.toLowerCase().endsWith(rowDose.toLowerCase())) {
        const trimmedName = name.slice(0, Math.max(0, name.length - rowDose.length)).trim();
        if (trimmedName) {
          name = trimmedName;
          strength = rowDose;
        }
      }
      const stripLabel = (value = '', label = '') => String(value || '').replace(new RegExp(`^${label}:\\s*`, 'i'), '').trim();
      const stripDoseLikeLabel = (value = '') => String(value || '').replace(/^(dose|frequency):\s*/i, '').trim();
      const dosage = stripDoseLikeLabel(parts[1] || '');
      const duration = stripLabel(parts[2] || '', 'duration');
      const instruction = stripLabel(parts[3] || '', 'instruction');
      return { name, strength, dosage, duration, instruction };
    }).map((row, index) => ({
      ...row,
      strength: row.strength || doseLines[index] || '',
    }));
    return rows.length ? rows : [emptyMedicine()];
  };

  const buildDoseText = (meds) => (
    (meds || [])
      .filter((m) => String(m?.name || '').trim())
      .map((m) => String(m?.dosage || '').trim())
      .join('\n')
  );

  // Build medications text from structured rows (same format as CreatePrescription)
  const buildMedicationsText = (meds) => {
    return (meds || []).map(m => {
      const name = String(m.name || '').trim();
      if (!name) return null;
      const dosage = String(m.dosage || '').trim();
      const duration = String(m.duration || '').trim();
      const instruction = String(m.instruction || '').trim();
      const parts = [name];
      const details = [];
      if (dosage) details.push(dosage);
      if (duration) details.push(`Duration: ${duration}`);
      if (instruction) details.push(`Instruction: ${instruction}`);
      if (details.length) parts.push(`- ${details.join(' - ')}`);
      return parts.join(' ');
    }).filter(Boolean).join('\n');
  };

  const [medicines, setMedicines] = useState(() => parseMedicationsText(prescription?.medications, prescription?.dose));
  const [investigationRows, setInvestigationRows] = useState(() => parseInvestigationRows(prescription?.investigation_items, prescription?.tests));
  const [medicineMatchesByRow, setMedicineMatchesByRow] = useState({});
  const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(null);
  const medicineMatchCacheRef = useRef(new Map());
  const medicineQuerySeqRef = useRef({});

  const queryMedicineMatches = async (rawName, rowIndex) => {
    const normalized = normalizeMedicineName(rawName);
    if (!normalized) {
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    const cached = medicineMatchCacheRef.current.get(normalized);
    if (cached) {
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: cached }));
      return;
    }
    const seq = (medicineQuerySeqRef.current[rowIndex] || 0) + 1;
    medicineQuerySeqRef.current[rowIndex] = seq;
    try {
      const params = new URLSearchParams({ query: rawName, limit: '8' });
      const res = await fetch(`/api/doctor/medicines?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (medicineQuerySeqRef.current[rowIndex] !== seq) return;
      const raw = Array.isArray(json)
        ? json.map((med) => ({ id: med.id, name: med.name || '', strength: med.strength || '' }))
        : [];
      // Exact matches first, then starts-with, then rest
      const matches = [...raw].sort((a, b) => {
        const aN = normalizeMedicineName(a.name);
        const bN = normalizeMedicineName(b.name);
        const aRank = aN === normalized ? 0 : aN.startsWith(normalized) ? 1 : 2;
        const bRank = bN === normalized ? 0 : bN.startsWith(normalized) ? 1 : 2;
        return aRank - bRank;
      });
      medicineMatchCacheRef.current.set(normalized, matches);
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: matches }));
    } catch {
      if (medicineQuerySeqRef.current[rowIndex] !== seq) return;
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const handleMedicineChange = (idx, field, value) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const addMedicine = () => setMedicines(prev => [...prev, emptyMedicine()]);
  const removeMedicine = (idx) => setMedicines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleMedicineNameChange = (idx, value) => {
    setMedicines((prev) => prev.map((item, itemIndex) => (
      itemIndex === idx ? { ...item, name: value, strength: '' } : item
    )));
    void queryMedicineMatches(value, idx);
  };

  const handleMedicineSuggestionSelect = (idx, med) => {
    setMedicines((prev) => prev.map((item, itemIndex) => (
      itemIndex === idx
        ? {
            ...item,
            name: buildMedicineWithStrength(med.name, med.strength),
            strength: String(med.strength || '').trim(),
          }
        : item
    )));
  };

  const buildFormState = (source = {}) => ({
    patient_name: source?.patient_name || source?.user?.name || '',
    diagnosis: source?.diagnosis || '',
    medications: source?.medications || '',
    instructions: source?.instructions || '',
    tests: source?.tests || '',
    next_visit_date: source?.next_visit_date || '',
    patient_contact: source?.patient_contact || source?.user?.phone || source?.appointment?.phone || '',
    patient_age: toStr(resolvePatientAge(source)),
    patient_age_unit: source?.patient_age_unit || 'years',
    patient_gender: source?.patient_gender || source?.user?.gender || source?.appointment?.gender || '',
    patient_weight: source?.patient_weight || source?.user?.weight || '',
    visit_type: source?.visit_type || '',
    template_type: source?.template_type || 'general',
    specialty_data: source?.specialty_data || createEmptyEyePrescriptionData(),
  });

  const [data, setData] = useState(prescription || {});
  const [editMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildFormState(prescription || {}));

  useEffect(() => {
    setData(prescription || {});
    setForm(buildFormState(prescription || {}));
    setMedicines(parseMedicationsText(prescription?.medications, prescription?.dose));
    setInvestigationRows(parseInvestigationRows(prescription?.investigation_items, prescription?.tests));
  }, [prescription]);

  useEffect(() => {
    if (prefersEyeTemplate) {
      setForm((prev) => (
        prev.template_type === 'general' && !prescription?.template_type
          ? {
              ...prev,
              template_type: 'eye',
              specialty_data: normalizeEyePrescriptionData(prev.specialty_data),
            }
          : prev
      ));
    }
  }, [prefersEyeTemplate, prescription?.template_type]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!data?.id || saving) return;
    setSaving(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const payload = {
        ...form,
        patient_name: toStr(form.patient_name).trim(),
        patient_age: toStr(form.patient_age).trim(),
        patient_contact: toStr(form.patient_contact).trim(),
        medications: buildMedicationsText(medicines),
        tests: buildTestsText(investigationRows),
        investigation_items: buildInvestigationItems(investigationRows),
        dose: buildDoseText(medicines),
        template_type: form.template_type || 'general',
        specialty_data: form.template_type === 'eye'
          ? normalizeEyePrescriptionData(form.specialty_data)
          : null,
      };
      const res = await fetch(`/doctor/prescriptions/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || 'Failed to update prescription.';
        toastError(msg);
      } else {
        const body = await res.json().catch(() => ({}));
        const updated = { ...data, ...payload, ...(body?.prescription || {}) };
        setData(updated);
        setForm(buildFormState(updated));
        setInvestigationRows(parseInvestigationRows(updated?.investigation_items, updated?.tests));
        toastSuccess('Prescription updated successfully.');
      }
    } catch (err) {
      toastError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(buildFormState(data));
    setMedicines(parseMedicationsText(data?.medications, data?.dose));
    setInvestigationRows(parseInvestigationRows(data?.investigation_items, data?.tests));
  };

  const handleSaveAndComplete = async () => {
    if (!data?.id || saving) return;
    setSaving(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const payload = {
        ...form,
        patient_name: toStr(form.patient_name).trim(),
        patient_age: toStr(form.patient_age).trim(),
        patient_contact: toStr(form.patient_contact).trim(),
        medications: buildMedicationsText(medicines),
        tests: buildTestsText(investigationRows),
        investigation_items: buildInvestigationItems(investigationRows),
        dose: buildDoseText(medicines),
        template_type: form.template_type || 'general',
        specialty_data: form.template_type === 'eye'
          ? normalizeEyePrescriptionData(form.specialty_data)
          : null,
        appointment_action: 'prescribed',
      };
      const res = await fetch(`/doctor/prescriptions/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toastError(body?.message || 'Failed to complete prescription.');
      } else {
        toastSuccess('Prescription completed successfully.');
        setTimeout(() => router.visit('/doctor/dashboard'), 500);
      }
    } catch (err) {
      toastError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Chamber info from prop (doctor's active chamber)
  const chamberName = chamberInfo?.name || '';
  const chamberAddress = chamberInfo?.location || '';
  const chamberPhone = chamberInfo?.phone || '';
  const chamberMapUrl = chamberInfo?.google_maps_url || '';
  const chamberQrSrc = chamberMapUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(chamberMapUrl)}`
    : '';
  const doctorLogoSrc = authUser?.profile_picture || '/stethoscope-2.png';

  const patientName = data?.patient_name || data?.user?.name || prescription?.user?.name || `User #${data?.user_id || prescription?.user_id || ''}`;
  const doctorName = data?.doctor?.name || prescription?.doctor?.name || authUser?.name || 'Doctor';
  const doctorEmail = data?.doctor?.email || prescription?.doctor?.email || authUser?.email || '';
  const doctorPhone = authUser?.phone || '';
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(data?.created_at || prescription?.created_at), [data?.created_at, prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(data?.created_at || prescription?.created_at), [data?.created_at, prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(editMode ? form?.next_visit_date : data?.next_visit_date || prescription?.next_visit_date), [editMode, form?.next_visit_date, data?.next_visit_date, prescription?.next_visit_date]);
  const visitDateLabel = useMemo(() => formatDisplayDate(data?.visit_date || data?.appointment?.appointment_date || prescription?.appointment?.appointment_date), [data?.visit_date, data?.appointment?.appointment_date, prescription?.appointment?.appointment_date]);

  // Patient info from prescription or user table - support both edit mode and view mode
  const patientAge = editMode ? form?.patient_age : resolvePatientAge(data || prescription || {});
  const patientAgeUnit = editMode ? form?.patient_age_unit || 'years' : data?.patient_age_unit || 'years';
  const patientGender = editMode ? form?.patient_gender : data?.patient_gender || data?.user?.gender || prescription?.user?.gender;
  const patientWeight = editMode ? form?.patient_weight : data?.patient_weight || data?.user?.weight || prescription?.user?.weight;
  const patientContact = editMode ? form?.patient_contact : data?.patient_contact || data?.user?.phone || prescription?.user?.phone;
  const visitType = editMode ? form?.visit_type : data?.visit_type || prescription?.visit_type;
  const prescriptionRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [reportNote, setReportNote] = useState('');
  const [reportText, setReportText] = useState('');
  const [showEditReportModal, setShowEditReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [editReportNote, setEditReportNote] = useState('');
  const [editReportText, setEditReportText] = useState('');
  const [updatingReport, setUpdatingReport] = useState(false);
  const [showReportUploadModal, setShowReportUploadModal] = useState(false);
  const reportEditorRef = useRef(null);
  const isPrintMode = useMemo(() => new URLSearchParams(window.location.search).get('action') === 'print', []);

  // Auto-print if action=print in URL
  useEffect(() => {
    if (isPrintMode) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isPrintMode]);

  useEffect(() => {
    const area = prescriptionRef.current;
    if (!area) return undefined;

    const handleBeforePrint = () => {
      const textareas = area.querySelectorAll('textarea');
      textareas.forEach((el) => {
        el.dataset.prevHeight = el.style.height || '';
        el.dataset.prevOverflow = el.style.overflow || '';
        el.style.height = 'auto';
        el.style.overflow = 'hidden';
        el.style.height = `${el.scrollHeight}px`;
      });
    };

    const handleAfterPrint = () => {
      const textareas = area.querySelectorAll('textarea');
      textareas.forEach((el) => {
        el.style.height = el.dataset.prevHeight || '';
        el.style.overflow = el.dataset.prevOverflow || '';
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const loadReports = async () => {
    const id = data?.id || prescription?.id;
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

  useEffect(() => {
    loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, prescription?.id]);

  const handleUploadReport = async (event) => {
    event?.preventDefault?.();

    const id = data?.id || prescription?.id;
    if (!id) {
      toastError('Prescription not found for report upload.');
      return;
    }

    const plainText = String(reportEditorRef.current?.innerText || reportText || '').trim();
    const trimmedText = plainText;
    if (!reportFile && !trimmedText) {
      toastError('Please choose a file or write a text report.');
      return;
    }

    try {
      setUploadingReport(true);
      const formData = new FormData();
      if (reportFile) formData.append('report_file', reportFile);
      if (trimmedText) formData.append('report_text', trimmedText);
      if (reportNote.trim()) formData.append('note', reportNote.trim());

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch(`/api/doctor/prescriptions/${id}/reports`, {
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
      if (!res.ok) {
        toastError(body?.message || 'Failed to upload report.');
        return;
      }

      toastSuccess(body?.message || 'Report uploaded successfully.');
      setReportFile(null);
      setReportNote('');
      setReportText('');
      setShowReportUploadModal(false);
      if (reportEditorRef.current) reportEditorRef.current.innerHTML = '';
      const fileInput = document.getElementById('doctor-report-upload-input');
      if (fileInput) fileInput.value = '';
      await loadReports();
    } catch {
      toastError('Network error while uploading report.');
    } finally {
      setUploadingReport(false);
    }
  };

  const openEditReportModal = (report) => {
    setEditingReport(report);
    setEditReportNote(report?.note || '');
    setEditReportText(report?.report_text || '');
    setShowEditReportModal(true);
  };

  const openViewReportModal = (report) => {
    setViewingReport(report || null);
    setShowViewReportModal(true);
  };

  const handleUpdateReport = async (event) => {
    event?.preventDefault?.();
    const id = data?.id || prescription?.id;
    const reportId = editingReport?.id;
    if (!id || !reportId) {
      toastError('Report not found for edit.');
      return;
    }

    try {
      setUpdatingReport(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const payload = {
        note: String(editReportNote || '').trim(),
        report_text: editReportText,
      };

      const res = await fetch(`/api/doctor/prescriptions/${id}/reports/${reportId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to update report.');
        return;
      }

      toastSuccess(body?.message || 'Report updated successfully.');
      setShowEditReportModal(false);
      setEditingReport(null);
      await loadReports();
    } catch {
      toastError('Network error while updating report.');
    } finally {
      setUpdatingReport(false);
    }
  };

  const formatBytes = (bytes) => {
    const value = Number(bytes || 0);
    if (!value || Number.isNaN(value)) return 'N/A';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrint = () => {
    if (isPrintMode) {
      window.print();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('action', 'print');
    const printWindow = window.open(url.toString(), '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      toastError('Popup blocked. Please allow popups for print preview.');
    }
  };

  const applyReportFormat = (command) => {
    try {
      document.execCommand(command, false);
      reportEditorRef.current?.focus();
    } catch {
      // keep editor usable even if formatting command fails
    }
  };

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;

    try {
      setDownloadingPDF(true);
      const element = prescriptionRef.current;
      if (!element) {
        toastError('Prescription content not found');
        return;
      }

      // Load html2pdf library from CDN via script tag
      const loadHtml2pdf = async () => {
        return new Promise((resolve, reject) => {
          if (window.html2pdf) {
            // Already loaded
            resolve(window.html2pdf);
          } else {
            // Load from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.12.0/html2pdf.bundle.min.js';
            script.onload = () => {
              if (window.html2pdf) {
                resolve(window.html2pdf);
              } else {
                reject(new Error('html2pdf not available after loading'));
              }
            };
            script.onerror = () => {
              reject(new Error('Failed to load html2pdf from CDN'));
            };
            document.head.appendChild(script);
          }
        });
      };

      let html2pdf;
      try {
        html2pdf = await loadHtml2pdf();
      } catch (error) {
        console.error('Failed to load html2pdf:', error);
        toastError('PDF library not available. Using print dialog instead.');
        window.print();
        return;
      }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `prescription-${data?.id || prescription?.id || 'prescription'}-${patientName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      toastSuccess('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      // Fallback to print dialog
      toastError('PDF generation failed. Opening print dialog instead.');
      setTimeout(() => window.print(), 500);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <DoctorLayout title="Prescription Details">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">
              Prescription <span className="text-slate-500">#{data?.id}</span>
            </h1>
            {data?.appointment?.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${data.appointment.status === 'prescribed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  data.appointment.status === 'awaiting_tests' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    data.appointment.status === 'in_consultation' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                {data.appointment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
            {patientName && (
              <span className="text-sm text-slate-500">Patient: <span className="font-semibold text-slate-700">{patientName}</span></span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/doctor/prescriptions"
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button
              type="button"
              onClick={() => setShowReportUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
            >
              <Upload className="h-4 w-4" />
              Upload Report
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-50"
            >
              {downloadingPDF ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Download className="h-4 w-4" />}
              {downloadingPDF ? 'Generating...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        {(loadingReports || reports.length > 0) && (
        <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Test Report Upload</h2>
            <span className="text-xs text-slate-400">File, title/note and text report</span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">File</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Note</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Text Report</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Size</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Uploaded</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingReports ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-center text-sm text-slate-400">Loading reports...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-center text-sm text-slate-400">No report uploaded yet.</td>
                  </tr>
                ) : reports.map((report) => (
                  <tr key={report.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-sm text-slate-700">{report.original_name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{report.note || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      {String(report.mime_type || '').startsWith('text/') ? (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          View Text
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{formatBytes(report.file_size)}</td>
                    <td className="px-3 py-2 text-sm text-slate-500">{formatDisplayFromDateLike(report.created_at) || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openViewReportModal(report)}
                          className="inline-flex items-center gap-1 font-semibold text-[#2D3A74] hover:underline"
                        >
                          <FileUp className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditReportModal(report)}
                          className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {showViewReportModal && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[122] flex items-start justify-center overflow-y-auto bg-[rgba(2,6,23,0.78)] backdrop-blur-sm p-4 pt-6 sm:pt-10 print:hidden">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h3 className="text-base font-bold text-slate-800">Report Details</h3>
                <button
                  type="button"
                  onClick={() => setShowViewReportModal(false)}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Title / Note</div>
                    <div className="mt-1 text-sm text-slate-800">{viewingReport?.note || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Uploaded</div>
                    <div className="mt-1 text-sm text-slate-800">{formatDisplayFromDateLike(viewingReport?.created_at) || '-'}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Report File</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <span className="font-medium">{viewingReport?.original_name || 'No file'}</span>
                    <span className="text-slate-400">{formatBytes(viewingReport?.file_size)}</span>
                    {viewingReport?.file_url ? (
                      <a
                        href={viewingReport.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                      >
                        Open File
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Text Report</div>
                  <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
                    {String(viewingReport?.report_text || '').trim() || '-'}
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowViewReportModal(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        ) : null}

        {showEditReportModal && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[121] flex items-start justify-center overflow-y-auto bg-[rgba(2,6,23,0.78)] backdrop-blur-sm p-4 pt-6 sm:pt-10 print:hidden">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h3 className="text-base font-bold text-slate-800">Edit Report</h3>
                <button
                  type="button"
                  onClick={() => setShowEditReportModal(false)}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateReport} className="space-y-4 px-5 py-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Title / Note</label>
                  <input
                    type="text"
                    value={editReportNote}
                    onChange={(e) => setEditReportNote(e.target.value)}
                    placeholder="e.g. CBC report"
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Text Report</label>
                  <textarea
                    rows={8}
                    value={editReportText}
                    onChange={(e) => setEditReportText(e.target.value)}
                    placeholder="Edit text report content"
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditReportModal(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingReport}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
                  >
                    {updatingReport ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Pencil className="h-4 w-4" />}
                    {updatingReport ? 'Updating...' : 'Update Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        ) : null}

        {showReportUploadModal && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(2,6,23,0.78)] backdrop-blur-sm p-4 pt-6 sm:pt-10 print:hidden">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h3 className="text-base font-bold text-slate-800">Upload Test Report</h3>
                <button
                  type="button"
                  onClick={() => setShowReportUploadModal(false)}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUploadReport} className="space-y-4 px-5 py-4">
                <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Report File (PDF/JPG/PNG)</label>
                    <input
                      id="doctor-report-upload-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Title / Note</label>
                    <input
                      type="text"
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      placeholder="e.g. CBC report"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Text Report</label>
                  <div className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5">
                      <button type="button" onClick={() => applyReportFormat('bold')} className="rounded border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-50">B</button>
                      <button type="button" onClick={() => applyReportFormat('italic')} className="rounded border border-slate-200 px-2 py-0.5 text-xs italic text-slate-700 hover:bg-slate-50">I</button>
                      <button type="button" onClick={() => applyReportFormat('underline')} className="rounded border border-slate-200 px-2 py-0.5 text-xs underline text-slate-700 hover:bg-slate-50">U</button>
                      <button type="button" onClick={() => applyReportFormat('insertUnorderedList')} className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50">• List</button>
                      <button type="button" onClick={() => applyReportFormat('insertOrderedList')} className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50">1. List</button>
                    </div>
                    <div className="relative">
                      {!reportText ? (
                        <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
                          Write report details here...
                        </span>
                      ) : null}
                      <div
                        ref={reportEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => setReportText(e.currentTarget.innerHTML)}
                        className="min-h-[170px] px-3 py-2 text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowReportUploadModal(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingReport || (!reportFile && !String(reportEditorRef.current?.innerText || reportText || '').trim())}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
                  >
                    {uploadingReport ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Upload className="h-4 w-4" />}
                    {uploadingReport ? 'Uploading...' : 'Upload Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        ) : null}

        {editMode ? (
          <div ref={prescriptionRef} className="prescription-print-area overflow-hidden rounded-xl border border-slate-300 bg-[#f8fafc] shadow-sm">
            <div className="h-4 bg-[#0b3f86]" />

            <div className="border-b border-slate-300 bg-white">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
                  <Stethoscope className="h-48 w-48 text-[#0b3f86]" />
                </div>

                <div className="relative z-10 grid grid-cols-2 divide-x divide-slate-300 px-8 py-7">
                  <div className="pr-8">
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
                          {authUser?.name || doctorName || 'Doctor'}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-600">
                          {authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}
                        </p>
                        <div className="mt-3 space-y-1.5">
                          {doctorPhone ? (
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-[#0b3f86]" />
                              <span>{doctorPhone}</span>
                            </div>
                          ) : null}
                          {doctorEmail ? (
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-[#0b3f86]" />
                              <span>{doctorEmail}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pl-8 flex flex-col items-end">
                    <div className="mb-1.5 flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b3f86]">Chamber</span>
                    </div>
                    <p className="text-2xl font-black tracking-tight text-[#0d2f63]">
                      {chamberName || 'Not set'}
                    </p>
                    {chamberAddress ? (
                      <div className="mt-2.5 flex items-start justify-end gap-1.5 text-sm text-slate-700">
                        <span>{chamberAddress}</span>
                      </div>
                    ) : null}
                    {chamberPhone ? (
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-sm text-slate-700">
                        <span>{chamberPhone}</span>
                      </div>
                    ) : null}
                    {chamberQrSrc ? (
                      <div className="mt-2 text-center">
                        <div className="inline-flex overflow-hidden rounded border border-slate-300 bg-white p-1">
                          <img src={chamberQrSrc} alt="Location QR" className="h-16 w-16 object-contain" />
                        </div>
                        <p className="mt-1 text-[10px] font-semibold text-slate-600">Scan for Location</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-[#f8fbff] px-8 py-4">
              <div className="grid grid-cols-5 divide-x divide-slate-300 gap-0">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 border-b border-dotted border-[#9aa8be] pb-1">
                    <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                    <input
                      className="flex-1 border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                      value={form.patient_name || ''}
                      onChange={(e) => handleChange('patient_name', e.target.value)}
                      placeholder="Patient name"
                    />
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                    <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        className="w-12 border-0 bg-transparent px-1.5 py-0.5 text-center text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                        value={form.patient_age || ''}
                        onChange={(e) => handleChange('patient_age', e.target.value)}
                        placeholder="—"
                      />
                      <select
                        className="min-w-[54px] border-0 bg-transparent px-1 py-0.5 text-sm text-slate-700 focus:outline-none"
                        value={form.patient_age_unit || 'years'}
                        onChange={(e) => handleChange('patient_age_unit', e.target.value)}
                      >
                        <option value="years">yr</option>
                        <option value="months">mo</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                    <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
                    <select
                      className="w-24 border-0 bg-transparent px-1 py-0.5 text-sm text-slate-900 focus:outline-none"
                      value={form.patient_gender || ''}
                      onChange={(e) => handleChange('patient_gender', e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2 px-2">
                  <div className="mx-auto flex w-full max-w-[220px] items-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                    <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                    <input
                      className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
                      value={form.patient_contact || ''}
                      onChange={(e) => handleChange('patient_contact', e.target.value)}
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-[500px] bg-white p-8 pb-8">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-3 space-y-6 border-r-2 border-dashed border-slate-200 pr-8">
                  <div className="flex min-h-[250px] flex-col rounded-xl border border-[#cad6e8] bg-[#f2f5fa] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div className="mb-3 inline-flex items-center gap-2 bg-[#0b4fa3] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}>
                      <FlaskConical className="h-4 w-4" />
                      Investigations
                    </div>

                    <div className="space-y-1 px-1">
                      {investigationRows.map((test, idx, arr) => (
                        <div key={idx} className="group flex items-center gap-1.5 border-b border-dotted border-[#9aa8be] pb-1">
                          <span className="text-slate-700">•</span>
                          <input
                            className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            value={test}
                            onChange={(e) => {
                              const next = [...investigationRows];
                              next[idx] = e.target.value;
                              setInvestigationRows(next);
                              handleChange('tests', buildTestsText(next));
                            }}
                            placeholder="Add test"
                          />
                          {arr.length > 1 ? (
                            <button
                              type="button"
                              className="rounded border border-rose-300 bg-rose-50 px-1.5 py-0 text-[11px] text-rose-800 opacity-0 transition group-hover:opacity-100"
                              onClick={() => {
                                const next = investigationRows.filter((_, i) => i !== idx);
                                const normalized = next.length ? next : [''];
                                setInvestigationRows(normalized);
                                handleChange('tests', buildTestsText(normalized));
                              }}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="mt-3 self-start text-xs font-semibold text-[#0b4fa3] hover:underline"
                      onClick={() => {
                        const next = [...investigationRows, ''];
                        setInvestigationRows(next);
                        handleChange('tests', buildTestsText(next));
                      }}
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
                          value={(String(form.diagnosis || '').split('\n')[0] || '')}
                          onChange={(e) => {
                            const next = String(form.diagnosis || '').split('\n');
                            while (next.length < 2) next.push('');
                            next[0] = e.target.value;
                            handleChange('diagnosis', next.join('\n'));
                          }}
                          placeholder="Provisional diagnosis"
                        />
                      </div>
                      <div className="group flex items-center gap-2 border-b border-dotted border-[#9aa8be] pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">F</span>
                        <input
                          className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                          value={(String(form.diagnosis || '').split('\n')[1] || '')}
                          onChange={(e) => {
                            const next = String(form.diagnosis || '').split('\n');
                            while (next.length < 2) next.push('');
                            next[1] = e.target.value;
                            handleChange('diagnosis', next.join('\n'));
                          }}
                          placeholder="Final diagnosis"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-9 space-y-6">
                  <PrescriptionMedicineSection
                    templateType={form.template_type}
                    medicines={medicines}
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
                    onDoseChange={(idx, value) => handleMedicineChange(idx, 'dosage', value)}
                    onDurationChange={(idx, value) => handleMedicineChange(idx, 'duration', value)}
                    onInstructionChange={(idx, value) => handleMedicineChange(idx, 'instruction', value)}
                    onRemove={removeMedicine}
                    onAdd={addMedicine}
                  />

                  <div className="border-t-2 border-dotted border-slate-200 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                    </div>

                    <div className="rounded-lg border border-[#d5deea] bg-[#f5f8fd] px-3 py-2.5 text-sm text-slate-800">
                      <p className="mb-1 font-semibold text-slate-800">Emergency Note:</p>
                      <textarea
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                        rows={2}
                        value={form.instructions || ''}
                        onChange={(e) => handleChange('instructions', e.target.value)}
                      />
                    </div>

                    <div className="followup-sign-row mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-[#dbe3ef] pt-3">
                      <div className="followup-date-block flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#0d2f63]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-[#0d2f63]">Follow-up Date</span>
                        <input
                          type="date"
                          className="min-w-[140px] rounded-md border border-[#cdd9ea] bg-[#f3f7fd] px-3 py-1 text-xs font-semibold text-slate-700"
                          value={form.next_visit_date || ''}
                          onChange={(e) => handleChange('next_visit_date', e.target.value)}
                        />
                      </div>

                      <div className="followup-signature-block flex items-end gap-3 text-right">
                        <div>
                          <div className="mb-1 border-b border-[#0d2f63] pb-1 text-lg font-semibold italic text-[#0d2f63]">
                            {authUser?.name || doctorName || 'Doctor'}
                          </div>
                          <div className="text-xs text-slate-600">
                            {authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Reg. No: {data?.doctor?.registration_no || authUser?.registration_no || '123456'}
                          </div>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0b3f86] bg-white p-2">
                          <img src={doctorLogoSrc} alt="Seal" className="h-full w-full object-contain" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#0b3f86] px-5 py-2.5 text-[11px] text-white">
                      <div className="grid grid-cols-3 divide-x divide-white/30">
                        <div className="flex items-center justify-center gap-2 px-2"><ClipboardList className="h-4 w-4" />Keep Monitoring</div>
                        <div className="flex items-center justify-center gap-2 px-2"><Heart className="h-4 w-4" />Compassionate Care</div>
                        <div className="flex items-center justify-center gap-2 px-2"><Calendar className="h-4 w-4" />Follow-up Required</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-500">
                    Created: {createdAtDateLabel || 'N/A'} {createdAtTimeLabel || ''}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl bg-[#3556a6] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:opacity-50"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {saving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    {data?.appointment?.status === 'awaiting_tests' ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                        disabled={saving}
                        onClick={handleSaveAndComplete}
                      >
                        {saving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FlaskConical className="h-4 w-4" />
                            Complete &amp; Mark Prescribed
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Prescription Layout - Shared Component */}
        {!editMode ? (
          <div className="prescription-print-area">
            <PrescriptionDocument
              prescription={{
                ...data,
                diagnosis: form.diagnosis,
                tests: form.tests,
                instructions: form.instructions,
                next_visit_date: form.next_visit_date,
                specialty_data: form.specialty_data,
              }}
              doctorInfo={{
                name: doctorName,
                email: doctorEmail,
                phone: doctorPhone,
                specialization: authUser?.specialization,
                degree: authUser?.degree,
              }}
              chamberInfo={chamberInfo}
              patientName={form.patient_name || patientName}
              patientAge={form.patient_age || patientAge}
              patientAgeUnit={form.patient_age_unit || patientAgeUnit}
              patientGender={form.patient_gender || patientGender}
              patientWeight={form.patient_weight || patientWeight}
              patientContact={form.patient_contact || patientContact}
              visitType={form.visit_type || visitType}
              templateType={form.template_type || templateType}
              medicines={medicines}
              nextVisitLabel={nextVisitLabel}
              createdAtDateLabel={createdAtDateLabel}
              createdAtTimeLabel={createdAtTimeLabel}
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
              downloadingPDF={downloadingPDF}
              showDownloadButton
              showActionBar={false}
              prescriptionRef={prescriptionRef}
            />
          </div>
        ) : null}

        {/* Print Styles */}
        <style>{`
        @media print {
          @page {
            size: A4;
            margin-top: 0;
            margin-left: 0;
            margin-right: 8mm;
            margin-bottom: 8mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .prescription-print-area {
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          .prescription-print-area .text-sm {
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          .prescription-print-area .text-xs {
            font-size: 10px !important;
            line-height: 1.25 !important;
          }

          /* Show only prescription block in print */
          body * { visibility: hidden !important; }
          .prescription-print-area,
          .prescription-print-area * { visibility: visible !important; }
          .prescription-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }

          /* Header two-column */
          .prescription-header-section > div {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .prescription-header-section > div > div {
            padding: 16px 24px !important;
          }

          /* Patient info strip */
          .patient-info-section {
            padding: 8px 32px !important;
          }
          .patient-info-section > div {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: flex-end !important;
            gap: 12px !important;
          }
          .patient-info-section > div > div {
            min-width: 0 !important;
            flex: 0 0 auto !important;
          }
          .patient-info-section > div > div:first-child {
            flex: 1 1 auto !important;
            min-width: 220px !important;
          }
          .patient-info-section span,
          .patient-info-section select,
          .patient-info-section input {
            font-size: 11px !important;
          }

          .prescription-content-section textarea,
          .prescription-content-section input,
          .prescription-content-section select {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }

          .medicine-row {
            padding: 4px 6px !important;
            gap: 6px !important;
            display: flex !important;
            align-items: flex-start !important;
          }

          .medicine-fields {
            display: grid !important;
            grid-template-columns: minmax(0, 2.6fr) repeat(2, minmax(46px, 64px)) !important;
            gap: 4px !important;
            width: 100% !important;
            flex: 1 1 auto !important;
          }

          .medicine-fields .col-span-4 {
            grid-column: 1 / 2 !important;
          }

          .medicine-row input {
            font-size: 10px !important;
            line-height: 1.15 !important;
            padding: 2px 6px !important;
            min-height: 22px !important;
          }

          .medicine-row textarea {
            font-size: 10px !important;
            line-height: 1.15 !important;
            padding: 2px 6px !important;
            min-height: 22px !important;
            white-space: pre-wrap !important;
            overflow-wrap: anywhere !important;
          }

          .medicine-timing {
            font-size: 9px !important;
            line-height: 1.1 !important;
            margin-top: 0 !important;
            min-width: 90px !important;
            max-width: 110px !important;
            flex: 0 0 100px !important;
          }

          .medicine-timing select {
            font-size: 10px !important;
            line-height: 1.1 !important;
            padding: 2px 4px !important;
            min-height: 22px !important;
            width: 100% !important;
          }

          .followup-sign-row {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: flex-end !important;
            justify-content: space-between !important;
            gap: 8px !important;
          }

          .followup-date-block {
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }

          .followup-signature-block {
            flex: 0 0 auto !important;
            white-space: nowrap !important;
          }

          .medicine-timing .text-\\[10px\\] {
            font-size: 9px !important;
          }

          .medicine-timing input[type="radio"] {
            width: 10px !important;
            height: 10px !important;
          }

          .medicine-row .rounded-full {
            font-size: 8px !important;
            padding: 1px 5px !important;
          }

          .prescription-content-section .text-5xl {
            font-size: 52px !important;
            line-height: 1 !important;
          }

          .prescription-content-section textarea {
            overflow: visible !important;
            max-height: none !important;
            white-space: pre-wrap !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Hide edit controls in print */
          .prescription-print-area button { display: none !important; }
        }
      `}</style>
      </div>
    </DoctorLayout>
  );
}


