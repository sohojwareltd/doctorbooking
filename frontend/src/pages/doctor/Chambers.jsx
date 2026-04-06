import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone, ToggleLeft, ToggleRight, ExternalLink, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocButton, DocCard, DocEmptyState } from '../../components/doctor/DocUI';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorChambers() {
  const page = usePage();
  const chambers = Array.isArray(page?.props?.chambers) ? page.props.chambers : [];
  const flash = page?.props?.flash || {};
  const [deletingId, setDeletingId] = useState(null);
  const activeCount = chambers.filter((ch) => !!ch.is_active).length;
  const mappedCount = chambers.filter((ch) => (ch.google_maps_url && ch.google_maps_url.trim() !== '') || ch.location).length;
  const chamberHeaderMetrics = [
    {
      label: 'Total',
      value: chambers.length,
      icon: Building2,
      tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f8fbff]',
      hoverTone: 'doc-banner-metric-sky',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: ToggleRight,
      tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#fff1e2]',
      hoverTone: 'doc-banner-metric-amber',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Mapped',
      value: mappedCount,
      icon: MapPin,
      tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#f3f7ff]',
      hoverTone: 'doc-banner-metric-violet',
      iconTone: 'bg-white/20 border-white/30',
    },
    {
      label: 'Draft',
      value: chambers.length - activeCount,
      icon: ToggleLeft,
      tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#fff0e2]',
      hoverTone: 'doc-banner-metric-orange',
      iconTone: 'bg-white/20 border-white/30',
    },
  ];

  const { data, setData, post, processing, reset } = useForm({
    id: null,
    name: '',
    location: '',
    phone: '',
    google_maps_url: '',
    is_active: true,
  });

  const isEditing = data.id !== null;

  useEffect(() => {
    if (flash?.success) {
      toastSuccess(flash.success);
    }
    if (flash?.error) {
      toastError(flash.error);
    }
  }, [flash]);

  const handleEdit = (ch) => {
    setData({
      id: ch.id,
      name: ch.name || '',
      location: ch.location || '',
      phone: ch.phone || '',
      google_maps_url: ch.google_maps_url || '',
      is_active: !!ch.is_active,
    });
  };

  const handleNew = () => {
    reset();
    setData('id', null);
    setData('google_maps_url', '');
    setData('is_active', true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/doctor/chambers', {
      preserveScroll: true,
      onSuccess: () => {
        handleNew();
      },
    });
  };

  const handleDelete = (chamber) => {
    if (!chamber?.id) return;
    const ok = window.confirm(`Delete chamber \"${chamber.name || 'this chamber'}\"?`);
    if (!ok) return;

    setDeletingId(chamber.id);
    router.delete(`/doctor/chambers/${chamber.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        if (data.id === chamber.id) {
          handleNew();
        }
      },
      onFinish: () => {
        setDeletingId(null);
      },
    });
  };

  return (
    <DoctorLayout title="Chambers">
      <Head title="Chambers" />

      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#2D3A74]">Chambers</h2>
              <p className="text-sm text-slate-500">Manage chamber details and public visibility.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-600">Total: <span className="font-semibold text-slate-900">{chambers.length}</span></span>
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700">Active: <span className="font-semibold">{activeCount}</span></span>
              <span className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-sky-700">Mapped: <span className="font-semibold">{mappedCount}</span></span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <section className="surface-card rounded-3xl overflow-hidden lg:col-span-1">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              {isEditing ? 'Edit Chamber' : 'Add Chamber'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition doc-input-focus"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="City Heart Clinic"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition doc-input-focus"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition doc-input-focus"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Google Maps URL <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="url"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 transition doc-input-focus"
                value={data.google_maps_url}
                onChange={(e) => setData('google_maps_url', e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                disabled={processing}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Paste a shared Google Maps link. If empty, a directions link is built from location text.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <span className="text-sm font-medium text-slate-700">Active</span>
              <button
                type="button"
                onClick={() => setData('is_active', !data.is_active)}
                className="flex items-center gap-2 text-xs font-medium"
              >
                {data.is_active ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-[#c57945]" />
                    <span className="text-[#ad6639]">Visible on public page</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-500">Hidden from public page</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <DocButton type="button" variant="secondary" size="sm" onClick={handleNew} disabled={processing}>
                Clear
              </DocButton>
              <DocButton type="submit" size="sm" disabled={processing}>
                {processing ? 'Saving…' : isEditing ? 'Update Chamber' : 'Add Chamber'}
              </DocButton>
            </div>

          </form>
        </section>

        {/* List */}
        <section className="surface-card rounded-3xl overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Existing Chambers
            </h2>
          </div>

          <div className="p-5">

          {chambers.length === 0 ? (
            <DocEmptyState icon={Building2} title="You have not added any chambers yet." />
          ) : (
            <div className="space-y-3">
              {chambers.map((ch) => {
                const mapsUrl =
                  ch.google_maps_url && ch.google_maps_url.trim() !== ''
                    ? ch.google_maps_url
                    : ch.location
                      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ch.location)}`
                      : null;
                return (
                  <div
                    key={ch.id}
                    className="flex w-full items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm transition group hover:border-[#d9c2ac] hover:bg-[#fff7f0]"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <button type="button" onClick={() => handleEdit(ch)} className="text-left">
                        <div className="font-semibold text-slate-800 transition-colors group-hover:text-[#3556a6]">{ch.name}</div>
                      </button>
                      {ch.location && <div className="mt-0.5 text-xs text-slate-500">{ch.location}</div>}
                      {ch.phone && <div className="mt-0.5 text-xs text-slate-400">{ch.phone}</div>}
                      {mapsUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#3556a6] transition hover:text-[#2a488f]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Google Maps
                        </button>
                      )}
                    </div>

                    <div className="ml-2 flex shrink-0 flex-col items-end gap-3">
                      <div className="text-xs font-semibold">
                        {ch.is_active ? (
                          <span className="rounded-full border border-[#efc7a9] bg-[#fff6ee] px-3 py-1 text-[#ad6639]">Active</span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">Inactive</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(ch)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2f8] bg-white px-3 py-1.5 text-xs font-semibold text-[#3556a6] transition hover:bg-[#f3f7ff]"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ch)}
                          disabled={processing || deletingId === ch.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#f2c4c4] bg-[#fff6f6] px-3 py-1.5 text-xs font-semibold text-[#b74444] transition hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingId === ch.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </section>
        </div>
      </div>
    </DoctorLayout>
  );
}
