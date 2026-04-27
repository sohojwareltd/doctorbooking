import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Eye, EyeOff, FileText,
  Hash, Mail, Mars, Phone,
  Pencil, Search, SlidersHorizontal, User, Users, Venus, X,
} from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import DocModal from '../../components/doctor/DocModal';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

// ── helpers ───────────────────────────────────────────────────────────────────

function renderHighlighted(value, query) {
  const text = String(value ?? '');
  const needle = query.trim();
  if (!needle) return text;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-100 font-semibold text-slate-900 not-italic">{text.slice(idx, idx + needle.length)}</mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

function GenderAvatar({ gender }) {
  const g = String(gender || '').toLowerCase();
  if (g === 'female') {
    return (
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-[0_6px_14px_-8px_rgba(244,63,94,0.9)]" title="Female">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-pink-100 text-pink-600 shadow-sm">
          <Venus className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }
  if (g === 'male') {
    return (
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-[0_6px_14px_-8px_rgba(59,130,246,0.95)]" title="Male">
        <User className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-sky-100 text-sky-600 shadow-sm">
          <Mars className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
      <User className="h-4 w-4" />
    </span>
  );
}

function resolveAge(patient) {
  if (patient?.age != null && patient.age !== '') return patient.age;
  if (patient?.date_of_birth) {
    const birth = new Date(patient.date_of_birth);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
      if (age >= 0) return age;
    }
  }
  return null;
}

function fmtGender(g) {
  const v = String(g || '').trim().toLowerCase();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A';
}

function getGender(p) { return p?.gender || p?.patient_gender || 'N/A'; }

function ageGenderLabel(p) {
  const age = resolveAge(p);
  return `${age ? `${age}y` : 'Age N/A'} · ${fmtGender(getGender(p))}`;
}

// ── sort options ──────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest',        label: 'Newest First' },
  { value: 'oldest',        label: 'Oldest First' },
  { value: 'name_asc',      label: 'Name A → Z' },
  { value: 'name_desc',     label: 'Name Z → A' },
  { value: 'prescriptions', label: 'Most Prescriptions' },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function Patients() {
  // data
  const [rows, setRows]   = useState([]);
  const [meta, setMeta]   = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  // ui
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    gender: '',
    age: '',
    address: '',
    password: '',
    password_confirmation: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState('');
  const [showEditPasswords, setShowEditPasswords] = useState({
    password: false,
    password_confirmation: false,
  });

  // filters
  const [search, setSearch]                       = useState('');
  const [gender, setGender]                       = useState('all');
  const [ageMin, setAgeMin]                       = useState('');
  const [ageMax, setAgeMax]                       = useState('');
  const [hasPrescription, setHasPrescription]     = useState('all');
  const [sortBy, setSortBy]                       = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage]                           = useState(1);

  const debounceTimer = useRef(null);

  const setEdit = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleEditPasswordVisibility = (key) => {
    setShowEditPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((r) => r.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    if (cookie) return decodeURIComponent(cookie);
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  };

  // ── fetch ────────────────────────────────────────────────────────────────────

  const fetchPatients = useCallback(async (overrides = {}) => {
    const p = {
      search,
      gender,
      age_min: ageMin,
      age_max: ageMax,
      has_prescription: hasPrescription,
      sort_by: sortBy,
      page,
      per_page: 15,
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => { if (v !== '' && v !== 'all') params.set(k, v); });
    params.set('page', String(p.page));
    params.set('per_page', '15');

    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/patients?${params}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      setRows(data?.patients?.data ?? []);
      setMeta(data?.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, gender, ageMin, ageMax, hasPrescription, sortBy, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // debounce search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setPage(1); }, 350);
  };

  // ── filter actions ────────────────────────────────────────────────────────────

  const handleReset = () => {
    setSearch(''); setGender('all'); setAgeMin(''); setAgeMax('');
    setHasPrescription('all'); setSortBy('newest'); setPage(1);
    setShowMobileFilters(false);
  };

  // ── prescription click ────────────────────────────────────────────────────────

  const handlePrescriptionClick = (p) => {
    if (!p.has_prescription && (p.prescriptions_count ?? 0) === 0) {
      router.visit(`/doctor/prescriptions/create?patient_id=${p.id}`);
      return;
    }
    if ((p.prescriptions_count ?? 0) <= 1 && p.prescriptions?.[0]?.id) {
      router.visit(`/doctor/prescriptions/${p.prescriptions[0].id}`);
      return;
    }
    setPrescriptionModal(p);
  };

  const handleOpenPatientEditModal = (patient) => {
    setEditPatient(patient);
    setEditForm({
      name: patient?.name ?? '',
      phone: patient?.phone ?? '',
      gender: patient?.gender ?? '',
      age: patient?.age ?? '',
      address: patient?.address ?? '',
      password: '',
      password_confirmation: '',
    });
    setShowEditPasswords({ password: false, password_confirmation: false });
    setEditError('');
    setEditSaved(false);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (editSaving) return;
    setEditModalOpen(false);
    setEditPatient(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPatient?.id) return;
    setEditSaving(true);
    setEditSaved(false);
    setEditError('');

    try {
      const res = await fetch(`/api/doctor/patients/${editPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone || null,
          gender: editForm.gender || null,
          age: editForm.age === '' ? null : Number(editForm.age),
          address: editForm.address || null,
          ...(editForm.password
            ? {
                password: editForm.password,
                password_confirmation: editForm.password_confirmation,
              }
            : {}),
        }),
      });

      if (res.ok) {
        setEditSaved(true);
        setEditForm((prev) => ({
          ...prev,
          password: '',
          password_confirmation: '',
        }));
        setShowEditPasswords({ password: false, password_confirmation: false });
        await fetchPatients();
      } else {
        const data = await res.json().catch(() => ({}));
        const firstValidationError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        setEditError(firstValidationError || data.message || 'Failed to update profile. Please try again.');
      }
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const topWidgets = [
    {
      key: 'total',
      label: 'Total Patients',
      value: meta.total,
      helper: `${meta.total} patient profiles found`,
      icon: Users,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'with_phone',
      label: 'With Phone',
      value: rows.filter((p) => Boolean(p?.phone)).length,
      helper: 'Patients with call-ready contact',
      icon: Phone,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'with_email',
      label: 'With Email',
      value: rows.filter((p) => Boolean(p?.email)).length,
      helper: 'Patients with email contact info',
      icon: Mail,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      key: 'with_rx',
      label: 'With Prescriptions',
      value: rows.filter((p) => (p?.prescriptions_count ?? 0) > 0).length,
      helper: 'Patients who already have prescriptions',
      icon: FileText,
      tone: 'bg-orange-50 text-orange-700',
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <DoctorLayout title="Patients" gradient={false}>
      <div className="mx-auto max-w-[1400px]">
        <section className="mb-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-[#2D3A74]">Patients</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {meta.total}
              </span>
            </div>
            {/* <p className="text-sm text-slate-500">Review profiles, contacts, and prescription activity in one place.</p> */}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {topWidgets.map((widget) => {
              const Icon = widget.icon;
              return (
                <div key={widget.key} className="surface-card rounded-2xl p-3.5 sm:rounded-3xl sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500 sm:text-sm">{widget.label}</p>
                      <p className="text-2xl font-semibold text-[#2D3A74] sm:text-3xl">{widget.value}</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${widget.tone}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[11px] text-slate-400 sm:mt-4 sm:text-xs">{widget.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card rounded-3xl overflow-hidden">

          {/* ── Header ── */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="hidden md:grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,360px)_170px_120px_120px_170px_180px] lg:items-end">
                <div className="col-span-2 lg:col-span-1">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by name, email or phone"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="col-span-1 min-w-0 lg:w-[170px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => { setGender(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    <option value="all">All gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="col-span-1 min-w-0 lg:w-[120px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Min Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={ageMin}
                    onChange={(e) => { setAgeMin(e.target.value); setPage(1); }}
                    placeholder="Min"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  />
                </div>

                <div className="col-span-1 min-w-0 lg:w-[120px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Max Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={ageMax}
                    onChange={(e) => { setAgeMax(e.target.value); setPage(1); }}
                    placeholder="Max"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  />
                </div>

                <div className="col-span-1 min-w-0 lg:w-[170px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Prescription</label>
                  <select
                    value={hasPrescription}
                    onChange={(e) => { setHasPrescription(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    <option value="all">All patients</option>
                    <option value="yes">Has Rx</option>
                    <option value="no">No Rx</option>
                  </select>
                </div>

                <div className="col-span-1 min-w-0 lg:w-[180px]">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sort</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex md:hidden items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  title="Open filters"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="hidden lg:block" />
            </div>
          </div>

          {/* ── Table ── */}
          {/* ── Mobile Cards ── */}
          {!loading && (
            <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
              {rows.length === 0 ? (
                <div className="p-5">
                  <DocEmptyState icon={Users} title="No patients found" description="Try adjusting your search or filters." />
                </div>
              ) : rows.map((p, idx) => {
                const serial = (meta.current_page - 1) * 15 + idx + 1;
                return (
                  <div
                    key={p.id ?? idx}
                    className="p-4 space-y-2 cursor-pointer active:bg-slate-50"
                    onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <GenderAvatar gender={getGender(p)} />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{renderHighlighted(p.name, search)}</div>
                          <div className="text-xs text-slate-500">{ageGenderLabel(p)}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        (p.prescriptions_count ?? 0) > 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {p.prescriptions_count ?? 0} Rx
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                      {p.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {renderHighlighted(p.phone, search)}
                        </span>
                      )}
                      {p.email && (
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {renderHighlighted(p.email, search)}
                        </span>
                      )}
                      {p.address && (
                        <span className="text-slate-400 truncate">{p.address}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <ActionBtn
                        label="View"
                        className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </ActionBtn>
                       <ActionBtn
                        label="Edit"
                        className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        onClick={() => handleOpenPatientEditModal(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </ActionBtn>
                      {/* <ActionBtn
                        label="Prescriptions"
                        className="border-violet-300 bg-violet-100 text-violet-800 hover:bg-violet-200"
                        onClick={() => handlePrescriptionClick(p)}
                      >
                        <FileText className="h-4 w-4" />
                      </ActionBtn> */}
                      
                      {p.email && (
                        <ActionBtn
                          label="Email"
                          className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          onClick={() => { window.location.href = `mailto:${p.email}`; }}
                        >
                          <Mail className="h-4 w-4" />
                        </ActionBtn>
                      )}
                     
                      {p.phone && (
                        <ActionBtn
                          label="Call"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => { window.location.href = `tel:${p.phone}`; }}
                        >
                          <Phone className="h-4 w-4" />
                        </ActionBtn>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Table ── */}
          <div className="hidden md:block overflow-x-auto border-t border-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading…</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-[0.12em]">
                  <tr>
                    <th className="px-6 py-4 text-left">#</th>
                    <th className="px-6 py-4 text-left">Patient</th>
                    <th className="px-6 py-4 text-left">Contact</th>
                    <th className="px-6 py-4 text-left">Address</th>
                    <th className="px-6 py-4 text-center">Prescriptions</th>
                    <th className="px-6 py-4 text-left">Joined</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((p, idx) => {
                    const serial = (meta.current_page - 1) * 15 + idx + 1;
                    return (
                      <tr
                        key={p.id ?? idx}
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                        onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                      >
                        {/* # */}
                        <td className="px-6 py-4 font-medium text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            {serial}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <GenderAvatar gender={getGender(p)} />
                            <div>
                              <div className="font-semibold text-slate-900">{renderHighlighted(p.name, search)}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{ageGenderLabel(p)}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 text-[13px] text-slate-700">
                          <div className="flex flex-col gap-0.5">
                            {p.phone && (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {renderHighlighted(p.phone, search)}
                              </span>
                            )}
                            {p.email && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {renderHighlighted(p.email, search)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Address */}
                        <td className="max-w-[180px] truncate px-6 py-4 text-xs text-slate-500" title={p.address ?? ''}>
                          {p.address || <span className="text-slate-300">—</span>}
                        </td>

                        {/* Prescriptions count */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (p.prescriptions_count ?? 0) > 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {p.prescriptions_count ?? 0}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="whitespace-nowrap px-6 py-4 text-[13px] text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {p.created_at
                              ? formatDisplayDateWithYearFromDateLike(p.created_at) || p.created_at
                              : 'N/A'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <ActionBtn
                              label="View"
                              className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                              onClick={() => router.visit(`/doctor/patients/${p.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </ActionBtn>
                            {/* <ActionBtn
                              label="Prescriptions"
                              className="border-violet-300 bg-violet-100 text-violet-800 hover:bg-violet-200"
                              onClick={() => handlePrescriptionClick(p)}
                            >
                              <FileText className="h-4 w-4" />
                            </ActionBtn> */}
                               <ActionBtn
                              label="Edit"
                              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              onClick={() => handleOpenPatientEditModal(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </ActionBtn>
                            {p.email && (
                              <ActionBtn
                                label="Email"
                                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                onClick={() => { window.location.href = `mailto:${p.email}`; }}
                              >
                                <Mail className="h-4 w-4" />
                              </ActionBtn>
                            )}
                         
                            {p.phone && (
                              <ActionBtn
                                label="Call"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => { window.location.href = `tel:${p.phone}`; }}
                              >
                                <Phone className="h-4 w-4" />
                              </ActionBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Empty state */}
          {!loading && rows.length === 0 && (
            <div className="hidden md:block p-5">
              <DocEmptyState icon={Users} title="No patients found" description="Try adjusting your search or filters." />
            </div>
          )}

          {/* ── Pagination ── */}
          {meta.last_page > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-700">{meta.current_page}</span> of{' '}
                <span className="font-semibold text-slate-700">{meta.last_page}</span>
                {' · '}
                <span className="font-semibold text-slate-700">{meta.total}</span> total
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className="rounded-lg bg-[#2D3A74] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#243063] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {showMobileFilters && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[110] flex items-start bg-black/40 backdrop-blur-[1px]" onClick={() => setShowMobileFilters(false)}>
            <div
              className="w-full rounded-b-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D3A74]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by name, email or phone"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => { setGender(e.target.value); setPage(1); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Prescription</label>
                    <select
                      value={hasPrescription}
                      onChange={(e) => { setHasPrescription(e.target.value); setPage(1); }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    >
                      <option value="all">All patients</option>
                      <option value="yes">Has Rx</option>
                      <option value="no">No Rx</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Min Age</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={ageMin}
                      onChange={(e) => { setAgeMin(e.target.value); setPage(1); }}
                      placeholder="Min"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Max Age</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={ageMax}
                      onChange={(e) => { setAgeMax(e.target.value); setPage(1); }}
                      placeholder="Max"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sort</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full rounded-xl bg-[#2D3A74] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      {/* ── Prescription Modal ── */}
      <DocModal
        open={!!prescriptionModal}
        onClose={() => setPrescriptionModal(null)}
        title="Select Prescription"
        icon={FileText}
        size="md"
        footer={
          <DocButton variant="secondary" size="sm" onClick={() => setPrescriptionModal(null)}>
            Close
          </DocButton>
        }
      >
        {prescriptionModal && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              {prescriptionModal.name} has {prescriptionModal.prescriptions_count} prescriptions
            </p>
            <div className="space-y-2">
              {(prescriptionModal.prescriptions || []).map((rx, idx) => (
                <button
                  key={rx.id}
                  onClick={() => { router.visit(`/doctor/prescriptions/${rx.id}`); setPrescriptionModal(null); }}
                  className="w-full rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-sky-300 hover:bg-sky-50/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {rx.diagnosis || 'No diagnosis provided'}
                        </span>
                      </div>
                      <div className="ml-10 text-xs text-slate-400">
                        {formatDisplayDateWithYearFromDateLike(rx.created_at) || rx.created_at}
                      </div>
                    </div>
                    <FileText className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DocModal>

      <DocModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={editPatient ? `Edit Profile - ${editPatient.name}` : 'Edit Profile'}
        icon={Pencil}
        size="md"
        footer={(
          <>
            <DocButton variant="secondary" size="sm" onClick={handleCloseEditModal} disabled={editSaving}>
              Cancel
            </DocButton>
            <DocButton size="sm" type="submit" form="doctor-edit-patient-form" disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </DocButton>
          </>
        )}
      >
        <form id="doctor-edit-patient-form" onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={setEdit('name')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={setEdit('phone')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
                placeholder="Patient phone"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Age</label>
              <input
                type="number"
                min="1"
                max="150"
                value={editForm.age}
                onChange={setEdit('age')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
                placeholder="Age"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Gender</label>
            <select
              value={editForm.gender}
              onChange={setEdit('gender')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Address</label>
            <textarea
              value={editForm.address}
              onChange={setEdit('address')}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
              placeholder="Patient address"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">New Password (Optional)</label>
              <div className="relative">
                <input
                  type={showEditPasswords.password ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={setEdit('password')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => toggleEditPasswordVisibility('password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showEditPasswords.password ? 'Hide new password' : 'Show new password'}
                >
                  {showEditPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <div className="relative">
                <input
                  type={showEditPasswords.password_confirmation ? 'text' : 'password'}
                  value={editForm.password_confirmation}
                  onChange={setEdit('password_confirmation')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => toggleEditPasswordVisibility('password_confirmation')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showEditPasswords.password_confirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showEditPasswords.password_confirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {editError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {editError}
            </div>
          )}

          {editSaved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Profile updated successfully.
            </div>
          )}
        </form>
      </DocModal>
    </DoctorLayout>
  );
}

// ── tiny action button ─────────────────────────────────────────────────────────

function ActionBtn({ children, label, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${className}`}
    >
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
