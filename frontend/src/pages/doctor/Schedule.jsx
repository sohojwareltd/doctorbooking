import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorSchedule({ schedule = [] }) {
  const initial = useMemo(() => {
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return DAY_LABELS.map((_, day_of_week) => ({
        day_of_week,
        is_closed: day_of_week === 0,
        start_time: '09:00',
        end_time: '17:00',
        slot_minutes: 30,
      }));
    }
    return schedule;
  }, [schedule]);

  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
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
        <h1 className="mb-2 text-3xl font-bold text-[#005963]">Schedule</h1>
        <p className="mb-6 text-sm text-gray-600">Set your working hours and slot duration. Public booking will use this schedule.</p>

        {(success || error) && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${success ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {success || error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Closed</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Slot (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, idx) => (
                <tr key={r.day_of_week} className="bg-white">
                  <td className="px-4 py-3 text-sm">{DAY_LABELS[r.day_of_week]}</td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { is_closed: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="time"
                      className="rounded border px-2 py-1 text-sm"
                      value={r.start_time || '09:00'}
                      disabled={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { start_time: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="time"
                      className="rounded border px-2 py-1 text-sm"
                      value={r.end_time || '17:00'}
                      disabled={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { end_time: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      className="w-24 rounded border px-2 py-1 text-sm"
                      value={r.slot_minutes}
                      disabled={!!r.is_closed}
                      onChange={(e) => updateRow(idx, { slot_minutes: Number(e.target.value) })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <button
            className="rounded-xl bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </>
  );
}

DoctorSchedule.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
