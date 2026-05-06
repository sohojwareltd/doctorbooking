import { Head } from '@inertiajs/react';
import { Edit3, Pill, Plus, Search, Trash2, X, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
  const [generics, setGenerics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGenerics, setLoadingGenerics] = useState(false);
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
  const [form, setForm] = useState({ id: null, name: '', strength: '', generic_id: '' });
  const [showGenericDropdown, setShowGenericDropdown] = useState(false);
  const [genericSearch, setGenericSearch] = useState('');
  const genericDropdownRef = useRef(null);

  const isEditing = form.id !== null;
  const filteredGenerics = generics.filter((generic) =>
    (generic?.name || '').toLowerCase().includes(genericSearch.trim().toLowerCase()),
  );

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genericDropdownRef.current && !genericDropdownRef.current.contains(e.target)) {
        setShowGenericDropdown(false);
      }
    };

    if (showGenericDropdown && modalOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showGenericDropdown, modalOpen]);

  const loadGenerics = async () => {
    try {
      setLoadingGenerics(true);
      const res = await fetch('/api/doctor/generics?per_page=999', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load generics');
      const payload = await res.json();
      const data = Array.isArray(payload?.data) ? payload.data : [];
      setGenerics(data);
    } catch {
      toastError('Unable to load generics.');
      setGenerics([]);
    } finally {
      setLoadingGenerics(false);
    }
  };

  const clearForm = () => setForm({ id: null, name: '', strength: '', generic_id: '' });
  const closeModal = () => {
    setModalOpen(false);
    setShowGenericDropdown(false);
    setGenericSearch('');
    clearForm();
  };

  const openCreateModal = async () => {
    clearForm();
    setGenericSearch('');
    await loadGenerics();
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
        body: JSON.stringify({
          name,
          strength,
          generic_id: form.generic_id || null
        }),
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

  const onEdit = async (row) => {
    await loadGenerics();
    setGenericSearch('');
    setForm({
      id: row.id,
      name: row.name || '',
      strength: row.strength || '',
      generic_id: row.generic_id || '',
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

      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2D3A74]">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#2D3A74]">Medicines Management</h1>
                  <p className="text-sm text-slate-500">Manage medicines used in prescriptions</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D3A74] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Medicine</span>
              </button>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by medicine name or generic..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading medicines...</div>
            ) : rows.length === 0 ? (
              <DocEmptyState icon={Pill} title="No medicines found." description="Click Add Medicine to create your first item." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-center w-12">SL</th>
                        <th className="px-6 py-4 text-left">Medicine</th>
                        <th className="px-6 py-4 text-left">Strength</th>
                        <th className="px-6 py-4 text-left">Generic</th>
                        <th className="px-6 py-4 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {rows.map((row, index) => (
                        <tr key={row.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                          <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 bg-slate-50/30">{index + 1}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{row.strength || '—'}</td>
                          <td className="px-6 py-4 text-sm text-indigo-600 font-medium">{row.generic_name || '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(row)}
                                disabled={deletingId === row.id}
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

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Showing <span className="font-semibold text-slate-900">{pagination.from || 0}-{pagination.to || rows.length}</span> of{' '}
                    <span className="font-semibold text-slate-900">{pagination.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={loading || page <= 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-slate-600">
                      Page {pagination.currentPage} of {pagination.lastPage}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
                      disabled={loading || page >= pagination.lastPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {modalOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-[rgba(15,23,42,0.52)] p-4 backdrop-blur-[4px]">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.3)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                <h3 className="text-lg font-semibold text-slate-900">{isEditing ? 'Edit Medicine' : 'Add Medicine'}</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-6 px-8 py-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Medicine Name *</label>
                  <div className="relative">
                    <Pill className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Napa"
                      className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Generic</label>
                  <div className="relative" ref={genericDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowGenericDropdown(!showGenericDropdown)}
                      disabled={saving || loadingGenerics}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 transition hover:border-slate-300 focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20 disabled:opacity-50"
                    >
                      <span>
                        {loadingGenerics ? 'Loading...' : form.generic_id ? generics.find((g) => g.id === parseInt(form.generic_id, 10))?.name || 'Select a generic' : 'Select a generic'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    {showGenericDropdown && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={genericSearch}
                              onChange={(e) => setGenericSearch(e.target.value)}
                              placeholder="Search generic..."
                              className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, generic_id: '' }));
                            setShowGenericDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 text-slate-600 font-medium"
                        >
                          None
                        </button>
                        {filteredGenerics.map((generic) => (
                          <button
                            key={generic.id}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, generic_id: String(generic.id) }));
                              setShowGenericDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition ${form.generic_id === String(generic.id)
                                ? 'bg-[#EEF2FF] text-[#2D3A74] font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            {generic.name}
                          </button>
                        ))}
                        {filteredGenerics.length === 0 && (
                          <div className="px-4 py-3 text-xs text-slate-500">No generic found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Strength</label>
                  <input
                    type="text"
                    value={form.strength}
                    onChange={(e) => setForm((prev) => ({ ...prev, strength: e.target.value }))}
                    placeholder="e.g. 500mg"
                    className="block w-full rounded-lg border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 transition focus:border-[#2D3A74] focus:ring-2 focus:ring-[#2D3A74]/20"
                    disabled={saving}
                  />
                </div>



                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
                  <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243063] disabled:opacity-70">
                    {saving ? 'Saving...' : isEditing ? 'Update Medicine' : 'Add Medicine'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
        : null}
    </DoctorLayout>
  );
}
