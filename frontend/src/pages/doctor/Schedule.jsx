import { Head } from '@inertiajs/react';
import { useMemo, useState, useCallback } from 'react';
import { Calendar, Clock, RefreshCw, X, Link2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
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
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Schedule</h1>
            <div className="mt-2 flex flex-wrap items-center gap-5 text-[11px] text-gray-400 uppercase tracking-wider font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Days Open <span className="font-bold text-gray-600 ml-0.5">{weekStats.daysOpen}/7</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Time Ranges <span className="font-bold text-gray-600 ml-0.5">{weekStats.totalRanges}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Avg Slot <span className="font-bold text-gray-600 ml-0.5">{weekStats.avgSlot.toFixed(0)}m</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Unavailable <span className="font-bold text-gray-600 ml-0.5">{weekStats.unavailableDays}</span>
              </span>
            </div>
          </div>
          {Array.isArray(chambers) && chambers.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                value={current_chamber_id ?? (chambers[0]?.id ?? '')}
                onChange={(e) => { window.location.href = `/doctor/schedule?chamber_id=${e.target.value}`; }}
              >
                {chambers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addUnavailable}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
              >
                Add Vacation / Holiday
              </button>
            </div>
          )}
        </div>

        {/* No chambers message */}
        {(!Array.isArray(chambers) || chambers.length === 0) && (
          <div className="rounded-xl bg-white border border-gray-100 p-6">
            <p className="text-sm text-gray-700">
              You don&apos;t have any chambers yet. Please create a chamber first from the{' '}
              <a href="/doctor/chambers" className="font-semibold text-[#005963] underline underline-offset-2">Chambers</a>{' '}
              page, then return here to configure its schedule.
            </p>
          </div>
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

            {/* Unavailable Date Ranges */}
            <div className="rounded-xl bg-white border border-gray-100 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Unavailable Date Ranges</h2>
                  <p className="mt-0.5 text-sm text-gray-500">Block dates when you&apos;re away to prevent bookings.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
                  onClick={addUnavailable}
                >
                  + Add Date Range
                </button>
              </div>
              <div className="mt-4">
                {(!Array.isArray(unavailable) || unavailable.length === 0) && (
                  <div className="flex items-center gap-2 rounded-lg bg-[#e8fafb] px-4 py-3 text-sm text-[#007a7e]">
                    <Calendar className="h-4 w-4" />
                    No unavailable date ranges
                  </div>
                )}
                {Array.isArray(unavailable) && unavailable.length > 0 && (
                  <div className="space-y-3">
                    {unavailable.map((r, idx) => (
                      <div key={`unavailable-${idx}`} className="flex flex-col gap-3 md:flex-row md:items-center rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-gray-500">From</span>
                            <input
                              type="date"
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                              value={r.start_date || ''}
                              onChange={(e) => updateUnavailable(idx, { start_date: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-gray-500">To</span>
                            <input
                              type="date"
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                              value={r.end_date || ''}
                              onChange={(e) => updateUnavailable(idx, { end_date: e.target.value })}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-sm font-medium text-rose-600 hover:text-rose-800 transition"
                          onClick={() => removeUnavailable(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Day Schedule Rows */}
            <div className="rounded-xl bg-white border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {rows.map((r, idx) => {
                const isEditing = editingDay === idx;
                const isOpen = !r.is_closed;

                return (
                  <div
                    key={r.day_of_week}
                    className={`px-6 py-5 transition-colors ${r.is_closed ? 'bg-rose-50/60' : 'bg-white'}`}
                  >
                    {/* Day header row */}
                    <div className="flex items-center gap-4">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const newClosed = !r.is_closed;
                          updateRow(idx, {
                            is_closed: newClosed,
                            ranges: newClosed ? [] : (r.ranges?.length ? r.ranges : [{ start_time: '09:00', end_time: '17:00' }]),
                          });
                          if (newClosed && editingDay === idx) setEditingDay(null);
                        }}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
                          isOpen ? 'bg-[#00acb1]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            isOpen ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Day name */}
                      <span
                        className={`text-sm font-semibold min-w-[90px] ${r.is_closed ? 'text-gray-400' : 'text-gray-900'} ${isOpen && !isEditing ? 'cursor-pointer hover:text-[#005963]' : ''}`}
                        onClick={() => { if (isOpen && !isEditing) setEditingDay(idx); }}
                      >
                        {DAY_LABELS[r.day_of_week]}
                      </span>

                      {/* CLOSED badge */}
                      {r.is_closed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-600 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Closed
                        </span>
                      )}

                      {/* Collapsed view: time range badges */}
                      {isOpen && !isEditing && (
                        <div
                          className="flex flex-1 flex-wrap items-center gap-2 cursor-pointer"
                          onClick={() => setEditingDay(idx)}
                        >
                          {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                            <span
                              key={j}
                              className="rounded-md bg-[#1e3a5f] px-3 py-1 text-xs font-semibold text-white"
                            >
                              {formatTime12h(rg.start_time)} - {formatTime12h(rg.end_time)}
                            </span>
                          ))}
                          {Array.isArray(r.ranges) && r.ranges.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                              <Clock className="h-3 w-3" />
                              {r.slot_minutes}m slots
                            </span>
                          )}
                          {(!Array.isArray(r.ranges) || r.ranges.length === 0) && (
                            <span className="text-xs text-gray-400 italic">Click to add time ranges</span>
                          )}
                        </div>
                      )}

                      {/* Quick Sync button - visible in both collapsed & editing */}
                      {isOpen && isEditing && <div className="flex-1" />}
                      {isOpen && Array.isArray(r.ranges) && r.ranges.length > 0 && (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs font-medium text-[#00acb1] hover:text-[#005963] transition whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); openSyncModal(idx); }}
                          title="Copy this day's schedule to other days"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Quick Sync
                        </button>
                      )}
                    </div>

                    {/* Expanded: editing time ranges */}
                    {isOpen && isEditing && (
                      <div className="mt-4 ml-16 space-y-3">
                        {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                          <div key={`${r.day_of_week}-${j}`} className="flex flex-wrap items-center gap-3">
                            <input
                              type="time"
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                              value={rg.start_time || '09:00'}
                              onChange={(e) => updateRange(idx, j, { start_time: e.target.value })}
                            />
                            <span className="text-sm text-gray-400">to</span>
                            <input
                              type="time"
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                              value={rg.end_time || '17:00'}
                              onChange={(e) => updateRange(idx, j, { end_time: e.target.value })}
                            />
                            {j === 0 && (
                              <>
                                <Clock className="h-4 w-4 text-gray-400 ml-2" />
                                <input
                                  type="number"
                                  min={5}
                                  max={240}
                                  className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 text-center focus:border-[#00acb1] focus:ring-1 focus:ring-[#00acb1] focus:outline-none"
                                  value={r.slot_minutes}
                                  onChange={(e) => updateRow(idx, { slot_minutes: Number(e.target.value) })}
                                />
                                <span className="text-sm text-gray-500">min</span>
                              </>
                            )}
                            <button
                              type="button"
                              className="ml-1 text-lg font-bold text-rose-400 hover:text-rose-600 transition leading-none"
                              onClick={() => removeRange(idx, j)}
                              title="Remove this time range"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-4 pt-1">
                          <button
                            type="button"
                            className="text-sm font-medium text-[#00acb1] hover:text-[#005963] transition"
                            onClick={() => addRange(idx)}
                          >
                            + Add Time Range
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                            onClick={() => setEditingDay(null)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-[#00acb1] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#009a9e] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
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
                  <h3 className="text-xl font-bold text-gray-900">Quick Sync Schedule</h3>
                  <p className="mt-1 text-sm text-gray-500">Apply {DAY_LABELS[syncModal.fromIdx]}&apos;s schedule to other days</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncModal(null)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Copying From */}
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Copying From</div>
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  {Array.isArray(source.ranges) && source.ranges.map((rg, j) => (
                    <span key={j} className="flex items-center text-sm font-medium text-gray-700">
                      {formatTime12h(rg.start_time)} - {formatTime12h(rg.end_time)}
                      {j < source.ranges.length - 1 && (
                        <span className="ml-3 h-4 w-px bg-gray-300" />
                      )}
                    </span>
                  ))}
                  <span className="text-sm text-gray-400 ml-1">{source.slot_minutes}m slots</span>
                </div>
              </div>

              {/* Apply To */}
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Apply To</div>
                {/* Preset buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSyncPreset('weekdays')}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    All Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncPreset('weekend')}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Weekend
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncPreset('all')}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
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
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSyncModal(null)}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applySyncModal}
                  disabled={selectedCount === 0}
                  className="rounded-lg bg-[#00acb1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#009a9e] transition disabled:opacity-40 disabled:cursor-not-allowed"
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

