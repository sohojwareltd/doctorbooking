import { Head, Link, router, usePage } from '@inertiajs/react';
import { Mail, Phone, Plus, UserPlus, Pencil, Trash2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { formatDisplayDateWithYearFromDateLike } from '../../utils/dateFormat';

export default function Compounders({ compounders }) {
  const { flash = {} } = usePage().props;
  const rows = compounders?.data || [];
  const links = compounders?.links || [];

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

      <div className="mx-auto max-w-6xl px-4 py-6">
        {flash.success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash.success}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#2D3A74] p-2.5 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Compounders</h1>
              <p className="text-sm text-slate-500">Manage your compounder team members.</p>
            </div>
          </div>
          <Link
            href="/doctor/compounder/create"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f2a5a]"
          >
            <Plus className="h-4 w-4" />
            Create Compounder
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                      No compounder found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{row.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.username || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
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
                      <td className="px-4 py-3 text-sm text-slate-700">{row.designation || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDisplayDateWithYearFromDateLike(row.created_at) || row.created_at || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/doctor/compounder/${row.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2f8] bg-white px-3 py-1.5 text-xs font-semibold text-[#3556a6] transition hover:bg-[#f3f7ff]"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f2c4c4] bg-[#fff6f6] px-3 py-1.5 text-xs font-semibold text-[#b74444] transition hover:bg-[#ffeaea]"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {links.length > 3 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3">
              {links.map((link, idx) => (
                <Link
                  key={`${link.label}-${idx}`}
                  href={link.url || '#'}
                  className={`rounded-md border px-3 py-1.5 text-sm ${link.active ? 'border-[#2D3A74] bg-[#2D3A74] text-white' : 'border-slate-200 bg-white text-slate-700'} ${!link.url ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50'}`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
