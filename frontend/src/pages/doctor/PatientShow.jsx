import { Head, Link } from '@inertiajs/react';
import { User, Mail, Phone, MapPin, Calendar, Weight, FileText, ArrowLeft, Eye, ClipboardList, Clock3, Hash } from 'lucide-react';
import { useMemo } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDate } from '../../utils/dateFormat';
import StatusBadge from '../../components/doctor/StatusBadge';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import { DocEmptyState } from '../../components/doctor/DocUI';

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

  const appointmentStats = useMemo(() => ({
    total: appointments.length,
    prescribed: appointments.filter((a) => a.status === 'prescribed').length,
    arrived: appointments.filter((a) => a.status === 'arrived').length,
  }), [appointments]);

  return (
    <>
      <Head title={`${patient.name} - Patient Details`} />
      <DoctorLayout>
        <div className="mx-auto max-w-[1320px] space-y-4">
          <section className="surface-card overflow-hidden rounded-3xl">
            <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-4 md:p-5">
              <div className="mb-3">
                <Link
                  href="/doctor/patients"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  <ArrowLeft size={12} />
                  Back to Patients
                </Link>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-3">
                  <PatientAvatar name={patient.name} size="xl" className="rounded-2xl" />
                  <div>
                    <h1 className="inline-flex items-center gap-1.5 text-xl font-bold text-slate-800 md:text-2xl">
                      <User className="h-4.5 w-4.5 text-[#3556a6] md:h-5 md:w-5" />
                      {patient.name}
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-center shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">Appointments</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{appointmentStats.total}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-center shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">Arrived</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{appointmentStats.arrived}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-center shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">Prescribed</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{appointmentStats.prescribed}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-center shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">Prescriptions</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{prescriptions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#edf1fb] p-2.5">
                  <FileText className="h-5 w-5 text-[#3556a6]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Patient Overview</h2>
                  <p className="text-xs text-slate-500">Complete patient information and treatment timeline</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Total Visits: {appointmentStats.total}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Prescriptions: {prescriptions.length}
                </span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ViewField icon={Mail} label="Email" value={patient.email} />
              <ViewField icon={Phone} label="Phone" value={patient.phone} />
              <ViewField icon={User} label="Gender" value={patient.gender} capitalize />
              <ViewField icon={Calendar} label="Age" value={resolvedAge ? `${resolvedAge} years` : null} />
              <ViewField icon={Calendar} label="DOB" value={patient.date_of_birth ? formatDisplayDate(patient.date_of_birth) : null} />
              <ViewField icon={Weight} label="Weight" value={patient.weight ? `${patient.weight} kg` : null} />
              <ViewField icon={MapPin} label="Address" value={patient.address} span={2} />
              <ViewField icon={Calendar} label="Member Since" value={formatDisplayDate(patient.created_at)} span={2} />

              <div className="lg:col-span-2">
                <div className="mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#3556a6]" />
                  <h3 className="text-xs font-semibold text-slate-700">Appointments</h3>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  {appointments.length > 0 ? (
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-[0.1em]">
                        <tr>
                          <th className="px-4 py-2.5 text-left">#</th>
                          <th className="px-4 py-2.5 text-left">Date</th>
                          <th className="px-4 py-2.5 text-left">Time</th>
                          <th className="px-4 py-2.5 text-left">Status</th>
                          <th className="px-4 py-2.5 text-left">Symptoms</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {appointments.slice(0, 8).map((appointment, index) => (
                          <tr key={appointment.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Hash className="h-3 w-3 text-slate-400" />
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {appointment.appointment_date ? formatDisplayDate(appointment.appointment_date) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3 w-3 text-slate-400" />
                                {appointment.appointment_time || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5"><StatusBadge status={appointment.status} size="xs" /></td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700 max-w-xs truncate">
                              <span className="inline-flex items-center gap-1.5">
                                <ClipboardList className="h-3 w-3 text-slate-400" />
                                {appointment.symptoms || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-5"><DocEmptyState icon={Calendar} title="No appointments found" /></div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#3556a6]" />
                  <h3 className="text-xs font-semibold text-slate-700">Prescriptions</h3>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  {prescriptions.length > 0 ? (
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-[0.1em]">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Date</th>
                          <th className="px-4 py-2.5 text-left">Diagnosis</th>
                          <th className="px-4 py-2.5 text-left">Medications</th>
                          <th className="px-4 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {prescriptions.map((prescription) => (
                          <tr key={prescription.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {formatDisplayDate(prescription.created_at)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700 max-w-[280px] truncate">{prescription.diagnosis || '-'}</td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700 max-w-[280px] truncate">{prescription.medications || '-'}</td>
                            <td className="px-4 py-2.5 text-center">
                              <Link
                                href={`/doctor/prescriptions/${prescription.id}`}
                                className="inline-flex items-center gap-1 rounded-md bg-[#2D3A74] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#253066]"
                              >
                                <Eye size={11} />
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-5"><DocEmptyState icon={FileText} title="No prescriptions found" /></div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </DoctorLayout>
    </>
  );
}

function ViewField({ icon: Icon, label, value, span, capitalize }) {
  return (
    <div className={`${span === 2 ? 'lg:col-span-2' : ''}`}>
      <div className="mb-1 flex items-center gap-1.5">
        {Icon ? <Icon size={12} className="text-[#3556a6]" /> : null}
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      </div>
      <div className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 ${capitalize ? 'capitalize' : ''}`}>
        <span className="inline-flex items-center gap-1.5">
          {Icon ? <Icon size={11} className="text-slate-400" /> : null}
          {value || 'Not provided'}
        </span>
      </div>
    </div>
  );
}
