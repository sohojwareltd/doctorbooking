import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Search, FileText, Eye, Calendar, User } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Prescriptions({ prescriptions = [] }) {
  const pageRows = useMemo(() => (Array.isArray(prescriptions) ? prescriptions : (prescriptions?.data ?? [])), [prescriptions]);
  const pagination = useMemo(() => (Array.isArray(prescriptions) ? null : prescriptions), [prescriptions]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setRows(pageRows);
    setSelectedIds([]);
  }, [pageRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const haystack = `${p.user?.name || ''} ${p.user?.email || ''} ${p.doctor?.name || ''} ${p.diagnosis || ''}`.toLowerCase();
      return searchTerm === '' ? true : haystack.includes(searchTerm.toLowerCase());
    });
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    const totalCount = pagination?.total || rows.length;
    
    return [
      { label: 'Total Prescriptions', value: totalCount, color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
      { label: 'This Month', value: rows.filter((p) => {
        const date = new Date(p.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { label: 'This Week', value: rows.filter((p) => {
        const date = new Date(p.created_at);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }).length, color: 'bg-sky-50 text-sky-700 border-sky-200' },
      { label: 'Today', value: rows.filter((p) => {
        const date = new Date(p.created_at);
        const now = new Date();
        return date.toDateString() === now.toDateString();
      }).length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ];
  }, [rows, pagination]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  return (
    <>
      <Head title="Prescriptions" />
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#005963]">Prescriptions</h1>
          <p className="mt-2 text-gray-600">View and manage all prescriptions in the system</p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-[#005963]">{filteredRows.length}</span> prescription{filteredRows.length !== 1 ? 's' : ''} found
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

            <div className="flex-1">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Search prescriptions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient, doctor, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                />
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Doctor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Diagnosis</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Created</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((prescription, idx) => {
                  const isSelected = selectedIds.includes(prescription.id);
                  return (
                    <tr key={prescription.id || idx} className={`transition ${isSelected ? 'bg-[#00acb1]/10' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, prescription.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== prescription.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{(pagination?.current_page - 1) * pagination?.per_page + idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="font-semibold text-[#005963]">{prescription.user?.name || '—'}</div>
                        </div>
                        {prescription.user?.email && (
                          <div className="text-xs text-gray-500 mt-0.5">{prescription.user.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#005963]">{prescription.doctor?.name || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {prescription.diagnosis || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatDisplayDateWithYearFromDateLike(prescription.created_at) || prescription.created_at || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/admin/prescriptions/${prescription.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#005963] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004148]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
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
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">No prescriptions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination data={pagination} />
        </GlassCard>
      </div>
    </>
  );
}

Prescriptions.layout = (page) => <AdminLayout>{page}</AdminLayout>;
