import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Search, CheckCircle2, XCircle, Clock, UserCheck, Stethoscope, TestTube, Calendar, Filter, X, Phone, Mail, MapPin } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorAppointments({ appointments = [], filters = {} }) {
  const pageRows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const [rows, setRows] = useState(pageRows);
  const [statusFilter, setStatusFilter] = useState(filters.status_filter || 'all');
  const [dateFilter, setDateFilter] = useState(filters.date_filter || 'today');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(today) || today;

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'scheduled') return 'border-blue-200 bg-blue-50 text-blue-800';
    if (s === 'arrived') return 'border-amber-200 bg-amber-50 text-amber-800';
    if (s === 'in_consultation') return 'border-purple-200 bg-purple-50 text-purple-800';
    if (s === 'awaiting_tests') return 'border-orange-200 bg-orange-50 text-orange-800';
    if (s === 'prescribed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (s === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800';
    return 'border-gray-200 bg-gray-50 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    const labels = {
      'scheduled': 'Scheduled',
      'arrived': 'Arrived',
      'in_consultation': 'In Consultation',
      'awaiting_tests': 'Awaiting Tests',
      'prescribed': 'Prescribed',
      'cancelled': 'Cancelled',
    };
    return labels[s] || status || 'Unknown';
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'date') {
      setDateFilter(value);
    }
    
    router.get('/doctor/appointments', {
      date_filter: type === 'date' ? value : dateFilter,
      status_filter: type === 'status' ? value : statusFilter,
      search: searchTerm,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const updateStatus = async (id, status) => {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const res = await fetch(`/doctor/appointments/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toastSuccess('Appointment status updated.');
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data?.message || 'Failed to update status.');
    }
  };

  // Filtering is now done on the backend, but we keep this for client-side search
  const filteredRows = rows.filter((a) => {
    const searchOk = searchTerm === '' || (a.user?.name || a.user_id).toLowerCase().includes(searchTerm.toLowerCase());
    return searchOk;
  });

  const filtersActive = statusFilter !== 'all' || dateFilter !== 'all' || searchTerm !== '';
  const displayCount = filtersActive
    ? filteredRows.length
    : (pagination?.total ?? filteredRows.length);

  const statusCounts = useMemo(() => {
    const total = stats.total ?? (pagination?.total ?? rows.length);
    const pending = stats.pending ?? rows.filter(a => a.status === 'pending').length;
    const approved = stats.approved ?? rows.filter(a => a.status === 'approved').length;
    const completed = stats.completed ?? rows.filter(a => a.status === 'completed').length;
    return { total, pending, approved, completed };
  }, [stats, pagination, rows]);

  const lastBookedToday = (() => {
    const todays = rows.filter((a) => a.appointment_date === today);
    if (todays.length === 0) return null;

    const sorted = [...todays].sort((a, b) => {
      const aKey = `${a.appointment_date || ''} ${a.appointment_time || ''}`;
      const bKey = `${b.appointment_date || ''} ${b.appointment_time || ''}`;
      return bKey.localeCompare(aKey);
    });

    return sorted[0] || null;
  })();

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const res = await fetch('/doctor/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toastSuccess('Appointment created successfully.');
      setShowCreateModal(false);
      setFormData({ name: '', phone: '', age: '', gender: '' });
      window.location.reload();
    } else {
      const data = await res.json();
      toastError(data.message || 'Failed to create appointment.');
    }
  };

  return (
    <DoctorLayout title="Appointments">
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Appointments</h1>
            <p className="mt-2 text-gray-600">Manage and track all your patient appointments</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#005963] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00434a] transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Appointment
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-[#005963]">{displayCount}</span> appointment{displayCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {[
            { label: 'Total', value: rows.length, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: CalendarCheck2 },
            { label: 'Scheduled', value: rows.filter(a => a.status === 'scheduled').length, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calendar },
            { label: 'Arrived', value: rows.filter(a => a.status === 'arrived').length, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserCheck },
            { label: 'In Visit', value: rows.filter(a => a.status === 'in_consultation').length, color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Stethoscope },
            { label: 'Awaiting Tests', value: rows.filter(a => a.status === 'awaiting_tests').length, color: 'bg-orange-50 text-orange-700 border-orange-200', icon: TestTube },
            { label: 'Prescribed', value: rows.filter(a => a.status === 'prescribed').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={idx} variant="solid" className={`border-2 p-4 ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold opacity-75">{stat.label}</div>
                    <div className="mt-2 text-2xl font-black">{stat.value}</div>
                  </div>
                  <Icon className="h-6 w-6 opacity-50" />
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Main Table Card */}
        <GlassCard variant="solid" hover={false} className="overflow-hidden border border-[#00acb1]/20">
          {/* Header with Filters and Search */}
          <div className="space-y-4 border-b border-gray-200 bg-gradient-to-r from-white to-[#00acb1]/5 px-6 py-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="text-sm font-semibold text-gray-700">
                  <span className="text-[#005963]">Today:</span> {todayLabel}
                </div>
                {lastBookedToday && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-[#005963]">Last:</span> {lastBookedToday.user?.name || lastBookedToday.user_id} at {formatDisplayTime12h(lastBookedToday.appointment_time) || lastBookedToday.appointment_time}
                  </div>
                )}
              </div>
              {selectedIds.length > 0 && (
                <div className="text-sm font-semibold text-[#005963]">
                  {selectedIds.length} selected
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              {/* Search */}
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-gray-700">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      // Debounce search
                      clearTimeout(window.searchTimeout);
                      window.searchTimeout = setTimeout(() => {
                        router.get('/doctor/appointments', {
                          date_filter: dateFilter,
                          status_filter: statusFilter,
                          search: value,
                        }, {
                          preserveState: true,
                          preserveScroll: true,
                        });
                      }, 500);
                    }}
                    className="w-full rounded-xl border border-[#00acb1]/30 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-[#005963] placeholder-gray-400 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Dates</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="arrived">Arrived</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="awaiting_tests">Awaiting Tests</option>
                  <option value="prescribed">Prescribed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredRows.map(r => r.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((a, idx) => {
                  const canCreatePrescription = !a.has_prescription && ['in_consultation', 'awaiting_tests', 'prescribed'].includes(a.status);
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <tr key={a.id} className={`transition ${isSelected ? 'bg-[#00acb1]/10' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, a.id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== a.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{(pagination?.current_page - 1) * (pagination?.per_page || 15) + idx + 1}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedPatient(a)}
                          className="text-left hover:underline"
                        >
                          <div className="font-semibold text-[#005963] hover:text-[#00acb1] transition">{a.user?.name || a.user_id}</div>
                          {a.user?.phone && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {a.user.phone}
                            </div>
                          )}
                          {a.symptoms && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{a.symptoms}</div>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatDisplayTime12h(a.appointment_time) || a.appointment_time}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="relative inline-block min-w-[160px]">
                          <select
                            className={`appearance-none rounded-lg border-2 px-4 py-2.5 pr-10 text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md active:shadow-sm ${getStatusColor(a.status)}`}
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              appearance: 'none',
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              backgroundSize: '14px',
                              paddingRight: '2.5rem',
                            }}
                            value={a.status}
                            onChange={(e) => updateStatus(a.id, e.target.value)}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="arrived">Arrived</option>
                            <option value="in_consultation">In Consultation</option>
                            <option value="awaiting_tests">Awaiting Tests</option>
                            <option value="prescribed">Prescribed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {a.has_prescription && a.prescription_id ? (
                          <Link
                            href={`/doctor/prescriptions/${a.prescription_id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-[#00acb1]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/10 transition"
                          >
                            Prescription
                          </Link>
                        ) : canCreatePrescription ? (
                          <Link
                            href={`/doctor/prescriptions/create?appointment_id=${a.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-[#00acb1] bg-[#00acb1]/10 px-3 py-1.5 text-xs font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                          >
                            Create Prescription
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <CalendarCheck2 className="mx-auto mb-3 h-8 w-8 opacity-50" />
                        <p className="font-semibold">No appointments found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="text-sm text-gray-600">
                  Page <span className="font-bold text-[#005963]">{pagination.current_page}</span> of <span className="font-bold text-[#005963]">{pagination.last_page}</span> • Total: <span className="font-bold text-[#005963]">{pagination.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                    const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));
                    const btnBase = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition';
                    const btnOn = 'bg-[#005963] text-white hover:bg-[#00787b]';
                    const btnOff = 'bg-gray-200 text-gray-400 cursor-not-allowed';
                    return (
                      <>
                        {prev?.url ? (
                          <Link href={prev.url} className={`${btnBase} ${btnOn}`}>
                            ← Previous
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>← Previous</span>
                        )}
                        {next?.url ? (
                          <Link href={next.url} className={`${btnBase} ${btnOn}`}>
                            Next →
                          </Link>
                        ) : (
                          <span className={`${btnBase} ${btnOff}`}>Next →</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>

      {/* Patient Info Modal */}
      {selectedPatient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0 border-2 border-white/30">
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {(selectedPatient.user?.name || 'P')[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPatient.user?.name || 'Patient'}</h3>
                    <p className="text-sm text-white/90 mt-1">
                      Appointment: {formatDate(selectedPatient.appointment_date)} at {formatTime(selectedPatient.appointment_time)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/20 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {selectedPatient.user?.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.phone}</div>
                        </div>
                        <button
                          onClick={() => handleCall(selectedPatient.user.phone)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      </div>
                    )}
                    {selectedPatient.user?.email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-green-100 p-2">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.email}</div>
                        </div>
                        <button
                          onClick={() => handleEmail(selectedPatient.user.email)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    )}
                    {selectedPatient.user?.address && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase">Address</div>
                          <div className="text-sm font-semibold text-gray-900">{selectedPatient.user.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                {selectedPatient.symptoms && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Symptoms / Notes</h4>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-gray-700">{selectedPatient.symptoms}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Status</h4>
                  <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${getStatusColor(selectedPatient.status)}`}>
                    {getStatusLabel(selectedPatient.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <Link
                href={`/doctor/appointments?id=${selectedPatient.id}`}
                className="rounded-lg bg-[#005963] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00434a] transition"
              >
                View Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
