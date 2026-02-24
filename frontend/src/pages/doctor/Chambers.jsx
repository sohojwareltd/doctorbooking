import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, MapPin, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';

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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#005963]">Chambers</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your physical chambers. These are shown on the public booking page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <GlassCard variant="solid" className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#005963]">
            {isEditing ? 'Edit Chamber' : 'Add Chamber'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Name</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#005963]" />
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="City Heart Clinic"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#005963]" />
                <input
                  type="text"
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#005963]" />
                <input
                  type="text"
                  className="w-full rounded-xl border border-[#00acb1]/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Google Maps URL (optional)
              </label>
              <input
                type="url"
                className="w-full rounded-xl border border-[#00acb1]/30 bg-white py-2 px-3 text-sm text-gray-900 focus:border-[#005963] focus:outline-none focus:ring-2 focus:ring-[#005963]/10"
                value={data.google_maps_url}
                onChange={(e) => setData('google_maps_url', e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                disabled={processing}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Paste a shared Google Maps link if you have one. If empty, we will still build a
                directions link from the location text.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Active</span>
              <button
                type="button"
                onClick={() => setData('is_active', !data.is_active)}
                className="flex items-center gap-2 text-xs font-medium text-[#005963]"
              >
                {data.is_active ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-emerald-500" />
                    <span>Visible on public page</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                    <span>Hidden from public page</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleNew}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                disabled={processing}
              >
                Clear
              </button>
              <PrimaryButton type="submit" disabled={processing}>
                {processing ? 'Saving…' : isEditing ? 'Update Chamber' : 'Add Chamber'}
              </PrimaryButton>
            </div>

            {flashSuccess && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                {flashSuccess}
              </div>
            )}
          </form>
        </GlassCard>

        {/* List */}
        <GlassCard variant="solid" className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#005963]">
              Existing Chambers
            </h2>
          </div>

          {chambers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              You have not added any chambers yet.
            </div>
          ) : (
            <div className="space-y-3">
              {chambers.map((ch) => {
                const mapsUrl =
                  ch.google_maps_url && ch.google_maps_url.trim() !== ''
                    ? ch.google_maps_url
                    : ch.location
                      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          ch.location
                        )}`
                      : null;
                return (
                  <div
                    key={ch.id}
                    className="flex w-full items-center justify-between rounded-xl border border-[#00acb1]/20 bg-white px-4 py-3 text-sm hover:border-[#00acb1] hover:bg-[#00acb1]/5 transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleEdit(ch)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold text-[#005963]">{ch.name}</div>
                      {ch.location && (
                        <div className="text-xs text-gray-600 mt-0.5">{ch.location}</div>
                      )}
                      {ch.phone && (
                        <div className="text-xs text-gray-500 mt-0.5">{ch.phone}</div>
                      )}
                      {mapsUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="mt-1 text-[11px] font-semibold text-[#005963] underline underline-offset-2"
                        >
                          Open in Google Maps
                        </button>
                      )}
                    </button>
                    <div className="ml-3 text-xs font-semibold">
                      {ch.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-50 px-3 py-1 text-gray-500 border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </DoctorLayout>
  );
}

