import { Head, Link, usePage, router } from '@inertiajs/react';
import { User, Mail, Phone, MapPin, Calendar, Weight, Stethoscope, FileText, ArrowLeft, Eye, Download, ChevronDown, ChevronUp, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayFromDateLike, formatDisplayDate } from '../../utils/dateFormat';

export default function PatientShow({ patient, appointments = [], prescriptions = [] }) {
  const [activeTab, setActiveTab] = useState('personal');
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    arrived: 'bg-green-100 text-green-800',
    in_consultation: 'bg-yellow-100 text-yellow-800',
    awaiting_tests: 'bg-purple-100 text-purple-800',
    prescribed: 'bg-cyan-100 text-cyan-800',
    cancelled: 'bg-red-100 text-red-800',
  };

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

  return (
    <>
      <Head title={`${patient.name} - Patient Details`} />
      
      <DoctorLayout>
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d4a7a] via-[#3b6998] to-[#e08a4a] p-6 shadow-md mb-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/doctor/patients"
                className="mb-2 inline-flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Patients
              </Link>
              <h1 className="text-2xl font-black text-white">{patient.name}</h1>
              <p className="mt-1 text-sm text-white/70">Patient Details &amp; History</p>
            </div>
          </div>
        </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Total Appointments</div>
                  <div className="mt-2 text-3xl font-bold text-gray-700">{appointmentStats.total}</div>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3.5">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Arrived</div>
                  <div className="mt-2 text-3xl font-bold text-gray-700">{appointmentStats.arrived}</div>
                </div>
                <div className="rounded-2xl bg-green-50 p-3.5">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Prescribed</div>
                  <div className="mt-2 text-3xl font-bold text-gray-700">{appointmentStats.prescribed}</div>
                </div>
                <div className="rounded-2xl bg-cyan-50 p-3.5">
                  <ClipboardList className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-gray-100/80 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Cancelled</div>
                  <div className="mt-2 text-3xl font-bold text-gray-700">{appointmentStats.cancelled}</div>
                </div>
                <div className="rounded-2xl bg-red-50 p-3.5">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section - Personal Info, Appointments & Prescriptions */}
          <div className="rounded-3xl border border-gray-100/80 bg-white shadow-sm mt-4">
            <div className="border-b border-slate-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === 'personal'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User size={18} />
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === 'appointments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={18} />
                  Appointments ({appointments.length})
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === 'prescriptions'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={18} />
                  Prescriptions ({prescriptions.length})
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Personal Info Tab Content */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {/* Email */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={14} className="text-indigo-600" />
                      <label className="text-xs font-semibold text-slate-600">Email</label>
                    </div>
                    <p className="text-slate-900 font-medium text-xs break-all">
                      {patient.email || 'Not provided'}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={14} className="text-indigo-600" />
                      <label className="text-xs font-semibold text-slate-600">Phone</label>
                    </div>
                    <p className="text-slate-900 font-medium text-xs">
                      {patient.phone || 'Not provided'}
                    </p>
                  </div>

                  {/* Gender */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Gender</label>
                    <p className="text-slate-900 font-medium capitalize text-xs">
                      {patient.gender || 'Not specified'}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="bg-slate-50 rounded-lg p-3 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-indigo-600" />
                      <label className="text-xs font-semibold text-slate-600">Address</label>
                    </div>
                    <p className="text-slate-900 font-medium text-xs line-clamp-2">
                      {patient.address || 'Not provided'}
                    </p>
                  </div>

                  {/* Age */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Age</label>
                    <p className="text-slate-900 font-medium text-xs">
                      {patient.age || calculateAge(patient.date_of_birth) || 'Not provided'} years
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-indigo-600" />
                      <label className="text-xs font-semibold text-slate-600">DOB</label>
                    </div>
                    <p className="text-slate-900 font-medium text-xs">
                      {patient.date_of_birth ? formatDisplayDate(patient.date_of_birth) : 'Not provided'}
                    </p>
                  </div>

                  {/* Weight */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Weight size={14} className="text-indigo-600" />
                      <label className="text-xs font-semibold text-slate-600">Weight</label>
                    </div>
                    <p className="text-slate-900 font-medium text-xs">
                      {patient.weight ? `${patient.weight} kg` : 'Not recorded'}
                    </p>
                  </div>

                  {/* Member Since */}
                  <div className="bg-slate-50 rounded-lg p-3 md:col-span-2 lg:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Member Since</label>
                    <p className="text-slate-900 font-medium text-xs">
                      {formatDisplayDate(patient.created_at)}
                    </p>
                  </div>
                </div>
              )}

              {/* Appointments Tab Content */}
              {activeTab === 'appointments' && (
                <div>
                  {appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-700">Date</th>
                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-700">Time</th>
                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-700">Status</th>
                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-700">Symptoms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.slice(0, 5).map((appointment) => (
                            <tr key={appointment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-2 text-xs text-slate-900 font-medium">
                                {appointment.appointment_date ? formatDisplayDate(appointment.appointment_date) : '-'}
                              </td>
                              <td className="py-2 px-2 text-xs text-slate-900 font-medium">
                                {appointment.appointment_time || '-'}
                              </td>
                              <td className="py-2 px-2">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {appointment.status?.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-xs text-slate-900 max-w-xs truncate">
                                {appointment.symptoms || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {appointments.length > 5 && (
                        <p className="text-xs text-slate-500 mt-2">Showing 5 of {appointments.length} appointments</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">No appointments found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prescriptions Tab Content */}
              {activeTab === 'prescriptions' && (
                <div>
                  {prescriptions.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border-l-4 border-indigo-600 bg-slate-50 rounded p-3 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Prescription Date</p>
                              <p className="text-xs font-semibold text-slate-900">
                                {formatDisplayDate(prescription.created_at)}
                              </p>
                            </div>
                            <Link
                              href={`/doctor/prescriptions/${prescription.id}`}
                              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              <Eye size={12} />
                              View
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                            {prescription.diagnosis && (
                              <div>
                                <p className="text-xs text-slate-600 font-semibold mb-1">DIAGNOSIS</p>
                                <p className="text-slate-900 line-clamp-1">{prescription.diagnosis}</p>
                              </div>
                            )}

                            {prescription.medications && (
                              <div>
                                <p className="text-xs text-slate-600 font-semibold mb-1">MEDICATIONS</p>
                                <p className="text-slate-900 line-clamp-1">{prescription.medications}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">No prescriptions found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </DoctorLayout>
    </>
  );
}
