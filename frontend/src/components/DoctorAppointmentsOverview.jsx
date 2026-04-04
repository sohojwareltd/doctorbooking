import { Building2, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Clock3, LayoutGrid, Rows3 } from 'lucide-react';

const DATE_FILTER_LABELS = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Dates',
};

const STATUS_FILTER_LABELS = {
  all: 'All Status',
  scheduled: 'Scheduled',
  arrived: 'Waiting',
  in_consultation: 'In Progress',
  awaiting_tests: 'Awaiting Tests',
  prescribed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const AVATAR_STYLES = [
  'bg-cyan-100 text-cyan-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
];

function toDate(dateValue) {
  if (!dateValue) {
    return new Date();
  }

  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return '--:--';

  const normalized = String(timeValue).slice(0, 5);
  const [hourString, minuteString] = normalized.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return normalized;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function getPatientName(appointment) {
  return appointment?.patient_name || appointment?.user?.name || appointment?.name || 'Patient';
}

function getAppointmentSubtitle(appointment) {
  const visitLabel = appointment?.is_guest ? 'New Patient' : 'Follow-up';
  const typeLabel = appointment?.type || 'Consultation';

  return `${visitLabel} • ${typeLabel}`;
}

function getStatusMeta(status) {
  switch ((status || '').toLowerCase()) {
    case 'prescribed':
      return {
        label: 'Completed',
        badgeClassName: 'text-[#16936b]',
        markerClassName: 'bg-[#22c58b]',
        panelClassName: 'border-[#d3efe3] bg-[#eefbf5]',
      };
    case 'in_consultation':
      return {
        label: 'In Progress',
        badgeClassName: 'text-[#4d73e7]',
        markerClassName: 'bg-[#4b78ff]',
        panelClassName: 'border-[#dbe7ff] bg-[#eff5ff]',
      };
    case 'arrived':
      return {
        label: 'Waiting',
        badgeClassName: 'text-[#d58a20]',
        markerClassName: 'bg-[#ffd88a]',
        panelClassName: 'border-[#ffe6b6] bg-[#fff7ea]',
      };
    case 'awaiting_tests':
      return {
        label: 'Awaiting Tests',
        badgeClassName: 'text-[#8a6af0]',
        markerClassName: 'bg-[#8a6af0]',
        panelClassName: 'border-[#eadcff] bg-[#f6f1ff]',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClassName: 'text-[#de6656]',
        markerClassName: 'bg-[#ff6b62]',
        panelClassName: 'border-[#ffd9d2] bg-[#fff4f1]',
      };
    case 'no_show':
      return {
        label: 'No Show',
        badgeClassName: 'text-[#9aa8bc]',
        markerClassName: 'bg-[#c9d3e5]',
        panelClassName: 'border-[#e8edf6] bg-[#f8fafe]',
      };
    case 'scheduled':
    default:
      return {
        label: STATUS_FILTER_LABELS[(status || '').toLowerCase()] || 'Scheduled',
        badgeClassName: 'text-[#60718c]',
        markerClassName: 'bg-[#9aa6bc]',
        panelClassName: 'border-[#e8edf6] bg-[#fbfcff]',
      };
  }
}

function buildCalendarCells(baseDateValue) {
  const baseDate = toDate(baseDateValue);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayMatch = {
    year: baseDate.getFullYear(),
    month: baseDate.getMonth(),
    day: baseDate.getDate(),
  };

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    let dayNumber;
    let inCurrentMonth = true;
    let cellMonth = month;
    let cellYear = year;

    if (index < firstWeekday) {
      dayNumber = daysInPrevMonth - firstWeekday + index + 1;
      inCurrentMonth = false;
      cellMonth = month - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear -= 1;
      }
    } else if (index >= firstWeekday + daysInMonth) {
      dayNumber = index - (firstWeekday + daysInMonth) + 1;
      inCurrentMonth = false;
      cellMonth = month + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear += 1;
      }
    } else {
      dayNumber = index - firstWeekday + 1;
    }

    const isToday =
      cellYear === todayMatch.year &&
      cellMonth === todayMatch.month &&
      dayNumber === todayMatch.day;

    const dateKey = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    cells.push({
      dayNumber,
      inCurrentMonth,
      isToday,
      dateKey,
    });
  }

  return {
    monthLabel: baseDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    cells,
  };
}

