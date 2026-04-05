import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { FileText, Search, Eye, Share2, Printer, CalendarDays, CalendarCheck, Users, Phone } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import Pagination from '../../components/Pagination';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';
import StatCard from '../../components/doctor/StatCard';
import DocTableActionMenu from '../../components/doctor/DocTableActionMenu';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import { DocCard, DocEmptyState } from '../../components/doctor/DocUI';

export default function DoctorPrescriptions({ prescriptions = [], stats = {} }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const resolvePatientAge = (p) => {
    if (p?.patient_age !== undefined && p?.patient_age !== null && p?.patient_age !== '') {
      return p.patient_age;
    }
    if (p?.user?.age !== undefined && p?.user?.age !== null && p?.user?.age !== '') {
      return p.user.age;
    }
    const dob = p?.user?.date_of_birth;
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  };

  const getPatientName = (prescription) => {
    return prescription?.patient_name || prescription?.user?.name || String(prescription?.user_id || 'Patient');
  };

  useEffect(() => {
    setRows(pageRows);
    setSelectedIds([]);
  }, [pageRows]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const patientAge = resolvePatientAge(p);
      const haystack = `${getPatientName(p)} ${p.patient_contact || p.user?.phone || ''} ${p.patient_gender || p.user?.gender || ''} ${patientAge ?? ''} ${p.user_id || ''}`.toLowerCase();
      const matchSearch = searchTerm === '' ? true : haystack.includes(searchTerm.toLowerCase());
      const createdDateOnly = (p.created_at || '').slice(0, 10);
      const dateOk = dateFilter === 'all' ? true : createdDateOnly === todayIso;
      return matchSearch && dateOk;
    });
  }, [rows, searchTerm, dateFilter, todayIso]);

  const filtersActive = dateFilter !== 'all' || searchTerm !== '';
  const displayCount = filtersActive ? filteredRows.length : (pagination?.total ?? filteredRows.length);
  const activeStatsRows = useMemo(() => (filtersActive ? filteredRows : rows), [filtersActive, filteredRows, rows]);

  const statsCards = useMemo(() => {
    const viewLabel = filtersActive ? 'filtered view' : 'current list';
    const createdToday = activeStatsRows.filter((prescription) => (prescription.created_at || '').slice(0, 10) === todayIso).length;
    const seniorPatients = activeStatsRows.filter((prescription) => {
      const age = resolvePatientAge(prescription);
      return typeof age === 'number' && age >= 50;
    }).length;
    const missingContact = activeStatsRows.filter((prescription) => !(prescription.patient_contact || prescription.user?.phone)).length;

    return [
      { label: 'Created Today', value: createdToday, variant: 'sky', icon: CalendarCheck, subtitle: viewLabel },
      { label: 'Age 50+', value: seniorPatients, variant: 'violet', icon: Users, subtitle: viewLabel },
      { label: 'Missing Contact', value: missingContact, variant: 'rose', icon: Phone, subtitle: viewLabel },
      { label: 'Selected', value: selectedIds.length, variant: 'cyan', icon: Eye, subtitle: 'table selection' },
    ];
  }, [activeStatsRows, filtersActive, selectedIds.length, todayIso]);

  const prescriptionHeaderMetrics = [
    { label: 'Prescriptions', value: displayCount },
    { label: 'With Follow-up', value: stats?.withFollowUp ?? 0 },
    { label: 'Upcoming Visits', value: stats?.upcomingFollowUps ?? 0 },
    { label: 'No Follow-up', value: stats?.withoutFollowUp ?? 0 },
  ];

  const handlePrintPrescription = (prescription) => {
    const printWindow = window.open(`/doctor/prescriptions/${prescription.id}?action=print`, '_blank');
    if (printWindow) {
      toastSuccess('Opening prescription for printing...');
      return;
    }
    toastError('Unable to open the print view right now.');
  };

  const handleSharePrescription = async (prescription) => {
    const shareUrl = `${window.location.origin}/doctor/prescriptions/${prescription.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Prescription for ${getPatientName(prescription)}`,
          text: `Prescription ID: #${prescription.id}`,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toastSuccess('Prescription link copied to clipboard');
        return;
      }

      throw new Error('Clipboard unavailable');
    } catch {
      toastError('Unable to share prescription right now.');
    }
  };

  return (
    <DoctorLayout title="Prescriptions">
      <div className="mx-auto max-w-6xl space-y-6">
        <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#283766] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -top-20 left-[-50px] h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-[-26px] h-52 w-52 rounded-full bg-[#efba92]/15" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <FileText className="h-3.5 w-3.5" />
                  Prescription Desk
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">{todayLabel}</p>
                <h2 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">Prescription Workspace</h2>
                <p className="max-w-xl text-[13px] text-white/80">Dynamic prescription records with date filters, follow-up tracking, and instant record actions.</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Date Filter</div>
                    <div className="mt-0.5 text-xs font-bold text-white">{dateFilter === 'all' ? 'All Dates' : dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}</div>
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Follow Up</div>
                    <div className="mt-0.5 text-xs font-bold text-white">{followUpFilter === 'all' ? 'All Status' : followUpFilter === 'yes' ? 'With Follow Up' : 'No Follow Up'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {prescriptionHeaderMetrics.map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">{item.label}</div>
                    <div className="mt-1 text-sm font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocCard>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, idx) => (
            <StatCard key={idx} label={stat.label} value={stat.value} icon={stat.icon} variant={stat.variant} />
          ))}
        </div>

        {/* Table Card */}
        <DocCard padding={false}>
          <div className="space-y-4 border-b border-slate-100 px-5 py-5 md:px-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">
                  Today: <span className="font-semibold text-slate-800">{todayLabel}</span>
                </span>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {displayCount} prescriptions
                </span>
              </div>
              {selectedIds.length > 0 && (
                <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-600">{selectedIds.length} selected</span>
              )}
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,320px)_170px_160px] xl:items-end">
              <div className="xl:w-[320px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient, diagnosis or medication"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition doc-input-focus"
                  />
                </div>
              </div>
              <div className="sm:max-w-[180px] xl:w-[170px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Created date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition doc-input-focus"
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                </select>
              </div>
              <div className="sm:max-w-[170px] xl:w-[160px]">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Follow-up</label>
                <select
                  value="all"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-400"
                >
                  <option value="all">N/A</option>
                </select>
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Number</th>
                  <th className="w-[176px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#89a0c4]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredRows.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const actionItems = [
                    {
                      key: 'view',
                      label: 'View prescription',
                      icon: Eye,
                      tone: 'accent',
                      onSelect: () => router.visit(`/doctor/prescriptions/${p.id}`),
                    },
                    {
                      key: 'print',
                      label: 'Print',
                      icon: Printer,
                      tone: 'amber',
                      onSelect: () => handlePrintPrescription(p),
                    },
                    {
                      key: 'share',
                      label: 'Share',
                      icon: Share2,
                      tone: 'emerald',
                      onSelect: () => handleSharePrescription(p),
                    },
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
                          <PatientAvatar name={getPatientName(p)} size="sm" />
                          <span className="font-semibold text-slate-800">{getPatientName(p)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">{resolvePatientAge(p) ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 capitalize">{p.patient_gender || p.user?.gender || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{p.patient_contact || p.user?.phone || '—'}</td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <DocTableActionMenu items={actionItems} />
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-2">
                      <DocEmptyState icon={FileText} title="No prescriptions found" />
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
    </DoctorLayout>
  );
}
