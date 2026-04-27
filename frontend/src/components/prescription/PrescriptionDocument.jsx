import { Calendar, Download, FileText, FlaskConical, Phone, Printer, Stethoscope, ArrowLeft } from 'lucide-react';
import EyePrescriptionSection from './EyePrescriptionSection';

const ReadTextarea = ({ value, rows = 4, placeholder = '—', compact = false }) => (
  <div
    className={`w-full rounded-lg border border-slate-200 bg-slate-50/50 whitespace-pre-wrap ${compact ? 'px-1.5 py-1 text-[10px] leading-[1.2] text-slate-800 sm:px-3 sm:py-2 sm:text-sm sm:leading-normal' : 'px-3 py-2 text-sm text-slate-800'}`}
    style={{ minHeight: `${rows * (compact ? 1.1 : 1.6)}rem` }}
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
  forceDesktopColumnsOnMobile = false,
  printElementId,
}) {
  return (
    <div ref={prescriptionRef} id={printElementId}>
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
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 sm:flex"
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

      <div className={forceDesktopColumnsOnMobile ? '-mx-3 overflow-x-auto px-3 print:mx-0 print:overflow-visible print:px-0 sm:mx-0 sm:px-0' : ''}>
      <div className={forceDesktopColumnsOnMobile ? 'min-w-[700px] print:min-w-0 sm:min-w-[920px]' : ''}>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <div className={`border-b border-slate-200${hidePrintHeader ? ' print:hidden' : ''}`}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071122] via-[#0d1f45] to-[#071122]">
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

            <div className={forceDesktopColumnsOnMobile
              ? 'relative z-10 grid grid-cols-2 divide-x divide-white/10 px-3 py-3 sm:px-8 sm:py-7'
              : 'relative z-10 grid grid-cols-1 divide-y divide-white/10 px-4 py-5 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:px-8 sm:py-7'}>
              <div className={forceDesktopColumnsOnMobile ? 'pr-3 sm:pr-8' : 'pb-4 sm:pb-0 sm:pr-8'}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="h-3 w-3 text-blue-300 sm:h-3.5 sm:w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Doctor</span>
                </div>
                <p className={forceDesktopColumnsOnMobile ? 'text-[13px] font-black tracking-tight text-white sm:text-2xl' : 'text-xl font-black tracking-tight text-white sm:text-2xl'}>{doctorInfo?.name || 'Doctor'}</p>
                <p className={forceDesktopColumnsOnMobile ? 'mt-0.5 text-[10px] font-medium leading-tight text-slate-300 sm:text-sm' : 'mt-0.5 text-sm font-medium text-slate-300'}>{doctorInfo?.specialization || doctorInfo?.degree || 'MBBS, FCPS'}</p>
                <div className={forceDesktopColumnsOnMobile ? 'mt-1.5 space-y-1' : 'mt-3 space-y-1.5'}>
                  {doctorInfo?.phone ? (
                    <div className={forceDesktopColumnsOnMobile ? 'flex items-center gap-1 text-[10px] text-slate-200 sm:text-sm' : 'flex items-center gap-1.5 text-sm text-slate-200'}>
                      <Phone className="h-3 w-3 shrink-0 text-blue-300 sm:h-3.5 sm:w-3.5" />
                      <span>{doctorInfo.phone}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={forceDesktopColumnsOnMobile ? 'pl-3 sm:pl-8 flex flex-col items-end' : 'pt-4 sm:pt-0 sm:pl-8 flex flex-col items-start sm:items-end'}>
                <div className={forceDesktopColumnsOnMobile ? 'mb-1.5 flex items-center justify-end gap-1.5' : 'mb-1.5 flex items-center justify-start gap-1.5 sm:justify-end'}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Chamber</span>
                </div>
                <p className={forceDesktopColumnsOnMobile ? 'text-[13px] font-black tracking-tight text-white sm:text-2xl' : 'text-xl font-black tracking-tight text-white sm:text-2xl'}>{chamberInfo?.name || 'Not set'}</p>
                {chamberInfo?.location ? (
                  <div className={forceDesktopColumnsOnMobile ? 'mt-1.5 flex items-start justify-end gap-1 text-[10px] leading-tight text-slate-200 sm:text-sm' : 'mt-2.5 flex items-start justify-start gap-1.5 text-sm text-slate-200 sm:justify-end'}>
                    <span>{chamberInfo.location}</span>
                  </div>
                ) : null}
                {chamberInfo?.phone ? (
                  <div className={forceDesktopColumnsOnMobile ? 'mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-200 sm:text-sm' : 'mt-1.5 flex items-center justify-start gap-1.5 text-sm text-slate-200 sm:justify-end'}>
                    <span>{chamberInfo.phone}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={forceDesktopColumnsOnMobile ? 'border-b border-slate-200 bg-white px-3 py-2 sm:px-8 sm:py-4' : 'border-b border-slate-200 bg-white px-4 py-3 sm:px-8 sm:py-4'}>
          <div className={forceDesktopColumnsOnMobile ? 'flex flex-wrap items-end gap-x-2 gap-y-1 sm:gap-x-6 sm:gap-y-3' : 'flex flex-wrap items-end gap-x-6 gap-y-3'}>
            <div className={forceDesktopColumnsOnMobile ? 'flex min-w-[130px] flex-1 items-end gap-1 sm:min-w-[200px] sm:gap-2' : 'flex min-w-[180px] flex-1 items-end gap-2'}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Name:</span>
              <div className={forceDesktopColumnsOnMobile ? 'flex-1 rounded-md border border-transparent border-b-slate-300 bg-white px-1.5 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm' : 'flex-1 rounded-md border border-transparent border-b-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900'}>
                {patientName || '—'}
              </div>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="shrink-0 text-xs font-bold text-slate-600">Age:</span>
              <div className={forceDesktopColumnsOnMobile ? 'rounded-md border border-transparent border-b-slate-300 bg-white px-1 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-2 sm:py-1.5 sm:text-sm' : 'rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900'}>
                {patientAge ? `${patientAge} ${patientAgeUnit}` : '—'}
              </div>
            </div>

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Gender:</span>
              <div className={forceDesktopColumnsOnMobile ? 'rounded-md border border-transparent border-b-slate-300 bg-white px-1 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-2 sm:py-1.5 sm:text-sm' : 'rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900'}>
                {patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—'}
              </div>
            </div>

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Contact:</span>
              <div className={forceDesktopColumnsOnMobile ? 'rounded-md border border-transparent border-b-slate-300 bg-white px-1 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-2 sm:py-1.5 sm:text-sm' : 'rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900'}>
                {patientContact || '—'}
              </div>
            </div>

            <div className={`flex items-end gap-1.5${hidePrintPatientMeta ? ' print:hidden' : ''}`}>
              <span className="shrink-0 text-xs font-bold text-slate-600">Weight:</span>
              <div className={forceDesktopColumnsOnMobile ? 'rounded-md border border-transparent border-b-slate-300 bg-white px-1 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-2 sm:py-1.5 sm:text-sm' : 'rounded-md border border-transparent border-b-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900'}>
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

        <div className={forceDesktopColumnsOnMobile ? 'min-h-[500px] bg-white p-3 pb-4 sm:p-8 sm:pb-12' : 'min-h-[500px] bg-white p-4 pb-8 sm:p-8 sm:pb-12'}>
          {templateType === 'eye' ? (
            <div className="mb-6">
              <EyePrescriptionSection value={prescription?.specialty_data} readOnly />
            </div>
          ) : null}

          <div className={forceDesktopColumnsOnMobile ? 'grid grid-cols-12 gap-3 sm:gap-8' : 'grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8'}>
            <div className={forceDesktopColumnsOnMobile ? 'col-span-3 space-y-2 sm:space-y-6 border-r-2 border-dashed border-slate-200 pr-2.5 sm:pr-8' : 'col-span-1 space-y-6 border-b-2 border-dashed border-slate-200 pb-5 lg:col-span-3 lg:border-b-0 lg:border-r-2 lg:pb-0 lg:pr-8'}>
              <div>
                <div className={forceDesktopColumnsOnMobile ? 'mb-1.5 flex items-center gap-1 border-b border-slate-200 pb-1 sm:mb-3 sm:gap-2 sm:pb-2' : 'mb-3 flex items-center gap-2 border-b border-slate-200 pb-2'}>
                  <FlaskConical className="h-3 w-3 text-[#3556a6] sm:h-4 sm:w-4" />
                  <span className={forceDesktopColumnsOnMobile ? 'text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-xs sm:tracking-wider' : 'text-xs font-bold uppercase tracking-wider text-slate-700'}>Investigations</span>
                </div>
                <ReadTextarea value={prescription?.tests} rows={6} placeholder="None" compact={forceDesktopColumnsOnMobile} />
              </div>

              <div>
                <div className={forceDesktopColumnsOnMobile ? 'mb-1.5 flex items-center gap-1 border-b border-slate-200 pb-1 sm:mb-3 sm:gap-2 sm:pb-2' : 'mb-3 flex items-center gap-2 border-b border-slate-200 pb-2'}>
                  <Stethoscope className="h-3 w-3 text-[#3556a6] sm:h-4 sm:w-4" />
                  <span className={forceDesktopColumnsOnMobile ? 'text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-xs sm:tracking-wider' : 'text-xs font-bold uppercase tracking-wider text-slate-700'}>Diagnosis</span>
                </div>
                <ReadTextarea value={prescription?.diagnosis} rows={8} placeholder="None" compact={forceDesktopColumnsOnMobile} />
              </div>
            </div>

            <div className={forceDesktopColumnsOnMobile ? 'col-span-9 space-y-6' : 'col-span-1 space-y-6 lg:col-span-9'}>
              <div>
                <div className="mb-4 flex items-start gap-3">
                  <div className={forceDesktopColumnsOnMobile ? 'text-3xl font-serif font-bold italic text-slate-800 sm:text-5xl' : 'text-4xl font-serif font-bold italic text-slate-800 sm:text-5xl'}>Rx</div>
                  <div className="flex-1 pt-2">
                    {medicines.length > 0 ? (
                      <div className="space-y-2">
                        {medicines.map((m, idx) => (
                          <div key={`${m.name || 'med'}-${idx}`} className={forceDesktopColumnsOnMobile ? 'flex items-start gap-1 rounded border border-slate-200 bg-white p-1 sm:gap-2 sm:p-2' : 'flex flex-col gap-2 rounded border border-slate-200 bg-white p-2 sm:flex-row sm:items-start'}>
                            <span className="mt-2 text-xs font-bold text-slate-400 flex-shrink-0">{idx + 1}.</span>
                            <div className={forceDesktopColumnsOnMobile ? 'flex-1 grid grid-cols-6 gap-1 sm:gap-2' : 'flex-1 grid grid-cols-1 gap-2 sm:grid-cols-6'}>
                              <div className={forceDesktopColumnsOnMobile ? 'col-span-2 rounded border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 text-[10px] leading-tight text-slate-900 font-medium sm:px-3 sm:py-1.5 sm:text-sm' : 'col-span-1 rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900 font-medium sm:col-span-2'}>
                                {m.name || '—'}
                              </div>
                              <div className={forceDesktopColumnsOnMobile ? 'rounded border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm' : 'rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900'}>
                                {m.dosage || '—'}
                              </div>
                              <div className={forceDesktopColumnsOnMobile ? 'rounded border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 text-[10px] leading-tight text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm' : 'rounded border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-900'}>
                                {m.duration || '—'}
                              </div>
                            </div>
                            {m.instruction ? (
                              <div className={forceDesktopColumnsOnMobile ? 'flex-shrink-0 rounded border border-slate-100 bg-slate-50 px-1 py-0.5 text-[9px] leading-tight text-slate-500 self-center sm:px-2 sm:py-1 sm:text-xs' : 'self-start rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-500 sm:self-center'}>
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
                <div className={forceDesktopColumnsOnMobile ? 'mb-1.5 flex items-center gap-1 sm:mb-2 sm:gap-2' : 'mb-2 flex items-center gap-2'}>
                  <FileText className="h-3 w-3 text-[#3556a6] sm:h-4 sm:w-4" />
                  <span className={forceDesktopColumnsOnMobile ? 'text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-xs sm:tracking-wider' : 'text-xs font-bold uppercase tracking-wider text-slate-700'}>Advice</span>
                </div>
                <ReadTextarea value={prescription?.instructions} rows={4} placeholder="None" compact={forceDesktopColumnsOnMobile} />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className={forceDesktopColumnsOnMobile ? 'flex items-center gap-4' : 'flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4'}>
                  <div className={forceDesktopColumnsOnMobile ? 'flex items-center gap-1.5' : 'flex items-center gap-2'}>
                    <Calendar className="h-3 w-3 text-[#3556a6] sm:h-4 sm:w-4" />
                    <span className={forceDesktopColumnsOnMobile ? 'text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 sm:text-xs sm:tracking-wider' : 'text-xs font-bold uppercase tracking-wider text-slate-700'}>Follow-up Date</span>
                  </div>
                  {prescription?.next_visit_date ? (
                    <span className={forceDesktopColumnsOnMobile ? 'rounded-full border border-[#d7dfec] bg-[#edf1fb] px-2 py-0.5 text-[10px] font-semibold text-[#3556a6] sm:px-3 sm:py-1 sm:text-xs' : 'rounded-full border border-[#d7dfec] bg-[#edf1fb] px-3 py-1 text-xs font-semibold text-[#3556a6]'}>
                      {nextVisitLabel || prescription.next_visit_date}
                    </span>
                  ) : (
                    <span className={forceDesktopColumnsOnMobile ? 'text-[10px] text-slate-400 sm:text-sm' : 'text-sm text-slate-400'}>No follow-up scheduled</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={forceDesktopColumnsOnMobile ? 'mt-6 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:mt-10 sm:p-6' : 'mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mt-10 sm:p-6'}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className={forceDesktopColumnsOnMobile ? 'text-[10px] text-slate-400 sm:text-xs' : 'text-xs text-slate-400'}>
                Created: {createdAtDateLabel || 'N/A'} {createdAtTimeLabel || ''} · ID #{prescription?.id || 'N/A'}
              </div>
              <div className={forceDesktopColumnsOnMobile ? 'flex flex-wrap gap-3 print:hidden' : 'flex w-full flex-col gap-2 print:hidden sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3'}>
                <button
                  type="button"
                  onClick={onPrint}
                  className={forceDesktopColumnsOnMobile ? 'hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm' : 'hidden w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex sm:w-auto'}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                {showDownloadButton ? (
                  <button
                    type="button"
                    onClick={onDownloadPDF}
                    disabled={downloadingPDF}
                    className={forceDesktopColumnsOnMobile ? 'flex items-center gap-1.5 rounded-xl bg-[#2D3A74] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#243063] disabled:opacity-50 sm:gap-2 sm:px-8 sm:py-2.5 sm:text-sm' : 'flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D3A74] px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243063] disabled:opacity-50 sm:w-auto'}
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
      </div>
    </div>
  );
}
