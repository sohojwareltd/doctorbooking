import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';

export default function CreatePrescription({ appointments = [] }) {
  const { url } = usePage();
  const queryAppointmentId = useMemo(() => {
    try {
      const u = new URL(url, window.location.origin);
      const q = u.searchParams.get('appointment_id');
      return q ? Number(q) : null;
    } catch {
      return null;
    }
  }, [url]);

  const [form, setForm] = useState({
    appointment_id: queryAppointmentId && appointments.some(a => a.id === queryAppointmentId) ? queryAppointmentId : (appointments[0]?.id ?? ''),
    diagnosis: '',
    medications: '',
    instructions: '',
    tests: '',
    next_visit_date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const selectedAppointment = useMemo(
    () => appointments.find(a => a.id === Number(form.appointment_id)),
    [appointments, form.appointment_id]
  );

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');

    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const res = await fetch('/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...form,
          appointment_id: Number(form.appointment_id),
          next_visit_date: form.next_visit_date || null,
          instructions: form.instructions || null,
          tests: form.tests || null,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSuccess(data?.message || 'Prescription created.');
        setTimeout(() => router.visit('/doctor/prescriptions'), 500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Failed to create prescription.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head title="Create Prescription" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Create Prescription</h1>
            <p className="mt-1 text-sm text-gray-700">Select an appointment and write the prescription details.</p>
          </div>
          <Link href="/doctor/prescriptions" className="text-sm font-semibold text-[#005963] hover:underline">Back</Link>
        </div>

        {(success || error) && (
          <GlassCard variant="solid" className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <GlassCard variant="solid" className="p-6">
          {appointments.length === 0 ? (
            <div className="text-sm text-gray-700">
              No eligible appointments found (only approved/completed without a prescription are shown).
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#005963]">Appointment</label>
                <select
                  className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                  value={form.appointment_id}
                  onChange={(e) => setForm((p) => ({ ...p, appointment_id: e.target.value }))}
                  disabled={submitting}
                >
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.user?.name || a.user_id} — {a.appointment_date} {a.appointment_time} ({a.status})
                    </option>
                  ))}
                </select>
                {selectedAppointment && (
                  <p className="mt-2 text-xs text-gray-600">
                    Patient: <span className="font-semibold">{selectedAppointment.user?.name || selectedAppointment.user_id}</span>
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Diagnosis</label>
                  <textarea
                    className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                    rows={3}
                    value={form.diagnosis}
                    onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Medications</label>
                  <textarea
                    className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                    rows={4}
                    value={form.medications}
                    onChange={(e) => setForm((p) => ({ ...p, medications: e.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Next Visit Date (optional)</label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                    value={form.next_visit_date}
                    onChange={(e) => setForm((p) => ({ ...p, next_visit_date: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Instructions (optional)</label>
                  <textarea
                    className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                    rows={3}
                    value={form.instructions}
                    onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#005963]">Tests (optional)</label>
                  <textarea
                    className="w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm"
                    rows={3}
                    value={form.tests}
                    onChange={(e) => setForm((p) => ({ ...p, tests: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Prescription'}
                </PrimaryButton>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </>
  );
}

CreatePrescription.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
