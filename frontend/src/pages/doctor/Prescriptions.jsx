import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { FileText, PlusCircle, Search, Eye, Download, Share2, Printer } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import Pagination from '../../components/Pagination';
import { formatDisplayFromDateLike, formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';
import { toastSuccess, toastError } from '../../utils/toast';

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
  const todayDate = new Date(todayIso);

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

  const statsCards = useMemo(() => {
    const totalCount = pagination?.total || rows.length;
    const withFollowUp = stats?.withFollowUp ?? 0;
    const withoutFollowUp = stats?.withoutFollowUp ?? 0;
    const upcomingFollowUps = stats?.upcomingFollowUps ?? 0;

    return [
      { label: 'Total Prescriptions', value: totalCount, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
      { label: 'With Follow-up', value: withFollowUp, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { label: 'No Follow-up', value: withoutFollowUp, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      { label: 'Upcoming Visits', value: upcomingFollowUps, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' }
    ];
  }, [pagination, stats]);

  return (
    <DoctorLayout title="Prescriptions">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e2a4a] via-[#1e3a5f] to-[#c2692a] p-6 shadow-lg mb-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
              <FileText className="h-3.5 w-3.5" />
              Prescriptions
            </div>
            <h1 className="text-2xl font-black text-white">Prescriptions</h1>
            <p className="mt-1 text-sm text-white/70">View and create prescriptions for your patients</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-white/70"><span className="font-black text-white">{displayCount}</span> found</span>
            <Link
              href="/doctor/prescriptions/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Create Prescription
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-4xl font-black text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                  <FileText className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="space-y-4 border-b border-gray-200 bg-gradient-to-r from-white to-[#00acb1]/5 px-6 py-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="text-sm font-semibold text-gray-700">
                <span className="text-[#005963]">Today:</span> {todayLabel}
              </div>
              {selectedIds.length > 0 && (
                <div className="text-sm font-semibold text-[#005963]">{selectedIds.length} selected</div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient, diagnosis or medication"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Created date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Follow-up</label>
                <select
                  value="all"
                  disabled
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400"
                >
                  <option value="all">N/A</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 border-b border-gray-100">
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
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Gender</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Number</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRows.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr key={p.id || idx} className={`transition ${isSelected ? 'bg-[#00acb1]/10' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-4">
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
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-600">{p.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">{getPatientName(p)}</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{resolvePatientAge(p) ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 capitalize">{p.patient_gender || p.user?.gender || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{p.patient_contact || p.user?.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/doctor/prescriptions/${p.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005963] hover:text-[#005963]/75 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                          <button
                            onClick={() => {
                              const printWindow = window.open(`/doctor/prescriptions/${p.id}?action=print`, '_blank');
                              if (printWindow) {
                                toastSuccess('Opening prescription for printing...');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                            title="Print"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </button>
                          <Link
                            href={`/doctor/prescriptions/${p.id}?action=share`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (navigator.share) {
                                navigator.share({
                                  title: `Prescription for ${getPatientName(p)}`,
                                  text: `Prescription ID: #${p.id}`,
                                  url: `${window.location.origin}/doctor/prescriptions/${p.id}`,
                                }).catch(() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/doctor/prescriptions/${p.id}`);
                                  toastSuccess('Prescription link copied to clipboard');
                                });
                              } else {
                                navigator.clipboard.writeText(`${window.location.origin}/doctor/prescriptions/${p.id}`);
                                toastSuccess('Prescription link copied to clipboard');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-800 transition"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <p className="font-semibold">No prescriptions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && typeof pagination.total === 'number' ? (
            <div className="border-t border-gray-100 bg-white px-5 py-3.5">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(pagination.per_page * pagination.current_page, pagination.total)}</span> of <span className="font-semibold text-gray-700">{pagination.total}</span> results
              </p>
            </div>
          ) : null}
          <Pagination data={pagination} />
        </div>
      </div>
    </DoctorLayout>
  );
}
