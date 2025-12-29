import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import { formatDisplayDate, formatDisplayFromDateLike, formatTime12hFromDateTime } from '../../utils/dateFormat';

export default function PrescriptionShow({ prescription }) {
  const patientName = prescription?.user?.name || `User #${prescription?.user_id || ''}`;
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(prescription?.created_at), [prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(prescription?.created_at), [prescription?.created_at]);
  const apptDateLabel = useMemo(() => formatDisplayDate(prescription?.appointment?.appointment_date), [prescription?.appointment?.appointment_date]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(prescription?.next_visit_date), [prescription?.next_visit_date]);

  const block = (title, value) => (
    <GlassCard variant="solid" className="p-6">
      <div className="mb-2 text-lg font-extrabold text-[#005963]">{title}</div>
      {value ? (
        <div className="whitespace-pre-wrap text-sm text-gray-800">{value}</div>
      ) : (
        <div className="text-sm text-gray-500">—</div>
      )}
    </GlassCard>
  );

  return (
    <>
      <Head title="Prescription Details" />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Prescription</h1>
            <p className="mt-1 text-sm text-gray-700">
              Patient: <span className="font-semibold">{patientName}</span>
              {createdAtDateLabel ? (
                <span className="ml-2 text-gray-500">• Created: {createdAtDateLabel}{createdAtTimeLabel ? ` ${createdAtTimeLabel}` : ''}</span>
              ) : null}
            </p>
            {(apptDateLabel || prescription?.appointment?.appointment_time) && (
              <p className="mt-1 text-sm text-gray-700">
                Appointment: <span className="font-semibold">{apptDateLabel}</span>{' '}
                <span className="font-semibold">{prescription?.appointment?.appointment_time || ''}</span>
                {prescription?.appointment?.status ? <span className="ml-2 text-gray-500">• {prescription.appointment.status}</span> : null}
              </p>
            )}
            {nextVisitLabel && (
              <p className="mt-1 text-sm text-gray-700">
                Next visit: <span className="font-semibold">{nextVisitLabel}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/doctor/prescriptions" className="rounded-full border border-[#00acb1]/40 bg-white px-5 py-3 text-sm font-semibold text-[#005963]">
              Back
            </Link>
            <PrimaryButton
              type="button"
              onClick={() => window.print()}
              large
            >
              Print
            </PrimaryButton>
          </div>
        </div>

        <div className="space-y-6">
          {block('Diagnosis', prescription?.diagnosis)}
          {block('Medications', prescription?.medications)}
          {block('Instructions / Advice', prescription?.instructions)}
          {block('Tests / Investigations', prescription?.tests)}
        </div>
      </div>
    </>
  );
}

PrescriptionShow.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
