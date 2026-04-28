import { ArrowLeft, Calendar, Download, Eye, FileText, FlaskConical, HeartHandshake, Mail, MapPin, Phone, Printer, ShieldCheck, Stethoscope } from 'lucide-react';
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
  const doctorDisplayName = doctorInfo?.name || 'Dr. Fatima Ahmed';
  const doctorSubTitle = doctorInfo?.specialization || doctorInfo?.degree || 'MBBS, FCPS (Medicine), Consultant Physician';
  const doctorPhone = doctorInfo?.phone || '+880 1712-345678';
  const doctorEmail = doctorInfo?.email || 'doctor@example.com';

  const chamberName = chamberInfo?.name || 'Main Chamber';
  const chamberLocation = chamberInfo?.location || 'Demo Clinic, 123 Main Street, Dhaka';
  const chamberPhone = chamberInfo?.phone || doctorPhone;
  const chamberMapUrl = chamberInfo?.google_maps_url || null;
  const qrSrc = chamberMapUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(chamberMapUrl)}`
    : null;

  const logoSrc = doctorInfo?.profile_picture || '/stethoscope-2.png';

  const formattedGender = patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—';

  const prescriptionRows = medicines.length > 0
    ? medicines
    : [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }];

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
        <div className={forceDesktopColumnsOnMobile ? 'min-w-[700px] print:min-w-0 sm:min-w-[980px]' : ''}>
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-[#f8fafc] shadow-sm print:border-0 print:shadow-none">
            <div className="h-4 bg-[#0b3f86]" />

            <div className={`relative border-b border-slate-300 bg-white ${hidePrintHeader ? 'print:hidden' : ''}`}>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
                <Stethoscope className="h-48 w-48 text-[#0b3f86]" />
              </div>

              <div className="relative z-10 grid grid-cols-2 divide-x divide-slate-300 px-4 py-4 sm:px-6">
                <div className="pr-4 sm:pr-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#cfd8e6] bg-white sm:h-20 sm:w-20">
                      <img src={logoSrc} alt="Doctor logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0b3f86]">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Doctor
                      </div>
                      <p className="truncate text-2xl font-extrabold tracking-tight text-[#0d2f63]">{doctorDisplayName}</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-600">{doctorSubTitle}</p>
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#0b3f86]" />{doctorPhone}</div>
                        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#0b3f86]" />{doctorEmail}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pl-4 sm:pl-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0b3f86]">
                        <MapPin className="h-3.5 w-3.5" />
                        Chamber
                      </div>
                      <p className="truncate text-2xl font-extrabold tracking-tight text-[#0d2f63]">{chamberName}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{chamberLocation}</p>
                      <div className="mt-2 text-sm text-slate-700">
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#0b3f86]" />{chamberPhone}</div>
                      </div>
                    </div>

                    <div className="w-[84px] shrink-0 text-center sm:w-[96px]">
                      <div className="mx-auto overflow-hidden rounded-md border border-slate-300 bg-white p-1.5">
                        {qrSrc ? <img src={qrSrc} alt="Location QR" className="h-full w-full object-contain" /> : <div className="h-16 w-16 bg-slate-100" />}
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-slate-600">Scan for Location</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`border-b border-slate-300 bg-[#f8fbff] px-4 py-2.5 sm:px-6 ${hidePrintPatientMeta ? 'print:hidden' : ''}`}>
              <div className="grid grid-cols-5 divide-x divide-slate-300 text-xs text-slate-800 sm:text-sm">
                <div className="flex items-center gap-2 pr-2"><span className="font-bold text-[#0d2f63]">Name:</span><span className="truncate">{patientName || '—'}</span></div>
                <div className="flex items-center justify-center gap-2 px-2"><span className="font-bold text-[#0d2f63]">Age:</span><span>{patientAge ? `${patientAge} ${patientAgeUnit}` : '—'}</span></div>
                <div className="flex items-center justify-center gap-2 px-2"><span className="font-bold text-[#0d2f63]">Gender:</span><span>{formattedGender}</span></div>
                <div className="flex items-center justify-center gap-2 px-2"><span className="font-bold text-[#0d2f63]">Mobile:</span><span>{patientContact || '—'}</span></div>
                <div className="flex items-center justify-center gap-2 px-2"><span className="font-bold text-[#0d2f63]">Visit:</span><span>{visitType || 'General'}</span></div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6">
              {templateType === 'eye' ? (
                <div className="mb-6">
                  <EyePrescriptionSection value={prescription?.specialty_data} readOnly />
                </div>
              ) : null}

              <div className={forceDesktopColumnsOnMobile ? 'grid grid-cols-12 gap-4' : 'grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-5'}>
                <div className={forceDesktopColumnsOnMobile ? 'col-span-3 space-y-4' : 'lg:col-span-3 space-y-4'}>
                  <div className="rounded-xl border border-[#cad6e8] bg-[#f7faff] p-3">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-r-md bg-[#0b3f86] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                      <FlaskConical className="h-3.5 w-3.5" /> Investigations
                    </div>
                    <ReadTextarea value={prescription?.tests} rows={8} placeholder="None" compact={forceDesktopColumnsOnMobile} />
                  </div>

                  <div className="rounded-xl border border-[#cad6e8] bg-[#f7faff] p-3">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-r-md bg-[#0b3f86] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                      <Stethoscope className="h-3.5 w-3.5" /> Diagnosis
                    </div>
                    <ReadTextarea value={prescription?.diagnosis} rows={8} placeholder="None" compact={forceDesktopColumnsOnMobile} />
                  </div>
                </div>

                <div className={forceDesktopColumnsOnMobile ? 'col-span-9 space-y-4' : 'lg:col-span-9 space-y-4'}>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-5xl font-serif font-bold text-[#0d2f63]">Rx</span>
                        <span className="text-lg font-bold uppercase text-[#0d2f63]">Prescription</span>
                      </div>
                      <div className="inline-flex items-center rounded-full border border-[#ccd8ea] bg-white p-1 text-[11px] font-semibold text-[#0d2f63]">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${templateType === 'eye' ? 'text-slate-500' : 'bg-[#0b3f86] text-white'}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" /> General
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${templateType === 'eye' ? 'bg-[#0b3f86] text-white' : 'text-slate-500'}`}>
                          <Eye className="h-3.5 w-3.5" /> Eye
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#c7d3e4]">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-[#0b3f86] text-white">
                          <tr>
                            <th className="w-12 px-2 py-2 text-left">No.</th>
                            <th className="px-2 py-2 text-left">Medicine</th>
                            <th className="w-20 px-2 py-2 text-left">Dose</th>
                            <th className="w-24 px-2 py-2 text-left">Frequency</th>
                            <th className="w-20 px-2 py-2 text-left">Duration</th>
                            <th className="w-36 px-2 py-2 text-left">Instruction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionRows.map((m, idx) => (
                            <tr key={`${m.name || 'med'}-${idx}`} className="border-t border-[#dde5f0] bg-white">
                              <td className="px-2 py-2 font-semibold text-slate-700">{idx + 1}</td>
                              <td className="px-2 py-2 text-slate-800">{m.name || '—'}</td>
                              <td className="px-2 py-2 text-slate-700">{m.dosage || '—'}</td>
                              <td className="px-2 py-2 text-slate-700">{m.frequency || m.schedule || '—'}</td>
                              <td className="px-2 py-2 text-slate-700">{m.duration || '—'}</td>
                              <td className="px-2 py-2 text-slate-700">{m.instruction || 'None'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t border-[#dde5f0] bg-white px-4 py-5">
                        <div className="space-y-4">
                          <div className="border-b border-dotted border-[#b9c7dc]" />
                          <div className="border-b border-dotted border-[#b9c7dc]" />
                          <div className="border-b border-dotted border-[#b9c7dc]" />
                        </div>
                        <div className="mt-3 rounded-md border border-dashed border-[#b9c7dc] py-2 text-center text-sm font-semibold text-[#0b3f86]">+ Add Medicine Row</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[#0d2f63]">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-bold uppercase tracking-wide">Advice</span>
                    </div>
                    <div className="rounded-lg border border-[#d5deea] bg-[#f5f8fd] px-3 py-2.5 text-sm text-slate-800">
                      <p className="mb-1 font-semibold text-slate-800">Emergency Note:</p>
                      <p>{prescription?.instructions || 'If symptoms worsen or persist, seek emergency care immediately.'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#dbe3ef] pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0d2f63]" />
                      <span className="text-xs font-bold uppercase tracking-wide text-[#0d2f63]">Follow-up Date</span>
                      <span className="min-w-[120px] rounded-md border border-[#cdd9ea] bg-[#f3f7fd] px-3 py-1 text-xs font-semibold text-slate-700">
                        {prescription?.next_visit_date ? (nextVisitLabel || prescription.next_visit_date) : 'mm/dd/yyyy'}
                      </span>
                    </div>

                    <div className="flex items-end gap-3 text-right">
                      <div>
                        <div className="mb-1 border-b border-[#0d2f63] pb-1 text-lg font-semibold italic text-[#0d2f63]">{doctorDisplayName}</div>
                        <div className="text-xs text-slate-600">{doctorSubTitle}</div>
                        <div className="text-xs text-slate-500">Reg. No: {doctorInfo?.registration_no || '123456'}</div>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0b3f86] bg-white p-2">
                        <img src={logoSrc} alt="Seal" className="h-full w-full object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-slate-500">Created: {createdAtDateLabel || 'N/A'} {createdAtTimeLabel || ''} · ID #{prescription?.id || 'N/A'}</div>

              <div className="mt-5 rounded-2xl bg-[#0b3f86] px-5 py-2.5 text-[11px] text-white">
                <div className="grid grid-cols-3 divide-x divide-white/30">
                  <div className="flex items-center justify-center gap-2 px-2"><ShieldCheck className="h-4 w-4" />Your Health, Our Priority</div>
                  <div className="flex items-center justify-center gap-2 px-2"><HeartHandshake className="h-4 w-4" />Compassionate Care, Trusted Results</div>
                  <div className="flex items-center justify-center gap-2 px-2"><Calendar className="h-4 w-4" />Thank You for Trusting Us</div>
                </div>
              </div>

              <div className={forceDesktopColumnsOnMobile ? 'mt-4 flex flex-wrap gap-3 print:hidden' : 'mt-4 flex w-full flex-col gap-2 print:hidden sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3'}>
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
  );
}
