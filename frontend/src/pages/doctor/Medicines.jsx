import { Head } from '@inertiajs/react';
import { Edit3, Pill, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DocButton, DocEmptyState } from '../../components/doctor/DocUI';
import DoctorLayout from '../../layouts/DoctorLayout';
import { toastError, toastSuccess } from '../../utils/toast';

const MEDICINES_PER_PAGE = 10;

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export default function DoctorMedicines() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', strength: '' });

  const isEditing = form.id !== null;

  const loadMedicines = async (pageNumber = 1, query = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNumber),
        per_page: String(MEDICINES_PER_PAGE),
      });
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        params.set('query', trimmedQuery);
      }

      const res = await fetch(`/api/doctor/medicines?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load medicines');
      const payload = await res.json();
      let nextRows = Array.isArray(payload?.data) ? payload.data : [];

      // Exact matches first, then starts-with, then rest
      if (trimmedQuery) {
        const q = trimmedQuery.toLowerCase();
        nextRows = [...nextRows].sort((a, b) => {
          const aN = (a.name || '').toLowerCase();
          const bN = (b.name || '').toLowerCase();
          const aRank = aN === q ? 0 : aN.startsWith(q) ? 1 : 2;
          const bRank = bN === q ? 0 : bN.startsWith(q) ? 1 : 2;
          return aRank - bRank;
        });
      }

      const nextLastPage = Number(payload?.last_page || 1);

      if (pageNumber > nextLastPage && nextLastPage > 0) {
        setPage(nextLastPage);
        return;
      }

      setRows(nextRows);
      setPagination({
        currentPage: Number(payload?.current_page || pageNumber),
        lastPage: nextLastPage,
        total: Number(payload?.total || nextRows.length),
        from: Number(payload?.from || 0),
        to: Number(payload?.to || 0),
      });
    } catch {
      toastError('Unable to load medicines.');
      setRows([]);
      setPagination({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines(page, searchTerm);
  }, [page, searchTerm]);

  const clearForm = () => setForm({ id: null, name: '', strength: '' });
  const closeModal = () => {
    setModalOpen(false);
    clearForm();
  };

  const openCreateModal = () => {
    clearForm();
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const strength = form.strength.trim();
    if (!name) {
      toastError('Medicine name is required.');
      return;
    }

    try {
      setSaving(true);
      const isUpdate = !!form.id;
      const url = isUpdate ? `/api/doctor/medicines/${form.id}` : '/api/doctor/medicines';
      const method = isUpdate ? 'PUT' : 'POST';
      const csrfToken = getCsrfToken();

      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ name, strength }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || 'Unable to save medicine.';
        throw new Error(message);
      }

      toastSuccess(isUpdate ? 'Medicine updated.' : 'Medicine added.');
      closeModal();
      await loadMedicines(page, searchTerm);
    } catch (error) {
      toastError(error?.message || 'Unable to save medicine.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setForm({
      id: row.id,
      name: row.name || '',
      strength: row.strength || '',
    });
    setModalOpen(true);
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Delete medicine "${row?.name || 'this medicine'}"?`);
    if (!ok) return;

    try {
      setDeletingId(row.id);
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/doctor/medicines/${row.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || 'Unable to delete medicine.';
        throw new Error(message);
      }

      toastSuccess('Medicine deleted.');
      if (form.id === row.id) closeModal();
      await loadMedicines(page, searchTerm);
    } catch (error) {
      toastError(error?.message || 'Unable to delete medicine.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DoctorLayout title="Medicines">
      <Head title="Medicines" />

      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#2D3A74]">Medicine </h2>
              <p className="text-sm text-slate-500">Create, edit, and remove medicine master data used in prescriptions.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              Total: <span className="font-semibold text-slate-900">{pagination.total}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="surface-card rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Medicine List</h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search medicine..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 transition "
                  />
                </div>
                <DocButton type="button" size="sm" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" /> Add Medicine
                </DocButton>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="text-sm text-slate-500">Loading medicines...</div>
              ) : rows.length === 0 ? (
                <DocEmptyState icon={Pill} title="No medicines found." description="Click Add Medicine to create your first item." />
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex w-full items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm transition group hover:border-[#d9c2ac] hover:bg-[#fff7f0]"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="font-semibold text-slate-800 transition-colors group-hover:text-[#3556a6]">{row.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{row.strength || 'No strength'}</div>
                      </div>

                      <div className="ml-2 flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2f8] bg-white px-3 py-1.5 text-xs font-semibold text-[#3556a6] transition hover:bg-[#f3f7ff]"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          disabled={deletingId === row.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#f2c4c4] bg-[#fff6f6] px-3 py-1.5 text-xs font-semibold text-[#b74444] transition hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingId === row.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      Showing <span className="font-semibold text-slate-900">{pagination.from || 0}-{pagination.to || rows.length}</span> of <span className="font-semibold text-slate-900">{pagination.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={loading || page <= 1}
                      >
                        Previous
                      </button>
                      <span className="text-xs font-semibold text-slate-500">
                        Page {pagination.currentPage} of {pagination.lastPage}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
                        disabled={loading || page >= pagination.lastPage}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {modalOpen && typeof document !== 'undefined'
          ? createPortal(
              <div className="fixed inset-0 z-[120] h-screen w-screen bg-slate-900/45">
                <button
                  type="button"
                  className="absolute inset-0"
                  aria-label="Close modal"
                  onClick={closeModal}
                />
                <div className="fixed left-1/2 top-1/2 z-10 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {isEditing ? 'Edit Medicine' : 'Add Medicine'}
                    </h2>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-4 p-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Medicine Name</label>
                      <div className="relative">
                        <Pill className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          autoFocus
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Napa"
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition "
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Strength</label>
                      <input
                        type="text"
                        value={form.strength}
                        onChange={(e) => setForm((prev) => ({ ...prev, strength: e.target.value }))}
                        placeholder="e.g. 500mg"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 transition "
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <DocButton type="button" variant="secondary" size="sm" onClick={closeModal} disabled={saving}>
                        Cancel
                      </DocButton>
                      <DocButton type="submit" size="sm" disabled={saving}>
                        {saving ? 'Saving...' : isEditing ? <><Save className="h-4 w-4" /> Update</> : <><Plus className="h-4 w-4" /> Add</>}
                      </DocButton>
                    </div>
                  </form>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </DoctorLayout>
  );
}
