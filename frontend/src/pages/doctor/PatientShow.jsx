import { Head, Link } from '@inertiajs/react';
import { User, Mail, Phone, MapPin, Calendar, Weight, FileText, ArrowLeft, Eye, CheckCircle, XCircle, ClipboardList, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayFromDateLike, formatDisplayDate } from '../../utils/dateFormat';
import StatCard from '../../components/doctor/StatCard';
import StatusBadge from '../../components/doctor/StatusBadge';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import { DocCard, DocEmptyState } from '../../components/doctor/DocUI';

export default function PatientShow({ patient, appointments = [], prescriptions = [] }) {
  const [activeTab, setActiveTab] = useState('personal');

  const appointmentStats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      arrived: appointments.filter(a => a.status === 'arrived').length,
      prescribed: appointments.filter(a => a.status === 'prescribed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      upcoming: appointments.filter((appointment) => {
        if (!appointment.appointment_date) return false;
        const appointmentMoment = new Date(`${appointment.appointment_date}T${appointment.appointment_time || '00:00'}`);
        if (Number.isNaN(appointmentMoment.getTime())) return false;
        return appointmentMoment >= new Date() && !['cancelled', 'prescribed'].includes(appointment.status);
      }).length,
    };
  }, [appointments]);

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

  const tabs = [
    { key: 'personal', label: 'Personal Info', icon: User },
    { key: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
    { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
  ];
  const resolvedAge = patient.age || calculateAge(patient.date_of_birth);

  return (
    <>
      <Head title={`${patient.name} - Patient Details`} />
      <DoctorLayout>
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Patient header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PatientAvatar name={patient.name} size="xl" className="rounded-xl" />
              <div>
                <Link
                  href="/doctor/patients"
                  className="mb-1 inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Patients
                </Link>
                <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{patient.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  {patient.gender && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 capitalize">{patient.gender}</span>}
                  {resolvedAge && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{resolvedAge} years</span>}
                  {patient.phone && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{patient.phone}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Appointments</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{appointmentStats.total}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Prescriptions</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{prescriptions.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Arrived</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{appointmentStats.arrived}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Member Since</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{formatDisplayDate(patient.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Scheduled" value={appointmentStats.scheduled} icon={Calendar} variant="blue" />
            <StatCard label="Upcoming" value={appointmentStats.upcoming} icon={Clock3} variant="amber" />
            <StatCard label="Prescribed" value={appointmentStats.prescribed} icon={ClipboardList} variant="cyan" />
            <StatCard label="Cancelled" value={appointmentStats.cancelled} icon={XCircle} variant="rose" />
          </div>

          {/* Tabs */}
          <div className="surface-card rounded-3xl overflow-hidden">
            <div className="border-b border-slate-100">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                        activeTab === tab.key
                          ? 'border-[#2D3A74] text-[#2D3A74]'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5">
              {/* Personal Info */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <InfoField icon={Mail} label="Email" value={patient.email} />
                  <InfoField icon={Phone} label="Phone" value={patient.phone} />
                  <InfoField label="Gender" value={patient.gender} capitalize />
                  <InfoField icon={MapPin} label="Address" value={patient.address} span={3} />
                  <InfoField label="Age" value={patient.age || calculateAge(patient.date_of_birth) ? `${patient.age || calculateAge(patient.date_of_birth)} years` : null} />
                  <InfoField icon={Calendar} label="DOB" value={patient.date_of_birth ? formatDisplayDate(patient.date_of_birth) : null} />
                  <InfoField icon={Weight} label="Weight" value={patient.weight ? `${patient.weight} kg` : null} />
                  <InfoField label="Member Since" value={formatDisplayDate(patient.created_at)} span={3} />
                </div>
              )}

              {/* Appointments */}
              {activeTab === 'appointments' && (
                <div>
                  {appointments.length > 0 ? (
                    <div className="overflow-x-auto border-t border-slate-100">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                          <tr>
                            <th className="px-6 py-4 text-left">Date</th>
                            <th className="px-6 py-4 text-left">Time</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-left">Symptoms</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {appointments.slice(0, 5).map((appointment) => (
                            <tr key={appointment.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-[13px] font-semibold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  {appointment.appointment_date ? formatDisplayDate(appointment.appointment_date) : '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                                  {appointment.appointment_time || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={appointment.status} size="xs" />
                              </td>
                              <td className="px-6 py-4 text-[13px] font-medium text-slate-700 max-w-xs truncate">
                                <span className="inline-flex items-center gap-1.5">
                                  <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                                  {appointment.symptoms || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {appointments.length > 5 && (
                        <p className="text-xs text-slate-400 mt-3 px-6">Showing 5 of {appointments.length} appointments</p>
                      )}
                    </div>
                  ) : (
                    <DocEmptyState icon={Calendar} title="No appointments found" />
                  )}
                </div>
              )}

              {/* Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div>
                  {prescriptions.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border-l-3 border-l-[#FF7C00] bg-slate-50 rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderLeftWidth: '3px' }}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">Prescription Date</p>
                              <p className="text-xs font-semibold text-slate-800">
                                {formatDisplayDate(prescription.created_at)}
                              </p>
                            </div>
                            <Link
                              href={`/doctor/prescriptions/${prescription.id}`}
                              className="inline-flex items-center gap-1 bg-[#2D3A74] hover:bg-[#253066] text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Eye size={12} />
                              View
                            </Link>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                            {prescription.diagnosis && (
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">DIAGNOSIS</p>
                                <p className="text-slate-700 line-clamp-1">{prescription.diagnosis}</p>
                              </div>
                            )}
                            {prescription.medications && (
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">MEDICATIONS</p>
                                <p className="text-slate-700 line-clamp-1">{prescription.medications}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DocEmptyState icon={FileText} title="No prescriptions found" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DoctorLayout>
    </>
  );
}

function InfoField({ icon: Icon, label, value, span, capitalize }) {
  return (
    <div className={`rounded-lg bg-slate-50 p-3 ${span === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} className="text-[#3556a6]" />}
        <label className="text-xs font-medium text-slate-400">{label}</label>
      </div>
      <p className={`text-slate-800 font-medium text-xs ${capitalize ? 'capitalize' : ''}`}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}
