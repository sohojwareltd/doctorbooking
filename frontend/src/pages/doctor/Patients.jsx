import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, FileText, Hash, Mail, Mars, Phone, Search, User, Users, Venus } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import DocModal from '../../components/doctor/DocModal';
import StatusBadge from '../../components/doctor/StatusBadge';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

function renderHighlighted(value, query) {
  const text = String(value ?? '');
  const needle = query.trim();

  if (!needle) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const start = lowerText.indexOf(lowerNeedle);

  if (start === -1) {
    return text;
  }

  const end = start + needle.length;

  return (
    <>
      {text.slice(0, start)}
      <span className="font-semibold text-slate-900">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}

function GenderIconAvatar({ gender }) {
  const value = String(gender || '').toLowerCase();

  if (value === 'female') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-[0_6px_14px_-8px_rgba(244,63,94,0.9)]" title="Female">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-pink-100 text-pink-600 shadow-sm">
          <Venus className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  if (value === 'male') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_6px_14px_-8px_rgba(59,130,246,0.95)]" title="Male">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-sky-100 text-sky-600 shadow-sm">
          <Mars className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
      <User className="h-4 w-4" />
    </span>
  );
}

export default function Patients({ patients = [] }) {
  const pageRows = useMemo(() => (Array.isArray(patients) ? patients : (patients?.data ?? [])), [patients]);
  const pagination = useMemo(() => (Array.isArray(patients) ? null : patients), [patients]);

  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [prescriptionModal, setPrescriptionModal] = useState(null);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  const resolvePatientAge = (patient) => {
    if (patient?.age !== undefined && patient?.age !== null && patient?.age !== '') {
      return patient.age;
    }

    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      if (!Number.isNaN(birthDate.getTime())) {
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = todayDate.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < birthDate.getDate())) {
          age -= 1;
        }

        if (age >= 0) {
          return age;
        }
      }
    }

    return null;
  };

  const formatGender = (gender) => {
    const value = String(gender || '').trim().toLowerCase();
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getPatientGender = (patient) => patient?.gender || patient?.patient_gender || patient?.user?.gender || 'N/A';

  const formatAgeGender = (patient) => {
    const age = resolvePatientAge(patient);
    const ageLabel = age ? `${age}y` : 'Age N/A';
    return `${ageLabel} • ${formatGender(getPatientGender(patient))}`;
  };

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((p) => {
      if (!needle) {
        return true;
      }

      const haystack = `${p.id || ''} ${p.name || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, searchTerm]);

  const stats = useMemo(() => ({
    visible: filteredRows.length,
  }), [filteredRows.length]);

  const hasStatusColumn = useMemo(() => (
    rows.some((item) => {
      const status = String(item?.status ?? '').trim();
      return status.length > 0;
    })
  ), [rows]);

  const handlePrescriptionClick = (patient) => {
    if (!patient.has_prescription && (patient.prescriptions_count ?? 0) === 0) {
      router.visit(`/doctor/prescriptions/create?patient=${patient.id}`);
      return;
    }

    if ((patient.prescriptions_count ?? 0) <= 1 && patient.prescriptions?.[0]?.id) {
      router.visit(`/doctor/prescriptions/${patient.prescriptions[0].id}`);
      return;
    }

    setPrescriptionModal(patient);
  };

  const handleEmailPatient = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleCallPatient = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <DoctorLayout title="Patients" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#2D3A74]">Patients</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {stats.visible}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="max-w-[420px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, email, phone or id"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Patient</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Phone</th>
                  {hasStatusColumn ? <th className="px-6 py-4 text-left">Status</th> : null}
                  <th className="px-6 py-4 text-left">Joined</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((p, index) => {
                  const serial = p.serial_no || (((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1);

                  return (
                    <tr
                      key={p.id || index}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 text-left">
                          <GenderIconAvatar gender={getPatientGender(p)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(p.name || p.id, searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{formatAgeGender(p)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(p.email || 'N/A', searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(p.phone || 'N/A', searchTerm)}
                        </span>
                      </td>
                      {hasStatusColumn ? (
                        <td className="px-6 py-4">
                          {p.status ? <StatusBadge status={p.status} size="xs" /> : <span className="text-xs font-medium text-slate-400">N/A</span>}
                        </td>
                      ) : null}
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {p.created_at ? (formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View patient"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Patient
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrescriptionClick(p)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-violet-300 bg-violet-100 text-violet-800 transition hover:border-violet-400 hover:bg-violet-200 hover:text-violet-900"
                            aria-label="Prescriptions"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Prescriptions
                            </span>
                          </button>

                          {p.email ? (
                            <button
                              type="button"
                              onClick={() => handleEmailPatient(p.email)}
                              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
                              aria-label="Send email"
                            >
                              <Mail className="h-4 w-4" />
                              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                Send Email
                              </span>
                            </button>
                          ) : null}

                          {p.phone ? (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(p.phone)}
                              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800"
                              aria-label="Call patient"
                            >
                              <Phone className="h-4 w-4" />
                              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                Call Patient
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-5">
              <DocEmptyState
                icon={Users}
                title="No patients found"
                description="Try another contact filter or keyword."
              />
            </div>
          ) : null}

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> row(s) on this page
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const prev = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('previous'));
                  const next = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('next'));

                  return (
                    <>
                      {prev?.url ? (
                        <Link href={prev.url} className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300">Previous</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Previous</span>
                      )}
                      {next?.url ? (
                        <Link href={next.url} className="rounded-lg bg-[#2D3A74] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#243063]">Next</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Next</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <DocModal
        open={!!prescriptionModal}
        onClose={() => setPrescriptionModal(null)}
        title="Select Prescription"
        icon={FileText}
        size="md"
        footer={
          <DocButton variant="secondary" size="sm" onClick={() => setPrescriptionModal(null)}>Close</DocButton>
        }
      >
        {prescriptionModal ? (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              {prescriptionModal.name} has {prescriptionModal.prescriptions_count} prescriptions
            </p>
            <div className="space-y-2">
              {(prescriptionModal.prescriptions || []).map((prescription, index) => (
                <button
                  key={prescription.id}
                  onClick={() => {
                    router.visit(`/doctor/prescriptions/${prescription.id}`);
                    setPrescriptionModal(null);
                  }}
                  className="w-full text-left rounded-xl border border-slate-200 p-4 transition-all hover:border-sky-300 hover:bg-sky-50/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {index + 1}
                        </div>
                        <div className="text-sm font-semibold text-slate-800">
                          {prescription.diagnosis || 'No diagnosis provided'}
                        </div>
                      </div>
                      <div className="ml-10 text-xs text-slate-400">
                        {formatDisplayDateWithYearFromDateLike(prescription.created_at) || prescription.created_at}
                      </div>
                    </div>
                    <FileText className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </DocModal>
    </DoctorLayout>
  );
}
