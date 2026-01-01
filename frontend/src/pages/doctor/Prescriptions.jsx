import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { FileText, PlusCircle, Search } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayFromDateLike, formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function DoctorPrescriptions({ prescriptions = [] }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setRows(pageRows);
    setSelectedIds([]);
  }, [pageRows]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;
  const todayDate = new Date(todayIso);

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const haystack = `${p.user?.name || ''} ${p.user_id || ''} ${p.diagnosis || ''} ${p.medications || ''}`.toLowerCase();
      const matchSearch = searchTerm === '' ? true : haystack.includes(searchTerm.toLowerCase());

      const createdDateOnly = (p.created_at || '').slice(0, 10);
      const dateOk = dateFilter === 'all' ? true : createdDateOnly === todayIso;

      const hasNext = Boolean(p.next_visit_date);
      const followUpOk = followUpFilter === 'all' ? true : followUpFilter === 'has-next' ? hasNext : !hasNext;

      return matchSearch && dateOk && followUpOk;
    });
  }, [rows, searchTerm, dateFilter, followUpFilter, todayIso]);

  const stats = useMemo(() => {
    const withFollowUp = rows.filter((p) => p.next_visit_date).length;
    const withoutFollowUp = rows.filter((p) => !p.next_visit_date).length;
    const upcomingFollowUps = rows.filter((p) => {
      if (!p.next_visit_date) return false;
      const d = new Date(p.next_visit_date);
      return !Number.isNaN(d.getTime()) && d >= todayDate;
    }).length;

    return [
      { label: 'Total Prescriptions', value: rows.length, color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
      { label: 'With Follow-up', value: withFollowUp, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { label: 'No Follow-up', value: withoutFollowUp, color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { label: 'Upcoming Visits', value: upcomingFollowUps, color: 'bg-sky-50 text-sky-700 border-sky-200' }
    ];
  }, [rows, todayDate]);

  return (
    <DoctorLayout title="Prescriptions">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#005963]">Prescriptions</h1>
          <p className="mt-2 text-gray-600">View and create prescriptions for your patients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-[#005963]">{filteredRows.length}</span> result{filteredRows.length !== 1 ? 's' : ''}
          </div>
          <Link
            href="/doctor/prescriptions/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#005963] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#00434a] whitespace-nowrap"
          >
            <PlusCircle className="h-4 w-4" />
            Create Prescription
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <GlassCard key={idx} variant="solid" className={`border-2 p-4 ${stat.color}`}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="rounded-lg bg-white/60 p-2 text-[#005963]">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="solid" hover={false} className="overflow-hidden border border-[#00acb1]/20">
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
                  value={followUpFilter}
                  onChange={(e) => setFollowUpFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All</option>
                  <option value="has-next">Has next visit</option>
                  <option value="missing">Missing next visit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-4 text-left">
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Diagnosis</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Medications</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Next Visit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
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
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#005963]">{p.user?.name || p.user_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDisplayFromDateLike(p.created_at) || p.created_at || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{p.diagnosis || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 whitespace-pre-wrap">{p.medications || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{p.next_visit_date ? (formatDisplayDateWithYearFromDateLike(p.next_visit_date) || p.next_visit_date) : '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/doctor/prescriptions/${p.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-[#00acb1]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <p className="font-semibold">No prescriptions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </DoctorLayout>
  );
}
