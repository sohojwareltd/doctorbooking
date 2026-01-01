import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Users({ users = [] }) {
  const pageRows = useMemo(() => (Array.isArray(users) ? users : (users?.data ?? [])), [users]);
  const [rows, setRows] = useState(pageRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setRows(pageRows);
    setSelectedIds([]);
  }, [pageRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((u) => {
      const haystack = `${u.name || ''} ${u.email || ''}`.toLowerCase();
      const matchSearch = searchTerm === '' ? true : haystack.includes(searchTerm.toLowerCase());
      const roleOk = roleFilter === 'all' ? true : u.role === roleFilter;
      return matchSearch && roleOk;
    });
  }, [rows, searchTerm, roleFilter]);

  const stats = useMemo(() => ([
    { label: 'Total Users', value: rows.length, color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
    { label: 'Patients', value: rows.filter((u) => u.role === 'user').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Doctors', value: rows.filter((u) => u.role === 'doctor').length, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { label: 'Admins', value: rows.filter((u) => u.role === 'admin').length, color: 'bg-amber-50 text-amber-700 border-amber-200' }
  ]), [rows]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  return (
    <>
      <Head title="Users" />
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#005963]">Users</h1>
          <p className="mt-2 text-gray-600">Manage registered accounts and roles.</p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-[#005963]">{filteredRows.length}</span> user{filteredRows.length !== 1 ? 's' : ''} found
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
                  <UsersIcon className="h-4 w-4" />
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
                <label className="mb-2 block text-xs font-semibold text-gray-700">Search users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Filter by role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All roles</option>
                  <option value="user">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
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
                          setSelectedIds(filteredRows.map((u) => u.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((u, idx) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr key={u.id || idx} className={`transition ${isSelected ? 'bg-[#00acb1]/10' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, u.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== u.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#005963]">{u.name || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.email || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          u.role === 'doctor' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {u.role === 'user' ? 'Patient' : u.role || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(u.created_at) || u.created_at || '—'}</td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <p className="font-semibold">No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

Users.layout = (page) => <AdminLayout>{page}</AdminLayout>;
