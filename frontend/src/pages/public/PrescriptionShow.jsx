import { useMemo, useRef, useState } from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import html2pdf from 'html2pdf.js';
import {
  formatDisplayDate,
  formatDisplayFromDateLike,
  formatTime12hFromDateTime,
} from '../../utils/dateFormat';

const EYE_DIRECTION_ORDER = ['R/E', 'L/E', 'B/E', 'NV', 'R>L', 'L>R'];

function emptyEyeDirectionPayload() {
  return {
    sph: '',
    cyl: '',
    axis: '',
    va: '',
    add: '',
    note: '',
  };
}

function normalizeEyeDirectionSide(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const normalized = raw.toUpperCase().replace(/\s+/g, '');
  const compact = normalized.replace(/[^A-Z0-9><]/g, '');

  if (['RE', 'OD', 'R', 'RIGHT'].includes(compact)) return 'R/E';
  if (['LE', 'OS', 'L', 'LEFT'].includes(compact)) return 'L/E';
  if (['BE', 'OU', 'BOTH'].includes(compact)) return 'B/E';
  if (['NV', 'NEAR', 'NEARVISION'].includes(compact)) return 'NV';
  if (['R>L', 'RE>LE', 'OD>OS', 'RIGHT>LEFT'].includes(normalized) || ['R>L', 'RE>LE', 'OD>OS', 'RIGHT>LEFT'].includes(compact)) return 'R>L';
  if (['L>R', 'LE>RE', 'OS>OD', 'LEFT>RIGHT'].includes(normalized) || ['L>R', 'LE>RE', 'OS>OD', 'LEFT>RIGHT'].includes(compact)) return 'L>R';

  return raw;
}

function normalizeEyeDirectionDetail(value) {
  const next = emptyEyeDirectionPayload();
  if (!value || typeof value !== 'object') return next;

  Object.entries(value).forEach(([rawKey, rawVal]) => {
    const key = String(rawKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const val = String(rawVal ?? '').trim();

    if (key === 'sph') next.sph = val;
    if (key === 'cyl') next.cyl = val;
    if (key === 'axis') next.axis = val;
    if (key === 'va') next.va = val;
    if (key === 'add') next.add = val;
    if (key === 'note' || key === 'notes' || key === 'remark' || key === 'remarks') next.note = val;
  });

  return next;
}

function hasEyeDirectionDetail(detail) {
  if (!detail || typeof detail !== 'object') return false;
  return ['sph', 'cyl', 'axis', 'va', 'add', 'note'].some((key) => String(detail[key] || '').trim() !== '');
}

function parseEyeDirectionDetails(prescription = {}) {
  const directionMap = {};

  const addDetail = (sideRaw, detailRaw) => {
    const side = normalizeEyeDirectionSide(sideRaw);
    if (!side) return;
    const detail = normalizeEyeDirectionDetail(detailRaw);
    if (!hasEyeDirectionDetail(detail)) return;
    directionMap[side] = {
      ...(directionMap[side] || emptyEyeDirectionPayload()),
      ...detail,
    };
  };

  const diagnosisLines = String(prescription?.diagnosis || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  diagnosisLines.forEach((line) => {
    const match = line.match(/^Eye Assessment Note \[(.+?)\]:\s*(.*)$/i);
    if (!match) return;
    const side = normalizeEyeDirectionSide(match[1]);
    const raw = String(match[2] || '').trim();
    if (!side) return;

    const next = emptyEyeDirectionPayload();
    const tokenParts = raw.split(/[|;]/).map((item) => item.trim()).filter(Boolean);
    tokenParts.forEach((token) => {
      const kv = token.match(/^([^:=]+)\s*[:=]\s*(.+)$/);
      if (!kv) return;

      const key = String(kv[1] || '').trim().toLowerCase();
      const value = String(kv[2] || '').trim();
      if (key === 'sph') next.sph = value;
      if (key === 'cyl') next.cyl = value;
      if (key === 'axis') next.axis = value;
      if (key === 'v/a' || key === 'va') next.va = value;
      if (key === 'add') next.add = value;
      if (key === 'note') next.note = value;
    });
    if (!tokenParts.length) next.note = raw;
    if (hasEyeDirectionDetail(next)) {
      directionMap[side] = next;
    }
  });

  const specialtyDirection = prescription?.specialty_data?.eye_direction_assessment;
  if (specialtyDirection && typeof specialtyDirection === 'object') {
    const rawNotes = specialtyDirection.notes;
    if (Array.isArray(rawNotes)) {
      rawNotes.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        addDetail(item.side || item.direction || item.key, item);
      });
    } else if (rawNotes && typeof rawNotes === 'object') {
      Object.entries(rawNotes).forEach(([side, detail]) => addDetail(side, detail));
    }

    Object.entries(specialtyDirection).forEach(([key, value]) => {
      if (['notes', 'selected_sides', 'selectedSides', 'sides'].includes(key)) return;
      addDetail(key, value);
    });
  }

  return EYE_DIRECTION_ORDER
    .filter((side) => hasEyeDirectionDetail(directionMap[side]))
    .map((side) => ({ side, detail: directionMap[side] }));
}

