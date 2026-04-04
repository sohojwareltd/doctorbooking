import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutGrid,
  Rows3,
  X,
} from 'lucide-react';

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
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function toDateKey(dateValue) {
  const date = toDate(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return '--:--';

  const normalized = String(timeValue).slice(0, 5);
  const [hourString, minuteString] = normalized.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return normalized;

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
  return `${visitLabel} - ${typeLabel}`;
}

function getStatusMeta(status) {
  switch ((status || '').toLowerCase()) {
    case 'prescribed':
      return {
        label: 'Completed',
        badgeClassName: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        markerClassName: 'bg-emerald-500',
        panelClassName: 'border-emerald-100 bg-emerald-50/60',
      };
    case 'in_consultation':
      return {
        label: 'In Progress',
        badgeClassName: 'text-violet-700 bg-violet-50 border-violet-200',
        markerClassName: 'bg-violet-500',
        panelClassName: 'border-violet-100 bg-violet-50/60',
      };
    case 'arrived':
      return {
        label: 'Waiting',
        badgeClassName: 'text-amber-700 bg-amber-50 border-amber-200',
        markerClassName: 'bg-amber-500',
        panelClassName: 'border-amber-100 bg-amber-50/60',
      };
    case 'awaiting_tests':
      return {
        label: 'Awaiting Tests',
        badgeClassName: 'text-orange-700 bg-orange-50 border-orange-200',
        markerClassName: 'bg-orange-500',
        panelClassName: 'border-orange-100 bg-orange-50/60',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClassName: 'text-rose-700 bg-rose-50 border-rose-200',
        markerClassName: 'bg-rose-500',
        panelClassName: 'border-rose-100 bg-rose-50/60',
      };
    case 'no_show':
      return {
        label: 'No Show',
        badgeClassName: 'text-slate-600 bg-slate-100 border-slate-200',
        markerClassName: 'bg-slate-400',
        panelClassName: 'border-slate-200 bg-slate-50/80',
      };
    case 'scheduled':
    default:
      return {
        label: STATUS_FILTER_LABELS[(status || '').toLowerCase()] || 'Scheduled',
        badgeClassName: 'text-sky-700 bg-sky-50 border-sky-200',
        markerClassName: 'bg-sky-500',
        panelClassName: 'border-sky-100 bg-sky-50/60',
      };
  }
}

function buildCalendarCells(baseDateValue) {
  const baseDate = toDate(baseDateValue);
  const today = new Date();

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayMatch = {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
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

    cells.push({ dayNumber, inCurrentMonth, isToday, dateKey });
  }

  return {
    monthLabel: baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    cells,
  };
}

function CalendarGrid({ monthLabel, cells, appointmentCounts, selectedDateKey, onPrev, onNext, onSelectDate }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center text-sm font-semibold text-slate-700">{monthLabel}</div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1.5">{label}</div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((cell, index) => {
          const appointmentCount = appointmentCounts[cell.dateKey] || 0;
          const isSelected = selectedDateKey === cell.dateKey;

          return (
            <button
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              key={`${cell.dayNumber}-${index}`}
              className={`flex h-9 flex-col items-center justify-center rounded-lg font-medium transition ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-[0_10px_20px_rgba(14,165,233,0.35)]'
                  : cell.isToday
                    ? 'bg-sky-50 text-sky-600'
                    : cell.inCurrentMonth
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-300'
              }`}
            >
              <span>{cell.dayNumber}</span>
              {appointmentCount > 0 && (
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-sky-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function AnimatedCount({ value, duration = 650 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    let frameId;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return displayValue;
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
  maxItems = 5,
}) {
  const [viewMode, setViewMode] = useState('timeline');
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => toDate(currentDate));
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(currentDate));
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    setCalendarBaseDate(toDate(currentDate));
    setSelectedDateKey(toDateKey(currentDate));
  }, [currentDate]);

  const sortedAppointments = useMemo(() => {
    return [...(Array.isArray(appointments) ? appointments : [])].sort((left, right) => {
      const leftKey = `${left?.appointment_date || ''} ${left?.appointment_time || ''}`.trim();
      const rightKey = `${right?.appointment_date || ''} ${right?.appointment_time || ''}`.trim();
      return new Date(leftKey) - new Date(rightKey);
    });
  }, [appointments]);

  const visibleAppointments = useMemo(() => sortedAppointments.slice(0, maxItems), [sortedAppointments, maxItems]);

  const appointmentCounts = useMemo(() => {
    return sortedAppointments.reduce((counts, appointment) => {
      if (appointment?.appointment_date) {
        counts[appointment.appointment_date] = (counts[appointment.appointment_date] || 0) + 1;
      }
      return counts;
    }, {});
  }, [sortedAppointments]);

  const selectedDateAppointments = useMemo(() => {
    return sortedAppointments.filter((appointment) => appointment?.appointment_date === selectedDateKey);
  }, [sortedAppointments, selectedDateKey]);

  const selectedDateLabel = toDate(selectedDateKey).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const statItems = useMemo(() => {
    return [
      {
        label: 'Total',
        value: sortedAppointments.length,
        valueClassName: 'text-sky-700',
        markerClassName: 'bg-sky-500',
      },
      {
        label: 'Completed',
        value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'prescribed').length,
        valueClassName: 'text-emerald-700',
        markerClassName: 'bg-emerald-500',
      },
      {
        label: 'Cancelled',
        value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'cancelled').length,
        valueClassName: 'text-rose-700',
        markerClassName: 'bg-rose-500',
      },
      {
        label: 'No Show',
        value: sortedAppointments.filter((appointment) => (appointment?.status || '').toLowerCase() === 'no_show').length,
        valueClassName: 'text-slate-600',
        markerClassName: 'bg-slate-400',
      },
    ];
  }, [sortedAppointments]);

  const { monthLabel, cells } = useMemo(() => buildCalendarCells(calendarBaseDate), [calendarBaseDate]);

  const shiftCalendarMonth = (delta) => {
    setCalendarBaseDate((prevDate) => {
      const nextDate = new Date(prevDate);
      nextDate.setMonth(nextDate.getMonth() + delta);
      return nextDate;
    });
  };

  const jumpToToday = () => {
    const now = new Date();
    setCalendarBaseDate(now);
    setSelectedDateKey(toDateKey(now));
    setViewMode('day');
  };

  const tabItems = [
    { key: 'timeline', label: 'Timeline', icon: Rows3 },
    { key: 'day', label: 'Day Board', icon: LayoutGrid },
    { key: 'insights', label: 'Insights', icon: BarChart3 },
  ];

  const dateFilterItems = [
    { label: 'Today', value: todayLabel || 'Today', icon: CalendarDays },
    { label: 'Date Range', value: DATE_FILTER_LABELS[dateFilter] || 'Today', icon: CalendarRange },
    { label: 'Chamber', value: 'All Chambers', icon: Building2 },
    { label: 'Status', value: STATUS_FILTER_LABELS[statusFilter] || 'All Status', icon: Clock3 },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">Smart appointment control with modern data surfaces</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {sortedAppointments.length} appointments
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {dateFilterItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-[0_1px_0_rgba(148,163,184,0.08)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const active = tab.key === viewMode;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setViewMode(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(148,163,184,0.08)]">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.markerClassName}`} />
                  {item.label}
                </div>
                <div className={`mt-1 text-lg font-bold ${item.valueClassName}`}>
                  <AnimatedCount value={item.value} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          {viewMode === 'timeline' && (
            <div className="space-y-2.5">
              {visibleAppointments.length > 0 ? (
                visibleAppointments.map((appointment, index) => {
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
                      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition hover:shadow-[0_10px_20px_rgba(148,163,184,0.14)] ${statusMeta.panelClassName}`}
                    >
                      <div className="w-[86px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {formatTimeLabel(appointment?.appointment_time)}
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.markerClassName}`} />
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarClassName}`}>
                        {initials || 'PT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{patientName}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">{getAppointmentSubtitle(appointment)}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
                        {statusMeta.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No appointments available</p>
                  <p className="mt-1 text-xs text-slate-500">Try changing filters or switch to Day Board tab.</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Selected Date</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-700">{selectedDateLabel}</h3>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
                  {selectedDateAppointments.length} appointments
                </span>
              </div>

              {selectedDateAppointments.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDateAppointments.map((appointment, index) => {
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
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition hover:shadow-[0_10px_20px_rgba(148,163,184,0.14)] ${statusMeta.panelClassName}`}
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${avatarClassName}`}>
                          {initials || 'PT'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-800">{patientName}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{formatTimeLabel(appointment?.appointment_time)} - {getAppointmentSubtitle(appointment)}</div>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
                          {statusMeta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-7 text-center">
                  <p className="text-sm font-semibold text-slate-700">No appointments on this date</p>
                  <p className="mt-1 text-xs text-slate-500">Pick another date from the calendar popup.</p>
                </div>
              )}
            </div>
          )}


          {viewMode === 'insights' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {statItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{item.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${item.markerClassName}`} />
                  </div>
                  <div className={`mt-2 text-2xl font-bold ${item.valueClassName}`}>
                    <AnimatedCount value={item.value} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 self-start">
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Mini Calendar
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">{selectedDateLabel}</div>
            <div className="mt-1 text-xs text-slate-500">Click to open interactive calendar popup</div>
          </button>
        </div>
      </div>

      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" onClick={() => setIsCalendarModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Calendar Picker</h3>
                <p className="text-xs text-slate-500">Select a date to update boards and lanes</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <CalendarGrid
              monthLabel={monthLabel}
              cells={cells}
              appointmentCounts={appointmentCounts}
              selectedDateKey={selectedDateKey}
              onPrev={() => shiftCalendarMonth(-1)}
              onNext={() => shiftCalendarMonth(1)}
              onSelectDate={(dateKey) => {
                setSelectedDateKey(dateKey);
                setViewMode('day');
              }}
            />

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Selected Date</p>
                <p className="truncate text-sm font-semibold text-slate-700">{selectedDateLabel}</p>
                <p className="text-xs text-slate-500">{selectedDateAppointments.length} appointments</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}