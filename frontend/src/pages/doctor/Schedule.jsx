import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Calendar, Clock, X, Link2, CalendarOff, Plus, Trash2, Pencil, ChevronDown, Check } from 'lucide-react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './dateRangeOverrides.css';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocButton } from '../../components/doctor/DocUI';
import { toastError, toastSuccess, toastWarning } from '../../utils/toast';

const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5];
const WEEKEND_INDICES = [0, 6];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper functions for timezone-safe date conversion
const dateToISOString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ISOStringToDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function DoctorSchedule({ schedule = [], unavailable_ranges = [], chambers = [], current_chamber_id = null }) {
  const initial = useMemo(() => {
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return DAY_LABELS.map((_, day_of_week) => ({
        day_of_week,
        is_closed: day_of_week === 0,
        slot_minutes: 30,
        ranges: day_of_week === 0 ? [] : [{ start_time: '09:00', end_time: '17:00' }],
      }));
    }
    return schedule.map((row) => ({
      day_of_week: row.day_of_week,
      is_closed: !!row.is_closed,
      slot_minutes: row.slot_minutes ?? 30,
      ranges: Array.isArray(row.ranges) ? row.ranges : [],
    }));
  }, [schedule]);

  const initialUnavailable = useMemo(() => {
    if (!Array.isArray(unavailable_ranges)) return [];
    return unavailable_ranges
      .map((r) => ({
        start_date: r?.start_date || '',
        end_date: r?.end_date || '',
      }))
      .filter((r) => r.start_date && r.end_date);
  }, [unavailable_ranges]);

  const [rows, setRows] = useState(initial);
  const [unavailable, setUnavailable] = useState(initialUnavailable);
  const [saving, setSaving] = useState(false);
  const [chamberMenuOpen, setChamberMenuOpen] = useState(false);
  const [chamberMenuStyle, setChamberMenuStyle] = useState(null);
  const [highlightUnavailableIndex, setHighlightUnavailableIndex] = useState(null);
  const [openDateRangeIdx, setOpenDateRangeIdx] = useState(null);
  const bannerOverlayRef = useRef(null);
  const chamberButtonRef = useRef(null);
  const chamberMenuRef = useRef(null);
  const unavailableSectionRef = useRef(null);
  const unavailableCardRefs = useRef([]);

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const updateRange = (dayIdx, rangeIdx, patch) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== dayIdx) return r;
        const nextRanges = (Array.isArray(r.ranges) ? r.ranges : []).map((rg, j) => (j === rangeIdx ? { ...rg, ...patch } : rg));
        return { ...r, ranges: nextRanges };
      })
    );
  };

  const addRange = (dayIdx) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== dayIdx) return r;
        const nextRanges = [...(Array.isArray(r.ranges) ? r.ranges : [])];
        nextRanges.push({ start_time: '09:00', end_time: '12:00' });
        return { ...r, ranges: nextRanges, is_closed: false };
      })
    );
  };

  const removeRange = (dayIdx, rangeIdx) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== dayIdx) return r;
        const nextRanges = (Array.isArray(r.ranges) ? r.ranges : []).filter((_, j) => j !== rangeIdx);
        return { ...r, ranges: nextRanges };
      })
    );
  };

  const addUnavailable = () => {
    const nextIndex = Array.isArray(unavailable) ? unavailable.length : 0;
    setUnavailable((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next.push({ start_date: '', end_date: '' });
      return next;
    });
    setHighlightUnavailableIndex(nextIndex);
  };

  const updateUnavailable = (idx, patch) => {
    setUnavailable((prev) => (Array.isArray(prev) ? prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)) : prev));
    if (idx === highlightUnavailableIndex) {
      setHighlightUnavailableIndex(null);
    }
  };

  const removeUnavailable = (idx) => {
    setHighlightUnavailableIndex((prev) => {
      if (prev === null) return prev;
      if (prev === idx) return null;
      return prev > idx ? prev - 1 : prev;
    });
    setUnavailable((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : prev));
  };

  const selectedChamberId = String(current_chamber_id ?? (chambers[0]?.id ?? ''));

  const save = async () => {
    setSaving(true);

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      if (!token) {
        const message = 'Missing CSRF token. Please refresh the page and try again.';
        toastError(message);
        return;
      }
      const res = await fetch('/doctor/schedule', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          chamber_id: current_chamber_id ?? null,
          schedule: rows,
          unavailable_ranges: unavailable,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const successMessage = data?.message || 'Schedule saved.';
        toastSuccess(successMessage);
        if (data?.warning) {
          toastWarning(data.warning);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message || 'Failed to save schedule.';
        toastError(msg);
      }
    } catch {
      const message = 'Network error. Please try again.';
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  const weekStats = useMemo(() => {
    const daysOpen = rows.filter((r) => !r.is_closed).length;
    const totalRanges = rows.reduce((acc, r) => acc + (Array.isArray(r.ranges) ? r.ranges.length : 0), 0);
    const avgSlot = rows.reduce((acc, r) => acc + r.slot_minutes, 0) / rows.length;
    const unavailableDays = Array.isArray(unavailable) ? unavailable.length : 0;
    return { daysOpen, totalRanges, avgSlot, unavailableDays };
  }, [rows, unavailable]);

  const selectedChamber = useMemo(() => {
    if (!Array.isArray(chambers) || chambers.length === 0) return null;
    return chambers.find((c) => String(c.id) === selectedChamberId) || chambers[0] || null;
  }, [chambers, selectedChamberId]);

  const syncChamberMenuPosition = useCallback(() => {
    if (!chamberButtonRef.current || !bannerOverlayRef.current) return;
    const rect = chamberButtonRef.current.getBoundingClientRect();
    const containerRect = bannerOverlayRef.current.getBoundingClientRect();
    setChamberMenuStyle({
      top: rect.bottom - containerRect.top + 8,
      left: rect.left - containerRect.left,
      width: Math.max(rect.width, 220),
    });
  }, []);

  const [editingDay, setEditingDay] = useState(null);

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Quick Sync modal state
  const [syncModal, setSyncModal] = useState(null); // { fromIdx, selectedDays: Set }

  useEffect(() => {
    if (!chamberMenuOpen) return undefined;

    syncChamberMenuPosition();

    const handleOutsideClick = (event) => {
      const clickedMenu = chamberMenuRef.current?.contains(event.target);
      const clickedButton = chamberButtonRef.current?.contains(event.target);
      if (!clickedMenu && !clickedButton) {
        setChamberMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setChamberMenuOpen(false);
      }
    };

    const updatePosition = () => syncChamberMenuPosition();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [chamberMenuOpen, syncChamberMenuPosition]);

  useEffect(() => {
    if (highlightUnavailableIndex === null) return undefined;

    const timer = window.setTimeout(() => {
      unavailableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      unavailableCardRefs.current[highlightUnavailableIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [unavailable, highlightUnavailableIndex]);

  const openSyncModal = useCallback((fromIdx) => {
    const selected = new Set();
    setSyncModal({ fromIdx, selectedDays: selected });
  }, []);

  const toggleSyncDay = useCallback((dayIdx) => {
    setSyncModal((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selectedDays);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return { ...prev, selectedDays: next };
    });
  }, []);

  const setSyncPreset = useCallback((preset) => {
    setSyncModal((prev) => {
      if (!prev) return prev;
      let indices = [];
      if (preset === 'weekdays') indices = WEEKDAY_INDICES;
      else if (preset === 'weekend') indices = WEEKEND_INDICES;
      else if (preset === 'all') indices = [0, 1, 2, 3, 4, 5, 6];
      const next = new Set(indices.filter((i) => i !== prev.fromIdx));
      return { ...prev, selectedDays: next };
    });
  }, []);

  const applySyncModal = useCallback(() => {
    if (!syncModal) return;
    const { fromIdx, selectedDays } = syncModal;
    const source = rows[fromIdx];
    const count = selectedDays.size;
    if (count === 0) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (!selectedDays.has(i)) return r;
        return {
          ...r,
          is_closed: false,
          ranges: source.ranges.map((rg) => ({ ...rg })),
          slot_minutes: source.slot_minutes,
        };
      })
    );
    toastSuccess(`Applied ${DAY_LABELS[fromIdx]}'s schedule to ${count} day${count > 1 ? 's' : ''}.`);
    setSyncModal(null);
  }, [syncModal, rows]);

  return (
    <DoctorLayout title="Schedule">
      <div className="mx-auto max-w-[1420px] space-y-5">
        <div ref={bannerOverlayRef} className="relative z-[40]">
          <section className="surface-card overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-[#243b6b]">Manage Schedule</h2>
                <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 text-[13px] text-slate-500">
                  <span className="inline-flex items-center gap-2 uppercase tracking-[0.08em]">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Days Open</span>
                    <span className="text-lg font-semibold normal-case text-[#22b8b0]">{weekStats.daysOpen}/7</span>
                  </span>
                  <span className="inline-flex items-center gap-2 uppercase tracking-[0.08em]">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Time Ranges</span>
                    <span className="text-lg font-semibold normal-case text-[#22b8b0]">{weekStats.totalRanges}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 uppercase tracking-[0.08em]">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Avg Slot</span>
                    <span className="text-lg font-semibold normal-case text-[#22b8b0]">{Math.round(weekStats.avgSlot)}m</span>
                  </span>
                  <span className="inline-flex items-center gap-2 uppercase tracking-[0.08em]">
                    <CalendarOff className="h-4 w-4 text-slate-400" />
                    <span>Unavailable</span>
                    <span className="text-lg font-semibold normal-case text-[#22b8b0]">{weekStats.unavailableDays}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {Array.isArray(chambers) && chambers.length > 0 && (
                  <div className="relative">
                    <button
                      ref={chamberButtonRef}
                      type="button"
                      onClick={() => setChamberMenuOpen((prev) => !prev)}
                      className="inline-flex min-w-[160px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
                    >
                      <span className="truncate">{selectedChamber?.name || 'Select Chamber'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${chamberMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addUnavailable}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Add Vacation / Holiday
                </button>
              </div>
            </div>

            {chamberMenuOpen && chamberMenuStyle && (
              <div
                ref={chamberMenuRef}
                className="absolute z-[120] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-[0_24px_40px_-18px_rgba(15,23,42,0.22)]"
                style={{
                  top: `${chamberMenuStyle.top}px`,
                  left: `${chamberMenuStyle.left}px`,
                  width: `${chamberMenuStyle.width}px`,
                }}
              >
                {chambers.map((c) => {
                  const active = String(c.id) === selectedChamberId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setChamberMenuOpen(false);
                        if (!active) {
                          window.location.href = `/doctor/schedule?chamber_id=${c.id}`;
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <span className="truncate">{c.name}</span>
                      {active ? <Check className="h-4 w-4 flex-shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {Array.isArray(chambers) && chambers.length > 0 && (
          <>
            <div className="flex flex-col gap-5 lg:flex-row">


              <section className="surface-card overflow-hidden rounded-3xl border border-slate-200/80 bg-white flex-[3] min-w-0">
                <div className="divide-y divide-slate-200/80">
                  {rows.map((r, idx) => {
                    const isEditing = editingDay === idx;
                    const isOpen = !r.is_closed;
                    const rangeCount = Array.isArray(r.ranges) ? r.ranges.length : 0;

                    return (
                      <div key={r.day_of_week} className={`${r.is_closed ? 'bg-rose-50/45' : 'bg-white'}`}>
                        <div
                          className={`flex flex-wrap items-center gap-3 px-6 py-5 ${isOpen ? 'cursor-pointer hover:bg-slate-50/60' : ''}`}
                          onClick={() => { if (isOpen) setEditingDay(isEditing ? null : idx); }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newClosed = !r.is_closed;
                              updateRow(idx, {
                                is_closed: newClosed,
                                ranges: newClosed ? [] : (r.ranges?.length ? r.ranges : [{ start_time: '09:00', end_time: '17:00' }]),
                              });
                              if (newClosed && editingDay === idx) setEditingDay(null);
                            }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${isOpen ? 'bg-[#26c0b8]' : 'bg-slate-300'
                              }`}
                          >
                            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOpen ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                          </button>

                          <span className={`min-w-[86px] text-[15px] font-medium ${r.is_closed ? 'text-slate-700' : 'text-slate-800'}`}>
                            {DAY_LABELS[r.day_of_week]}
                          </span>

                          {r.is_closed && (
                            <span className="rounded-xl bg-rose-100 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-rose-500">Closed</span>
                          )}

                          {isOpen && !isEditing && (
                            <div className="flex flex-1 flex-wrap items-center gap-3">
                              {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                                <span key={j} className="inline-flex items-center gap-3 rounded-2xl bg-[#eefaf8] px-4 py-3 text-[15px] font-semibold text-slate-800">
                                  {formatTime12h(rg.start_time)}
                                  <span className="h-5 w-px bg-[#9be1db]" />
                                  {formatTime12h(rg.end_time)}
                                </span>
                              ))}
                              {rangeCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-500">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  {r.slot_minutes}m slots
                                </span>
                              )}
                              {rangeCount === 0 && (
                                <span className="text-[11px] italic text-slate-400">No time ranges</span>
                              )}
                            </div>
                          )}

                          {isEditing && <div className="flex-1" />}

                          <div className="ml-auto flex items-center gap-2">
                            {isOpen && rangeCount > 0 && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#21b8b0] transition hover:bg-[#ecfbf8]"
                                onClick={(e) => { e.stopPropagation(); openSyncModal(idx); }}
                                title="Quick Sync to other days"
                              >
                                <Link2 className="h-4 w-4" /> Quick Sync
                              </button>
                            )}
                            {isOpen && (
                              <button
                                type="button"
                                className={`rounded-xl p-2 transition ${isEditing ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                onClick={(e) => { e.stopPropagation(); setEditingDay(isEditing ? null : idx); }}
                                title={isEditing ? 'Done editing' : 'Edit schedule'}
                              >
                                {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {isOpen && isEditing && (
                          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                            {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                              <div key={`${r.day_of_week}-${j}`} className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm shadow-slate-100/60">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="time"
                                    className="w-[120px] cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    value={rg.start_time || '09:00'}
                                    onChange={(e) => updateRange(idx, j, { start_time: e.target.value })}
                                  />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">to</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    className="w-[120px] cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    value={rg.end_time || '17:00'}
                                    onChange={(e) => updateRange(idx, j, { end_time: e.target.value })}
                                  />
                                </div>
                                {j === 0 && (
                                  <div className="ml-1 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <input
                                      type="number"
                                      min={5}
                                      max={240}
                                      className="w-12 bg-transparent text-center text-sm font-bold text-slate-700 outline-none"
                                      value={r.slot_minutes}
                                      onChange={(e) => updateRow(idx, { slot_minutes: Number(e.target.value) })}
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400">min</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="ml-auto rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                                  onClick={() => removeRange(idx, j)}
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
                              onClick={() => addRange(idx)}
                            >
                              <Plus className="h-3 w-3" />
                              Add Time Range
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <section ref={unavailableSectionRef} className="surface-card overflow-hidden rounded-3xl border border-slate-200/80 bg-white flex-[2] min-w-0">
                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">Unavailable Date Ranges</h3>
                    <p className="mt-1 text-sm text-slate-500">Block dates when you're away to prevent bookings.</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    onClick={addUnavailable}
                  >
                    <Plus className="h-4 w-4" />
                    Add Date Range
                  </button>
                </div>

                <div className="px-6 pb-5">
                  {(!Array.isArray(unavailable) || unavailable.length === 0) && (
                    <div className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-500">
                      <Calendar className="h-4 w-4" />
                      No unavailable date ranges
                    </div>
                  )}

                  {Array.isArray(unavailable) && unavailable.length > 0 && (
                    <div className="space-y-3">
                      {unavailable.map((r, idx) => (
                        <div
                          key={`unavailable-${idx}`}
                          ref={(element) => {
                            unavailableCardRefs.current[idx] = element;
                          }}
                          className={`rounded-2xl border px-4 py-4 transition ${idx === highlightUnavailableIndex ? 'border-rose-200 bg-rose-50/70 shadow-sm' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Blocked Period {idx + 1}</span>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                              onClick={() => removeUnavailable(idx)}
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => setOpenDateRangeIdx(openDateRangeIdx === idx ? null : idx)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              {r.start_date && r.end_date
                                ? `${r.start_date} → ${r.end_date}`
                                : 'Select date range'}
                            </button>
                            {openDateRangeIdx === idx && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                                <DateRange
                                  ranges={[
                                    {
                                      startDate: ISOStringToDate(r.start_date),
                                      endDate: ISOStringToDate(r.end_date),
                                      key: 'selection',
                                    },
                                  ]}
                                  onChange={(item) => {
                                    const startStr = dateToISOString(item.selection.startDate);
                                    const endStr = dateToISOString(item.selection.endDate);
                                    updateUnavailable(idx, {
                                      start_date: startStr,
                                      end_date: endStr,
                                    });
                                  }}
                                  moveRangeOnFirstSelection={false}
                                  months={2}
                                  direction="horizontal"
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex justify-end pt-1">
              <DocButton
                onClick={save}
                disabled={saving}
                className="!rounded-2xl !bg-slate-900 !px-8 !py-3 !text-white hover:!bg-slate-800 disabled:!opacity-50"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </DocButton>
            </div>
          </>
        )}
      </div>

      {/* Quick Sync Modal */}
      {syncModal && (() => {
        const source = rows[syncModal.fromIdx];
        const selectedCount = syncModal.selectedDays.size;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setSyncModal(null)} />
            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl mx-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Quick Sync Schedule</h3>
                  <p className="mt-1 text-sm text-slate-500">Apply {DAY_LABELS[syncModal.fromIdx]}&apos;s schedule to other days</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Copying From */}
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Copying From</div>
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                  {Array.isArray(source.ranges) && source.ranges.map((rg, j) => (
                    <span key={j} className="flex items-center text-sm font-medium text-slate-700">
                      {formatTime12h(rg.start_time)} - {formatTime12h(rg.end_time)}
                      {j < source.ranges.length - 1 && (
                        <span className="ml-3 h-4 w-px bg-gray-300" />
                      )}
                    </span>
                  ))}
                  <span className="text-sm text-slate-400 ml-1">{source.slot_minutes}m slots</span>
                </div>
              </div>

              {/* Apply To */}
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Apply To</div>
                {/* Preset buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSyncPreset('weekdays')}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    All Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncPreset('weekend')}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Weekend
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncPreset('all')}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    All Days
                  </button>
                </div>
                {/* Day circles */}
                <div className="flex items-center justify-center gap-3">
                  {DAY_SHORT.map((letter, i) => {
                    const isSource = i === syncModal.fromIdx;
                    const isSelected = syncModal.selectedDays.has(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isSource}
                        onClick={() => toggleSyncDay(i)}
                        className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl text-xs font-semibold transition ${isSource
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#00acb1] text-white shadow-md'
                              : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                          }`}
                      >
                        <span className="text-sm font-bold leading-none">{letter}</span>
                        <span className="text-[10px] mt-0.5 leading-none">{DAY_ABBR[i]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSyncModal(null)}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applySyncModal}
                  disabled={selectedCount === 0}
                  className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedCount === 0 ? 'Select days' : `Apply to ${selectedCount} day${selectedCount > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DoctorLayout>
  );
}

