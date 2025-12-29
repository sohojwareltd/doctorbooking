import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useReducer, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import { toastError, toastSuccess } from '../../utils/toast';

const COMMON_TESTS = [
  'CBC',
  'ESR',
  'CRP',
  'RBS',
  'HbA1c',
  'Serum Creatinine',
  'LFT',
  'Lipid Profile',
  'Urine R/E',
  'ECG',
  'X-ray',
  'USG',
];

const MEDICINE_SUGGESTIONS = [
  'Paracetamol',
  'Omeprazole',
  'Esomeprazole',
  'Cefixime',
  'Azithromycin',
  'Metformin',
  'Amlodipine',
  'Losartan',
  'Cetirizine',
  'Montelukast',
  'Salbutamol',
];

const emptyComplaint = () => ({ description: '', duration: '' });
const emptyMedicine = () => ({ name: '', strength: '', dosage: '', duration: '', instruction: 'After meal' });

const todayYmd = () => new Date().toISOString().split('T')[0];

function formatDisplayDate(ymd) {
  if (!ymd) return '';
  const parts = String(ymd).split('-');
  if (parts.length !== 3) return '';
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  const fmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  });
  return fmt.format(date);
}

const initialState = {
  patient: {
    name: '',
    age_value: '',
    age_unit: 'years',
    gender: '',
    weight: '',
    contact: '',
  },
  visit: {
    date: todayYmd(),
    type: 'New',
  },
  complaints: [emptyComplaint()],
  exam: {
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
    notes: '',
  },
  diagnosis: {
    provisional: '',
    final: '',
  },
  medicines: [emptyMedicine()],
  investigations: {
    common: Object.fromEntries(COMMON_TESTS.map((t) => [t, false])),
    custom: [''],
  },
  advice: {
    lifestyle: '',
    diet_rest: '',
  },
  follow_up: {
    date: '',
    emergency_note: 'If symptoms worsen or persist, seek emergency care immediately.',
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'setField': {
      const { path, value } = action;
      const [section, key] = path;
      return {
        ...state,
        [section]: {
          ...state[section],
          [key]: value,
        },
      };
    }
    case 'setNestedField': {
      const { path, value } = action;
      const [section, sub, key] = path;
      return {
        ...state,
        [section]: {
          ...state[section],
          [sub]: {
            ...state[section][sub],
            [key]: value,
          },
        },
      };
    }
    case 'setArrayItem': {
      const { path, index, patch } = action;
      const [section] = path;
      const arr = Array.isArray(state[section]) ? state[section] : [];
      return {
        ...state,
        [section]: arr.map((it, i) => (i === index ? { ...it, ...patch } : it)),
      };
    }
    case 'addArrayItem': {
      const { section, item } = action;
      const arr = Array.isArray(state[section]) ? state[section] : [];
      return {
        ...state,
        [section]: [...arr, item],
      };
    }
    case 'removeArrayItem': {
      const { section, index, min = 1 } = action;
      const arr = Array.isArray(state[section]) ? state[section] : [];
      const next = arr.filter((_, i) => i !== index);
      return {
        ...state,
        [section]: next.length >= min ? next : arr,
      };
    }
    case 'toggleCommonTest': {
      const { testName } = action;
      return {
        ...state,
        investigations: {
          ...state.investigations,
          common: {
            ...state.investigations.common,
            [testName]: !state.investigations.common[testName],
          },
        },
      };
    }
    case 'setCustomTest': {
      const { index, value } = action;
      const next = [...(state.investigations.custom || [])];
      next[index] = value;
      return {
        ...state,
        investigations: {
          ...state.investigations,
          custom: next,
        },
      };
    }
    case 'addCustomTest': {
      return {
        ...state,
        investigations: {
          ...state.investigations,
          custom: [...(state.investigations.custom || []), ''],
        },
      };
    }
    case 'removeCustomTest': {
      const { index } = action;
      const next = (state.investigations.custom || []).filter((_, i) => i !== index);
      return {
        ...state,
        investigations: {
          ...state.investigations,
          custom: next.length ? next : [''],
        },
      };
    }
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

export default function CreatePrescription({ appointments = [] }) {
  const page = usePage();
  const authUser = page?.props?.auth?.user;
  const doctorInfo = useMemo(
    () => ({
      name: authUser?.name || 'Doctor',
      qualification: 'MBBS',
      specialization: 'General Practice',
      bmdc: 'BMDC-XXXXXX',
      clinic: 'Clinic Name',
    }),
    [authUser]
  );

  const [state, dispatch] = useReducer(reducer, initialState);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [appointmentId, setAppointmentId] = useState(() => {
    const url = page?.url;
    try {
      if (url) {
        const u = new URL(url, window.location.origin);
        const q = u.searchParams.get('appointment_id');
        const id = q ? Number(q) : null;
        if (id && (appointments || []).some((a) => a.id === id)) {
          return String(id);
        }
      }
    } catch {
      // ignore
    }

    const first = appointments?.[0]?.id;
    return first ? String(first) : '';
  });

  const selectedAppointment = useMemo(() => {
    const id = Number(appointmentId);
    if (!id) return null;
    return (appointments || []).find((a) => a.id === id) || null;
  }, [appointments, appointmentId]);

  const appointmentDateLabel = useMemo(
    () => formatDisplayDate(selectedAppointment?.appointment_date),
    [selectedAppointment?.appointment_date]
  );

  const visitDateLabel = useMemo(() => formatDisplayDate(state.visit.date), [state.visit.date]);
  const followUpDateLabel = useMemo(() => formatDisplayDate(state.follow_up.date), [state.follow_up.date]);

  const inputClass = 'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20';
  const labelClass = 'mb-2 block text-sm font-semibold text-[#005963]';
  const helperClass = 'mt-1 text-xs text-gray-600';
  const errorClass = 'mt-1 text-xs font-semibold text-rose-700';
  const sectionTitleClass = 'text-lg font-extrabold text-[#005963]';
  const sectionSubClass = 'mt-1 text-xs text-gray-600';
  const chipClass = 'inline-flex items-center gap-2 rounded-full border border-[#00acb1]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#005963]';

  const buildDiagnosisText = () => {
    const lines = [];

    const cc = (state.complaints || [])
      .map((c) => {
        const desc = String(c.description || '').trim();
        const dur = String(c.duration || '').trim();
        if (!desc && !dur) return null;
        return dur ? `${desc} (${dur})` : desc;
      })
      .filter(Boolean);
    if (cc.length) {
      lines.push('Chief Complaints:');
      cc.forEach((x) => lines.push(`- ${x}`));
      lines.push('');
    }

    const prov = String(state.diagnosis.provisional || '').trim();
    const fin = String(state.diagnosis.final || '').trim();
    if (prov) lines.push(`Provisional Diagnosis: ${prov}`);
    if (fin) lines.push(`Final Diagnosis: ${fin}`);

    const vitals = [];
    if (String(state.exam.bp || '').trim()) vitals.push(`BP ${String(state.exam.bp).trim()}`);
    if (String(state.exam.pulse || '').trim()) vitals.push(`Pulse ${String(state.exam.pulse).trim()}`);
    if (String(state.exam.temperature || '').trim()) vitals.push(`Temp ${String(state.exam.temperature).trim()}`);
    if (String(state.exam.spo2 || '').trim()) vitals.push(`SpO₂ ${String(state.exam.spo2).trim()}`);
    if (vitals.length) lines.push(`Vitals: ${vitals.join(', ')}`);
    if (String(state.exam.notes || '').trim()) lines.push(`Exam Notes: ${String(state.exam.notes).trim()}`);

    const meta = [];
    if (String(state.patient.age_value || '').trim()) meta.push(`Age ${String(state.patient.age_value).trim()} ${state.patient.age_unit}`);
    if (String(state.patient.gender || '').trim()) meta.push(`Gender ${String(state.patient.gender).trim()}`);
    if (String(state.patient.weight || '').trim()) meta.push(`Weight ${String(state.patient.weight).trim()} kg`);
    if (meta.length) lines.unshift(meta.join(' | '));

    return lines.join('\n').trim();
  };

  const buildMedicationsText = () => {
    const meds = (state.medicines || [])
      .map((m) => {
        const name = String(m.name || '').trim();
        if (!name) return null;
        const strength = String(m.strength || '').trim();
        const dosage = String(m.dosage || '').trim();
        const duration = String(m.duration || '').trim();
        const instruction = String(m.instruction || '').trim();
        const parts = [name];
        if (strength) parts.push(strength);
        const details = [];
        if (dosage) details.push(dosage);
        if (duration) details.push(duration);
        if (instruction) details.push(instruction);
        if (details.length) parts.push(`— ${details.join(' — ')}`);
        return parts.join(' ');
      })
      .filter(Boolean);
    return meds.join('\n').trim();
  };

  const buildTestsText = () => {
    const common = Object.entries(state.investigations.common || {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);
    const custom = (state.investigations.custom || []).map((t) => String(t || '').trim()).filter(Boolean);
    return [...common, ...custom].join('\n').trim();
  };

  const buildInstructionsText = () => {
    const lines = [];
    const lifestyle = String(state.advice.lifestyle || '').trim();
    const diet = String(state.advice.diet_rest || '').trim();
    const emergency = String(state.follow_up.emergency_note || '').trim();
    if (lifestyle) {
      lines.push('Lifestyle Advice:');
      lines.push(lifestyle);
      lines.push('');
    }
    if (diet) {
      lines.push('Diet / Rest:');
      lines.push(diet);
      lines.push('');
    }
    if (emergency) {
      lines.push('Emergency Note:');
      lines.push(emergency);
    }
    return lines.join('\n').trim();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!selectedAppointment?.id) {
      const message = 'Please select an appointment first.';
      setError(message);
      toastError(message);
      return;
    }

    const diagnosisText = buildDiagnosisText();
    const medicationsText = buildMedicationsText();
    const testsText = buildTestsText();
    const instructionsText = buildInstructionsText();

    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    setSubmitting(true);
    try {
      const res = await fetch('/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          diagnosis: diagnosisText,
          medications: medicationsText,
          instructions: instructionsText || null,
          tests: testsText || null,
          next_visit_date: state.follow_up.date || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.message ||
          (data?.errors ? Object.values(data.errors).flat().join(' ') : null) ||
          'Failed to save prescription.';
        setError(msg);
        toastError(msg);
        return;
      }

      setSuccess('Prescription saved successfully. Redirecting…');
      toastSuccess('Prescription saved successfully.');
      setTimeout(() => router.visit('/doctor/prescriptions'), 400);
    } catch {
      const message = 'Network error. Please try again.';
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head title="Create Prescription" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-[#00acb1]/20 bg-white/60 p-2">
              <FilePlus2 className="h-6 w-6 text-[#005963]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#005963]">Create Prescription</h1>
              <p className="mt-1 text-sm text-gray-700">Fast, touch-friendly prescription form for patient visits.</p>
            {visitDateLabel && (
              <div className="mt-3">
                <span className={chipClass}>
                  Visit: <span className="text-gray-700">{visitDateLabel}</span>
                </span>
                {selectedAppointment && appointmentDateLabel && (
                  <span className={`ml-2 ${chipClass}`}>
                    Appt: <span className="text-gray-700">#{selectedAppointment.id} — {appointmentDateLabel} {selectedAppointment.appointment_time}</span>
                  </span>
                )}
                {followUpDateLabel && (
                  <span className={`ml-2 ${chipClass}`}>
                    Follow-up: <span className="text-gray-700">{followUpDateLabel}</span>
                  </span>
                )}
              </div>
            )}
            </div>
          </div>
          <Link href="/doctor/prescriptions" className="text-sm font-semibold text-[#005963] hover:underline">Back</Link>
        </div>

        {(success || error) && (
          <GlassCard
            variant="solid"
            className={`mb-6 p-4 ${success ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}
          >
            <div className={`text-sm font-semibold ${success ? 'text-emerald-800' : 'text-rose-800'}`}>{success || error}</div>
          </GlassCard>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Appointment (dynamic) */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className={sectionTitleClass}>Appointment</div>
                <div className={sectionSubClass}>Pick an appointment to auto-fill patient name and visit date.</div>
              </div>
              {selectedAppointment && appointmentDateLabel && (
                <span className={chipClass}>
                  {appointmentDateLabel} <span className="text-gray-700">{selectedAppointment.appointment_time}</span>
                </span>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-[#00acb1]/20 bg-white p-4 text-sm text-gray-700">
                No eligible appointments found (approved/completed without a prescription).
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Select Appointment</label>
                  <select
                    className={inputClass}
                    value={appointmentId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAppointmentId(next);

                      const appt = (appointments || []).find((a) => a.id === Number(next));
                      if (appt?.user?.name) {
                        dispatch({ type: 'setField', path: ['patient', 'name'], value: appt.user.name });
                      }
                      if (appt?.appointment_date) {
                        dispatch({ type: 'setField', path: ['visit', 'date'], value: appt.appointment_date });
                      }
                    }}
                  >
                    {(appointments || []).map((a) => {
                      const label = formatDisplayDate(a.appointment_date);
                      const patientName = a.user?.name || `User #${a.user_id}`;
                      return (
                        <option key={a.id} value={a.id}>
                          #{a.id} — {patientName} — {label} {a.appointment_time}
                        </option>
                      );
                    })}
                  </select>
                  <div className={helperClass}>Changing appointment updates patient name + visit date automatically.</div>
                </div>

                <div className="rounded-2xl border border-[#00acb1]/20 bg-white p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-600">Selected</div>
                  <div className="mt-2 text-sm text-gray-800">
                    <div>
                      <span className="font-semibold text-[#005963]">Patient:</span>{' '}
                      <span className="font-semibold">{selectedAppointment?.user?.name || (selectedAppointment ? `User #${selectedAppointment.user_id}` : '—')}</span>
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold text-[#005963]">Date:</span>{' '}
                      <span className="font-semibold">{appointmentDateLabel || '—'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold text-[#005963]">Time:</span>{' '}
                      <span className="font-semibold">{selectedAppointment?.appointment_time || '—'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold text-[#005963]">Status:</span>{' '}
                      <span className="font-semibold">{selectedAppointment?.status || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Doctor Info */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Doctor Info</div>
              <div className={sectionSubClass}>Displayed from logged-in user (placeholders until doctor profile fields exist).</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className={labelClass}>Doctor Name</div>
                <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm font-semibold text-[#005963]">{doctorInfo.name}</div>
              </div>
              <div>
                <div className={labelClass}>Qualification</div>
                <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm text-gray-800">{doctorInfo.qualification}</div>
              </div>
              <div>
                <div className={labelClass}>Specialization</div>
                <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm text-gray-800">{doctorInfo.specialization}</div>
              </div>
              <div>
                <div className={labelClass}>BMDC Registration No</div>
                <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm text-gray-800">{doctorInfo.bmdc}</div>
              </div>
              <div className="md:col-span-2">
                <div className={labelClass}>Clinic Name</div>
                <div className="rounded-2xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm text-gray-800">{doctorInfo.clinic}</div>
              </div>
            </div>
          </GlassCard>

          {/* Patient Information */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Patient Information</div>
              <div className={sectionSubClass}>Patient identity and basic measurements.</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className={labelClass}>Patient Name</label>
                <input
                  className={inputClass}
                  value={state.patient.name}
                  onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'name'], value: e.target.value })}
                  placeholder="Patient full name"
                />
              </div>

              <div>
                <label className={labelClass}>Contact Number</label>
                <input
                  className={inputClass}
                  value={state.patient.contact}
                  onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'contact'], value: e.target.value })}
                  placeholder="e.g. 01XXXXXXXXX"
                />
                <div className={helperClass}>Optional</div>
              </div>

              <div>
                <label className={labelClass}>Age</label>
                <div className="flex gap-2">
                  <input
                    inputMode="numeric"
                    className={`${inputClass} flex-1`}
                    value={state.patient.age_value}
                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_value'], value: e.target.value })}
                    placeholder="e.g. 25"
                  />
                  <select
                    className="w-32 rounded-2xl border border-[#00acb1]/30 bg-white px-3 py-3 text-sm"
                    value={state.patient.age_unit}
                    onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'age_unit'], value: e.target.value })}
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  className={inputClass}
                  value={state.patient.gender}
                  onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'gender'], value: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input
                  inputMode="decimal"
                  className={inputClass}
                  value={state.patient.weight}
                  onChange={(e) => dispatch({ type: 'setField', path: ['patient', 'weight'], value: e.target.value })}
                  placeholder="Optional"
                />
                <div className={helperClass}>Optional</div>
              </div>
            </div>
          </GlassCard>

          {/* Visit Details */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className={sectionTitleClass}>Visit Details</div>
                <div className={sectionSubClass}>Select visit date and type.</div>
              </div>
              {visitDateLabel && <span className={chipClass}>Selected: <span className="text-gray-700">{visitDateLabel}</span></span>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Visit Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={state.visit.date}
                  onChange={(e) => dispatch({ type: 'setField', path: ['visit', 'date'], value: e.target.value })}
                />
                {visitDateLabel && <div className={helperClass}>Display: <span className="font-semibold text-[#005963]">{visitDateLabel}</span></div>}
              </div>
              <div>
                <label className={labelClass}>Visit Type</label>
                <select
                  className={inputClass}
                  value={state.visit.type}
                  onChange={(e) => dispatch({ type: 'setField', path: ['visit', 'type'], value: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Chief Complaints */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={sectionTitleClass}>Chief Complaints</div>
                <div className={sectionSubClass}>Add complaint description and duration.</div>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-sm font-semibold text-[#005963]"
                onClick={() => dispatch({ type: 'addArrayItem', section: 'complaints', item: emptyComplaint() })}
              >
                + Add Complaint
              </button>
            </div>
            <div className="space-y-3">
              {(state.complaints || []).map((c, idx) => (
                <div key={idx} className="rounded-2xl border border-[#00acb1]/20 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Complaint</label>
                      <input
                        className={inputClass}
                        value={c.description}
                        onChange={(e) => dispatch({ type: 'setArrayItem', path: ['complaints'], index: idx, patch: { description: e.target.value } })}
                        placeholder="e.g. Headache, cough"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Duration</label>
                      <input
                        className={inputClass}
                        value={c.duration}
                        onChange={(e) => dispatch({ type: 'setArrayItem', path: ['complaints'], index: idx, patch: { duration: e.target.value } })}
                        placeholder="e.g. 3 days"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
                      onClick={() => dispatch({ type: 'removeArrayItem', section: 'complaints', index: idx, min: 1 })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Clinical Examination */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Clinical Examination</div>
              <div className={sectionSubClass}>Vitals and clinical notes.</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>BP</label>
                <input className={inputClass} value={state.exam.bp} onChange={(e) => dispatch({ type: 'setField', path: ['exam', 'bp'], value: e.target.value })} placeholder="e.g. 120/80" />
              </div>
              <div>
                <label className={labelClass}>Pulse</label>
                <input className={inputClass} value={state.exam.pulse} onChange={(e) => dispatch({ type: 'setField', path: ['exam', 'pulse'], value: e.target.value })} placeholder="bpm" />
              </div>
              <div>
                <label className={labelClass}>Temperature</label>
                <input className={inputClass} value={state.exam.temperature} onChange={(e) => dispatch({ type: 'setField', path: ['exam', 'temperature'], value: e.target.value })} placeholder="°C/°F" />
              </div>
              <div>
                <label className={labelClass}>SpO₂</label>
                <input className={inputClass} value={state.exam.spo2} onChange={(e) => dispatch({ type: 'setField', path: ['exam', 'spo2'], value: e.target.value })} placeholder="%" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={3} value={state.exam.notes} onChange={(e) => dispatch({ type: 'setField', path: ['exam', 'notes'], value: e.target.value })} placeholder="Clinical notes" />
              </div>
            </div>
          </GlassCard>

          {/* Diagnosis */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Diagnosis</div>
              <div className={sectionSubClass}>Provisional and final diagnosis (if confirmed).</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Provisional Diagnosis</label>
                <textarea className={inputClass} rows={3} value={state.diagnosis.provisional} onChange={(e) => dispatch({ type: 'setField', path: ['diagnosis', 'provisional'], value: e.target.value })} placeholder="Provisional diagnosis" />
              </div>
              <div>
                <label className={labelClass}>Final Diagnosis</label>
                <textarea className={inputClass} rows={3} value={state.diagnosis.final} onChange={(e) => dispatch({ type: 'setField', path: ['diagnosis', 'final'], value: e.target.value })} placeholder="Final diagnosis" />
                <div className={helperClass}>Optional</div>
              </div>
            </div>
          </GlassCard>

          {/* Medicines */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={sectionTitleClass}>Medicines</div>
                <div className={sectionSubClass}>Search medicine name, set strength, dosage, duration, instruction.</div>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-sm font-semibold text-[#005963]"
                onClick={() => dispatch({ type: 'addArrayItem', section: 'medicines', item: emptyMedicine() })}
              >
                + Add Medicine
              </button>
            </div>
            <datalist id="medicine-suggestions">
              {MEDICINE_SUGGESTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>

            <div className="overflow-x-auto rounded-2xl border border-[#00acb1]/15 bg-white/70 p-2">
              <table className="min-w-full border-separate" style={{ borderSpacing: '0 10px' }}>
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                    <th className="px-2">Medicine</th>
                    <th className="px-2">Strength</th>
                    <th className="px-2">Dosage</th>
                    <th className="px-2">Duration</th>
                    <th className="px-2">Instruction</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(state.medicines || []).map((m, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-2 py-2 align-top">
                        <input
                          className={inputClass}
                          list="medicine-suggestions"
                          value={m.name}
                          onChange={(e) => dispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { name: e.target.value } })}
                          placeholder="Medicine name"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          className={inputClass}
                          value={m.strength}
                          onChange={(e) => dispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { strength: e.target.value } })}
                          placeholder="e.g. 500mg"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          className={inputClass}
                          value={m.dosage}
                          onChange={(e) => dispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { dosage: e.target.value } })}
                          placeholder="1+0+1"
                        />
                        <div className={helperClass}>Format: 1+0+1</div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          className={inputClass}
                          value={m.duration}
                          onChange={(e) => dispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { duration: e.target.value } })}
                          placeholder="e.g. 5 days"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          className={inputClass}
                          value={m.instruction}
                          onChange={(e) => dispatch({ type: 'setArrayItem', path: ['medicines'], index: idx, patch: { instruction: e.target.value } })}
                        >
                          <option value="Before meal">Before meal</option>
                          <option value="After meal">After meal</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <button
                          type="button"
                          className="w-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                          onClick={() => dispatch({ type: 'removeArrayItem', section: 'medicines', index: idx, min: 1 })}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Investigations */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Investigations</div>
              <div className={sectionSubClass}>Select common tests or add custom tests.</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className={labelClass}>Common Tests</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COMMON_TESTS.map((t) => (
                    <label key={t} className="flex items-center gap-2 rounded-2xl border border-[#00acb1]/20 bg-white px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={!!state.investigations.common?.[t]}
                        onChange={() => dispatch({ type: 'toggleCommonTest', testName: t })}
                      />
                      <span className="font-semibold text-[#005963]">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className={labelClass}>Custom Tests</div>
                <div className="space-y-3">
                  {(state.investigations.custom || []).map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className={inputClass}
                        value={v}
                        onChange={(e) => dispatch({ type: 'setCustomTest', index: idx, value: e.target.value })}
                        placeholder="Type a test name"
                      />
                      <button
                        type="button"
                        className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                        onClick={() => dispatch({ type: 'removeCustomTest', index: idx })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="rounded-full border border-[#00acb1]/40 bg-white px-4 py-2 text-sm font-semibold text-[#005963]"
                    onClick={() => dispatch({ type: 'addCustomTest' })}
                  >
                    + Add Custom Test
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Advice */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Advice</div>
              <div className={sectionSubClass}>Lifestyle and diet/rest guidance.</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Lifestyle Advice</label>
                <textarea className={inputClass} rows={4} value={state.advice.lifestyle} onChange={(e) => dispatch({ type: 'setField', path: ['advice', 'lifestyle'], value: e.target.value })} placeholder="Lifestyle advice" />
              </div>
              <div>
                <label className={labelClass}>Diet / Rest Instructions</label>
                <textarea className={inputClass} rows={4} value={state.advice.diet_rest} onChange={(e) => dispatch({ type: 'setField', path: ['advice', 'diet_rest'], value: e.target.value })} placeholder="Diet / rest instructions" />
              </div>
            </div>
          </GlassCard>

          {/* Follow-up */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className={sectionTitleClass}>Follow-up</div>
                <div className={sectionSubClass}>Optional follow-up schedule and emergency note.</div>
              </div>
              {followUpDateLabel && <span className={chipClass}>Selected: <span className="text-gray-700">{followUpDateLabel}</span></span>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Follow-up Date</label>
                <input type="date" className={inputClass} value={state.follow_up.date} onChange={(e) => dispatch({ type: 'setField', path: ['follow_up', 'date'], value: e.target.value })} />
                {followUpDateLabel ? (
                  <div className={helperClass}>Display: <span className="font-semibold text-[#005963]">{followUpDateLabel}</span></div>
                ) : (
                  <div className={helperClass}>Optional</div>
                )}
              </div>
              <div>
                <label className={labelClass}>Emergency Note</label>
                <textarea className={inputClass} rows={3} value={state.follow_up.emergency_note} onChange={(e) => dispatch({ type: 'setField', path: ['follow_up', 'emergency_note'], value: e.target.value })} />
              </div>
            </div>
          </GlassCard>

          {/* Disclaimer */}
          <GlassCard variant="solid" className="p-6">
            <div className="mb-2">
              <div className={sectionTitleClass}>Disclaimer</div>
              <div className={sectionSubClass}>Patient safety guidance.</div>
            </div>
            <div className="text-sm text-gray-700">
              This prescription is based on the clinical information provided and the doctor’s assessment during this visit.
              If symptoms worsen, new symptoms appear, or there is any emergency, seek immediate medical attention.
              Do not self-medicate or share medicines with others.
            </div>
          </GlassCard>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">Save will generate a payload (frontend-only).</div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-full border border-[#00acb1]/40 bg-white px-6 py-4 text-base font-semibold text-[#005963]"
                onClick={() => {
                  dispatch({ type: 'reset' });
                  setSuccess('');
                  setError('');
                }}
                disabled={submitting}
              >
                Reset
              </button>
              <PrimaryButton type="submit" large disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Prescription'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

CreatePrescription.layout = (page) => <DoctorLayout>{page}</DoctorLayout>;
