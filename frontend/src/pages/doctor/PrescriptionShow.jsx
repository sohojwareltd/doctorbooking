import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, ClipboardList, Heart, Phone, Mail, User, Stethoscope, Pill, FlaskConical, FileText, MapPin, Printer, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';

export default function PrescriptionShow({ prescription }) {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const prescriptionSettings = page?.props?.site?.prescription || {};
  const clinicName = prescriptionSettings?.clinicName || page?.props?.name || 'MediCare';
  const clinicPhone = prescriptionSettings?.phone || page?.props?.site?.contactPhone || '';
  const contactAddress = prescriptionSettings?.address || '';
  const clinicLogoUrl = prescriptionSettings?.logoUrl || '';
  const clinicRegistration = prescriptionSettings?.registrationNo || authUser?.registration_no || '';
  const clinicEmail = prescriptionSettings?.email || page?.props?.site?.contactEmail || '';
  const clinicWebsite = prescriptionSettings?.website || page?.props?.site?.website || '';

  const patientName = prescription?.patient_name || prescription?.user?.name || `User #${prescription?.user_id || ''}`;
  const doctorName = prescription?.doctor?.name || authUser?.name || 'Doctor';
  const doctorEmail = prescription?.doctor?.email || authUser?.email || '';
  const doctorPhone = authUser?.phone || '';
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(prescription?.created_at), [prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(prescription?.created_at), [prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(prescription?.next_visit_date), [prescription?.next_visit_date]);
  const visitDateLabel = useMemo(() => formatDisplayDate(prescription?.visit_date), [prescription?.visit_date]);

  // Patient info from prescription
  const patientAge = prescription?.patient_age;
  const patientAgeUnit = prescription?.patient_age_unit || 'years';
  const patientGender = prescription?.patient_gender;
  const patientWeight = prescription?.patient_weight;
  const patientContact = prescription?.patient_contact;
  const visitType = prescription?.visit_type;

  return (
    <DoctorLayout title="Prescription Details">
      {/* Action Buttons - Above prescription */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/doctor/prescriptions" className="flex items-center gap-2 rounded-xl border-2 border-[#005963]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#005963] shadow-sm transition hover:bg-[#005963]/5">
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
        >
          <Printer className="h-4 w-4" />
          Print Prescription
        </button>
      </div>

      {/* Physical Prescription Paper */}
      <div className="mx-auto max-w-4xl">
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
              <div className="flex items-start gap-4 text-right">
                <div className="flex-1">
                  <div className="text-xl font-black">{clinicName}</div>
                  {clinicRegistration && (
                    <div className="mt-1 text-xs font-semibold opacity-75">Reg. No: {clinicRegistration}</div>
                  )}
                  {contactAddress && (
                    <div className="mt-2 flex items-center justify-end gap-1 text-xs opacity-90">
                      <MapPin className="h-3 w-3" />
                      <span>{contactAddress}</span>
                    </div>
                  )}
                  {clinicPhone && (
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-90">
                      <Phone className="h-3 w-3" />
                      <span>{clinicPhone}</span>
                    </div>
                  )}
                  {clinicEmail && (
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-90">
                      <Mail className="h-3 w-3" />
                      <span>{clinicEmail}</span>
                    </div>
                  )}
                  {clinicWebsite && (
                    <div className="mt-1 text-xs opacity-75">{clinicWebsite}</div>
                  )}
                </div>
                {clinicLogoUrl ? (
                  <img src={clinicLogoUrl} alt="Logo" className="h-16 w-16 flex-shrink-0 rounded-xl border-2 border-white/40 bg-white object-contain p-1" />
                ) : (
                  <div className="flex-shrink-0 rounded-xl bg-white/20 p-3">
                    <Heart className="h-10 w-10" />
                  </div>
                )}
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
                    <span className="font-semibold">{patientAge}</span>
                    <span>{patientAgeUnit}</span>
                  </div>
                )}
                {patientGender && (
                  <div className="text-sm text-gray-700">{patientGender}</div>
                )}
                {patientWeight && (
                  <div className="text-sm text-gray-700">{patientWeight} kg</div>
                )}
                {patientContact && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {patientContact}
                  </div>
                )}
                {visitType && (
                  <div className="rounded-full border border-[#00acb1]/40 bg-[#00acb1]/10 px-2 py-0.5 text-xs font-semibold text-[#005963]">
                    {visitType}
                  </div>
                )}
                {visitDateLabel && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {visitDateLabel}
                  </div>
                )}
              </div>
              {nextVisitLabel && (
                <div className="flex items-center gap-2 rounded-lg border border-[#005963]/30 bg-[#005963]/5 px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-[#005963]" />
                  <span className="text-xs font-bold text-[#005963]">Follow-up: {nextVisitLabel}</span>
                </div>
              )}
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
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {prescription?.diagnosis || <span className="italic text-gray-400">—</span>}
                  </div>
                </div>

                {/* Tests */}
                {prescription?.tests && (
                  <div>
                    <div className="mb-3 flex items-center gap-2 border-b border-[#005963]/20 pb-2">
                      <FlaskConical className="h-4 w-4 text-[#005963]" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Investigations</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {prescription.tests}
                    </div>
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
                      <div className="whitespace-pre-wrap text-sm leading-loose text-gray-800">
                        {prescription?.medications || <span className="italic text-gray-400">No medications prescribed</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advice */}
                {prescription?.instructions && (
                  <div className="border-t-2 border-dotted border-gray-200 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#005963]" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#005963]">Advice</span>
                    </div>
                    <div className="whitespace-pre-wrap rounded-lg bg-[#005963]/5 p-3 text-sm leading-relaxed text-gray-700">
                      {prescription.instructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Signature Area */}
          <div className="border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-end justify-between">
              <div className="text-xs text-gray-500">
                <div>Prescription ID: #{prescription?.id}</div>
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
        }
      `}</style>
    </DoctorLayout>
  );
}
