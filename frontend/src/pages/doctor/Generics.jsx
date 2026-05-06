import { Head } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { Database, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { toastError, toastSuccess } from '../../utils/toast';

const createEmptyForm = () => ({
  id: null,
  name: '',
});

export default function Generics() {
  const [generics, setGenerics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const isEditing = form.id !== null;

  const csrfToken = useMemo(
    () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    []
  );

  const loadGenerics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/generics?per_page=100', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to load generics.');
        return;
      }
      const items = body?.data || body || [];
      setGenerics(Array.isArray(items) ? items : []);
    } catch {
      toastError('Network error while loading generics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGenerics();
  }, []);

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(createEmptyForm());
  };

  const openCreateModal = () => {
    setForm(createEmptyForm());
    setShowModal(true);
  };

  const openEditModal = (generic) => {
    setForm({
      id: generic.id,
      name: String(generic?.name || ''),
    });
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const name = String(form.name || '').trim();
    if (!name) {
      toastError('Generic name is required.');
      return;
    }

    const payload = {
      name,
    };

    try {
      setSaving(true);
      const url = isEditing ? `/api/doctor/generics/${form.id}` : '/api/doctor/generics';
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
          || 'Failed to save generic.';
        toastError(message);
        return;
      }

      toastSuccess(body?.message || (isEditing ? 'Generic updated.' : 'Generic created.'));
      closeModal();
      await loadGenerics();
    } catch {
      toastError('Network error while saving generic.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (generic) => {
    if (!generic?.id) return;
    const ok = window.confirm(`Delete generic "${generic.name}"?`);
    if (!ok) return;

    try {
      setDeletingId(generic.id);
      const res = await fetch(`/api/doctor/generics/${generic.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to delete generic.');
        return;
      }

      toastSuccess(body?.message || 'Generic deleted.');
      await loadGenerics();
    } catch {
      toastError('Network error while deleting generic.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DoctorLayout title="Generics Management">
      <Head title="Generics Management" />

      <div className="mx-auto max-w-3xl">
        <section className="surface-card overflow-hidden rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2D3A74]">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#2D3A74]">Generics Management</h1>
                  <p className="text-sm text-slate-500">Manage drug classifications</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D3A74] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                <span>New Generic</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-center w-12">SL</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">Loading...</td>
                  </tr>
                ) : generics.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">No generics found.</td>
                  </tr>
                ) : generics.map((generic, index) => (
                  <tr key={generic.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 bg-slate-50/30">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{generic.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(generic)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(generic)}
                          disabled={deletingId === generic.id}
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
        <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-[rgba(15,23,42,0.52)] p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.3)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
              <h3 className="text-lg font-semibold text-slate-900">{isEditing ? 'Edit Generic' : 'Create Generic'}</h3>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 px-8 py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">Generic Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                  placeholder="e.g. Amoxicillin, Paracetamol"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <button type="button" onClick={closeModal} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-70">
                  {saving ? 'Saving...' : isEditing ? 'Update Generic' : 'Create Generic'}
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
