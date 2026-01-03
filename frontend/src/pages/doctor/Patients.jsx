import { useEffect, useMemo, useState } from 'react';
import { Search, Users, FileText, FilePlus, X, Calendar } from 'lucide-react';
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

  const statsCards = useMemo(() => {
    const totalCount = pagination?.total || rows.length;
    const hasPhone = stats?.hasPhone ?? 0;
    const emailOnly = stats?.emailOnly ?? 0;
    const noContact = stats?.noContact ?? 0;
    
    return [
      { label: 'Total Patients', value: totalCount, color: 'bg-[#00acb1]/10 text-[#005963] border-[#00acb1]/30' },
      { label: 'Has Phone', value: hasPhone, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { label: 'Email Only', value: emailOnly, color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { label: 'No Contact', value: noContact, color: 'bg-rose-50 text-rose-700 border-rose-200' }
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
          {statsCards.map((stat, idx) => (
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
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
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{(pagination?.current_page - 1) * pagination?.per_page + idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#005963]">{p.name || p.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.email || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{p.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{p.created_at ? (formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at) : '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          ) : null}
                          
                          {/* Prescription Button - Show View if exists, Create if not */}
                          {p.has_prescription ? (
                            <button
                              onClick={() => handlePrescriptionClick(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Prescription
                              {p.prescriptions_count > 1 && (
                                <span className="ml-0.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {p.prescriptions_count}
                                </span>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrescriptionClick(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#005963]/40 bg-[#005963]/5 px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#005963]/10 transition"
                            >
                              <FilePlus className="h-3.5 w-3.5" />
                              Create Prescription
                            </button>
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

          <Pagination data={pagination} />
        </GlassCard>
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
