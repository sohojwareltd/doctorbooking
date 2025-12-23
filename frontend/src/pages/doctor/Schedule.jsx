import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorSchedule({ schedule = [] }) {
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

  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
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

  const save = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch('/doctor/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify({ schedule: rows }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSuccess(data?.message || 'Schedule saved.');
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message || 'Failed to save schedule.';
        setError(msg);
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head title="Schedule" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-[#005963]">Schedule</h1>
          <p className="text-sm text-gray-700">Add one or more working time ranges for each day. Public booking uses this schedule.</p>
        </div>

        {(success || error) && (
          <GlassCard variant="solid" className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <div className="space-y-4">
          {rows.map((r, idx) => (
            <GlassCard key={r.day_of_week} variant="solid" className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-extrabold text-[#005963]">{DAY_LABELS[r.day_of_week]}</div>
                  <div className="mt-1 text-sm text-gray-600">Set slot minutes and add multiple time ranges.</div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#005963]">
                    <input
                      type="checkbox"
                      checked={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { is_closed: e.target.checked, ranges: e.target.checked ? [] : (r.ranges?.length ? r.ranges : [{ start_time: '09:00', end_time: '17:00' }]) })}
                    />
                    Closed
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#005963]">Slot</span>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      className="w-24 rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm"
                      value={r.slot_minutes}
                      disabled={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { slot_minutes: Number(e.target.value) })}
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-sm font-semibold text-[#005963] disabled:opacity-50"
                    disabled={!!r.is_closed}
                    onClick={() => addRange(idx)}
                  >
                    + Add Time Range
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(!Array.isArray(r.ranges) || r.ranges.length === 0) && (
                  <div className="rounded-2xl border border-dashed border-[#00acb1]/30 bg-white/40 px-4 py-4 text-sm text-gray-600">
                    {r.is_closed ? 'Closed for this day.' : 'No time ranges added yet.'}
                  </div>
                )}

                {Array.isArray(r.ranges) && r.ranges.map((rg, j) => (
                  <div key={`${r.day_of_week}-${j}`} className="flex flex-col gap-3 rounded-2xl border border-[#00acb1]/20 bg-white p-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#005963]">Start</span>
                        <input
                          type="time"
                          className="rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm"
                          value={rg.start_time || '09:00'}
                          onChange={(e) => updateRange(idx, j, { start_time: e.target.value })}
                          disabled={!!r.is_closed}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#005963]">End</span>
                        <input
                          type="time"
                          className="rounded-xl border border-[#00acb1]/30 bg-white px-3 py-2 text-sm"
                          value={rg.end_time || '17:00'}
                          onChange={(e) => updateRange(idx, j, { end_time: e.target.value })}
                          disabled={!!r.is_closed}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50"
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

        <div className="mt-6">
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Schedule'}
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}

DoctorSchedule.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
