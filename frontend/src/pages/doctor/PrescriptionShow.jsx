import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, ClipboardList, Heart, Phone, Mail, User, Stethoscope, Pill, FlaskConical, FileText, MapPin, Printer, ArrowLeft, Download, Save, X, Plus, Trash2, Upload, FileUp, Pencil } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import EyePrescriptionSection, {
  createEmptyEyePrescriptionData,
  isEyeSpecialist,
  normalizeEyePrescriptionData,
} from '../../components/prescription/EyePrescriptionSection';
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

  // Parse saved medications text back into structured rows
  const parseMedicationsText = (text) => {
    if (!text?.trim()) return [emptyMedicine()];
    const rows = text.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split(' - ');
      const nameStrength = parts[0] || '';
      const dosage = parts[1] || '';
      const duration = parts[2] || '';
      const instruction = parts[3] || '';
      return { name: nameStrength.trim(), strength: '', dosage, duration, instruction };
    });
    return rows.length ? rows : [emptyMedicine()];
  };

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
      if (duration) details.push(duration);
      if (instruction) details.push(instruction);
      if (details.length) parts.push(`- ${details.join(' - ')}`);
      return parts.join(' ');
    }).filter(Boolean).join('\n');
  };

  const [medicines, setMedicines] = useState(() => parseMedicationsText(prescription?.medications));
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
      const exactCached = cached.find((item) => normalizeMedicineName(item.name) === normalized);
      if (exactCached) {
        const fullName = [exactCached.name, exactCached.strength]
          .map((v) => String(v || '').trim())
          .filter(Boolean)
          .join(' ');
        setMedicines((prev) => prev.map((m, i) => i === rowIndex ? { ...m, name: fullName || rawName, strength: '' } : m));
      }
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
      const exact = matches.find((item) => normalizeMedicineName(item.name) === normalized);
      if (exact) {
        const fullName = [exact.name, exact.strength]
          .map((v) => String(v || '').trim())
          .filter(Boolean)
          .join(' ');
        setMedicines((prev) => prev.map((m, i) => i === rowIndex ? { ...m, name: fullName || rawName, strength: '' } : m));
      }
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
    setMedicines(parseMedicationsText(prescription?.medications));
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
        alert(msg);
      } else {
        const body = await res.json().catch(() => ({}));
        const updated = { ...data, ...payload, ...(body?.prescription || {}) };
        setData(updated);
        setForm(buildFormState(updated));
      }
    } catch (err) {
      alert('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(buildFormState(data));
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
    window.print();
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

        {/* Prescription Layout - Matches CreatePrescription */}
        {isPrintMode ? (
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
        ) : (
        <div ref={prescriptionRef} className="prescription-print-area">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm print:border-0 print:shadow-none">

            {/* Header - Letterhead Style */}
            <div className="prescription-header-section border-b border-slate-200">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
                {/* Inset vignette shadow */}
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

                {/* Decorative stethoscope SVG watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07] select-none">
                  <svg viewBox="0 0 280 360" className="h-full w-auto" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                    {/* Binaural spring arch */}
                    <path d="M 75 60 Q 140 18 205 60" strokeWidth="10" />
                    {/* Left ear tube */}
                    <path d="M 75 60 C 70 82 56 105 52 135" strokeWidth="8" />
                    {/* Right ear tube */}
                    <path d="M 205 60 C 210 82 224 105 228 135" strokeWidth="8" />
                    {/* Left long tube to junction */}
                    <path d="M 52 135 C 46 195 100 225 140 238" strokeWidth="8" />
                    {/* Right long tube to junction */}
                    <path d="M 228 135 C 234 195 180 225 140 238" strokeWidth="8" />
                    {/* Tube down to chestpiece */}
                    <path d="M 140 238 L 140 282" strokeWidth="10" />
                    {/* Chestpiece outer ring */}
                    <circle cx="140" cy="314" r="36" strokeWidth="12" />
                    {/* Chestpiece inner detail */}
                    <circle cx="140" cy="314" r="18" strokeWidth="5" />
                    <circle cx="140" cy="314" r="6" strokeWidth="4" fill="white" />
                    {/* Earpieces */}
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
                        <div className="flex items-center gap-1.5 text-sm text-slate-200 print:hidden">
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
                      {/* <MapPin className="h-3.5 w-3.5 text-blue-300" /> */}
                    </div>
                    <p className="text-2xl font-black tracking-tight text-white">
                      {chamberName || 'Not set'}
                    </p>
                    {chamberAddress ? (
                      <div className="mt-2.5 flex items-start justify-end gap-1.5 text-sm text-slate-200">
                        <span>{chamberAddress}</span>
                        {/* <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" /> */}
                      </div>
                    ) : null}
                    {chamberPhone ? (
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-sm text-slate-200 print:hidden">
                        <span>{chamberPhone}</span>
                        {/* <Phone className="h-3.5 w-3.5 shrink-0 text-blue-300" /> */}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Info Strip - Prescription Pad Style */}
            <div className="patient-info-section border-b border-slate-200 bg-white px-8 py-4">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                {/* Name */}
                <div className="flex min-w-[180px] flex-1 items-end gap-2">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                  {isPrintMode ? (
                    <span className="flex-1 border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-900">{form.patient_name || '\u00a0'}</span>
                  ) : (
                    <input
                      className="flex-1 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                      value={form.patient_name || ''}
                      onChange={(e) => handleChange('patient_name', e.target.value)}
                      placeholder="Patient name"
                    />
                  )}
                </div>
                {/* Age */}
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                  {isPrintMode ? (
                    <span className="w-16 border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-900">
                      {form.patient_age ? `${form.patient_age} ${form.patient_age_unit === 'months' ? 'mo' : 'yr'}` : '\u00a0'}
                    </span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <input
                        className="w-10 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-center text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                        value={form.patient_age || ''}
                        onChange={(e) => handleChange('patient_age', e.target.value)}
                        placeholder="—"
                      />
                      <select
                        className="border-b border-slate-300 bg-transparent pb-0.5 text-xs text-slate-600 focus:border-[#2D3A74] focus:outline-none"
                        value={form.patient_age_unit || 'years'}
                        onChange={(e) => handleChange('patient_age_unit', e.target.value)}
                      >
                        <option value="years">yr</option>
                        <option value="months">mo</option>
                      </select>
                    </div>
                  )}
                </div>
                {/* Gender */}
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
                  {isPrintMode ? (
                    <span className="w-16 border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-900">
                      {form.patient_gender ? form.patient_gender.charAt(0).toUpperCase() + form.patient_gender.slice(1) : '\u00a0'}
                    </span>
                  ) : (
                    <select
                      className="w-24 border-b border-slate-300 bg-transparent pb-0.5 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                      value={form.patient_gender || ''}
                      onChange={(e) => handleChange('patient_gender', e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  )}
                </div>
                {/* Weight */}
                {/* <div className="flex items-end gap-1.5">
                <span className="shrink-0 text-xs font-bold text-slate-600">Weight:</span>
                {isPrintMode ? (
                  <span className="w-14 border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-900">
                    {form.patient_weight ? `${form.patient_weight} kg` : '\u00a0'}
                  </span>
                ) : (
                  <input
                    className="w-16 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                    value={form.patient_weight || ''}
                    onChange={(e) => handleChange('patient_weight', e.target.value)}
                    placeholder="kg"
                  />
                )}
              </div> */}
                {/* Visit Type — edit mode only */}
                {/* {!isPrintMode && (
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Visit:</span>
                  <select
                    className="w-24 border-b border-slate-300 bg-transparent pb-0.5 text-sm text-slate-900 focus:border-[#2D3A74] focus:outline-none"
                    value={form.visit_type || ''}
                    onChange={(e) => handleChange('visit_type', e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="New">New</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              )} */}
                {/* Contact */}
                <div className="flex items-end gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400 mb-1" />
                  {isPrintMode ? (
                    <span className="w-28 border-b border-slate-400 pb-0.5 text-sm font-semibold text-slate-900">
                      {form.patient_contact || '\u00a0'}
                    </span>
                  ) : (
                    <input
                      className="w-32 border-b border-slate-300 bg-transparent px-0 pb-0.5 text-sm text-slate-900 placeholder-slate-300 focus:border-[#2D3A74] focus:outline-none"
                      value={form.patient_contact || ''}
                      onChange={(e) => handleChange('patient_contact', e.target.value)}
                      placeholder="Contact"
                    />
                  )}
                </div>
                {/* Date — right-aligned */}

              </div>
            </div>

            {/* Prescription Content - Matches CreatePrescription column layout */}
            <div className="rx-pad-inputs prescription-content-section min-h-[500px] bg-white p-8 pb-12">
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Prescription Template</div>
                  <div className="mt-1 text-sm text-slate-600">Switch between the regular prescription pad and a dedicated eye-refraction layout.</div>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                  {[
                    { value: 'general', label: 'General', Icon: ClipboardList },
                    { value: 'eye', label: 'Eye', Icon: Stethoscope },
                  ].map(({ value, label, Icon }) => {
                    const active = form.template_type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('template_type', value)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-[#3556a6] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.template_type === 'eye' ? (
                <div className="mb-6">
                  <EyePrescriptionSection
                    value={form.specialty_data}
                    onChange={(nextValue) => handleChange('specialty_data', nextValue)}
                    readOnly={isPrintMode}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-12 gap-8">

                {/* Left Column - Tests + Diagnosis */}
                <div className="col-span-3 space-y-6 border-r-2 border-dashed border-slate-200 pr-8">
                  {/* Investigations */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <FlaskConical className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Investigations</span>
                    </div>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
                      rows={6}
                      value={form.tests || ''}
                      onChange={(e) => handleChange('tests', e.target.value)}
                      placeholder="CBC, ESR, Urine R/E..."
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Stethoscope className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnosis</span>
                    </div>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
                      rows={8}
                      value={form.diagnosis || ''}
                      onChange={(e) => handleChange('diagnosis', e.target.value)}
                      placeholder="Provisional / Final diagnosis"
                    />
                  </div>
                </div>

                {/* Right Column - Rx Medications + Advice + Follow-up */}
                <div className="col-span-9 space-y-6">
                  {/* Rx Medications */}
                  <div>
                    <div className="relative mb-4">
                      <div className="absolute left-[-25px] top-[-23px] z-[999] text-5xl font-serif font-bold italic text-slate-800">℞</div>
                      <div className="flex-1 pt-8">
                        <div className="space-y-2">
                          {medicines.map((m, idx) => {
                            const normalizedMedicineName = normalizeMedicineName(m.name);
                            const matchedSuggestions = medicineMatchesByRow[idx] || [];
                            const hasMedicineMatches = matchedSuggestions.length > 0;
                            const showMedicineMatchDropdown = focusedMedicineIndex === idx && hasMedicineMatches;
                            return (
                            <div key={idx} className="medicine-row group/med relative flex items-start gap-2.5 rounded-xl border border-[#c8d6f3] bg-white p-3 pr-10 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:border-[#b9caee] hover:bg-slate-50">
                              <span className="mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-slate-100 px-1 text-[11px] font-bold text-slate-500 flex-shrink-0 print:hidden">{idx + 1}</span>
                              <div className="medicine-fields flex-1 grid grid-cols-6 gap-2.5">
                                <div className="col-span-4 relative min-w-0">
                                  <input
                                    className="w-full rounded border px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                    value={m.name}
                                    onFocus={() => {
                                      setFocusedMedicineIndex(idx);
                                      void queryMedicineMatches(m.name, idx);
                                    }}
                                    onBlur={() => {
                                      window.setTimeout(() => {
                                        setFocusedMedicineIndex((current) => (current === idx ? null : current));
                                      }, 120);
                                    }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleMedicineChange(idx, 'name', val);
                                      void queryMedicineMatches(val, idx);
                                    }}
                                    placeholder="e.g. Algecal C Plus 100mg+327mg+500mg"
                                  />
                                  {showMedicineMatchDropdown ? (
                                    <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-[#c7d6f7] bg-white shadow-lg">
                                      {matchedSuggestions.slice(0, 8).map((med, optionIdx) => (
                                        <button
                                          key={`${med.id ?? med.name}-${med.strength}-${optionIdx}`}
                                          type="button"
                                          className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-[#edf2ff]"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleMedicineChange(
                                              idx,
                                              'name',
                                              [med.name, med.strength]
                                                .map((v) => String(v || '').trim())
                                                .filter(Boolean)
                                                .join(' '),
                                            );
                                            handleMedicineChange(idx, 'strength', '');
                                            setFocusedMedicineIndex(null);
                                          }}
                                        >
                                          <span className="font-semibold text-slate-800">{med.name}</span>
                                          <span className="text-slate-500">{med.strength || 'No strength'}</span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                  {/* {normalizedMedicineName && !hasMedicineMatches ? (
                                    <p className="mt-1 text-[11px] font-medium text-amber-700">No medicine match found.</p>
                                  ) : null} */}
                                </div>
                                <textarea
                                  rows={1}
                                  className="rounded border px-3 py-1.5 text-sm text-slate-900 doc-input-focus resize-none leading-tight"
                                  value={m.dosage}
                                  onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                                  placeholder="e.g. 1+0+1"
                                />
                                <textarea
                                  rows={1}
                                  className="rounded border px-3 py-1.5 text-sm text-slate-900 doc-input-focus resize-none leading-tight"
                                  value={m.duration}
                                  onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                                  placeholder="Duration"
                                />
                              </div>
                              <div className="medicine-timing mt-0.5 flex min-w-[175px] flex-col gap-1 text-xs text-slate-600 flex-shrink-0">
                                <select
                                  className="rounded border border-slate-200 bg-slate-50/50 px-2 py-1 text-xs text-slate-900 doc-input-focus"
                                  value={m.instruction || ''}
                                  onChange={(e) => handleMedicineChange(idx, 'instruction', e.target.value)}
                                >
                                  <option value="">None</option>
                                  <option value="After meal">After meal</option>
                                  <option value="Before meal">Before meal</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                className="absolute right-2 top-2 rounded border border-rose-300 bg-rose-50 px-1.5 py-1 text-xs text-rose-800 opacity-0 transition hover:bg-rose-100 group-hover/med:opacity-100"
                                onClick={() => removeMedicine(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );})}

                          {/* Add Medicine */}
                          <button
                            type="button"
                            onClick={addMedicine}
                            className="w-full rounded border-2 border-dashed border-[#d7dfec] bg-[#edf1fb] px-3 py-2 text-xs font-semibold text-[#3556a6] transition hover:bg-[#e4eafb] flex items-center justify-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Medicine Row
                          </button>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advice / Instructions */}
                  <div className="border-t-2 border-dotted border-slate-200 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                    </div>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
                      rows={4}
                      value={form.instructions || ''}
                      onChange={(e) => handleChange('instructions', e.target.value)}
                      placeholder="Diet, lifestyle, rest instructions..."
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3556a6]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Follow-up Date</span>
                      </div>
                      <input
                        type="date"
                        className="rounded-md border px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                        value={form.next_visit_date || ''}
                        onChange={(e) => handleChange('next_visit_date', e.target.value)}
                      />
                      {form.next_visit_date && (
                        <span className="rounded-full border border-[#d7dfec] bg-[#edf1fb] px-3 py-1 text-xs font-semibold text-[#3556a6]">
                          {nextVisitLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar - same style as CreatePrescription */}
              <div className="mt-10 rounded-xl border bg-slate-50 p-6 print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-400">
                    Created: {createdAtDateLabel} {createdAtTimeLabel} Â· ID #{data?.id}
                  </div>
                 
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl border bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-[#3556a6] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:opacity-50"
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
                    {data?.appointment?.status === 'awaiting_tests' && (
                      <button
                        type="button"
                        onClick={handleSaveAndComplete}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3556a6] to-[#c57945] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FlaskConical className="h-4 w-4" />
                            Complete &amp; Mark Prescribed
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Print Styles */}
        <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          html, body {
            background: #ffffff !important;
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
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
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


