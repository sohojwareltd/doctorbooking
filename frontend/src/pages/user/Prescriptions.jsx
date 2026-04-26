import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, FilePlus, FileText, Hash, Mars, Phone, Printer, Search, Share2, Stethoscope, User, Venus } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
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

export default function UserPrescriptions({ prescriptions = [], stats = {} }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);

  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

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

  const getNextVisitLabel = (prescription) => (
    prescription?.follow_up_date
      ? formatDisplayDateWithYearFromDateLike(prescription.follow_up_date)
      : 'No follow-up'
  );

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
      if (genderFilter !== 'all' && genderValue !== genderFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = `${p.id || ''} ${getPatientName(p)} ${getPatientPhone(p) || ''} ${p.diagnosis || ''} ${p.instructions || ''} ${p.symptoms || ''} ${p.patient_gender || p.user?.gender || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, searchTerm, dateFilter, todayIso, genderFilter]);

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

  const topWidgets = [
    {
      key: 'today',
      label: 'Today Prescriptions',
      value: statsView.today,
      helper: `${statsView.visible} visible after filters`,
      icon: Calendar,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'followup',
      label: 'With Follow-up',
      value: statsView.withFollowUp,
      helper: 'Prescriptions with revisit date',
      icon: FileText,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      key: 'upcoming',
      label: 'Upcoming Visits',
      value: statsView.upcoming,
      helper: 'Follow-up dates from today',
      icon: Stethoscope,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'nofollowup',
      label: 'No Follow-up',
      value: statsView.withoutFollowUp,
      helper: 'Need manual revisit plan',
      icon: FilePlus,
      tone: 'bg-orange-50 text-orange-700',
    },
  ];

  const handlePrintPrescription = (prescription) => {
    const routeParam = prescription?.uuid || prescription?.id;
    const printWindow = window.open(`/patient/prescriptions/${routeParam}?action=print`, '_blank');

    if (printWindow) {
      toastSuccess('Opening prescription for printing...');
      return;
    }

    toastError('Unable to open the print view right now.');
  };

  const handleSharePrescription = async (prescription) => {
    const routeParam = prescription?.uuid || prescription?.id;
    const shareUrl = `${window.location.origin}/patient/prescriptions/${routeParam}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Prescription #${prescription.id}`,
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
    <UserLayout title="My Prescriptions">
      <div className="mx-auto max-w-[1400px]">
        <section className="mb-4 space-y-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#2D3A74]">My Prescriptions</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {statsView.visible}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Track your prescriptions, revisit dates, and quickly open, print, or share records.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topWidgets.map((widget) => {
              const Icon = widget.icon;

              return (
                <div key={widget.key} className="surface-card rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-sm text-slate-500">{widget.label}</p>
                      <p className="text-3xl font-semibold text-[#2D3A74]">{widget.value}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${widget.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">{widget.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,360px)_180px_180px] lg:items-end">
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

                  <div className="sm:max-w-[190px] lg:w-[180px]">
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

                  <div className="sm:max-w-[190px] lg:w-[180px]">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="hidden lg:block" />
              </div>
            </div>
          </div>

          <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
            {filteredRows.length === 0 ? (
              <div className="p-5">
                <DocEmptyState icon={FileText} title="No prescriptions found" description="Try another filter or search keyword." />
              </div>
            ) : filteredRows.map((p, index) => {
              const serial = p.serial_no || (((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1);

              return (
                <div
                  key={p.id || index}
                  className="cursor-pointer space-y-2 p-4 active:bg-slate-50"
                  onClick={() => router.visit(`/patient/prescriptions/${p.uuid || p.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <GenderIconAvatar gender={getPatientGender(p)} />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{renderHighlighted(getPatientName(p), searchTerm)}</div>
                        <div className="text-xs text-slate-500">
                          {formatAgeLabel(p)}
                          {getPatientPhone(p) ? ` · ${getPatientPhone(p)}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-400">
                      <div>{formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at}</div>
                      <div className="mt-0.5">#{serial}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-2">{p.diagnosis || p.instructions || 'N/A'}</div>
                  <div className="text-xs text-slate-400">Follow-up: {getNextVisitLabel(p)}</div>

                  <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => router.visit(`/patient/prescriptions/${p.uuid || p.id}`)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                      aria-label="View prescription"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintPrescription(p)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      aria-label="Print"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharePrescription(p)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      aria-label="Share"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-6 py-4 text-center">Patient</th>
                  <th className="px-6 py-4 text-center">Diagnosis</th>
                  <th className="px-6 py-4 text-center">Prescribed at</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((p, index) => {
                  const serial = p.serial_no || (((pagination?.current_page || 1) - 1) * (pagination?.per_page || 15) + index + 1);

                  return (
                    <tr
                      key={p.id || index}
                      className="cursor-pointer hover:bg-slate-50/80"
                      onClick={() => router.visit(`/patient/prescriptions/${p.uuid || p.id}`)}
                    >
                      <td className="px-6 py-4 text-center font-medium text-slate-600">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-2.5 text-start">
                          <GenderIconAvatar gender={getPatientGender(p)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(p), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{renderHighlighted(getPatientPhone(p) || 'N/A', searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{formatAgeLabel(p)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        <div className="mx-auto max-w-[220px] truncate" title={p.diagnosis || p.instructions || 'N/A'}>
                          {renderHighlighted(p.diagnosis || p.instructions || 'N/A', searchTerm)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-[13px] font-medium text-slate-700">
                        <div className="inline-flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.visit(`/patient/prescriptions/${p.uuid || p.id}`)}
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

                          <button
                            type="button"
                            onClick={() => handleSharePrescription(p)}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800"
                            aria-label="Share prescription"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Share
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
            <div className="hidden p-5 md:block">
              <DocEmptyState
                icon={FileText}
                title="No prescriptions found"
                description="Try another filter or search keyword."
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
                        <Link href={prev.url} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">Previous</Link>
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
    </UserLayout>
  );
}

UserPrescriptions.layout = (page) => page;
