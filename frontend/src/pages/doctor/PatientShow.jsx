import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowLeft, Calendar, ClipboardList, FileText, IdCard, Mail, MapPin, Phone, Scale, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { useMemo } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate, formatDisplayTime12h } from '../../utils/dateFormat';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import { DocEmptyState } from '../../components/doctor/DocUI';
import {
  DashboardCard,
  InfoCard,
  PatientMetaBadge,
  PrescriptionCard,
  SectionHeading,
  StatCard,
  TimelineItem,
} from '../../components/doctor/PatientDetailsPrimitives';

export default function PatientShow({ patient, appointments = [], prescriptions = [] }) {
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const resolvedAge = patient.age || calculateAge(patient.date_of_birth);

  const dashboardStats = useMemo(() => {
    const visitStatuses = new Set(['arrived', 'in_consultation', 'awaiting_tests', 'prescribed']);
    const visitCount = appointments.filter((appointment) => visitStatuses.has(appointment.status)).length;
    const reportCount = prescriptions.filter((prescription) => prescription.tests || prescription.instructions).length;

    return {
      appointments: appointments.length,
      visits: visitCount,
      prescriptions: prescriptions.length,
      reports: reportCount,
    };
  }, [appointments, prescriptions]);

  const patientInfoItems = [
    { icon: Mail, label: 'Email', value: patient.email },
    { icon: Phone, label: 'Phone', value: patient.phone },
    { icon: User, label: 'Gender', value: patient.gender ? `${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}` : null },
    { icon: Calendar, label: 'Age', value: resolvedAge ? `${resolvedAge} years` : null },
    { icon: Scale, label: 'Weight', value: patient.weight ? `${patient.weight} kg` : null },
    { icon: MapPin, label: 'Address', value: patient.address },
  ];

  const memberSince = patient.created_at ? formatDisplayDate(patient.created_at) : 'Not available';

  return (
    <>
      <Head title={`${patient.name} - Patient Details`} />
      <DoctorLayout title="Patient Details">
        <div className="mx-auto max-w-[1360px] space-y-6">
          <DashboardCard className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(45,58,116,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafd_100%)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8dff2] to-transparent" />
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#2D3A74]/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-slate-200/60 blur-3xl" />
            <div className="relative p-6 sm:p-7 lg:p-8">
              <div className="mb-6">
                <Link
                  href="/doctor/patients"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={13} />
                  Back to Patients
                </Link>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] xl:items-start">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-[20px] bg-[#2D3A74]/10 blur-xl" />
                      <PatientAvatar name={patient.name} size="xl" className="relative h-20 w-20 rounded-[20px] border border-white/80 shadow-[0_16px_38px_-22px_rgba(45,58,116,0.65)]" />
                    </div>
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PatientMetaBadge tone="primary">Patient Dashboard</PatientMetaBadge>
                        <PatientMetaBadge>ID #{patient.id}</PatientMetaBadge>
                        <PatientMetaBadge tone="success">Active</PatientMetaBadge>
                      </div>
                      <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.4rem]">{patient.name}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                          Unified view of patient identity, visit history, prescriptions, and clinical activity in a single dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
                    <InfoCard icon={Mail} label="Primary Email" value={patient.email} />
                    <InfoCard icon={Phone} label="Direct Line" value={patient.phone} />
                    <InfoCard icon={Calendar} label="Member Since" value={memberSince} />
                    <InfoCard icon={ShieldCheck} label="Profile Status" value="Ready for consultation" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 shadow-sm">
                      <Stethoscope className="h-4 w-4 text-[#2D3A74]" />
                      Care history curated for the current doctor
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 shadow-sm">
                      <IdCard className="h-4 w-4 text-[#2D3A74]" />
                      Patient ID #{patient.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatCard icon={Calendar} label="Appointments" value={dashboardStats.appointments} hint="All consultations recorded for this doctor." />
                  <StatCard icon={Activity} label="Visits" value={dashboardStats.visits} hint="Completed or active care touchpoints." />
                  <StatCard icon={FileText} label="Prescriptions" value={dashboardStats.prescriptions} hint="Medication plans issued to this patient." />
                  <StatCard icon={ClipboardList} label="Reports" value={dashboardStats.reports} hint="Entries with tests or clinical instructions." />
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeading
              eyebrow="Patient Information"
              title="Clinical profile snapshot"
              description="Core patient demographics and contact details presented as quick-read cards."
            />

            <div className="grid gap-4 p-6 md:grid-cols-2">
              {patientInfoItems.map((item) => (
                <InfoCard
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  className={item.label === 'Address' ? 'md:col-span-2' : ''}
                />
              ))}
            </div>
          </DashboardCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <DashboardCard className="overflow-hidden">
              <SectionHeading
                eyebrow="Appointments"
                title="Care timeline"
                description="Chronological visit history with status and symptom summaries."
                action={<PatientMetaBadge>{appointments.length} entries</PatientMetaBadge>}
              />

              <div className="p-6">
                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.slice(0, 8).map((appointment) => (
                      <TimelineItem
                        key={appointment.id}
                        appointment={appointment}
                        dateLabel={appointment.appointment_date ? formatDisplayDate(appointment.appointment_date) : 'Date pending'}
                        timeLabel={formatDisplayTime12h(appointment.appointment_time) || appointment.appointment_time || 'Time pending'}
                        symptoms={appointment.symptoms || 'No symptoms recorded for this appointment.'}
                        actionHref={`/doctor/appointments?highlight=${appointment.id}`}
                      />
                    ))}
                  </div>
                ) : (
                  <DocEmptyState
                    icon={Calendar}
                    title="No appointments found"
                    description="Consultation history will appear here once this patient has active visits with you."
                  />
                )}
              </div>
            </DashboardCard>

            <DashboardCard className="overflow-hidden">
              <SectionHeading
                eyebrow="Prescriptions"
                title="Medication records"
                description="Current and historical prescription summaries with direct access to details."
                action={<PatientMetaBadge>{prescriptions.length} records</PatientMetaBadge>}
              />

              <div className="space-y-4 p-6">
                {prescriptions.length > 0 ? (
                  prescriptions.map((prescription) => (
                    <PrescriptionCard
                      key={prescription.id}
                      diagnosis={prescription.diagnosis}
                      medications={prescription.medications}
                      dateLabel={formatDisplayDate(prescription.created_at)}
                      actionHref={`/doctor/prescriptions/${prescription.id}`}
                    />
                  ))
                ) : (
                  <DocEmptyState
                    icon={FileText}
                    title="No prescriptions found"
                    description="Prescription cards will appear here after a treatment plan is created."
                  />
                )}
              </div>
            </DashboardCard>
          </div>
        </div>
      </DoctorLayout>
    </>
  );
}