function parseMedicationsText(text) {
  if (!text?.trim()) return [];

  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(' - ');
      return {
        name: parts[0] || '',
        dosage: parts[1] || '',
        duration: parts[2] || '',
        instruction: parts[3] || '',
      };
    });
}

function parseSectionLines(text = '') {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const complaints = [];
  const exam = [];
  const diagnoses = [];
  let section = '';

  lines.forEach((line) => {
    if (/^Chief Complaints:/i.test(line)) {
      section = 'complaints';
      return;
    }

    if (/^O\/?E:/i.test(line) || /^Vitals:/i.test(line)) {
      section = 'exam';
      const rest = line.replace(/^(O\/?E|Vitals):\s*/i, '').trim();
      if (rest) {
        rest
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => exam.push(part));
      }
      return;
    }

    if (/^Exam Notes:/i.test(line)) {
      section = 'exam';
      const rest = line.replace(/^Exam Notes:\s*/i, '').trim();
      if (rest) exam.push(rest);
      return;
    }

    if (/^Provisional Diagnosis:/i.test(line) || /^Final Diagnosis:/i.test(line)) {
      section = 'diagnosis';
      diagnoses.push(line.replace(/^Provisional Diagnosis:\s*/i, '').replace(/^Final Diagnosis:\s*/i, '').trim());
      return;
    }

    if (/^Eye Assessment Note\s*\[/i.test(line)) {
      return;
    }

    if (line.startsWith('-')) {
      const cleaned = line.replace(/^-\s*/, '').trim();
      if (!cleaned) return;
      if (section === 'complaints') complaints.push(cleaned);
      if (section === 'exam') exam.push(cleaned);
      return;
    }

    if (section === 'exam') {
      exam.push(line);
      return;
    }

    if (section === 'diagnosis') {
      diagnoses.push(line);
    }
  });

  return { complaints, exam, diagnoses };
}

