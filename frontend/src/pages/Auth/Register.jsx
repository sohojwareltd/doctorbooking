import { Head, Link, useForm } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck2,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    Shield,
    User,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import DoctorLogo from '../../components/DoctorLogo';
import PublicLayout from '../../layouts/PublicLayout';
import { toastError } from '../../utils/toast';

const extractErrorMessages = (errorObject) => {
    const messages = [];

    const walk = (value) => {
        if (!value) {
            return;
        }

        if (typeof value === 'string') {
            messages.push(value);
            return;
        }

        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }

        if (typeof value === 'object') {
            Object.values(value).forEach(walk);
        }
    };

    walk(errorObject);
    return [...new Set(messages)];
};

const getFieldError = (errorObject, field) => {
    const direct = errorObject?.[field];

    if (typeof direct === 'string') {
        return direct;
    }

    const nestedError = Object.values(errorObject || {}).find(
        (value) => value && typeof value === 'object' && typeof value[field] === 'string',
    );

    return nestedError?.[field] || null;
};

const getIdentifierErrorMessage = (message, fieldType) => {
    if (!message) {
        return null;
    }

    const normalized = String(message).toLowerCase();
    const isTakenMessage = normalized.includes('taken') || normalized.includes('already exists');

    if (isTakenMessage) {
        return fieldType === 'email'
            ? 'The email has already been taken.'
            : 'The phone number has already been taken.';
    }

    if (normalized.includes('username')) {
        return fieldType === 'email'
            ? message.replace(/username/gi, 'email')
            : message.replace(/username/gi, 'phone number');
    }

    return message;
};

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    const errorMessages = extractErrorMessages(errors);
    const errorKey = useMemo(() => errorMessages.join('|'), [errorMessages]);

    const nameError = getFieldError(errors, 'name');
    const emailError = getFieldError(errors, 'email');
    const phoneError = getFieldError(errors, 'phone');
    const usernameError = getFieldError(errors, 'username');
    const resolvedEmailError = emailError || getIdentifierErrorMessage(usernameError, 'email');
    const resolvedPhoneError = phoneError || getIdentifierErrorMessage(usernameError, 'phone');
    const passwordError = getFieldError(errors, 'password');
    const passwordConfirmationError = getFieldError(errors, 'password_confirmation');
    const toastMessage = resolvedEmailError
        || resolvedPhoneError
        || nameError
        || passwordError
        || passwordConfirmationError
        || getIdentifierErrorMessage(errorMessages[0], 'email')
        || errorMessages[0]
        || null;

    useEffect(() => {
        if (!toastMessage) {
            return;
        }

        toastError(toastMessage);
    }, [errorKey]);

    const inputClass =
        'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#16a5a2] focus:outline-none focus:ring-3 focus:ring-[#16a5a2]/15';

    return (
        <>
            <Head title="Register" />
            <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[linear-gradient(180deg,#f4f8fa_0%,#f8fbfd_100%)]">
                <div className="pointer-events-none absolute -left-44 top-16 h-[560px] w-[520px] rounded-[58%_42%_55%_45%/48%_52%_50%_50%] bg-[radial-gradient(ellipse_at_center,#e3f1f4_0%,#eaf5f7_55%,#f4f9fb_100%)]" />
                <div className="pointer-events-none absolute -left-24 top-40 h-[420px] w-[360px] rounded-[50%_50%_46%_54%/60%_40%_60%_40%] bg-white/45" />
                <div className="pointer-events-none absolute right-12 top-28 h-36 w-24 bg-[radial-gradient(circle,#cadde3_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-60" />
                <div className="pointer-events-none absolute -right-14 bottom-[-34px] h-44 w-44 rounded-tl-[100%] bg-[#deeff1]" />

                <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
                    <div className="grid items-stretch gap-8 lg:grid-cols-[340px_minmax(0,520px)] lg:justify-center">
                        <div className="order-2 flex h-full flex-col p-7 lg:order-1">
                            <div className="mb-8">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1b9c9b] shadow-sm">
                                    <ShieldCheck className="h-7 w-7" />
                                </div>
                                <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#143a4a]">
                                    Create your
                                    <br />
                                    account
                                </h2>
                                <p className="mt-4 text-[17px] leading-8 text-slate-600">
                                    Join MediCare to book appointments and manage your health easily.
                                </p>
                                <div className="mt-5 h-1 w-14 rounded-full bg-[#24b0ad]" />
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <CalendarCheck2 className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-lg font-semibold text-[#163b4b]">Book appointments</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Find and book the best doctors at your convenience.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-lg font-semibold text-[#163b4b]">Secure and private</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Your data is protected with industry-standard security.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <Bell className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-lg font-semibold text-[#163b4b]">Stay updated</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Get reminders and important updates about your appointments.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 lg:mt-auto border-t border-[#d9e8eb] pt-6">
                                <div className="flex items-start gap-3">
                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f9e9b]">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-lg font-bold text-[#163b4b]">Your health is our priority.</p>
                                        <p className="mt-1 text-sm text-slate-600">We keep your data safe and secure.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <GlassCard
                            variant="solid"
                            hover={false}
                            className="order-1 w-full overflow-hidden rounded-[30px] border border-[#dfe6ea] bg-white p-0 shadow-[0_30px_75px_rgba(15,23,42,0.08)] lg:order-2"
                        >
                            <div className="px-6 pb-7 pt-8 sm:px-9">
                                <div className="mb-7 flex flex-col items-center text-center">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#1ab8b4_0%,#0f9e9f_100%)] text-white shadow-[0_12px_24px_rgba(15,158,159,0.3)]">
                                        <User className="h-8 w-8" />
                                    </div>
                                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0f3748]">Create account</h1>
                                    <p className="mt-2 text-base text-slate-500">Please fill in the details to get started</p>
                                </div>

                                <form onSubmit={submit} className="space-y-4.5">
                                    <div>
                                        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="name"
                                                name="name"
                                                value={data.name}
                                                className={inputClass}
                                                autoComplete="name"
                                                placeholder="Enter your full name"
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {nameError && <div className="mt-1.5 text-xs font-medium text-red-600">{nameError}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className={inputClass}
                                                autoComplete="email"
                                                placeholder="Enter your email address"
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {resolvedEmailError && <div className="mt-1.5 text-xs font-medium text-red-600">{resolvedEmailError}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="phone"
                                                type="tel"
                                                name="phone"
                                                value={data.phone}
                                                className={inputClass}
                                                autoComplete="tel"
                                                placeholder="+880 1XXX-XXXXXX"
                                                onChange={(e) => setData('phone', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {resolvedPhoneError && <div className="mt-1.5 text-xs font-medium text-red-600">{resolvedPhoneError}</div>}
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            We'll use this number for login and important updates.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={data.password}
                                                className={`${inputClass} pr-11`}
                                                autoComplete="new-password"
                                                placeholder="Enter password"
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                            </button>
                                        </div>
                                        {passwordError && <div className="mt-1.5 text-xs font-medium text-red-600">{passwordError}</div>}
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Minimum 8 characters with letters and numbers.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="password_confirmation"
                                                value={data.password_confirmation}
                                                className={`${inputClass} pr-11`}
                                                autoComplete="new-password"
                                                placeholder="Confirm your password"
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                            </button>
                                        </div>
                                        {passwordConfirmationError && (
                                            <div className="mt-1.5 text-xs font-medium text-red-600">{passwordConfirmationError}</div>
                                        )}
                                    </div>

                                    <PrimaryButton type="submit" className="mt-2 w-full rounded-xl py-3" disabled={processing}>
                                        {processing ? 'Creating account...' : 'Create Account'}
                                    </PrimaryButton>

                                    <div className="pt-1 text-center text-sm text-slate-600">
                                        Already have an account?{' '}
                                        <Link href="/login" className="font-semibold text-[#109a9b] underline underline-offset-2">
                                            Log in
                                        </Link>
                                    </div>
                                </form>
                            </div>
                            <div className="border-t border-[#edf1f3] bg-[#fcfdfd] px-6 py-4 sm:px-9">
                                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                                    <div className="flex items-start">
                                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f9e9b]">
                                            <Lock className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-[12px] font-semibold text-[#163b4b]">Encrypted and secure</p>
                                            <p className="mt-1 text-xs text-slate-600">256-bit encryption</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1">
                                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f9e9b]">
                                            <Users className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-[12px] font-semibold text-[#163b4b]">Trusted by patients</p>
                                            <p className="mt-1 text-xs text-slate-600">10,000+ active users</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1">
                                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f9e9b]">
                                            <Shield className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-[12px] font-semibold text-[#163b4b]">HIPAA compliant</p>
                                            <p className="mt-1 text-xs text-slate-600">Your data is safe</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}

Register.layout = (page) => <PublicLayout>{page}</PublicLayout>;

