import { useEffect, useMemo, useState } from 'react';
import { Search, Users, FileText, Calendar, Eye, Mail, Phone, ChevronDown, UserX, ArrowRight } from 'lucide-react';
import { router } from '@inertiajs/react';
import DoctorLayout from '../../layouts/DoctorLayout';
import Pagination from '../../components/Pagination';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';
import DocTableActionMenu from '../../components/doctor/DocTableActionMenu';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocCard, DocEmptyState } from '../../components/doctor/DocUI';

export default function Patients({ patients = [], stats = {} }) {
  const pageRows = useMemo(() => (Array.isArray(patients) ? patients : (patients?.data ?? [])), [patients]);
  const pagination = useMemo(() => (Array.isArray(patients) ? null : patients), [patients]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [prescriptionModal, setPrescriptionModal] = useState(null);

  useEffect(() => {
    setRows(pageRows);
    setSelectedIds([]);
  }, [pageRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const haystack = `${p.name || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase();
      const matchSearch = searchTerm === '' ? true : haystack.includes(searchTerm.toLowerCase());
      const hasPhone = Boolean(p.phone);
      const hasEmail = Boolean(p.email);
      const contactOk = contactFilter === 'all'
        ? true
        : contactFilter === 'phone'
          ? hasPhone
          : contactFilter === 'email'
            ? hasEmail
            : !hasPhone;
      return matchSearch && contactOk;
    });
  }, [rows, searchTerm, contactFilter]);

  const filtersActive = contactFilter !== 'all' || searchTerm !== '';
  const displayCount = filtersActive
    ? filteredRows.length
    : (pagination?.total ?? filteredRows.length);
  const activeStatsRows = useMemo(() => (filtersActive ? filteredRows : rows), [filtersActive, filteredRows, rows]);

  const handlePrescriptionClick = (patient) => {
    if (!patient.has_prescription) {
      router.visit(`/doctor/prescriptions/create?patient=${patient.id}`);
      return;
    }
    if (patient.prescriptions_count === 1) {
      router.visit(`/doctor/prescriptions/${patient.prescriptions[0].id}`);
    } else {
      setPrescriptionModal(patient);
    }
  };

  const handleEmailPatient = (email) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  const handleCallPatient = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  const patientHeaderMetrics = [
    {
      label: 'Patients',
      value: displayCount,
      icon: Users,
      tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f8fbff]',
      hoverTone: 'doc-banner-metric-sky',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Has Phone',
      value: stats?.hasPhone ?? 0,
      icon: Phone,
      tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#fff1e2]',
      hoverTone: 'doc-banner-metric-amber',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Email Only',
      value: stats?.emailOnly ?? 0,
      icon: Mail,
      tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#f3f7ff]',
      hoverTone: 'doc-banner-metric-violet',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'No Contact',
      value: stats?.noContact ?? 0,
      icon: UserX,
      tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#fff0e2]',
      hoverTone: 'doc-banner-metric-orange',
      iconTone: 'bg-white/20 border-white/30',
    },
  ];

  return (
    <DoctorLayout title="Patients">
      <div className="mx-auto max-w-6xl space-y-6">
        <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#283766] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -top-20 left-[-50px] h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-[-26px] h-52 w-52 rounded-full bg-[#efba92]/15" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <Users className="h-3.5 w-3.5" />
                  Patient Registry
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">{todayLabel}</p>
                <h2 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">Patient Directory</h2>
                <p className="max-w-xl text-[13px] text-white/80">Dynamic patient list with contact intelligence, search visibility, and quick prescription access.</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Contact Filter</div>
                    <div className="mt-0.5 text-xs font-bold text-white">{contactFilter === 'all' ? 'All Contacts' : contactFilter === 'phone' ? 'Phone Only' : contactFilter === 'email' ? 'Email Only' : 'Missing Phone'}</div>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Selected</div>
                    <div className="mt-0.5 text-xs font-bold text-white">{selectedIds.length}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {patientHeaderMetrics.map((item) => (
                  <div key={item.label} className={`doc-banner-metric doc-banner-hover-card ${item.hoverTone} group rounded-xl border px-3.5 py-2.5 min-h-[96px] ${item.tone}`}>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${item.iconTone}`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="doc-banner-hover-icon h-3.5 w-3.5" />
                    </div>
                    <div className="mt-1.5 text-[1.8rem] font-black leading-none tracking-tight">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocCard>

        {/* Table Card */}
        <DocCard padding={false}>
          <div className="space-y-4 border-b border-slate-100 px-5 py-5 md:px-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-col gap-2 md:ml-auto md:flex-row md:items-center md:justify-end">
                {selectedIds.length > 0 && (
                  <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-600">{selectedIds.length} selected</span>
                )}
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="text-sm font-medium text-slate-500">
                    Today: <span className="font-semibold text-slate-800">{todayLabel}</span>
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {displayCount} patients
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,320px)_180px] xl:items-end">
              <div className="xl:w-[320px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search patient</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition doc-input-focus"
                  />
                </div>
              </div>
              <div className="sm:max-w-[190px] xl:w-[180px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Contact filter</label>
                <div className="relative">
                  <select
                    value={contactFilter}
                    onChange={(e) => setContactFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#d4e1f7] bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_100%)] px-3.5 py-2.5 pr-9 text-sm font-semibold text-[#2f4a79] shadow-[0_2px_10px_rgba(148,163,184,0.12)] transition doc-input-focus"
                  >
                    <option value="all">All</option>
                    <option value="phone">Has phone</option>
                    <option value="email">Has email</option>
                    <option value="missing">Missing phone</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f86b7]" />
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
            <table className="w-full min-w-[980px] divide-y divide-[#e7edf8]">
              <thead className="bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredRows.map((p) => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Joined</th>
                  <th className="w-[176px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredRows.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const actionItems = [
                    {
                      key: 'view',
                      label: 'View patient',
                      icon: Eye,
                      tone: 'accent',
                      onSelect: () => router.visit(`/doctor/patients/${p.id}`),
                    },
                    {
                      key: 'prescription',
                      label: p.has_prescription || (p.prescriptions_count ?? 0) > 0 ? 'Open prescriptions' : 'Create prescription',
                      icon: FileText,
                      tone: 'violet',
                      onSelect: () => handlePrescriptionClick(p),
                    },
                    p.email ? {
                      key: 'email',
                      label: 'Send email',
                      icon: Mail,
                      tone: 'amber',
                      onSelect: () => handleEmailPatient(p.email),
                    } : null,
                    p.phone ? {
                      key: 'call',
                      label: 'Call patient',
                      icon: Phone,
                      tone: 'emerald',
                      onSelect: () => handleCallPatient(p.phone),
                    } : null,
                  ];

                  return (
                    <tr key={p.id || idx} className={`border-l-2 transition-all duration-200 ${isSelected ? 'border-[#c6d9f7] bg-[#f0f6ff]' : 'border-transparent even:bg-[#fbfdff] hover:border-[#d6e4fb] hover:bg-[#f8fbff]'}`}>
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, p.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-500">
                        <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl border border-[#e4ebf7] bg-white px-2.5 text-sm font-semibold text-[#5f7398] shadow-[0_8px_18px_-18px_rgba(37,53,102,0.6)]">
                          {p.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <PatientAvatar name={p.name || String(p.id)} size="sm" />
                          <span className="font-semibold text-slate-800">{p.name || p.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{p.email || '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700 whitespace-nowrap">{p.phone || '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700 whitespace-nowrap">{p.created_at ? (formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at) : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <DocTableActionMenu items={actionItems} />
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-2">
                      <DocEmptyState icon={Users} title="No patients found" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && typeof pagination.total === 'number' ? (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(pagination.per_page * pagination.current_page, pagination.total)}</span> of <span className="font-semibold text-slate-700">{pagination.total}</span> results
              </p>
            </div>
          ) : null}
          <Pagination data={pagination} />
        </DocCard>
      </div>

      {/* Prescription Selection Modal */}
      <DocModal
        open={!!prescriptionModal}
        onClose={() => setPrescriptionModal(null)}
        title="Select Prescription"
        icon={FileText}
        size="md"
        footer={
          <DocButton variant="secondary" size="sm" onClick={() => setPrescriptionModal(null)}>Cancel</DocButton>
        }
      >
        {prescriptionModal && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              {prescriptionModal.name} has {prescriptionModal.prescriptions_count} prescriptions
            </p>
            <div className="space-y-2">
              {prescriptionModal.prescriptions.map((prescription, index) => (
                <button
                  key={prescription.id}
                  onClick={() => {
                    router.visit(`/doctor/prescriptions/${prescription.id}`);
                    setPrescriptionModal(null);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors text-sm">
                          {prescription.diagnosis || 'No diagnosis provided'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 ml-10">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDisplayDateWithYearFromDateLike(prescription.created_at)}</span>
                      </div>
                    </div>
                    <FileText className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DocModal>
    </DoctorLayout>
  );
}
