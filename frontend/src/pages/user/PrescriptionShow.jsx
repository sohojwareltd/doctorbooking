import { Link, router } from '@inertiajs/react';
import { Calendar, FileText, FlaskConical, Mail, MapPin, MessageCircle, Phone, Printer, ArrowLeft, Download, Share2, Stethoscope, User } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import UserLayout from '../../layouts/UserLayout';
import EyePrescriptionSection, { isEyeSpecialist } from '../../components/prescription/EyePrescriptionSection';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';

// Parse saved medications text into structured rows
function parseMedicationsText(text) {
  if (!text?.trim()) return [];
  return text.trim().split('\n').filter(Boolean).map((line) => {
    const parts = line.split(' - ');
    const nameStrength = parts[0] || '';
    const dosage = parts[1] || '';
    const duration = parts[2] || '';
    const instruction = parts[3] || '';
    const strengthRx = /^(.*?)\s+(\d+(?:\.\d+)?(?:mg|mcg|ml|g|IU|%|mg\/ml|mg\/5ml|iu)(?:\/\w+)?)\s*$/i;
    const match = nameStrength.match(strengthRx);
    return match
      ? { name: match[1].trim(), strength: match[2], dosage, duration, instruction }
      : { name: nameStrength.trim(), strength: '', dosage, duration, instruction };
  });
}

