import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, MapPin, Phone, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocButton, DocCard, DocEmptyState, DocInput } from '../../components/doctor/DocUI';

export default function DoctorChambers() {
  const page = usePage();
  const chambers = Array.isArray(page?.props?.chambers) ? page.props.chambers : [];
  const flashSuccess = page?.props?.flash?.success || '';
  const activeCount = chambers.filter((ch) => !!ch.is_active).length;
  const mappedCount = chambers.filter((ch) => (ch.google_maps_url && ch.google_maps_url.trim() !== '') || ch.location).length;

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

      <div className="mx-auto max-w-6xl space-y-6">
        <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
          <div className="pointer-events-none absolute -top-20 left-[-50px] h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-[-26px] h-52 w-52 rounded-full bg-[#efba92]/15" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <Building2 className="h-3.5 w-3.5" />
                  Practice Locations
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">Doctor Chambers</p>
                <h1 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">Chamber Workspace</h1>
                <p className="max-w-xl text-[13px] text-white/80">Manage chamber addresses, contact details, map links, and public visibility from one place.</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Mode</div>
                    <div className="mt-0.5 text-xs font-bold text-white">{isEditing ? 'Editing Chamber' : 'Add Chamber'}</div>
                  </div>
                  <DocButton type="button" size="sm" variant="accent" onClick={handleNew} disabled={processing} className="!px-3 !py-1.5">
                    New Chamber
                  </DocButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: chambers.length, tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f2f6ff]' },
                  { label: 'Active', value: activeCount, tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#ffe6d3]' },
                  { label: 'Mapped', value: mappedCount, tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#eaf0ff]' },
                  { label: 'Draft', value: chambers.length - activeCount, tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#ffe3cf]' },
                ].map((item) => (
                  <div key={item.label} className={`doc-banner-metric rounded-lg border px-2.5 py-2 ${item.tone}`}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.11em]">{item.label}</div>
                    <div className="mt-1 text-lg font-black leading-none">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DocCard>

        <div className="grid gap-6 lg:grid-cols-3">
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

            {flashSuccess && (
              <div className="mt-3 rounded-lg border border-[#efc7a9] bg-[#fff6ee] px-3 py-2 text-xs font-semibold text-[#ad6639]">
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
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition group hover:border-[#d9c2ac] hover:bg-[#fff7f0]"
                  >
                    <button type="button" onClick={() => handleEdit(ch)} className="flex-1 text-left">
                      <div className="font-semibold text-slate-800 transition-colors group-hover:text-[#3556a6]">{ch.name}</div>
                      {ch.location && <div className="text-xs text-slate-500 mt-0.5">{ch.location}</div>}
                      {ch.phone && <div className="text-xs text-slate-400 mt-0.5">{ch.phone}</div>}
                      {mapsUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#3556a6] transition hover:text-[#2a488f]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Google Maps
                        </button>
                      )}
                    </button>
                    <div className="ml-3 text-xs font-semibold">
                      {ch.is_active ? (
                        <span className="rounded-full border border-[#efc7a9] bg-[#fff6ee] px-2.5 py-1 text-[#ad6639]">Active</span>
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
      </div>
    </DoctorLayout>
  );
}
