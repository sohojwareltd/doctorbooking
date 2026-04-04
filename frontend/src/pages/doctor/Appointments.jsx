import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CalendarRange, Clock, FileText, LayoutGrid, ListFilter, Mail, MapPin, Phone, Rows3, Search, X } from 'lucide-react';
import DoctorAppointmentsOverview from '../../components/DoctorAppointmentsOverview';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', age: '', gender: '' });
  const [activeTab, setActiveTab] = useState(() => (
    filters.search
      || (pagination?.current_page ?? 1) > 1
      ? 'list'
      : 'overview'
  ));

  useEffect(() => {
    setRows(pageRows);
  }, [pageRows]);

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = formatDisplayDateWithYearFromDateLike(today) || today;

  const getStatusTheme = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'arrived') {
      return {
        rowClassName: 'bg-[#fff7ea]',
        rowBorderClassName: 'border-[#ffe6b6]',
        selectClassName: 'border-[#ffe3b9] bg-white text-[#d58a20] focus:ring-[#fff2d6]',
        badgeClassName: 'border-[#ffe6b6] bg-white text-[#d58a20]',
        avatarClassName: 'bg-amber-100 text-amber-700',
      };
    }

    if (s === 'in_consultation') {
      return {
        rowClassName: 'bg-[#eff5ff]',
        rowBorderClassName: 'border-[#dbe7ff]',
        selectClassName: 'border-[#d7e3ff] bg-white text-[#4d73e7] focus:ring-[#e8efff]',
        badgeClassName: 'border-[#dbe7ff] bg-white text-[#4d73e7]',
        avatarClassName: 'bg-blue-100 text-blue-700',
      };
    }

    if (s === 'awaiting_tests') {
      return {
        rowClassName: 'bg-[#f6f1ff]',
        rowBorderClassName: 'border-[#eadcff]',
        selectClassName: 'border-[#e6dcff] bg-white text-[#8a6af0] focus:ring-[#f0e8ff]',
        badgeClassName: 'border-[#eadcff] bg-white text-[#8a6af0]',
        avatarClassName: 'bg-violet-100 text-violet-700',
      };
    }

    if (s === 'prescribed') {
      return {
        rowClassName: 'bg-[#eefbf5]',
        rowBorderClassName: 'border-[#d3efe3]',
        selectClassName: 'border-[#cdeedd] bg-white text-[#16936b] focus:ring-[#e1f7ed]',
        badgeClassName: 'border-[#d3efe3] bg-white text-[#16936b]',
        avatarClassName: 'bg-emerald-100 text-emerald-700',
      };
    }

    if (s === 'cancelled') {
      return {
        rowClassName: 'bg-[#fff4f1]',
        rowBorderClassName: 'border-[#ffd9d2]',
        selectClassName: 'border-[#ffd7d1] bg-white text-[#de6656] focus:ring-[#ffe5e1]',
        badgeClassName: 'border-[#ffd9d2] bg-white text-[#de6656]',
        avatarClassName: 'bg-rose-100 text-rose-700',
      };
    }

    return {
      rowClassName: 'bg-[#fbfcff]',
      rowBorderClassName: 'border-[#e8edf6]',
      selectClassName: 'border-[#dfe7f5] bg-white text-[#60718c] focus:ring-[#edf2fb]',
      badgeClassName: 'border-[#e8edf6] bg-white text-[#60718c]',
      avatarClassName: 'bg-slate-100 text-slate-600',
    };
  };

  const getStatusColor = (status) => getStatusTheme(status).badgeClassName;

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

  const getPatientInitials = (appointment) => {
    const patientName = getPatientName(appointment);

    return patientName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0])
      .join('')
      .toUpperCase() || 'PT';
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

  // Filtering is now done on the backend, but we keep this for client-side search
  const filteredRows = rows.filter((a) => {
    const searchOk = searchTerm === '' || getPatientName(a).toLowerCase().includes(searchTerm.toLowerCase());
    return searchOk;
  });

  const filtersActive = statusFilter !== 'all' || dateFilter !== 'all' || searchTerm !== '';
  const displayCount = filtersActive
    ? filteredRows.length
    : (pagination?.total ?? filteredRows.length);
  const previewCount = Math.min(filteredRows.length, 5);

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      description: 'Timeline, calendar and status summary',
      countLabel: `${previewCount} preview`,
      icon: LayoutGrid,
    },
    {
      key: 'list',
      label: 'Appointments List',
      description: 'Filters, table, status updates and prescriptions',
      countLabel: `${displayCount} loaded`,
      icon: Rows3,
    },
  ];

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

  return (
    <DoctorLayout title="Appointments">
      <div className="mx-auto max-w-[1480px] space-y-8">
        <div className="overflow-hidden rounded-[28px] border border-[#ebeff8] bg-[linear-gradient(135deg,#fdfefe_0%,#f6f9ff_50%,#eef4ff_100%)] shadow-[0_18px_46px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98a4b8]">View System</p>
              <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#1d2940]">Appointments Workspace</h2>
              <p className="mt-1 text-sm text-[#8f9db4]">Switch between the compact overview and the detailed management list.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#3567e6] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(75,120,255,0.28)] transition hover:bg-[#2859d5]"
            >
              <span className="text-base leading-none">+</span>
              New Appointment
            </button>
          </div>

          <div className="grid gap-2 border-t border-[#e7edf8] bg-white/65 p-2 md:grid-cols-2" role="tablist" aria-label="Appointments view tabs">
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
                  className={`rounded-[18px] border px-4 py-4 text-left transition ${isActive ? 'border-[#dbe7ff] bg-white shadow-sm' : 'border-transparent bg-transparent hover:border-[#e6ebf4] hover:bg-white/70'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] ${isActive ? 'bg-[#eff5ff] text-[#3567e6]' : 'bg-white text-[#8f9db4]'}`}>
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className={`text-sm font-semibold ${isActive ? 'text-[#1d2940]' : 'text-[#42506a]'}`}>{tab.label}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-[#eff5ff] text-[#3567e6]' : 'bg-[#f5f7fc] text-[#8f9db4]'}`}>
                          {tab.countLabel}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-[#8f9db4]">{tab.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
              maxItems={5}
            />
          </div>
        ) : null}

        {activeTab === 'list' ? (
          <div id="appointments-panel-list" role="tabpanel" aria-labelledby="appointments-tab-list">
            {/* Main Table Card */}
            <div className="overflow-hidden rounded-[28px] border border-[#ebeff8] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
          {/* Header with Filters and Search */}
          <div className="space-y-4 border-b border-[#eef2fb] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1d2940] md:text-[20px]">Detailed Appointments</h3>
                <p className="mt-1 text-sm text-[#8f9db4]">Search, filter and update the live appointment list.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2 text-sm font-semibold text-[#42506a]">
                  <span className="text-[#1d2940]">{displayCount}</span> loaded
                </div>
                <div className="rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2 text-sm font-semibold text-[#42506a]">
                  Today: <span className="text-[#1e3a5f]">{todayLabel}</span>
                </div>
                {lastBookedToday && (
                  <div className="rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2 text-sm font-semibold text-[#42506a]">
                    Last: <span className="text-[#1e3a5f]">{getPatientName(lastBookedToday)}</span> at {formatDisplayTime12h(lastBookedToday.appointment_time) || lastBookedToday.appointment_time}
                  </div>
                )}
                {selectedIds.length > 0 && (
                  <div className="rounded-[14px] border border-[#dbe7ff] bg-[#eff5ff] px-3.5 py-2 text-sm font-semibold text-[#4d73e7]">
                    {selectedIds.length} selected
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr_1fr] xl:items-end">
              {/* Search */}
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f9db4]" />
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
                    className="w-full rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] py-3 pl-11 pr-4 text-sm font-semibold text-[#42506a] placeholder:text-[#a0abc1] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Date Range</label>
                <div className="relative">
                  <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f9db4]" />
                  <select
                    value={dateFilter}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="w-full appearance-none rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] py-3 pl-11 pr-4 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Dates</option>
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Status</label>
                <div className="relative">
                  <ListFilter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f9db4]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full appearance-none rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] py-3 pl-11 pr-4 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
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
          </div>

          {/* Table */}
          <div className="overflow-x-auto px-4 pb-4 md:px-5 md:pb-5">
            <table className="min-w-[1120px] w-full border-separate [border-spacing:0_10px]">
              <thead>
                <tr>
                  <th className="w-12 px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">
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
                      className="rounded border-gray-300 text-[#3567e6] focus:ring-[#dbe7ff]"
                    />
                  </th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">#</th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Patient</th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Date</th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Time</th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Status</th>
                  <th className="px-4 pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((a, idx) => {
                  const canCreatePrescription = !a.has_prescription && ['in_consultation', 'awaiting_tests', 'prescribed'].includes(a.status);
                  const isSelected = selectedIds.includes(a.id);
                  const statusTheme = getStatusTheme(a.status);
                  const rowCellClassName = `${statusTheme.rowClassName} ${statusTheme.rowBorderClassName} border-y`;
                  const displaySerial = a.serial_no || ((pagination?.current_page - 1) * (pagination?.per_page || 15) + idx + 1);

                  return (
                    <tr key={a.id} className="group">
                      <td className={`${rowCellClassName} rounded-l-[20px] border-l px-4 py-3.5 align-middle`}>
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
                          className="rounded border-gray-300 text-[#3567e6] focus:ring-[#dbe7ff]"
                        />
                      </td>
                      <td className={`${rowCellClassName} px-4 py-3.5 align-middle`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#42506a] shadow-sm">
                          {displaySerial}
                        </div>
                      </td>
                      <td className={`${rowCellClassName} px-4 py-3.5 align-middle`}>
                        <button
                          onClick={() => setSelectedPatient(a)}
                          className="flex items-center gap-3.5 text-left"
                        >
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${statusTheme.avatarClassName}`}>
                            {getPatientInitials(a)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[#1d2940] transition group-hover:text-[#3567e6]">{getPatientName(a)}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#8f9db4]">
                              {getPatientPhone(a) ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {getPatientPhone(a)}
                                </span>
                              ) : null}
                              {a.symptoms ? (
                                <span className="truncate max-w-[240px]">{a.symptoms}</span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className={`${rowCellClassName} px-4 py-3.5 align-middle`}>
                        <div className="text-sm font-semibold text-[#253149] whitespace-nowrap">{formatDisplayDateWithYearFromDateLike(a.appointment_date) || a.appointment_date}</div>
                        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a0abc1]">
                          {a.appointment_date === today ? 'Today' : 'Appointment day'}
                        </div>
                      </td>
                      <td className={`${rowCellClassName} px-4 py-3.5 align-middle`}>
                        <div className="inline-flex items-center gap-2 rounded-[14px] border border-white bg-white/80 px-3.5 py-2 text-sm font-semibold text-[#42506a] shadow-sm whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 text-[#8f9db4]" />
                          {formatDisplayTime12h(a.appointment_time) || a.appointment_time}
                        </div>
                      </td>
                      <td className={`${rowCellClassName} px-4 py-3.5 align-middle`}>
                        <div className="relative inline-block min-w-[160px]">
                          <select
                            className={`appearance-none rounded-[14px] border px-4 py-2.5 pr-10 text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 ${statusTheme.selectClassName}`}
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
                      <td className={`${rowCellClassName} rounded-r-[20px] border-r px-4 py-3.5 align-middle`}>
                        {a.has_prescription && a.prescription_id ? (
                          <Link
                            href={`/doctor/prescriptions/${a.prescription_id}`}
                            className="inline-flex items-center gap-2 rounded-[12px] border border-[#dfe7f5] bg-white px-3.5 py-2 text-xs font-semibold text-[#42506a] transition hover:border-[#dbe7ff] hover:text-[#3567e6]"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Rx
                          </Link>
                        ) : canCreatePrescription ? (
                          <Link
                            href={`/doctor/prescriptions/create?appointment_id=${a.id}`}
                            className="inline-flex items-center gap-2 rounded-[12px] border border-[#dbe7ff] bg-white px-3.5 py-2 text-xs font-semibold text-[#3567e6] transition hover:border-[#cfe1ff] hover:bg-[#eef4ff]"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Create Rx
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-[#a0abc1]">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="rounded-[20px] border border-dashed border-[#e4eaf6] bg-[#fafcff] px-6 py-12 text-center">
                      <div className="text-[#9aa6bc]">
                        <CalendarCheck2 className="mx-auto mb-3 h-8 w-8 opacity-60" />
                        <p className="text-sm font-semibold text-[#52627c]">No appointments found</p>
                        <p className="mt-1 text-xs">Try changing the filter range or search keyword.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="flex flex-col justify-between gap-3 border-t border-[#eef2fb] bg-white px-6 py-4 md:flex-row md:items-center">
              <p className="text-xs text-[#8f9db4]">
                Showing <span className="font-semibold text-[#42506a]">{pagination.from ?? 0}</span> to <span className="font-semibold text-[#42506a]">{pagination.to ?? 0}</span> of <span className="font-semibold text-[#42506a]">{pagination.total}</span> results
              </p>

              <div className="flex items-center gap-2">
                {(() => {
                  const prev = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('previous'));
                  const next = (pagination.links || []).find((l) => String(l.label).toLowerCase().includes('next'));
                  const btnBase = 'inline-flex items-center justify-center rounded-[14px] px-4 py-2 text-sm font-semibold transition';
                  const btnOn = 'bg-[#3567e6] text-white hover:bg-[#2859d5]';
                  const btnOff = 'bg-[#f5f7fc] text-[#c2cada]';

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
          ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Patient Info Modal */}
      {selectedPatient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 backdrop-blur-[2px] p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div 
            className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[linear-gradient(135deg,#202e4b_0%,#36548f_55%,#4b78ff_100%)] px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-[22px] border border-white/30 bg-white/15 backdrop-blur-sm flex-shrink-0">
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {getPatientName(selectedPatient)[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">Patient Snapshot</p>
                    <h3 className="mt-1 text-xl font-bold text-white">{getPatientName(selectedPatient)}</h3>
                    <p className="mt-1 text-sm text-white/90">
                      Appointment: {formatDate(selectedPatient.appointment_date)} at {formatTime(selectedPatient.appointment_time)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-xl p-2 text-white/80 transition hover:bg-white/10"
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
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#98a4b8]">Contact Information</h4>
                  <div className="space-y-3">
                    {getPatientPhone(selectedPatient) && (
                      <div className="flex items-center gap-3 rounded-[20px] border border-[#dbe7ff] bg-[#eff5ff] p-4">
                        <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f9db4]">Phone</div>
                          <div className="mt-1 text-sm font-semibold text-[#1d2940]">{getPatientPhone(selectedPatient)}</div>
                        </div>
                        <button
                          onClick={() => handleCall(getPatientPhone(selectedPatient))}
                          className="flex items-center gap-2 rounded-[14px] bg-[#3567e6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2859d5]"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      </div>
                    )}
                    {getPatientEmail(selectedPatient) && (
                      <div className="flex items-center gap-3 rounded-[20px] border border-[#d3efe3] bg-[#eefbf5] p-4">
                        <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f9db4]">Email</div>
                          <div className="mt-1 text-sm font-semibold text-[#1d2940]">{getPatientEmail(selectedPatient)}</div>
                        </div>
                        <button
                          onClick={() => handleEmail(getPatientEmail(selectedPatient))}
                          className="flex items-center gap-2 rounded-[14px] bg-[#22c58b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#19b47c]"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    )}
                    {selectedPatient.user?.address && (
                      <div className="flex items-start gap-3 rounded-[20px] border border-[#eadcff] bg-[#f6f1ff] p-4">
                        <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f9db4]">Address</div>
                          <div className="mt-1 text-sm font-semibold text-[#1d2940]">{selectedPatient.user.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                {selectedPatient.symptoms && (
                  <div>
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#98a4b8]">Symptoms / Notes</h4>
                    <div className="rounded-[20px] border border-[#dbe7ff] bg-[#eff5ff] p-4">
                      <p className="text-sm text-[#42506a]">{selectedPatient.symptoms}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#98a4b8]">Status</h4>
                  <span className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${getStatusColor(selectedPatient.status)}`}>
                    {getStatusLabel(selectedPatient.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#eef2fb] bg-[#fbfcff] px-6 py-4">
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-[14px] border border-[#e6ebf4] bg-white px-4 py-2 text-sm font-semibold text-[#42506a] transition hover:bg-[#f8faff]"
              >
                Close
              </button>
              <Link
                href={`/doctor/appointments?id=${selectedPatient.id}`}
                className="rounded-[14px] bg-[#3567e6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2859d5]"
              >
                View Appointment
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 backdrop-blur-[2px] p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#eef2fb] bg-[linear-gradient(135deg,#fdfefe_0%,#f1f6ff_40%,#eaf2ff_100%)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98a4b8]">Quick Intake</p>
                  <h3 className="mt-1 text-lg font-bold text-[#1d2940]">Create Appointment</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl p-1.5 text-[#7f8ca5] transition hover:bg-white hover:text-[#42506a]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] px-4 py-3 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                  placeholder="Patient name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] px-4 py-3 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                  placeholder="+8801..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    className="w-full rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] px-4 py-3 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                    placeholder="Age"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                    className="w-full rounded-[16px] border border-[#e6ebf4] bg-[#fbfdff] px-4 py-3 text-sm font-semibold text-[#42506a] focus:border-[#cad3e6] focus:outline-none focus:ring-2 focus:ring-[#edf2ff]"
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-[14px] border border-[#e6ebf4] bg-white px-4 py-2 text-sm font-semibold text-[#42506a] transition hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[14px] bg-[#3567e6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2859d5]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