export default function UserPrescriptionShow({ prescription = {}, doctorInfo = {}, chamberInfo = null }) {
  const medicines = useMemo(() => parseMedicationsText(prescription?.medications), [prescription?.medications]);

  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(prescription?.created_at), [prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(prescription?.created_at), [prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(prescription?.next_visit_date), [prescription?.next_visit_date]);
  const visitDateLabel = useMemo(() => formatDisplayDate(prescription?.appointment?.appointment_date), [prescription?.appointment?.appointment_date]);

  const patientName = prescription?.patient_name || `Patient #${prescription?.id || ''}`;
  const patientAge = prescription?.patient_age;
  const patientAgeUnit = prescription?.patient_age_unit || 'years';
  const patientGender = prescription?.patient_gender;
  const patientWeight = prescription?.patient_weight;
  const patientContact = prescription?.patient_contact;
  const visitType = prescription?.visit_type;
  const templateType = prescription?.template_type || (isEyeSpecialist(doctorInfo?.specialization) ? 'eye' : 'general');

  const prescriptionRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'print') {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;
    try {
      setDownloadingPDF(true);
      const element = prescriptionRef.current;
      if (!element) { toastError('Prescription content not found'); return; }

      const loadHtml2pdf = () => new Promise((resolve, reject) => {
        if (window.html2pdf) { resolve(window.html2pdf); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.12.0/html2pdf.bundle.min.js';
        script.onload = () => window.html2pdf ? resolve(window.html2pdf) : reject(new Error('html2pdf unavailable'));
        script.onerror = () => reject(new Error('Failed to load html2pdf'));
        document.head.appendChild(script);
      });

      let html2pdf;
      try { html2pdf = await loadHtml2pdf(); }
      catch { toastError('PDF library not available. Using print dialog instead.'); window.print(); return; }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `prescription-${prescription?.id || 'prescription'}-${patientName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(element).save();
      toastSuccess('PDF downloaded successfully');
    } catch {
      toastError('PDF generation failed. Opening print dialog instead.');
      setTimeout(() => window.print(), 500);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `*Prescription #${prescription?.id}*\n\nDate: ${visitDateLabel || createdAtDateLabel}\n\nView full prescription:\n${window.location.href}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Prescription #${prescription?.id}`, url: window.location.href });
        toastSuccess('Prescription shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toastSuccess('Prescription link copied to clipboard');
      }
    } catch {
      try { await navigator.clipboard.writeText(window.location.href); toastSuccess('Prescription link copied to clipboard'); }
      catch { toastError('Failed to share prescription'); }
    }
  };

  // Read-only field that visually matches the doctor's editable inputs
  const ReadField = ({ value, placeholder = '—', className = '' }) => (
    <div className={`w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 min-h-[34px] ${className}`}>
      {value || <span className="text-slate-400">{placeholder}</span>}
    </div>
  );

  const ReadTextarea = ({ value, rows = 4, placeholder = '—' }) => (
    <div
      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap"
      style={{ minHeight: `${rows * 1.6}rem` }}
    >
      {value || <span className="text-slate-400">{placeholder}</span>}
    </div>
  );

  return (
    <UserLayout title="Prescription Details">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">
              Prescription <span className="text-slate-500">#{prescription?.id}</span>
            </h1>
            {prescription?.appointment?.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                prescription.appointment.status === 'prescribed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                prescription.appointment.status === 'awaiting_tests' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                prescription.appointment.status === 'in_consultation' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {prescription.appointment.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            )}
            {patientName && (
              <span className="text-sm text-slate-500">Patient: <span className="font-semibold text-slate-700">{patientName}</span></span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/patient/prescriptions"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSharing(!sharing)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              {sharing && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSharing(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                    <button onClick={() => { handleShareWhatsApp(); setSharing(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition first:rounded-t-xl">
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
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-50"
            >
              {downloadingPDF ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Download className="h-4 w-4" />}
              {downloadingPDF ? 'Generating...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        {/* Prescription Layout */}
        <div ref={prescriptionRef}>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">

            {/* Header — Doctor + Chamber */}
            <div className="border-b border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#2D3A74]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D3A74]">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Doctor Information
                  </div>
                  <div className="text-2xl font-black tracking-tight text-slate-900">{doctorInfo?.name || 'Doctor'}</div>
                  <div className="mt-1 text-sm font-medium text-slate-600">{doctorInfo?.specialization || doctorInfo?.degree || 'MBBS, FCPS'}</div>
                  <div className="mt-4 space-y-2">
                    {doctorInfo?.phone ? (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="h-4 w-4 text-[#3556a6]" />
                        <span>{doctorInfo.phone}</span>
                      </div>
                    ) : null}
                    {doctorInfo?.email ? (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="h-4 w-4 text-[#3556a6]" />
                        <span>{doctorInfo.email}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                    <MapPin className="h-3.5 w-3.5" />
                    Chamber Information
                  </div>
                  <div className="text-xl font-extrabold tracking-tight text-slate-900">{chamberInfo?.name || 'Not set'}</div>
                  {chamberInfo?.location ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                      <span>{chamberInfo.location}</span>
                    </div>
                  ) : null}
                  {chamberInfo?.phone ? (
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone className="h-4 w-4 text-amber-700" />
                      <span>{chamberInfo.phone}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Patient Info — read-only grid, same layout as doctor */}
            <div className="border-b-2 border-dashed border-slate-200 bg-slate-50 px-8 py-5">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="h-5 w-5 text-[#3556a6]" />
                <span className="text-sm font-semibold text-slate-800">Patient Information</span>
                <span className="ml-auto text-xs text-slate-400">Prescription #{prescription?.id} · {visitDateLabel || createdAtDateLabel}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Patient Name</label>
                  <ReadField value={patientName} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Contact</label>
                  <ReadField value={patientContact} placeholder="N/A" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Age</label>
                  <ReadField value={patientAge ? `${patientAge} ${patientAgeUnit}` : null} placeholder="N/A" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Gender</label>
                  <ReadField value={patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : null} placeholder="N/A" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Weight (kg)</label>
                  <ReadField value={patientWeight ? `${patientWeight} kg` : null} placeholder="N/A" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Visit Type</label>
                  <ReadField value={visitType} placeholder="N/A" />
                </div>
              </div>
            </div>

            {/* Prescription Content */}
            <div className="min-h-[500px] bg-white p-8 pb-12">
              {templateType === 'eye' ? (
                <div className="mb-6">
                  <EyePrescriptionSection value={prescription?.specialty_data} readOnly />
                </div>
              ) : null}

              <div className="grid grid-cols-12 gap-8">

                {/* Left Column — Investigations + Diagnosis */}
                <div className="col-span-3 space-y-6 border-r-2 border-dashed border-slate-200 pr-8">
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <FlaskConical className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Investigations</span>
                    </div>
                    <ReadTextarea value={prescription?.tests} rows={6} placeholder="None" />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Stethoscope className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnosis</span>
                    </div>
                    <ReadTextarea value={prescription?.diagnosis} rows={8} placeholder="None" />
                  </div>
                </div>

                {/* Right Column — Rx + Advice + Follow-up */}
                <div className="col-span-9 space-y-6">

                  {/* Medications */}
                  <div>
                    <div className="mb-4 flex items-start gap-3">
                      <div className="text-5xl font-serif font-bold italic text-slate-800">℞</div>
                      <div className="flex-1 pt-2">
                        {medicines.length > 0 ? (
                          <div className="space-y-2">
                            {medicines.map((m, idx) => (
                              <div key={idx} className="flex items-start gap-2 rounded border border-slate-200 bg-white p-2">
                                <span className="mt-2 text-xs font-bold text-slate-400 flex-shrink-0">{idx + 1}.</span>
                                <div className="flex-1 grid grid-cols-6 gap-2">
                                  <div className="col-span-2 rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 font-medium">
                                    {m.name || '—'}
                                  </div>
                                  <div className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900">
                                    {m.strength || '—'}
                                  </div>
                                  <div className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900">
                                    {m.dosage || '—'}
                                  </div>
                                  <div className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900">
                                    {m.duration || '—'}
                                  </div>
                                </div>
                                {m.instruction ? (
                                  <div className="flex-shrink-0 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-500 self-center">
                                    {m.instruction}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-400">
                            No medications listed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Advice */}
                  <div className="border-t-2 border-dotted border-slate-200 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#3556a6]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                    </div>
                    <ReadTextarea value={prescription?.instructions} rows={4} placeholder="None" />
                  </div>

                  {/* Follow-up */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3556a6]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Follow-up Date</span>
                      </div>
                      {prescription?.next_visit_date ? (
                        <span className="rounded-full border border-[#d7dfec] bg-[#edf1fb] px-3 py-1 text-xs font-semibold text-[#3556a6]">
                          {nextVisitLabel || prescription.next_visit_date}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">No follow-up scheduled</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom meta */}
              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-400">
                    Created: {createdAtDateLabel} {createdAtTimeLabel} · ID #{prescription?.id}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF}
                      className="flex items-center gap-2 rounded-xl bg-[#2D3A74] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243063] disabled:opacity-50"
                    >
                      {downloadingPDF ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </button>
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
    </UserLayout>
  );
}

UserPrescriptionShow.layout = (page) => page;
