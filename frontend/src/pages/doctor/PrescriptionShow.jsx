import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, ClipboardList, Heart, Phone, Mail, User, Stethoscope, Pill, FlaskConical, FileText, MapPin, Printer, ArrowLeft, MessageCircle, Download, Share2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';

export default function PrescriptionShow({ prescription, chamberInfo, medicines: medicineSuggestions = [] }) {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const prescriptionSettings = page?.props?.site?.prescription || {};

  const toStr = (val) => (val === null || val === undefined ? '' : String(val));
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

  const emptyMedicine = () => ({ name: '', strength: '', dosage: '', duration: '', instruction: 'After meal' });

  // Parse saved medications text back into structured rows
  const parseMedicationsText = (text) => {
    if (!text?.trim()) return [emptyMedicine()];
    const rows = text.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split(' - ');
      const nameStrength = parts[0] || '';
      const dosage = parts[1] || '';
      const duration = parts[2] || '';
      const instruction = parts[3] || 'After meal';
      // Try to extract strength (last word matching mg/ml/mcg/g/IU/% patterns)
      const strengthRx = /^(.*?)\s+(\d+(?:\.\d+)?(?:mg|mcg|ml|g|IU|%|mg\/ml|mg\/5ml|iu)(?:\/\w+)?)\s*$/i;
      const match = nameStrength.match(strengthRx);
      return match
        ? { name: match[1].trim(), strength: match[2], dosage, duration, instruction }
        : { name: nameStrength.trim(), strength: '', dosage, duration, instruction };
    });
    return rows.length ? rows : [emptyMedicine()];
  };

  // Build medications text from structured rows (same format as CreatePrescription)
  const buildMedicationsText = (meds) => {
    return (meds || []).map(m => {
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
    }).filter(Boolean).join('\n');
  };

  const [medicines, setMedicines] = useState(() => parseMedicationsText(prescription?.medications));

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
  const [sharing, setSharing] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Auto-print if action=print in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'print') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, []);

  const handlePrint = () => {
    window.print();
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

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Prescription for ${patientName}`);
    const body = encodeURIComponent(
      `Please find the prescription details below:\n\n` +
      `Patient: ${patientName}\n` +
      `Date: ${visitDateLabel || createdAtDateLabel}\n` +
      `Prescription ID: #${data?.id || prescription?.id}\n\n` +
      `View full prescription: ${window.location.href}\n\n` +
      `Thank you for choosing our clinic.`
    );
    const email = data?.user?.email || prescription?.user?.email || '';
    if (email) {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    } else {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `*Prescription for ${patientName}*\n\n` +
      `Date: ${visitDateLabel || createdAtDateLabel}\n` +
      `Prescription ID: #${data?.id || prescription?.id}\n\n` +
      `View full prescription:\n${window.location.href}\n\n` +
      `Thank you for choosing our clinic.`
    );
    const phone = data?.user?.phone || prescription?.user?.phone || patientContact || '';
    const whatsappUrl = phone 
      ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Prescription for ${patientName}`,
          text: `Prescription ID: #${data?.id || prescription?.id}`,
          url: window.location.href,
        });
        toastSuccess('Prescription shared successfully');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toastSuccess('Prescription link copied to clipboard');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          toastSuccess('Prescription link copied to clipboard');
        } catch (clipboardError) {
          toastError('Failed to share prescription');
        }
      }
    }
  };

  return (
    <DoctorLayout title="Prescription Details">
      <div className="mx-auto max-w-6xl space-y-6">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] p-8 shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] print:hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-[#efba92]/15" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5" />
              Prescription Details
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white lg:text-4xl">
              Prescription <span className="text-white/70">#{data?.id}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {data?.appointment?.status && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  data.appointment.status === 'prescribed' ? 'bg-[#c57945]/20 text-[#ffe1c9] border border-[#efc7a9]/40' :
                  data.appointment.status === 'awaiting_tests' ? 'bg-[#efba92]/20 text-[#ffe6d3] border border-[#efba92]/35' :
                  data.appointment.status === 'in_consultation' ? 'bg-[#3556a6]/20 text-[#dfe8ff] border border-[#b9caee]/35' :
                  'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  {data.appointment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              )}
              {patientName && (
                <span className="text-sm text-white/60">Patient: <span className="font-semibold text-white/90">{patientName}</span></span>
              )}
            </div>
          </div>

          {/* Right – Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
            <Link
              href="/doctor/prescriptions"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSharing(!sharing)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              {sharing && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSharing(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                    <button onClick={() => { handleShareEmail(); setSharing(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition first:rounded-t-xl">
                      <Mail className="h-4 w-4 text-[#3556a6]" /> Share via Email
                    </button>
                    <button onClick={() => { handleShareWhatsApp(); setSharing(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                      <MessageCircle className="h-4 w-4 text-green-600" /> Share via WhatsApp
                    </button>
                    <button onClick={() => { handleShareLink(); setSharing(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition last:rounded-b-xl">
                      <Share2 className="h-4 w-4 text-slate-500" /> Copy Link
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              {downloadingPDF ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Download className="h-4 w-4" />}
              {downloadingPDF ? 'Generating...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Layout - Matches CreatePrescription */}
      <div ref={prescriptionRef}>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">

          {/* Header - Two Glass Cards */}
          <div className="border-b-4 border-[#253566] bg-gradient-to-r from-[#253566] via-[#3d466b] to-[#c57945] p-6 text-white md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {/* Doctor Info - Left */}
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/80">Doctor Information</div>
                <div className="text-2xl font-black tracking-wide">{authUser?.name || 'Doctor'}</div>
                <div className="mt-1 text-sm font-medium text-white/90">{authUser?.specialization || authUser?.degree || 'MBBS, FCPS'}</div>
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

              {/* Chamber Info - Right */}
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-right backdrop-blur-sm md:p-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/80">Chamber Information</div>
                <div className="text-lg font-bold">{chamberName || 'Not set'}</div>
                {chamberAddress && (
                  <div className="mt-2 border-t border-white/20 pt-1.5">
                    <div className="mb-0.5 text-[10px] font-semibold opacity-80">Chamber</div>
                    <div className="flex items-start justify-end gap-1 text-[10px] opacity-75">
                      <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                      <span className="max-w-xs leading-tight">{chamberAddress}</span>
                    </div>
                  </div>
                )}
                {chamberPhone && (
                  <div className="mt-2 space-y-0.5 border-t border-white/20 pt-1.5">
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      <Phone className="h-2.5 w-2.5" />
                      <span className="font-medium">Call:</span>
                      <span className="opacity-90">{chamberPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Info Section - Editable Grid (same as CreatePrescription) */}
          <div className="border-b-2 border-dashed border-slate-200 bg-slate-50 px-8 py-5">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
              <User className="h-5 w-5 text-[#3556a6]" />
              <span className="text-sm font-semibold text-slate-800">Patient Information</span>
              <span className="ml-auto text-xs text-slate-400">Prescription #{data?.id} · {visitDateLabel || createdAtDateLabel}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Patient Name *</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                  value={form.patient_name || ''}
                  onChange={(e) => handleChange('patient_name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Contact</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                  value={form.patient_contact || ''}
                  onChange={(e) => handleChange('patient_contact', e.target.value)}
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Age</label>
                <div className="flex gap-1">
                  <input
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                    value={form.patient_age || ''}
                    onChange={(e) => handleChange('patient_age', e.target.value)}
                    placeholder="25"
                  />
                  <select
                    className="w-20 rounded-md bg-white border border-slate-200 px-1 py-1.5 text-xs text-slate-900 doc-input-focus"
                    value={form.patient_age_unit || 'years'}
                    onChange={(e) => handleChange('patient_age_unit', e.target.value)}
                  >
                    <option value="years">Y</option>
                    <option value="months">M</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Gender</label>
                <select
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                  value={form.patient_gender || ''}
                  onChange={(e) => handleChange('patient_gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Weight (kg)</label>
                <input
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                  value={form.patient_weight || ''}
                  onChange={(e) => handleChange('patient_weight', e.target.value)}
                  placeholder="70"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Visit Type</label>
                <select
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-sm text-slate-900 doc-input-focus"
                  value={form.visit_type || ''}
                  onChange={(e) => handleChange('visit_type', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prescription Content - Matches CreatePrescription column layout */}
          <div className="min-h-[500px] bg-white p-8 pb-12">
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
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
                  <div className="mb-4 flex items-start gap-3">
                    <div className="text-5xl font-serif font-bold italic text-slate-800">℞</div>
                    <div className="flex-1 pt-2">
                      <div className="space-y-2">
                        {medicines.map((m, idx) => (
                          <div key={idx} className="group/med flex items-start gap-2 rounded border border-slate-200 bg-white p-2 hover:border-[#b9caee] hover:bg-slate-50">
                            <span className="mt-2 text-xs font-bold text-slate-400 flex-shrink-0">{idx + 1}.</span>
                            <div className="flex-1 grid grid-cols-6 gap-2">
                              <input
                                className="col-span-2 rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                value={m.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const match = medicineSuggestions.find(med => med.name.toLowerCase() === val.toLowerCase());
                                  handleMedicineChange(idx, 'name', val);
                                  if (match?.strength) handleMedicineChange(idx, 'strength', match.strength);
                                }}
                                placeholder="Medicine name"
                                list="med-suggestions-show"
                              />
                              <input
                                className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                value={m.strength}
                                onChange={(e) => handleMedicineChange(idx, 'strength', e.target.value)}
                                placeholder="Strength"
                              />
                              <input
                                className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                value={m.dosage}
                                onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                                placeholder="e.g. 1+0+1"
                              />
                              <input
                                className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
                                value={m.duration}
                                onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                                placeholder="Duration"
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-slate-600 flex-shrink-0">
                              <span className="font-semibold text-[10px]">Timing</span>
                              <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input type="radio" className="h-3 w-3" value="After meal"
                                    checked={m.instruction === 'After meal'}
                                    onChange={() => handleMedicineChange(idx, 'instruction', 'After meal')}
                                  />
                                  <span>After meal</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input type="radio" className="h-3 w-3" value="Before meal"
                                    checked={m.instruction === 'Before meal'}
                                    onChange={() => handleMedicineChange(idx, 'instruction', 'Before meal')}
                                  />
                                  <span>Before meal</span>
                                </label>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mt-1 opacity-0 group-hover/med:opacity-100 flex-shrink-0 rounded border border-rose-300 bg-rose-50 px-1.5 py-1 text-xs text-rose-800 hover:bg-rose-100 transition"
                              onClick={() => removeMedicine(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Add Medicine */}
                        <button
                          type="button"
                          onClick={addMedicine}
                          className="w-full rounded border-2 border-dashed border-[#d7dfec] bg-[#edf1fb] px-3 py-2 text-xs font-semibold text-[#3556a6] transition hover:bg-[#e4eafb] flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Medicine Row
                        </button>

                        <datalist id="med-suggestions-show">
                          {medicineSuggestions.map((med) => (
                            <option key={med.id ?? med.name} value={med.name}>
                              {med.strength ? `${med.name} ${med.strength}` : med.name}
                            </option>
                          ))}
                        </datalist>
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 shadow-sm doc-input-focus"
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
                      className="rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 doc-input-focus"
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
            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-400">
                  Created: {createdAtDateLabel} {createdAtTimeLabel} Â· ID #{data?.id}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
      </div>
    </DoctorLayout>
  );
}