function parseInvestigations(items = [], text = '') {
  if (Array.isArray(items) && items.length) {
    const rows = [...items]
      .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0))
      .map((item) => ({
        name: String(item?.name || '').trim(),
        note: String(item?.note || '').trim(),
      }))
      .filter((item) => item.name);

    if (rows.length) {
      return rows;
    }
  }

  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PublicPrescriptionShow({ prescription = {}, doctorInfo = {}, chamberInfo = null }) {
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(prescription?.created_at), [prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(prescription?.next_visit_date), [prescription?.next_visit_date]);

  const patientName = prescription?.patient_name || `Patient #${prescription?.id || ''}`;
  const patientAge = prescription?.patient_age;
  const patientAgeUnit = prescription?.patient_age_unit || 'years';
  const medicines = useMemo(() => parseMedicationsText(prescription?.medications), [prescription?.medications]);
  const diagnosisSections = useMemo(() => parseSectionLines(prescription?.diagnosis), [prescription?.diagnosis]);
  const investigationLines = useMemo(
    () => parseInvestigations(prescription?.investigation_items, prescription?.tests),
    [prescription?.investigation_items, prescription?.tests],
  );
  const eyeDirectionDetails = useMemo(
    () => parseEyeDirectionDetails(prescription),
    [prescription],
  );
  const prescriptionRows = useMemo(
    () => medicines.filter((m) => String(m?.name || m?.dosage || m?.duration || m?.instruction || '').trim()),
    [medicines],
  );
  const showChamberFooter = !!(chamberInfo?.name || chamberInfo?.location || chamberInfo?.phone);
  const showClinicalSections =
    diagnosisSections.complaints.length > 0 ||
    diagnosisSections.exam.length > 0 ||
    investigationLines.length > 0 ||
    eyeDirectionDetails.length > 0;

  const prescriptionRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;

    try {
      setDownloadingPDF(true);
      const element = prescriptionRef.current;
      if (!element) {
        handlePrint();
        return;
      }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `prescription-${prescription?.id || 'prescription'}-${patientName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch {
      handlePrint();
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <PublicLayout hideHeader>
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <a
              href="/"
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Home
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Print
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="rounded bg-[#1f2d4f] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#192540] disabled:opacity-60"
              >
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>

          <div
            ref={prescriptionRef}
            id="public-prescription-print-root"
            className="mx-auto w-full max-w-[210mm] min-h-[297mm] border border-slate-300 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="border-b border-slate-300 px-6 py-5">
              <div className="grid grid-cols-12 items-start gap-4 text-black">
                <div className="col-span-5 text-sm leading-snug">
                  <p className="text-base font-bold text-[#0d2f63]">{doctorInfo?.name || 'Doctor Name'}</p>
                  {doctorInfo?.specialization || doctorInfo?.degree ? (
                    <p>{doctorInfo?.specialization || doctorInfo?.degree}</p>
                  ) : null}
                  {doctorInfo?.hospital ? <p>{doctorInfo.hospital}</p> : null}
                  {doctorInfo?.phone ? <p>{doctorInfo.phone}</p> : null}
                </div>
                <div className="col-span-2 flex justify-center">
                  <img
                    src={doctorInfo?.profile_picture || '/stethoscope-2.png'}
                    alt="logo"
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <div className="col-span-5 text-right text-sm leading-snug">
                  <p className="text-base font-bold uppercase text-[#0d2f63]">Chamber</p>
                  {chamberInfo?.name ? <p>{chamberInfo.name}</p> : null}
                  {chamberInfo?.location ? <p>{chamberInfo.location}</p> : null}
                  {chamberInfo?.phone ? <p>Phone: {chamberInfo.phone}</p> : null}
                </div>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-[#f8fbff] px-6 py-2.5 text-sm font-semibold text-black sm:text-base">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm">
                <div>Name: {patientName || '—'}</div>
                {prescription?.id ? <div>ID: {prescription.id}</div> : null}
                {patientAge ? <div>Age: {patientAge} {patientAgeUnit}</div> : null}
                {createdAtDateLabel ? <div>Date: {createdAtDateLabel}</div> : null}
              </div>
            </div>

            <div className="relative grid min-h-[210mm] grid-cols-12 px-6 py-4 text-black">
              <div className="pointer-events-none absolute bottom-4 left-[33.333333%] top-4 w-px -translate-x-1/2 bg-slate-300" />
              <div className="col-span-4 pr-4">
                <div className="space-y-4 text-xs leading-relaxed sm:text-sm">
                  {diagnosisSections.complaints.length ? (
                    <div>
                      <p className="mb-1 text-sm font-bold text-[#0d2f63]">Chief Complaints</p>
                      {diagnosisSections.complaints.map((line, idx) => <p key={`cc-${idx}`}>- {line}</p>)}
                    </div>
                  ) : null}

                  {diagnosisSections.exam.length ? (
                    <div>
                      <p className="mb-1 text-sm font-bold text-[#0d2f63]">O/E</p>
                      {diagnosisSections.exam.map((line, idx) => <p key={`ex-${idx}`}>{line}</p>)}
                    </div>
                  ) : null}

                  {investigationLines.length ? (
                    <div>
                      <p className="mb-1 text-sm font-bold text-[#0d2f63]">Investigation Advised</p>
                      {investigationLines.map((line, idx) => {
                        const name = typeof line === 'string' ? line : String(line?.name || '').trim();
                        const note = typeof line === 'string' ? '' : String(line?.note || '').trim();

                        return (
                          <div key={`inv-${idx}`} className="mb-1.5">
                            <p>- {name}</p>
                            {note ? <p className="pl-3 text-slate-600">Lab / Note: {note}</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {eyeDirectionDetails.length ? (
                    <div>
                      <p className="mb-1 text-sm font-bold text-[#0d2f63]">Eye Direction Assessment</p>
                      {eyeDirectionDetails.map(({ side, detail }) => {
                        const parts = [];
                        if (detail?.sph) parts.push(`SPH ${detail.sph}`);
                        if (detail?.cyl) parts.push(`CYL ${detail.cyl}`);
                        if (detail?.axis) parts.push(`AXIS ${detail.axis}`);
                        if (detail?.va) parts.push(`V/A ${detail.va}`);
                        if (detail?.add) parts.push(`ADD ${detail.add}`);
                        if (detail?.note) parts.push(`NOTE ${detail.note}`);

                        return (
                          <div key={`eye-dir-${side}`} className="mb-1.5">
                            <p className="font-semibold text-slate-800">{side}</p>
                            {parts.map((part, idx) => <p key={`eye-dir-${side}-${idx}`} className="pl-2">- {part}</p>)}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {!showClinicalSections ? <p className="text-slate-500">No clinical notes available.</p> : null}
                </div>
              </div>

              <div className="col-span-8 pl-4">
                <p className="mb-2 text-3xl font-serif font-bold text-[#0d2f63]">Rx</p>
                <div className="space-y-2 text-xs leading-snug sm:text-sm">
                  {prescriptionRows.map((m, idx) => (
                    <div key={`med-${idx}`}>
                      <p className="text-sm font-semibold">{idx + 1}. {m.name || 'Medicine'}</p>
                      <p className="pl-5 text-xs text-slate-700 sm:text-sm">
                        {m.dosage || ''}
                        {m.duration ? ` - ${m.duration}` : ''}
                        {m.instruction ? ` - ${m.instruction}` : ''}
                      </p>
                    </div>
                  ))}
                  {!prescriptionRows.length ? <p className="text-slate-500">No medicines listed.</p> : null}
                </div>
              </div>
            </div>

            {/* <div className="border-t border-slate-300 px-6 py-4 text-black">
              <div className="flex items-end justify-between">
                <p className="text-xs font-semibold sm:text-sm">{nextVisitLabel ? `Follow-up: ${nextVisitLabel}` : ''}</p>
                <div className="text-right">
                  {doctorInfo?.name ? <p className="text-xs sm:text-sm">{doctorInfo.name}</p> : null}
                </div>
              </div>
            </div> */}

            {/* {showChamberFooter ? (
              <div className="border-t border-slate-300 bg-[#f8fbff] px-6 py-3 text-center text-xs text-black sm:text-sm">
                {chamberInfo?.name ? <p>{chamberInfo.name}</p> : null}
                {chamberInfo?.location ? <p>{chamberInfo.location}</p> : null}
                {chamberInfo?.phone ? <p>{chamberInfo.phone}</p> : null}
              </div>
            ) : null} */}
          </div>
        </div>
      </section>

      <style>{`
        #public-prescription-print-root {
          width: min(210mm, 100%);
          min-height: 297mm;
        }

        @media print {
          @page { size: A4; margin: 10mm; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #public-prescription-print-root,
          #public-prescription-print-root * { visibility: visible !important; }
          #public-prescription-print-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 190mm !important;
            max-width: 190mm !important;
            min-height: 277mm !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </PublicLayout>
  );
}
