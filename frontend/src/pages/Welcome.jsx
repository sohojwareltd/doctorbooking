import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, CalendarCheck2, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import HeroSection from '../components/sections/HeroSection';

import PublicLayout from '../layouts/PublicLayout';

export default function Welcome({ home, doctor, chambers = [] }) {
    const [apiChambers, setApiChambers] = useState(Array.isArray(chambers) ? chambers : []);
    const [chambersLoading, setChambersLoading] = useState(!Array.isArray(chambers) || chambers.length === 0);
    const [contactForm, setContactForm] = useState({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: '',
    });
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
    const meta = home?.meta || {};
    const doctorName = doctor?.name || 'Dr. Sarah Johnson';
    const doctorInitials = doctorName
        .split(' ')
        .map((part) => part.trim()[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const doctorTitle =
        [doctor?.degree, doctor?.specialization].filter(Boolean).join(' • ') ||
        doctor?.specialization ||
        'Consultant Physician';
    const shortBio =
        doctor?.about_bio_details ||
        doctor?.bio ||
        'Personalized care, thoughtful diagnosis, and a calm clinical experience for every patient.';
    const aboutParagraphs = String(shortBio)
        .split(/\n\s*\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    const aboutSubtitle =
        doctor?.about_subtitle ||
        'Thoughtful consultation, clear explanation, and a patient-friendly care journey.';
    const credentialsTitle = doctor?.about_credentials_title || 'Professional profile';
    const credentialLines = String(doctor?.about_credentials_text || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4);
    const profileSource = doctor?.profile_picture || doctor?.hero_image || '';
    const profileImageUrl = profileSource
        ? (profileSource.startsWith('http') || profileSource.startsWith('/')
            ? profileSource
            : `/storage/${profileSource}`)
        : '';
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
    const profileDetails = [
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
    const aboutStats = [
        {
            label: 'Patients treated',
            value: doctor?.about_stats_patients_treated,
        },
        {
            label: 'Experience',
            value: doctor?.about_stats_years_experience,
        },
        {
            label: 'Patient satisfaction',
            value: doctor?.about_stats_patient_satisfaction,
        },
        {
            label: 'Medical cases',
            value: doctor?.about_stats_medical_cases,
        },
    ].filter((item) => String(item.value || '').trim() !== '');
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

    const handleContactChange = (field) => (event) => {
        setContactForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const getCsrfToken = () => {
        const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        if (cookie) return decodeURIComponent(cookie);

        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const handleContactSubmit = async (event) => {
        event?.preventDefault?.();
        if (contactSubmitting) return;
        setContactSubmitting(true);
        setContactStatus({ type: '', message: '' });

        try {
            const response = await fetch('/api/public/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(contactForm),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const firstValidationError = data?.errors
                    ? Object.values(data.errors)[0]?.[0]
                    : null;
                setContactStatus({
                    type: 'error',
                    message: firstValidationError || data?.message || 'Could not send your message right now.',
                });
                return;
            }

            setContactStatus({
                type: 'success',
                message: data?.message || 'Your message has been sent successfully.',
            });
            setContactForm({
                name: '',
                phone: '',
                email: '',
                subject: '',
                message: '',
            });
        } catch {
            setContactStatus({
                type: 'error',
                message: 'Network error. Please try again.',
            });
        } finally {
            setContactSubmitting(false);
        }
    };

    return (
        <>
            <Head title={meta.title || `${doctorName} - Doctor Portfolio`}>
                <link rel="icon" href="/favicon.svg?v=20260429" sizes="any" />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260429" />
                <link rel="shortcut icon" type="image/x-icon" href="/favicon.svg?v=20260429" />
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

                <section id="chambers" className="relative z-10 px-0 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
                    <div className="mx-auto max-w-6xl border border-[#dbe7e3] bg-white/94 p-0 shadow-[0_30px_75px_rgba(15,23,42,0.07)] backdrop-blur sm:rounded-[36px] sm:p-10 lg:p-12">
                        <div className="mx-4 mb-6 flex flex-col mt-4 lg:mt-0 gap-5 border-b border-slate-100 pb-5 sm:mx-0 sm:mb-8 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center rounded-full border border-[#dce7e3] bg-[#f4f9f7] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4f716e]">
                                    Our Locations
                                </div>
                                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[35px]">
                                    Consultation Chambers
                                </h2>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                    Consult with {doctorName} at your convenience. Choose the
                                    location that is most convenient for you.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 self-start rounded-full border border-[#d8e8e3] bg-[#f4fbf8] px-5 py-3 text-sm font-medium text-[#115e59] lg:self-end">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
                                {chambersLoading ? 'Loading chambers...' : `${chamberCount} ${chamberCount === 1 ? 'active chamber' : 'active chambers'}`}
                            </div>
                        </div>

                        <div className="space-y-4 overflow-hidden border-y border-[#dce9e5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,249,0.96)_100%)] p-4 sm:space-y-0 sm:border sm:rounded-[28px] sm:p-6 lg:border-y lg:p-0 lg:rounded-none">
                            {chamberCards.map((chamber, index) => {
                                return (
                                    <article
                                        key={chamber.id}
                                        className="group rounded-2xl border border-[#e0ebe6] bg-white/95 p-5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-[#d1e4de] hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:p-6 lg:rounded-none lg:border-b lg:border-[#e6f0ec] lg:border-t-0 lg:border-l-0 lg:border-r-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:last:border-b-0 hover:lg:bg-[#f8fcfb]"
                                    >
                                        <div className="hidden lg:grid lg:gap-5 lg:px-6 lg:py-5 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1.35fr)_minmax(170px,0.85fr)_auto] lg:items-center">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#123c46] text-white">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-[1.2rem]">
                                                        {chamber.name}
                                                    </h3>
                                                    <div className="mt-1.5 text-[12px] font-semibold tracking-wide text-[#0f766e]">
                                                        Available Now
                                                    </div>
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

                                        <div className="lg:hidden">
                                            {/* Header with icon and status */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#123c46] text-white shadow-lg">
                                                        <Building2 className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold tracking-tight text-slate-900">
                                                            {chamber.name}
                                                        </h3>
                                                        <div className="mt-1.5 inline-flex rounded-full bg-[#e0f2ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0f766e]">
                                                            ✓ Available Now
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location section */}
                                            <div className="mb-4 space-y-2 border-t border-[#e9f0ed] pt-4">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="h-5 w-5 flex-shrink-0 text-[#0f766e] mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Location</p>
                                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                                            {chamber.location || 'Location details shared during confirmation.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact section */}
                                            <div className="mb-5 space-y-2 border-t border-[#e9f0ed] pt-4">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-5 w-5 flex-shrink-0 text-[#0f766e]" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Contact</p>
                                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                                            {chamber.phone || 'Call for schedule information'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-3 border-t border-[#e9f0ed] pt-4">
                                                {chamber.google_maps_url ? (
                                                    <a
                                                        href={chamber.google_maps_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d1e4de] bg-[#f0f9f7] text-[#0f766e] transition-all duration-200 hover:border-[#b8d9d1] hover:bg-[#e8f4f1] active:scale-95"
                                                        title="View on Google Maps"
                                                    >
                                                        <MapPin className="h-5 w-5" />
                                                    </a>
                                                ) : null}
                                                <Link
                                                    href={
                                                        typeof chamber.id === 'number' || /^\d+$/.test(String(chamber.id || ''))
                                                            ? `/book-appointment?chamber_id=${encodeURIComponent(chamber.id)}&step=2`
                                                            : '/book-appointment'
                                                    }
                                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#123c46] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:shadow-lg active:scale-95"
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

                <section id="about" className="relative mt-3 overflow-hidden bg-[#0b4a54] px-4 pb-14 pt-20 sm:px-6 lg:px-8 lg:pb-16">
                    <div className="pointer-events-none absolute inset-x-0 -top-1 h-16 text-[#f7f8f8]">
                        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-full w-full fill-current">
                            <path d="M0,38 C200,78 360,10 600,48 C850,90 1010,18 1200,54 L1200,0 L0,0 Z" />
                        </svg>
                    </div>

                    <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)_minmax(300px,0.95fr)] lg:items-stretch">
                        <div className="pt-2 text-white">
                            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9dd0c8]">
                                Contact
                            </div>
                            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[35px]">Get In Touch</h2>
                            <p className="mt-3 max-w-sm text-base leading-7 text-[#c8dcda]">
                                We&apos;re here to help. Reach out for appointments,
                                inquiries, or any assistance you need.
                            </p>

                            <div className="mt-8 space-y-6 sm:border-r sm:border-white/10 sm:pr-2">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6f77] text-[#b8f23c]">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white">Phone</div>
                                        <div className="mt-1 text-sm text-[#d6e6e4]">{doctor?.phone || '+880 1712-345678'}</div>
                                        {/* <div className="mt-1 text-[15px] text-[#c0d6d3]">9:00 AM - 8:00 PM (Sat - Thu)</div> */}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6f77] text-[#b8f23c]">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white">Email</div>
                                        <div className="mt-1 text-sm text-[#d6e6e4]">{doctor?.email || 'doctor@example.com'}</div>
                                        <div className="mt-1 text-[15px] text-[#c0d6d3]">We&apos;ll respond within 24 hours</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6f77] text-[#b8f23c]">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white">Consultation Locations</div>
                                        <div className="mt-1 max-w-[260px] text-sm leading-7 text-[#d6e6e4]">
                                            {chamberCount > 1
                                                ? `${chamberCount} active chambers available. Choose your preferred location from the chamber list above.`
                                                : chamberCards[0]?.location || 'Location details will be shared during appointment confirmation.'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6f77] text-[#b8f23c]">
                                        <Clock3 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white">Booking Availability</div>
                                        <div className="mt-1 text-sm text-[#d6e6e4]">Available slots are updated by chamber and consultation date.</div>
                                        <div className="mt-1 text-sm text-[#d6e6e4]">Select your chamber to view the latest appointment times instantly.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleContactSubmit} className="rounded-[30px] bg-white p-5 shadow-[0_24px_48px_rgba(1,16,20,0.25)] sm:p-6 lg:self-end">
                            <h3 className="text-3xl font-semibold tracking-tight text-[#2a3446]">Send a Message</h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <input
                                    type="text"
                                    value={contactForm.name}
                                    onChange={handleContactChange('name')}
                                    placeholder="Full Name"
                                    className="h-11 rounded-xl border border-[#dfe7e3] bg-white px-4 text-[15px] text-slate-700 placeholder:text-slate-400 focus:border-[#b8cbc4] focus:outline-none"
                                    required
                                />
                                <input
                                    type="text"
                                    value={contactForm.phone}
                                    onChange={handleContactChange('phone')}
                                    placeholder="Phone Number"
                                    className="h-11 rounded-xl border border-[#dfe7e3] bg-white px-4 text-[15px] text-slate-700 placeholder:text-slate-400 focus:border-[#b8cbc4] focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="mt-3 space-y-3">
                                <input
                                    type="email"
                                    value={contactForm.email}
                                    onChange={handleContactChange('email')}
                                    placeholder="Email Address"
                                    className="h-11 w-full rounded-xl border border-[#dfe7e3] bg-white px-4 text-[15px] text-slate-700 placeholder:text-slate-400 focus:border-[#b8cbc4] focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={handleContactChange('subject')}
                                    placeholder="Subject"
                                    className="h-11 w-full rounded-xl border border-[#dfe7e3] bg-white px-4 text-[15px] text-slate-700 placeholder:text-slate-400 focus:border-[#b8cbc4] focus:outline-none"
                                    required
                                />
                                <textarea
                                    value={contactForm.message}
                                    onChange={handleContactChange('message')}
                                    placeholder="Message"
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-[#dfe7e3] bg-white px-4 py-3 text-[15px] text-slate-700 placeholder:text-slate-400 focus:border-[#b8cbc4] focus:outline-none"
                                    required
                                />
                            </div>
                            {contactStatus.message && (
                                <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${contactStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {contactStatus.message}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleContactSubmit}
                                disabled={contactSubmitting}
                                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b8f23c] px-4 text-sm font-semibold text-[#2a3a24] transition hover:brightness-95 disabled:opacity-60"
                            >
                                {contactSubmitting ? 'Sending...' : 'Send Message'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <div className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-500">
                                <ShieldCheck className="h-4 w-4 text-[#2f7f79]" />
                                Your information is safe and secure.
                            </div>
                        </form>

                        <div className="relative lg:min-h-[640px]">
                            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#f3f8f6] h-full min-h-[520px] lg:min-h-[640px]">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={doctorName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[#e7f0ed] text-5xl font-semibold tracking-tight text-[#123c46]">
                                        {doctorInitials}
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-2 left-[8px] right-[-16px] rounded-[20px] border border-white/15 bg-[linear-gradient(135deg,rgba(23,52,64,0.94)_0%,rgba(17,58,73,0.9)_100%)] p-5 text-white shadow-[0_20px_44px_rgba(6,18,24,0.4)] backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2f6f77] text-[#b8f23c]">
                                        <CalendarCheck2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[33px] font-semibold leading-tight">Book Your Consultation</div>
                                        <p className="mt-2 text-[17px] leading-7 text-white/85">
                                            Appointments available at
                                            {' '}
                                            {chamberCount}
                                            {' '}
                                            active chambers across Dhaka.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/book-appointment"
                                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b8f23c] px-4 text-sm font-semibold text-[#2a3a24] transition hover:brightness-95"
                                >
                                    Book Appointment
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Welcome.layout = (page) => <PublicLayout>{page}</PublicLayout>;

