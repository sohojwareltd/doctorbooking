import { Head } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { FlaskConical, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { toastError, toastSuccess } from '../../utils/toast';

const emptyForm = {
  id: null,
  name: '',
};

export default function InvestigationTests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState(null);
  const isEditing = form.id !== null;

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/investigation-tests', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to load investigation items.');
        return;
      }
      setItems(Array.isArray(body?.items) ? body.items : []);
    } catch {
      toastError('Network error while loading investigation items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreateModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setForm({
      id: item.id,
      name: String(item.name || ''),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(emptyForm);
  };

  const saveItem = async (event) => {
    event.preventDefault();

    const payload = {
      name: String(form.name || '').trim(),
    };

    if (!payload.name) {
      toastError('Please enter investigation test name.');
      return;
    }

    try {
      setSaving(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const url = isEditing ? `/api/doctor/investigation-tests/${form.id}` : '/api/doctor/investigation-tests';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(responseBody?.message || 'Failed to save investigation test.');
        return;
      }

      toastSuccess(responseBody?.message || (isEditing ? 'Investigation test updated.' : 'Investigation test created.'));
      closeModal();
      await loadItems();
    } catch {
      toastError('Network error while saving investigation test.');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId) => {
    if (deletingId) return;

    try {
      setDeletingId(itemId);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const res = await fetch(`/api/doctor/investigation-tests/${itemId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(body?.message || 'Failed to delete investigation test.');
        return;
      }
      toastSuccess(body?.message || 'Investigation test deleted.');
      await loadItems();
    } catch {
      toastError('Network error while deleting investigation test.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DoctorLayout title="Investigation Tests">
      <Head title="Investigation Tests" />
      <div className="mx-auto max-w-[1200px]">
        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#2D3A74]">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#2D3A74]">Investigation Tests</h1>
                  <p className="text-sm text-slate-500">Manage laboratory investigation tests</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                Add Test
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Test Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">Loading...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">No investigation tests found.</td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-600">#{item.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => void deleteItem(item.id)}
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

        {showModal && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,0.46)] p-4 pt-8 backdrop-blur-[4px]">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="text-base font-bold text-slate-800">
                  {isEditing ? 'Edit Investigation Test' : 'Add Investigation Test'}
                </h3>
                <button type="button" onClick={closeModal} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={saveItem} className="space-y-4 px-5 py-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Test Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    placeholder="e.g. CBC"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-60">
                    {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        ) : null}
      </div>
    </DoctorLayout>
  );
}
