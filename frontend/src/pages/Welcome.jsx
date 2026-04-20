import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import HeroSection from '../components/sections/HeroSection';

import PublicLayout from '../layouts/PublicLayout';

export default function Welcome({ home, doctor, chambers = [] }) {
    const [apiChambers, setApiChambers] = useState(Array.isArray(chambers) ? chambers : []);
    const [chambersLoading, setChambersLoading] = useState(!Array.isArray(chambers) || chambers.length === 0);
    const meta = home?.meta || {};
    const doctorName = doctor?.name || 'Dr. Sarah Johnson';
    const doctorTitle =
        [doctor?.degree, doctor?.specialization].filter(Boolean).join(' • ') ||
        doctor?.specialization ||
        'Consultant Physician';
    const shortBio =
        doctor?.about_bio_details ||
        doctor?.bio ||
        'Personalized care, thoughtful diagnosis, and a calm clinical experience for every patient.';
    const aboutSubtitle =
        doctor?.about_subtitle ||
        'Thoughtful consultation, clear explanation, and a patient-friendly care journey.';
    const credentialsTitle = doctor?.about_credentials_title || 'Professional profile';
    const credentialLines = String(doctor?.about_credentials_text || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4);
    const liveChambers = apiChambers.length
        ? apiChambers
        : Array.isArray(chambers)
            ? chambers
            : [];
    const chamberCards = liveChambers.length
        ? liveChambers
        : [
              {
                  id: 'default-chamber',
                  name: 'Main Chamber',
                  location: 'City center consultation and follow-up care.',
                  phone: doctor?.phone || 'Available on appointment',
              },
          ];
    const chamberCount = chamberCards.length;
    const aboutHighlightValue = doctor?.about_highlight_value || (doctor?.registration_no ? 'Verified' : `${chamberCount}`);
    const aboutHighlightLabel = doctor?.about_highlight_label || (doctor?.registration_no ? 'Professional registration' : 'Consultation chambers');
    const aboutStats = [
        {
            label: 'Registration',
            value: doctor?.registration_no || 'Available on request',
        },
        {
            label: 'Phone',
            value: doctor?.phone || 'Please contact the chamber directly',
        },
        {
            label: 'Email',
            value: doctor?.email || 'Shared after appointment confirmation',
        },
        {
            label: 'Locations',
            value: `${chamberCount} ${chamberCount === 1 ? 'active chamber' : 'active chambers'}`,
        },
    ];

    useEffect(() => {
        let ignore = false;

        const loadChambers = async () => {
            try {
                const response = await fetch('/api/public/chambers', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                const data = await response.json().catch(() => ({}));

                if (!ignore && response.ok) {
                    setApiChambers(Array.isArray(data?.chambers) ? data.chambers : []);
                }
            } catch {
                // Keep SSR chambers as fallback.
            } finally {
                if (!ignore) {
                    setChambersLoading(false);
                }
            }
        };

        loadChambers();

        return () => {
            ignore = true;
        };
    }, []);

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

                <section id="chambers" className="relative z-10 -mt-8 px-4 py-12 sm:px-6 lg:-mt-10 lg:px-8 lg:py-14">
                    <div className="mx-auto max-w-6xl rounded-[36px] border border-[#dbe7e3] bg-white/94 p-8 shadow-[0_30px_75px_rgba(15,23,42,0.07)] backdrop-blur sm:p-10 lg:p-12">
                        <div className="mb-8 flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">
                                    {doctorName}
                                </p>
                                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.9rem]">
                                    Consultation chambers for {doctorName} with clear location and booking details.
                                </h2>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                    Browse all active chambers, compare locations, and continue directly to the booking flow.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 self-start rounded-full border border-[#d8e8e3] bg-[#f4fbf8] px-5 py-3 text-sm font-medium text-[#115e59] lg:self-end">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
                                {chambersLoading ? 'Loading chambers...' : `${chamberCount} ${chamberCount === 1 ? 'active chamber' : 'active chambers'}`}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-[#dce9e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,249,0.96)_100%)]">
                            {chamberCards.map((chamber, index) => {
                                return (
                                    <article
                                        key={chamber.id}
                                        className="group border-b border-[#e6f0ec] bg-transparent transition-colors last:border-b-0 hover:bg-[#f8fcfb]"
                                    >
                                        <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(170px,0.9fr)_minmax(0,1.4fr)_minmax(170px,0.8fr)_auto] lg:items-center lg:gap-6">
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#115e59]">
                                                    Chamber {String(index + 1).padStart(2, '0')}
                                                </div>
                                                <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-[1.2rem]">
                                                    {chamber.name}
                                                </h3>
                                                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#115e59]">
                                                    Available now
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Location
                                                </div>
                                                <div className="mt-2 inline-flex items-start gap-2 text-sm leading-6 text-slate-600">
                                                    <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
                                                    <span>{chamber.location || 'Location details shared during confirmation.'}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Contact
                                                </div>
                                                <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {chamber.phone || 'Call for schedule information'}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                {chamber.google_maps_url ? (
                                                    <a
                                                        href={chamber.google_maps_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex min-w-[126px] items-center justify-center rounded-full border border-[#d8e8e3] bg-[#f4fbf8] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#115e59] transition hover:border-[#bfd8d1] hover:bg-[#eef7f4]"
                                                    >
                                                        View Map
                                                    </a>
                                                ) : null}
                                                <Link
                                                    href={
                                                        typeof chamber.id === 'number' || /^\d+$/.test(String(chamber.id || ''))
                                                            ? `/book-appointment?chamber_id=${encodeURIComponent(chamber.id)}&step=2`
                                                            : '/book-appointment'
                                                    }
                                                    className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-full bg-[#123c46] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#0d2c34]"
                                                >
                                                    Book Now
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="about" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
                    <div className="mx-auto max-w-6xl rounded-[36px] border border-[#dbe7e3] bg-white/94 p-8 shadow-[0_30px_75px_rgba(15,23,42,0.07)] backdrop-blur sm:p-10 lg:p-12">
                        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                            <div className="space-y-6">
                                <div className="inline-flex items-center rounded-full border border-[#d6e7e1] bg-[#f4fbf8] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                                    About {doctorName}
                                </div>
                                <div>
                                    <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.95rem]">
                                        {doctorName}
                                    </h2>
                                    <p className="mt-3 text-base font-medium text-[#115e59]">{doctorTitle}</p>
                                    <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                                        {shortBio}
                                    </p>
                                </div>

                                <div className="rounded-[30px] border border-[#dde9e5] bg-[linear-gradient(135deg,#f8fbfa_0%,#eef6f3_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-7">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="max-w-xl">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                {credentialsTitle}
                                            </p>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                                {aboutSubtitle}
                                            </p>
                                        </div>
                                        <div className="rounded-[24px] bg-[#123c46] px-5 py-4 text-white shadow-[0_18px_45px_rgba(18,60,70,0.18)] sm:min-w-[190px]">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9fe9dd]">
                                                Highlight
                                            </div>
                                            <div className="mt-3 text-2xl font-semibold tracking-tight">
                                                {aboutHighlightValue}
                                            </div>
                                            <div className="mt-1 text-sm text-white/78">
                                                {aboutHighlightLabel}
                                            </div>
                                        </div>
                                    </div>

                                    {credentialLines.length ? (
                                        <div className="mt-5 flex flex-wrap gap-2.5">
                                            {credentialLines.map((item) => (
                                                <div
                                                    key={item}
                                                    className="rounded-full border border-[#d6e7e1] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-[30px] bg-[linear-gradient(135deg,#123c46_0%,#0f2d35_100%)] p-7 text-white shadow-[0_28px_70px_rgba(18,60,70,0.18)] sm:p-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9fe9dd]">
                                                {doctorName} details
                                            </p>
                                            <p className="mt-3 max-w-sm text-sm leading-7 text-white/78">
                                                A more organized snapshot of profile, contact, and availability for patients who want quick details before booking.
                                            </p>
                                        </div>
                                        <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-3 sm:block">
                                            <Phone className="h-5 w-5 text-[#9fe9dd]" />
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        {aboutStats.map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                                            >
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                                    {item.label}
                                                </div>
                                                <div className="mt-2 text-sm leading-7 text-white/88">
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-[24px] border border-[#dde9e5] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
                                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            <Phone className="h-4 w-4 text-[#115e59]" />
                                            Direct contact
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-700">
                                            {doctor?.phone || 'Please contact the chamber directly'}
                                        </div>
                                    </div>
                                    <div className="rounded-[24px] border border-[#dde9e5] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
                                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            <Mail className="h-4 w-4 text-[#115e59]" />
                                            Email address
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-700">
                                            {doctor?.email || 'Shared after appointment confirmation'}
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

