import { Head } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { ClipboardList, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { toastError, toastSuccess } from '../../utils/toast';

const emptyMedicineRow = () => ({
  medicine_name: '',
  dose: '',
  duration: '',
  instruction: '',
});

const createEmptyForm = (catalog = []) => ({
  id: null,
  name: '',
  chiefComplaintsText: '',
  oe: '',
  instructions: '',
  investigationCommon: Object.fromEntries(catalog.map((name) => [name, false])),
  investigationCustom: [''],
  sourceInvestigations: [],
  medicines: [emptyMedicineRow()],
});

function toArrayFromMultiline(value) {
  return String(value || '')
    .split(/\n|,|;/)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeMedicineName(value) {
  return normalizeText(value);
}

function cleanInvestigationLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  return raw
    .replace(/^[-*\d.)\s]+/, '')
    .replace(/\s*[:\-]+\s*$/, '')
    .trim();
}

function findBestCatalogInvestigation(catalogSource, rawName) {
  const clean = cleanInvestigationLabel(rawName);
  const normalized = normalizeText(clean).replace(/[^a-z0-9]+/g, '');
  if (!normalized) return null;

  for (const candidate of catalogSource) {
    const candidateNorm = normalizeText(candidate).replace(/[^a-z0-9]+/g, '');
    if (!candidateNorm) continue;
    if (candidateNorm === normalized) return candidate;
  }

  for (const candidate of catalogSource) {
    const candidateNorm = normalizeText(candidate).replace(/[^a-z0-9]+/g, '');
    if (!candidateNorm) continue;
    if (normalized.includes(candidateNorm) || candidateNorm.includes(normalized)) {
      return candidate;
    }
  }

  return null;
}

function buildInvestigationSelection(values, catalog) {
  const source = Array.isArray(values)
    ? values.map((item) => cleanInvestigationLabel(item)).filter(Boolean)
    : toArrayFromMultiline(values).map((item) => cleanInvestigationLabel(item)).filter(Boolean);

  const common = Object.fromEntries((catalog || []).map((name) => [name, false]));
  const custom = [];

  source.forEach((item) => {
    const matched = findBestCatalogInvestigation(catalog || [], item);
    if (matched) {
      common[matched] = true;
      return;
    }
    custom.push(item);
  });

  return {
    sourceInvestigations: source,
    investigationCommon: common,
    investigationCustom: custom.length ? custom : [''],
  };
}

function buildMedicineWithStrength(name, strength) {
  const cleanName = String(name || '').trim();
  const cleanStrength = String(strength || '').trim();
  if (!cleanName) return '';
  return cleanStrength ? `${cleanName} ${cleanStrength}` : cleanName;
}

