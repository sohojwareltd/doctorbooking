import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  CalendarCheck2, CalendarRange, Clock, FileText, LayoutGrid,
  ListFilter, Mail, MapPin, MoreHorizontal, Phone, Plus, Rows3, Search, User, X,
} from 'lucide-react';
import DoctorAppointmentsOverview from '../../components/DoctorAppointmentsOverview';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';
import StatusBadge, { getStatusConfig } from '../../components/doctor/StatusBadge';
import PatientAvatar from '../../components/doctor/PatientAvatar';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocInput, DocSelect, DocCard, DocEmptyState } from '../../components/doctor/DocUI';

export default function DoctorAppointments({ appointments = [], filters = {} }) {
  const pageRows = useMemo(() => (Array.isArray(appointments) ? appointments : (appointments?.data ?? [])), [appointments]);
  const pagination = useMemo(() => (Array.isArray(appointments) ? null : appointments), [appointments]);

  const [rows, setRows] = useState(pageRows);
  const [statusFilter, setStatusFilter] = useState(filters.status_filter || 'all');
  const [dateFilter, setDateFilter] = useState(filters.date_filter || 'today');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', age: '', gender: '' });
  const [openRowMenuId, setOpenRowMenuId] = useState(null);
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'appointment_date', direction: 'asc' });
  const [activeTab, setActiveTab] = useState(() => (
    filters.search
      || (pagination?.current_page ?? 1) > 1
      ? 'list'
      : 'overview'
  ));

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenRowMenuId(null);
      setOpenFilterMenu(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(today) || today;

  /* ─── Status row theme for table ─── */
  const getRowTheme = (status) => {
    const s = (status || '').toLowerCase();
    const themes = {
      arrived:         { row: 'bg-amber-50/60',   border: 'border-amber-100' },
      in_consultation: { row: 'bg-violet-50/60',   border: 'border-violet-100' },
      awaiting_tests:  { row: 'bg-orange-50/60',   border: 'border-orange-100' },
      prescribed:      { row: 'bg-emerald-50/60',  border: 'border-emerald-100' },
      cancelled:       { row: 'bg-red-50/40',      border: 'border-red-100' },
    };
    return themes[s] || { row: 'bg-slate-50/40', border: 'border-slate-100' };
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
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email) => {
    if (email) window.location.href = `mailto:${email}`;
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
    return formatDisplayTime12h(timeStr) || timeStr;
  };

  const getPatientName = (appointment) => {
    return appointment?.patient_name || appointment?.user?.name || String(appointment?.user_id || 'Patient');
  };

  const getPatientPhone = (appointment) => {
    return appointment?.patient_phone || appointment?.user?.phone || null;
  };

  const getPatientEmail = (appointment) => {
    return appointment?.patient_email || appointment?.user?.email || null;
  };

  const updateStatus = async (id, status) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    const res = await fetch(`/doctor/appointments/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toastSuccess('Appointment status updated.');
    } else {
      const data = await res.json().catch(() => ({}));
      toastError(data?.message || 'Failed to update status.');
    }
  };

  const handleQuickStatus = async (appointment, status) => {
    await updateStatus(appointment.id, status);
    setOpenRowMenuId(null);
  };

  const filteredRows = rows.filter((a) => {
    const searchOk = searchTerm === '' || getPatientName(a).toLowerCase().includes(searchTerm.toLowerCase());
    return searchOk;
  });

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    const { key, direction } = sortConfig;
    const mul = direction === 'asc' ? 1 : -1;

    sorted.sort((left, right) => {
      if (key === 'patient') {
        return getPatientName(left).localeCompare(getPatientName(right)) * mul;
      }
      if (key === 'appointment_time') {
        return String(left?.appointment_time || '').localeCompare(String(right?.appointment_time || '')) * mul;
      }
      if (key === 'status') {
        return String(left?.status || '').localeCompare(String(right?.status || '')) * mul;
      }
      if (key === 'appointment_date') {
        return String(left?.appointment_date || '').localeCompare(String(right?.appointment_date || '')) * mul;
      }
      return 0;
    });

    return sorted;
  }, [filteredRows, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filtersActive = statusFilter !== 'all' || dateFilter !== 'all' || searchTerm !== '';
  const displayCount = filtersActive
    ? filteredRows.length
    : (pagination?.total ?? filteredRows.length);
  const previewCount = Math.min(filteredRows.length, 5);

  const tabItems = [
    { key: 'overview', label: 'Overview', description: 'Timeline, calendar and status summary', countLabel: `${previewCount} preview`, icon: LayoutGrid },
    { key: 'list', label: 'Appointments List', description: 'Filters, table, status updates and prescriptions', countLabel: `${displayCount} loaded`, icon: Rows3 },
  ];

  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Dates' },
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'in_consultation', label: 'In Consultation' },
    { value: 'awaiting_tests', label: 'Awaiting Tests' },
    { value: 'prescribed', label: 'Prescribed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const dateFilterLabel = dateFilterOptions.find((item) => item.value === dateFilter)?.label || 'Date Range';
  const statusFilterLabel = statusFilterOptions.find((item) => item.value === statusFilter)?.label || 'All Status';

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
    if (!formData.name || !formData.phone || !formData.age || !formData.gender) {
      toastError('Please fill all fields.');
      return;
    }
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    const res = await fetch('/doctor/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
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

  /* ─── Status select theme for inline dropdown ─── */
  const getSelectTheme = (status) => {
    const s = (status || '').toLowerCase();
    const cfg = getStatusConfig(s);
    return `${cfg.border} ${cfg.bg} ${cfg.text}`;
  };

  const compactHeaderMetrics = [
    { label: 'Loaded', value: displayCount },
    { label: 'Preview', value: previewCount },
    { label: 'Selected', value: selectedIds.length },
    { label: 'Date', value: todayLabel },
  ];

  return (
    <DoctorLayout title="Appointments">
      <div className="mx-auto max-w-6xl space-y-6">

        <DocCard padding={false} className="relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -top-20 left-[-50px] h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-[-26px] h-52 w-52 rounded-full bg-[#efba92]/15" />

          <div className="relative grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_320px] md:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">Appointments Hub</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Appointments Workspace</h2>
              <p className="mt-1 text-sm text-white/80">Overview and list views stay dynamic with live filters and status updates.</p>
              <div className="mt-3">
                <DocButton onClick={() => setShowCreateModal(true)} className="!bg-[#c57945] !px-3.5 !py-2 !text-white hover:!bg-[#ad6639]">
                  <Plus className="h-4 w-4" />
                  New Appointment
                </DocButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 self-end">
              {compactHeaderMetrics.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/20 bg-black/10 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">{item.label}</div>
                  <div className="mt-1 text-sm font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </DocCard>

        {/* ─── Page header with tab switcher ─── */}
        <DocCard padding={false}>
          <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">View System</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Appointments Workspace</h2>
              <p className="mt-1 text-sm text-slate-500">Switch between the compact overview and the detailed management list.</p>
            </div>
            <DocButton onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              New Appointment
            </DocButton>
          </div>

          <div className="grid gap-2 border-t border-slate-100 bg-slate-50/60 p-2.5 md:grid-cols-2" role="tablist" aria-label="Appointments view tabs">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`appointments-tab-${tab.key}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`appointments-panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${isActive ? 'border-sky-200/80 bg-gradient-to-br from-white to-sky-50 shadow-[0_10px_24px_rgba(14,165,233,0.12)]' : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white/80'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${isActive ? 'bg-sky-100/70 text-sky-700 ring-sky-200' : 'bg-slate-100 text-slate-400 ring-slate-200'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{tab.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                          {tab.countLabel}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{tab.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DocCard>

        {/* ─── Overview tab ─── */}
        {activeTab === 'overview' ? (
          <div id="appointments-panel-overview" role="tabpanel" aria-labelledby="appointments-tab-overview">
            <DoctorAppointmentsOverview
              title="Appointments"
              appointments={filteredRows}
              todayLabel={todayLabel}
              currentDate={today}
              dateFilter={dateFilter}
              onDateFilterChange={(value) => handleFilterChange('date', value)}
              statusFilter={statusFilter}
              onStatusFilterChange={(value) => handleFilterChange('status', value)}
              onAppointmentClick={setSelectedPatient}
              onCreateAppointment={() => setShowCreateModal(true)}
              createButtonLabel="New Appointment"
              maxItems={5}
            />
          </div>
        ) : null}

        {/* ─── List tab ─── */}
        {activeTab === 'list' ? (
          <div id="appointments-panel-list" role="tabpanel" aria-labelledby="appointments-tab-list">
            <DocCard padding={false}>
              {/* Filters header */}
              <div className="space-y-3 border-b border-slate-100 bg-slate-50/40 px-5 py-4 md:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Detailed Appointments</h3>
                    <p className="mt-0.5 text-sm text-slate-500">Search, filter and update the live appointment list.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                      <span className="font-semibold text-slate-800">{displayCount}</span> loaded
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                      Today: <span className="font-semibold text-slate-800">{todayLabel}</span>
                    </span>
                    {lastBookedToday && (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                        Last: <span className="font-semibold text-slate-800">{getPatientName(lastBookedToday)}</span> at {formatDisplayTime12h(lastBookedToday.appointment_time) || lastBookedToday.appointment_time}
                      </span>
                    )}
                    {selectedIds.length > 0 && (
                      <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-600">
                        {selectedIds.length} selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr_1fr] xl:items-end">
                  {/* Search */}
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Search Patient</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
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
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition doc-input-focus"
                      />
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Date Range</label>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenFilterMenu((prev) => (prev === 'date' ? null : 'date'))}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-3 text-sm text-slate-900 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition hover:border-sky-200"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <CalendarRange className="h-4 w-4 text-slate-400" />
                          {dateFilterLabel}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFilterMenu === 'date' ? 'rotate-180' : ''}`} />
                      </button>

                      {openFilterMenu === 'date' && (
                        <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                          {dateFilterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                handleFilterChange('date', option.value);
                                setOpenFilterMenu(null);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${dateFilter === option.value ? 'bg-sky-50 font-semibold text-sky-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenFilterMenu((prev) => (prev === 'status' ? null : 'status'))}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-3 text-sm text-slate-900 shadow-[0_1px_0_rgba(148,163,184,0.08)] transition hover:border-sky-200"
                      >
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <ListFilter className="h-4 w-4 text-slate-400" />
                          {statusFilterLabel}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFilterMenu === 'status' ? 'rotate-180' : ''}`} />
                      </button>

                      {openFilterMenu === 'status' && (
                        <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                          {statusFilterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                handleFilterChange('status', option.value);
                                setOpenFilterMenu(null);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${statusFilter === option.value ? 'bg-sky-50 font-semibold text-sky-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart List */}
              <div className="px-4 pb-4 md:px-5 md:pb-5">
                <div className="overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                  <div className="hidden lg:grid grid-cols-[44px_56px_minmax(240px,1.5fr)_180px_170px_180px_240px] items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(sortedRows.map(r => r.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        checked={selectedIds.length === sortedRows.length && sortedRows.length > 0}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                      />
                    </span>
                    <span>#</span>
                    <button type="button" onClick={() => handleSort('patient')} className="justify-self-start inline-flex items-center gap-1 hover:text-slate-600">Patient {sortConfig.key === 'patient' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
                    <button type="button" onClick={() => handleSort('appointment_date')} className="justify-self-start inline-flex items-center gap-1 hover:text-slate-600">Date {sortConfig.key === 'appointment_date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
                    <button type="button" onClick={() => handleSort('appointment_time')} className="justify-self-start inline-flex items-center gap-1 hover:text-slate-600">Time {sortConfig.key === 'appointment_time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
                    <button type="button" onClick={() => handleSort('status')} className="justify-self-start inline-flex items-center gap-1 hover:text-slate-600">Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
                    <span>Actions</span>
                  </div>

                  <div className="space-y-2 p-3">
                    {sortedRows.map((a, idx) => {
                      const canCreatePrescription = !a.has_prescription && ['in_consultation', 'awaiting_tests', 'prescribed'].includes(a.status);
                      const isSelected = selectedIds.includes(a.id);
                      const theme = getRowTheme(a.status);
                      const displaySerial = a.serial_no || ((pagination?.current_page - 1) * (pagination?.per_page || 15) + idx + 1);
                      const openMenuUpward = idx >= Math.max(0, sortedRows.length - 2);

                      return (
                        <div
                          key={a.id}
                          className={`group rounded-xl border px-3 py-3 transition hover:shadow-[0_10px_20px_rgba(148,163,184,0.14)] ${theme.row} ${theme.border}`}
                        >
                          <div className="grid gap-3 lg:grid-cols-[44px_56px_minmax(240px,1.5fr)_180px_170px_180px_240px] lg:items-center">
                            <div>
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
                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                              />
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-white text-xs font-semibold text-slate-600 shadow-sm">
                              {displaySerial}
                            </div>

                            <button onClick={() => setSelectedPatient(a)} className="flex items-center gap-2.5 text-left">
                              <PatientAvatar name={getPatientName(a)} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-sky-600">{getPatientName(a)}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  {getPatientPhone(a) ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {getPatientPhone(a)}
                                    </span>
                                  ) : null}
                                  {a.symptoms ? <span className="truncate max-w-[200px]">{a.symptoms}</span> : null}
                                </div>
                              </div>
                            </button>

                            <div>
                              <div className="text-sm font-medium text-slate-800 whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</div>
                              <div className="mt-0.5 text-xs text-slate-400">{a.appointment_date === today ? 'Today' : 'Appointment day'}</div>
                            </div>

                            <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 shadow-sm whitespace-nowrap w-fit">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {formatDisplayTime12h(a.appointment_time) || a.appointment_time}
                            </div>

                            <div className="relative inline-block min-w-[150px]">
                              <select
                                className={`w-full cursor-pointer appearance-none rounded-lg border px-3 py-2 pr-8 text-xs font-semibold shadow-sm transition hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-100 ${getSelectTheme(a.status)}`}
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundSize: '14px',
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

                            <div className="flex items-center gap-2 lg:justify-start">
                              {a.has_prescription && a.prescription_id ? (
                                <Link
                                  href={`/doctor/prescriptions/${a.prescription_id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  View Rx
                                </Link>
                              ) : canCreatePrescription ? (
                                <Link
                                  href={`/doctor/prescriptions/create?appointment_id=${a.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 transition hover:bg-sky-100"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Create Rx
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-300">No action</span>
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenRowMenuId((prev) => (prev === a.id ? null : a.id));
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:text-sky-600"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {openRowMenuId === a.id && (
                                  <div
                                    className={`absolute right-0 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${openMenuUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPatient(a);
                                        setOpenRowMenuId(null);
                                      }}
                                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      View details
                                    </button>
                                    {getPatientPhone(a) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleCall(getPatientPhone(a));
                                          setOpenRowMenuId(null);
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                      >
                                        Call patient
                                      </button>
                                    )}
                                    {getPatientEmail(a) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleEmail(getPatientEmail(a));
                                          setOpenRowMenuId(null);
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                      >
                                        Email patient
                                      </button>
                                    )}
                                    <div className="my-1 border-t border-slate-100" />
                                    {a.status !== 'scheduled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStatus(a, 'scheduled')}
                                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                      >
                                        Mark as Scheduled
                                      </button>
                                    )}
                                    {a.status !== 'in_consultation' && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStatus(a, 'in_consultation')}
                                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-violet-700 transition hover:bg-violet-50"
                                      >
                                        Start Consultation
                                      </button>
                                    )}
                                    {a.status !== 'cancelled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStatus(a, 'cancelled')}
                                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                                      >
                                        Cancel Appointment
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {sortedRows.length === 0 && (
                      <div className="py-2">
                        <DocEmptyState
                          icon={CalendarCheck2}
                          title="No appointments found"
                          description="Try changing the filter range or search keyword."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination?.data && typeof pagination.current_page === 'number' ? (
                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 md:flex-row md:items-center">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{pagination.from ?? 0}</span> to <span className="font-semibold text-slate-700">{pagination.to ?? 0}</span> of <span className="font-semibold text-slate-700">{pagination.total}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                      const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));
                      return (
                        <>
                          {prev?.url ? (
                            <Link href={prev.url} className="inline-flex items-center rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700">
                              ← Previous
                            </Link>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-300">← Previous</span>
                          )}
                          {next?.url ? (
                            <Link href={next.url} className="inline-flex items-center rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700">
                              Next →
                            </Link>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-300">Next →</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </DocCard>
          </div>
        ) : null}
      </div>

      {/* ─── Patient Info Modal ─── */}
      <DocModal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Patient Snapshot"
        icon={User}
        size="md"
        footer={
          selectedPatient ? (
            <>
              <DocButton variant="secondary" size="sm" onClick={() => setSelectedPatient(null)}>Close</DocButton>
              <Link
                href={`/doctor/appointments?id=${selectedPatient?.id}`}
                className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                View Appointment
              </Link>
            </>
          ) : null
        }
      >
        {selectedPatient && (
          <div className="space-y-5">
            {/* Patient header */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-5">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl font-bold text-white">{getPatientName(selectedPatient)[0].toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{getPatientName(selectedPatient)}</h3>
                <p className="text-sm text-slate-300">
                  {formatDate(selectedPatient.appointment_date)} at {formatTime(selectedPatient.appointment_time)}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contact Information</h4>
              <div className="space-y-2.5">
                {getPatientPhone(selectedPatient) && (
                  <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <Phone className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400">Phone</div>
                      <div className="text-sm font-semibold text-slate-800">{getPatientPhone(selectedPatient)}</div>
                    </div>
                    <DocButton size="xs" onClick={() => handleCall(getPatientPhone(selectedPatient))}>
                      <Phone className="h-3.5 w-3.5" /> Call
                    </DocButton>
                  </div>
                )}
                {getPatientEmail(selectedPatient) && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400">Email</div>
                      <div className="text-sm font-semibold text-slate-800">{getPatientEmail(selectedPatient)}</div>
                    </div>
                    <DocButton size="xs" variant="success" onClick={() => handleEmail(getPatientEmail(selectedPatient))}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </DocButton>
                  </div>
                )}
                {selectedPatient.user?.address && (
                  <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <MapPin className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400">Address</div>
                      <div className="text-sm font-semibold text-slate-800">{selectedPatient.user.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Symptoms */}
            {selectedPatient.symptoms && (
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Symptoms / Notes</h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">{selectedPatient.symptoms}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</h4>
              <StatusBadge status={selectedPatient.status} />
            </div>
          </div>
        )}
      </DocModal>

      {/* ─── Create Appointment Modal ─── */}
      <DocModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Appointment"
        icon={CalendarCheck2}
        size="sm"
        footer={
          <>
            <DocButton variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</DocButton>
            <DocButton size="sm" onClick={handleCreateAppointment}>Create Appointment</DocButton>
          </>
        }
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4" id="create-appointment-form">
          <DocInput
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Patient name"
            required
          />
          <DocInput
            label="Phone"
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+8801..."
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <DocInput
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
              placeholder="25"
              required
            />
            <DocSelect
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
              required
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </DocSelect>
          </div>
        </form>
      </DocModal>
    </DoctorLayout>
  );
}
