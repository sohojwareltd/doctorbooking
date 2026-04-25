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
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [reportNote, setReportNote] = useState('');
  const [reportPreviewUrl, setReportPreviewUrl] = useState('');
  const [activeReportPreview, setActiveReportPreview] = useState(null);

  const isImageReport = (report) => (report?.mime_type || '').startsWith('image/');
  const isPdfReport = (report) => (report?.mime_type || '').includes('pdf');

  const loadReports = async () => {
    if (!prescription?.id) return;
    try {
      setLoadingReports(true);
      const res = await fetch(`/api/patient/prescriptions/${prescription.id}/reports`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'print') {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  useEffect(() => {
    loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescription?.id]);

  useEffect(() => {
    if (!reportFile) {
      setReportPreviewUrl('');
      return;
    }

    if (!reportFile.type?.startsWith('image/')) {
      setReportPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(reportFile);
    setReportPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [reportFile]);

  const handleUploadReport = async (e) => {
    e?.preventDefault?.();
    if (!reportFile || !prescription?.id) {
      toastError('Please choose a report file first.');
      return;
    }

    const formData = new FormData();
    formData.append('report_file', reportFile);
    if (reportNote.trim()) formData.append('note', reportNote.trim());

    try {
      setUploadingReport(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch(`/api/patient/prescriptions/${prescription.id}/reports`, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(data?.message || 'Failed to upload report.');
        return;
      }

      toastSuccess(data?.message || 'Report uploaded successfully.');
      setReportFile(null);
      setReportNote('');
      setReportPreviewUrl('');
      const input = document.getElementById('report-upload-input');
      if (input) input.value = '';
      await loadReports();
    } catch {
      toastError('Network error while uploading report.');
    } finally {
      setUploadingReport(false);
    }
  };

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

        <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Upload Reports</h2>
            <span className="text-xs text-slate-400">Linked to your patient ID and this prescription</span>
          </div>

          <form onSubmit={handleUploadReport} className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Report File (PDF/JPG/PNG)</label>
              <input
                id="report-upload-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Note (optional)</label>
              <input
                type="text"
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="e.g. CBC report"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={uploadingReport || !reportFile}
              className="rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60"
            >
              {uploadingReport ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {reportFile && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-600">Live preview</div>
              <div className="mt-1 text-sm text-slate-700">
                {reportFile.name} ({Math.max(1, Math.round(reportFile.size / 1024))} KB)
              </div>
              {reportPreviewUrl ? (
                <img
                  src={reportPreviewUrl}
                  alt="Report preview"
                  className="mt-3 max-h-52 rounded-lg border border-slate-200 object-contain bg-white"
                />
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  Preview is available for image files. PDF preview will be available after upload via View action.
                </div>
              )}
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Preview</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">File</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Note</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Uploaded</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingReports ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-sm text-slate-400">Loading reports...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-sm text-slate-400">No report uploaded yet.</td>
                  </tr>
                ) : reports.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {isImageReport(r) ? (
                        <button
                          type="button"
                          onClick={() => setActiveReportPreview(r)}
                          className="overflow-hidden rounded-md border border-slate-200 bg-white"
                          title="Preview image"
                        >
                          <img
                            src={r.file_url}
                            alt={r.original_name}
                            className="h-12 w-12 object-cover"
                          />
                        </button>
                      ) : isPdfReport(r) ? (
                        <button
                          type="button"
                          onClick={() => setActiveReportPreview(r)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">{r.original_name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{r.note || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-500">{formatDisplayFromDateLike(r.created_at) || '-'}</td>
                    <td className="px-3 py-2 text-sm space-x-2">
                      {/* <button
                        type="button"
                        onClick={() => setActiveReportPreview(r)}
                        className="font-semibold text-[#0c7b79] hover:underline"
                      >
                        Preview
                      </button> */}
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#2D3A74] hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeReportPreview && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800">{activeReportPreview.original_name}</div>
                  <button
                    type="button"
                    onClick={() => setActiveReportPreview(null)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[78vh] overflow-auto bg-slate-50 p-3">
                  {isImageReport(activeReportPreview) ? (
                    <img
                      src={activeReportPreview.file_url}
                      alt={activeReportPreview.original_name}
                      className="mx-auto max-h-[72vh] w-auto rounded-lg border border-slate-200 bg-white"
                    />
                  ) : isPdfReport(activeReportPreview) ? (
                    <iframe
                      src={activeReportPreview.file_url}
                      title={activeReportPreview.original_name}
                      className="h-[72vh] w-full rounded-lg border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Preview is not available for this file type.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prescription Layout */}
        <div ref={prescriptionRef}>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">

            {/* Header — Doctor left, Chamber right (matches CreatePrescription) */}
            <div className="border-b border-slate-200">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
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
                  <div className="pr-8">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-blue-300" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Doctor</span>
                    </div>
                    <p className="text-2xl font-black tracking-tight text-white">{doctorInfo?.name || 'Doctor'}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-300">{doctorInfo?.specialization || doctorInfo?.degree || 'MBBS, FCPS'}</p>
                    <div className="mt-3 space-y-1.5">
                      {doctorInfo?.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-200">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                          <span>{doctorInfo.phone}</span>
                        </div>
                      ) : null}
                      {doctorInfo?.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-200">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                          <span>{doctorInfo.email}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="pl-8 flex flex-col items-end">
                    <div className="mb-1.5 flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Chamber</span>
                    </div>
                    <p className="text-2xl font-black tracking-tight text-white">{chamberInfo?.name || 'Not set'}</p>
                    {chamberInfo?.location ? (
                      <div className="mt-2.5 flex items-start justify-end gap-1.5 text-sm text-slate-200">
                        <span>{chamberInfo.location}</span>
                      </div>
                    ) : null}
                    {chamberInfo?.phone ? (
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-sm text-slate-200">
                        <span>{chamberInfo.phone}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient strip — inline layout like CreatePrescription */}
            <div className="border-b border-slate-200 bg-white px-8 py-4">
              <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                <div className="flex min-w-[200px] flex-1 items-end gap-2">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
                  <div className="flex-1 rounded-md border border-transparent border-b-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900">
                    {patientName || '—'}
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
                  <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {patientAge ? `${patientAge} ${patientAgeUnit}` : '—'}
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
                  <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—'}
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Contact:</span>
                  <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {patientContact || '—'}
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Weight:</span>
                  <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {patientWeight ? `${patientWeight} kg` : '—'}
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 text-xs font-bold text-slate-600">Visit:</span>
                  <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {visitType || '—'}
                  </div>
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
                                  {/* <div className="rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900">
                                    {m.strength || '—'}
                                  </div> */}
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