export default function DoctorAppointmentsOverview({
  title = 'Appointments',
  appointments = [],
  todayLabel = '',
  currentDate,
  dateFilter = 'today',
  onDateFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  onAppointmentClick,
  onCreateAppointment,
  createButtonLabel = 'New Appointment',
  maxItems = 5,
}) {
  const sortedAppointments = [...(Array.isArray(appointments) ? appointments : [])].sort((left, right) => {
    const leftKey = `${left?.appointment_date || ''} ${left?.appointment_time || ''}`.trim();
    const rightKey = `${right?.appointment_date || ''} ${right?.appointment_time || ''}`.trim();

    return new Date(leftKey) - new Date(rightKey);
  });

  const visibleAppointments = sortedAppointments.slice(0, maxItems);
  const { monthLabel, cells } = buildCalendarCells(currentDate);

  const statItems = [
    {
      label: 'Total',
      value: sortedAppointments.length,
      valueClassName: 'text-[#2b3951]',
      markerClassName: 'bg-[#4b78ff]',
    },
    {
      label: 'Completed',
      value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'prescribed').length,
      valueClassName: 'text-[#16936b]',
      markerClassName: 'bg-[#22c58b]',
    },
    {
      label: 'Cancelled',
      value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'cancelled').length,
      valueClassName: 'text-[#de6656]',
      markerClassName: 'bg-[#ff6b62]',
    },
    {
      label: 'No Show',
      value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'no_show').length,
      valueClassName: 'text-[#8f9db4]',
      markerClassName: 'bg-[#c9d3e5]',
    },
  ];

  const appointmentCounts = sortedAppointments.reduce((counts, appointment) => {
    if (appointment?.appointment_date) {
      counts[appointment.appointment_date] = (counts[appointment.appointment_date] || 0) + 1;
    }

    return counts;
  }, {});

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e8edf6] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#eef2fb] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1d2940] md:text-[20px]">{title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onCreateAppointment && (
              <button
                type="button"
                onClick={onCreateAppointment}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#3567e6] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(75,120,255,0.28)] transition hover:bg-[#2859d5]"
              >
                <span className="text-base leading-none">+</span>
                {createButtonLabel}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex items-center">
              <CalendarRange className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-[#7c88a0]" />
              <select
                value={dateFilter}
                onChange={(event) => onDateFilterChange?.(event.target.value)}
                disabled={!onDateFilterChange}
                className="appearance-none rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#42506a] transition focus:border-[#cad3e6] focus:outline-none disabled:cursor-default"
              >
                {Object.entries(DATE_FILTER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2.5 text-xs font-semibold text-[#42506a]">
              <CalendarDays className="h-3.5 w-3.5 text-[#7c88a0]" />
              {todayLabel || 'Today'}
            </div>

            <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2.5 text-xs font-semibold text-[#42506a]">
              <Building2 className="h-3.5 w-3.5 text-[#7c88a0]" />
              All Chambers
            </div>

            <label className="relative inline-flex items-center">
              <Clock3 className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-[#7c88a0]" />
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange?.(event.target.value)}
                disabled={!onStatusFilterChange}
                className="appearance-none rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#42506a] transition focus:border-[#cad3e6] focus:outline-none disabled:cursor-default"
              >
                {Object.entries(STATUS_FILTER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98a4b8]">
              <span className="h-2 w-2 rounded-full bg-[#4b78ff]" />
              {sortedAppointments.length} appointments
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-[#dbe7ff] bg-[#eff5ff] text-[#3567e6]">
                <Rows3 className="h-4 w-4" />
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-[#e6ebf4] bg-[#fbfdff] text-[#98a4b8]">
                <LayoutGrid className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="relative">
          <div className="absolute bottom-1 left-[81px] top-6 hidden w-px bg-[#ebf0f7] md:block" />

          {visibleAppointments.length > 0 ? (
            <div className="space-y-3.5">
              {visibleAppointments.map((appointment, index) => {
                const patientName = getPatientName(appointment);
                const statusMeta = getStatusMeta(appointment?.status);
                const avatarClassName = AVATAR_STYLES[index % AVATAR_STYLES.length];
                const initials = patientName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((segment) => segment[0])
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={appointment?.id || `${patientName}-${index}`}
                    type="button"
                    onClick={() => onAppointmentClick?.(appointment)}
                    className="group grid w-full gap-2 text-left md:grid-cols-[84px_minmax(0,1fr)] md:items-center"
                  >
                    <div className="pl-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa6bc] md:pr-5">
                      {formatTimeLabel(appointment?.appointment_time)}
                    </div>

                    <div className="relative">
                      <span className={`absolute -left-[22px] top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full ring-4 ring-white md:block ${statusMeta.markerClassName}`} />

                      <div className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 shadow-[0_12px_25px_rgba(148,163,184,0.12)] transition group-hover:shadow-[0_18px_34px_rgba(148,163,184,0.16)] ${statusMeta.panelClassName}`}>
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClassName}`}>
                          {initials || 'PT'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-[#253149]">{patientName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-[#8f9bb1]">{getAppointmentSubtitle(appointment)}</div>
                        </div>

                        <div className={`whitespace-nowrap text-[13px] font-semibold ${statusMeta.badgeClassName}`}>{statusMeta.label}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#e4eaf6] bg-[#fafcff] px-6 py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[#d0d8ea]" />
              <p className="text-sm font-semibold text-[#52627c]">No appointments available</p>
              <p className="mt-1 text-xs text-[#9aa6bc]">Appointments for the selected range will appear here.</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 self-start">
          <div className="rounded-[22px] border border-[#edf2f8] bg-[#fbfcff] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a3aec2] transition hover:bg-white hover:text-[#60718c]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center text-sm font-semibold text-[#42506a]">{monthLabel}</div>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a3aec2] transition hover:bg-white hover:text-[#60718c]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#a3aec2]">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1.5">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-xs">
              {cells.map((cell, index) => {
                const appointmentCount = appointmentCounts[cell.dateKey] || 0;

                return (
                  <div
                    key={`${cell.dayNumber}-${index}`}
                    className={`flex h-9 flex-col items-center justify-center rounded-lg font-medium transition ${
                      cell.isToday
                        ? 'bg-[#3567e6] text-white shadow-[0_14px_28px_rgba(75,120,255,0.35)]'
                        : cell.inCurrentMonth
                          ? 'text-[#536178]'
                          : 'text-[#c2cada]'
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                    {appointmentCount > 0 && (
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${cell.isToday ? 'bg-white/80' : 'bg-[#4b78ff]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#edf2f8] bg-[#fbfcff] p-4">
            <div className="mb-4 text-[13px] font-semibold text-[#42506a]">Appointment Stats</div>

            <div className="space-y-3.5">
              {statItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 text-[#7f8ca5]">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.markerClassName}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`font-semibold ${item.valueClassName}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}