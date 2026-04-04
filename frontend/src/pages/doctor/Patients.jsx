import { useEffect, useMemo, useState } from 'react';
import { Search, Users, FileText, FilePlus, X, Calendar, Eye } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

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

  const statsCards = useMemo(() => {
    const totalCount = pagination?.total || rows.length;
    const hasPhone = stats?.hasPhone ?? 0;
    const emailOnly = stats?.emailOnly ?? 0;
    const noContact = stats?.noContact ?? 0;
    
    return [
      { label: 'Total Patients', value: totalCount, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
      { label: 'Has Phone', value: hasPhone, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
      { label: 'Email Only', value: emailOnly, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
      { label: 'No Contact', value: noContact, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' }
    ];
  }, [pagination, stats]);

  const handlePrescriptionClick = (patient) => {
    if (!patient.has_prescription) {
      // No prescription - go to create page
      router.visit(`/doctor/prescriptions/create?patient=${patient.id}`);
      return;
    }

    if (patient.prescriptions_count === 1) {
      // Only one prescription - go directly to show page
      router.visit(`/doctor/prescriptions/${patient.prescriptions[0].id}`);
    } else {
      // Multiple prescriptions - show modal
      setPrescriptionModal(patient);
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(todayIso) || todayIso;

  return (
    <DoctorLayout title="Patients">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="rounded-xl bg-white border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-700">{stat.value}</p>
                </div>
                <div className={`rounded-2xl p-3.5 ${stat.iconBg}`}>
                  <Users className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="space-y-4 border-b border-gray-100 px-7 py-5">
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Joined</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
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
                        <div className="font-semibold text-gray-900">{p.name || p.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.email || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{p.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{p.created_at ? (formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at) : '—'}</td>
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/doctor/patients/${p.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                          {p.email ? (
                            <a
                              href={`mailto:${p.email}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#005963] transition"
                            >
                              Email
                            </a>
                          ) : null}
                          {p.phone ? (
                            <a
                              href={`tel:${p.phone}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#005963] transition"
                            >
                              Call
                            </a>
                          ) : null}
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

      {/* Prescription Selection Modal */}
      {prescriptionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setPrescriptionModal(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Select Prescription</h3>
                  <p className="text-sm text-white/80 mt-1">
                    {prescriptionModal.name} has {prescriptionModal.prescriptions_count} prescriptions
                  </p>
                </div>
                <button
                  onClick={() => setPrescriptionModal(null)}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/20 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-3">
                {prescriptionModal.prescriptions.map((prescription, index) => (
                  <button
                    key={prescription.id}
                    onClick={() => {
                      router.visit(`/doctor/prescriptions/${prescription.id}`);
                      setPrescriptionModal(null);
                    }}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-[#00acb1] hover:bg-[#00acb1]/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#005963]/10 text-[#005963] font-bold text-sm group-hover:bg-[#005963] group-hover:text-white transition-colors">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-[#005963] transition-colors">
                              {prescription.diagnosis || 'No diagnosis provided'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDisplayDateWithYearFromDateLike(prescription.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-gray-400 group-hover:text-[#00acb1] transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setPrescriptionModal(null)}
                className="w-full rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
