import { Link, router } from '@inertiajs/react';
import { Calendar, FileText, FlaskConical, Mail, MessageCircle, Phone, Printer, ArrowLeft, Download, Share2, Stethoscope, Upload, FileUp, Pencil, X } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import UserLayout from '../../layouts/UserLayout';
import EyePrescriptionSection, { isEyeSpecialist } from '../../components/prescription/EyePrescriptionSection';
import PrescriptionDocument from '../../components/prescription/PrescriptionDocument';
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

  const handleUploadReport = async (e) => {
    e?.preventDefault?.();

    if (!prescription?.id) {
      toastError('Prescription not found for report upload.');
      return;
    }

    const plainText = String(reportEditorRef.current?.innerText || reportText || '').trim();
    const trimmedText = plainText;
    if (!reportFile && !trimmedText) {
      toastError('Please choose a file or write a text report.');
      return;
    }

    const formData = new FormData();
    if (reportFile) formData.append('report_file', reportFile);
    if (trimmedText) formData.append('report_text', trimmedText);
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
      setReportText('');
      setShowReportUploadModal(false);
      if (reportEditorRef.current) reportEditorRef.current.innerHTML = '';
      const input = document.getElementById('user-report-upload-input');
      if (input) input.value = '';
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
    const id = prescription?.id;
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

      const res = await fetch(`/api/patient/prescriptions/${id}/reports/${reportId}`, {
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

  const applyReportFormat = (command) => {
    try {
      document.execCommand(command, false);
      reportEditorRef.current?.focus();
    } catch {
      // keep editor usable even if formatting command fails
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
            <button
              type="button"
              onClick={() => setShowReportUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
            >
              <Upload className="h-4 w-4" />
              Upload Report
            </button>
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
                      id="user-report-upload-input"
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

        <PrescriptionDocument
          prescription={prescription}
          doctorInfo={doctorInfo}
          chamberInfo={chamberInfo}
          patientName={patientName}
          patientAge={patientAge}
          patientAgeUnit={patientAgeUnit}
          patientGender={patientGender}
          patientWeight={patientWeight}
          patientContact={patientContact}
          visitType={visitType}
          templateType={templateType}
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
