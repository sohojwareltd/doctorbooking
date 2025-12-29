import React, { useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Settings as SettingsIcon } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import { toastError, toastSuccess } from '@/utils/toast';

function safeParseJson(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function updateAtPath(prev, path, nextValueOrUpdater) {
  if (!path.length) return prev;
  const key = path[0];
  const isIndex = typeof key === 'number';
  const clone = Array.isArray(prev) ? [...prev] : { ...(prev || {}) };
  const current = prev ? prev[key] : undefined;

  if (path.length === 1) {
    clone[key] = typeof nextValueOrUpdater === 'function' ? nextValueOrUpdater(current) : nextValueOrUpdater;
    return clone;
  }

  const nextContainer = typeof path[1] === 'number' ? asArray(current) : (current && typeof current === 'object' ? current : {});
  clone[key] = updateAtPath(nextContainer, path.slice(1), nextValueOrUpdater);
  return clone;
}

function removeFromArray(prev, pathToArray, index) {
  return updateAtPath(prev, pathToArray, (arr) => asArray(arr).filter((_, i) => i !== index));
}

function addToArray(prev, pathToArray, item) {
  return updateAtPath(prev, pathToArray, (arr) => [...asArray(arr), item]);
}

export default function Settings({ auth, homeJson = '', status = null }) {
  const initialHome = useMemo(() => safeParseJson(homeJson, {}), [homeJson]);

  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    home_json: JSON.stringify(initialHome || {}, null, 2),
  });
  const [home, setHome] = React.useState(initialHome);
  const [uploading, setUploading] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('meta');

  React.useEffect(() => {
    setData('home_json', JSON.stringify(home || {}, null, 2));
  }, [home, setData]);

  const banner = status || (recentlySuccessful ? 'Home content saved.' : null);

  const onSubmit = (e) => {
    e.preventDefault();
    setData('home_json', JSON.stringify(home || {}, null, 2));
    put('/admin/settings/site-content/home', {
      preserveScroll: true,
      onSuccess: () => toastSuccess('Home content saved.'),
      onError: () => toastError('Failed to save home content.'),
    });
  };

  const inputClass =
    'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00acb1]/30';
  const labelClass = 'block text-sm font-semibold text-[#005963] mb-2';
  const helpClass = 'text-xs text-gray-500 mt-1';
  const sectionTitleClass = 'text-lg font-bold text-[#005963]';
  const sectionSubClass = 'text-sm text-gray-600';

  const hero = home?.hero || {};
  const meta = home?.meta || {};
  const about = home?.about || {};
  const services = home?.services || {};
  const gallery = home?.gallery || {};
  const contact = home?.contact || {};
  const caseStudies = home?.caseStudies || {};
  const footer = home?.footer || {};

  const trust = asArray(hero.trust);
  const features = asArray(hero.features);
  const aboutStats = asArray(about.stats);
  const aboutParagraphs = asArray(about.paragraphs);
  const aboutCredentials = asArray(about.credentials);
  const serviceItems = asArray(services.items);
  const galleryImages = asArray(gallery.images);
  const contactMethods = asArray(contact.methods);
  const officeHours = asArray(contact.officeHours);
  const caseItems = asArray(caseStudies.items);
  const footerLinks = asArray(footer.links);
  const footerContactLines = asArray(footer.contactLines);

  const uploadToServer = async (file) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const form = new FormData();
    form.append('image', file);

    const res = await fetch('/admin/settings/site-content/upload', {
      method: 'POST',
      headers: token ? { 'X-CSRF-TOKEN': token, Accept: 'application/json' } : { Accept: 'application/json' },
      body: form,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Upload failed');
    }

    const data = await res.json();
    if (!data?.url) throw new Error('Upload failed');
    return data.url;
  };

  const ImagePreview = ({ url, onClear }) => {
    if (!url) return null;

    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 relative">
        {typeof onClear === 'function' && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 rounded-full bg-white/90 border border-gray-200 px-2.5 py-1 text-xs font-bold text-[#005963] hover:bg-white transition"
            aria-label="Remove image"
            title="Remove image"
          >
            ×
          </button>
        )}
        <img
          src={url}
          alt="Preview"
          className="h-56 w-full object-contain bg-white"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="px-4 py-3 text-xs text-gray-500">Preview (if the URL is reachable)</div>
      </div>
    );
  };

  const tabs = [
    { key: 'meta', label: 'Meta' },
    { key: 'hero', label: 'Hero' },
    { key: 'about', label: 'About' },
    { key: 'services', label: 'Services' },
    { key: 'caseStudies', label: 'Case Studies' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'contact', label: 'Contact' },
    { key: 'footer', label: 'Footer' },
  ];

  const TabButton = ({ tabKey, children }) => {
    const active = activeTab === tabKey;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tabKey)}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          active
            ? 'bg-[#005963] text-white'
            : 'bg-[#00acb1]/10 text-[#005963] hover:bg-[#00acb1]/20'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <AdminLayout user={auth?.user}>
      <Head title="Content Settings" />

      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl border border-[#00acb1]/20 bg-white/60 p-2">
            <SettingsIcon className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Content Settings</h1>
            <p className="mt-1 text-sm text-gray-700">Edit homepage content stored in the database.</p>
          </div>
        </div>

        {banner && (
          <div className="mb-4">
            <GlassCard variant="solid" hover={false} className="p-4">
              <div className="text-sm font-semibold text-[#005963]">{banner}</div>
            </GlassCard>
          </div>
        )}

        {errors.home_json && (
          <div className="mb-4">
            <GlassCard variant="solid" hover={false} className="p-4">
              <div className="text-sm font-semibold text-red-700">{errors.home_json}</div>
            </GlassCard>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={sectionTitleClass}>Save Changes</div>
                <div className={sectionSubClass}>Update section-by-section, then save.</div>
              </div>
              <div className="flex items-center gap-3">
                <PrimaryButton type="submit" disabled={processing}>
                  {processing ? 'Saving…' : 'Save'}
                </PrimaryButton>
                {recentlySuccessful && <span className="text-sm text-gray-600">Saved.</span>}
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" hover={false} className="p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <TabButton key={t.key} tabKey={t.key}>{t.label}</TabButton>
              ))}
            </div>
          </GlassCard>

          {/* Meta */}
          {activeTab === 'meta' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Meta</div>
              <div className={sectionSubClass}>Browser title and SEO description.</div>
            </div>
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={meta.title || ''}
                  onChange={(e) => setHome((p) => updateAtPath(p, ['meta', 'title'], e.target.value))}
                  placeholder="Home page title"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={meta.description || ''}
                  onChange={(e) => setHome((p) => updateAtPath(p, ['meta', 'description'], e.target.value))}
                  placeholder="Home page meta description"
                />
              </div>
            </div>
          </GlassCard>
          )}

          {/* Hero */}
          {activeTab === 'hero' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Hero</div>
              <div className={sectionSubClass}>Top section content.</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    className={inputClass}
                    value={hero.name || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'name'], e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Badge</label>
                  <input
                    className={inputClass}
                    value={hero.badge || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'badge'], e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  className={inputClass}
                  value={hero.subtitle || ''}
                  onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'subtitle'], e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={hero.description || ''}
                  onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'description'], e.target.value))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <div className="flex gap-3">
                    <input
                      className={inputClass}
                      value={hero?.image?.url || ''}
                      onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'image', 'url'], e.target.value))}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                      {uploading.heroImage ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={!!uploading.heroImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading((p) => ({ ...p, heroImage: true }));
                          try {
                            const url = await uploadToServer(file);
                            setHome((p) => updateAtPath(p, ['hero', 'image', 'url'], url));
                            toastSuccess('Image uploaded.');
                          } catch (err) {
                            toastError(err?.message || 'Upload failed.');
                          } finally {
                            setUploading((p) => ({ ...p, heroImage: false }));
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    <div className={helpClass}>Upload will generate a local URL.</div>
                  </div>
                  <ImagePreview
                    url={hero?.image?.url || ''}
                    onClear={() => setHome((p) => updateAtPath(p, ['hero', 'image', 'url'], ''))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Image Alt</label>
                  <input
                    className={inputClass}
                    value={hero?.image?.alt || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'image', 'alt'], e.target.value))}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Trust Items</label>
                  <button
                    type="button"
                    className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                    onClick={() =>
                      setHome((p) => addToArray(p, ['hero', 'trust'], { label: '', value: '' }))
                    }
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {trust.map((item, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-5">
                      <input
                        className={`${inputClass} sm:col-span-2`}
                        placeholder="Label"
                        value={item?.label || ''}
                        onChange={(e) =>
                          setHome((p) => updateAtPath(p, ['hero', 'trust', idx, 'label'], e.target.value))
                        }
                      />
                      <input
                        className={`${inputClass} sm:col-span-2`}
                        placeholder="Value"
                        value={item?.value || ''}
                        onChange={(e) =>
                          setHome((p) => updateAtPath(p, ['hero', 'trust', idx, 'value'], e.target.value))
                        }
                      />
                      <button
                        type="button"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setHome((p) => removeFromArray(p, ['hero', 'trust'], idx))}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Features</label>
                  <button
                    type="button"
                    className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                    onClick={() => setHome((p) => addToArray(p, ['hero', 'features'], ''))}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6">
                      <input
                        className={`${inputClass} sm:col-span-5`}
                        value={feature || ''}
                        onChange={(e) => setHome((p) => updateAtPath(p, ['hero', 'features', idx], e.target.value))}
                        placeholder="Feature text"
                      />
                      <button
                        type="button"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setHome((p) => removeFromArray(p, ['hero', 'features'], idx))}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
          )}

          {/* About */}
          {activeTab === 'about' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>About</div>
              <div className={sectionSubClass}>About section content and stats.</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={about.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'title'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={about.subtitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'subtitle'], e.target.value))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input className={inputClass} value={about?.image?.url || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'image', 'url'], e.target.value))} />
                  <div className="mt-3 flex items-center gap-3">
                    <label className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                      {uploading.aboutImage ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={!!uploading.aboutImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading((p) => ({ ...p, aboutImage: true }));
                          try {
                            const url = await uploadToServer(file);
                            setHome((p) => updateAtPath(p, ['about', 'image', 'url'], url));
                            toastSuccess('Image uploaded.');
                          } catch (err) {
                            toastError(err?.message || 'Upload failed.');
                          } finally {
                            setUploading((p) => ({ ...p, aboutImage: false }));
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    <div className={helpClass}>Upload will generate a local URL.</div>
                  </div>
                  <ImagePreview
                    url={about?.image?.url || ''}
                    onClear={() => setHome((p) => updateAtPath(p, ['about', 'image', 'url'], ''))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Image Alt</label>
                  <input className={inputClass} value={about?.image?.alt || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'image', 'alt'], e.target.value))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Highlight Label</label>
                  <input className={inputClass} value={about?.highlight?.label || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'highlight', 'label'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Highlight Value</label>
                  <input className={inputClass} value={about?.highlight?.value || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'highlight', 'value'], e.target.value))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Paragraphs</label>
                  <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['about', 'paragraphs'], ''))}>Add</button>
                </div>
                <div className="space-y-3">
                  {aboutParagraphs.map((text, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6">
                      <textarea className={`${inputClass} sm:col-span-5`} rows={2} value={text || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'paragraphs', idx], e.target.value))} />
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['about', 'paragraphs'], idx))}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Credentials Title</label>
                <input className={inputClass} value={about.credentialsTitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'credentialsTitle'], e.target.value))} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Credentials</label>
                  <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['about', 'credentials'], ''))}>Add</button>
                </div>
                <div className="space-y-3">
                  {aboutCredentials.map((text, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6">
                      <input className={`${inputClass} sm:col-span-5`} value={text || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'credentials', idx], e.target.value))} />
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['about', 'credentials'], idx))}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Stats</label>
                  <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['about', 'stats'], { icon: 'Users', label: '', value: '' }))}>Add</button>
                </div>
                <div className="space-y-3">
                  {aboutStats.map((stat, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-12">
                      <select className={`${inputClass} sm:col-span-3`} value={stat?.icon || 'Users'} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'stats', idx, 'icon'], e.target.value))}>
                        <option value="Users">Users</option>
                        <option value="Award">Award</option>
                        <option value="Heart">Heart</option>
                        <option value="BookOpen">BookOpen</option>
                      </select>
                      <input className={`${inputClass} sm:col-span-4`} placeholder="Label" value={stat?.label || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'stats', idx, 'label'], e.target.value))} />
                      <input className={`${inputClass} sm:col-span-3`} placeholder="Value" value={stat?.value || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['about', 'stats', idx, 'value'], e.target.value))} />
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition sm:col-span-2" onClick={() => setHome((p) => removeFromArray(p, ['about', 'stats'], idx))}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
          )}

          {/* Services */}
          {activeTab === 'services' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Services</div>
              <div className={sectionSubClass}>Service cards and treatments (add/edit/delete).</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={services.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'title'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={services.subtitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'subtitle'], e.target.value))} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className={labelClass}>Items</label>
                <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['services', 'items'], { icon: 'Sparkles', title: '', description: '', treatments: [''] }))}>Add Service</button>
              </div>

              <div className="space-y-4">
                {serviceItems.map((item, idx) => (
                  <div key={idx} className="rounded-3xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="text-sm font-bold text-[#005963]">Service #{idx + 1}</div>
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['services', 'items'], idx))}>Delete</button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Icon</label>
                        <select className={inputClass} value={item?.icon || 'Sparkles'} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'items', idx, 'icon'], e.target.value))}>
                          <option value="Sparkles">Sparkles</option>
                          <option value="Syringe">Syringe</option>
                          <option value="Microscope">Microscope</option>
                          <option value="Zap">Zap</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Title</label>
                        <input className={inputClass} value={item?.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'items', idx, 'title'], e.target.value))} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelClass}>Description</label>
                      <textarea className={inputClass} rows={2} value={item?.description || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'items', idx, 'description'], e.target.value))} />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className={labelClass}>Treatments</label>
                        <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['services', 'items', idx, 'treatments'], ''))}>Add</button>
                      </div>
                      <div className="space-y-3">
                        {asArray(item?.treatments).map((t, tIdx) => (
                          <div key={tIdx} className="grid gap-3 sm:grid-cols-6">
                            <input className={`${inputClass} sm:col-span-5`} value={t || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['services', 'items', idx, 'treatments', tIdx], e.target.value))} />
                            <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['services', 'items', idx, 'treatments'], tIdx))}>Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          )}

          {/* Case Studies */}
          {activeTab === 'caseStudies' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Case Studies</div>
              <div className={sectionSubClass}>Horizontal success stories (add/edit/delete).</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={caseStudies.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'title'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={caseStudies.subtitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'subtitle'], e.target.value))} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className={labelClass}>Items</label>
                <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['caseStudies', 'items'], { title: '', category: '', duration: '', rating: 5, story: '', results: [''] }))}>Add Case</button>
              </div>

              <div className="space-y-4">
                {caseItems.map((item, idx) => (
                  <div key={idx} className="rounded-3xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="text-sm font-bold text-[#005963]">Case #{idx + 1}</div>
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['caseStudies', 'items'], idx))}>Delete</button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input className={inputClass} value={item?.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'title'], e.target.value))} />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <input className={inputClass} value={item?.category || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'category'], e.target.value))} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 mt-4">
                      <div>
                        <label className={labelClass}>Duration</label>
                        <input className={inputClass} value={item?.duration || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'duration'], e.target.value))} />
                      </div>
                      <div>
                        <label className={labelClass}>Rating</label>
                        <input type="number" min={0} max={5} className={inputClass} value={item?.rating ?? 0} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'rating'], Number(e.target.value)))} />
                      </div>
                      <div className="sm:col-span-1" />
                    </div>

                    <div className="mt-4">
                      <label className={labelClass}>Story</label>
                      <textarea className={inputClass} rows={3} value={item?.story || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'story'], e.target.value))} />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className={labelClass}>Results</label>
                        <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['caseStudies', 'items', idx, 'results'], ''))}>Add</button>
                      </div>
                      <div className="space-y-3">
                        {asArray(item?.results).map((r, rIdx) => (
                          <div key={rIdx} className="grid gap-3 sm:grid-cols-6">
                            <input className={`${inputClass} sm:col-span-5`} value={r || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['caseStudies', 'items', idx, 'results', rIdx], e.target.value))} />
                            <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => setHome((p) => removeFromArray(p, ['caseStudies', 'items', idx, 'results'], rIdx))}>Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          )}

          {/* Gallery */}
          {activeTab === 'gallery' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Gallery</div>
              <div className={sectionSubClass}>Gallery images (add/edit/delete).</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={gallery.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['gallery', 'title'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={gallery.subtitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['gallery', 'subtitle'], e.target.value))} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className={labelClass}>Images</label>
                <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['gallery', 'images'], { url: '', alt: '', category: '' }))}>Add Image</button>
              </div>

              <div className="space-y-3">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <input className={inputClass} placeholder="Image URL" value={img?.url || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['gallery', 'images', idx, 'url'], e.target.value))} />
                      <div className="mt-2">
                        <label className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                          {uploading[`gallery_${idx}`] ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={!!uploading[`gallery_${idx}`]}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploading((p) => ({ ...p, [`gallery_${idx}`]: true }));
                              try {
                                const url = await uploadToServer(file);
                                setHome((p) => updateAtPath(p, ['gallery', 'images', idx, 'url'], url));
                                toastSuccess('Image uploaded.');
                              } catch (err) {
                                toastError(err?.message || 'Upload failed.');
                              } finally {
                                setUploading((p) => ({ ...p, [`gallery_${idx}`]: false }));
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                      <ImagePreview
                        url={img?.url || ''}
                        onClear={() => setHome((p) => updateAtPath(p, ['gallery', 'images', idx, 'url'], ''))}
                      />
                    </div>
                    <input className={`${inputClass} sm:col-span-4`} placeholder="Alt text" value={img?.alt || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['gallery', 'images', idx, 'alt'], e.target.value))} />
                    <input className={`${inputClass} sm:col-span-2`} placeholder="Category" value={img?.category || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['gallery', 'images', idx, 'category'], e.target.value))} />
                    <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition sm:col-span-2" onClick={() => setHome((p) => removeFromArray(p, ['gallery', 'images'], idx))}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          )}

          {/* Contact */}
          {activeTab === 'contact' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Contact</div>
              <div className={sectionSubClass}>Clinic address, methods, hours, and map.</div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={contact.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'title'], e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={contact.subtitle || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'subtitle'], e.target.value))} />
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <div className={labelClass}>Clinic Address</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputClass} placeholder="Clinic Name" value={contact?.clinic?.name || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'clinic', 'name'], e.target.value))} />
                  <input className={inputClass} placeholder="Line 1" value={contact?.clinic?.line1 || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'clinic', 'line1'], e.target.value))} />
                  <input className={inputClass} placeholder="Line 2" value={contact?.clinic?.line2 || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'clinic', 'line2'], e.target.value))} />
                  <input className={inputClass} placeholder="Line 3" value={contact?.clinic?.line3 || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'clinic', 'line3'], e.target.value))} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Map Embed URL</label>
                <input className={inputClass} value={contact.mapEmbedUrl || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'mapEmbedUrl'], e.target.value))} />
                <div className={helpClass}>Paste the Google Maps embed URL.</div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Contact Methods</label>
                  <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['contact', 'methods'], { icon: 'Phone', title: '', value: '', link: '', color: 'primary' }))}>Add</button>
                </div>
                <div className="space-y-3">
                  {contactMethods.map((m, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-12">
                      <select className={`${inputClass} sm:col-span-2`} value={m?.icon || 'Phone'} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'methods', idx, 'icon'], e.target.value))}>
                        <option value="Phone">Phone</option>
                        <option value="MessageCircle">MessageCircle</option>
                        <option value="Mail">Mail</option>
                      </select>
                      <select className={`${inputClass} sm:col-span-2`} value={m?.color || 'primary'} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'methods', idx, 'color'], e.target.value))}>
                        <option value="primary">primary</option>
                        <option value="accent">accent</option>
                      </select>
                      <input className={`${inputClass} sm:col-span-3`} placeholder="Title" value={m?.title || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'methods', idx, 'title'], e.target.value))} />
                      <input className={`${inputClass} sm:col-span-3`} placeholder="Value" value={m?.value || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'methods', idx, 'value'], e.target.value))} />
                      <input className={`${inputClass} sm:col-span-2`} placeholder="Link" value={m?.link || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'methods', idx, 'link'], e.target.value))} />
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition sm:col-span-2" onClick={() => setHome((p) => removeFromArray(p, ['contact', 'methods'], idx))}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Office Hours</label>
                  <button type="button" className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition" onClick={() => setHome((p) => addToArray(p, ['contact', 'officeHours'], { label: '', value: '' }))}>Add</button>
                </div>
                <div className="space-y-3">
                  {officeHours.map((row, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-10">
                      <input className={`${inputClass} sm:col-span-4`} placeholder="Label" value={row?.label || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'officeHours', idx, 'label'], e.target.value))} />
                      <input className={`${inputClass} sm:col-span-4`} placeholder="Value" value={row?.value || ''} onChange={(e) => setHome((p) => updateAtPath(p, ['contact', 'officeHours', idx, 'value'], e.target.value))} />
                      <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition sm:col-span-2" onClick={() => setHome((p) => removeFromArray(p, ['contact', 'officeHours'], idx))}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
          )}

          {/* Footer */}
          {activeTab === 'footer' && (
          <GlassCard variant="solid" hover={false} className="p-6">
            <div className="mb-4">
              <div className={sectionTitleClass}>Footer</div>
              <div className={sectionSubClass}>Footer content shown on the public site.</div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Brand Name</label>
                  <input
                    className={inputClass}
                    value={footer.brandName || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'brandName'], e.target.value))}
                    placeholder="MediCare"
                  />
                </div>
                <div>
                  <label className={labelClass}>Copyright</label>
                  <input
                    className={inputClass}
                    value={footer.copyright || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'copyright'], e.target.value))}
                    placeholder="© 2025 MediCare. All rights reserved."
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={footer.description || ''}
                  onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'description'], e.target.value))}
                  placeholder="Premier healthcare services for your wellness."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Links Title</label>
                  <input
                    className={inputClass}
                    value={footer.linksTitle || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'linksTitle'], e.target.value))}
                    placeholder="Quick Links"
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Title</label>
                  <input
                    className={inputClass}
                    value={footer.contactTitle || ''}
                    onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'contactTitle'], e.target.value))}
                    placeholder="Contact"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Links</label>
                  <button
                    type="button"
                    className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                    onClick={() => setHome((p) => addToArray(p, ['footer', 'links'], { label: '', href: '' }))}
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {footerLinks.map((link, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6">
                      <input
                        className={`${inputClass} sm:col-span-2`}
                        placeholder="Label"
                        value={link?.label || ''}
                        onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'links', idx, 'label'], e.target.value))}
                      />
                      <input
                        className={`${inputClass} sm:col-span-3`}
                        placeholder="Href (example: /#about)"
                        value={link?.href || ''}
                        onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'links', idx, 'href'], e.target.value))}
                      />
                      <button
                        type="button"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setHome((p) => removeFromArray(p, ['footer', 'links'], idx))}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Contact Lines</label>
                  <button
                    type="button"
                    className="rounded-full bg-[#00acb1]/10 px-4 py-2 text-sm font-semibold text-[#005963] hover:bg-[#00acb1]/20 transition"
                    onClick={() => setHome((p) => addToArray(p, ['footer', 'contactLines'], ''))}
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {footerContactLines.map((line, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6">
                      <input
                        className={`${inputClass} sm:col-span-5`}
                        placeholder="Example: Phone: (555) 123-4567"
                        value={line || ''}
                        onChange={(e) => setHome((p) => updateAtPath(p, ['footer', 'contactLines', idx], e.target.value))}
                      />
                      <button
                        type="button"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setHome((p) => removeFromArray(p, ['footer', 'contactLines'], idx))}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
          )}

          <input type="hidden" name="home_json" value={data.home_json} readOnly />
        </form>
      </div>
    </AdminLayout>
  );
}
