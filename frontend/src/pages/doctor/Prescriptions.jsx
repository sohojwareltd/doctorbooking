import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, ClipboardList, Eye, FileText, Hash, Mars, Phone, Printer, Search, SlidersHorizontal, Stethoscope, User, Venus } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

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

function getPrescriptionSummaryTone(key) {
  const tones = {
    today: 'border-[#CBD5E1] bg-slate-50 text-slate-700',
    withFollowUp: 'border-violet-200 bg-violet-50 text-violet-700',
    upcoming: 'border-sky-200 bg-sky-50 text-sky-700',
    withoutFollowUp: 'border-orange-200 bg-orange-50 text-orange-700',
  };

  return tones[key] || tones.today;
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

export default function DoctorPrescriptions({ prescriptions = [], stats = {} }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);

  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

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

    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = todayDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  };

  const getPatientName = (prescription) => (
    prescription?.patient_name || prescription?.user?.name || `Patient #${prescription?.user_id || ''}`
  );

  const getPatientPhone = (prescription) => prescription?.patient_contact || prescription?.user?.phone || null;
  const getPatientGender = (prescription) => prescription?.patient_gender || prescription?.user?.gender || 'N/A';
  const formatGender = (gender) => {
    const value = String(gender || '').trim().toLowerCase();
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatAgeLabel = (prescription) => {
    const age = resolvePatientAge(prescription);
    return age ? `${age}y` : 'Age N/A';
  };

  const todayIso = new Date().toISOString().split('T')[0];

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((p) => {
      const createdDateOnly = (p.created_at || '').slice(0, 10);
      const dateOk = dateFilter === 'all' || createdDateOnly === todayIso;

      if (!dateOk) {
        return false;
      }

      const genderValue = String(getPatientGender(p) || '').trim().toLowerCase();
      const genderOk = genderFilter === 'all' || genderValue === genderFilter;
      if (!genderOk) {
        return false;
      }

      if (followUpFilter === 'with' && !p.follow_up_date) {
        return false;
      }

      if (followUpFilter === 'without' && p.follow_up_date) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = `${p.id || ''} ${getPatientName(p)} ${getPatientPhone(p) || ''} ${p.diagnosis || ''} ${p.instructions || ''} ${p.symptoms || ''} ${p.patient_gender || p.user?.gender || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, searchTerm, dateFilter, todayIso, genderFilter, followUpFilter]);

  const statsView = useMemo(() => ({
    visible: filteredRows.length,
    today: rows.filter((item) => (item.created_at || '').slice(0, 10) === todayIso).length,
    withFollowUp: stats?.withFollowUp ?? rows.filter((item) => Boolean(item.follow_up_date)).length,
    upcoming: stats?.upcomingFollowUps ?? rows.filter((item) => {
      if (!item.follow_up_date) return false;
      return item.follow_up_date >= todayIso;
    }).length,
    withoutFollowUp: stats?.withoutFollowUp ?? rows.filter((item) => !item.follow_up_date).length,
  }), [filteredRows.length, rows, stats, todayIso]);

  const handlePrintPrescription = (prescription) => {
    const printWindow = window.open(`/doctor/prescriptions/${prescription.id}?action=print`, '_blank');

    if (printWindow) {
      toastSuccess('Opening prescription for printing...');
      return;
    }

    toastError('Unable to open the print view right now.');
  };

  return (
    <DoctorLayout title="Prescriptions" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#2D3A74]">Prescriptions</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {statsView.visible}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('today')}`}>
                  Today: <span className="font-semibold">{statsView.today}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('withFollowUp')}`}>
                  With Follow-up: <span className="font-semibold">{statsView.withFollowUp}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('upcoming')}`}>
                  Upcoming Visits: <span className="font-semibold">{statsView.upcoming}</span>
                </div>
                <div className={`rounded-xl border px-2.5 py-1.5 ${getPrescriptionSummaryTone('withoutFollowUp')}`}>
                  No Follow-up: <span className="font-semibold">{statsView.withoutFollowUp}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,360px)_180px] xl:items-end">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Patient, phone, diagnosis or id"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      />
                    </div>
                  </div>

                  <div className="sm:max-w-[190px] xl:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Created date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowFilters((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showFilters ? 'Hide Filters' : 'Filters'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setGenderFilter(option.value)}
                            className={`min-w-20 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                              genderFilter === option.value
                                ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Follow-up</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'with', label: 'With Follow-up' },
                          { value: 'without', label: 'No Follow-up' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFollowUpFilter(option.value)}
                            className={`inline-flex h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${
                              followUpFilter === option.value
                                ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="inline-flex h-10 items-center rounded-xl bg-[#2D3A74] px-4 text-sm font-semibold text-white transition hover:bg-[#243063]"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-4 py-3.5 text-left">#</th>
                  <th className="px-4 py-3.5 text-left">Patient</th>
                  <th className="px-4 py-3.5 text-left">Symptoms</th>
                  <th className="px-4 py-3.5 text-left">Diagnosis / Advice</th>
                  <th className="px-4 py-3.5 text-left">Created</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((p, index) => {
                  const serial = p.serial_no || (((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1);

                  return (
                    <tr
                      key={p.id || index}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => router.visit(`/doctor/prescriptions/${p.id}`)}
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 text-left">
                          <GenderIconAvatar gender={getPatientGender(p)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(p), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">Prescription #{p.id}</div>
                            <div className="text-xs font-medium text-slate-500">{formatAgeLabel(p)}</div>
                            <div className="mt-1 text-xs font-medium text-slate-500 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {renderHighlighted(getPatientPhone(p) || 'N/A', searchTerm)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <div className="max-w-[180px] truncate inline-flex items-center gap-1.5" title={p.symptoms || 'N/A'}>
                          <ClipboardList className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          {renderHighlighted(p.symptoms || 'N/A', searchTerm)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <div className="max-w-[200px] truncate inline-flex items-center gap-1.5" title={p.diagnosis || p.instructions || 'N/A'}>
                          <Stethoscope className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          {renderHighlighted(p.diagnosis || p.instructions || 'N/A', searchTerm)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.visit(`/doctor/prescriptions/${p.id}`)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View prescription"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Prescription
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintPrescription(p)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800"
                            aria-label="Print prescription"
                          >
                            <Printer className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Print
                            </span>
                          </button>
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
                icon={FileText}
                title="No prescriptions found"
                description="Try another date filter or keyword."
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
    </DoctorLayout>
  );
}
