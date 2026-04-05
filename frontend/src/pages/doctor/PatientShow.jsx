import { Head, Link } from '@inertiajs/react';
import { User, Mail, Phone, MapPin, Calendar, Weight, FileText, ArrowLeft, Eye, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
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
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] p-6 shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-[#efba92]/15" />
            <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div>
                <Link
                  href="/doctor/patients"
                  className="mb-3 inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Patients
                </Link>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  <User className="h-3.5 w-3.5" />
                  Patient Record
                </div>
                <div className="flex items-center gap-4">
                  <PatientAvatar name={patient.name} size="xl" className="rounded-xl ring-2 ring-white/20" />
                  <div>
                    <h1 className="text-2xl font-bold text-white md:text-3xl">{patient.name}</h1>
                    <p className="mt-1 text-sm text-white/75">Patient details, appointment timeline, and prescription history.</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
                      {patient.gender && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 capitalize">{patient.gender}</span>}
                      {resolvedAge && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{resolvedAge} years</span>}
                      {patient.phone && <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{patient.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">Appointments</div>
                  <div className="mt-1 text-sm font-bold text-white">{appointmentStats.total}</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">Prescriptions</div>
                  <div className="mt-1 text-sm font-bold text-white">{prescriptions.length}</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">Arrived</div>
                  <div className="mt-1 text-sm font-bold text-white">{appointmentStats.arrived}</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">Member Since</div>
                  <div className="mt-1 text-sm font-bold text-white">{formatDisplayDate(patient.created_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Appointments" value={appointmentStats.total} icon={Calendar} variant="blue" />
            <StatCard label="Arrived" value={appointmentStats.arrived} icon={CheckCircle} variant="emerald" />
            <StatCard label="Prescribed" value={appointmentStats.prescribed} icon={ClipboardList} variant="cyan" />
            <StatCard label="Cancelled" value={appointmentStats.cancelled} icon={XCircle} variant="rose" />
          </div>

          {/* Tabs */}
          <DocCard padding={false}>
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
                          ? 'border-[#3556a6] text-[#3556a6]'
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">Date</th>
                            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">Time</th>
                            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">Symptoms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.slice(0, 5).map((appointment) => (
                            <tr key={appointment.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 text-xs font-medium text-slate-800">
                                {appointment.appointment_date ? formatDisplayDate(appointment.appointment_date) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-xs font-medium text-slate-800">
                                {appointment.appointment_time || '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={appointment.status} size="xs" />
                              </td>
                              <td className="py-2.5 px-3 text-xs text-slate-600 max-w-xs truncate">
                                {appointment.symptoms || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {appointments.length > 5 && (
                        <p className="text-xs text-slate-400 mt-3 px-3">Showing 5 of {appointments.length} appointments</p>
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
                        <div key={prescription.id} className="border-l-3 border-l-[#c57945] bg-slate-50 rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderLeftWidth: '3px' }}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">Prescription Date</p>
                              <p className="text-xs font-semibold text-slate-800">
                                {formatDisplayDate(prescription.created_at)}
                              </p>
                            </div>
                            <Link
                              href={`/doctor/prescriptions/${prescription.id}`}
                              className="inline-flex items-center gap-1 bg-[#3556a6] hover:bg-[#2a488f] text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
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
          </DocCard>
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
