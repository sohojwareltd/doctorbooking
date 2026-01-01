import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Patients({ patients = [] }) {
  const pageRows = useMemo(() => (Array.isArray(patients) ? patients : (patients?.data ?? [])), [patients]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

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

  const stats = useMemo(() => ([
    { label: 'Total Patients', value: rows.length, color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
    { label: 'Has Phone', value: rows.filter((p) => p.phone).length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Email Only', value: rows.filter((p) => p.email && !p.phone).length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'No Contact', value: rows.filter((p) => !p.email && !p.phone).length, color: 'bg-rose-50 text-rose-700 border-rose-200' }
  ]), [rows]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  return (
    <DoctorLayout title="Patients">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#005963]">Patients</h1>
          <p className="mt-2 text-gray-600">List of patients who booked appointments with you</p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-[#005963]">{filteredRows.length}</span> patient{filteredRows.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <GlassCard key={idx} variant="solid" className={`border-2 p-4 ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</div>
                  <div className="mt-2 text-2xl font-black">{stat.value}</div>
                </div>
                <div className="rounded-lg bg-white/60 p-2 text-[#005963]">
                  <Users className="h-4 w-4" />
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
                <label className="mb-2 block text-xs font-semibold text-gray-700">Search patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Contact filter</label>
                <select
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All</option>
                  <option value="phone">Has phone</option>
                  <option value="email">Has email</option>
                  <option value="missing">Missing phone</option>
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Contact</th>
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
                        <div className="font-semibold text-[#005963]">{p.name || p.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.email || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{p.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{p.created_at ? (formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at) : '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {p.email ? (
                            <a
                              href={`mailto:${p.email}`}
                              className="inline-flex items-center justify-center rounded-lg border border-[#00acb1]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 transition"
                            >
                              Email
                            </a>
                          ) : null}
                          {p.phone ? (
                            <a
                              href={`tel:${p.phone}`}
                              className="inline-flex items-center justify-center rounded-lg border border-[#00acb1]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 transition"
                            >
                              Call
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <p className="font-semibold">No patients found</p>
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
