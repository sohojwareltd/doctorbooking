import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import { toastError, toastSuccess, toastWarning } from '../../utils/toast';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorSchedule({ schedule = [], unavailable_ranges = [] }) {
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
        body: JSON.stringify({ schedule: rows, unavailable_ranges: unavailable }),
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

  return (
    <DoctorLayout title="Schedule">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#005963]">Schedule</h1>
          <p className="mt-2 text-gray-600">Manage your availability and working hours</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Weekly Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <GlassCard variant="solid" className="border-2 border-[#005963]/20 bg-[#00acb1]/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#005963]">Days Open</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-black text-[#005963]">{weekStats.daysOpen}/7</div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="border-2 border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Time Ranges</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-black text-emerald-700">{weekStats.totalRanges}</div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="border-2 border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Avg Slot</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-black text-amber-700">{weekStats.avgSlot.toFixed(0)}m</div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="border-2 border-sky-200 bg-sky-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Unavailable</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-black text-sky-700">{weekStats.unavailableDays}</div>
            </div>
          </GlassCard>
        </div>
        {(success || warning || error) && (
          <GlassCard
            variant="solid"
            className={`p-4 ${
              success ? 'border-emerald-200 bg-emerald-50/60' : warning ? 'border-amber-200 bg-amber-50/60' : 'border-rose-200 bg-rose-50/60'
            }`}
          >
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : warning ? 'text-amber-800' : 'text-rose-800'}`}>
              {success || warning || error}
            </div>
          </GlassCard>
        )}

        <GlassCard variant="solid" className="border border-[#00acb1]/20 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold text-[#005963]">Unavailable Date Ranges</div>
              <div className="mt-1 text-sm text-gray-600">Block dates when you're away to prevent bookings.</div>
            </div>

            <button
              type="button"
              className="rounded-xl border border-[#00acb1] bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
              onClick={addUnavailable}
            >
              + Add Date Range
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {(!Array.isArray(unavailable) || unavailable.length === 0) && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                📅 No unavailable date ranges
              </div>
            )}

            {Array.isArray(unavailable) && unavailable.map((r, idx) => (
              <div key={`unavailable-${idx}`} className="flex flex-col gap-3 rounded-lg border border-[#00acb1]/20 bg-white p-4 md:flex-row md:items-center">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-600">From</span>
                    <input
                      type="date"
                      className="rounded-lg border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:ring-2 focus:ring-[#005963]/10"
                      value={r.start_date || ''}
                      onChange={(e) => updateUnavailable(idx, { start_date: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-600">To</span>
                    <input
                      type="date"
                      className="rounded-lg border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:ring-2 focus:ring-[#005963]/10"
                      value={r.end_date || ''}
                      onChange={(e) => updateUnavailable(idx, { end_date: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 transition"
                  onClick={() => removeUnavailable(idx)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {(success || warning || error) && (
          <>
            {success && (
              <GlassCard variant="solid" className="mb-3 border-emerald-200 bg-emerald-50/60 p-4">
                <div className="text-sm font-semibold text-emerald-800">{success}</div>
              </GlassCard>
            )}
            {warning && (
              <GlassCard variant="solid" className="mb-3 border-amber-200 bg-amber-50/60 p-4">
                <div className="text-sm font-semibold text-amber-800">{warning}</div>
              </GlassCard>
            )}
            {error && (
              <GlassCard variant="solid" className="mb-6 border-rose-200 bg-rose-50/60 p-4">
                <div className="text-sm font-semibold text-rose-800">{error}</div>
              </GlassCard>
            )}
          </>
        )}

        <div className="space-y-4">
          {rows.map((r, idx) => (
            <GlassCard key={r.day_of_week} variant="solid" className="border border-[#00acb1]/20 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-bold text-[#005963]">{DAY_LABELS[r.day_of_week]}</div>
                  <div className="mt-1 text-sm text-gray-600">Set consultation slot duration and time ranges.</div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#005963]">
                    <input
                      type="checkbox"
                      checked={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { is_closed: e.target.checked, ranges: e.target.checked ? [] : (r.ranges?.length ? r.ranges : [{ start_time: '09:00', end_time: '17:00' }]) })}
                      className="rounded"
                    />
                    Closed
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#005963]">Slot</span>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      className="w-24 rounded-lg border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:ring-2 focus:ring-[#005963]/10"
                      value={r.slot_minutes}
                      disabled={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { slot_minutes: Number(e.target.value) })}
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-[#00acb1] bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!!r.is_closed}
                    onClick={() => addRange(idx)}
                  >
                    + Add Time
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(!Array.isArray(r.ranges) || r.ranges.length === 0) && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                    {r.is_closed ? '🚫 Closed on this day' : '⏰ No time ranges added'}
                  </div>
                )}

                {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                  <div key={`${r.day_of_week}-${j}`} className="flex flex-col gap-3 rounded-lg border border-[#00acb1]/20 bg-white p-4 md:flex-row md:items-center">
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-600">Start</span>
                        <input
                          type="time"
                          className="rounded-lg border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:ring-2 focus:ring-[#005963]/10"
                          value={rg.start_time || '09:00'}
                          onChange={(e) => updateRange(idx, j, { start_time: e.target.value })}
                          disabled={!!r.is_closed}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-600">End</span>
                        <input
                          type="time"
                          className="rounded-lg border border-[#00acb1]/30 bg-white px-3 py-2 text-sm font-semibold text-[#005963] focus:border-[#005963] focus:ring-2 focus:ring-[#005963]/10"
                          value={rg.end_time || '17:00'}
                          onChange={(e) => updateRange(idx, j, { end_time: e.target.value })}
                          disabled={!!r.is_closed}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => removeRange(idx, j)}
                      disabled={!!r.is_closed}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <PrimaryButton onClick={save} disabled={saving} className="w-full md:w-auto">
            {saving ? 'Saving schedule...' : '💾 Save Schedule'}
          </PrimaryButton>
        </div>
      </div>
    </DoctorLayout>
  );
}

