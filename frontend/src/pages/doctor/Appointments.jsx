import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarCheck2, Clock3, Eye, FilePlus, FileText, Hash, Mars, Phone, Search, User, Venus } from 'lucide-react';import DoctorLayout from '../../layouts/DoctorLayout';
import StatusBadge from '../../components/doctor/StatusBadge';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike, formatDisplayTime12h } from '../../utils/dateFormat';
import { toastError, toastSuccess } from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'in_consultation', label: 'In consultation' },
  { value: 'awaiting_tests', label: 'Awaiting tests' },
  { value: 'prescribed', label: 'Prescribed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function renderHighlighted(value, query) {
  const text = String(value ?? '');
  const needle = query.trim();

  if (!needle) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const start = lowerText.indexOf(lowerNeedle);

  if (start === -1) {
    return text;
  }

  const end = start + needle.length;

  return (
    <>
      {text.slice(0, start)}
      <span className="font-semibold text-slate-900">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}

function formatStatusLabel(status) {
  const value = String(status || '').trim();
  if (!value) return 'Unknown';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusSelectTone(status) {
  const value = String(status || '').toLowerCase();

  const tones = {
    scheduled: 'border-slate-200 bg-white text-slate-700',
    arrived: 'border-amber-200 bg-white text-amber-700',
    in_consultation: 'border-violet-200 bg-white text-violet-700',
    awaiting_tests: 'border-orange-200 bg-white text-orange-700',
    prescribed: 'border-emerald-200 bg-white text-emerald-700',
    cancelled: 'border-rose-200 bg-white text-rose-700',
  };

  return tones[value] || tones.scheduled;
}

function getStatusSummaryTone(status) {
  const value = String(status || '').toLowerCase();

  const tones = {
    today: 'border-[#CBD5E1] bg-slate-50 text-slate-700',
    scheduled: 'border-slate-200 bg-slate-50 text-slate-700',
    arrived: 'border-amber-200 bg-amber-50 text-amber-700',
    in_consultation: 'border-violet-200 bg-violet-50 text-violet-700',
    awaiting_tests: 'border-orange-200 bg-orange-50 text-orange-700',
    prescribed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return tones[value] || tones.scheduled;
}

function GenderIconAvatar({ gender }) {
  const value = String(gender || '').toLowerCase();

  if (value === 'female') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-[0_6px_14px_-8px_rgba(244,63,94,0.9)]" title="Female">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-pink-100 text-pink-600 shadow-sm">
          <Venus className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  if (value === 'male') {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_6px_14px_-8px_rgba(59,130,246,0.95)]" title="Male">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-sky-100 text-sky-600 shadow-sm">
          <Mars className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
      <User className="h-4 w-4" />
    </span>
  );
}

export default function DoctorAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAppointments = async (params = {}) => {
    setLoading(true);
    const query = new URLSearchParams({ per_page: 200, ...params }).toString();
    try {
      const res = await fetch(`/api/doctor/appointments?${query}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.appointments) ? data.appointments : (data.appointments?.data ?? []);
        setRows(items);
        setPagination(data.meta ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getPatientName = (appointment) => appointment?.patient_name || appointment?.user?.name || `Patient #${appointment?.user_id || ''}`;
  const getPatientPhone = (appointment) => appointment?.patient_phone || appointment?.user?.phone || null;
  const getPatientAge = (appointment) => appointment?.patient_age || appointment?.user?.age || '';
  const getPatientGender = (appointment) => {
    return appointment?.patient_gender || appointment?.user?.gender || '';
  };

  const formatAgeGender = (appointment) => {
    const age = getPatientAge(appointment);
    const gender = formatGender(getPatientGender(appointment));
    const ageLabel = age ? `${age}y` : 'Age N/A';
    return `${ageLabel} • ${gender}`;
  };

  const formatGender = (gender) => {
    const value = String(gender || '').trim().toLowerCase();
    if (!value) return 'N/A';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const updateStatus = async (id, status) => {
    const response = await fetch(`/api/doctor/appointments/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
      toastSuccess('Appointment status updated.');
      return;
    }

    const data = await response.json().catch(() => ({}));
    toastError(data?.message || 'Failed to update status.');
  };

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return rows.filter((appointment) => {
      const statusOk = statusFilter === 'all' || appointment.status === statusFilter;
      if (!statusOk) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const name = getPatientName(appointment).toLowerCase();
      const phone = (getPatientPhone(appointment) || '').toLowerCase();
      const appointmentId = String(appointment.id || '').toLowerCase();
      const serial = String(appointment.serial_no || '').toLowerCase();

      return (
        name.includes(needle)
        || phone.includes(needle)
        || appointmentId.includes(needle)
        || serial.includes(needle)
      );
    });
  }, [rows, statusFilter, searchTerm]);

  const today = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => ({
    total: rows.length,
    today: rows.filter((item) => item.appointment_date === today).length,
    inProgress: rows.filter((item) => item.status === 'in_consultation').length,
    completed: rows.filter((item) => item.status === 'prescribed').length,
    visible: filteredRows.length,
  }), [rows, today, filteredRows.length]);

  const statusCountItems = useMemo(() => (
    STATUS_OPTIONS
      .filter((option) => option.value !== 'all')
      .map((option) => ({
        key: option.value,
        label: option.label,
        count: rows.filter((item) => item.status === option.value).length,
      }))
  ), [rows]);

  return (
    <DoctorLayout title="Appointments" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#2D3A74]">Appointments</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {stats.visible}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
                <div className={`rounded-xl border px-2.5 py-1.5 ${getStatusSummaryTone('today')}`}>
                  Today: <span className="font-semibold">{stats.today}</span>
                </div>
                {statusCountItems.map((statusItem) => (
                  <div
                    key={statusItem.key}
                    className={`rounded-xl border px-2.5 py-1.5 ${getStatusSummaryTone(statusItem.key)}`}
                  >
                    {statusItem.label}: <span className="font-semibold">{statusItem.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,320px)_180px] xl:items-end">
                <div className="xl:w-[320px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, phone, serial or id"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="sm:max-w-[190px] xl:w-[180px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Patient</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Update Status</th>
                  <th className="px-6 py-4 text-right">Create Rx</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((appointment, index) => {
                  const serial = appointment.id;
                  const patientPhone = getPatientPhone(appointment);

                  return (
                    <tr key={appointment.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => setSelectedPatient(appointment)}>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(serial, searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 text-left">
                          <GenderIconAvatar gender={getPatientGender(appointment)} />
                          <div>
                            <div className="font-semibold text-slate-900">{renderHighlighted(getPatientName(appointment), searchTerm)}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{formatAgeGender(appointment)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {renderHighlighted(patientPhone || 'N/A', searchTerm)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-[18px] w-[18px] text-slate-600" />
                          {formatDisplayDateWithYearFromDateLike(appointment.appointment_date) || appointment.appointment_date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4 text-slate-500" />
                          {formatDisplayTime12h(appointment.appointment_time) || appointment.appointment_time}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={appointment.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(appointment.id, e.target.value)}
                          className={`w-[136px] min-w-0 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 ${getStatusSelectTone(appointment.status)}`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="arrived">Arrived</option>
                          <option value="in_consultation">In consultation</option>
                          <option value="awaiting_tests">Awaiting tests</option>
                          <option value="prescribed">Prescribed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        {!appointment.has_prescription || !appointment.prescription_id ? (
                          <Link
                            onClick={(e) => e.stopPropagation()}
                            href={`/doctor/prescriptions/create?appointment_id=${appointment.id}`}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d8e2f8] bg-white text-[#3556a6] transition hover:bg-[#f3f7ff]"
                            aria-label="Create prescription"
                          >
                            <FilePlus className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Create Prescription
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-300">
                            <FilePlus className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(appointment);
                            }}
                            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                            aria-label="View details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View Details
                            </span>
                          </button>
                          {appointment.has_prescription && appointment.prescription_id ? (
                            <Link
                              onClick={(e) => e.stopPropagation()}
                              href={`/doctor/prescriptions/${appointment.prescription_id}`}
                              className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                              aria-label="View prescription"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                View Prescription
                              </span>
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading appointments…</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-5">
              <DocEmptyState
                icon={CalendarCheck2}
                title="No appointments found"
                description="Try another status or keyword."
              />
            </div>
          ) : null}

          {pagination?.data && typeof pagination.current_page === 'number' ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> row(s) on this page
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const prev = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('previous'));
                  const next = (pagination.links || []).find((item) => String(item.label).toLowerCase().includes('next'));

                  return (
                    <>
                      {prev?.url ? (
                        <Link href={prev.url} className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300">Previous</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Previous</span>
                      )}
                      {next?.url ? (
                        <Link href={next.url} className="rounded-lg bg-[#2D3A74] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#243063]">Next</Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400">Next</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <DocModal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Appointment Details"
        icon={User}
        size="sm"
        overlayClassName="bg-[rgba(15,23,42,0.46)] backdrop-blur-[4px]"
        panelClassName="max-h-[60vh] border-slate-200/80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)]"
        headerClassName="px-4 py-3"
        bodyClassName="px-4 py-3"
        footerClassName="px-4 py-3"
        footer={
          <>
            {getPatientPhone(selectedPatient) ? (
              <DocButton size="xs" onClick={() => handleCall(getPatientPhone(selectedPatient))}>
                <Phone className="h-4 w-4" /> Call Patient
              </DocButton>
            ) : null}
            <DocButton variant="secondary" size="xs" onClick={() => setSelectedPatient(null)}>Close</DocButton>
            {selectedPatient?.has_prescription && selectedPatient?.prescription_id ? (
              <Link
                href={`/doctor/prescriptions/${selectedPatient.prescription_id}`}
                className="inline-flex items-center rounded-lg bg-[#2D3A74] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243063]"
              >
                Open Prescription
              </Link>
            ) : selectedPatient?.id ? (
              <Link
                href={`/doctor/prescriptions/create?appointment_id=${selectedPatient.id}`}
                className="inline-flex items-center rounded-lg bg-[#2D3A74] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243063]"
              >
                Create Prescription
              </Link>
            ) : null}
          </>
        }
      >
        {selectedPatient ? (
          <div className="space-y-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-2.5">
              <div className="flex items-center gap-3">
                <GenderIconAvatar gender={getPatientGender(selectedPatient)} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Patient</p>
                  <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">{getPatientName(selectedPatient)}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Appointment #{selectedPatient?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Date</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatDisplayDateWithYearFromDateLike(selectedPatient.appointment_date) || selectedPatient.appointment_date}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Time</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatDisplayTime12h(selectedPatient.appointment_time) || selectedPatient.appointment_time}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Phone</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{getPatientPhone(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Age</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{getPatientAge(selectedPatient) || 'N/A'}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Gender</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 leading-tight">{formatGender(getPatientGender(selectedPatient))}</p>
              </div>
              <div className="rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Status</p>
                <div className="mt-1"><StatusBadge status={selectedPatient.status} /></div>
              </div>
            </div>

            {selectedPatient?.symptoms ? (
              <div className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Symptoms</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-700">{selectedPatient.symptoms}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DocModal>
    </DoctorLayout>
  );
}
