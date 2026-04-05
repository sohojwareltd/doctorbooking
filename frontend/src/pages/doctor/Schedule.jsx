import { Head } from '@inertiajs/react';
import { useMemo, useState, useCallback } from 'react';
import { Calendar, Clock, RefreshCw, X, Link2, CalendarOff, Plus, Trash2, Pencil, ChevronDown, Check } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocCard, DocButton } from '../../components/doctor/DocUI';
import { toastError, toastSuccess, toastWarning } from '../../utils/toast';

const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5];
const WEEKEND_INDICES = [0, 6];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');

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
    setUnavailable((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next.push({ start_date: '', end_date: '' });
      return next;
    });
  };

  const updateUnavailable = (idx, patch) => {
    setUnavailable((prev) => (Array.isArray(prev) ? prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)) : prev));
  };

  const removeUnavailable = (idx) => {
    setUnavailable((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : prev));
  };

  const save = async () => {
    setSaving(true);
    setSuccess('');
    setWarning('');
    setError('');

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      if (!token) {
        const message = 'Missing CSRF token. Please refresh the page and try again.';
        setError(message);
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
          chamber_id: current_chamber_id,
          schedule: rows,
          unavailable_ranges: unavailable,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const successMessage = data?.message || 'Schedule saved.';
        setSuccess(successMessage);
        toastSuccess(successMessage);
        if (data?.warning) {
          setWarning(data.warning);
          toastWarning(data.warning);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message || 'Failed to save schedule.';
        setError(msg);
        toastError(msg);
      }
    } catch (e) {
      const message = 'Network error. Please try again.';
      setError(message);
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
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ─── GRADIENT BANNER ─── */}
        <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute left-10 top-14 h-28 w-28 rounded-full bg-white/8" />
          <div className="pointer-events-none absolute -right-14 -top-12 h-36 w-36 rounded-full bg-[#efba92]/12" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              {/* Left */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Manager
                </div>
                <h1 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">
                  Manage Schedule
                </h1>
                <p className="max-w-xl text-[13px] text-white/80">Configure weekly time slots, set durations, and block unavailable dates for each chamber.</p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {Array.isArray(chambers) && chambers.length > 0 && (
                    <select
                      className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 backdrop-blur-sm [&>option]:text-slate-800"
                      value={current_chamber_id ?? (chambers[0]?.id ?? '')}
                      onChange={(e) => { window.location.href = `/doctor/schedule?chamber_id=${e.target.value}`; }}
                    >
                      {chambers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={addUnavailable}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    <CalendarOff className="h-3.5 w-3.5" />
                    Add Vacation / Holiday
                  </button>
                </div>
              </div>

              {/* Right: metric tiles */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Days Open', value: `${weekStats.daysOpen}/7`, tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f2f6ff]' },
                  { label: 'Time Ranges', value: weekStats.totalRanges, tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#ffe6d3]' },
                  { label: 'Avg Slot', value: `${weekStats.avgSlot.toFixed(0)}m`, tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#eaf0ff]' },
                  { label: 'Unavailable', value: weekStats.unavailableDays, tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#ffe3cf]' },
                ].map((m) => (
                  <div key={m.label} className={`rounded-lg border px-2.5 py-2 ${m.tone}`}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.11em]">{m.label}</div>
                    <div className="mt-1 text-lg font-black leading-none">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocCard>

        {/* No chambers message */}
        {(!Array.isArray(chambers) || chambers.length === 0) && (
          <DocCard>
            <p className="text-sm text-slate-700">
              You don&apos;t have any chambers yet. Please create a chamber first from the{' '}
              <a href="/doctor/chambers" className="font-semibold text-sky-600 underline underline-offset-2">Chambers</a>{' '}
              page, then return here to configure its schedule.
            </p>
          </DocCard>
        )}

        {Array.isArray(chambers) && chambers.length > 0 && (
          <div className="space-y-6">
            {/* Messages */}
            {(success || warning || error) && (
              <div className={`rounded-xl border p-4 ${
                success ? 'border-emerald-200 bg-emerald-50' : warning ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'
              }`}>
                <div className={`text-sm font-semibold ${
                  success ? 'text-emerald-800' : warning ? 'text-amber-800' : 'text-rose-800'
                }`}>
                  {success || warning || error}
                </div>
              </div>
            )}

            {/* ─── Two Column Layout: Weekly Schedule + Unavailable ─── */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">

              {/* LEFT: Weekly Schedule */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Weekly Schedule</h2>
                  <span className="text-[10px] font-semibold text-slate-400">{weekStats.daysOpen} of 7 days open</span>
                </div>
                {rows.map((r, idx) => {
                  const isEditing = editingDay === idx;
                  const isOpen = !r.is_closed;
                  const rangeCount = Array.isArray(r.ranges) ? r.ranges.length : 0;

                  return (
                    <DocCard key={r.day_of_week} padding={false} className={`transition-all ${isEditing ? 'ring-2 ring-sky-200' : ''}`}>
                      {/* ── Compact header strip ── */}
                      <div
                        className={`flex items-center gap-3 px-4 py-3 ${r.is_closed ? 'bg-rose-50/50' : isEditing ? 'bg-sky-50/50' : 'bg-white'} ${isOpen ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                        onClick={() => { if (isOpen) setEditingDay(isEditing ? null : idx); }}
                      >
                        {/* Toggle */}
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
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
                            isOpen ? 'bg-sky-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOpen ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                        </button>

                        {/* Day initial circle + name */}
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          r.is_closed ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white'
                        }`}>
                          {DAY_SHORT[r.day_of_week]}
                        </div>
                        <span className={`text-sm font-semibold min-w-[72px] ${r.is_closed ? 'text-slate-400' : 'text-slate-800'}`}>
                          {DAY_LABELS[r.day_of_week]}
                        </span>

                        {/* Closed badge */}
                        {r.is_closed && (
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">Closed</span>
                        )}

                        {/* Collapsed: time pills */}
                        {isOpen && !isEditing && (
                          <div className="flex flex-1 flex-wrap items-center gap-1.5">
                            {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                              <span key={j} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-100">
                                <Clock className="h-2.5 w-2.5" />
                                {formatTime12h(rg.start_time)} – {formatTime12h(rg.end_time)}
                              </span>
                            ))}
                            {rangeCount > 0 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{r.slot_minutes}m</span>
                            )}
                            {rangeCount === 0 && (
                              <span className="text-[11px] italic text-slate-400">No time ranges</span>
                            )}
                          </div>
                        )}

                        {isEditing && <div className="flex-1" />}

                        {/* Right side action icons */}
                        <div className="flex items-center gap-1 ml-auto">
                          {isOpen && rangeCount > 0 && (
                            <button
                              type="button"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition"
                              onClick={(e) => { e.stopPropagation(); openSyncModal(idx); }}
                              title="Quick Sync to other days"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isOpen && (
                            <button
                              type="button"
                              className={`rounded-md p-1.5 transition ${isEditing ? 'bg-sky-500 text-white hover:bg-sky-600' : 'text-slate-400 hover:bg-sky-50 hover:text-sky-600'}`}
                              onClick={(e) => { e.stopPropagation(); setEditingDay(isEditing ? null : idx); }}
                              title={isEditing ? 'Done editing' : 'Edit schedule'}
                            >
                              {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── Expanded editing area ── */}
                      {isOpen && isEditing && (
                        <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-3 space-y-2.5">
                          {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                            <div key={`${r.day_of_week}-${j}`} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-sky-400" />
                                <input
                                  type="time"
                                  className="w-[120px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm cursor-pointer transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none hover:border-slate-400"
                                  value={rg.start_time || '09:00'}
                                  onChange={(e) => updateRange(idx, j, { start_time: e.target.value })}
                                />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">to</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  className="w-[120px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm cursor-pointer transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none hover:border-slate-400"
                                  value={rg.end_time || '17:00'}
                                  onChange={(e) => updateRange(idx, j, { end_time: e.target.value })}
                                />
                              </div>
                              {j === 0 && (
                                <div className="flex items-center gap-1.5 ml-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1">
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
                                className="ml-auto rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition"
                                onClick={() => removeRange(idx, j)}
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50/50 transition"
                            onClick={() => addRange(idx)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Time Range
                          </button>
                        </div>
                      )}
                    </DocCard>
                  );
                })}
              </div>

              {/* RIGHT: Unavailable Date Ranges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Unavailable Dates</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 transition"
                    onClick={addUnavailable}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>

                <DocCard padding={false}>
                  <div className="p-4 space-y-3">
                    {(!Array.isArray(unavailable) || unavailable.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 mb-2">
                          <Calendar className="h-5 w-5 text-sky-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No blocked dates</p>
                        <p className="text-xs text-slate-400 mt-0.5">Add vacation or holiday dates</p>
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-sky-300 hover:text-sky-600 transition"
                          onClick={addUnavailable}
                        >
                          <Plus className="h-3 w-3" />
                          Add Date Range
                        </button>
                      </div>
                    )}
                    {Array.isArray(unavailable) && unavailable.length > 0 && unavailable.map((r, idx) => (
                      <div key={`unavailable-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <CalendarOff className="h-3 w-3" />
                            Blocked Period {idx + 1}
                          </span>
                          <button
                            type="button"
                            className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition"
                            onClick={() => removeUnavailable(idx)}
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-[10px] font-bold uppercase tracking-wider text-slate-400">From</span>
                            <input
                              type="date"
                              className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                              value={r.start_date || ''}
                              onChange={(e) => updateUnavailable(idx, { start_date: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-[10px] font-bold uppercase tracking-wider text-slate-400">To</span>
                            <input
                              type="date"
                              className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none"
                              value={r.end_date || ''}
                              onChange={(e) => updateUnavailable(idx, { end_date: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DocCard>
              </div>

            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <DocButton
                onClick={save}
                disabled={saving}
                className="!bg-sky-600 !px-8 !py-3 !text-white hover:!bg-sky-700 disabled:!opacity-50"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </DocButton>
            </div>
          </div>
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
                        className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl text-xs font-semibold transition ${
                          isSource
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

