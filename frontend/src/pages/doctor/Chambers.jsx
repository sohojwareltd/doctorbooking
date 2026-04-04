import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, MapPin, Phone, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocButton, DocCard, DocEmptyState, DocInput } from '../../components/doctor/DocUI';

export default function DoctorChambers() {
  const page = usePage();
  const chambers = Array.isArray(page?.props?.chambers) ? page.props.chambers : [];
  const flashSuccess = page?.props?.flash?.success || '';

  const { data, setData, post, processing, reset } = useForm({
    id: null,
    name: '',
    location: '',
    phone: '',
    google_maps_url: '',
    is_active: true,
  });

  const isEditing = data.id !== null;

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

  return (
    <DoctorLayout title="Chambers">
      <Head title="Chambers" />

      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <DocCard className="lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isEditing ? 'Edit Chamber' : 'Add Chamber'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                    <ToggleRight className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-600">Visible on public page</span>
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

            {flashSuccess && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                {flashSuccess}
              </div>
            )}
          </form>
        </DocCard>

        {/* List */}
        <DocCard className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Existing Chambers
          </h2>

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
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:border-sky-200 hover:bg-sky-50/30 transition group"
                  >
                    <button type="button" onClick={() => handleEdit(ch)} className="flex-1 text-left">
                      <div className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{ch.name}</div>
                      {ch.location && <div className="text-xs text-slate-500 mt-0.5">{ch.location}</div>}
                      {ch.phone && <div className="text-xs text-slate-400 mt-0.5">{ch.phone}</div>}
                      {mapsUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Google Maps
                        </button>
                      )}
                    </button>
                    <div className="ml-3 text-xs font-semibold">
                      {ch.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">Active</span>
                      ) : (
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-500 border border-slate-200">Inactive</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DocCard>
      </div>
    </DoctorLayout>
  );
}
