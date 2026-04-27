import { Link } from '@inertiajs/react';
import { Calendar, ClipboardList, FileText, Pill, Printer, Stethoscope, User } from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';
import {
  formatDisplayDate,
  formatDisplayFromDateLike,
  formatTime12hFromDateTime,
} from '../../utils/dateFormat';

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
        note: parts[3] || '',
      };
    });
}

export default function PublicPrescriptionShow({ prescription = {}, doctorInfo = {}, chamberInfo = null }) {
  const createdAtDateLabel = formatDisplayFromDateLike(prescription?.created_at);
  const createdAtTimeLabel = formatTime12hFromDateTime(prescription?.created_at);
  const nextVisitLabel = formatDisplayDate(prescription?.next_visit_date);

  const patientName = prescription?.patient_name || `Patient #${prescription?.id || ''}`;
  const patientAge = prescription?.patient_age;
  const patientAgeUnit = prescription?.patient_age_unit || 'years';
  const patientGender = prescription?.patient_gender;
  const patientContact = prescription?.patient_contact;
  const medicines = parseMedicationsText(prescription?.medications);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 print:border-0 print:shadow-none">
            <div className="grid gap-3 border-b border-slate-200 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Prescription</p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">Prescription #{prescription?.id || 'N/A'}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {createdAtDateLabel || 'N/A'}
                  {createdAtTimeLabel ? ` • ${createdAtTimeLabel}` : ''}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Doctor</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{doctorInfo?.name || 'N/A'}</p>
                <p className="text-sm text-slate-600">{doctorInfo?.degree || '—'}</p>
                <p className="text-sm text-slate-600">{doctorInfo?.specialization || '—'}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <User className="h-3.5 w-3.5" /> Patient
                </div>
                <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {patientAge ? `${patientAge} ${patientAgeUnit}` : 'Age N/A'}
                  {patientGender ? ` • ${patientGender}` : ''}
                </p>
                <p className="text-sm text-slate-700">{patientContact || 'Phone N/A'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" /> Follow-up
                </div>
                <p className="text-sm font-semibold text-slate-900">{nextVisitLabel || 'No follow-up'}</p>
                {chamberInfo ? (
                  <p className="mt-2 text-sm text-slate-700">
                    {chamberInfo?.name || 'Chamber'}
                    {chamberInfo?.location ? ` • ${chamberInfo.location}` : ''}
                  </p>
                ) : null}
              </div>
            </div>

            {prescription?.diagnosis ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Stethoscope className="h-3.5 w-3.5" /> Diagnosis
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line">{prescription.diagnosis}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Pill className="h-3.5 w-3.5" /> Medicines
              </div>

              {medicines.length > 0 ? (
                <div className="space-y-2">
                  {medicines.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">{item.name || 'Medicine'}</p>
                      <p className="text-xs text-slate-600">
                        {[item.dosage, item.duration, item.note].filter(Boolean).join(' • ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-line">{prescription?.medications || 'No medicines listed.'}</p>
              )}
            </div>

            {prescription?.instructions ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <ClipboardList className="h-3.5 w-3.5" /> Instructions
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line">{prescription.instructions}</p>
              </div>
            ) : null}

            {prescription?.tests ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <FileText className="h-3.5 w-3.5" /> Tests
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line">{prescription.tests}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
