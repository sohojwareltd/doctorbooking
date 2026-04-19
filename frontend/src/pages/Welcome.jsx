import { Head, Link } from '@inertiajs/react';
import HeroSection from '../components/sections/HeroSection';

import PublicLayout from '../layouts/PublicLayout';

export default function Welcome({ home, doctor, chambers = [] }) {
    const meta = home?.meta || {};
    const doctorName = doctor?.name || 'Dr. Sarah Johnson';
    const doctorTitle =
        [doctor?.degree, doctor?.specialization].filter(Boolean).join(' • ') ||
        doctor?.specialization ||
        'Consultant Physician';
    const shortBio =
        doctor?.bio ||
        'Personalized care, thoughtful diagnosis, and a calm clinical experience for every patient.';
    const chamberCards = chambers.length
        ? chambers
        : [
              {
                  id: 'default-chamber',
                  name: 'Main Chamber',
                  location: 'City center consultation and follow-up care.',
                  phone: doctor?.phone || 'Available on appointment',
              },
          ];
    const chamberCount = chamberCards.length;
    const chamberImages = [
        'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
    ];

    return (
        <>
            <Head title={meta.title || `${doctorName} - Doctor Portfolio`}>
                <meta
                    name="description"
                    content={
                        meta.description ||
                        `${doctorName} offers a modern, organized healthcare experience with a focus on trust, accessibility, and patient-first treatment.`
                    }
                />
            </Head>

            <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f1_0%,#f8fbfa_28%,#f7f8f8_100%)] text-slate-900">
                <HeroSection doctor={doctor} />

                <section id="chambers" className="relative z-10 -mt-8 px-4 py-16 sm:px-6 lg:-mt-12 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-10 grid gap-5 rounded-[32px] border border-white/75 bg-white/72 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)] backdrop-blur sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                            <div className="max-w-3xl">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="h-px w-12 bg-[#0f766e]/40" />
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">
                                        Chambers
                                    </p>
                                </div>
                                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                                    Available chambers for consultation, follow-up review, and patient support.
                                </h2>
                            </div>
                            <div className="justify-self-start rounded-full border border-[#d8e8e3] bg-[#f4fbf8] px-5 py-3 text-sm font-medium text-[#115e59] lg:justify-self-end">
                                {chamberCount} {chamberCount === 1 ? 'active chamber' : 'active chambers'}
                            </div>
                        </div>

                        <p className="mb-8 max-w-2xl text-base leading-7 text-slate-600">
                            Patients can review chamber locations, contact numbers, and map links here before continuing to the booking page.
                        </p>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {chamberCards.map((chamber, index) => (
                                <article
                                    key={chamber.id}
                                    className="group relative overflow-hidden rounded-[28px] border border-[#dce9e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,249,0.96)_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.08)]"
                                >
                                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e_0%,#66d3c0_100%)] opacity-80" />
                                    <div className="-mx-6 -mt-6 mb-6 overflow-hidden border-b border-[#e6f0ec]">
                                        <div className="relative aspect-[16/10] overflow-hidden bg-[#dfecea]">
                                            <img
                                                src={chamberImages[index % chamberImages.length]}
                                                alt={chamber.name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,29,0.06)_0%,rgba(10,25,29,0.38)_100%)]" />
                                        </div>
                                    </div>
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="inline-flex rounded-full bg-[#eef6f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#115e59]">
                                            Chamber {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-[#115e59]">
                                            Open for booking
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">{chamber.name}</h3>
                                    <p className="mt-4 min-h-[84px] text-sm leading-7 text-slate-600">
                                        {chamber.location || 'Location details shared during confirmation.'}
                                    </p>

                                    <div className="grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                                        <div>
                                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                Contact
                                            </div>
                                            <div className="font-medium text-[#115e59]">
                                                {chamber.phone || 'Call for schedule information'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                            <Link
                                                href={
                                                    typeof chamber.id === 'number' || /^\d+$/.test(String(chamber.id || ''))
                                                        ? `/book-appointment?chamber_id=${encodeURIComponent(chamber.id)}&step=2`
                                                        : '/book-appointment'
                                                }
                                                className="inline-flex items-center justify-center rounded-full bg-[#123c46] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0d2c34]"
                                            >
                                                Book Now
                                            </Link>

                                            {chamber.google_maps_url && (
                                                <a
                                                    href={chamber.google_maps_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center text-[13px] font-semibold text-slate-900 transition hover:text-[#115e59]"
                                                >
                                                    View map
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="about" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
                    <div className="mx-auto max-w-6xl rounded-[36px] border border-[#dbe7e3] bg-white/94 p-8 shadow-[0_30px_75px_rgba(15,23,42,0.07)] backdrop-blur sm:p-10 lg:p-12">
                        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                            <div>
                                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">
                                About the doctor
                                </p>
                                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.9rem]">
                                    {doctorName}
                                </h2>
                                <p className="mt-3 text-base font-medium text-[#115e59]">{doctorTitle}</p>
                                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                                    {shortBio}
                                </p>
                            </div>

                            <div className="rounded-[30px] bg-[linear-gradient(135deg,#123c46_0%,#0f2d35_100%)] p-7 text-white shadow-[0_28px_70px_rgba(18,60,70,0.18)] sm:p-8">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9fe9dd]">
                                    Practice details
                                </p>
                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Registration</div>
                                        <div className="mt-2 text-sm leading-7 text-white/88">
                                            {doctor?.registration_no || 'Available on request'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Phone</div>
                                        <div className="mt-2 text-sm leading-7 text-white/88">
                                            {doctor?.phone || 'Please contact the chamber directly'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Email</div>
                                        <div className="mt-2 text-sm leading-7 text-white/88">
                                            {doctor?.email || 'Shared after appointment confirmation'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Consultation chambers</div>
                                        <div className="mt-2 text-sm leading-7 text-white/88">
                                            {chamberCount} {chamberCount === 1 ? 'location currently available' : 'locations currently available'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Welcome.layout = (page) => <PublicLayout>{page}</PublicLayout>;

