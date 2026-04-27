import { Calendar, Download, FileText, FlaskConical, Phone, Printer, Stethoscope, ArrowLeft } from 'lucide-react';
import EyePrescriptionSection from './EyePrescriptionSection';

const ReadTextarea = ({ value, rows = 4, placeholder = '—' }) => (
  <div
    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap"
    style={{ minHeight: `${rows * 1.6}rem` }}
  >
    {value || <span className="text-slate-400">{placeholder}</span>}
  </div>
);

export default function PrescriptionDocument({
  prescription = {},
  doctorInfo = {},
  chamberInfo = null,
  patientName,
  patientAge,
  patientAgeUnit = 'years',
  patientGender,
  patientWeight,
  patientContact,
  visitType,
  templateType = 'general',
  medicines = [],
  nextVisitLabel,
  createdAtDateLabel,
  createdAtTimeLabel,
  onPrint,
  onDownloadPDF,
  downloadingPDF = false,
  showDownloadButton = false,
  backHref,
  backLabel = 'Back',
  showActionBar = true,
  prescriptionRef,
  hidePrintHeader = false,
  hidePrintPatientMeta = false,
}) {
  return (
    <div ref={prescriptionRef}>
      {showActionBar ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h1 className="text-xl font-bold text-slate-800">
            Prescription <span className="text-slate-500">#{prescription?.id || 'N/A'}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {backHref ? (
              <a
                href={backHref}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </a>
            ) : null}

            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            {showDownloadButton ? (
              <button
                type="button"
                onClick={onDownloadPDF}
                disabled={downloadingPDF}
                className="flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243063] disabled:opacity-50"
              >
                {downloadingPDF ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <div className={`border-b border-slate-200`}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

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

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
              <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                {patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—'}
              </div>
            </div>

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Contact:</span>
              <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                {patientContact || '—'}
              </div>
            </div>

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Weight:</span>
              <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                {patientWeight ? `${patientWeight} kg` : '—'}
              </div>
            </div>

            {/* <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Visit:</span>
              <div className="rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900">
                {visitType || '—'}
              </div>
            </div> */}
          </div>
        </div>

        <div className="min-h-[500px] bg-white p-8 pb-12">
          {templateType === 'eye' ? (
            <div className="mb-6">
              <EyePrescriptionSection value={prescription?.specialty_data} readOnly />
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-8">
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

            <div className="col-span-9 space-y-6">
              <div>
                <div className="mb-4 flex items-start gap-3">
                  <div className="text-5xl font-serif font-bold italic text-slate-800">Rx</div>
                  <div className="flex-1 pt-2">
                    {medicines.length > 0 ? (
                      <div className="space-y-2">
                        {medicines.map((m, idx) => (
                          <div key={`${m.name || 'med'}-${idx}`} className="flex items-start gap-2 rounded border border-slate-200 bg-white p-2">
                            <span className="mt-2 text-xs font-bold text-slate-400 flex-shrink-0">{idx + 1}.</span>
                            <div className="flex-1 grid grid-cols-6 gap-2">
                              <div className="col-span-2 rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 font-medium">
                                {m.name || '—'}
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

              <div className="border-t-2 border-dotted border-slate-200 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#3556a6]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Advice</span>
                </div>
                <ReadTextarea value={prescription?.instructions} rows={4} placeholder="None" />
              </div>

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

          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">
                Created: {createdAtDateLabel || 'N/A'} {createdAtTimeLabel || ''} · ID #{prescription?.id || 'N/A'}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onPrint}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                {showDownloadButton ? (
                  <button
                    type="button"
                    onClick={onDownloadPDF}
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
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
