import { Head, Link, router, usePage } from '@inertiajs/react';
import { Mail, Phone, Plus, UserPlus, Pencil, Trash2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Compounders({ compounders }) {
  const { flash = {} } = usePage().props;
  const rows = compounders?.data || [];
  const prevLink = (compounders?.links || []).find((item) => String(item.label).toLowerCase().includes('previous'));
  const nextLink = (compounders?.links || []).find((item) => String(item.label).toLowerCase().includes('next'));

  const handleDelete = (row) => {
    const confirmed = window.confirm(`Delete compounder "${row.name || 'this compounder'}"?`);
    if (!confirmed) {
      return;
    }

    router.delete(`/doctor/compounder/${row.id}`);
  };

  return (
    <DoctorLayout title="Compounders">
      <Head title="Compounders" />

      <div className="mx-auto max-w-[1400px]">
        {flash.success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash.success}
          </div>
        )}

        <section className="surface-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#2D3A74]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#2D3A74]">Compounders</h1>
                  <p className="text-sm text-slate-500">Manage your compounder team members</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {compounders?.total ?? rows.length}
                </span>
              </div>

              <Link
                href="/doctor/compounder/create"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243063]"
              >
                <Plus className="h-4 w-4" />
                Create Compounder
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100">
            <div className="md:hidden divide-y divide-slate-100">
              {rows.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">No compounder found.</div>
              ) : rows.map((row) => (
                <div key={row.id} className="space-y-2 px-6 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{row.name || 'N/A'}</div>
                      {row.designation && <div className="text-xs text-slate-500">{row.designation}</div>}
                    </div>
                    <div className="shrink-0 text-xs text-slate-400">
                      {formatDisplayDateWithYearFromDateLike(row.created_at) || row.created_at || ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">@{row.username || 'N/A'}</div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {row.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {row.phone || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/doctor/compounder/${row.id}/edit`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Username</th>
                    <th className="px-6 py-4 text-left">Contact</th>
                    <th className="px-6 py-4 text-left">Designation</th>
                    <th className="px-6 py-4 text-left">Created</th>
                    <th className="px-6 py-4 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                        No compounder found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="transition hover:bg-slate-50/60">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{row.username || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span>{row.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{row.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{row.designation || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDisplayDateWithYearFromDateLike(row.created_at) || row.created_at || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/doctor/compounder/${row.id}/edit`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > 0 ? (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  Showing <span className="font-semibold text-slate-900">{compounders.from || 0}-{compounders.to || rows.length}</span> of{' '}
                  <span className="font-semibold text-slate-900">{compounders.total || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  {prevLink?.url ? (
                    <Link
                      href={prevLink.url}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      preserveScroll
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                      Previous
                    </span>
                  )}
                  <span className="text-sm font-semibold text-slate-600">
                    Page {compounders.current_page || 1} of {compounders.last_page || 1}
                  </span>
                  {nextLink?.url ? (
                    <Link
                      href={nextLink.url}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      preserveScroll
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                      Next
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DoctorLayout>
  );
}