export default function PrescriptionTemplates() {
  const [templates, setTemplates] = useState([]);
  const [investigationCatalog, setInvestigationCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(createEmptyForm());
  const [medicineMatchesByRow, setMedicineMatchesByRow] = useState({});
  const [focusedMedicineIndex, setFocusedMedicineIndex] = useState(null);
  const medicineMatchCacheRef = useRef(new Map());
  const medicineQuerySeqRef = useRef({});

  const isEditing = form.id !== null;

  const csrfToken = useMemo(
    () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    []
  );

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/templates', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to load templates.');
        return;
      }
      setTemplates(Array.isArray(body?.templates) ? body.templates : []);
    } catch {
      toastError('Network error while loading templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const loadInvestigationTests = async () => {
    try {
      const res = await fetch('/api/doctor/investigation-tests', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const names = (Array.isArray(body?.items) ? body.items : [])
        .map((item) => String(item?.name || '').trim())
        .filter(Boolean);

      setInvestigationCatalog(names);
      setForm((prev) => ({
        ...prev,
        investigationCommon: Object.fromEntries(
          names.map((name) => [name, !!prev.investigationCommon?.[name]])
        ),
      }));
    } catch {
      // Keep form usable without catalog.
    }
  };

  useEffect(() => {
    void loadInvestigationTests();
  }, []);

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(createEmptyForm(investigationCatalog));
    setMedicineMatchesByRow({});
    setFocusedMedicineIndex(null);
  };

  const openCreateModal = () => {
    setForm(createEmptyForm(investigationCatalog));
    setMedicineMatchesByRow({});
    setFocusedMedicineIndex(null);
    setShowModal(true);
  };

  const openEditModal = (template) => {
    const medicines = Array.isArray(template?.medicines) && template.medicines.length
      ? template.medicines.map((item) => ({
        medicine_name: String(item?.medicine_name || '').trim(),
        dose: String(item?.dose || '').trim(),
        duration: String(item?.duration || '').trim(),
        instruction: String(item?.instruction || '').trim(),
      }))
      : [emptyMedicineRow()];

    const selection = buildInvestigationSelection(template?.investigations, investigationCatalog);

    setForm({
      id: template.id,
      name: String(template?.name || ''),
      chiefComplaintsText: Array.isArray(template?.chief_complaints)
        ? template.chief_complaints.map((item) => String(item || '').trim()).filter(Boolean).join('\n')
        : String(template?.chief_complaints || '').trim(),
      oe: String(template?.oe || ''),
      instructions: String(template?.instructions || ''),
      ...selection,
      medicines,
    });
    setMedicineMatchesByRow({});
    setFocusedMedicineIndex(null);
    setShowModal(true);
  };

  const queryMedicineMatches = async (rawName, rowIndex) => {
    const normalized = normalizeMedicineName(rawName);
    if (!normalized) {
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }

    const cached = medicineMatchCacheRef.current.get(normalized);
    if (cached) {
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: cached }));
      return;
    }

    const seq = (medicineQuerySeqRef.current[rowIndex] || 0) + 1;
    medicineQuerySeqRef.current[rowIndex] = seq;

    try {
      const params = new URLSearchParams({ query: rawName, limit: '8' });
      const res = await fetch(`/api/doctor/medicines?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load medicines');
      const data = await res.json();
      if (medicineQuerySeqRef.current[rowIndex] !== seq) return;

      const rows = Array.isArray(data)
        ? data.map((item) => ({
          id: item.id,
          name: String(item.name || '').trim(),
          strength: String(item.strength || '').trim(),
        }))
        : [];

      const matches = [...rows].sort((a, b) => {
        const aN = normalizeMedicineName(a.name);
        const bN = normalizeMedicineName(b.name);
        const aRank = aN === normalized ? 0 : aN.startsWith(normalized) ? 1 : 2;
        const bRank = bN === normalized ? 0 : bN.startsWith(normalized) ? 1 : 2;
        return aRank - bRank;
      });

      medicineMatchCacheRef.current.set(normalized, matches);
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: matches }));
    } catch {
      if (medicineQuerySeqRef.current[rowIndex] !== seq) return;
      setMedicineMatchesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const updateMedicineRow = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  };

  const addMedicineRow = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, emptyMedicineRow()],
    }));
  };

  const removeMedicineRow = (index) => {
    setForm((prev) => {
      const nextRows = prev.medicines.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        medicines: nextRows.length ? nextRows : [emptyMedicineRow()],
      };
    });
  };

  const toggleInvestigation = (name) => {
    setForm((prev) => ({
      ...prev,
      investigationCommon: {
        ...prev.investigationCommon,
        [name]: !prev.investigationCommon?.[name],
      },
    }));
  };

  const updateCustomInvestigation = (index, value) => {
    setForm((prev) => {
      const next = [...(prev.investigationCustom || [])];
      next[index] = value;
      return { ...prev, investigationCustom: next };
    });
  };

  const addCustomInvestigation = () => {
    setForm((prev) => ({
      ...prev,
      investigationCustom: [...(prev.investigationCustom || []), ''],
    }));
  };

  const removeCustomInvestigation = (index) => {
    setForm((prev) => {
      const next = (prev.investigationCustom || []).filter((_, rowIndex) => rowIndex !== index);
      return {
        ...prev,
        investigationCustom: next.length ? next : [''],
      };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const name = String(form.name || '').trim();
    if (!name) {
      toastError('Template name is required.');
      return;
    }

    const selectedCommonInvestigations = Object.entries(form.investigationCommon || {})
      .filter(([, checked]) => !!checked)
      .map(([name]) => String(name || '').trim())
      .filter(Boolean);

    const customInvestigations = (form.investigationCustom || [])
      .map((item) => cleanInvestigationLabel(item))
      .filter(Boolean);

    const payload = {
      name,
      chief_complaints: toArrayFromMultiline(form.chiefComplaintsText),
      oe: String(form.oe || '').trim() || null,
      investigations: [...selectedCommonInvestigations, ...customInvestigations],
      instructions: String(form.instructions || '').trim() || null,
      medicines: form.medicines
        .map((item) => ({
          medicine_name: String(item?.medicine_name || '').trim(),
          dose: String(item?.dose || '').trim() || null,
          duration: String(item?.duration || '').trim() || null,
          instruction: String(item?.instruction || '').trim() || null,
        }))
        .filter((item) => item.medicine_name),
    };

    try {
      setSaving(true);
      const url = isEditing ? `/api/doctor/templates/${form.id}` : '/api/doctor/templates';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = body?.message
          || (body?.errors ? Object.values(body.errors).flat().join(' ') : null)
          || 'Failed to save template.';
        toastError(message);
        return;
      }

      toastSuccess(body?.message || (isEditing ? 'Template updated.' : 'Template created.'));
      closeModal();
      await loadTemplates();
    } catch {
      toastError('Network error while saving template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!template?.id) return;
    const ok = window.confirm(`Delete template "${template.name}"?`);
    if (!ok) return;

    try {
      setDeletingId(template.id);
      const res = await fetch(`/api/doctor/templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to delete template.');
        return;
      }

      toastSuccess(body?.message || 'Template deleted.');
      await loadTemplates();
    } catch {
      toastError('Network error while deleting template.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DoctorLayout title="Prescription Templates">
      <Head title="Prescription Templates" />

      <div className="mx-auto max-w-[1400px]">
        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#2D3A74]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#2D3A74]">Prescription Templates</h1>
                  <p className="text-sm text-slate-500">Create and maintain reusable templates for CC, O/E, tests, medicines and instructions.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {templates.length}
                </span>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                New Template
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-center">Investigations</th>
                  <th className="px-6 py-4 text-center">Medicines</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Loading templates...</td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">No templates found.</td>
                  </tr>
                ) : templates.map((template) => (
                  <tr key={template.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold text-slate-900">{template.name}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{Array.isArray(template.investigations) ? template.investigations.length : 0}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{Array.isArray(template.medicines) ? template.medicines.length : 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(template)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(template)}
                          disabled={deletingId === template.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showModal && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,0.46)] p-4 pt-8 backdrop-blur-[4px]">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-base font-bold text-slate-800">{isEditing ? 'Edit Template' : 'Create Template'}</h3>
              <button type="button" onClick={closeModal} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Template Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  placeholder="e.g. ENT - Common Cold"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Chief Complaints</label>
                <textarea
                  rows={4}
                  value={form.chiefComplaintsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, chiefComplaintsText: e.target.value }))}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  placeholder={'Fever\nCough'}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Investigations</label>
                <div className="rounded-xl border border-slate-200 p-3">
                    {investigationCatalog.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                        {investigationCatalog.map((testName) => {
                          const checked = !!form.investigationCommon?.[testName];
                          return (
                            <button
                              key={testName}
                              type="button"
                              className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-left text-xs transition ${checked
                                ? 'border-[#2D3A74] bg-[#eef2ff] text-[#2D3A74]'
                                : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              onClick={() => toggleInvestigation(testName)}
                            >
                              <span className="truncate">{testName}</span>
                              <span className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold ${checked
                                ? 'border-[#2D3A74] bg-[#2D3A74] text-white'
                                : 'border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No investigation tests found.</p>
                    )}

                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Additional tests</p>
                      {(form.investigationCustom || []).map((row, index) => (
                        <div key={`custom-investigation-${index}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={row}
                            onChange={(e) => updateCustomInvestigation(index, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            placeholder="Custom investigation"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomInvestigation(index)}
                            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCustomInvestigation}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Plus className="h-3 w-3" /> Add custom
                      </button>
                    </div>
                  </div>
                </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Advice</label>
                <textarea
                  rows={5}
                  value={form.instructions}
                  onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  placeholder={'e.g. Exercise regularly, light diet, adequate rest…'}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Medicines</h4>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Plus className="h-3 w-3" /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {form.medicines.map((row, index) => (
                    <div key={`${index}-template-medicine`} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.medicine_name}
                          onFocus={() => {
                            setFocusedMedicineIndex(index);
                            void queryMedicineMatches(row.medicine_name, index);
                          }}
                          onBlur={() => {
                            window.setTimeout(() => {
                              setFocusedMedicineIndex((current) => (current === index ? null : current));
                            }, 120);
                          }}
                          onChange={(e) => {
                            updateMedicineRow(index, { medicine_name: e.target.value });
                            void queryMedicineMatches(e.target.value, index);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          placeholder="Medicine"
                        />
                        {focusedMedicineIndex === index && (medicineMatchesByRow[index] || []).length > 0 ? (
                          <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-[#c7d6f7] bg-white shadow-lg">
                            {(medicineMatchesByRow[index] || []).slice(0, 8).map((med, optionIndex) => (
                              <button
                                key={`${med.id ?? med.name}-${med.strength}-${optionIndex}`}
                                type="button"
                                className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-[#edf2ff]"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  updateMedicineRow(index, {
                                    medicine_name: buildMedicineWithStrength(med.name, med.strength),
                                  });
                                  setFocusedMedicineIndex(null);
                                }}
                              >
                                <span className="font-semibold text-slate-800">{med.name}</span>
                                <span className="text-slate-500">{med.strength || 'No strength'}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={row.dose}
                        onChange={(e) => updateMedicineRow(index, { dose: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        placeholder="Dose"
                      />
                      <input
                        type="text"
                        value={row.duration}
                        onChange={(e) => updateMedicineRow(index, { duration: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        placeholder="Duration"
                      />
                      <input
                        type="text"
                        value={row.instruction}
                        onChange={(e) => updateMedicineRow(index, { instruction: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        placeholder="Instruction"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(index)}
                        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700"
                        title="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60">
                  {saving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </DoctorLayout>
  );
}
