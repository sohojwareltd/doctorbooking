import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, ClipboardList, Heart, Phone, Mail, User, Stethoscope, Pill, FlaskConical, FileText, MapPin, Printer, ArrowLeft, MessageCircle, Download, Share2, Save, X } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';

export default function PrescriptionShow({ prescription, contactInfo }) {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const prescriptionSettings = page?.props?.site?.prescription || {};

  const toStr = (val) => (val === null || val === undefined ? '' : String(val));

  const [data, setData] = useState(prescription || {});
  const [editMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    diagnosis: prescription?.diagnosis || '',
    medications: prescription?.medications || '',
    instructions: prescription?.instructions || '',
    tests: prescription?.tests || '',
    next_visit_date: prescription?.next_visit_date || '',
    patient_contact: prescription?.patient_contact || prescription?.user?.phone || '',
    patient_age: prescription?.patient_age !== undefined && prescription?.patient_age !== null
      ? String(prescription.patient_age)
      : prescription?.user?.age !== undefined && prescription?.user?.age !== null
        ? String(prescription.user.age)
        : '',
    patient_age_unit: prescription?.patient_age_unit || 'years',
    patient_gender: prescription?.patient_gender || prescription?.user?.gender || '',
    patient_weight: prescription?.patient_weight || '',
    visit_type: prescription?.visit_type || '',
  });

  useEffect(() => {
    setData(prescription || {});
    setForm({
      diagnosis: prescription?.diagnosis || '',
      medications: prescription?.medications || '',
      instructions: prescription?.instructions || '',
      tests: prescription?.tests || '',
      next_visit_date: prescription?.next_visit_date || '',
      patient_contact: prescription?.patient_contact || prescription?.user?.phone || '',
      patient_age: prescription?.patient_age !== undefined && prescription?.patient_age !== null
        ? String(prescription.patient_age)
        : prescription?.user?.age !== undefined && prescription?.user?.age !== null
          ? String(prescription.user.age)
          : '',
      patient_age_unit: prescription?.patient_age_unit || 'years',
      patient_gender: prescription?.patient_gender || prescription?.user?.gender || '',
      patient_weight: prescription?.patient_weight || '',
      visit_type: prescription?.visit_type || '',
    });
  }, [prescription]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!data?.id || saving) return;
    setSaving(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch(`/doctor/prescriptions/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || 'Failed to update prescription.';
        alert(msg);
      } else {
        const body = await res.json().catch(() => ({}));
        const updated = { ...data, ...form, ...(body?.prescription || {}) };
        setData(updated);
        setForm({
          diagnosis: updated?.diagnosis || '',
          medications: updated?.medications || '',
          instructions: updated?.instructions || '',
          tests: updated?.tests || '',
          next_visit_date: updated?.next_visit_date || '',
          patient_contact: updated?.patient_contact || updated?.user?.phone || '',
          patient_age: toStr(updated?.patient_age ?? updated?.user?.age),
          patient_age_unit: updated?.patient_age_unit || 'years',
          patient_gender: updated?.patient_gender || updated?.user?.gender || '',
          patient_weight: updated?.patient_weight || '',
          visit_type: updated?.visit_type || '',
        });
      }
    } catch (err) {
      alert('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      diagnosis: data?.diagnosis || '',
      medications: data?.medications || '',
      instructions: data?.instructions || '',
      tests: data?.tests || '',
      next_visit_date: data?.next_visit_date || '',
      patient_contact: data?.patient_contact || data?.user?.phone || '',
      patient_age: toStr(data?.patient_age ?? data?.user?.age),
      patient_age_unit: data?.patient_age_unit || 'years',
      patient_gender: data?.patient_gender || data?.user?.gender || '',
      patient_weight: data?.patient_weight || '',
      visit_type: data?.visit_type || '',
    });
  };
  
  // Clinic info from contactInfo or fallback to prescriptionSettings
  const clinicData = contactInfo?.clinic || {};
  const clinicName = clinicData?.name || prescriptionSettings?.clinicName || page?.props?.name || 'MediCare';
  const clinicAddress = [
    clinicData?.line1,
    clinicData?.line2,
    clinicData?.line3
  ].filter(Boolean).join(', ') || prescriptionSettings?.address || '';
  
  // Contact methods from contactInfo
  const contactMethods = contactInfo?.methods || [];
  const phoneMethod = contactMethods.find(m => m.icon === 'Phone' || m.title?.toLowerCase().includes('call'));
  const whatsappMethod = contactMethods.find(m => m.icon === 'MessageCircle' || m.title?.toLowerCase().includes('whatsapp'));
  const emailMethod = contactMethods.find(m => m.icon === 'Mail' || m.title?.toLowerCase().includes('email'));
  
  const clinicPhone = phoneMethod?.value || prescriptionSettings?.phone || page?.props?.site?.contactPhone || '';
  const clinicWhatsApp = whatsappMethod?.value || '';
  const clinicEmail = emailMethod?.value || prescriptionSettings?.email || page?.props?.site?.contactEmail || '';
  
  const clinicLogoUrl = prescriptionSettings?.logoUrl || '';
  const clinicRegistration = prescriptionSettings?.registrationNo || authUser?.registration_no || '';
  const clinicWebsite = prescriptionSettings?.website || page?.props?.site?.website || '';

  const patientName = data?.patient_name || data?.user?.name || prescription?.user?.name || `User #${data?.user_id || prescription?.user_id || ''}`;
  const doctorName = data?.doctor?.name || prescription?.doctor?.name || authUser?.name || 'Doctor';
  const doctorEmail = data?.doctor?.email || prescription?.doctor?.email || authUser?.email || '';
  const doctorPhone = authUser?.phone || '';
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(data?.created_at || prescription?.created_at), [data?.created_at, prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(data?.created_at || prescription?.created_at), [data?.created_at, prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(editMode ? form?.next_visit_date : data?.next_visit_date || prescription?.next_visit_date), [editMode, form?.next_visit_date, data?.next_visit_date, prescription?.next_visit_date]);
  const visitDateLabel = useMemo(() => formatDisplayDate(data?.visit_date || data?.appointment?.appointment_date || prescription?.appointment?.appointment_date), [data?.visit_date, data?.appointment?.appointment_date, prescription?.appointment?.appointment_date]);

  // Patient info from prescription or user table - support both edit mode and view mode
  const patientAge = editMode 
    ? form?.patient_age 
    : (data?.patient_age !== undefined && data?.patient_age !== null 
        ? data.patient_age 
        : (data?.user?.age !== undefined && data?.user?.age !== null 
            ? data.user.age 
            : (prescription?.user?.date_of_birth 
                ? (() => {
                    const birthDate = new Date(prescription.user.date_of_birth);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  })()
                : null)));
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

      // Dynamically import html2pdf
      let html2pdf;
      try {
        const html2pdfModule = await import('html2pdf.js');
        html2pdf = html2pdfModule.default || html2pdfModule;
      } catch (importError) {
        console.error('Failed to import html2pdf:', importError);
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
      {/* Action Buttons - Above prescription */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/doctor/prescriptions" className="flex items-center gap-2 rounded-xl border-2 border-[#005963]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#005963] shadow-sm transition hover:bg-[#005963]/5">
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
          {/* Share Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSharing(!sharing)}
              className="flex items-center gap-2 rounded-xl border-2 border-[#00acb1]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#005963] shadow-sm transition hover:bg-[#00acb1]/5"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            {sharing && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setSharing(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={() => {
                      handleShareEmail();
                      setSharing(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl"
                  >
                    <Mail className="h-4 w-4 text-blue-600" />
                    Share via Email
                  </button>
                  <button
                    onClick={() => {
                      handleShareWhatsApp();
                      setSharing(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      handleShareLink();
                      setSharing(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition last:rounded-b-xl"
                  >
                    <Share2 className="h-4 w-4 text-gray-600" />
                    Copy Link
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 rounded-xl border-2 border-[#005963]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#005963] shadow-sm transition hover:bg-[#005963]/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPDF ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#005963] border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <X className="h-4 w-4" />
            Reset Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#005963] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#004852] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Physical Prescription Paper */}
      <div className="mx-auto max-w-4xl" ref={prescriptionRef}>
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl print:border-0 print:shadow-none">
          
          {/* Prescription Header - Like real prescription pad */}
          <div className="border-b-4 border-[#005963] bg-gradient-to-r from-[#005963] via-[#007a7a] to-[#00acb1] p-6 text-white">
            <div className="flex items-start justify-between">
              {/* Doctor Info - Left */}
              <div className="flex-1">
                <div className="text-2xl font-black tracking-wide">{doctorName}</div>
                <div className="mt-1 text-sm font-medium opacity-90">MBBS, FCPS (Medicine)</div>
                {doctorPhone && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span>{doctorPhone}</span>
                  </div>
                )}
                {doctorEmail && (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <span>{doctorEmail}</span>
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
                  {clinicPhone && (
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      <Phone className="h-2.5 w-2.5" />
                      <span className="font-medium">Call:</span>
                      <span className="opacity-90">{clinicPhone}</span>
                    </div>
                  )}
                  {clinicWhatsApp && (
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      <MessageCircle className="h-2.5 w-2.5" />
                      <span className="font-medium">WhatsApp:</span>
                      <span className="opacity-90">{clinicWhatsApp}</span>
                    </div>
                  )}
                  {clinicEmail && (
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      <Mail className="h-2.5 w-2.5" />
                      <span className="font-medium">Email:</span>
                      <span className="opacity-90">{clinicEmail}</span>
                    </div>
                  )}
                  {clinicWebsite && (
                    <div className="text-[9px] opacity-60 mt-0.5">{clinicWebsite}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Info Bar */}
          <div className="border-b-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-gray-500">Patient:</span>
                  <span className="text-base font-bold text-gray-900">{patientName}</span>
                </div>
                {patientAge && (
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                          value={form.patient_age || ''}
                          onChange={(e) => handleChange('patient_age', e.target.value)}
                        />
                        <select
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                          value={form.patient_age_unit || 'years'}
                          onChange={(e) => handleChange('patient_age_unit', e.target.value)}
                        >
                          <option value="years">years</option>
                          <option value="months">months</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{patientAge}</span>
                        <span>{patientAgeUnit}</span>
                      </>
                    )}
                  </div>
                )}
                {patientGender && (
                  <div className="text-sm text-gray-700">
                    {editMode ? (
                      <select
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                        value={form.patient_gender || ''}
                        onChange={(e) => handleChange('patient_gender', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      patientGender
                    )}
                  </div>
                )}
                {patientWeight && (
                  <div className="text-sm text-gray-700">
                    {editMode ? (
                      <input
                        type="number"
                        step="0.1"
                        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                        value={form.patient_weight || ''}
                        onChange={(e) => handleChange('patient_weight', e.target.value)}
                      />
                    ) : (
                      `${patientWeight} kg`
                    )}
                  </div>
                )}
                {patientContact && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {editMode ? (
                      <input
                        type="text"
                        className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                        value={form.patient_contact || ''}
                        onChange={(e) => handleChange('patient_contact', e.target.value)}
                      />
                    ) : (
                      patientContact
                    )}
                  </div>
                )}
                {visitType && (
                  <div className="rounded-full border border-[#00acb1]/40 bg-[#00acb1]/10 px-2 py-0.5 text-xs font-semibold text-[#005963]">
                    {editMode ? (
                      <input
                        type="text"
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#005963] focus:outline-none"
                        value={form.visit_type || ''}
                        onChange={(e) => handleChange('visit_type', e.target.value)}
                        placeholder="Visit type"
                      />
                    ) : (
                      visitType
                    )}
                  </div>
                )}
                {visitDateLabel && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {visitDateLabel}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[#005963]/30 bg-white px-3 py-1.5">
                    <Calendar className="h-4 w-4 text-[#005963]" />
                    <div className="text-xs font-semibold text-[#005963]">Next visit:</div>
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#005963] focus:outline-none"
                      value={form.next_visit_date || ''}
                      onChange={(e) => handleChange('next_visit_date', e.target.value)}
                    />
                  </div>
                ) : (
                  nextVisitLabel && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#005963]/30 bg-[#005963]/5 px-3 py-1.5">
                      <Calendar className="h-4 w-4 text-[#005963]" />
                      <span className="text-xs font-bold text-[#005963]">Follow-up: {nextVisitLabel}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Main Prescription Content */}
          <div className="min-h-[500px] bg-white p-6">
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Side - Diagnosis & Tests (Narrower) */}
              <div className="col-span-4 space-y-6 border-r-2 border-dashed border-gray-200 pr-6">
                {/* Diagnosis */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-[#005963]/20 pb-2">
                    <Stethoscope className="h-4 w-4 text-[#005963]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Diagnosis</span>
                  </div>
                  {editMode ? (
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[#005963] focus:outline-none"
                      rows={5}
                      value={form.diagnosis || ''}
                      onChange={(e) => handleChange('diagnosis', e.target.value)}
                      placeholder="Enter diagnosis"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {data?.diagnosis || <span className="italic text-gray-400">—</span>}
                    </div>
                  )}
                </div>

                {/* Tests */}
                {(editMode || data?.tests) && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-[#005963]/20 pb-2">
                      <FlaskConical className="h-4 w-4 text-[#005963]" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Investigations</span>
                    </div>
                    {editMode ? (
                      <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[#005963] focus:outline-none"
                        rows={5}
                        value={form.tests || ''}
                        onChange={(e) => handleChange('tests', e.target.value)}
                        placeholder="Add tests/investigations"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {data?.tests}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Rx Medications & Advice (Wider) */}
              <div className="col-span-8 space-y-6">
                {/* Rx Symbol and Medications */}
                <div>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="text-5xl font-serif font-bold italic text-[#005963]">℞</div>
                    <div className="flex-1 pt-2">
                      {editMode ? (
                        <textarea
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[#005963] focus:outline-none"
                          rows={10}
                          value={form.medications || ''}
                          onChange={(e) => handleChange('medications', e.target.value)}
                          placeholder="Add medications"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-loose text-gray-800">
                          {data?.medications || <span className="italic text-gray-400">No medications prescribed</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advice */}
                {(editMode || data?.instructions) && (
                  <div className="border-t-2 border-dotted border-gray-200 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#005963]" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Advice</span>
                    </div>
                    {editMode ? (
                      <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-[#005963] focus:outline-none"
                        rows={6}
                        value={form.instructions || ''}
                        onChange={(e) => handleChange('instructions', e.target.value)}
                        placeholder="Diet, activity, or other instructions"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap rounded-lg bg-[#005963]/5 p-3 text-sm leading-relaxed text-gray-700">
                        {data?.instructions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Signature Area */}
          <div className="border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-end justify-between">
              <div className="text-xs text-gray-500">
                <div>Prescription ID: #{data?.id}</div>
                <div className="mt-0.5">Generated on: {createdAtDateLabel} {createdAtTimeLabel}</div>
              </div>
              <div className="text-center">
                <div className="mb-1 h-px w-48 border-b-2 border-gray-400"></div>
                <div className="text-xs font-bold text-gray-600">Doctor's Signature</div>
              </div>
            </div>
          </div>

          {/* Bottom Border Design */}
          <div className="h-2 bg-gradient-to-r from-[#005963] via-[#00acb1] to-[#005963]"></div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </DoctorLayout>
  );
}
